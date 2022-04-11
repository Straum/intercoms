const db = require('../../lib/db');

module.exports.getDateOfLastPayment = (apartmentId) => new Promise((resolve, reject) => {
  db.get().getConnection((err, connection) => {
    connection.query(
      'CALL get_date_of_last_payment_for_apartment(?)', [apartmentId], (error, rows) => {
        connection.release();
        if (error) {
          reject();
        } else {
          resolve(rows[0][0]);
        }
      },
    );
  });
});

module.exports.convertAnApartment = (apartmentId) => new Promise((resolve, reject) => {
  db.get().getConnection((err, connection) => {
    connection.query(
      'CALL refresh_apartment(?)', [apartmentId],
      // 'CALL convert_an_apartment(?)', [apartmentId],
      (error, rows) => {
        connection.release();
        if (error) {
          reject();
        } else {
          resolve(rows[0][0]);
        }
      },
    );
  });
});
