'use strict';

const express = require('express');
var db = require('../../../lib/db.js');
const visibleRows = require('../../../lib/config').config.visibleRows;
var moment = require('moment');
var utils = require('../../../lib/uitils');

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
              ' a.create_date,' +
              ' a.apartment_id,' +
              ' a.pay_month,' +
              ' a.pay_year,' +
              ' a.amount,' +
              ' a.pay_date,' +
              ' a.mode,' +
              ' b.number,' +
              ' b.letter,' +
              ' b.privilege,' +
              ' c.contract_number,' +
              ' c.m_contract_number,' +
              ' d.name AS city_name,' +
              ' e.name AS street_name,' +
              ' f.number AS house_number,' +
              ' c.porch,' +
              ' g.name AS org_name' +
              ' FROM' +
              ' payments a' +
              ' LEFT JOIN apartments b ON b.apartment_id = a.apartment_id' +
              ' LEFT JOIN cards c ON c.card_id = b.card_id' +
              ' LEFT JOIN cities d ON d.city_id = c.city_id' +
              ' LEFT JOIN streets e ON e.street_id = c.street_id' +
              ' LEFT JOIN houses f ON f.house_id = c.house_id' +
              ' LEFT JOIN organizations g ON g.organization_id = a.mode' +
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
                    'data': rows,
                    'pageCount': pageCount,
                    'currentPage': currentPage,
                    'visibleRows': visibleRows,
                    'moment': moment,
                    'utils': utils
                  });
                }
              });
          });
        });
    });
  });

  router.get('/edit/:id', function (req, res) {
    var id = req.params.id;
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT a.payment_id AS id,' + 
        ' a.create_date,' +
        ' a.pay_month,' +
        ' a.pay_year,' +
        ' a.amount,' +
        ' a.pay_date,' +
        ' a.mode,' +
        ' b.number,' +
        ' b.letter,' +
        ' c.contract_number,' +
        ' c.m_contract_number,' +
        ' d.name AS city_name,' +
        ' e.name AS street_name,' +
        ' f.number AS house_number' +
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
            res.render('docs/forms/payments.ejs', {
              'data': rows[0],
              'moment': moment,
              'utils': utils
            });
          }
        });
    });
  });

  router.get('/add', function (req, res) {
    res.render('refs/forms/equipment.ejs');
  });

  router.get('/table', function (req, res) {
    var id = req.query.id;
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT' +
        ' b.card_id,' +
        ' b.m_prolongation,' +
        ' b.contract_number,' +
        ' b.m_contract_number,' +
        ` DATE_FORMAT(b.create_date, '%d.%m.%Y') AS create_date,` +
        ` DATE_FORMAT(b.start_service, '%d.%m.%Y') AS start_service,` +
        ` DATE_FORMAT(b.end_service, '%d.%m.%Y') AS end_service` +
        ' FROM' +
        ' lists_registers a' +
        ' LEFT JOIN cards b ON b.card_id=a.card_id' +
        ' WHERE' +
        ' a.register_id = ?' +
        ' ORDER BY' +
        ' a.list_register_id', [id], function (err, rows) {
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
            res.status(200).send({ 'table': rows });
          }
        });
    });
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
              ' a.payment_id,' +
              ' a.create_date,' +
              ' a.apartment_id,' +
              ' a.pay_month,' +
              ' a.pay_year,' +
              ' a.amount,' +
              ' a.pay_date,' +
              ' a.mode,' +
              ' b.number,' +
              ' b.letter,' +
              ' b.privilege,' +
              ' c.contract_number,' +
              ' c.m_contract_number,' +
              ' d.name AS city_name,' +
              ' e.name AS street_name,' +
              ' f.number AS house_number,' +
              ' c.porch,' +
              ' g.name AS org_name' +
              ' FROM' +
              ' payments a' +
              ' LEFT JOIN apartments b ON b.apartment_id = a.apartment_id' +
              ' LEFT JOIN cards c ON c.card_id = b.card_id' +
              ' LEFT JOIN cities d ON d.city_id = c.city_id' +
              ' LEFT JOIN streets e ON e.street_id = c.street_id' +
              ' LEFT JOIN houses f ON f.house_id = c.house_id' +
              ' LEFT JOIN organizations g ON g.organization_id = a.mode' +
              // ' WHERE'
              // ' a.pay_date BETWEEN :start_date AND :end_date' +
              ' ORDER BY' +
              ' a.pay_date DESC,' +
              ' a.payment_id DESC' +
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
                  res.render('docs/payments.ejs', {
                    'data': rows,
                    'pageCount': pageCount,
                    'currentPage': currentPage,
                    'visibleRows': visibleRows,
                    'moment': moment,
                    'utils': utils
                  });
                }
              });
          });
        });
    });
  });

  router.post('/save', function (req, res) {
    if ((req.body.id) && (isFinite(+req.body.id))) {
      db.get().getConnection(function (err, connection) {
        connection.query(
          ' UPDATE equipments SET name = ?, guarantee_period = ?' +
          ' WHERE equipment_id = ?', [req.body.name, req.body.years, req.body.id], function (err) {
            connection.release();
            if (err) {
              res.status(500).send({ 'code': 500, 'msg': 'Database Error' });
            } else {
              res.redirect('/equipment');
            }
          }
        );
      });
    }
    else {
      db.get().getConnection(function (err, connection) {
        connection.query(
          ' INSERT INTO equipments (name, guarantee_period)' +
          ' VALUE(?, ?)', [req.body.name, req.body.years], function (err) {
            connection.release();
            if (err) {
              res.status(500).send({ 'code': 500, 'msg': 'Database Error' });
            } else {
              res.redirect('/equipment');
            }
          }
        );
      });
    }
  });

  router.post('/delete', function (req, res) {
    if ((req.body.id) && (isFinite(+req.body.id))) {
      db.get().getConnection(function (err, connection) {
        connection.query(
          ' DELETE FROM equipments WHERE equipment_id = ?', [+req.body.id], function (err) {
            connection.release();
            if (err) {
              res.status(500).send({
                'code': 500,
                'msg': 'Database Error',
                'err': JSON.stringify(err)
              });
            } else {
              res.status(200).send({ 'result': 'OK' });
            }
          }
        );
      });
    }
    else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  return router;
};