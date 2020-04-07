'use strict';

const express = require('express');
var db = require('../../../lib/db');
const visibleRows = require('../../../lib/config').config.visibleRows;
var rowsLimit = require('../../../lib/config').config.rowsLimit;
var moment = require('moment');
var utils = require('../../../lib/utils');
var order = require('../../../lib/order_service');
const queryOrder = require('../../../queries/orders').getOrder;
var common = require('../../common/typeheads');

var Filters = function() {
  this.conditions = {
    period: {
      start: '',
      end: ''
    },
    city: { id: 0, name: '' },
    street: { id: 0, name: '', cityId: 0},
    house: { id: 0, number: '', streetId: 0},
    porch: { number: 0, houseId: 0},
    number: {
      order: 0,
      prolongedOrder: 0
    },
    onlyMaintenanceService: false
  };
  this.whereSQL = '';
  this.orderBy = '';
};

var filterBuilder = function (req) {

  var obj = {};
  var filters = new Filters();
  var cloneFilters = new Filters();
  var where = '';

  var startDate = moment().startOf('month').toDate();
  var endDate = moment().endOf('month').toDate();

  if (! ('filtersOrders' in req.session)) {
    req.session.filtersOrders = filters;
  }
  cloneFilters = req.session.filtersOrders;

  if (cloneFilters.conditions.period.start === '') {
    cloneFilters.conditions.period.start = moment(startDate).format('YYYY-MM-DD HH:mm');
  }
  if (cloneFilters.conditions.period.end === '') {
    cloneFilters.conditions.period.end = moment(endDate).format('YYYY-MM-DD HH:mm');
  }

  try {
    if (req.query) {
      if ('filters' in req.query) {
        obj = JSON.parse(req.query.filters);

        if (+obj.city.id > 0) {
          where += ' AND (a.city_id = ' + obj.city.id + ')';
        }
        cloneFilters.conditions.city = {
          id: obj.city.id,
          name: obj.city.name
        };

        if (+obj.street.id > 0) {
          where += ' AND (a.street_id = ' + obj.street.id + ')';
        }
        cloneFilters.conditions.street = {
          id: obj.street.id,
          name: obj.street.name,
          cityId: obj.street.cityId
        };

        if (+obj.house.id > 0) {
          where += ' AND (a.house_id = ' + obj.house.id + ')';
        }
        cloneFilters.conditions.house = {
          id: obj.house.id,
          number: obj.house.number,
          streetId: obj.house.streetId
        };

        if (+obj.porch.number > 0) { // + add "No data"
          where += ' AND (a.porch = ' + obj.porch.number + ')';
          cloneFilters.conditions.porch = {
            number: obj.porch.number
          };
        }

        if (+obj.number.order > 0) {
          where += ' AND (a.contract_number = ' + obj.number.order + ')';
        }
        cloneFilters.conditions.number.order = obj.number.order;

        if (+obj.number.prolongedOrder > 0) {
          where += ' AND (a.m_contract_number = ' + obj.number.prolongedOrder + ')';
        }
        cloneFilters.conditions.number.prolongedOrder = obj.number.prolongedOrder;

        if ('onlyMaintenanceService' in obj) {
          cloneFilters.conditions.onlyMaintenanceService = obj.onlyMaintenanceService;
        }

        var _start = obj.period.start; // YYYY-MM-DD HH:mm
        if (typeof _start  === 'string') {
          if (_start.length > 0) {
            cloneFilters.conditions.period.start = _start;
          }
          else {
            cloneFilters.conditions.period.start = moment(startDate).format('YYYY-MM-DD HH:mm');
          }
        }

        var _end = obj.period.end; // YYYY-MM-DD HH:mm
        if (typeof _end  === 'string') {
          if (_end.length > 0) {
            cloneFilters.conditions.period.end = _end;
          }
          else {
            cloneFilters.conditions.period.end = endDate;
          }
        }
      }
    }

    // Final
    if (cloneFilters.conditions.onlyMaintenanceService) {
      where += ' AND (maintenance_contract >= 1)';
      where += ' AND (a.end_service >= ' + '"' + cloneFilters.conditions.period.start + '")';
      where += ' AND (a.end_service <= ' + '"' + cloneFilters.conditions.period.end + '")';

      cloneFilters.orderBy = ' ORDER BY a.end_service DESC, a.contract_number DESC';
    }
    else {
      where += ' AND (a.create_date >= ' + '"' + cloneFilters.conditions.period.start + '")';
      where += ' AND (a.create_date <= ' + '"' + cloneFilters.conditions.period.end + '")';

      cloneFilters.orderBy = ' ORDER BY a.create_date DESC, a.contract_number DESC';
    }

    cloneFilters.whereSQL = where;
    req.session.filtersOrders = cloneFilters;
    // req.session.filtersOrders = cloneFilters.conditions;

  }
  catch (err) {
    throw (err);
  }
  return cloneFilters;
  // return req.session.filtersOrders;
};

