var moment = require('moment');
const path = require('path');
var fs = require('fs');
var db = require('../../lib/db');
var iconvlite = require('iconv-lite');

const { relativeTimeThreshold } = require('moment');
const { query } = require('express-validator/check');
const payments = require('../../router/web/docs/payments');
var RegisterModel = require('../../models/register').RegisterModel;
var PaymentModelForRegister = require('../../models/register').PaymentModelForRegister;
var ContractModelForRegister = require('../../models/register').ContractModelForRegister;
var PrintModelForRegister = require('../../models/register').PrintModelForRegister;
var DataModel = require('../../models/register').DataModel;
var buildPersonalAccount = require('../../lib/utils').buildPersonalAccount;
var decodeApartmentLetter = require('../../lib/utils').decodeApartmentLetter;
var firm = require('../../lib/firm_bank_details').firm;

function getPeriodFromRegister(id) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        'SELECT a.start_date AS startFrom, a.end_date AS endTo FROM registers a WHERE a.register_id = ?', [id],
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

function getDataFromCards(id) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        `SELECT f.number AS apartmentNumber, f.letter AS apartmentLetter,
        b.m_contract_number AS prolongedContractNumber, b.m_duplicate AS isDuplicate,
        CASE
          WHEN f.privilege = 0 THEN b.normal_payment
          WHEN f.privilege = 1 THEN b.privilege_payment
        END AS amount,
        c.name AS cityName, CONCAT(d.name, ' ', g.short_name) AS streetName, e.number AS houseNumber,
        MONTH(b.start_service) AS dateMonth, YEAR(b.start_service) AS dateYear
        FROM lists_registers a
        LEFT JOIN cards b ON b.card_id = a.card_id
        LEFT JOIN cities c ON c.city_id = b.city_id
        LEFT JOIN streets d ON d.street_id = b.street_id
        LEFT JOIN houses e ON e.house_id = b.house_id
        LEFT JOIN apartments f ON f.card_id = b.card_id
        LEFT JOIN street_types g on g.street_type_id = d.street_type_id
        WHERE (a.register_id = ?)
        ORDER BY b.card_id, f.number, f.letter`, [id, 0],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          }
          else {
            resolve(rows);
          }
        });
    });
  });
}

function getDataFromPayments(id) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        `SELECT c.number AS apartmentNumber, c.letter AS apartmentLetter,
        d.m_contract_number AS prolongedContractNumber, d.m_duplicate AS isDuplicate, b.amount,
        e.name AS cityName, f.name AS streetName, g.number AS houseNumber,
        MONTH(d.start_service) AS dateMonth, YEAR(d.start_service) AS dateYear
        FROM payments_for_register a
        LEFT JOIN payments b ON b.payment_id = a.payment_id
        LEFT JOIN apartments c ON c.apartment_id = b.apartment_id
        LEFT JOIN cards d ON d.card_id = c.card_id
        LEFT JOIN cities e ON e.city_id = d.city_id
        LEFT JOIN streets f ON f.street_id = d.street_id
        LEFT JOIN houses g ON g.house_id = d.house_id
        WHERE (a.register_id = ?)`, [id],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          }
          else {
            resolve(rows);
          }
        });
    });
  });
}

function RegistersLogic(req, res) {
  this.req = req;
  this.res = res;
}

RegistersLogic.prototype.addRegister = function () {
  let registerModel = new RegisterModel();
  registerModel.createDate = new Date();
  registerModel.startFrom = moment().startOf('month').toDate();
  registerModel.endTo = moment().endOf('month').toDate();
  return registerModel;
};

RegistersLogic.prototype.getRegister = async function () {
  var self = this;
  let id = this.req.params.id;

  let registerModel = new RegisterModel();
  await self.getRegisterBody(id)
    .then(function (result) {
      if (typeof result === 'object') {
        registerModel.id = result.id;
        registerModel.createDate = result.createDate;
        registerModel.startFrom = result.startDate;
        registerModel.endTo = result.endDate;
        registerModel.latestChange = result.lastModifyDate;
      }
    })
    .catch(function (error) {
      console.log(error);
    })

  await self.getOrdersTable(id)
    .then(function (result) {
      if (Array.isArray(result)) {
        result.forEach(function (item) {
          var model = new ContractModelForRegister();
          model.id = item.cardId;
          model.createDate = item.createDate;
          model.contractNumber = item.contractNumber;
          model.prolongedContractNumber = item.prolongedContractNumber;
          model.startService = item.startService;
          model.endService = item.endService;
          registerModel.contracts.push(model);
        })
      }
    })
    .catch(function (error) {
      console.log(error);
    })

    await self.getPaymentsTable(id)
    .then(function (result) {
      if (Array.isArray(result)) {
        result.forEach(function (item) {
          var model = new PaymentModelForRegister();
          model.id = item.id;
          model.payDate = item.payDate;
          model.prolongedContractNumber = item.prolongedContractNumber;
          model.address = item.address;
          model.apartment = item.apartment;
          model.amount = item.amount;
          registerModel.payments.push(model);
        })
      }
    })
    .catch(function (error) {
      console.log(error);
    })

  return registerModel;

};

