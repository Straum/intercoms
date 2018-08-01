'use strict';

var db = require('./db');

function clientContractAddress(id, cb) {
  db.get().getConnection(function (err, connection) {
    connection.query(
      ' SELECT' +
      ' a.client_id,' +
      ' b.name AS client_name,' +
      ' d.name AS document_name, c.series, c.number, c.issue_date, c.issue, c.phones,' +

      ' f.name AS registered_city_name,' +
      ` CONCAT(g.name, ' ', k.short_name) AS registered_street_name,` +
      ' h.number AS registered_house_number, e.room_apartment AS registered_apartment,' +

      ' m.name AS actual_city_name,' +
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
          cb( (err) ? null : rows[0] );
        }
      });
  });
}


exports.getClientContractAddress = function (cardId, callback) {
  return clientContractAddress(cardId, callback);
};