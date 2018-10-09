'use strict';

const express = require('express');
var db = require('../../../lib/db.js');
const visibleRows = require('../../../lib/config').config.visibleRows;
var moment = require('moment');
var utils = require('../../../lib/utils.js');
var order = require('../../../lib/order_service');

module.exports = function () {
  var router = express.Router();

  router.get('/', function (req, res) {
    var pageCount = 0;
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT COUNT(*) AS count' +
        ' FROM cards', [], function (err, rows) {
          connection.release();
          pageCount =
            (rows[0].count / visibleRows) < 1 ? 0 : Math.ceil(rows[0].count / visibleRows);

          db.get().getConnection(function (err, connection) {
            connection.query(
              ' SELECT' +
              ' a.card_id AS id,' +
              ' a.contract_number,' +
              ' a.maintenance_contract,' +
              ' a.attention,' +
              ' a.create_date,' +
              ' a.credit_to,' +
              ' a.end_contract,' +
              ' a.repaid,' +
              ' b.name AS city_name,' +
              ' c.name AS street_name,' +
              ' d.number AS house_number,' +
              ' a.porch,' +
              ' a.numeration,' +
              ' e.name AS equipment_name,' +
              ' a.m_repaid,' +
              ' a.m_contract_number,' +
              ' a.end_service,' +
              ' a.m_prolongation,' +
              ' a.receipt_printing' +
              ' FROM' +
              ' cards a' +
              ' LEFT JOIN cities b ON a.city_id = b.city_id' +
              ' LEFT JOIN streets c ON a.street_id = c.street_id' +
              ' LEFT JOIN houses d ON a.house_id = d.house_id' +
              ' LEFT JOIN equipments e ON a.equipment_id = e.equipment_id' +
              ' ORDER BY' +
              ' a.create_date DESC,' +
              ' a.card_id DESC' +
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
                  res.render('docs/orders.ejs', {
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
    var contractClientData = null;
    var serviceClientData = null;
    var apartments;

    order.getClientContractData(id, function (contractData) {
      contractClientData = order.decodeClientData(contractData);

      order.getClientServiceData(id, function (serviceData) {
        serviceClientData = order.decodeClientData(serviceData);

        order.getApartmentsFromContract(id, function (apartmentsList) {
          apartments = apartmentsList;

          db.get().getConnection(function (err, connection) {
            connection.query(
              ' SELECT' +
              ' a.card_id,' +
              ' a.contract_number,' +
              ' a.maintenance_contract,' +
              ' a.attention,' +
              ' a.create_date,' +
              ' a.credit_to,' +
              ' a.end_contract,' +
              ' a.repaid,' +
              ' b.name AS city_name,' +
              ' c.name AS street_name,' +
              ' d.number AS house_number,' +
              ' a.porch,' +
              ' a.numeration,' +
              ' e.name AS equipment_name,' +

              ' a.client_id,' +
              ' f.name AS client_name,' +
              ' h.phones,' +

              ' a.m_repaid,' +
              ' a.m_contract_number,' +
              ' a.start_service,' +
              ' a.end_service,' +
              ' a.m_prolongation,' +
              ' a.m_payment,' +
              ' a.m_payment_type_id,' +
              ' a.m_start_apartment,' +
              ' a.m_end_apartment,' +
              ' a.normal_payment,' +
              ' a.privilege_payment,' +
              ' a.receipt_printing,' +

              ' a.m_client_id, ' +
              ' g.name AS m_client_name,' +
              ' i.phones AS m_phones,' +
              ' a.is_one_person,' +

              ' a.contract_info, ' +
              ' a.service_info' +
              ' FROM' +
              ' cards a' +
              ' LEFT JOIN cities b ON a.city_id = b.city_id' +
              ' LEFT JOIN streets c ON a.street_id = c.street_id' +
              ' LEFT JOIN houses d ON a.house_id = d.house_id' +
              ' LEFT JOIN equipments e ON a.equipment_id = e.equipment_id' +
              ' LEFT JOIN clients f ON a.client_id = f.client_id' +
              ' LEFT JOIN clients g ON a.m_client_id = g.client_id' +
              ' LEFT JOIN faces h ON a.client_id = h.client_id' +
              ' LEFT JOIN faces i ON a.m_client_id = i.client_id' +
              ' WHERE a.card_id = ?', [id], function (err, rows) {
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
                  res.render('docs/forms/orders.ejs', {
                    'data': rows[0],
                    'moment': moment,
                    'utils': utils,

                    'contractPassportData': contractClientData.passport,
                    'contractRegisteredAddress': contractClientData.registeredAddress,
                    'contractActualAddress': contractClientData.actualAddress,
                    'contractPhones': contractData.phones,

                    'servicePassportData': serviceClientData.passport,
                    'serviceRegisteredAddress': serviceClientData.registeredAddress,
                    'serviceActualAddress': serviceClientData.actualAddress,
                    'servicePhones': serviceData.phones,

                    'apartments': apartments
                  });
                }
              });
          });
        });
      });
    });
  });


  router.get('/add', function (req, res) {
    res.render('refs/forms/orders.ejs');
  });

  router.get('/table', function (req, res) {
    var id = req.query.id;
    res.status(200).send({ 'table': id });
  });

  router.get('/:offset', function (req, res) {
    var offset = +req.params.offset;
    var pageCount = 0;
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT COUNT(*) AS count' +
        ' FROM cards', [], function (err, rows) {
          connection.release();
          pageCount =
            (rows[0].count / visibleRows) < 1 ? 0 : Math.ceil(rows[0].count / visibleRows);
          if ((offset > pageCount * visibleRows)) {
            offset = (pageCount - 1) * visibleRows;
          }

          db.get().getConnection(function (err, connection) {
            connection.query(
              ' SELECT' +
              ' a.card_id AS id,' +
              ' a.contract_number,' +
              ' a.maintenance_contract,' +
              ' a.attention,' +
              ' a.create_date,' +
              ' a.credit_to,' +
              ' a.end_contract,' +
              ' a.repaid,' +
              ' b.name AS city_name,' +
              ' c.name AS street_name,' +
              ' d.number AS house_number,' +
              ' a.porch,' +
              ' a.numeration,' +
              ' e.name AS equipment_name,' +
              ' a.m_repaid,' +
              ' a.m_contract_number,' +
              ' a.end_service,' +
              ' a.m_prolongation,' +
              ' a.receipt_printing' +
              ' FROM' +
              ' cards a' +
              ' LEFT JOIN cities b ON a.city_id = b.city_id' +
              ' LEFT JOIN streets c ON a.street_id = c.street_id' +
              ' LEFT JOIN houses d ON a.house_id = d.house_id' +
              ' LEFT JOIN equipments e ON a.equipment_id = e.equipment_id' +
              ' ORDER BY' +
              ' a.create_date DESC,' +
              ' a.card_id DESC' +
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
                  res.render('docs/orders.ejs', {
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
    res.redirect('/orders');
  });

  router.post('/delete', function (req, res) {
    if ((req.body.id) && (isFinite(+req.body.id))) {
      db.get().getConnection(function (err, connection) {
        connection.query(
          ' DELETE FROM cards WHERE card_id = ?', [+req.body.id], function (err) {
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

  router.post('/search_equipment', function (req, res) {
    var data = req.body;
    var suggestion = '';
    if ((data) && (typeof(data) === 'object') && ('suggestion' in data)) {
      suggestion = data.suggestion.trim();

      var queryText = 
      ' SELECT a.equipment_id AS id, a.name AS value' +
      ' FROM equipments a';
      if (suggestion.length > 0) {
        queryText += ' WHERE a.name LIKE ' + `'` + suggestion + '%' + `'`;
      }
      queryText += ' ORDER BY a.name ASC';
      queryText += ' LIMIT ' + ('limit' in data ? data.limit : 15);

      db.get().getConnection(function (err, connection) {
        connection.query(
          queryText, [], function (err, rows) {
            connection.release();

            if (err) {
              res.status(500).send({
                'code': 500,
                'msg': 'Database Error',
                'err': JSON.stringify(err)
              });
            } else {
              res.status(200).send(rows);
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