var filterRecords = function (req, res) {

  var add = filterBuilder(req);

  var pageCount = 0;
  var countRecords = 0;

  var countRecordsQuery =
    ' SELECT COUNT(*) AS count' +
    ' FROM cards a WHERE (a.card_id > 0)' +
    ' AND (a.is_deleted = 0)' + add.whereSQL;

  var fullQuery = ' SELECT' +
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
    ' WHERE (a.card_id > 0) AND (a.is_deleted = 0)' +
      add.whereSQL +
      add.orderBy +
    ' LIMIT ' + visibleRows;

  db.get().getConnection(function (err, connection) {
    connection.query(
      countRecordsQuery, [], function (err, rows) {
        connection.release();
        countRecords = rows[0].count;
        pageCount =
          (rows[0].count / visibleRows) < 1 ? 0 : Math.ceil(rows[0].count / visibleRows);

        db.get().getConnection(function (err, connection) {
          connection.query(
            fullQuery, [], function (err, rows) {
              if (err) {
                throw err;
              }
              connection.release();

              if (err) {
                console.error(err);
                res.status(500).send(db.showDatabaseError(500, err));
              } else {
                var currentPage = 1;
                res.render('docs/orders.ejs', {
                  title: 'Договора',
                  data: rows,
                  pageCount: pageCount,
                  currentPage: currentPage,
                  visibleRows: visibleRows,
                  countRecords: countRecords,
                  moment: moment,
                  utils: utils,
                  user: req.session.userName,
                  filters: add.conditions
                });
              }
            });
        });
      });
  });

};

module.exports = function () {
  var router = express.Router();

  router.get('/', function (req, res) {
    filterRecords(req, res);
  });

  router.get('/edit/:id', function (req, res) {
    var id = req.params.id;

    res.render('docs/forms/order.ejs', {
      title: 'Договор',
      user: req.session.userName
    });

  });

  // router.get('/edit/:id', function (req, res) {
  //   var id = req.params.id;
  //   var contractClientData = null;
  //   var serviceClientData = null;
  //   var apartments;

  //   order.getClientContractData(id, function (contractData) {
  //     contractClientData = order.decodeClientData(contractData);

  //     order.getClientServiceData(id, function (serviceData) {
  //       serviceClientData = order.decodeClientData(serviceData);

  //       order.getApartmentsFromContract(id, function (apartmentsList) {
  //         apartments = apartmentsList;

  //         db.get().getConnection(function (err, connection) {
  //           connection.query(
  //               queryOrder, [id], function (err, rows) {

  //               connection.release();

  //               if (err) {
  //                 console.error(err);
  //                 res.status(500).send(db.showDatabaseError(500, err));
  //               } else {

  //                 var data = rows[0];
  //                 data.address = '';
  //                 if (rows[0].cityId > 0) {
  //                   data.address = rows[0].cityName.trim();
  //                   if (rows[0].streetId > 0) {
  //                     data.address += ', ' + rows[0].streetName;
  //                     if (rows[0].houseId > 0) {
  //                       data.address += ', ' + rows[0].houseNumber;
  //                     }
  //                   }
  //                 }

  //                 // res.render('docs/forms/order.ejs', {
  //                 res.render('docs/forms/order.ejs', {
  //                   title: 'Договор',
  //                   data: data,
  //                   moment: moment,
  //                   utils: utils,
  //                   errors: {},

  //                   contractPassportData: contractClientData.passport,
  //                   contractRegisteredAddress: contractClientData.registeredAddress,
  //                   contractActualAddress: contractClientData.actualAddress,
  //                   contractPhones: contractData.phones,

  //                   servicePassportData: serviceClientData.passport,
  //                   serviceRegisteredAddress: serviceClientData.registeredAddress,
  //                   serviceActualAddress: serviceClientData.actualAddress,
  //                   servicePhones: serviceData.phones,

  //                   apartments: apartments,
  //                   user: req.session.userName
  //                 });
  //               }
  //             });
  //         });
  //       });
  //     });
  //   });
  // });

  router.get('/add', function (req, res) {
    res.render('refs/forms/order.ejs', {
      'title': 'Договор',
      user: req.session.userName
    });
  });

  router.get('/table', function (req, res) {
    var id = req.query.id;
    res.status(200).send({ 'table': id });
  });

  router.get('/filter', function (req, res)  {
    filterRecords(req, res);
  });

  router.get('/:offset', function (req, res) {
    var offset = +req.params.offset;
    var pageCount = 0;
    var countRecords = 0;

    var add = filterBuilder(req);

    var countRecordsQuery =
    ' SELECT COUNT(*) AS count' +
    ' FROM cards a WHERE (a.card_id > 0)' +
    ' AND (a.is_deleted = 0)' + add.whereSQL;

    var fullQuery = ' SELECT' +
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
    ' WHERE (a.card_id > 0) AND (a.is_deleted = 0)' +
      add.whereSQL +
      add.orderBy +
    ' LIMIT ' + visibleRows +
    ' OFFSET ' + offset;

    db.get().getConnection(function (err, connection) {
      connection.query(
        countRecordsQuery, [], function (err, rows) {
          connection.release();
          countRecords = rows[0].count;
          pageCount =
            (rows[0].count / visibleRows) < 1 ? 0 : Math.ceil(rows[0].count / visibleRows);
          if ((offset > pageCount * visibleRows)) {
            offset = (pageCount - 1) * visibleRows;
          }

          db.get().getConnection(function (err, connection) {
            connection.query(
              fullQuery, [], function (err, rows) {
                connection.release();

                if (err) {
                  res.status(500).send(db.showDatabaseError(500, err));
                }
                else {
                  var currentPage = Math.ceil(offset / visibleRows) + 1;
                  res.render('docs/orders.ejs', {
                    title: 'Договора',
                    data: rows,
                    pageCount: pageCount,
                    currentPage: currentPage,
                    visibleRows: visibleRows,
                    countRecords: countRecords,
                    moment: moment,
                    utils: utils,
                    user: req.session.userName,
                    filters: add.conditions
                  });
                }
              });
          });
        });
    });
  });

  router.get('/load_order/:id', function (req, res) {
    var id = Number(req.params.id);
    if (typeof id === 'number') {

      var contractClientData = null;
      var serviceClientData = null;
      var apartments = [];

        order.getClientContractData(id, function (contractData) {
        contractClientData = order.decodeClientData(contractData);

        order.getClientServiceData(id, function (serviceData) {
          serviceClientData = order.decodeClientData(serviceData);

          order.getApartmentsFromContract(id, function (apartmentsList) {
            apartments = apartmentsList;

            db.get().getConnection(function (err, connection) {
              connection.query(
                  queryOrder, [id], function (err, rows) {

                  connection.release();

                  if (err) {
                    console.error(err);
                    res.status(500).send(db.showDatabaseError(500, err));
                  }
                  else {
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

                    data.contractClientData = contractClientData;
                    data.serviceClientData = serviceClientData;
                    data.apartments = apartments;

                    res.status(200).send({ order: data });
                  }
                });
            });
          });
        });
      });
    }
    else {
      res.status(400);
    }
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
      queryText += ' LIMIT ' + ('limit' in data ? data.limit : rowsLimit);

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
              // res.status(200).json(rows);
            }
          }
        );
      });
    }
    else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
});

