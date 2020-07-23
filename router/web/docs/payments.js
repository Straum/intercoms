'use strict';

const express = require('express');
var db = require('../../../lib/db.js');
const visibleRows = require('../../../lib/config').config.visibleRows;
var moment = require('moment');
var utils = require('../../../lib/utils.js');
const path = require('path');
const fs = require('fs');
var iconvlite = require('iconv-lite');
let MakePayments = require('../../../lib/make-payments').MakePayments;
var common = require('../../common/typeheads');
const { PaymentModel } = require('../../models/payment.js');

function validApartment(number, letter, orderNumber) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT a.apartment_id AS id' +
        ' FROM apartments a' +
        ' LEFT JOIN cards b ON b.card_id = a.card_id' +
        ' WHERE (a.number = ?) AND (a.letter = ?) AND (b.contract_number = ?)' +
        ' LIMIT 1', [number, letter, orderNumber],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          }
          else {
            resolve({isExists: rows.length > 0, id: rows.length > 0 ? rows[0].id : null});
          }
        });
    });
  });
}

function updatePayment(data) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' UPDATE payments' +
        ' SET create_date = ?,' +
        ' apartment_id = ?,' +
        ' pay_month = ?,' +
        ' pay_year = ?,' +
        ' amount = ?,' +
        ' pay_date = ?,' +
        ' `mode` = ?' +
        ' WHERE payment_id = ?', [
        data.createDate,
        data.apartment.id,
        data.payMonth,
        data.payYear,
        data.amount,
        data.payDate,
        data.mode,
        data.id
      ],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          }
          else {
            resolve(rows);
          }
        });
    });
  });
}

function savePayment(data) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' INSERT INTO payments (' +
        ' create_date, apartment_id, pay_month, pay_year, amount, pay_date, `mode`)' +
        ' VALUES (' +
        ' ?,?,?,?,?,?,?)', [
        data.createDate,
        data.apartment.id,
        data.payMonth,
        data.payYear,
        data.amount,
        data.payDate,
        data.mode
      ],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          }
          else {
            resolve(rows);
          }
        });
    });
  });
}

function savePaymentsHistory(data) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        'INSERT INTO payments_history (create_dt, comment) values (NOW(), ?)', [data],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          }
          else {
            resolve(rows);
          }
        });
    });
  });
}

