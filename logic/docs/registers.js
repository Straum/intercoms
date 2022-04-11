const moment = require('moment');
const path = require('path');
const fs = require('fs');
const { promises } = require('fs');
const iconvlite = require('iconv-lite');
const db = require('../../lib/db');

const { RegisterModel } = require('../../models/register');
const { PaymentModelForRegister } = require('../../models/register');
const { ContractModelForRegister } = require('../../models/register');
const { PrintModelForRegister } = require('../../models/register');
const { DataModel } = require('../../models/register');
const { DataModel2022 } = require('../../models/register');
const { buildPersonalAccount, buildPersonalAccountForFine } = require('../../lib/utils');
const { decodeApartmentLetter } = require('../../lib/utils');
const { firm } = require('../../lib/firm_bank_details');

function getPeriodFromRegister(id) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        'SELECT a.start_date AS startFrom, a.end_date AS endTo, a.new_method AS newMethod FROM registers a WHERE a.register_id = ?', [id],
        (error, rows) => {
          connection.release();
          if (error) {
            reject();
          } else {
            resolve(rows[0]);
          }
        },
      );
    });
  });
}

function getDataFromCards(id) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
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
        (error, rows) => {
          connection.release();
          if (error) {
            reject();
          } else {
            resolve(rows);
          }
        },
      );
    });
  });
}

function getDataFromPayments(id) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
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
        (error, rows) => {
          connection.release();
          if (error) {
            reject();
          } else {
            resolve(rows);
          }
        },
      );
    });
  });
}

function pullOutOrders(id) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        `SELECT a.card_id AS id, b.m_duplicate AS isDuplicate,
        b.m_contract_number AS prolongedContractNumber,
        c.name AS cityName, CONCAT(d.name, ' ', g.short_name) AS streetName, e.number AS houseNumber,
        MONTH(b.start_service) AS dateMonth, YEAR(b.start_service) AS dateYear
        FROM lists_registers a
        LEFT JOIN cards b ON b.card_id = a.card_id
        LEFT JOIN cities c ON c.city_id = b.city_id
        LEFT JOIN streets d ON d.street_id = b.street_id
        LEFT JOIN houses e ON e.house_id = b.house_id
        LEFT JOIN street_types g on g.street_type_id = d.street_type_id
        WHERE a.register_id = ?`, [id],
        (error, rows) => {
          connection.release();
          if (error) {
            reject();
          } else {
            resolve(rows);
          }
        },
      );
    });
  });
}

function pullAllOrders() {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        `SELECT b.card_id AS id, b.m_duplicate AS isDuplicate,
        b.contract_number AS contractNumber,
        b.m_contract_number AS prolongedContractNumber,
        c.name AS cityName, d.name AS streetName, e.number AS houseNumber,
        MONTH(b.start_service) AS dateMonth, YEAR(b.start_service) AS dateYear,
        b.rank
        FROM cards b
        LEFT JOIN cities c ON c.city_id = b.city_id
        LEFT JOIN streets d ON d.street_id = b.street_id
        LEFT JOIN houses e ON e.house_id = b.house_id
        WHERE (b.maintenance_contract >= 1)
        ORDER BY b.rank`, [],
        (error, rows) => {
          connection.release();
          if (error) {
            reject();
          } else {
            resolve(rows);
          }
        },
      );
    });
  });
}

function calculateApartments(id) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        `SELECT apartment_id AS apartmentId, number, letter, privilege, exempt, locked,
         for_payment AS forPayment, debt
         FROM apartments
        WHERE card_id = ?
        ORDER BY number, letter`, [id],
        (error, rows) => {
          connection.release();
          if (error) {
            // eslint-disable-next-line no-console
            console.log(err.message);
            reject();
          } else {
            resolve(rows);
          }
        },
      );
    });
  });
}

function pullFines() {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        `SELECT a.fine_id AS id, a.amount_of_fine AS amount,
        b.letter, b.number,
        d.name AS cityName, e.name AS streetName, f.number AS houseNumber,
        MONTH(a.create_dt) AS dateMonth, YEAR(a.create_dt) AS dateYear
        FROM fines a
        LEFT JOIN apartments b ON b.apartment_id = a.apartment_id
        LEFT JOIN cards c ON c.card_id = b.card_id
        LEFT JOIN cities d ON d.city_id = c.city_id
        LEFT JOIN streets e ON e.street_id = c.street_id
        LEFT JOIN houses f ON f.house_id = c.house_id
        WHERE (a.old_fine = 0) && (a.paid = 0) && (a.is_deleted = 0)
        ORDER BY a.create_dt`, [],
        (error, rows) => {
          connection.release();
          if (error) {
            reject();
          } else {
            resolve(rows);
          }
        },
      );
    });
  });
}

