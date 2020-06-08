'use strict';

var db = require('../../lib/db');


var getCity = function (cityName, callback) {
  db.get().getConnection(function (err, connection) {
    connection.query(
      ' SELECT a.city_id AS cityId' +
      ' FROM cities a' +
      ' WHERE a.name = ?' +
      ' LIMIT 1', [cityName], function (err, rows) {
        connection.release();

        if (typeof callback === 'function') {
          if (rows.length === 1) {
            callback(rows[0].cityId);
          }
          else {
            callback(null);
          }
        }
      }
    );
  });
};

var getStreets = function (cityId, streetName, rowsLimit, callback) {
  var queryText = ' SELECT a.street_id AS streetId, a.name AS streetName' +
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
  getStreets(cityId, streetName, 1, function (streets) {
    if ((Array.isArray(streets)) && (streets.length === 1)) {
      var streetId = streets[0].streetId;

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

module.exports.filterCities = function (params, callback) {

  var queryText =
    ' SELECT a.city_id AS id, a.name AS value' +
    ' FROM cities a';

  if (params.cityName.length > 0) {
    queryText += ' WHERE a.name LIKE ' + `'` + params.cityName + '%' + `'`;
  }

  queryText += ' ORDER BY a.name ASC';
  queryText += ' LIMIT ' + params.rowsCount;

  db.get().getConnection(function (err, connection) {
    connection.query(
      queryText, [], function (err, rows) {
        connection.release();

        if (err) {
          throw err;
        }

        if (typeof callback === 'function') {
          callback(null, rows);
        }

      }
    );
  });
};

module.exports.filterStreets = function (params, callback) {

  var queryText =
    ' SELECT a.street_id AS id, a.name AS value, city_id AS cityId' +
    ' FROM streets a';

  queryText += ' WHERE a.city_id = ' + params.cityId;

  if (params.streetName.length > 0) {
    queryText += ' AND a.name LIKE ' + `'` + params.streetName + '%' + `'`;
  }

  queryText += ' ORDER BY a.name ASC';
  queryText += ' LIMIT ' + params.rowsCount;

  db.get().getConnection(function (err, connection) {
    connection.query(
      queryText, [], function (err, rows) {
        connection.release();

        if (err) {
          throw err;
        }

        if (typeof callback === 'function') {
          callback(null, rows);
        }

      }
    );
  });
};

module.exports.filterHouses = function (params, callback) {

  var queryText =
    ' SELECT a.house_id AS id, a.number AS value, street_id AS streetId' +
    ' FROM houses a';

  queryText += ' WHERE a.street_id = ' + params.streetId;

  if (params.houseNumber.length > 0) {
    queryText += ' AND a.number LIKE ' + `'` + params.houseNumber + '%' + `'`;
  }

  queryText += ' ORDER BY a.number ASC';
  queryText += ' LIMIT ' + params.rowsCount;

  db.get().getConnection(function (err, connection) {
    connection.query(
      queryText, [], function (err, rows) {
        connection.release();

        if (err) {
          throw err;
        }

        if (typeof callback === 'function') {
          callback(null, rows);
        }

      }
    );
  });
};

module.exports.filterPorches = function (params, callback) {

  var queryText =
    ' SELECT a.card_id AS id, CAST(a.porch AS CHAR(11)) AS value' +
    ' FROM cards a';

  queryText += ' WHERE a.house_id = ' + params.houseId;

  if (params.porch.length > 0) {
    queryText += ' AND a.porch LIKE ' + `'` + params.porch + '%' + `'`;
  }

  queryText += ' ORDER BY a.porch ASC';
  queryText += ' LIMIT ' + params.rowsCount;

  db.get().getConnection(function (err, connection) {
    connection.query(
      queryText, [], function (err, rows) {
        connection.release();

        if (err) {
          throw err;
        }

        if (typeof callback === 'function') {
          callback(null, rows);
        }

      }
    );
  });
};

module.exports.filterEquipments = function (params, callback) {

  var queryText =
    ' SELECT a.equipment_id AS id, a.name AS `value`, guarantee_period AS guaranteePeriod' +
    ' FROM equipments a' +
    ' WHERE (a.equipment_id > 0)';

  if (params.suggestion.length > 0) {
    queryText += ' AND a.name LIKE ' + `'` + params.suggestion.trim() + '%' + `'`;
  }

  queryText += ' ORDER BY a.name ASC';
  queryText += ' LIMIT ' + params.rowsCount;


  db.get().getConnection(function (err, connection) {
    connection.query(
      queryText, [], function (err, rows) {
        connection.release();

        if (err) {
          throw err;
        }

        if (typeof callback === 'function') {
          callback(null, rows);
        }
      }
    );
  });
};

module.exports.filterOrders = function (orderNumber, rowsCount, callback) {

  var queryText =
    ' SELECT a.card_id AS id, CAST(a.contract_number AS CHAR(11)) AS `value`' +
    ' FROM cards a';

  if (orderNumber.length > 0) {
    queryText += ' WHERE a.contract_number LIKE ' + `'` + orderNumber.trim() + '%' + `'`;
  }

  queryText += ' ORDER BY a.contract_number ASC';
  queryText += ' LIMIT ' + rowsCount;

  db.get().getConnection(function (err, connection) {
    connection.query(
      queryText, [], function (err, rows) {
        connection.release();

        if (err) {
          throw err;
        }

        if (typeof callback === 'function') {
          callback(null, rows);
        }
      }
    );
  });
};

module.exports.filterProlongedOrders = function (orderNumber, rowsCount, callback) {

  var queryText =
    ' SELECT a.card_id AS id, a.m_contract_number AS `value`' +
    ' FROM cards a';

  if (orderNumber.length > 0) {
    queryText += ' WHERE a.m_contract_number LIKE ' + `'` + orderNumber.trim() + '%' + `'`;
  }

  queryText += ' ORDER BY a.m_contract_number ASC';
  queryText += ' LIMIT ' + rowsCount;


  db.get().getConnection(function (err, connection) {
    connection.query(
      queryText, [], function (err, rows) {
        connection.release();

        if (err) {
          throw err;
        }

        if (typeof callback === 'function') {
          callback(null, rows);
        }
      }
    );
  });
};

module.exports.filterPerformers = function (params, callback) {

  var queryText =
    ' SELECT a.worker_id AS id, a.name AS `value`' +
    ' FROM workers a' +
    ' WHERE (a.is_work = 0)';

  if (params.performerName.length > 0) {
    queryText += ' AND a.name LIKE ' + `'` + params.performerName.trim() + '%' + `'`;
  }

  queryText += ' ORDER BY a.name ASC';
  queryText += ' LIMIT ' + params.rowsCount;


  db.get().getConnection(function (err, connection) {
    connection.query(
      queryText, [], function (err, rows) {
        connection.release();

        if (err) {
          throw err;
        }

        if (typeof callback === 'function') {
          callback(null, rows);
        }
      }
    );
  });
};

module.exports.filterClients = function (params, callback) {

  var queryText =
    ' SELECT a.client_id AS id, a.name AS `value`, b.phones' +
    ' FROM clients a' +
    ' LEFT JOIN faces b ON b.client_id = a.client_id' +
    ' WHERE (a.is_deleted = 0)';

  if (params.suggestion.length > 0) {
    queryText += ' AND a.name LIKE ' + `'` + params.suggestion.trim() + '%' + `'`;
  }

  queryText += ' ORDER BY a.name ASC';
  queryText += ' LIMIT ' + params.rowsCount;


  db.get().getConnection(function (err, connection) {
    connection.query(
      queryText, [], function (err, rows) {
        connection.release();

        if (err) {
          throw err;
        }

        if (typeof callback === 'function') {
          callback(null, rows);
        }
      }
    );
  });
};

module.exports.outFullAddress = function (params, callback) {
  var words = params.suggestion.split(', ');
  if (!Array.isArray(words)) {
    return;
  }

  var outputData = {};
  var queryText = '';
  var items = [];

  if (words.length === 1) {
    queryText =
      ' SELECT a.city_id, a.name AS city_name' +
      ' FROM cities a';

    if (words[0].trim().length > 0) {
      queryText += ' WHERE a.name LIKE ' + `'` + words[0].trim() + '%' + `'`;
    }
    queryText += ' ORDER BY a.name ASC';
    queryText += ' LIMIT ' + params.rowsCount;

    db.get().getConnection(function (err, connection) {
      connection.query(
        queryText, [], function (err, rows) {
          connection.release();

          if (err) {
            throw(err);
          }

          if (Array.isArray(rows)) {
            rows.forEach(function (item) {
              items.push({
                cityId: item.city_id,
                cityName: item.city_name
              });
            });
          }

            outputData.level = 0;
            outputData.items = items;
            callback(null, outputData);
            return;
        }
      );
    });
  }
  else if (words.length >= 2) {
    var cityId = 0;
    getCity(words[0].trim(), function (id) {
      if (id === null) {
        items.push({
          cityId: 0,
          cityName: 'Нет данных'
        });
        outputData.level = 0;
        outputData.items = items;
        callback(null, outputData);
        return;
      }
      cityId = id;
      getStreets(cityId, words[1], params.rowsCount, function (streets) {
        if (words.length === 2) {
          if (Array.isArray(streets)) {
            streets.forEach(function (item) {
              items.push({
                cityId: cityId,
                cityName: words[0].trim(),
                streetId: item.streetId,
                streetName: item.streetName
              });
            });
          }

          outputData.level = 1;
          outputData.items = items;
          callback(null, outputData);
          return;
        }
        if (words.length === 3) {
          getHouses(cityId, words[1], words[2], params.rowsCount, function (houses) {
            if (Array.isArray(houses)) {
              houses.forEach(function (item) {
                items.push({
                  cityId: cityId,
                  cityName: words[0].trim(),
                  streetId: item.street_id,
                  streetName: words[1].trim(),
                  houseId: item.house_id,
                  houseNumber: item.house_number
                });
              });
            }

            outputData.level = 2;
            outputData.items = items;
            callback(null, outputData);
          });
        }
      });
    });
  }
};