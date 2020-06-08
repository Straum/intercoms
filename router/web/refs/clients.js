'use strict';

const express = require('express');
var db = require('../../../lib/db.js');
const visibleRows = require('../../../lib/config').config.visibleRows;
const rowsLimit = require('../../../lib/config').config.rowsLimit;
var common = require('../../common/typeheads');
var moment = require('moment');
var enumCertificates = require('../../../lib/utils').enumCertificates;
var ClientModel = require('../../models/client').ClientModel;
var utils = require('../../../lib/utils');

var Filters = function () {
  this.conditions = {
    client: { id: 0, name: '' }
  };
  this.whereSQL = '';
};

var filterBuilder = function (req) {

  var obj = {};
  var filters = new Filters();
  var cloneFilters = new Filters();
  var where = '';

  if (!('filtersClients' in req.session)) {
    req.session.filtersClients = filters;
  }
  cloneFilters = req.session.filtersClients;

  try {
    if (req.query) {
      if ('filters' in req.query) {
        obj = JSON.parse(req.query.filters);

        if (+obj.client.id > 0) {
          where += ' AND (a.client_id = ' + obj.client.id + ')';
        }
        cloneFilters.conditions.client = {
          id: obj.client.id,
          name: obj.client.name
        };

        cloneFilters.whereSQL = where;
      }
    }

    req.session.filtersClients = cloneFilters;

  }
  catch (err) {
    throw (err);
  }

  return cloneFilters;

};

var findRecords = function (req, res) {

  var countRecords = 0;
  var pageCount = 0;

  var add = filterBuilder(req);

  var countRecordsQuery =
    ' SELECT COUNT(*) AS count' +
    ' FROM clients a' +
    ' WHERE (a.client_id > 0)' +
    ' AND (a.is_deleted = 0)' + add.whereSQL;

  var fullQuery =
    ' SELECT a.client_id AS id, a.name' +
    ' FROM clients a' +
    ' WHERE (a.client_id > 0)' +
    ' AND (a.is_deleted = 0)' + add.whereSQL +
    ' ORDER BY a.name ASC' +
    ' LIMIT ' + visibleRows;

  db.get().getConnection(function (err, connection) {
    connection.query(countRecordsQuery, [], function (err, rows) {
      connection.release();
      countRecords = rows[0].count;
      pageCount = (rows[0].count / visibleRows) < 1 ? 0 : Math.ceil(rows[0].count / visibleRows);

      db.get().getConnection(function (err, connection) {
        connection.query(fullQuery, [], function (err, rows) {
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
            res.render('refs/clients.ejs', {
              title: 'Клиенты',
              data: rows,
              pageCount: pageCount,
              currentPage: currentPage,
              visibleRows: visibleRows,
              countRecords: countRecords,
              filters: add.conditions,
              user: req.session.userName
            });
          }
        });
      });
    });
  });
};

var getAddressInfo = function (clientId, residenceType) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT b.city_id AS cityId, b.name AS cityName,' +
        ' c.street_id AS streetId, c.name AS streetName,' +
        ' d.house_id AS houseId, d.number AS houseNumber,' +
        ' a.room_apartment AS apartment' +
        ' FROM residence_clients a' +
        ' LEFT JOIN cities b ON b.city_id = a.city_id' +
        ' LEFT JOIN streets c ON c.street_id = a.street_id' +
        ' LEFT JOIN houses d ON d.house_id = a.house_id' +
        ' WHERE (a.client_id = ?) AND (a.residence_type_id = ?)' +
        ' LIMIT 1', [clientId, residenceType], function (err, rows) {
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
};

var getClientInfo = function (clientId) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT a.client_id AS id, a.name AS lastName, b.series, b.number, b.phones, b.issue_date AS issued,' +
        ' b.issue AS department, b.doc_type_id AS certificateId' +
        ' FROM clients a' +
        ' LEFT JOIN faces b ON b.client_id = a.client_id' +
        ' LEFT JOIN docs_types c ON c.doc_type_id = b.doc_type_id' +
        ' WHERE a.client_id = ?', [clientId], function (err, rows) {
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
};

var updateClient = function (client) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' UPDATE clients SET name = ?' +
        ' WHERE client_id = ?', [client.lastName, client.id], function (err) {
          connection.release();
          if (err) {
            reject();
          } else {
            resolve();
          }
        });
    });
  });
};