function RegistersLogic(req, res) {
  this.req = req;
  this.res = res;
}

RegistersLogic.prototype.addRegister = function () {
  const registerModel = new RegisterModel();
  registerModel.createDate = new Date();
  registerModel.startFrom = new Date(); // moment().startOf('month').toDate();

  switch (registerModel.startFrom.getDay()) {
    case 5:
      registerModel.endTo = moment(registerModel.startFrom).add(2, 'days');
      break;
    case 6:
      registerModel.endTo = moment(registerModel.startFrom).add(1, 'days');
      break;
    default:
      registerModel.endTo = new Date();
  }

  registerModel.newMethod = true;
  return registerModel;
};

RegistersLogic.prototype.getRegister = async function () {
  const self = this;
  const { id } = this.req.params;

  const registerModel = new RegisterModel();
  await self.getRegisterBody(id)
    .then(function (result) {
      if (typeof result === 'object') {
        registerModel.id = result.id;
        registerModel.createDate = result.createDate;
        registerModel.startFrom = result.startDate;
        registerModel.endTo = result.endDate;
        registerModel.latestChange = result.lastModifyDate;
        registerModel.newMethod = result.newMethod;
      }
    })
    .catch(function (error) {
      console.log(error);
    });

  await self.getOrdersTable(id)
    .then(function (result) {
      if (Array.isArray(result)) {
        result.forEach(function (item) {
          const model = new ContractModelForRegister();
          model.id = item.cardId;
          model.createDate = item.createDate;
          model.contractNumber = item.contractNumber;
          model.prolongedContractNumber = item.prolongedContractNumber;
          model.startService = item.startService;
          model.endService = item.endService;
          registerModel.contracts.push(model);
        });
      }
    })
    .catch(function (error) {
      console.log(error);
    });

  await self.getPaymentsTable(id)
    .then(function (result) {
      if (Array.isArray(result)) {
        result.forEach(function (item) {
          const model = new PaymentModelForRegister();
          model.id = item.id;
          model.payDate = item.payDate;
          model.prolongedContractNumber = item.prolongedContractNumber;
          model.address = item.address;
          model.apartment = item.apartment;
          model.amount = item.amount;
          registerModel.payments.push(model);
        });
      }
    })
    .catch(function (error) {
      console.log(error);
    });

  return registerModel;
};

RegistersLogic.prototype.getRegisterBody = function (id) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        `SELECT a.register_id AS id, a.create_date AS createDate, a.start_date AS startDate,
        a.end_date AS endDate, a.last_modify_date AS lastModifyDate, a.new_method AS newMethod
        FROM registers a
        WHERE a.register_id = ?`, [id],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          } else {
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
          } else {
            resolve(rows);
          }
        },
      );
    });
  });
};

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
          } else {
            resolve(rows);
          }
        },
      );
    });
  });
};

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
          } else {
            resolve(rows);
          }
        },
      );
    });
  });
};

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
          } else {
            resolve(rows);
          }
        },
      );
    });
  });
};

RegistersLogic.prototype.clearRegisterData = function (id) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        'DELETE FROM lists_registers WHERE register_id = ?', [id],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          } else {
            resolve();
          }
        },
      );
    });
  });
};

RegistersLogic.prototype.clearPaymentsForRegister = function (id) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        'DELETE FROM payments_for_register WHERE register_id = ?', [id],
        function (err) {
          connection.release();
          if (err) {
            reject();
          } else {
            resolve();
          }
        },
      );
    });
  });
};

RegistersLogic.prototype.updateRegister = function (model) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        `UPDATE registers SET last_modify_date = NOW(), start_date = ?, end_date = ?, new_method = ?
        WHERE register_id = ?`, [model.startFrom, model.endTo, model.newMethod, model.id],
        function (err) {
          connection.release();
          if (err) {
            reject();
          } else {
            resolve();
          }
        },
      );
    });
  });
};

RegistersLogic.prototype.createNewRegister = function (model) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        `INSERT INTO registers
        (create_date, start_date, end_date, last_modify_date, enable_registers, enable_fines, new_method)
        VALUES (NOW(), ?, ?, NOW(), ?, ?, ?)
        `, [model.startFrom, model.endTo, 1, 1, model.newMethod],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          } else {
            resolve(rows.insertId);
          }
        },
      );
    });
  });
};

