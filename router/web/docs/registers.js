const express = require('express');
const moment = require('moment');

const db = require('../../../lib/db');
const { visibleRows } = require('../../../lib/config').config;
const { RegistersLogic } = require('../../../logic/docs/registers');

module.exports = () => {
  const router = express.Router();

  router.get('/', (req, res) => {
    let pageCount = 0;
    db.get().getConnection((err1, connection1) => {
      connection1.query(
        'SELECT COUNT(*) AS count FROM registers', [], (err2, rows2) => {
          connection1.release();

          pageCount = (rows2[0].count / visibleRows) < 1
            ? 0
            : Math.ceil(rows2[0].count / visibleRows);

          db.get().getConnection((err3, connection3) => {
            connection3.query(
              `SELECT a.register_id AS id,
              a.create_date,
              a.start_date,
              a.end_date,
              a.last_modify_date,
              (SELECT COUNT(*) FROM lists_registers b WHERE
              b.register_id = a.register_id) AS docs
              FROM registers a
              ORDER BY
              a.create_date DESC,
              a.register_id DESC
              LIMIT ?`, [visibleRows], (err4, rows4) => {
                if (err4) {
                  // eslint-disable-next-line no-console
                  console.error(err4);
                  res.status(500).send({
                    code: 500,
                    msg: 'Database error',
                  });
                  throw err4;
                }
                connection3.release();

                const currentPage = 1;
                res.render('docs/registers.ejs', {
                  title: 'Реестр',
                  data: rows4,
                  pageCount,
                  currentPage,
                  visibleRows,
                  moment,
                  user: req.session.userName,
                });
              },
            );
          });
        },
      );
    });
  });

  router.get('/add', (req, res) => {
    const registersLogic = new RegistersLogic(req, res);
    const data = registersLogic.addRegister();
    res.render('docs/forms/register.ejs', {
      title: 'Реестр',
      data,
      errors: [],
      moment,
      user: req.session.userName,
    });
  });

  router.get('/edit/:id', async (req, res) => {
    const registersLogic = new RegistersLogic(req, res);
    const data = await registersLogic.getRegister();
    res.render('docs/forms/register.ejs', {
      title: 'Реестр',
      data,
      errors: [],
      moment,
      user: req.session.userName,
    });
  });

  router.get('/upload/:id', (req, res) => {
    const registersLogic = new RegistersLogic(req, res);
    registersLogic.upload2(req.params.id);
  });

  router.get('/build', (req, res) => {
    const registersLogic = new RegistersLogic(req, res);
    registersLogic.build();
  });

  router.get('/:offset', (req, res) => {
    let offset = +req.params.offset;
    let pageCount = 0;
    db.get().getConnection((err1, connection1) => {
      connection1.query(
        'SELECT COUNT(*) AS count FROM registers', [], (err2, rows2) => {
          connection1.release();

          pageCount = (rows2[0].count / visibleRows) < 1
            ? 0
            : Math.ceil(rows2[0].count / visibleRows);

          if ((offset > pageCount * visibleRows)) {
            offset = (pageCount - 1) * visibleRows;
          }

          db.get().getConnection((err3, connection3) => {
            connection3.query(
              `SELECT a.register_id AS id,
              a.create_date,
              a.start_date,
              a.end_date,
              a.last_modify_date,
              (SELECT COUNT(*) FROM lists_registers b WHERE
              b.register_id = a.register_id) AS docs
              FROM registers a
              ORDER BY
              a.create_date DESC,
              a.register_id DESC
              LIMIT ?
              OFFSET ?`, [visibleRows, offset], (err4, rows4) => {
                if (err4) {
                  // eslint-disable-next-line no-console
                  console.error(err4);
                  res.status(500).send({
                    code: 500,
                    msg: 'Database error',
                  });
                  throw err4;
                }
                connection3.release();

                const currentPage = Math.ceil(offset / visibleRows) + 1;
                res.render('docs/registers.ejs', {
                  title: 'Реестр',
                  data: rows4,
                  pageCount,
                  currentPage,
                  visibleRows,
                  moment,
                  user: req.session.userName,
                });
              },
            );
          });
        },
      );
    });
  });

  router.post('/save', async (req, res) => {
    const registersLogic = new RegistersLogic(req, res);
    const data = registersLogic.validate();
    const errors = req.validationErrors();
    if (!errors) {
      await registersLogic.save(data);

      if ('saveAndClose' in req.body) {
        res.redirect('/registers');
      }
      if ('save' in req.body) {
        res.redirect(`/registers/edit/${data.id}`);
      }
    } else {
      res.render('docs/forms/register.ejs', {
        title: 'Реестр',
        data,
        errors,
        moment,
        user: req.session.userName,
      });
    }
  });

  router.post('/delete', (req, res) => {
    if ((req.body.id) && (Number.isFinite(+req.body.id))) {
      db.get().getConnection((err, connection) => {
        connection.query(
          ' DELETE FROM registers WHERE register_id = ?', [+req.body.id], (err1) => {
            connection.release();
            if (err1) {
              res.status(500).send({
                code: 500,
                msg: 'Database Error',
                err: JSON.stringify(err1),
              });
            } else {
              res.status(200).send({ result: 'OK' });
            }
          },
        );
      });
    } else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  // router.post('/edit', (req, res) => {
  //   const { data } = req.body;

  //   generateTable(data, (dataTable, pageContent, pagesCount) => {
  //     res.status(200).send({
  //       result: 'OK',
  //       bodyTable: dataTable,
  //       pageContent,
  //       pagesCount,
  //     });
  //   });
  // });

  router.post('/build_register', async (req, res) => {
    // const data = req.body.name;
    const startFrom = moment(req.body.startFrom, 'DD.MM.YYYY').format('YYYY-MM-DD');
    const endTo = moment(req.body.endTo, 'DD.MM.YYYY').format('YYYY-MM-DD');

    const registersLogic = new RegistersLogic(req, res);
    const orders = await registersLogic.buildRegister(startFrom, endTo);
    const payments = await registersLogic.buildRegister2(startFrom, endTo);

    // Create content
    const contentContractsTable = [];
    if (Array.isArray(orders)) {
      orders.forEach((item) => {
        contentContractsTable.push(
          `<tr>
            <td class="text-center align-middle">
              ${moment(item.createDate).format('DD.MM.YYYY')}
            </td>
            <td class="text-center align-middle">
              ${item.contractNumber}
            </td>
            <td class="text-center align-middle">
              ${item.prolongedContractNumber}
            </td>
            <td class="text-center align-middle">
              ${moment(item.startService).format('DD.MM.YYYY')}
            </td>
            <td class="text-center align-middle">
              ${moment(item.endService).format('DD.MM.YYYY')}
            </td>
          </tr>`,
        );
      });
    }

    const contentPaymentsTable = [];
    if (Array.isArray(payments)) {
      payments.forEach((item) => {
        contentPaymentsTable.push(
          `<tr>
            <td class="text-center align-middle">
              ${item.payDate}
            </td>
            <td class="text-center align-middle">
            ${item.prolongedContractNumber}
            </td>
            <td class="text-left align-middle">
              ${item.address}
            </td>
            <td class="text-center align-middle">
              ${item.apartment}
            </td>
            <td class="text-center align-middle">
            ${item.amount.toFixed(2)}
            </td>
          </tr>`,
        );
      });
    }

    res.status(200).send({
      result: 'OK',
      orders,
      payments,
      contentContractsTable,
      contentPaymentsTable,
    });
  });

  router.post('/build2', (req, res) => {
    const registersLogic = new RegistersLogic(req, res);
    registersLogic.build();
    // res.status(200).send();
  });

  return router;
};
