'use strict';

const express = require('express');
var db = require('../../../lib/db.js');
const visibleRows = require('../../../lib/config').config.visibleRows;
const rowsLimit = require('../../../lib/config.js').config.rowsLimit;
var moment = require('moment');
var utils = require('../../../lib/utils');
const MAX_LENGTH = 60;

// function getShortDescription(id) {
//   return new Promise(function (resolve, reject) {
//     db.get().getConnection(function (err, connection) {
//       connection.query(
//         ' SELECT b.name AS faultName FROM faults a' +
//         ' LEFT JOIN templates b ON b.template_id = a.template_id' +
//         ' WHERE a.application_id = ?', [id], function (err, rows) {
//           connection.release();

//           if (err) {
//             return reject(err);
//           }

//           var description = '';
//           for (var ind = 0; ind < rows.length; ind++) {
//             description += rows[ind].faultName + (ind < rows.length - 1 ? ', ' : '');
//           }
//           // console.log(description);

//           resolve(description);
//         }
//       );
//     });
//   });
// }

var getCity = function (cityName, callback) {
  db.get().getConnection(function (err, connection) {
    connection.query(
      ' SELECT a.city_id AS id' +
      ' FROM cities a' +
      ' WHERE a.name = ?' +
      ' LIMIT 1', [cityName], function (err, rows) {
        connection.release();

        if (typeof callback === 'function') {
          callback(rows[0].id);
        }
      }
    );
  });
};

var getStreets = function (cityId, streetName, rowsLimit, callback) {
  var queryText = ' SELECT a.street_id, a.name AS street_name' +
    ' FROM streets a' +
    ' WHERE (a.city_id = ' + cityId + ')';

  if ((typeof streetName === 'string') && (streetName.trim() !== '')) {
    queryText += ' AND (a.name LIKE ' + `'` + streetName.trim() + '%' + `'` + ')';
  }

  queryText += ' LIMIT ' + rowsLimit;

  db.get().getConnection(function (err, connection) {
    connection.query(
      queryText, [], function (err, rows) {
        connection.release();

        if (typeof callback === 'function') {
          callback(rows);
        }
      }
    );
  });
};

var getHouses = function (cityId, streetName, houseNumber, rowsLimit, callback) {
  getStreets(cityId, streetName, 1, function (street) {
    if ((Array.isArray(street)) && (street.length === 1)) {
      var streetId = street[0].street_id;

      var queryText = ' SELECT a.house_id, a.number AS house_number, a.street_id' +
        ' FROM houses a' +
        ' WHERE (a.street_id = ' + streetId + ')';

      if ((typeof houseNumber === 'string') && (houseNumber.trim().length > 0)) {
        queryText += ' AND (a.number LIKE ' + `'` + houseNumber.trim() + '%' + `'` + ')';
      }

      queryText += ' LIMIT ' + rowsLimit;

      db.get().getConnection(function (err, connection) {
        connection.query(
          queryText, [], function (err, rows) {
            connection.release();

            if (typeof callback === 'function') {
              callback(rows);
            }
          }
        );
      });
    }
  });
};

var saveTable = function (id, table, callback) {

  var s = 'INSERT INTO faults (application_id, template_id) VALUES';
  for (var ind = 0; ind < table.length; ind++) {
    s += ' (' + id + ', ' + table[ind].id + ')';
    if (ind < table.length - 1) {
      s += ',';
    }
  }

  db.get().getConnection(function (err, connection) {
    connection.query(s, [], function () {
      connection.release();

      if (typeof callback === 'function') {
        callback();
      }

    });
  });
};

