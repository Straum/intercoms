'use strict';

var db = require('./db');
var moment = require('moment');

function extractClientContractData(id, cb) {
  db.get().getConnection(function (err, connection) {
    connection.query(
      ' SELECT' +
      ' a.client_id,' +
      ' b.name AS client_name,' +
      ' d.name AS document_name, c.series, c.number, c.issue_date, c.issue, c.phones,' +

      ' f.city_id AS registered_city_id, f.name AS registered_city_name,' +
      ` CONCAT(g.name, ' ', k.short_name) AS registered_street_name,` +
      ' h.number AS registered_house_number, e.room_apartment AS registered_apartment,' +

      ' m.city_id AS actual_city_id, m.name AS actual_city_name,' +
      ` CONCAT(n.name, ' ', p.short_name) AS actual_street_name,` +
      ' o.number AS actual_house_number, l.room_apartment AS actual_apartment' +

      ' FROM cards a' +
      ' LEFT JOIN clients b ON a.client_id = b.client_id' +
      ' LEFT JOIN faces c ON a.client_id = c.client_id' +
      ' LEFT JOIN docs_types d ON c.doc_type_id = d.doc_type_id' +

      ' LEFT JOIN residence_clients e ON' +
      '   (c.client_id = e.client_id AND e.residence_type_id = ?)' +
      ' LEFT JOIN cities f ON e.city_id = f.city_id' +
      ' LEFT JOIN streets g ON e.street_id = g.street_id' +
      ' LEFT JOIN houses h ON e.house_id = h.house_id' +
      ' LEFT JOIN street_types k ON g.street_type_id = k.street_type_id' +

      ' LEFT JOIN residence_clients l ON' +
      '   (c.client_id = l.client_id AND l.residence_type_id = ?)' +
      ' LEFT JOIN cities m ON e.city_id = m.city_id' +
      ' LEFT JOIN streets n ON e.street_id = n.street_id' +
      ' LEFT JOIN houses o ON e.house_id = o.house_id' +
      ' LEFT JOIN street_types p ON n.street_type_id = p.street_type_id' +

      ' WHERE a.card_id = ?', [0, 1, id], function (err, rows) {
        if (err) {
          throw err;
        }
        connection.release();

        if (typeof cb === 'function') {
          cb((err) ? null : rows[0]);
        }
      });
  });
}

function extractClientServiceData(id, cb) {
  db.get().getConnection(function (err, connection) {
    connection.query(
      ' SELECT' +
      ' a.m_client_id,' +
      ' b.name AS client_name,' +
      ' d.name AS document_name, c.series, c.number, c.issue_date, c.issue, c.phones,' +

      ' f.city_id AS registered_city_id, f.name AS registered_city_name,' +
      ` CONCAT(g.name, ' ', k.short_name) AS registered_street_name,` +
      ' h.number AS registered_house_number, e.room_apartment AS registered_apartment,' +

      ' m.city_id AS actual_city_id, m.name AS actual_city_name,' +
      ` CONCAT(n.name, ' ', p.short_name) AS actual_street_name,` +
      ' o.number AS actual_house_number, l.room_apartment AS actual_apartment' +

      ' FROM cards a' +
      ' LEFT JOIN clients b ON a.m_client_id = b.client_id' +
      ' LEFT JOIN faces c ON a.m_client_id = c.client_id' +
      ' LEFT JOIN docs_types d ON c.doc_type_id = d.doc_type_id' +

      ' LEFT JOIN residence_clients e ON' +
      '   (c.client_id = e.client_id AND e.residence_type_id = ?)' +
      ' LEFT JOIN cities f ON e.city_id = f.city_id' +
      ' LEFT JOIN streets g ON e.street_id = g.street_id' +
      ' LEFT JOIN houses h ON e.house_id = h.house_id' +
      ' LEFT JOIN street_types k ON g.street_type_id = k.street_type_id' +

      ' LEFT JOIN residence_clients l ON' +
      '   (c.client_id = l.client_id AND l.residence_type_id = ?)' +
      ' LEFT JOIN cities m ON e.city_id = m.city_id' +
      ' LEFT JOIN streets n ON e.street_id = n.street_id' +
      ' LEFT JOIN houses o ON e.house_id = o.house_id' +
      ' LEFT JOIN street_types p ON n.street_type_id = p.street_type_id' +

      ' WHERE a.card_id = ?', [0, 1, id], function (err, rows) {
        if (err) {
          throw err;
        }
        connection.release();

        if (typeof cb === 'function') {
          cb((err) ? null : rows[0]);
        }
      });
  });
}