RegistersLogic.prototype.getRegisterBody = function (id) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        `SELECT a.register_id AS id, a.create_date AS createDate, a.start_date AS startDate, a.end_date AS endDate, a.last_modify_date AS lastModifyDate
        FROM registers a
        WHERE a.register_id = ?`, [id],
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

RegistersLogic.prototype.getOrdersTable = function (parentId) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        `SELECT a.card_id AS cardId, b.create_date AS createDate, b.contract_number AS contractNumber,
        b.m_contract_number AS prolongedContractNumber, b.start_service AS startService,
        b.end_service AS endService
        FROM lists_registers a
        LEFT JOIN cards b ON b.card_id = a.card_id
        WHERE a.register_id = ?`, [parentId],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          }
          else {
            resolve(rows);
          }
        });
    });
  });
}

RegistersLogic.prototype.getPaymentsTable = function (parentId) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        `SELECT a.payment_id AS id, DATE_FORMAT(b.pay_date, '%d.%m.%Y') AS payDate, d.m_contract_number AS prolongedContractNumber,
        UCASE(CONCAT(e.name, ', ', f.name, ', ', g.number)) AS address,
        UCASE(CONCAT(c.number,
          CASE
           WHEN c.letter = 0 THEN ''
           WHEN c.letter = 1 THEN 'а'
           WHEN c.letter = 2 THEN 'б'
           WHEN c.letter = 3 THEN 'в'
           WHEN c.letter = 4 THEN 'г'
           WHEN c.letter = 5 THEN 'д'
           WHEN c.letter = 6 THEN 'е'
           WHEN c.letter = 7 THEN 'м'
           WHEN c.letter = 8 THEN 'з'
           WHEN c.letter = 9 THEN 'к'
          END)) AS apartment,
          b.amount
        FROM payments_for_register a
        LEFT JOIN payments b ON b.payment_id = a.payment_id
        LEFT JOIN apartments c ON c.apartment_id = b.apartment_id
        LEFT JOIN cards d ON d.card_id = c.card_id
        LEFT JOIN cities e ON e.city_id = d.city_id
        LEFT JOIN streets f ON f.street_id = d.street_id
        LEFT JOIN houses g ON g.house_id = d.house_id
        WHERE a.register_id = ?`, [parentId],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          }
          else {
            resolve(rows);
          }
        });
    });
  });
}

RegistersLogic.prototype.buildRegister = function (startFrom, endTo) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        `SELECT a.card_id AS id, a.create_date AS createDate, a.contract_number AS contractNumber,
        a.m_contract_number AS prolongedContractNumber, a.start_service AS startService,
        a.end_service AS endService
        FROM cards a
        WHERE ((a.receipt_printing >= ?) and (a.receipt_printing <= ?))`, [startFrom, endTo],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          }
          else {
            resolve(rows);
          }
        });
    });
  });
}

RegistersLogic.prototype.buildRegister2 = function (startFrom, endTo) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        `SELECT a.payment_id AS id, DATE_FORMAT(a.pay_date, '%d.%m.%Y') AS payDate, c.m_contract_number AS prolongedContractNumber,
        UCASE(CONCAT(d.name, ', ', e.name, ', ', f.number)) AS address,
        UCASE(CONCAT(b.number,
        CASE
         WHEN b.letter = 0 THEN ''
         WHEN b.letter = 1 THEN 'а'
         WHEN b.letter = 2 THEN 'б'
         WHEN b.letter = 3 THEN 'в'
         WHEN b.letter = 4 THEN 'г'
         WHEN b.letter = 5 THEN 'д'
         WHEN b.letter = 6 THEN 'е'
         WHEN b.letter = 7 THEN 'м'
         WHEN b.letter = 8 THEN 'з'
         WHEN b.letter = 9 THEN 'к'
        END)) AS apartment,
        a.amount
        FROM payments a
        LEFT JOIN apartments b ON b.apartment_id = a.apartment_id
        LEFT JOIN cards c ON c.card_id = b.card_id
        LEFT JOIN cities d ON d.city_id = c.city_id
        LEFT JOIN streets e ON e.street_id = c.street_id
        LEFT JOIN houses f ON f.house_id = c.house_id
        WHERE ((a.pay_date >= ?) AND (a.pay_date <= ?)) AND (a.is_registered = 1)`, [startFrom, endTo],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          }
          else {
            resolve(rows);
          }
        });
    });
  });
}

