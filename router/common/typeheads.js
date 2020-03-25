'use strict';

var db = require('../../lib/db');

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