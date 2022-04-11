const db = require('../../lib/db');

module.exports.calcPaymentAndDebt = (apartmentId) => new Promise((resolve, reject) => {
  db.get()
    .getConnection((err, connection) => {
      connection.query('CALL calc_payment_and_debt(?)', [apartmentId],
        (error) => {
          connection.release();
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
    });
});