var updateClientFace = function (client) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' UPDATE faces SET ' +
        ' doc_type_id = ?,' +
        ' series = ?,' +
        ' number = ?,' +
        ' issue_date = ?,' +
        ' issue = ?,' +
        ' phones = ?' +
        ' WHERE client_id = ?', [
            client.certificate.typeId,
            client.certificate.series,
            client.certificate.number,
            client.certificate.issued,
            client.certificate.department,
            client.certificate.phones,
            client.id], function (err) {
          connection.release();
          if (err) {
            reject();
          } else {
            resolve();
          }
        });
    });
  });
};

var updateClientRegisteredAddress = function (client) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' UPDATE residence_clients SET ' +
        ' city_id = ?,' +
        ' street_id = ?,' +
        ' house_id = ?,' +
        ' room_apartment = ?' +
        ' WHERE (client_id = ?)' +
        ' AND (residence_type_id = ?)', [
            client.registeredAddress.city.key,
            client.registeredAddress.street.key,
            client.registeredAddress.house.key,
            client.registeredAddress.apartment,
            client.id,
            0,
          ], function (err) {
              connection.release();
              if (err) {
                reject();
              } else {
                resolve();
              }
            }
      );
    });
  });
};

var updateClientActualAddress = function (client) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' UPDATE residence_clients SET ' +
        ' city_id = ?,' +
        ' street_id = ?,' +
        ' house_id = ?,' +
        ' room_apartment = ?' +
        ' WHERE (client_id = ?)' +
        ' AND (residence_type_id = ?)', [
            client.actualAddress.city.key,
            client.actualAddress.street.key,
            client.actualAddress.house.key,
            client.actualAddress.apartment,
            client.id,
            1,
          ], function (err) {
              connection.release();
              if (err) {
                reject();
              } else {
                resolve();
              }
            }
      );
    });
  });
};

var addClient = function (client) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' INSERT INTO clients (name)' +
        ' VALUES (?)', [client.lastName], function (err, rows) {
          connection.release();
          if (err) {
            reject();
          } else {
            resolve(rows.insertId);
          }
        });
    });
  });
};

var addClientFace = function (client) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' INSERT INTO faces (' +
        ' doc_type_id,' +
        ' series,' +
        ' number,' +
        ' issue_date,' +
        ' issue,' +
        ' phones,' +
        ' client_id)' +
        ' VALUES (?,?,?,?,?,?,?)',
          [
            client.certificate.typeId,
            client.certificate.series,
            client.certificate.number,
            client.certificate.issued,
            client.certificate.department,
            client.certificate.phones,
            client.id], function (err) {
          connection.release();
          if (err) {
            reject();
          } else {
            resolve();
          }
        });
    });
  });
};

var addClientRegisteredAddress = function (client) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' INSERT INTO residence_clients (' +
        ' city_id,' +
        ' street_id,' +
        ' house_id,' +
        ' room_apartment,' +
        ' client_id,' +
        ' residence_type_id)' +
        ' VALUES (?,?,?,?,?,?)', [
            client.registeredAddress.city.key,
            client.registeredAddress.street.key,
            client.registeredAddress.house.key,
            client.registeredAddress.apartment,
            client.id,
            0,
          ], function (err) {
              connection.release();
              if (err) {
                reject();
              } else {
                resolve();
              }
            }
      );
    });
  });
};

var addClientActualAddress = function (client) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' INSERT INTO residence_clients (' +
        ' city_id,' +
        ' street_id,' +
        ' house_id,' +
        ' room_apartment,' +
        ' client_id,' +
        ' residence_type_id)' +
        ' VALUES (?,?,?,?,?,?)', [
            client.actualAddress.city.key,
            client.actualAddress.street.key,
            client.actualAddress.house.key,
            client.actualAddress.apartment,
            client.id,
            1,
          ], function (err) {
              connection.release();
              if (err) {
                reject();
              } else {
                resolve();
              }
            }
      );
    });
  });
};

