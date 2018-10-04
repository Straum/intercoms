'use strict';

const express = require('express');
var db = require('../../../lib/db.js');
const rowsLimit = require('../../../lib/config.js').config.rowsLimit;
var moment = require('moment');

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
  getStreets(cityId, streetName, 1, function(street) {
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

module.exports = function () {
  var router = express.Router();

  router.get('/', function (req, res) {
    res.render('docs/applications.ejs');
  });

  router.get('/edit/:id', function (req, res) {
    //
  });

  router.get('/edit_done', function (req, res) {
    res.render('docs/forms/done_application.ejs');
  });

  router.get('/add', function (req, res) {
    res.render(
      'docs/forms/application.ejs',
      {
        'moment': moment,
        'data': {
          'faults': JSON.stringify([])
        },
        'errors': {}
      }
    );
  });

  router.get('/completed', function (req, res) {
    res.render('docs/done_applications.ejs');
  });

  router.post('/save', function (req, res) {
    var errors = {};
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

    // Verify address
    var checkAddress = 
      (+req.body.cityId > 0) && 
      (+req.body.streetId > 0) && 
      (+req.body.houseId > 0);

    if ((typeof checkAddress !== 'boolean') || ((typeof checkAddress === 'boolean') && (! checkAddress))) {
      errors.address = address;
    }

    // Verify porch
    var checkPorch = ((req.body.porch.trim() !== '') && (Number.isFinite(+req.body.porch) ? (+req.body.porch > 0 ? true : false) : false));
    if ((typeof checkPorch !== 'boolean') || ((typeof checkPorch === 'boolean') && (! checkPorch))) {
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

    if (! checkFaults) {
      errors.faults = faults;
    }

    // Verify performer
    var checkPerformer = ((req.body.performerId.trim() !== '') && (Number.isFinite(+req.body.performerId) ? (+req.body.performerId > 0 ? true : false) : false));
    if ((typeof checkPerformer !== 'boolean') || ((typeof checkPerformer === 'boolean') && (! checkPerformer))) {
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
      //
      res.status(200).send();
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
        getCity(words[0].trim(), function(id) {
          cityId = id;
          getStreets(cityId, words[1], rowsLimit, function(streets) {
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
              getHouses(cityId, words[1], words[2], rowsLimit, function(houses) {
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

  return router;
};