RegistersLogic.prototype.clearRegisterData = function (id) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        `DELETE FROM lists_registers WHERE register_id = ?`, [id],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          }
          else {
            resolve();
          }
        });
    });
  });
}

RegistersLogic.prototype.clearPaymentsForRegister = function (id) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        `DELETE FROM payments_for_register WHERE register_id = ?`, [id],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          }
          else {
            resolve();
          }
        });
    });
  });
}

RegistersLogic.prototype.updateRegister = function (id, startDate, endDate) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        `UPDATE registers SET last_modify_date = NOW(), start_date = ?, end_date = ?
        WHERE register_id = ?`, [startDate, endDate, id],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          }
          else {
            resolve();
          }
        });
    });
  });
}

RegistersLogic.prototype.createNewRegister = function (startDate, endDate) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        `INSERT INTO registers
        (create_date, start_date, end_date, last_modify_date, enable_registers, enable_fines)
        VALUES (NOW(), ?, ?, NOW(), ?, ?)
        `, [startDate, endDate, 1, 1],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          }
          else {
            resolve(rows.insertId);
          }
        });
    });
  });
}

RegistersLogic.prototype.insertRegisterData = function (data) {
  return new Promise(function (resolve, reject) {

    var query = [];
    data.contracts.forEach(function (item) {
      query.push(
        `INSERT INTO lists_registers (register_id, card_id) VALUES (${data.id}, ${item.id});`
      );
    })

    db.get().getConnection(function (err, connection) {
      connection.query(
        query.join(''), [],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          }
          else {
            resolve();
          }
        });
    });
  });
}

RegistersLogic.prototype.insertPaymentsForRegister = function (data) {
  return new Promise(function (resolve, reject) {

    if (data.payments.length > 0) {

      var query = [];
      data.payments.forEach(function (item) {
        query.push(
          `INSERT INTO payments_for_register (register_id, payment_id) VALUES (${data.id}, ${item.id});`
        );
      })

      db.get().getConnection(function (err, connection) {
        connection.query(
          query.join(''), [],
          function (err, rows) {
            connection.release();
            if (err) {
              reject();
            }
            else {
              resolve();
            }
          });
      });
    }
    else  {
      resolve();
    }
  });
}

