'use strict';

const express = require('express');
var moment = require('moment');

var db = require('../../../lib/db.js');
const visibleRows = require('../../../lib/config').config.visibleRows;
var RegistersLogic = require('../../../logic/docs/registers').RegistersLogic;

module.exports = function () {
  var router = express.Router();

  router.get('/', function (req, res) {
    var pageCount = 0;
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT COUNT(*) AS count' +
        ' FROM registers', [], function (err, rows) {
          connection.release();
          pageCount =
            (rows[0].count / visibleRows) < 1 ? 0 : Math.ceil(rows[0].count / visibleRows);

          db.get().getConnection(function (err, connection) {
            connection.query(
              ' SELECT a.register_id AS id,' +
              ' a.create_date,' +
              ' a.start_date,' +
              ' a.end_date,' +
              ' a.last_modify_date,' +
              ' (SELECT COUNT(*) FROM lists_registers b WHERE' +
              ' b.register_id = a.register_id) AS docs' +
              ' FROM registers a' +
              // ' WHERE' +
              // ' a.create_date BETWEEN :start_date AND :end_date
              ' ORDER BY' +
              ' a.create_date DESC,' +
              ' a.register_id DESC' +
              ' LIMIT ?', [visibleRows], function (err, rows) {
                if (err) {
                  throw err;
                }
                connection.release();

                if (err) {
                  console.error(err);
                  res.status(500).send({
                    'code': 500,
                    'msg': 'Database error'
                  });
                } else {
                  var currentPage = 1;
                  res.render('docs/registers.ejs', {
                    'title': 'Реестр',
                    'data': rows,
                    'pageCount': pageCount,
                    'currentPage': currentPage,
                    'visibleRows': visibleRows,
                    'moment': moment,
                    user: req.session.userName
                  });
                }
              });
          });
        });
    });
  });

  router.get('/add', function (req, res) {
    let registersLogic = new RegistersLogic(req, res);
    let data = registersLogic.addRegister();
    res.render('docs/forms/register.ejs', {
      title: 'Реестр',
      data: data,
      errors: [],
      moment: moment,
      user: req.session.userName
    });
  });

  router.get('/edit/:id', async function (req, res) {
    let registersLogic = new RegistersLogic(req, res);
    let data = await registersLogic.getRegister();
    res.render('docs/forms/register.ejs', {
      title: 'Реестр',
      data: data,
      errors: [],
      moment: moment,
      user: req.session.userName
    });
  });

  router.get('/upload/:id', function (req, res) {
    let registersLogic = new RegistersLogic(req, res);
    registersLogic.upload2(req.params.id);
  });

  router.get('/build', function (req, res) {
    let registersLogic = new RegistersLogic(req, res);
    registersLogic.build();
  });

  router.get('/:offset', function (req, res) {
    var offset = +req.params.offset;
    var pageCount = 0;
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT COUNT(*) AS count' +
        ' FROM registers', [], function (err, rows) {
          connection.release();
          pageCount =
            (rows[0].count / visibleRows) < 1 ? 0 : Math.ceil(rows[0].count / visibleRows);
          if ((offset > pageCount * visibleRows)) {
            offset = (pageCount - 1) * visibleRows;
          }

          db.get().getConnection(function (err, connection) {
            connection.query(
              ' SELECT a.register_id AS id,' +
              ' a.create_date,' +
              ' a.start_date,' +
              ' a.end_date,' +
              ' a.last_modify_date,' +
              ' (SELECT COUNT(*) FROM lists_registers b WHERE' +
              ' b.register_id = a.register_id) AS docs' +
              ' FROM registers a' +
              // ' WHERE' +
              // ' a.create_date BETWEEN :start_date AND :end_date
              ' ORDER BY' +
              ' a.create_date DESC,' +
              ' a.register_id DESC' +
              ' LIMIT ?' +
              ' OFFSET ?', [visibleRows, offset], function (err, rows) {
                if (err) {
                  throw err;
                }
                connection.release();

                if (err) {
                  console.error(err);
                  res.status(500).send({
                    'code': 500,
                    'msg': 'Database error'
                  });
                } else {
                  var currentPage = Math.ceil(offset / visibleRows) + 1;
                  res.render('docs/registers.ejs', {
                    title: 'Реестр',
                    data: rows,
                    pageCount: pageCount,
                    currentPage: currentPage,
                    visibleRows: visibleRows,
                    moment: moment,
                    user: req.session.userName
                  });
                }
              });
          });
        });
    });
  });

  router.post('/save', async function (req, res) {

    let registersLogic = new RegistersLogic(req, res);
    var data = registersLogic.validate();
    var errors = req.validationErrors();
    if (!errors) {
      await registersLogic.save(data);

      if ('saveAndClose' in req.body) {
        res.redirect('/registers');
      }
      if ('save' in req.body) {
        res.redirect('/registers/edit/' + data.id);
      }
    }
    else {
      res.render('docs/forms/register.ejs', {
        title: 'Реестр',
        data: data,
        errors: errors,
        moment: moment,
        user: req.session.userName
      });
    }

    // var id = parseInt(req.body.id);
    // var startDate = moment(req.body.startDate, 'DD.MM.YYYY').format('YYYY-MM-DD');
    // var endDate = moment(req.body.endDate, 'DD.MM.YYYY').format('YYYY-MM-DD');

    // if (id > 0) {
    //   await registersLogic.clearRegisterData(id);
    //   await registersLogic.updateRegister(id, startDate, endDate);
    //   await registersLogic.createRegisterData(id);
    // }
    // else {
    //   id = await registersLogic.createNewRegister();
    //   await registersLogic.createRegisterData(id);
    // }



    // if ((req.body.id) && (isFinite(+req.body.id))) {
    //   db.get().getConnection(function (err, connection) {
    //     connection.query(
    //       ' UPDATE equipments SET name = ?, guarantee_period = ?' +
    //       ' WHERE equipment_id = ?', [req.body.name, req.body.years, req.body.id], function (err) {
    //         connection.release();
    //         if (err) {
    //           res.status(500).send({ 'code': 500, 'msg': 'Database Error' });
    //         } else {
    //           res.redirect('/equipment');
    //         }
    //       }
    //     );
    //   });
    // }
    // else {
    //   db.get().getConnection(function (err, connection) {
    //     connection.query(
    //       ' INSERT INTO equipments (name, guarantee_period)' +
    //       ' VALUE(?, ?)', [req.body.name, req.body.years], function (err) {
    //         connection.release();
    //         if (err) {
    //           res.status(500).send({ 'code': 500, 'msg': 'Database Error' });
    //         } else {
    //           res.redirect('/equipment');
    //         }
    //       }
    //     );
    //   });
    // }
  });

  router.post('/delete', function (req, res) {
    if ((req.body.id) && (isFinite(+req.body.id))) {
      db.get().getConnection(function (err, connection) {
        connection.query(
          ' DELETE FROM registers WHERE register_id = ?', [+req.body.id], function (err) {
            connection.release();
            if (err) {
              res.status(500).send({
                code: 500,
                msg: 'Database Error',
                err: JSON.stringify(err)
              });
            } else {
              res.status(200).send({ result: 'OK' });
            }
          }
        );
      });
    }
    else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  router.post('/edit', function (req, res) {
    var data = req.body.data;
    // var page = data.page ? (data.page > 1 ? data.page : 1) : 1;

    // generateTable(data.id, +page, data.search, function(dataTable, pageContent, pagesCount) {
    generateTable(data, function (dataTable, pageContent, pagesCount) {
      res.status(200).send({
        result: 'OK',
        bodyTable: dataTable,
        pageContent: pageContent,
        pagesCount: pagesCount
      });
    });
  });

  router.post('/build_register', async function (req, res) {
    var data = req.body.name;
    var startFrom = moment(req.body.startFrom, 'DD.MM.YYYY').format('YYYY-MM-DD');
    var endTo = moment(req.body.endTo, 'DD.MM.YYYY').format('YYYY-MM-DD');

    let registersLogic = new RegistersLogic(req, res);
    var orders = await registersLogic.buildRegister(startFrom, endTo);
    var payments = await registersLogic.buildRegister2(startFrom, endTo);

    // Create content
    var contentContractsTable = [];
    if (Array.isArray(orders)) {
      orders.forEach(function (item) {
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
            </tr>`
          );
      });
    }

    var contentPaymentsTable = [];
    if (Array.isArray(payments)) {
      payments.forEach(function (item) {
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
            </tr>`
          );
      });
    }

    res.status(200).send({
      result: 'OK',
      orders: orders,
      payments: payments,
      contentContractsTable: contentContractsTable,
      contentPaymentsTable: contentPaymentsTable,
    })
  });

  return router;
};