module.exports = function () {
  var router = express.Router();

  router.get('/', function (req, res) {
    findRecords(req, res);
  });

  router.get('/filter', function (req, res) {
    findRecords(req, res);
  });

  router.get('/edit/:id', function (req, res) {
    var id = req.params.id;
    var clientModel = new ClientModel();

    getAddressInfo(id, 0)
      .then(function (registered) {
        if ((Array.isArray(registered)) && (registered.length === 1)) {
          clientModel.registeredAddress.city.key = registered[0].cityId;
          clientModel.registeredAddress.city.value = registered[0].cityName;
          clientModel.registeredAddress.street.key = registered[0].streetId;
          clientModel.registeredAddress.street.value = registered[0].streetName;
          clientModel.registeredAddress.house.key = registered[0].houseId;
          clientModel.registeredAddress.house.value = registered[0].houseNumber;
          clientModel.registeredAddress.apartment = registered[0].apartment;
          // clientModel.registeredAddress.fullAddress = '123';
          if (registered[0].cityId > 0) {
            clientModel.registeredAddress.fullAddress = registered[0].cityName.trim();
            if (registered[0].streetId) {
              clientModel.registeredAddress.fullAddress += ', ' + registered[0].streetName.trim();
              if (registered[0].houseId > 0) {
                clientModel.registeredAddress.fullAddress += ', ' + registered[0].houseNumber.trim();
              }
            }
          }
        }

        return getAddressInfo(id, 1);
      })
      .then(function (actual) {
        if ((Array.isArray(actual)) && (actual.length === 1)) {
          clientModel.actualAddress.city.key = actual[0].cityId;
          clientModel.actualAddress.city.value = actual[0].cityName;
          clientModel.actualAddress.street.key = actual[0].streetId;
          clientModel.actualAddress.street.value = actual[0].streetName;
          clientModel.actualAddress.house.key = actual[0].houseId;
          clientModel.actualAddress.house.value = actual[0].houseNumber;
          clientModel.actualAddress.apartment = actual[0].apartment;
          // clientModel.actualAddress.fullAddress = '456';
          if (actual[0].cityId > 0) {
            clientModel.actualAddress.fullAddress = actual[0].cityName.trim();
            if (actual[0].streetId) {
              clientModel.actualAddress.fullAddress += ', ' + actual[0].streetName.trim();
              if (actual[0].houseId > 0) {
                clientModel.actualAddress.fullAddress += ', ' + actual[0].houseNumber.trim();
              }
            }
          }
        }

        return getClientInfo(id);
      })
      .then(function (client) {
        clientModel.id = id;
        if ((client) && (Array.isArray(client))) {
          clientModel.lastName = client[0].lastName;

          clientModel.certificate.typeId = client[0].certificateId;
          clientModel.certificate.series = client[0].series;
          clientModel.certificate.number = client[0].number;
          clientModel.certificate.issued = client[0].issued;
          clientModel.certificate.department = client[0].department;
          clientModel.certificate.phones = client[0].phones;
        }

        res.render('refs/forms/client.ejs', {
          title: 'Клиент',
          data: clientModel,
          certificates: enumCertificates,
          moment: moment,
          user: req.session.userName
        });
      })
      .catch(function (error) {
        console.log(error.message);
        res.status(500).send(error.message);
      });
  });

  router.get('/add', function (req, res) {

    var clientModel = new ClientModel();

    res.render('refs/forms/client.ejs', {
      title: 'Клиент',
      data: clientModel,
      certificates: enumCertificates,
      moment: moment,
      user: req.session.userName
    });
  });

  router.get('/:offset', function (req, res) {
    var offset = +req.params.offset;
    var countRecords = 0;
    var pageCount = 0;

    var add = filterBuilder(req);

    var countRecordsQuery =
      ' SELECT COUNT(*) AS count' +
      ' FROM clients a WHERE (a.client_id > 0)' +
      ' AND (a.is_deleted = 0)' + add.whereSQL;

    var fullQuery =
      ' SELECT a.client_id AS id, a.name' +
      ' FROM clients a' +
      ' WHERE (a.client_id > 0)' +
      ' AND (a.is_deleted = 0)' + add.whereSQL +
      ' ORDER BY a.name ASC' +
      ' LIMIT ' + visibleRows +
      ' OFFSET ' + offset;

    db.get().getConnection(function (err, connection) {
      connection.query(countRecordsQuery, [], function (err, rows) {
        connection.release();
        countRecords = rows[0].count;
        pageCount = (rows[0].count / visibleRows) < 1 ? 0 : Math.ceil(rows[0].count / visibleRows);
        if ((offset > pageCount * visibleRows)) {
          offset = (pageCount - 1) * visibleRows;
        }

        db.get().getConnection(function (err, connection) {
          connection.query(fullQuery, [], function (err, rows) {
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
              res.render('refs/clients.ejs', {
                title: 'Клиенты',
                data: rows,
                pageCount: pageCount,
                currentPage: currentPage,
                visibleRows: visibleRows,
                countRecords: countRecords,
                filters: add.conditions,
                user: req.session.userName
              });
            }
          });
        });
      });
    });
  });

  router.post('/save', function (req, res) {

    var client = new ClientModel();

    // table clients
    client.id = +req.body.id;
    client.lastName = req.body.lastName;

    // table faces
    var issuedDate = new utils.convertDateToMySQLDate(req.body.issued, false);
    client.certificate.typeId = +req.body.certificate;
    client.certificate.series = req.body.certificateSeries;
    client.certificate.number = req.body.certificateNumber;
    // FIXME: replace with momentjs
    client.certificate.issued = issuedDate.outputDate() === '' ? null : issuedDate.outputDate();
    client.certificate.department = req.body.department;
    client.certificate.phones = req.body.phones;

    // table residence_clients
    client.registeredAddress.apartment = req.body.registeredApartment;
    try {
      var regStorage = JSON.parse(req.body.regAddress);
      client.registeredAddress.city.key = regStorage.city.key;
      client.registeredAddress.street.key = regStorage.street.key;
      client.registeredAddress.house.key = regStorage.house.key;
    }
    catch (error) {
      console.log(error);
    }

    client.actualAddress.apartment = req.body.actualApartment;
    try {
      var actStorage = JSON.parse(req.body.actAddress);
      client.actualAddress.city.key = actStorage.city.key;
      client.actualAddress.street.key = actStorage.street.key;
      client.actualAddress.house.key = actStorage.house.key;
    }
    catch (error) {
      console.log(error);
    }

    if (client.id > 0) {
      updateClient(client)
      .then(function() {
        updateClientFace(client);
      })
      .then(function() {
        updateClientRegisteredAddress(client);
      })
      .then(function() {
        updateClientActualAddress(client);
        res.redirect('/clients');
      })
      .catch(function(error) {
        console.log(error);
      });
    }
    else {
      addClient(client)
      .then(function(newId) {
        client.id = newId;
        console.log('newId_1: ' + newId);
        console.log('newId_2: ' + client.id);
        addClientFace(client);
      })
      .then(function() {
        addClientRegisteredAddress(client);
      }).
      then(function() {
        addClientActualAddress(client);
        res.redirect('/clients');
      })
      .catch(function(error) {
        console.log(error);
      });
    }



    // if ((req.body.id > 0)) {
    //   db.get().getConnection(function (err, connection) {
    //     connection.query(
    //       ' UPDATE clients SET name = ?' +
    //       ' WHERE client_id = ?', [req.body.name, req.body.id], function (err) {
    //         connection.release();
    //         if (err) {
    //           res.status(500).send({ 'code': 500, 'msg': 'Database Error' });
    //         } else {
    //           res.redirect('/clients');
    //         }
    //       }
    //     );
    //   });
    // }
    // else {
    //   db.get().getConnection(function (err, connection) {
    //     connection.query(
    //       ' INSERT INTO clients (name)' +
    //       ' VALUE(?)', [req.body.name], function (err) {
    //         connection.release();
    //         if (err) {
    //           res.status(500).send({ 'code': 500, 'msg': 'Database Error' });
    //         } else {
    //           res.redirect('/clients');
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
          ' DELETE FROM clients WHERE client_id = ?', [+req.body.id], function (err) {
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
      res.status(500).send({ 'code': 500, 'msg': 'Incorrect parameter' });
    }
  });

  router.post('/find_client', function (req, res) {
    var data = req.body;
    if ((data) && (typeof (data) === 'object') && ('suggestion' in data)) {
      var rowsCount = 'limit' in data ? data.limit : rowsLimit;
      var params = {
        suggestion: data.suggestion,
        rowsCount: rowsCount
      };
      common.filterClients(params, function (err, rows) {
        res.status(200).send(rows);
      });
    }
    else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  router.post('/find_full_address', function (req, res) {
    var data = req.body;
    if ((data) && (typeof (data) === 'object') && ('suggestion' in data)) {
      var rowsCount = 'rowsCount' in data ? data.rowsCount : rowsLimit;
      var params = {
        suggestion: data.suggestion,
        rowsCount: rowsCount
      };
      common.outFullAddress(params, function (err, rows) {
        res.status(200).send(rows);
      });
    }
    else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  return router;
};