RegistersLogic.prototype.validate = function () {
  var registerModel = new RegisterModel();
  registerModel.id = parseInt(this.req.body.id);
  registerModel.createDate = moment(this.req.body.createDate, 'DD.MM.YYYY').format('YYYY-MM-DD');
  registerModel.startFrom = ((this.req.body.startFrom != null) && (this.req.body.startFrom.trim().length > 0)) ? moment(this.req.body.startFrom, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;
  registerModel.endTo = ((this.req.body.endTo != null) && (this.req.body.endTo.trim().length > 0)) ? moment(this.req.body.endTo, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;
  registerModel.latestChange = ((this.req.body.latestChange != null) && (this.req.body.latestChange.trim().length > 0)) ? moment(this.req.body.latestChange, 'DD.MM.YYYY HH:mm').format('YYYY-MM-DD HH:mm') : null;

  // try {
  //   var rawData = JSON.parse(this.req.body.orders);
  //   if (Array.isArray(rawData)) {
  //     rawData.forEach(function (item) {
  //       var order = new ContractModelForRegister();
  //       order.id = item.id;
  //       order.createDate = item.createDate;
  //       order.contractNumber = item.contractNumber;
  //       order.prolongedContractNumber = item.prolongedContractNumber;
  //       order.startService = item.startService;
  //       order.endService = item.endService;
  //       registerModel.contracts.push(order);
  //     })
  //   }
  // } catch (error) {
  //   //
  // }

  try {
    registerModel.contracts = JSON.parse(this.req.body.orders);
    registerModel.payments = JSON.parse(this.req.body.payments);
  }
  catch (error) {
    //
  }

  // try {
  //   var rawData = JSON.parse(this.req.body.payments);
  //   if (Array.isArray(rawData)) {
  //     rawData.forEach(function (item) {
  //       var payment = new PaymentModelForRegister();
  //       payment.id = item.id;
  //       payment.prolongedContractNumber = item.prolongedContractNumber;
  //       payment.address = item.address;
  //       payment.apartment = item.apartment;
  //       payment.amount = item.amount;
  //       registerModel.payments.push(payment);
  //     })
  //   }
  // } catch (error) {
  //   //
  // }

  this.req.assert('startFrom', 'Дата <Период с> не заполнена').notEmpty();
  this.req.assert('endTo', 'Дата <Период по> не заполнена').notEmpty();
  this.req.assert('orders', 'Нет договоров').custom(function (data) {
    var result = false
    try {
      var orders = JSON.parse(data);
      result = (Array.isArray(orders) && (orders.length > 0));
    } catch (error) {

    }
    return result;
  });

  return registerModel;
}

RegistersLogic.prototype.save = async function (registerModel) {
  var self = this;

  if (registerModel.id > 0) {
    await self.clearRegisterData(registerModel.id);
    await self.clearPaymentsForRegister(registerModel.id);
    await self.updateRegister(registerModel.id, registerModel.startFrom, registerModel.endTo);
  }
  else {
    registerModel.id = await self.createNewRegister(registerModel.startFrom, registerModel.endTo);
  }
  await self.insertRegisterData(registerModel);
  await self.insertPaymentsForRegister(registerModel);

}

RegistersLogic.prototype.upload = function (id) {
  var self = this;

  var printModelForRegister = new PrintModelForRegister();
  var data = [];
  var dataFromPayments = [];

  getPeriodFromRegister(id)
    .then(function (period) {
      printModelForRegister.startFrom = moment(period.startFrom).format('YYYY-MM-DD');
      printModelForRegister.endTo = moment(period.endTo).format('YYYY-MM-DD');
      return getDataFromCards(id);
    })
    .then(function (dataFromCards) {
      data = [...dataFromCards];
      return getDataFromPayments(id);
    })
    .then(function (dataFromPayments) {
      data = [...data, ...dataFromPayments];

      data.forEach(function (item) {
        var dataModel = new DataModel();
        dataModel.personalAccount1 = buildPersonalAccount(item.isDuplicate, item.prolongedContractNumber, item.apartmentLetter, item.apartmentNumber);
        dataModel.personalAccount2 = buildPersonalAccount(item.isDuplicate, item.prolongedContractNumber, item.apartmentLetter, item.apartmentNumber);
        dataModel.fullAddress = `${item.cityName},${item.streetName},${item.houseNumber},${item.apartmentNumber}${decodeApartmentLetter(item.apartmentLetter)}`.toUpperCase();
        dataModel.monthAndYear = (item.dateMonth < 10 ? '0' : '') + item.dateMonth.toString() + (item.dateYear - 2000).toString();
        dataModel.amount = item.amount.toFixed(2).replace('.', ',');
        printModelForRegister.data.push(`${dataModel.personalAccount1};${dataModel.personalAccount2};${dataModel.fullAddress};${dataModel.monthAndYear};${dataModel.amount}\n`);
      });

      let fileName = `${firm.newCategory}_${moment(new Date()).format('DDMMYY')}.txt`;

      self.res.setHeader('Content-disposition', 'attachment; filename="' + fileName + '"');
      self.res.setHeader('Content-type', 'application/txt');

      var absPath = path.join(__dirname, '../../public/downloads/' + fileName);
      // let absPath = path.join(__dirname, '/my_files/', filename);
      let relPath = path.join('./public/downloads', fileName); // path relative to server root

      // convert text from utf8 to 1251
      var content = printModelForRegister.data.join('');
      var buffer = Buffer.from(content, 'utf8');
      var content = iconvlite.encode(buffer, 'cp1251');

      fs.writeFile(absPath, content, (err) => {
      // fs.writeFile(absPath, printModelForRegister.data.join(''), (err) => {
        if (err) {
          console.log(err);
        }
        self.res.download(absPath, (err) => {
          if (err) {
            console.log(err);
          }
          fs.unlink(relPath, (err) => {
            if (err) {
              console.log(err);
            }
            console.log('FILE [' + fileName + '] REMOVED!');
          });
        });
      });

    })
    .catch(function (error) {
      console.log(error.message);
    });



}

module.exports.RegistersLogic = RegistersLogic;