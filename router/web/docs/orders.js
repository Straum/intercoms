'use strict';

const express = require('express');
var db = require('../../../lib/db.js');
const visibleRows = require('../../../lib/config').config.visibleRows;
var moment = require('moment');
var utils = require('../../../lib/utils.js');
var order = require('../../../lib/order_service');
const getOrder = require('../../../queries/orders').getOrder;

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
                    'title': 'Договора',
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
                getOrder, [id], function (err, rows) {

                connection.release();

                if (err) {
                  console.error(err);
                  res.status(500).send(db.showDatabaseError(500, err));
                } else {

                  var data = rows[0];
                  data.address = '';
                  if (rows[0].cityId > 0) {
                    data.address = rows[0].cityName.trim();
                    if (rows[0].streetId > 0) {
                      data.address += ', ' + rows[0].streetName;
                      if (rows[0].houseId > 0) {
                        data.address += ', ' + rows[0].houseNumber;
                      }
                    }
                  }

                  res.render('docs/forms/order.ejs', {
                    title: 'Договор',
                    data: data,
                    moment: moment,
                    utils: utils,
                    errors: {},

                    contractPassportData: contractClientData.passport,
                    contractRegisteredAddress: contractClientData.registeredAddress,
                    contractActualAddress: contractClientData.actualAddress,
                    contractPhones: contractData.phones,

                    servicePassportData: serviceClientData.passport,
                    serviceRegisteredAddress: serviceClientData.registeredAddress,
                    serviceActualAddress: serviceClientData.actualAddress,
                    servicePhones: serviceData.phones,

                    apartments: apartments
                  });
                }
              });
          });
        });
      });
    });
  });


  router.get('/add', function (req, res) {
    res.render('refs/forms/order.ejs', {
      'title': 'Договор',
    });
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
                    'title': 'Договора',
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