module.exports = function () {
  var router = express.Router();

  router.get('/', function (req, res) {
    var pageCount = 0;
    var countRecords = 0;
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT COUNT(*) AS count' +
        ' FROM applications a WHERE (a.application_id > 0) AND' +
        ' a.is_done = 0', [], function (err, rows) {
          connection.release();
          countRecords = rows[0].count;
          pageCount =
            (countRecords / visibleRows) < 1 ? 0 : Math.ceil(countRecords / visibleRows);

          db.get().getConnection(function (err, connection) {
            connection.query(
              ' SELECT a.application_id AS documentId, a.create_date AS createDate,' +
              ' b.name AS cityName, c.name AS streetName,' +
              ' d.number AS houseNumber, a.porch, ' +
              ' (SELECT COUNT(*) FROM faults e WHERE e.application_id  = a.application_id) AS rowsInDoc' +
              ' FROM applications a' +
              ' LEFT JOIN cities b ON b.city_id = a.city_id' +
              ' LEFT JOIN streets c ON c.street_id = a.street_id' +
              ' LEFT JOIN houses d ON d.house_id = a.house_id' +
              ' WHERE (a.application_id > 0)' +
              ' AND a.is_done = 0' +
              ' ORDER BY a.create_date ASC' +
              ' LIMIT ?', [visibleRows], function (err, rows) {
                connection.release();
                
                if (err) {
                  res.status(500).send({
                    'code': 500,
                    'msg': 'Database error'
                  });
                } else {
                  var currentPage = 1;

                  var dataset = rows;
                  for (var ind = 0; ind < dataset.length; ind++) {
                    dataset[ind].problemDescription = '';
                  }

                  var parameters = '';
                  if (Array.isArray(rows) && (rows.length > 0)) {
                    for (ind = 0; ind < rows.length; ind++) {
                      parameters += rows[ind].documentId + (ind < rows.length - 1 ? ', ' : '');
                    }
                    parameters = '(' + parameters + ')';
                  }

                  db.get().getConnection(function (err, connection) {
                    var stringSQL = 
                    ' SELECT a.application_id AS documentId, b.name AS problemDescription FROM faults a' +
                    ' LEFT JOIN templates b ON b.template_id = a.template_id' +
                    ' WHERE a.application_id IN ';
                    if (parameters.trim().length === 0) {
                      parameters = '(-1)';
                    }
                    stringSQL += parameters;

                    connection.query(
                      stringSQL, [], function (err, rows) {
                      connection.release();

                      if (err) {
                        res.status(500).send({
                          'code': 500,
                          'msg': 'Database error'
                        });
                      }
                      else {
                        console.log(rows);
                        rows.forEach( function(item) {
                          for (var ind = 0; ind < dataset.length; ind++) {
                            if (dataset[ind].documentId === item.documentId) {
                              dataset[ind].problemDescription += (dataset[ind].problemDescription.trim().length > 0 ? ', ' : '') + item.problemDescription;
                              if (dataset[ind].problemDescription.length >= MAX_LENGTH) {
                                dataset[ind].problemDescription = utils.formatStringWithEllipses(dataset[ind].problemDescription, MAX_LENGTH);
                              }
                              break;
                            }
                          }
                        });
                        res.render('docs/applications.ejs', {
                          'data': dataset,
                          'pageCount': pageCount,
                          'currentPage': currentPage,
                          'visibleRows': visibleRows,
                          'countRecords': countRecords,
                          'moment': moment
                        });
                      }
                    });
                  });
                }
              });
          });
        });
    });
  });

  router.get('/edit/:id', function (req, res) {
    var id = req.params.id;
    var data = {};

    db.get().getConnection(function (err, connection) {
      // Load table
      connection.query(
        ' SELECT a.template_id AS id, b.name AS value' +
        ' FROM faults a' +
        ' LEFT JOIN templates b ON b.template_id = a.template_id' +
        ' WHERE a.application_id = ?', [id], function (err, rows) {
          connection.release();

          if (err) {
            console.error(err);
            res.status(500).send({
              'code': 500,
              'msg': 'Database error'
            });
          } else {

            if ((rows !== undefined) && (rows.length > 0)) {
              data.faults = JSON.stringify(rows);
            }
            else {
              data.faults = JSON.stringify([]);
            }
            // Load Main form
            db.get().getConnection(function (err, connection) {
              connection.query(
                ' SELECT a.application_id AS documentId, a.is_done AS isDone, a.create_date AS createDate,' +
                ' b.name AS cityName, c.name AS streetName,' +
                ' d.number AS houseNumber, a.porch, a.phone,' +
                ' e.name AS performer,' +
                ' b.city_id AS cityId, c.street_id AS streetId, d.house_id AS houseId,' +
                ' e.worker_id AS performerId,' +
                ' a.is_done AS isDone, a.close_date AS closeDate' +
                ' FROM applications a' +
                ' LEFT JOIN cities b ON b.city_id = a.city_id' +
                ' LEFT JOIN streets c ON c.street_id = a.street_id' +
                ' LEFT JOIN houses d ON d.house_id = a.house_id' +
                ' LEFT JOIN workers e ON e.worker_id = a.worker_id' +
                ' WHERE (a.application_id = ?)', [id], function (err, rows) {
                  connection.release();

                  if (err) {
                    console.error(err);
                    res.status(500).send({
                      'code': 500,
                      'msg': 'Database error'
                    });
                  } else {

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

                    data.documentId = rows[0].documentId;
                    data.cityId = rows[0].cityId;
                    data.streetId = rows[0].streetId;
                    data.houseId = rows[0].houseId;
                    data.performerId = rows[0].performerId;

                    data.createDate = rows[0].createDate;
                    data.porch = rows[0].porch;
                    data.phone = rows[0].phone;
                    data.performer = rows[0].performer;
                    data.isDone = rows[0].isDone;
                    data.closeDate = rows[0].closeDate;

                    res.render('docs/forms/application.ejs', {
                      'data': data,
                      'moment': moment,
                      'errors': {}
                    });
                  }
                }
              );
            });
          }
        });
    });
  });

  router.get('/edit_done', function (req, res) {
    res.render('docs/forms/done_application.ejs');
  });

  router.get('/add', function (req, res) {
    res.render(
      'docs/forms/application.ejs',
      {
        'data': {
          'faults': JSON.stringify([])
        },
        'moment': moment,
        'errors': {}
      }
    );
  });

  router.get('/completed', function (req, res) {
    var pageCount = 0;
    var countRecords = 0;
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT COUNT(*) AS count' +
        ' FROM applications a WHERE (a.application_id > 0) AND' +
        ' a.is_done = 1', [], function (err, rows) {
          connection.release();
          countRecords = rows[0].count;
          pageCount =
            (countRecords / visibleRows) < 1 ? 0 : Math.ceil(countRecords / visibleRows);

          db.get().getConnection(function (err, connection) {
            connection.query(
              ' SELECT a.application_id AS documentId, a.create_date AS createDate,' +
              ' b.name AS cityName, c.name AS streetName,' +
              ' d.number AS houseNumber, a.porch, ' +
              ' (SELECT COUNT(*) FROM faults e WHERE e.application_id  = a.application_id) AS rowsInDoc' +
              ' FROM applications a' +
              ' LEFT JOIN cities b ON b.city_id = a.city_id' +
              ' LEFT JOIN streets c ON c.street_id = a.street_id' +
              ' LEFT JOIN houses d ON d.house_id = a.house_id' +
              ' WHERE (a.application_id > 0)' +
              ' AND a.is_done = 1' +
              ' ORDER BY a.create_date ASC' +
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

                  var dataset = rows;
                  for (var ind = 0; ind < dataset.length; ind++) {
                    dataset[ind].problemDescription = '';
                  }

                  var parameters = '';
                  if (Array.isArray(rows) && (rows.length > 0)) {
                    for (ind = 0; ind < rows.length; ind++) {
                      parameters += rows[ind].documentId + (ind < rows.length - 1 ? ', ' : '');
                    }
                    parameters = '(' + parameters + ')';
                  }

                  db.get().getConnection(function (err, connection) {
                    var stringSQL = 
                    ' SELECT a.application_id AS documentId, b.name AS problemDescription FROM faults a' +
                    ' LEFT JOIN templates b ON b.template_id = a.template_id' +
                    ' WHERE a.application_id IN ';
                    if (parameters.trim().length === 0) {
                      parameters = '(-1)';
                    }
                    stringSQL += parameters;

                    connection.query(
                      stringSQL, [], function (err, rows) {
                      connection.release();

                      if (err) {
                        res.status(500).send({
                          'code': 500,
                          'msg': 'Database error'
                        });
                      }
                      else {
                        console.log(rows);
                        rows.forEach( function(item) {
                          for (var ind = 0; ind < dataset.length; ind++) {
                            if (dataset[ind].documentId === item.documentId) {
                              dataset[ind].problemDescription += (dataset[ind].problemDescription.trim().length > 0 ? ', ' : '') + item.problemDescription;
                              if (dataset[ind].problemDescription.length >= MAX_LENGTH) {
                                dataset[ind].problemDescription = utils.formatStringWithEllipses(dataset[ind].problemDescription, MAX_LENGTH);
                              }
                              break;
                            }
                          }
                        });
                        res.render('docs/done_applications.ejs', {
                          'data': dataset,
                          'pageCount': pageCount,
                          'currentPage': currentPage,
                          'visibleRows': visibleRows,
                          'countRecords': countRecords,
                          'moment': moment
                        });
                      }
                    });
                  });
                }
              });
          });
        });
    });
  });

  router.post('/save', function (req, res) {

    if ('move' in req.body) {
      res.redirect('/applications');
      return;
    }

    var errors = {};
    var createDate = {
      'msg': 'Дата и время создания неверна'
    };
    var address = {
      'msg': 'Заполните адрес'
    };
    var porch = {
      'msg': 'Укажите номер подъезда'
    };
    var faults = {
      'msg': 'Не указана(ы) неисправность(и)'
    };
    var performer = {
      'msg': 'Введите исполнителя'
    };

    // Validation

    // Verify create datetime
    var checkDate = new utils.convertDateToMySQLDate(req.body.createDate, false);
    if (checkDate.isValid()) {
      console.log('outputDate: ' + checkDate.outputDate());
    }
    else {
      errors.createDate = createDate;
    }

    // Verify address
    var checkAddress =
      (+req.body.cityId > 0) &&
      (+req.body.streetId > 0) &&
      (+req.body.houseId > 0);

    if ((typeof checkAddress !== 'boolean') || ((typeof checkAddress === 'boolean') && (!checkAddress))) {
      errors.address = address;
    }

    // Verify porch
    var checkPorch = ((req.body.porch.trim() !== '') && (Number.isFinite(+req.body.porch) ? (+req.body.porch > 0 ? true : false) : false));
    if ((typeof checkPorch !== 'boolean') || ((typeof checkPorch === 'boolean') && (!checkPorch))) {
      errors.porch = porch;
    }

    // Verify faults
    var checkFaults = false;
    var tableFaults;
    try {
      tableFaults = JSON.parse(req.body.faults);
      if ((typeof tableFaults === 'object') && (Array.isArray(tableFaults))) {
        checkFaults = tableFaults.length > 0;
      }
    } catch (error) {
      //
    }

    if (!checkFaults) {
      errors.faults = faults;
    }

    // Verify performer
    var checkPerformer = ((req.body.performerId.trim() !== '') && (Number.isFinite(+req.body.performerId) ? (+req.body.performerId > 0 ? true : false) : false));
    if ((typeof checkPerformer !== 'boolean') || ((typeof checkPerformer === 'boolean') && (!checkPerformer))) {
      errors.performer = performer;
    }

    if (Object.keys(errors).length > 0) {
      res.render(
        'docs/forms/application.ejs',
        {
          'moment': moment,
          'data': req.body,
          'errors': errors
        }
      );
    }
    else {
      // Запись в БД
      if ((req.body.documentId) && (req.body.documentId.trim() !== '') && (isFinite(req.body.documentId))) {

        var isDone = +req.body.isDone;
        if ('move' in req.body) {
          isDone = 0;
          // TODO: close_date = NULL
          return;
        }

        db.get().getConnection(function (err, connection) {
          connection.query('DELETE FROM faults WHERE application_id = ?', [req.body.documentId], function () {

            connection.release();

            db.get().getConnection(function (err, connection) {
              connection.query(
                ' UPDATE applications SET' +
                ' create_date = ?,' +
                ' city_id = ?,' +
                ' street_id = ?,' +
                ' house_id = ?,' +
                ' porch = ?,' +
                ' phone = ?,' +
                ' worker_id = ?,' +
                ' is_done = ?' +
                ' WHERE application_id = ?', [
                  checkDate.outputDate(),
                  req.body.cityId,
                  req.body.streetId,
                  req.body.houseId,
                  req.body.porch,
                  req.body.phone,
                  req.body.performerId,
                  isDone,
                  req.body.documentId
                ], function (err) {
                  connection.release();
                  if (err) {
                    res.status(500).send({ 'code': 500, 'msg': 'Database Error' });
                  } else {
                    saveTable(req.body.documentId, tableFaults, function () {
                      if (+req.body.isDone === 1) {
                        res.redirect('/applications/completed');
                      }
                      else {
                        res.redirect('/applications');
                      }
                    });
                  }
                }
              );
            });
          });
        });
      }
      else {
        db.get().getConnection(function (err, connection) {
          connection.query(
            ' INSERT INTO applications (create_date, city_id, street_id, house_id, porch, phone, worker_id)' +
            ' VALUE(?, ?, ?, ?, ?, ?, ?)', [
              checkDate.outputDate(),
              req.body.cityId,
              req.body.streetId,
              req.body.houseId,
              req.body.porch,
              req.body.phone,
              req.body.performerId
            ], function (err, rows) {
              connection.release();
              if (err) {
                res.status(500).send({ 'code': 500, 'msg': 'Database Error' });
              } else {
                saveTable(rows.insertId, tableFaults, function () {
                  res.redirect('/applications');
                });
              }
            }
          );
        });
      }
    }
  });

  router.post('/search_performer', function (req, res) {
    var data = req.body;
    var suggestion = '';
    if ((data) && (typeof (data) === 'object') && ('suggestion' in data)) {
      suggestion = data.suggestion.trim();

      var queryText =
        ' SELECT a.worker_id AS id, a.name AS value' +
        ' FROM workers a';
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
            }
          }
        );
      });
    }
    else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  router.post('/find_fault', function (req, res) {
    var data = req.body;
    var suggestion = '';
    if ((data) && (typeof (data) === 'object') && ('suggestion' in data)) {
      suggestion = data.suggestion.trim();

      var queryText =
        ' SELECT a.template_id AS id, a.name AS value' +
        ' FROM templates a' +
        ' WHERE (a.template_id > 0)';
      if (suggestion.length > 0) {
        queryText += ' AND (a.name LIKE ' + `'` + '%' + suggestion + '%' + `'` + ')';
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
            }
          }
        );
      });
    }
    else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  router.post('/address_autocomplete', function (req, res) {
    var data = req.body;
    var suggestion = '';
    if ((data) && (typeof (data) === 'object') && ('suggestion' in data)) {
      suggestion = data.suggestion.trim();

      var words = suggestion.split(', ');
      if (!Array.isArray(words)) {
        return;
      }

      var outputData = {};
      var queryText = '';
      var items = [];

      // Only cit(ies)y
      if (words.length === 1) {
        queryText =
          ' SELECT a.city_id, a.name AS city_name' +
          ' FROM cities a';

        if (words[0].trim().length > 0) {
          queryText += ' WHERE a.name LIKE ' + `'` + words[0].trim() + '%' + `'`;
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
                if (Array.isArray(rows)) {
                  rows.forEach(function (item) {
                    items.push({
                      'cityId': item.city_id,
                      'cityName': item.city_name
                    });
                  });
                }

                outputData.level = 0;
                outputData.items = items;
                res.status(200).send(outputData);
              }
            }
          );
        });
      }
      else if (words.length >= 2) {
        var cityId = 0;
        getCity(words[0].trim(), function (id) {
          cityId = id;
          getStreets(cityId, words[1], rowsLimit, function (streets) {
            if (words.length === 2) {
              if (Array.isArray(streets)) {
                streets.forEach(function (item) {
                  items.push({
                    'cityId': cityId,
                    'cityName': words[0].trim(),
                    'streetId': item.street_id,
                    'streetName': item.street_name
                  });
                });
              }

              outputData.level = 1;
              outputData.items = items;
              res.status(200).send(outputData);
            }
            if (words.length === 3) {
              getHouses(cityId, words[1], words[2], rowsLimit, function (houses) {
                if (Array.isArray(houses)) {
                  houses.forEach(function (item) {
                    items.push({
                      'cityId': cityId,
                      'cityName': words[0].trim(),
                      'streetId': item.street_id,
                      'streetName': words[1].trim(),
                      'houseId': item.house_id,
                      'houseNumber': item.house_number
                    });
                  });
                }

                outputData.level = 2;
                outputData.items = items;
                res.status(200).send(outputData);
              });
            }
          });
        });
      }
      else {
        res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
      }
    }

  });

  router.get('/:offset', function (req, res) {
    var offset = +req.params.offset;
    var pageCount = 0;
    var countRecords = 0;
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT COUNT(*) AS count' +
        ' FROM applications a WHERE (a.application_id > 0) AND' +
        ' a.is_done = 0', [], function (err, rows) {
          connection.release();
          countRecords = rows[0].count;
          pageCount =
            (countRecords / visibleRows) < 1 ? 0 : Math.ceil(countRecords / visibleRows);
          if ((offset > pageCount * visibleRows)) {
            offset = (pageCount - 1) * visibleRows;
          }

          db.get().getConnection(function (err, connection) {
            connection.query(
              ' SELECT a.application_id AS documentId, a.create_date AS createDate,' +
              ' b.name AS cityName, c.name AS streetName,' +
              ' d.number AS houseNumber, a.porch, ' +
              ' (SELECT COUNT(*) FROM faults e WHERE e.application_id  = a.application_id) AS rowsInDoc' +
              ' FROM applications a' +
              ' LEFT JOIN cities b ON b.city_id = a.city_id' +
              ' LEFT JOIN streets c ON c.street_id = a.street_id' +
              ' LEFT JOIN houses d ON d.house_id = a.house_id' +
              ' WHERE (a.application_id > 0)' +
              ' AND a.is_done = 0' +
              ' ORDER BY a.create_date ASC' +
              ' LIMIT ?' +
              ' OFFSET ?', [visibleRows, offset], function (err, rows) {
                connection.release();

                if (err) {
                  res.status(500).send({
                    'code': 500,
                    'msg': 'Database error'
                  });
                } else {
                  var currentPage = Math.ceil(offset / visibleRows) + 1;
                  var dataset = rows;
                  for (var ind = 0; ind < dataset.length; ind++) {
                    dataset[ind].problemDescription = '';
                  }

                  var parameters = '';
                  if (Array.isArray(rows) && (rows.length > 0)) {
                    for (ind = 0; ind < rows.length; ind++) {
                      parameters += rows[ind].documentId + (ind < rows.length - 1 ? ', ' : '');
                    }
                    parameters = '(' + parameters + ')';
                  }

                  db.get().getConnection(function (err, connection) {
                    var stringSQL = 
                    ' SELECT a.application_id AS documentId, b.name AS problemDescription FROM faults a' +
                    ' LEFT JOIN templates b ON b.template_id = a.template_id' +
                    ' WHERE a.application_id IN ';
                    if (parameters.trim().length === 0) {
                      parameters = '(-1)';
                    }
                    stringSQL += parameters;

                    connection.query(
                      stringSQL, [], function (err, rows) {
                      connection.release();
                      
                      if (err) {
                        res.status(500).send({
                          'code': 500,
                          'msg': 'Database error'
                        });
                      }
                      else {
                        console.log(rows);
                        rows.forEach( function(item) {
                          for (var ind = 0; ind < dataset.length; ind++) {
                            if (dataset[ind].documentId === item.documentId) {
                              dataset[ind].problemDescription += (dataset[ind].problemDescription.trim().length > 0 ? ', ' : '') + item.problemDescription;
                              if (dataset[ind].problemDescription.length >= MAX_LENGTH) {
                                dataset[ind].problemDescription = utils.formatStringWithEllipses(dataset[ind].problemDescription, MAX_LENGTH);
                              }
                              break;
                            }
                          }
                        });
                        res.render('docs/applications.ejs', {
                          'data': dataset,
                          'pageCount': pageCount,
                          'currentPage': currentPage,
                          'visibleRows': visibleRows,
                          'countRecords': countRecords,
                          'moment': moment
                        });
                      }
                    });
                  });
                }
              });
          });
        });
    });
  });

  router.get('/completed/:offset', function (req, res) {
    var offset = +req.params.offset;
    var pageCount = 0;
    var countRecords = 0;
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT COUNT(*) AS count' +
        ' FROM applications a WHERE (a.application_id > 0) AND' +
        ' a.is_done = 1', [], function (err, rows) {
          connection.release();
          countRecords = rows[0].count;
          pageCount =
            (countRecords / visibleRows) < 1 ? 0 : Math.ceil(countRecords / visibleRows);
          if ((offset > pageCount * visibleRows)) {
            offset = (pageCount - 1) * visibleRows;
          }

          db.get().getConnection(function (err, connection) {
            connection.query(
              ' SELECT a.application_id AS documentId, a.create_date AS createDate,' +
              ' b.name AS cityName, c.name AS streetName,' +
              ' d.number AS houseNumber, a.porch, ' +
              ' (SELECT COUNT(*) FROM faults e WHERE e.application_id  = a.application_id) AS rowsInDoc' +
              ' FROM applications a' +
              ' LEFT JOIN cities b ON b.city_id = a.city_id' +
              ' LEFT JOIN streets c ON c.street_id = a.street_id' +
              ' LEFT JOIN houses d ON d.house_id = a.house_id' +
              ' WHERE (a.application_id > 0)' +
              ' AND a.is_done = 1' +
              ' ORDER BY a.create_date ASC' +
              ' LIMIT ?' +
              ' OFFSET ?', [visibleRows, offset], function (err, rows) {
                connection.release();

                if (err) {
                  res.status(500).send({
                    'code': 500,
                    'msg': 'Database error'
                  });
                } else {
                  var currentPage = Math.ceil(offset / visibleRows) + 1;
                  var dataset = rows;
                  for (var ind = 0; ind < dataset.length; ind++) {
                    dataset[ind].problemDescription = '';
                  }

                  var parameters = '';
                  if (Array.isArray(rows) && (rows.length > 0)) {
                    for (ind = 0; ind < rows.length; ind++) {
                      parameters += rows[ind].documentId + (ind < rows.length - 1 ? ', ' : '');
                    }
                    parameters = '(' + parameters + ')';
                  }

                  db.get().getConnection(function (err, connection) {
                    var stringSQL = 
                    ' SELECT a.application_id AS documentId, b.name AS problemDescription FROM faults a' +
                    ' LEFT JOIN templates b ON b.template_id = a.template_id' +
                    ' WHERE a.application_id IN ';
                    if (parameters.trim().length === 0) {
                      parameters = '(-1)';
                    }
                    stringSQL += parameters;

                    connection.query(
                      stringSQL, [], function (err, rows) {
                      connection.release();
                      
                      if (err) {
                        res.status(500).send({
                          'code': 500,
                          'msg': 'Database error'
                        });
                      }
                      else {
                        console.log(rows);
                        rows.forEach( function(item) {
                          for (var ind = 0; ind < dataset.length; ind++) {
                            if (dataset[ind].documentId === item.documentId) {
                              dataset[ind].problemDescription += (dataset[ind].problemDescription.trim().length > 0 ? ', ' : '') + item.problemDescription;
                              if (dataset[ind].problemDescription.length >= MAX_LENGTH) {
                                dataset[ind].problemDescription = utils.formatStringWithEllipses(dataset[ind].problemDescription, MAX_LENGTH);
                              }
                              break;
                            }
                          }
                        });
                        res.render('docs/done_applications.ejs', {
                          'data': dataset,
                          'pageCount': pageCount,
                          'currentPage': currentPage,
                          'visibleRows': visibleRows,
                          'countRecords': countRecords,
                          'moment': moment
                        });
                      }
                    });
                  });
                }
              });
          });
        });
    });
  });

  return router;
};