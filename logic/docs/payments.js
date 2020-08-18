var db = require('../../lib/db');

function PaymentsLogic(req, res) {
  this.req = req;
  this.res = res
}

PaymentsLogic.prototype.parseBarCode = async function (barcodeValue) {
  var self = this;
  var orderInfo = {};
  var obj = {
    amount: parseFloat(barcodeValue.substring(14, 21)) / 100,
    isDuplicate: Number(barcodeValue.substring(21, 22)),
    prolongedContractNumber: Number(barcodeValue.substring(22, 28)),
    letter: Number(barcodeValue.substring(28, 29)),
    apartment: Number(barcodeValue.substring(29))
  };

  await self.getOrderInfo(obj.prolongedContractNumber, obj.isDuplicate)
    .then(function (result) {
      orderInfo = result;
    })
    .catch(function (error) {
      console.log(error);
    })

  this.res.status(200).send({ ...obj, ...orderInfo });
}

PaymentsLogic.prototype.getOrderInfo = function (prolongedContractNumber, isDuplicate) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        `
        SELECT
        a.card_id AS id, a.contract_number AS contractNumber,
        a.start_service AS startService, a.end_service AS endService, a.receipt_printing AS receiptPrint,
        b.name AS cityName, c.name AS streetName, d.number AS houseNumber
        FROM cards a
        LEFT JOIN cities b ON b.city_id = a.city_id
        LEFT JOIN streets c ON c.street_id = a.street_id
        LEFT JOIN houses d ON d.house_id = a.house_id
        WHERE
        (a.m_contract_number = ?) AND (m_duplicate = ?)
        LIMIT 1`, [prolongedContractNumber, isDuplicate],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          }
          else {
            resolve(rows[0]);
          }
        });
    });
  });
}

module.exports.PaymentsLogic = PaymentsLogic;