exports.getApartmentsFromContract = function (id, cb) {
  db.get().getConnection(function (err, connection) {
    connection.query(
      ' SELECT' +
      ' a.apartment_id,' +
      ' a.paid,' +
      ' a.number,' +
      ' a.card_id,' +
      ' a.privilege,' + 
      ' a.exempt,' +
      ' a.letter,' +
      ' a.half_paid,' +
      ' a.locked,' +
      ' a.paid_dt' +
      ' FROM apartments a' + 
      ' WHERE a.card_id = ?' +
      ' ORDER BY a.number, a.letter',  [id], function (err, rows) {
        if (err) {
          throw err;
        }
        connection.release();

        if (typeof cb === 'function') {
          cb((err) ? null : rows);
        }
      });
  });
}

// async function getApartmentsFromContract2 (id) {
//   try {
//     var connection = await db.get().getConnection();
//     var data = await connection.query(
//       ' SELECT' +
//       ' a.apartment_id,' +
//       ' a.paid,' +
//       ' a.number,' +
//       ' a.card_id,' +
//       ' a.privilege,' + 
//       ' a.exempt,' +
//       ' a.letter,' +
//       ' a.half_paid,' +
//       ' a.locked,' +
//       ' a.paid_dt' +
//       ' FROM apartments a' + 
//       ' WHERE a.card_id = ?' +
//       ' ORDER BY a.number, a.letter'
//     );
//     // connection.release();
//     return data;
//   }
//   catch (err) {
//     console.log('Error getApartmentsFromContract2(): ' + err.message);
//   }
// };

exports.getClientContractData = function (cardId, callback) {
  return extractClientContractData(cardId, callback);
};

exports.getClientServiceData = function (cardId, callback) {
  return extractClientServiceData(cardId, callback);
};

exports.decodeClientData = function (data) {
  var box = {
    passport: '',
    registeredAddress: '',
    actualAddress: ''
  };

  if (typeof data === 'object') {
    if (('document_name' in data) && (data.document_name) && (data.document_name.trim().length > 0)) {
      box.passport = data.document_name.trim();
    }
    if (('series' in data) && (data.series) && (data.series.trim().length > 0)) {
      box.passport += ' серия ' + data.series.trim();
    }
    if (('number' in data) && (data.number) && (data.number.trim().length > 0)) {
      box.passport += ' № ' + data.number.trim();
    }
    if (('issue_date' in data) && (data.issue_date)) {
      box.passport += ' ' + moment(data.issue_date).format('DD.MM.YYYY');
    }
    if (('issue' in data) && (data.issue) && (data.issue.trim().length > 0)) {
      box.passport += ' выдан ' + data.issue;
    }
    //
    if (('registered_city_id' in data) && (data.registered_city_id > 0)) {
      if (('registered_city_name' in data) && (data.registered_city_name.trim().length > 0)) {
        box.registeredAddress = data.registered_city_name.trim();
      }
      if (('registered_street_name' in data) && (data.registered_street_name.trim().length > 0)) {
        box.registeredAddress += ' ' + data.registered_street_name.trim();
      }
      if (('registered_house_number' in data) && (data.registered_house_number.trim().length > 0)) {
        box.registeredAddress += ' ' + data.registered_house_number.trim();
      }
      if (('registered_apartment' in data) && (data.registered_apartment.trim().length > 0)) {
        box.registeredAddress += ' кв. ' + data.registered_apartment;
      }
    }
    //
    if (('actual_city_id' in data) && (data.actual_city_id > 0)) {
      if (('actual_city_name' in data) && (data.actual_city_name.trim().length > 0)) {
        box.actualAddress = data.actual_city_name.trim();
      }
      if (('actual_street_name' in data) && (data.actual_street_name.trim().length > 0)) {
        box.actualAddress += ' ' + data.actual_street_name.trim();
      }
      if (('actual_house_number' in data) && (data.actual_house_number.trim().length > 0)) {
        box.actualAddress += ' ' + data.actual_house_number.trim();
      }
      if (('actual_apartment' in data) && (data.actual_apartment.trim().length > 0)) {
        box.actualAddress += ' кв. ' + data.actual_apartment;
      }
    }
  }

  return box;
};

// module.exports.getApartmentsFromContract2 = getApartmentsFromContract2;