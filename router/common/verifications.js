const db = require('../../lib/db');

module.exports.validApartment = (number, letter, orderNumber) => new Promise((resolve, reject) => {
  db.get().getConnection((err, connection) => {
    connection.query(`SELECT a.apartment_id AS id
        FROM apartments a
        LEFT JOIN cards b ON b.card_id = a.card_id
        WHERE (a.number = ?) AND (a.letter = ?) AND (b.contract_number = ?)
        LIMIT 1`, [number, letter, orderNumber],
    (error, rows) => {
      connection.release();
      if (error) {
        reject();
      } else {
        resolve({ isExists: rows.length > 0, id: rows.length > 0 ? rows[0].id : null });
      }
    });
  });
});