RegistersLogic.prototype.insertRegisterData = function (data) {
  return new Promise(function (resolve, reject) {

    const query = [];
    data.contracts.forEach(function (item) {
      query.push(
        `INSERT INTO lists_registers (register_id, card_id) VALUES (${data.id}, ${item.id});`,
      );
    });

    db.get().getConnection(function (err, connection) {
      connection.query(
        query.join(''), [],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          } else {
            resolve();
          }
        },
      );
    });
  });
};

RegistersLogic.prototype.insertPaymentsForRegister = function (data) {
  return new Promise(function (resolve, reject) {
    if (data.payments.length > 0) {
      const query = [];
      data.payments.forEach(function (item) {
        query.push(
          `INSERT INTO payments_for_register (register_id, payment_id) VALUES (${data.id}, ${item.id});`,
        );
      });

      db.get().getConnection(function (err, connection) {
        connection.query(
          query.join(''), [],
          function (err, rows) {
            connection.release();
            if (err) {
              reject();
            } else {
              resolve();
            }
          },
        );
      });
    } else {
      resolve();
    }
  });
};

RegistersLogic.prototype.validate = function () {
  const registerModel = new RegisterModel();
  registerModel.id = parseInt(this.req.body.id, 10);
  registerModel.createDate = moment(this.req.body.createDate, 'DD.MM.YYYY').format('YYYY-MM-DD');
  registerModel.startFrom = ((this.req.body.startFrom != null) && (this.req.body.startFrom.trim().length > 0)) ? moment(this.req.body.startFrom, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;
  registerModel.endTo = ((this.req.body.endTo != null) && (this.req.body.endTo.trim().length > 0)) ? moment(this.req.body.endTo, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;
  registerModel.latestChange = ((this.req.body.latestChange != null) && (this.req.body.latestChange.trim().length > 0)) ? moment(this.req.body.latestChange, 'DD.MM.YYYY HH:mm').format('YYYY-MM-DD HH:mm') : null;
  registerModel.newMethod = this.req.body.newMethod === 'on' ? 1 : 0;

  try {
    registerModel.contracts = JSON.parse(this.req.body.orders);
    registerModel.payments = JSON.parse(this.req.body.payments);
  } catch (error) {
    //
  }
  this.req.assert('startFrom', 'Дата <Период с> не заполнена').notEmpty();
  this.req.assert('endTo', 'Дата <Период по> не заполнена').notEmpty();
  this.req.assert('orders', 'Нет договоров').custom(function (data) {
    let result = false;
    try {
      const orders = JSON.parse(data);
      result = (Array.isArray(orders) && (orders.length > 0));
    } catch (error) {
      //
    }
    return result;
  });

  return registerModel;
};

RegistersLogic.prototype.save = async function (registerModel) {
  const self = this;

  if (registerModel.id > 0) {
    await self.clearRegisterData(registerModel.id);
    await self.clearPaymentsForRegister(registerModel.id);
    await self.updateRegister(registerModel);
  } else {
    registerModel.id = await self.createNewRegister(registerModel);
  }
  await self.insertRegisterData(registerModel);
  await self.insertPaymentsForRegister(registerModel);
};

// RegistersLogic.prototype.upload = function (id) {
//   const self = this;
//
//   const printModelForRegister = new PrintModelForRegister();
//   let data = [];
//
//   getPeriodFromRegister(id)
//     .then(function (period) {
//       printModelForRegister.startFrom = moment(period.startFrom).format('YYYY-MM-DD');
//       printModelForRegister.endTo = moment(period.endTo).format('YYYY-MM-DD');
//       return getDataFromCards(id);
//     })
//     .then(function (dataFromCards) {
//       data = [...dataFromCards];
//       return getDataFromPayments(id);
//     })
//     .then(function (dataFromPayments) {
//       data = [...data, ...dataFromPayments];
//
//       data.forEach(function (item) {
//         const dataModel = new DataModel();
//         dataModel.personalAccount1 = buildPersonalAccount(item.isDuplicate, item.prolongedContractNumber, item.apartmentLetter, item.apartmentNumber);
//         dataModel.personalAccount2 = buildPersonalAccount(item.isDuplicate, item.prolongedContractNumber, item.apartmentLetter, item.apartmentNumber);
//         dataModel.fullAddress = `${item.cityName},${item.streetName},${item.houseNumber},${item.apartmentNumber}${decodeApartmentLetter(item.apartmentLetter)}`.toUpperCase();
//         dataModel.monthAndYear = (item.dateMonth < 10 ? '0' : '') + item.dateMonth.toString() + (item.dateYear - 2000).toString();
//         dataModel.amount = item.amount.toFixed(2).replace('.', ',');
//         printModelForRegister.data.push(`${dataModel.personalAccount1};${dataModel.personalAccount2};${dataModel.fullAddress};${dataModel.monthAndYear};${dataModel.amount}\n`);
//       });
//
//       const fileName = `${firm.newCategory}_${moment(new Date()).format('DDMMYY')}.txt`;
//
//       self.res.setHeader('Content-disposition', `attachment; filename="${fileName}"`);
//       self.res.setHeader('Content-type', 'application/txt');
//
//       const absPath = path.join(__dirname, `../../public/downloads/${fileName}`);
//       // let absPath = path.join(__dirname, '/my_files/', filename);
//       const relPath = path.join('./public/downloads', fileName); // path relative to server root
//
//       // convert text from utf8 to 1251
//       let content = printModelForRegister.data.join('');
//       const buffer = Buffer.from(content, 'utf8');
//       content = iconvlite.encode(buffer, 'cp1251');
//
//       fs.writeFile(absPath, content, (err) => {
//         // fs.writeFile(absPath, printModelForRegister.data.join(''), (err) => {
//         if (err) {
//           console.log(err);
//         }
//         self.res.download(absPath, (err) => {
//           if (err) {
//             console.log(err);
//           }
//           fs.unlink(relPath, (err) => {
//             if (err) {
//               console.log(err);
//             }
//             console.log(`FILE [${fileName}] REMOVED!`);
//           });
//         });
//       });
//     })
//     .catch(function (error) {
//       console.log(error.message);
//     });
// };
//
// RegistersLogic.prototype.upload2 = async function (id) {
//   const self = this;
//
//   const printModelForRegister = new PrintModelForRegister();
//
//   try {
//     const period = await getPeriodFromRegister(id);
//     printModelForRegister.startFrom = moment(period.startFrom).format('YYYY-MM-DD');
//     printModelForRegister.endTo = moment(period.endTo).format('YYYY-MM-DD');
//     printModelForRegister.newMethod = period.newMethod;
//
//     if (printModelForRegister.newMethod === 1) {
//
//       const ordersList = await pullOutOrders(id);
//       for (let order of ordersList) {
//         await calculateApartments(order.id).then((data) => {
//           if (Array.isArray(data)) {
//             data.forEach((item) => {
//               if (item.exempt === 0) {
//                 var dataModel = new DataModel();
//                 dataModel.personalAccount1 = buildPersonalAccount(order.isDuplicate, order.prolongedContractNumber, item.letter, item.number);
//                 dataModel.personalAccount2 = buildPersonalAccount(order.isDuplicate, order.prolongedContractNumber, item.letter, item.number);
//                 dataModel.fullAddress = `${order.cityName},${order.streetName},${order.houseNumber},${item.number}${decodeApartmentLetter(item.letter)}`.toUpperCase();
//                 dataModel.monthAndYear = (order.dateMonth < 10 ? '0' : '') + order.dateMonth.toString() + (order.dateYear - 2000).toString();
//                 const amount = item.payment + (item.debt > 0 ? item.debt : 0);
//                 dataModel.amount = amount.toFixed(2).replace('.', ',');
//                 printModelForRegister.data.push(`${dataModel.personalAccount1};${dataModel.personalAccount2};${dataModel.fullAddress};${dataModel.monthAndYear};${dataModel.amount}\n`);
//               }
//             });
//           }
//         });
//       }
//
//       const fileName = `${firm.newCategory}_${moment(new Date()).format('DDMMYY')}.txt`;
//
//       self.res.setHeader('Content-disposition', 'attachment; filename="' + fileName + '"');
//       self.res.setHeader('Content-type', 'application/txt');
//
//       var absPath = path.join(__dirname, '../../public/downloads/' + fileName);
//       let relPath = path.join('./public/downloads', fileName);
//
//       var content = printModelForRegister.data.join('');
//       var buffer = Buffer.from(content, 'utf8');
//       var content = iconvlite.encode(buffer, 'cp1251');
//
//       fs.writeFile(absPath, content, (err) => {
//         if (err) {
//           console.log(err);
//         }
//         self.res.download(absPath, (err) => {
//           if (err) {
//             console.log(err);
//           }
//           fs.unlink(relPath, (err) => {
//             if (err) {
//               console.log(err);
//             }
//             console.log(`FILE [${fileName}] REMOVED!`);
//           });
//         });
//       });
//     } else {
//       this.upload(id);
//     }
//   } catch (error) {
//     console.log(error.message);
//   };
// };

RegistersLogic.prototype.build = async function () {
  const self = this;

  const printModelForRegister = new PrintModelForRegister();

  const ordersList = await pullAllOrders();
  const ordersListLength = ordersList.length;
  console.log('ordersList.length = ', ordersListLength);
  let ind = 0;
  const dataModel = new DataModel2022();
  for (const order of ordersList) {
    ind += 1;
    console.log(`Обработано ${ind} из ${ordersListLength}`);
    const data = await calculateApartments(order.id);
    if (Array.isArray(data)) {
      data.forEach((item) => {
        if (item.exempt === 0) {
          const balance = 0;
          const amount = item.forPayment + item.debt;

          // const dataModel = new DataModel2022();
          if (order.rank === 0) {
            dataModel.personalAccount = buildPersonalAccount(
              order.isDuplicate,
              order.prolongedContractNumber,
              item.letter,
              item.number,
            );
          } else {
            dataModel.personalAccount = buildPersonalAccount(
              5,
              `${order.contractNumber}`,
              item.letter,
              item.number,
            );
          }
          dataModel.fullAddress = `${order.cityName},${order.streetName},${order.houseNumber},${item.number}${decodeApartmentLetter(item.letter)}`.toUpperCase();
          dataModel.monthAndYear = `${order.dateMonth.toString().padStart(2, '0')}${order.dateYear - 2000}`;
          dataModel.balance = balance.toFixed(2).replace('.', ',');
          dataModel.amount = amount.toFixed(2).replace('.', ',');
          printModelForRegister.data.push(`${dataModel.personalAccount};${dataModel.els};${dataModel.fias};${dataModel.fullName};${dataModel.fullAddress};${dataModel.monthAndYear};${dataModel.amount}\n`);
        }
      });
    }
  }

  const finesList = await pullFines();
  finesList.forEach((item) => {
    dataModel.personalAccount = buildPersonalAccountForFine(7, item.id);
    dataModel.fullAddress = `${item.cityName},${item.streetName},${item.houseNumber},${item.number}${decodeApartmentLetter(item.letter)}`.toUpperCase();
    dataModel.monthAndYear = `${item.dateMonth.toString().padStart(2, '0')}${item.dateYear - 2000}`;
    dataModel.amount = item.amount.toFixed(2).replace('.', ',');
    printModelForRegister.data.push(`${dataModel.personalAccount};${dataModel.els};${dataModel.fias};${dataModel.fullName};${dataModel.fullAddress};${dataModel.monthAndYear};${dataModel.amount}\n`);
  });

  const filePath = path.join(__dirname, '../../public/store/counter.json');
  const rawData = await promises.readFile(filePath);
  const data = JSON.parse(rawData.toString());
  const innerCounter = data.counter;

  const fileName = `${firm.INN}_${firm.personalAcc}_${firm.category}_${innerCounter.toString().padStart(3, '0')}.txt`;
  // const fileName = `${firm.newCategory}_${moment(new Date()).format('DDMMYY')}.txt`;

  self.res.setHeader('Content-disposition', 'attachment; filename="' + fileName + '"');
  self.res.setHeader('Content-type', 'application/txt');

  const absPath = path.join(__dirname, '../../public/downloads/' + fileName);
  const relPath = path.join('./public/downloads', fileName); // path relative to server root

  let content = printModelForRegister.data.join('');
  const buffer = Buffer.from(content, 'utf8');
  content = iconvlite.encode(buffer, 'cp1251');

  fs.writeFile(absPath, content, (err) => {
    if (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }
    self.res.download(absPath, (error) => {
      if (error) {
        // eslint-disable-next-line no-console
        console.log(error);
      }
      fs.unlink(relPath, (err1) => {
        if (err1) {
          // eslint-disable-next-line no-console
          console.log(err1);
        }
        // eslint-disable-next-line no-console
        console.log(`FILE [${fileName}] REMOVED!`);
      });
    });
  });

  data.counter = innerCounter + 1;
  await promises.writeFile(filePath, JSON.stringify(data));
};

module.exports.RegistersLogic = RegistersLogic;