router.post('/find_city', function (req, res) {
  var data = req.body;
  if ((data) && (typeof(data) === 'object') && ('cityName' in data)) {
    var rowsCount = 'limit' in data ? data.limit : rowsLimit;
    var params = {
      cityName: data.cityName,
      rowsCount: rowsCount
    };
    common.filterCities(params, function (err, rows) {
      res.status(200).send(rows);
    });
  }
  else {
    res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
  }
});

router.post('/find_street', function (req, res) {
  var data = req.body;
  if ((data) && (typeof(data) === 'object') && ('streetName' in data) && ('cityId' in data)) {
    var rowsCount = 'limit' in data ? data.limit : rowsLimit;
    var params = {
      cityId: data.cityId,
      streetName: data.streetName,
      rowsCount: rowsCount
    };
    common.filterStreets(params, function (err, rows) {
      res.status(200).send(rows);
    });
  }
  else {
    res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
  }
});

router.post('/find_house', function (req, res) {
  var data = req.body;
  if ((data) && (typeof(data) === 'object') && ('houseNumber' in data) && ('streetId' in data)) {
    var rowsCount = 'limit' in data ? data.limit : rowsLimit;
    var params = {
      streetId: data.streetId,
      houseNumber: data.houseNumber,
      rowsCount: rowsCount
    };
    common.filterHouses(params, function (err, rows) {
      res.status(200).send(rows);
    });
  }
  else {
    res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
  }
});

router.post('/find_porch', function (req, res) {
  var data = req.body;
  if ((data) && (typeof(data) === 'object') && ('porch' in data) && ('houseId' in data)) {
    var rowsCount = 'limit' in data ? data.limit : rowsLimit;
    var params = {
      houseId: data.houseId,
      porch: data.porch,
      rowsCount: rowsCount
    };
    common.filterPorches(params, function (err, rows) {
      res.status(200).send(rows);
    });
  }
  else {
    res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
  }
});

router.post('/find_order', function (req, res) {
  var data = req.body;
  if ((data) && (typeof(data) === 'object') && ('orderNumber' in data)) {
    var orderNumber = data.orderNumber;
    var rowsCount = 'limit' in data ? data.limit : rowsLimit;
    common.filterOrders(orderNumber, rowsCount, function (err, rows) {
      res.status(200).send(rows);
    });
  }
  else {
    res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
  }
});

router.post('/find_prolonged_order', function (req, res) {
  var data = req.body;
  if ((data) && (typeof(data) === 'object') && ('orderNumber' in data)) {
    var orderNumber = data.orderNumber;
    var rowsCount = 'limit' in data ? data.limit : rowsLimit;
    common.filterProlongedOrders(orderNumber, rowsCount, function (err, rows) {
      res.status(200).send(rows);
    });
  }
  else {
    res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
  }
});

return router;
};