module.exports = function () {
  var router = express.Router();

  router.get('/', function (req, res) {
    var pageCount = 0;
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT COUNT(*) AS count' +
        ' FROM payments', [], function (err, rows) {
          connection.release();
          pageCount =
            (rows[0].count / visibleRows) < 1 ? 0 : Math.ceil(rows[0].count / visibleRows);

          db.get().getConnection(function (err, connection) {
            connection.query(
              ' SELECT' +
              ' a.payment_id AS id,' +
              ' a.create_date AS createDate,' +
              ' a.amount,' +
              ' a.pay_date AS payDate,' +
              ' a.mode,' +
              ' b.number,' +
              ' b.letter,' +
              ' c.contract_number AS contractNumber,' +
              ' c.m_contract_number AS prolongedContractNumber,' +
              ' d.name AS cityName,' +
              ' e.name AS streetName,' +
              ' f.number AS houseNumber,' +
              ' c.porch' +
              ' FROM' +
              ' payments a' +
              ' LEFT JOIN apartments b ON b.apartment_id = a.apartment_id' +
              ' LEFT JOIN cards c ON c.card_id = b.card_id' +
              ' LEFT JOIN cities d ON d.city_id = c.city_id' +
              ' LEFT JOIN streets e ON e.street_id = c.street_id' +
              ' LEFT JOIN houses f ON f.house_id = c.house_id' +
              // ' WHERE'
              // ' a.pay_date BETWEEN :start_date AND :end_date' +
              ' ORDER BY' +
              ' a.pay_date DESC,' +
              ' a.payment_id DESC' +
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
                  res.render('docs/payments.ejs', {
                    title: 'Платежи',
                    data: rows,
                    pageCount: pageCount,
                    currentPage: currentPage,
                    visibleRows: visibleRows,
                    moment: moment,
                    utils: utils,
                    user: req.session.userName
                  });
                }
              });
          });
        });
    });
  });

  router.get('/edit/:id', function (req, res) {
    var paymentModel = new PaymentModel();
    var id = req.params.id;
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT a.payment_id AS id,' +
        ' a.create_date AS createDate,' +
        ' a.apartment_id AS apartmentId,' +
        ' a.pay_month AS payMonth,' +
        ' a.pay_year AS payYear,' +
        ' a.amount,' +
        ' a.pay_date AS payDate,' +
        ' a.mode,' +
        ' a.transaction,' +
        ' a.zip_code AS zipCode,' +
        ' a.file_name AS fileName,' +
        ' b.number,' +
        ' b.letter,' +
        ' c.card_id AS cardId,' +
        ' c.contract_number AS contractNumber,' +
        ' c.m_contract_number AS prolongedContractNumber,' +
        ' c.start_service AS startService,' +
        ' c.end_service AS endService,' +
        ' d.name AS cityName,' +
        ' e.name AS streetName,' +
        ' f.number AS houseNumber' +
        ' FROM payments a' +
        ' LEFT JOIN apartments b ON b.apartment_id = a.apartment_id' +
        ' LEFT JOIN cards c ON c.card_id = b.card_id' +
        ' LEFT JOIN cities d ON d.city_id = c.city_id' +
        ' LEFT JOIN streets e ON e.street_id = c.street_id' +
        ' LEFT JOIN houses f ON f.house_id = c.house_id' +
        ' WHERE a.payment_id = ?', [id], function (err, rows) {
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

            if (rows[0].length === 0) {
              // FIXME: not found
            }

            var data = rows[0];
            paymentModel.id = data.id;
            paymentModel.createDate = data.createDate;
            paymentModel.apartment.id = data.apartmentId;
            paymentModel.apartment.number = data.number;
            paymentModel.apartment.letter = data.letter;
            paymentModel.amount = data.amount;
            paymentModel.transaction = data.transaction;
            paymentModel.payDate = data.payDate;
            paymentModel.mode = data.mode;
            paymentModel.zipCode = data.zipCode;
            paymentModel.fileName = data.fileName;

            paymentModel.contract.id = data.cardId;
            paymentModel.contract.normal = data.contractNumber;
            paymentModel.contract.prolonged = data.prolongedContractNumber;
            paymentModel.contract.startService = data.startService;
            paymentModel.contract.endService = data.endService;
            paymentModel.fullAddress =
              data.cityName.trim() +
              (data.streetName.trim() != '' ? (', ' + data.streetName.trim()) : '') +
              (data.houseNumber.trim() != '' ? (', ' + data.houseNumber.trim()) : '');

            res.render('docs/forms/payment.ejs', {
              title: 'Платеж',
              data: paymentModel,
              errors: {},
              moment: moment,
              utils: utils,
              user: req.session.userName
            });
          }
        });
    });
  });

  router.get('/add', function (req, res) {
    var paymentModel = new PaymentModel();
    res.render('docs/forms/payment.ejs', {
      title: 'Платеж',
      data: paymentModel,
      errors: {},
      moment: moment,
      utils: utils,
      user: req.session.userName
    });
  });

  router.get('/table', function (req, res) {
    var id = req.query.id;
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT' +
        ' a.payment_id AS id,' +
        ` DATE_FORMAT(a.create_date, '%d.%m.%Y') AS createDate,` +
        ' a.pay_month,' +
        ' a.pay_year,' +
        ` DATE_FORMAT(a.pay_date, '%d.%m.%Y') AS pay_date,` +
        ' a.amount,' +
        ' a.mode,' +
        ' c.m_contract_number,' +
        ' d.name as org_name' +
        ' FROM payments a' +
        ' LEFT JOIN apartments b ON b.apartment_id = a.apartment_id' +
        ' LEFT JOIN cards c ON c.card_id = b.card_id' +
        ' LEFT JOIN organizations d ON d.organization_id = a.mode' +
        ' WHERE' +
        ' a.apartment_id = ?' +
        ' ORDER BY' +
        ' a.pay_date DESC', [id], function (err, rows) {
          if (err) {
            throw err;
          }
          connection.release();

          if (err) {
            console.error(err);
            res.status(500).send({
              code: 500,
              msg: 'Database error'
            });
          } else {
            res.status(200).send({ table: rows });
          }
        });
    });
  });

  router.get('/load', async function (req, res) {
    var destination = path.join(__dirname, '../../../public/in/');

    var makePayments = new MakePayments();
    await makePayments.start(destination, function (error, data) {
      savePaymentsHistory(data)
        .then(
          // res.status(200).send({ 'status': 'success' })
          res.redirect('/payments')
        )
        .catch(function (error) {
          res.status(500).send(error.message);
        });;

    })

  });

  router.get('/:offset', function (req, res) {
    var offset = +req.params.offset;
    var pageCount = 0;
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT COUNT(*) AS count' +
        ' FROM payments', [], function (err, rows) {
          connection.release();
          pageCount =
            (rows[0].count / visibleRows) < 1 ? 0 : Math.ceil(rows[0].count / visibleRows);
          if ((offset > pageCount * visibleRows)) {
            offset = (pageCount - 1) * visibleRows;
          }

          db.get().getConnection(function (err, connection) {
            connection.query(
              ' SELECT' +
              ' a.payment_id AS id,' +
              ' a.create_date AS createDate,' +
              ' a.amount,' +
              ' a.pay_date AS payDate,' +
              ' a.mode,' +
              ' b.number,' +
              ' b.letter,' +
              ' c.card_id AS cardId,' +
              ' c.contract_number AS contractNumber,' +
              ' c.m_contract_number AS prolongedContractNumber,' +
              ' d.name AS cityName,' +
              ' e.name AS streetName,' +
              ' f.number AS houseNumber,' +
              ' c.porch' +
              ' FROM' +
              ' payments a' +
              ' LEFT JOIN apartments b ON b.apartment_id = a.apartment_id' +
              ' LEFT JOIN cards c ON c.card_id = b.card_id' +
              ' LEFT JOIN cities d ON d.city_id = c.city_id' +
              ' LEFT JOIN streets e ON e.street_id = c.street_id' +
              ' LEFT JOIN houses f ON f.house_id = c.house_id' +
              // ' WHERE'
              // ' a.pay_date BETWEEN :start_date AND :end_date' +
              ' ORDER BY' +
              ' a.pay_date DESC,' +
              ' a.payment_id DESC' +
              ' LIMIT ?' +
              ' OFFSET ?', [visibleRows, offset], function (err, rows) {
                if (err) {
                  //   throw err;
                  // }
                  connection.release();

                  // if (err) {
                  console.error(err);
                  res.status(500).send({
                    code: 500,
                    msg: 'Database error'
                  });
                } else {
                  var currentPage = Math.ceil(offset / visibleRows) + 1;
                  res.render('docs/payments.ejs', {
                    title: 'Платежи',
                    data: rows,
                    pageCount: pageCount,
                    currentPage: currentPage,
                    visibleRows: visibleRows,
                    moment: moment,
                    utils: utils,
                    user: req.session.userName
                  });
                }
              });
          });
        });
    });
  });

  router.post('/save', async function (req, res) {
    var paymentModel = new PaymentModel();
    paymentModel.id = req.body.id;
    paymentModel.createDate = ((req.body.createDate != null) && (req.body.createDate.trim().length > 0)) ? moment(req.body.createDate, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;
    paymentModel.apartment.number = req.body.apartment;
    paymentModel.apartment.letter = req.body.letter;
    paymentModel.mode = req.body.paymentType;
    paymentModel.amount = isNaN(parseFloat(req.body.amount)) ? 0 : parseFloat(req.body.amount) ;
    paymentModel.payDate = ((req.body.dateOfPayment != null) && (req.body.dateOfPayment.trim().length > 0)) ? moment(req.body.dateOfPayment, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;

    paymentModel.contract.id = req.body.cardId;
    paymentModel.contract.normal = req.body.contract;
    paymentModel.contract.prolonged = req.body.extendedContract;
    paymentModel.contract.startService = ((req.body.startService != null) && (req.body.startService.trim().length > 0)) ? moment(req.body.startService, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;
    paymentModel.contract.endService = ((req.body.endService != null) && (req.body.endService.trim().length > 0)) ? moment(req.body.endService, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;

    req.assert('createDate', 'Дата создания не заполнена').notEmpty();
    req.assert('cardId', 'Договор с таким номером не существует').custom(function (data) {
      return Number(data) > 0;
    });

    req.assert('extendedContract', 'Договор ТО не заполнен').notEmpty();
    req.assert('apartment', 'Квартира не заполнена').notEmpty();

    await validApartment(paymentModel.apartment.number, paymentModel.apartment.letter, paymentModel.contract.normal)
      .then(function (result) {
        if (result.isExists) {
          paymentModel.apartment.id = result.id;
        }
        else {
          req.assert('apartment', 'Номер квартиры вне диапазона квартир договора').custom(function (data) {
            return result.isExists;
          });
        }
      })
      .catch(function (error) {
        console.log(error);
      })

    req.assert('amount', 'Сумма оплаты не заполнена').notEmpty();
    req.assert('amount', 'Сумма должна быть ненулевoй').custom(function (data) {
      var out = parseFloat(data);
      if (isNaN(out)) {
        out = 0;
      }
      return out > 0;
    });
    req.assert('dateOfPayment', 'Дата оплаты не заполнена').notEmpty();

    var errors = req.validationErrors();
    if (!errors) {

      paymentModel.payMonth = moment(paymentModel.payDate).month();
      paymentModel.payYear = moment(paymentModel.payDate).year();

      if (paymentModel.id != 0) {
        updatePayment(paymentModel)
          .then(function () {
            res.redirect('/payments');
          })
          .catch(function (error) {
            console.log(error);
          })
      }
      else {
        savePayment(paymentModel)
          .then(function () {
            res.redirect('/payments');
          })
          .catch(function (error) {
            console.log(error);
          })
      }
    }
    else {
      res.render('docs/forms/payment.ejs', {
        title: 'Платеж',
        data: paymentModel,
        errors: errors,
        moment: moment,
        utils: utils,
        user: req.session.userName
      });
    }

    // if ((req.body.id) && (isFinite(+req.body.id))) {
    //   db.get().getConnection(function (err, connection) {
    //     connection.query(
    //       ' UPDATE payments SET name = ?, guarantee_period = ?' +
    //       ' WHERE payment_id = ?', [req.body.name, req.body.years, req.body.id], function (err) {
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
    //       ' INSERT INTO payments (name, guarantee_period)' +
    //       ' VALUE(?, ?)', [req.body.name, req.body.years], function (err) {
    //         connection.release();
    //         if (err) {
    //           res.status(500).send({ code: 500, msg: 'Database Error' });
    //         } else {
    //           res.redirect('/payments');
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
          ' DELETE FROM payments WHERE payment_id = ?', [+req.body.id], function (err) {
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

  router.post('/find_prolonged_order', function (req, res) {
    var data = req.body;
    if ((data) && (typeof (data) === 'object') && ('suggestion' in data)) {
      var orderNumber = data.suggestion;
      var rowsCount = 'limit' in data ? data.limit : rowsLimit;
      common.filterProlongedOrders(orderNumber, rowsCount, function (err, rows) {
        res.status(200).send(rows);
      });
    } else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  return router;
};