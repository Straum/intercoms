const path = require('path');
const express = require('express');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

const db = require('../../../lib/db');
const cfg = require('../../../lib/config').config;

const utils = require('../../../lib/utils');
const order = require('../../../lib/order_service');
const queryOrder = require('../../../queries/orders').getOrder;
const queryDeleteExistsApartments = require('../../../queries/orders').deleteExistsApartments;
const { OrderModel } = require('../../../models/order');
const models = require('../../../models/order');
const { PrintOrderReceipts } = require('../../reports/order_receipts/print_order_receipts');
const { hostIP, hostPort } = require('../../../lib/config').config;
const { ClientModel } = require('../../../models/client');
const common = require('../../common/typeheads');
const operationsWithClient = require('../../common/operations_with_client');
const apartment = require('../../common/apartments');
const logger = require('../../../lib/winston');

const sp = require('../../common/stored_procedures');

require('shelljs/global');

const isExistsContractNumber = (contractNumber) => new Promise((resolve, reject) => {
  db.get().getConnection((err, connection) => {
    connection.query(
      'SELECT a.card_id AS uid FROM cards a WHERE a.contract_number = ?', [contractNumber],
      (error, rows) => {
        connection.release();
        if (error) {
          reject();
        } else {
          resolve(rows.length > 0 ? rows[0].uid : null);
        }
      },
    );
  });
});

function apartmentInfo(apartmentId) {
  logger.info('call from addPayment()');
  return new Promise((resolve, reject) => {
    db.get()
      .getConnection((err, connection) => {
        connection.query('CALL apartment_info(?)', [apartmentId],
          (error, rows) => {
            connection.release();
            if (error) {
              reject();
            } else {
              resolve({ ...rows[0][0] });
            }
          });
      });
  });
}

function addPayment(data) {
  logger.info('call from addPayment()');
  logger.info(`CALL enter_payment_depth_2_year("${data.personalAccount}","${data.number}","${data.letter}","${data.payDate}",${data.amount},${data.payMonth},${data.payYear},"${data.fileName}","${data.transaction}","${data.zipCode}",${data.mode}),0,0`);
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        // 'CALL enter_payment_depth_2_year(?,?,?,?,?,?,?,?,?,?,?,?,?)', [
        'CALL enter_payment(?,?,?,?,?,?,?,?,?,?,?)', [
          data.personalAccount,
          data.number,
          data.letter,
          data.payDate,
          data.amount,
          data.payMonth,
          data.payYear,
          data.fileName,
          data.transaction,
          data.zipCode,
          data.mode,
        ],
        (error, rows) => {
          connection.release();
          if (error) {
            reject();
          } else {
            resolve(rows[0][0].newPaymentId);
          }
        },
      );
    });
  });
}

function getOrderIdFromApartment(apartmentId) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        'SELECT card_id AS cardId FROM apartments WHERE apartment_id = ?', [apartmentId],
        (error, rows) => {
          connection.release();
          if (error) {
            reject();
          } else {
            resolve((Array.isArray(rows) && rows.length === 1) ? rows[0].cardId : null);
          }
        },
      );
    });
  });
}

function generatePersonalAccount(data) {
  const FIELD_CONTRACT_LENGTH = 6;
  const out = [];

  let outContractNumber = '';
  let rps = 0;
  if (data.rank === 0) {
    rps = FIELD_CONTRACT_LENGTH - (data.prolongedContractNumber.trim().length);
    outContractNumber = (rps > 0 ? '0'.repeat(rps) : '') + data.prolongedContractNumber.trim();
  }
  if (data.rank === 1) {
    outContractNumber = `${data.contractNumber}`.trim().padStart(FIELD_CONTRACT_LENGTH, '0');
  }

  rps = (3 - data.apartmentNumber.toString().trim().length);
  const outApartment = (rps > 0 ? '0'.repeat(rps) : '') + data.apartmentNumber.toString().trim();

  out.push(data.isDuplicate ? '1' : '0');
  out.push(outContractNumber);
  out.push('_');
  out.push(data.letter.toString());
  out.push(outApartment);

  return out.join('');
}

function checkCurrentPeriod(orderId) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        'CALL check_current_period(?)', [orderId],
        (error) => {
          connection.release();
          if (error) {
            reject();
          } else {
            resolve();
          }
        },
      );
    });
  });
}

function checkPreviousPeriod(orderId) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        'CALL check_previous_period(?)', [orderId],
        (error) => {
          connection.release();
          if (error) {
            reject();
          } else {
            resolve();
          }
        },
      );
    });
  });
}

function printingReceipts(orderId, res) {
  const printOrderReceipts = new PrintOrderReceipts(orderId, res);
  printOrderReceipts.go().then();
}

function getApartmentInfo(id) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        `SELECT a.number AS apartmentNumber, a.letter,
        b.contract_number AS contractNumber, b.m_contract_number AS prolongedContractNumber,
        b.m_duplicate AS isDuplicate, b.rank FROM apartments a
        LEFT JOIN cards b ON b.card_id = a.card_id
        WHERE a.apartment_id = ? LIMIT 1`, [id],
        (error, rows) => {
          connection.release();
          if (error) {
            reject();
          } else {
            resolve((Array.isArray(rows) && rows.length === 1) ? {
              ...rows[0],
            } : null);
          }
        },
      );
    });
  });
}

function getPayments(id) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        `SELECT
        a.payment_id AS uid,
        a.create_date AS createDate,
        a.pay_month AS payMonth,
        a.pay_year AS payYear,
        a.pay_date AS payDate,
        a.amount,
        a.mode,
        a.privilege,
        a.is_fragmented AS isFragmented,
        a.original_amount AS originalAmount,
        a.original_pay_date AS originalPayDate,
        b.name as organizationName
        FROM payments a
        LEFT JOIN organizations b ON b.organization_id = a.mode
        WHERE
        (a.is_deleted = 0)
        AND (a.is_registered = 0)
        AND (a.apartment_id = ?)
        ORDER BY
        a.pay_date DESC, payment_id DESC`, [id],
        (error, rows) => {
          connection.release();
          if (error) {
            reject(err);
          } else {
            resolve(rows);
          }
        },
      );
    });
  });
}

function getFines(id) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        `SELECT
          a.fine_id AS uid,
          a.create_dt AS createDate,
          a.amount_of_fine AS amount,
          a.remark,
          a.paid
          FROM fines a
          WHERE
          a.is_deleted = 0 AND a.paid = 1 AND a.apartment_id = ?
          ORDER BY
          a.create_dt DESC`, [id],
        (error, rows) => {
          connection.release();
          if (error) {
            reject(error);
          } else {
            resolve(rows);
          }
        },
      );
    });
  });
}

function getPrices(id) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        `SELECT
        DISTINCT a.start_service AS startService,
        a.end_service AS endService,
        a.normal_payment AS normalPayment,
        a.privilege_payment As privilegePayment,
        a.receipt_printing AS receiptPrinting
        FROM
        cards_history a
        INNER JOIN apartments b ON b.card_id = a.card_id
        WHERE
        b.apartment_id = ?
        ORDER BY a.start_service DESC`, [id],
        (error, rows) => {
          connection.release();
          if (error) {
            reject(error);
          } else {
            resolve(rows);
          }
        },
      );
    });
  });
}

function getPaymentOptions() {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        `
        SELECT a.organization_id AS id, a.name AS description
        FROM organizations a
        WHERE
        a.for_receipt > 0
        ORDER BY a.for_receipt ASC`, [],
        function (err, rows) {
          connection.release();
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
    });
  });
}

function updateOrder(data) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' UPDATE cards SET ' +
        ' contract_number = ?,' +
        ' create_date = ?,' +
        ' equipment_id = ?,' +
        ' end_contract = ?,' +
        ' credit_to = ?,' +
        ' repaid = ?,' +
        ' city_id = ?,' +
        ' street_id = ?,' +
        ' house_id = ?,' +
        ' porch = ?,' +
        ' numeration = ?,' +
        ' client_id = ?,' +
        ' is_one_person = ?,' +
        ' m_client_id = ?,' +
        ' m_contract_number = ?,' +
        ' start_service = ?,' +
        ' end_service = ?,' +
        ' m_prolongation = ?,' +
        ' maintenance_contract = ?,' +
        ' m_start_apartment = ?,' +
        ' m_end_apartment = ?,' +
        ' normal_payment = ?,' +
        ' privilege_payment = ?,' +
        ' receipt_printing = ?,' +
        ' contract_info = ?,' +
        ' service_info = ?,' +
        ' equipment_quantity = ?,' +
        ' equipment_price = ?,' +
        ' equipment_cost = ?,' +
        ' mounting_quantity = ?,' +
        ' mounting_price = ?,' +
        ' mounting_cost = ?,' +
        ' subscriber_unit_quantity = ?,' +
        ' subscriber_unit_price = ?,' +
        ' subscriber_unit_cost = ?,' +
        ' key_quantity = ?,' +
        ' key_price = ?,' +
        ' key_cost = ?,' +
        ' door_quantity = ?,' +
        ' door_price = ?,' +
        ' door_cost = ?,' +
        ' subtotal = ?,' +
        ' subtotal_for_apartment = ?,' +
        ' discount_for_apartment = ?,' +
        ' total = ?,' +
        ' first_year = ?' +
        ' WHERE card_id = ?', [
        data.contractNumber,
        data.createDate,
        data.equipment.key,
        data.endContract,
        data.creditTo,
        data.repaid,
        data.address.city.key,
        data.address.street.key,
        data.address.house.key,
        data.porch,
        data.numeration,
        data.client.contract.key,
        data.onePerson,
        data.client.service.key,
        data.serviceNumber,
        data.startService,
        data.endService,
        data.endService,
        data.maintenanceContract,
        data.startApartment,
        data.endApartment,
        data.normalPayment,
        data.privilegePayment,
        data.receiptPrinting,
        data.contractInfo,
        data.serviceInfo,
        data.complete.equipment.quantity,
        data.complete.equipment.price,
        data.complete.equipment.cost,
        data.complete.mounting.quantity,
        data.complete.mounting.price,
        data.complete.mounting.cost,
        data.complete.subscriberUnit.quantity,
        data.complete.subscriberUnit.price,
        data.complete.subscriberUnit.cost,
        data.complete.key.quantity,
        data.complete.key.price,
        data.complete.key.cost,
        data.complete.door.quantity,
        data.complete.door.price,
        data.complete.door.cost,
        data.complete.subtotal.cost,
        data.complete.subtotalForApartment.cost,
        data.complete.discountForApartment.cost,
        data.complete.total.cost,
        data.firstYear,
        data.id
      ],
        function (err) {
          connection.release();
          if (err) {
            reject();
          } else {
            resolve();
          }
        });
    });
  });
}

function deleteExistsApartments(data) {
  return new Promise(function (resolve, reject) {
    if ((data.id > 0) && (data.apartments.isRebuilt)) {
      db.get().getConnection(function (err, connection) {
        connection.query(queryDeleteExistsApartments, [data.id], function (err) {
          connection.release();
          if (err) {
            reject();
          } else {
            resolve();
          }
        });
      });
    } else {
      resolve();
    }
  });
}

function insertApartments(data) {
  return new Promise(function (resolve, reject) {
    var apartments = data.apartments.table;
    if (Array.isArray(apartments) && (apartments.length > 0) && (data.apartments.isRebuilt)) {
      var queries = '';
      apartments.forEach(function (item) {
        queries += 'INSERT INTO apartments (number, letter, paid, privilege, exempt, locked, card_id) VALUES (' +
          item.number + ', ' +
          item.letter + ', ' +
          item.paid + ', ' +
          item.privilege + ', ' +
          item.exempt + ', ' +
          item.locked + ', ' +
          data.id + ');';
      });

      db.get().getConnection(function (err, connection) {
        connection.query(queries, [], function (err) {
          connection.release();
          if (err) {
            reject();
          } else {
            resolve();
          }
        });
      });
    } else {
      resolve();
    }
  });
}

function updateApartments(data) {
  return new Promise(function (resolve, reject) {

    var queries = '';

    var existingApartments = data.apartments.table;
    if (Array.isArray(existingApartments) && (existingApartments.length > 0)) {
      existingApartments.forEach(function (item) {
        if (Number(item.uid) > 0) {
          queries += 'UPDATE apartments SET number = ' + item.number +
            ', letter = ' + item.letter +
            ', paid = ' + item.paid +
            ', privilege = ' + item.privilege +
            ', exempt = ' + item.exempt +
            ', locked = ' + item.locked +
            ' WHERE apartment_id = ' + item.uid + ';';
        } else {
          queries += 'INSERT INTO apartments (number, letter, paid, privilege, exempt, locked, card_id) VALUES (' +
            item.number + ', ' +
            item.letter + ', ' +
            item.paid + ', ' +
            item.privilege + ', ' +
            item.exempt + ', ' +
            item.locked + ', ' +
            data.id + ');';
        }
      });
    }

    var deletedApartments = data.apartments.isDeleted;
    if (Array.isArray(deletedApartments) && (deletedApartments.length > 0)) {
      deletedApartments.forEach(function (item) {
        queries += 'DELETE FROM apartments WHERE apartment_id = ' + item + ';';
      });
    }

    if (queries !== '') {
      db.get().getConnection(function (err, connection) {
        connection.query(queries, [], function (err) {
          connection.release();
          if (err) {
            reject();
          } else {
            resolve();
          }
        });
      });
    } else {
      resolve();
    }
  });
}

function saveOrder(data) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' INSERT INTO cards (' +
        ' contract_number, create_date, equipment_id, end_contract, credit_to, repaid, city_id, street_id, house_id, porch, numeration,' +
        ' client_id, is_one_person, m_client_id,' +
        ' m_contract_number, start_service, end_service, m_prolongation, maintenance_contract, m_start_apartment, m_end_apartment,' +
        ' normal_payment, privilege_payment, receipt_printing,' +
        ' contract_info, service_info,' +
        ' equipment_quantity, equipment_price, equipment_cost,' +
        ' mounting_quantity, mounting_price, mounting_cost,' +
        ' subscriber_unit_quantity, subscriber_unit_price, subscriber_unit_cost,' +
        ' key_quantity, key_price, key_cost,' +
        ' door_quantity, door_price, door_cost,' +
        ' subtotal, subtotal_for_apartment, discount_for_apartment, total, first_year)' +
        ' VALUES (' +
        ' ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [
        data.contractNumber,
        data.createDate,
        data.equipment.key,
        data.endContract,
        data.creditTo,
        data.repaid,
        data.address.city.key,
        data.address.street.key,
        data.address.house.key,
        data.porch,
        data.numeration,
        data.client.contract.key,
        data.onePerson,
        data.client.service.key,
        data.serviceNumber,
        data.startService,
        data.endService,
        data.endService,
        data.maintenanceContract,
        data.startApartment,
        data.endApartment,
        data.normalPayment,
        data.privilegePayment,
        data.receiptPrinting,
        data.contractInfo,
        data.serviceInfo,
        data.complete.equipment.quantity,
        data.complete.equipment.price,
        data.complete.equipment.cost,
        data.complete.mounting.quantity,
        data.complete.mounting.price,
        data.complete.mounting.cost,
        data.complete.subscriberUnit.quantity,
        data.complete.subscriberUnit.price,
        data.complete.subscriberUnit.cost,
        data.complete.key.quantity,
        data.complete.key.price,
        data.complete.key.cost,
        data.complete.door.quantity,
        data.complete.door.price,
        data.complete.door.cost,
        data.complete.subtotal.cost,
        data.complete.subtotalForApartment.cost,
        data.complete.discountForApartment.cost,
        data.complete.total.cost,
        data.firstYear
      ],
        function (err, rows) {
          connection.release();
          if (err) {
            reject(err);
          } else {
            resolve(rows.insertId);
          }
        });
    });
  });
}

function getOrderInfo(orderId) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT a.contract_number AS contractNumber,' +
        ' a.create_date AS createDate,' +
        ' a.credit_to AS creditTo,' +
        ' e.name AS equipmentName, e.guarantee_period AS guaranteePeriod,' +
        ' a.client_id AS clientSetupId,' +
        ' a.m_client_id AS clientServiceId,' +
        ' b.name AS cityName,' +
        ' b.print_type AS printType,' +
        ' c.name AS streetName,' +
        ' d.number AS houseNumber,' +
        ' a.porch,' +
        ' a.numeration,' +
        ' a.equipment_quantity, a.equipment_price, a.equipment_cost,' +
        ' a.mounting_quantity, a.mounting_price, a.mounting_cost,' +
        ' a.subscriber_unit_quantity, a.subscriber_unit_price, a.subscriber_unit_cost,' +
        ' a.key_quantity, a.key_price, a.key_cost,' +
        ' a.door_quantity, a.door_price, a.door_cost,' +
        ' a.subtotal, a.subtotal_for_apartment, a.discount_for_apartment, a.total' +
        ' FROM cards a' +
        ' LEFT JOIN cities b ON b.city_id = a.city_id' +
        ' LEFT JOIN streets c ON c.street_id = a.street_id' +
        ' LEFT JOIN houses d ON d.house_id = a.house_id' +
        ' LEFT JOIN equipments e ON e.equipment_id = a.equipment_id' +
        ' WHERE (a.card_id = ?)' +
        ' LIMIT 1', [orderId],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          } else {
            resolve(rows);
          }
        });
    });
  });
};

function getAddressInfo(clientId, residenceType) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT a.room_apartment AS apartment,' +
        ' b.name AS cityName,' +
        ' c.name AS streetName,' +
        ' d.number AS houseNumber' +
        ' FROM residence_clients a' +
        ' LEFT JOIN cities b ON b.city_id = a.city_id' +
        ' LEFT JOIN streets c ON c.street_id = a.street_id' +
        ' LEFT JOIN houses d ON d.house_id = a.house_id' +
        ' WHERE (a.client_id = ?) AND (a.residence_type_id = ?)' +
        ' LIMIT 1', [clientId, residenceType],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          } else {
            resolve(rows);
          }
        });
    });
  });
};

function getClientInfo(clientId) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT a.name AS clientName, b.series, b.number, b.issue_date AS issued,' +
        ' b.issue AS department, b.phones, c.name AS certificate' +
        ' FROM clients a' +
        ' LEFT JOIN faces b ON b.client_id = a.client_id' +
        ' LEFT JOIN docs_types c ON c.doc_type_id = b.doc_type_id' +
        ' WHERE (a.client_id = ?)' +
        ' LIMIT 1', [clientId],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          } else {
            resolve(rows);
          }
        });
    });
  });
};

function getApartmentId(paymentId) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        'SELECT apartment_id AS apartmentId, amount FROM payments where payment_id = ?', [paymentId],
        (error, rows) => {
          connection.release();
          if (error) {
            reject();
          } else {
            resolve({ ...rows[0] });
          }
        },
      );
    });
  });
}

function deletePayment(paymentId) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        'CALL delete_payment(?)', [paymentId],
        (error) => {
          connection.release();
          if (error) {
            reject();
          } else {
            resolve();
          }
        },
      );
    });
  });
}

function addressOfClient(data) {
  const out = [];
  try {
    if ((data.city) && (data.city.trim() !== '')) {
      out.push(`Город: ${data.city}`);
      if (data.street.trim() !== '') {
        out.push(`, улица: ${data.street}`);
      }
      if (data.house.trim() !== '') {
        out.push(`, дом: ${data.house}`);
      }
      if (data.apartment.trim() !== '') {
        out.push(`, кв: ${data.apartment}`);
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log('addressOfClient error: ', err.message);
  }
  return out.join('');
}

function passportData(data) {
  const out = [];
  try {
    if ((data.name) && (data.name.trim() !== '')) {
      out.push(data.name);
      if ((data.series) && (data.series.trim() !== '')) {
        out.push(` серия ${data.series}`);
      }
      if ((data.number) && (data.number.trim() !== '')) {
        out.push(` № ${data.number}`);
      }
      if (data.issued) {
        out.push(` выдан ${moment(data.issued).format('DD.MM.YYYY')}`);
      }
      if ((data.department) && (data.department.trim() !== '')) {
        out.push(` ${data.department}`);
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log('passportData error: ', err.message);
  }
  return out.join('');
}

function replaceErrors(key, value) {
  if (value instanceof Error) {
    return Object.getOwnPropertyNames(value).reduce((error, key) => {
      error[key] = value[key];
      return error;
    }, {});
  }
  return value;
}

function errorHandler(error) {
  console.log(JSON.stringify({ error }, replaceErrors));

  if (error.properties && error.properties.errors instanceof Array) {
    const errorMessages = error.properties.errors.map((err) => err.properties.explanation).join('\n');
    console.log('errorMessages', errorMessages);
    // errorMessages is a humanly readable message looking like this :
    // 'The tag beginning with "foobar" is unopened'
  }
  throw error;
}

function generateReportForSetup(sceleton, isCopyFile) {
  const templateFile = (sceleton.city.printType === 1) ? 'setup_pskov.docx' : 'setup_vluki.docx';
  const content = fs
    .readFileSync(path.join(__dirname, `../../../public/templates/${templateFile}`), 'binary');

  const zip = new PizZip(content);
  let doc;
  try {
    doc = new Docxtemplater(zip);
  } catch (error) {
    errorHandler(error);
    return;
  }

  doc.setData({
    IDDOC1: sceleton.contractNumber,
    DOCDATE1: sceleton.createDate == null ? '' : moment(sceleton.createDate).format('DD.MM.YYYY'),

    CLIENT1: sceleton.client.name,
    POD1: sceleton.porch,
    GOROD2: sceleton.city.name,
    STREET1: sceleton.streetName,
    HOUSE1: sceleton.houseNumber,
    GOROD1: sceleton.city.name,
    STREET2: sceleton.streetName,
    HOUSE2: sceleton.houseNumber,
    POD2: sceleton.porch,
    OBORUD: sceleton.equipment.name,
    DATE1: sceleton.creditTo == null ? '' : moment(sceleton.creditTo).format('DD.MM.YYYY'),
    CLIENT2: sceleton.client.name,
    PROPISKA: addressOfClient(sceleton.client.registeredAddress),
    FAKT: addressOfClient(sceleton.client.actualAddress),
    MES: sceleton.equipment.guaranteePeriod === 0 ? 12 : sceleton.equipment.guaranteePeriod * 12,
    PASSPORT: passportData(sceleton.client.certificate),
    NUMER: sceleton.numeration,
    MPHONE: sceleton.client.phones,
    KW: sceleton.client.registeredAddress.apartment,
    equipmentQuantity: sceleton.complete.equipment.quantity,
    equipmentPrice: sceleton.complete.equipment.price.toFixed(2),
    equipmentCost: sceleton.complete.equipment.cost.toFixed(2),
    mountingQuantity: sceleton.complete.mounting.quantity,
    mountingPrice: sceleton.complete.mounting.price.toFixed(2),
    mountingCost: sceleton.complete.mounting.cost.toFixed(2),
    subscriberUnitQuantity: sceleton.complete.subscriberUnit.quantity,
    subscriberUnitPrice: sceleton.complete.subscriberUnit.price.toFixed(2),
    subscriberUnitCost: sceleton.complete.subscriberUnit.cost.toFixed(2),
    keyQuantity: sceleton.complete.key.quantity,
    keyPrice: sceleton.complete.key.price.toFixed(2),
    keyCost: sceleton.complete.key.cost.toFixed(2),
    doorQuantity: sceleton.complete.door.quantity,
    doorPrice: sceleton.complete.door.price.toFixed(2),
    doorCost: sceleton.complete.door.cost.toFixed(2),
    subtotal: sceleton.complete.subtotal.cost.toFixed(2),
    subtotalForApartment: sceleton.complete.subtotalForApartment.cost.toFixed(2),
    discountForApartment: sceleton.complete.discountForApartment.cost.toFixed(2),
    total: sceleton.complete.total.cost.toFixed(2),
  });

  try {
    doc.render();
  } catch (error) {
    errorHandler(error);
  }

  const buf = doc.getZip()
    .generate({
      type: 'nodebuffer',
    });

  const outputFile =
    `${path.join(__dirname, '../../../public/docs/')}${sceleton.contractNumber}-1.doc`;
  fs.writeFileSync(outputFile, buf);

  if (isCopyFile) {
    const copiedFile = `${cfg.pathToNAS}\\${sceleton.contractNumber}-1.doc`;
    fs.copyFileSync(outputFile, copiedFile);
    return copiedFile;
  }

  return outputFile;
}

function generateReportForService(sceleton, isCopyFile) {
  // Orginal code
  // https://www.tutorialswebsite.com/replace-word-document-placeholder-node-js/

  const templateFile =
    (sceleton.city.printType === 1) ? 'service_pskov.docx' : 'service_vluki.docx';
  const content = fs
    .readFileSync(path.join(__dirname, `../../../public/templates/${templateFile}`), 'binary');

  const zip = new PizZip(content);
  let doc;
  try {
    doc = new Docxtemplater(zip);
  } catch (error) {
    errorHandler(error);
    return;
  }

  doc.setData({
    GOROD1: sceleton.city.name,
    GOROD2: sceleton.city.name,
    GOROD3: sceleton.city.name,

    IDDOC1: sceleton.contractNumber,
    DOCDATE1: sceleton.createDate == null ? '' : moment(sceleton.createDate).format('DD.MM.YYYY'),
    CLIENT1: sceleton.client.name,
    OBORUD: sceleton.equipment.name,

    STREET1: sceleton.streetName,
    STREET2: sceleton.streetName,
    STREET3: sceleton.streetName,

    HOUSE1: sceleton.houseNumber,
    HOUSE2: sceleton.houseNumber,
    HOUSE3: sceleton.houseNumber,

    POD1: sceleton.porch,
    POD2: sceleton.porch,
    CLIENT2: sceleton.client.name,
    PHONES: sceleton.client.phones,
    UD: passportData(sceleton.client.certificate),
    KW: sceleton.client.registeredAddress.apartment,
  });

  try {
    doc.render();
  } catch (error) {
    errorHandler(error);
  }

  const buf = doc.getZip()
    .generate({
      type: 'nodebuffer',
    });

  const outputFile = `${path.join(__dirname, '../../../public/docs/')}${sceleton.contractNumber}-2.doc`;
  fs.writeFileSync(outputFile, buf);

  if (isCopyFile) {
    const copiedFile = `${cfg.pathToNAS}\\${sceleton.contractNumber}-2.doc`;
    fs.copyFileSync(outputFile, copiedFile);
    return copiedFile;
  }

  return outputFile;
};

var Filters = function () {
  this.conditions = {
    period: {
      start: '',
      end: ''
    },
    city: {
      id: 0,
      name: ''
    },
    street: {
      id: 0,
      name: '',
      cityId: 0
    },
    house: {
      id: 0,
      number: '',
      streetId: 0
    },
    porch: {
      number: 0,
      houseId: 0
    },
    number: {
      order: 0,
      prolongedOrder: 0
    },
    onlyMaintenanceService: false
  };
  this.whereSQL = '';
  this.orderBy = '';
};

var filterBuilder = function (req) {

  var obj = {};
  var filters = new Filters();
  var cloneFilters = new Filters();
  var where = '';

  // var startDate = moment().startOf('month').toDate();
  var startDate = moment('2000-01-01').format('YYYY-MM-DD');
  var endDate = moment().endOf('month').toDate();

  if (!('filtersOrders' in req.session)) {
    req.session.filtersOrders = filters;
  }
  cloneFilters = req.session.filtersOrders;

  if (cloneFilters.conditions.period.start === '') {
    cloneFilters.conditions.period.start = moment(startDate).format('YYYY-MM-DD HH:mm');
  }
  if (cloneFilters.conditions.period.end === '') {
    cloneFilters.conditions.period.end = moment(endDate).format('YYYY-MM-DD HH:mm');
  }

  try {
    if (req.query) {
      if ('filters' in req.query) {
        obj = JSON.parse(req.query.filters);

        if (+obj.city.id > 0) {
          where += ' AND (a.city_id = ' + obj.city.id + ')';
        }
        cloneFilters.conditions.city = {
          id: obj.city.id,
          name: obj.city.name
        };

        if (+obj.street.id > 0) {
          where += ' AND (a.street_id = ' + obj.street.id + ')';
        }
        cloneFilters.conditions.street = {
          id: obj.street.id,
          name: obj.street.name,
          cityId: obj.street.cityId
        };

        if (+obj.house.id > 0) {
          where += ' AND (a.house_id = ' + obj.house.id + ')';
        }
        cloneFilters.conditions.house = {
          id: obj.house.id,
          number: obj.house.number,
          streetId: obj.house.streetId
        };

        if (+obj.porch.number > 0) { // + add "No data"
          where += ' AND (a.porch = ' + obj.porch.number + ')';
        }
        cloneFilters.conditions.porch = {
          number: obj.porch.number
        };

        if (+obj.number.order > 0) {
          where += ' AND (a.contract_number = ' + obj.number.order + ')';
        }
        cloneFilters.conditions.number.order = obj.number.order;

        if (+obj.number.prolongedOrder > 0) {
          where += ' AND (a.m_contract_number = ' + obj.number.prolongedOrder + ')';
        }
        cloneFilters.conditions.number.prolongedOrder = obj.number.prolongedOrder;

        if ('onlyMaintenanceService' in obj) {
          cloneFilters.conditions.onlyMaintenanceService = obj.onlyMaintenanceService;
        }

        var _start = obj.period.start; // YYYY-MM-DD HH:mm
        if (typeof _start === 'string') {
          if (_start.length > 0) {
            cloneFilters.conditions.period.start = _start;
          } else {
            cloneFilters.conditions.period.start = moment(startDate).format('YYYY-MM-DD HH:mm');
          }
        }

        var _end = obj.period.end; // YYYY-MM-DD HH:mm
        if (typeof _end === 'string') {
          if (_end.length > 0) {
            cloneFilters.conditions.period.end = _end;
          } else {
            cloneFilters.conditions.period.end = endDate;
          }
        }

        if (cloneFilters.conditions.onlyMaintenanceService) {
          where += ' AND (maintenance_contract >= 1)';
          where += ' AND (a.end_service >= ' + '"' + cloneFilters.conditions.period.start + '")';
          where += ' AND (a.end_service <= ' + '"' + cloneFilters.conditions.period.end + '")';

          cloneFilters.orderBy = ' ORDER BY a.end_service DESC, a.contract_number DESC';
        } else {
          where += ' AND (a.create_date >= ' + '"' + cloneFilters.conditions.period.start + '")';
          where += ' AND (a.create_date <= ' + '"' + cloneFilters.conditions.period.end + '")';

          cloneFilters.orderBy = ' ORDER BY a.create_date DESC, a.contract_number DESC';
        }

        cloneFilters.whereSQL = where;
      }
    }

    req.session.filtersOrders = cloneFilters;

  } catch (err) {
    throw (err);
  }
  return cloneFilters;
  // return req.session.filtersOrders;
};

var filterRecords = function (req, res) {

  var add = filterBuilder(req);

  var pageCount = 0;
  var countRecords = 0;

  var countRecordsQuery =
    ' SELECT COUNT(*) AS count' +
    ' FROM cards a WHERE (a.card_id > 0)' +
    ' AND (a.is_deleted = 0)' + add.whereSQL;

  var fullQuery = ' SELECT' +
    ' a.card_id AS id,' +
    ' a.contract_number,' +
    ' a.maintenance_contract,' +
    ' a.attention,' +
    ' a.create_date,' +
    ' a.credit_to,' +
    ' a.end_contract,' +
    ' a.repaid,' +
    ' b.name AS city_name,' +
    ' c.name AS street_name,' +
    ' d.number AS house_number,' +
    ' a.porch,' +
    ' a.numeration,' +
    ' e.name AS equipment_name,' +
    ' a.m_repaid,' +
    ' a.m_contract_number,' +
    ' a.end_service,' +
    ' a.m_prolongation,' +
    ' a.receipt_printing' +
    ' FROM' +
    ' cards a' +
    ' LEFT JOIN cities b ON a.city_id = b.city_id' +
    ' LEFT JOIN streets c ON a.street_id = c.street_id' +
    ' LEFT JOIN houses d ON a.house_id = d.house_id' +
    ' LEFT JOIN equipments e ON a.equipment_id = e.equipment_id' +
    ' WHERE (a.card_id > 0) AND (a.is_deleted = 0) AND (a.rank = 0)' +
    add.whereSQL +
    add.orderBy +
    ' LIMIT ' + cfg.visibleRows;

  db.get().getConnection(function (err, connection) {
    connection.query(
      countRecordsQuery, [],
      function (err, rows) {
        connection.release();
        countRecords = rows[0].count;
        pageCount =
          (rows[0].count / cfg.visibleRows) < 1 ? 0 : Math.ceil(rows[0].count / cfg.visibleRows);

        db.get().getConnection(function (err, connection) {
          connection.query(
            fullQuery, [],
            function (err, rows) {
              if (err) {
                throw err;
              }
              connection.release();

              if (err) {
                console.error(err);
                res.status(500).send(db.showDatabaseError(500, err));
              } else {
                var currentPage = 1;
                res.render('docs/orders.ejs', {
                  title: 'Договоры',
                  data: rows,
                  pageCount: pageCount,
                  currentPage: currentPage,
                  visibleRows: cfg.visibleRows,
                  countRecords: countRecords,
                  moment: moment,
                  utils: utils,
                  user: req.session.userName,
                  filters: add.conditions
                });
              }
            });
        });
      });
  });

};

function changeAddress(data) {
  var { operation, value, parentId } = data;
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query('CALL change_address(?,?,?)', [operation, value, parentId],
        function (err, rows) {
          connection.release();
          if (err) {
            reject(err);
          } else {
            resolve(rows[0]);
          }
        });
    });
  });
}

async function paymentsHistory(apartmentId) {
  logger.info('call from paymentsHistory()');
  const out = {
    personalAccount: '',
    payments: [],
    fines: [],
    prices: [],
  };

  try {
    const rawData = await getApartmentInfo(apartmentId);
    if ((rawData) && (rawData instanceof Object)) {
      out.personalAccount = generatePersonalAccount(rawData);
    }

    out.payments = await getPayments(apartmentId);
    out.fines = await getFines(apartmentId); // getPaymentsByRegister(apartmentId);
    out.prices = await getPrices(apartmentId);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error.message);
  }
  return out;
}

function checkPayments(data) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        'CALL find_debt_under_order_depth_2_year(?)', [
        data.id,
      ],
        (error, rows) => {
          connection.release();
          if (error) {
            logger.info('data:', JSON.stringify(data));
            logger.info('error', error);
            reject();
          } else {
            resolve(rows);
          }
        },
      );
    });
  });
}

function saveToLog(model, index) {
  let descriptionOfOperation = '';
  switch (index) {
    case 0:
      descriptionOfOperation = 'Удаление платежа';
      break;
    case 1:
      descriptionOfOperation = 'Новый платеж';
      break;
    default:
      break;
  }

  logger.info('');
  logger.info(`Договор на домофоны. ${descriptionOfOperation}`);
  logger.info(`Договор ТО № ${model.prolongedContractNumber}`);
  logger.info(`Квартира   : ${model.number}${utils.decodeApartmentLetter(model.letter)}`);
  logger.info(`Сумма      : ${model.amount.toFixed(2)}`);
  logger.info(`ID платежа : ${model.id}`);
  logger.info('');
}

module.exports = function () {
  var router = express.Router();

  router.get('/', function (req, res) {
    filterRecords(req, res);
  });

  router.get('/edit/:id', function (req, res) {
    var id = req.params.id;
    var contractClientData = null;
    var serviceClientData = null;
    var apartments = [];

    let orderId = parseInt(id);
    if (orderId != NaN) {
      // await checkCurrentPeriod(orderId);
      // await checkPreviousPeriod(orderId);
    }

    order.getClientContractData(id, function (contractData) {
      contractClientData = order.decodeClientData(contractData);

      order.getClientServiceData(id, function (serviceData) {
        serviceClientData = order.decodeClientData(serviceData);

        order.getApartmentsFromContract(id, function (apartmentsList) {
          apartments = apartmentsList;

          db.get().getConnection(function (err, connection) {
            connection.query(
              queryOrder, [id],
              function (err, rows) {

                connection.release();

                if (err) {
                  console.error(err);
                  res.status(500).send(db.showDatabaseError(500, err));
                } else {

                  var data = rows[0];

                  if (data) {

                    var orderModel = new OrderModel();
                    orderModel.id = data.id;
                    orderModel.contractNumber = data.contractNumber;
                    orderModel.createDate = data.createDate;
                    orderModel.endContract = data.endContract;
                    orderModel.creditTo = data.creditTo;
                    orderModel.repaid = data.repaid;

                    orderModel.equipment.key = data.equipmentId;
                    orderModel.equipment.value = data.equipmentName;

                    orderModel.address.city.key = data.cityId;
                    orderModel.address.city.value = data.cityName;

                    orderModel.address.street.key = data.streetId;
                    orderModel.address.street.value = data.streetName;
                    orderModel.address.street.cityId = data.cityId;

                    orderModel.address.house.key = data.houseId;
                    orderModel.address.house.value = data.houseNumber;
                    orderModel.address.house.streetId = data.streetId;

                    orderModel.fullAddress = '';
                    if (data.cityId > 0) {
                      orderModel.fullAddress = data.cityName.trim();
                      if (data.streetId > 0) {
                        orderModel.fullAddress += ', ' + data.streetName.trim();
                        if (data.houseId > 0) {
                          orderModel.fullAddress += ', ' + data.houseNumber.trim();
                        }
                      }
                    }
                    orderModel.porch = data.porch;
                    orderModel.numeration = data.numeration;

                    orderModel.client.contract = {
                      key: data.clientId,
                      value: data.clientName,
                      phones: data.phones
                    };
                    orderModel.client.service = {
                      key: data.clientServiceId,
                      value: data.clientServiceName,
                      phones: data.clientServicePhones
                    };
                    orderModel.client.onePerson = data.onePerson;

                    orderModel.serviceNumber = data.serviceNumber;
                    orderModel.startService = data.startService;
                    orderModel.endService = data.endService;
                    orderModel.maintenanceContract = data.maintenanceContract;
                    orderModel.startApartment = data.startApartment;
                    orderModel.endApartment = data.endApartment;
                    orderModel.normalPayment = data.normalPayment;
                    orderModel.privilegePayment = data.privilegePayment;
                    orderModel.receiptPrinting = data.receiptPrinting;

                    if (apartments.length > 0) {
                      orderModel.apartments.stat.paid = apartments.filter(function (element) {
                        return Number(element.paid) === 1;
                      }).length;
                      orderModel.apartments.stat.privilege = apartments.filter(function (element) {
                        return Number(element.privilege) === 1;
                      }).length;
                      orderModel.apartments.stat.exempt = apartments.filter(function (element) {
                        return Number(element.exempt) === 1;
                      }).length;
                      orderModel.apartments.stat.locked = apartments.filter(function (element) {
                        return Number(element.locked) === 1;
                      }).length;
                    }
                    orderModel.apartments.table = apartments;

                    orderModel.contractInfo = data.contractInfo;
                    orderModel.serviceInfo = data.serviceInfo;

                    // Complete
                    orderModel.complete.equipment.quantity = data.equipmentQuantity;
                    orderModel.complete.equipment.price = data.equipmentPrice;
                    orderModel.complete.equipment.cost = data.equipmentCost;

                    orderModel.complete.mounting.quantity = data.mountingQuantity;
                    orderModel.complete.mounting.price = data.mountingPrice;
                    orderModel.complete.mounting.cost = data.mountingCost;

                    orderModel.complete.subscriberUnit.quantity = data.subscriberUnitQuantity;
                    orderModel.complete.subscriberUnit.price = data.subscriberUnitPrice;
                    orderModel.complete.subscriberUnit.cost = data.subscriberUnitCost;

                    orderModel.complete.key.quantity = data.keyQuantity;
                    orderModel.complete.key.price = data.keyPrice;
                    orderModel.complete.key.cost = data.keyCost;

                    orderModel.complete.door.quantity = data.doorQuantity;
                    orderModel.complete.door.price = data.doorPrice;
                    orderModel.complete.door.cost = data.doorCost;

                    orderModel.complete.subtotal.cost = data.subtotalCost;
                    orderModel.complete.subtotalForApartment.cost = data.subtotalForApartmentCost;
                    orderModel.complete.discountForApartment.cost = data.discountForApartmentCost;
                    orderModel.complete.total.cost = data.totalCost;

                    orderModel.firstYear = data.firstYear;

                    // res.render('docs/forms/order.ejs', {
                    res.render('docs/forms/order2.ejs', {
                      title: 'Договор на домофоны',
                      data: orderModel,
                      moment: moment,
                      utils: utils,
                      hostIP: hostIP,
                      hostPort: hostPort,
                      errors: {},
                      // apartments: apartments,
                      user: req.session.userName
                    });
                  } else {
                    res.render('404', {
                      user: req.session.userName
                    });
                  }
                }
              });
          });
        });
      });
    });
  });

  router.get('/add', function (req, res) {
    var orderModel = new OrderModel();

    res.render('docs/forms/order2.ejs', {
      title: 'Договор',
      data: orderModel,
      moment: moment,
      utils: utils,
      hostIP: hostIP,
      hostPort: hostPort,
      errors: {},
      // apartments: [],
      user: req.session.userName
    });
  });

  router.get('/table', function (req, res) {
    var id = req.query.id;
    res.status(200).send({
      'table': id
    });
  });

  router.get('/filter', function (req, res) {
    filterRecords(req, res);
  });

  router.get('/:offset', function (req, res) {
    var offset = +req.params.offset;
    var pageCount = 0;
    var countRecords = 0;

    var add = filterBuilder(req);

    var countRecordsQuery =
      ' SELECT COUNT(*) AS count' +
      ' FROM cards a WHERE (a.card_id > 0)' +
      ' AND (a.is_deleted = 0)' + add.whereSQL;

    var fullQuery = ' SELECT' +
      ' a.card_id AS id,' +
      ' a.contract_number,' +
      ' a.maintenance_contract,' +
      ' a.attention,' +
      ' a.create_date,' +
      ' a.credit_to,' +
      ' a.end_contract,' +
      ' a.repaid,' +
      ' b.name AS city_name,' +
      ' c.name AS street_name,' +
      ' d.number AS house_number,' +
      ' a.porch,' +
      ' a.numeration,' +
      ' e.name AS equipment_name,' +
      ' a.m_repaid,' +
      ' a.m_contract_number,' +
      ' a.end_service,' +
      ' a.m_prolongation,' +
      ' a.receipt_printing' +
      ' FROM' +
      ' cards a' +
      ' LEFT JOIN cities b ON a.city_id = b.city_id' +
      ' LEFT JOIN streets c ON a.street_id = c.street_id' +
      ' LEFT JOIN houses d ON a.house_id = d.house_id' +
      ' LEFT JOIN equipments e ON a.equipment_id = e.equipment_id' +
      ' WHERE (a.card_id > 0) AND (a.is_deleted = 0) AND (a.rank = 0)' +
      add.whereSQL +
      add.orderBy +
      ' LIMIT ' + cfg.visibleRows +
      ' OFFSET ' + offset;

    db.get().getConnection(function (err, connection) {
      connection.query(
        countRecordsQuery, [],
        function (err, rows) {
          connection.release();
          countRecords = rows[0].count;
          pageCount =
            (rows[0].count / cfg.visibleRows) < 1 ? 0 : Math.ceil(rows[0].count / cfg.visibleRows);
          if ((offset > pageCount * cfg.visibleRows)) {
            offset = (pageCount - 1) * cfg.visibleRows;
          }

          db.get().getConnection(function (err, connection) {
            connection.query(
              fullQuery, [],
              function (err, rows) {
                connection.release();

                if (err) {
                  res.status(500).send(db.showDatabaseError(500, err));
                } else {
                  var currentPage = Math.ceil(offset / cfg.visibleRows) + 1;
                  res.render('docs/orders.ejs', {
                    title: 'Договоры',
                    data: rows,
                    pageCount: pageCount,
                    currentPage: currentPage,
                    visibleRows: cfg.visibleRows,
                    countRecords: countRecords,
                    moment: moment,
                    utils: utils,
                    user: req.session.userName,
                    filters: add.conditions
                  });
                }
              });
          });
        });
    });
  });

  router.get('/load_order/:id', function (req, res) {
    var id = Number(req.params.id);
    if (typeof id === 'number') {

      var contractClientData = null;
      var serviceClientData = null;
      var apartments = [];

      order.getClientContractData(id, function (contractData) {
        contractClientData = order.decodeClientData(contractData);

        order.getClientServiceData(id, function (serviceData) {
          serviceClientData = order.decodeClientData(serviceData);

          order.getApartmentsFromContract(id, function (apartmentsList) {
            apartments = apartmentsList;

            db.get().getConnection(function (err, connection) {
              connection.query(
                queryOrder, [id],
                function (err, rows) {

                  connection.release();

                  if (err) {
                    console.error(err);
                    res.status(500).send(db.showDatabaseError(500, err));
                  } else {
                    var data = rows[0];
                    data.address = '';
                    if (rows[0].cityId > 0) {
                      data.address = rows[0].cityName.trim();
                      if (rows[0].streetId > 0) {
                        data.address += ', ' + rows[0].streetName;
                        if (rows[0].houseId > 0) {
                          data.address += ', ' + rows[0].houseNumber;
                        }
                      }
                    }

                    data.contractClientData = contractClientData;
                    data.serviceClientData = serviceClientData;
                    data.apartments = apartments;

                    res.status(200).send({
                      order: data
                    });
                  }
                });
            });
          });
        });
      });
    } else {
      res.status(400);
    }
  });

  router.get('/generate_order_setup/:id', function (req, res) {
    var id = Number(req.params.id);

    var sceleton = new models.ReportModel();
    getOrderInfo(id)
      .then(function (order) {
        if ((Array.isArray(order)) && (order.length === 1)) {
          sceleton.contractNumber = order[0].contractNumber;
          sceleton.createDate = order[0].createDate;
          sceleton.creditTo = order[0].creditTo;
          sceleton.equipment.name = order[0].equipmentName;
          sceleton.equipment.guaranteePeriod = order[0].guaranteePeriod;
          sceleton.city.name = order[0].cityName;
          sceleton.city.printType = order[0].printType;
          sceleton.streetName = order[0].streetName;
          sceleton.houseNumber = order[0].houseNumber;
          sceleton.porch = order[0].porch;
          sceleton.numeration = order[0].numeration;
          sceleton.clientSetupId = order[0].clientSetupId;
          sceleton.complete.equipment.quantity = order[0].equipment_quantity;
          sceleton.complete.equipment.price = order[0].equipment_price;
          sceleton.complete.equipment.cost = order[0].equipment_cost;
          sceleton.complete.mounting.quantity = order[0].mounting_quantity;
          sceleton.complete.mounting.price = order[0].mounting_price;
          sceleton.complete.mounting.cost = order[0].mounting_cost;
          sceleton.complete.subscriberUnit.quantity = order[0].subscriber_unit_quantity;
          sceleton.complete.subscriberUnit.price = order[0].subscriber_unit_price;
          sceleton.complete.subscriberUnit.cost = order[0].subscriber_unit_cost;
          sceleton.complete.key.quantity = order[0].key_quantity;
          sceleton.complete.key.price = order[0].key_price;
          sceleton.complete.key.cost = order[0].key_cost;
          sceleton.complete.door.quantity = order[0].door_quantity;
          sceleton.complete.door.price = order[0].door_price;
          sceleton.complete.door.cost = order[0].door_cost;
          sceleton.complete.subtotal.cost = order[0].subtotal;
          sceleton.complete.subtotalForApartment.cost = order[0].subtotal_for_apartment;
          sceleton.complete.discountForApartment.cost = order[0].discount_for_apartment;
          sceleton.complete.total.cost = order[0].total;
        }

        return getAddressInfo(sceleton.clientSetupId, 0);
      })
      .then(function (registeredAddress) {
        if ((Array.isArray(registeredAddress)) && (registeredAddress.length === 1)) {
          sceleton.client.registeredAddress.city = registeredAddress[0].cityName;
          sceleton.client.registeredAddress.street = registeredAddress[0].streetName;
          sceleton.client.registeredAddress.house = registeredAddress[0].houseNumber;
          sceleton.client.registeredAddress.apartment = registeredAddress[0].apartment;
        }
        return getAddressInfo(sceleton.clientSetupId, 1);
      })
      .then(function (actualAddress) {
        if ((Array.isArray(actualAddress)) && (actualAddress.length === 1)) {
          sceleton.client.actualAddress.city = actualAddress[0].cityName;
          sceleton.client.actualAddress.street = actualAddress[0].streetName;
          sceleton.client.actualAddress.house = actualAddress[0].houseNumber;
          sceleton.client.actualAddress.apartment = actualAddress[0].apartment;
        }
        return getClientInfo(sceleton.clientSetupId);
      })
      .then(function (passport) {
        if ((Array.isArray(passport)) && (passport.length === 1)) {
          sceleton.client.name = passport[0].clientName;
          sceleton.client.phones = passport[0].phones;
          sceleton.client.certificate.name = passport[0].certificate;
          sceleton.client.certificate.series = passport[0].series;
          sceleton.client.certificate.number = passport[0].number;
          sceleton.client.certificate.issued = passport[0].issued;
          sceleton.client.certificate.department = passport[0].department;
        }
        generateReportForSetup(res, sceleton);
      })
      .catch(function (error) {
        console.log(error.message);
        res.status(500).send(error.message);
      });
  });

  router.get('/generate_order_service/:id', function (req, res) {
    var id = Number(req.params.id);

    var sceleton = new models.ReportModel();
    getOrderInfo(id)
      .then(function (order) {
        if ((Array.isArray(order)) && (order.length === 1)) {
          sceleton.contractNumber = order[0].contractNumber;
          sceleton.createDate = order[0].createDate;
          sceleton.creditTo = order[0].creditTo;
          sceleton.equipment.name = order[0].equipmentName;
          sceleton.equipment.guaranteePeriod = order[0].guaranteePeriod;
          sceleton.city.name = order[0].cityName;
          sceleton.city.printType = order[0].printType;
          sceleton.streetName = order[0].streetName;
          sceleton.houseNumber = order[0].houseNumber;
          sceleton.porch = order[0].porch;
          sceleton.numeration = order[0].numeration;
          sceleton.clientSetupId = order[0].clientSetupId;
          sceleton.clientServiceId = order[0].clientServiceId;
        }

        return getAddressInfo(sceleton.clientServiceId, 0);
      })
      .then(function (registeredAddress) {
        if ((Array.isArray(registeredAddress)) && (registeredAddress.length === 1)) {
          sceleton.client.registeredAddress.city = registeredAddress[0].cityName;
          sceleton.client.registeredAddress.street = registeredAddress[0].streetName;
          sceleton.client.registeredAddress.house = registeredAddress[0].houseNumber;
          sceleton.client.registeredAddress.apartment = registeredAddress[0].apartment;
        }
        return getAddressInfo(sceleton.clientServiceId, 1);
      })
      .then(function (actualAddress) {
        if ((Array.isArray(actualAddress)) && (actualAddress.length === 1)) {
          sceleton.client.actualAddress.city = actualAddress[0].cityName;
          sceleton.client.actualAddress.street = actualAddress[0].streetName;
          sceleton.client.actualAddress.house = actualAddress[0].houseNumber;
          sceleton.client.actualAddress.apartment = actualAddress[0].apartment;
        }
        return getClientInfo(sceleton.clientServiceId);
      })
      .then(function (passport) {
        if ((Array.isArray(passport)) && (passport.length === 1)) {
          sceleton.client.name = passport[0].clientName;
          sceleton.client.phones = passport[0].phones;
          sceleton.client.certificate.name = passport[0].certificate;
          sceleton.client.certificate.series = passport[0].series;
          sceleton.client.certificate.number = passport[0].number;
          sceleton.client.certificate.issued = passport[0].issued;
          sceleton.client.certificate.department = passport[0].department;
        }
        generateReportForService(res, sceleton);
      })
      .catch(function (error) {
        console.log(error);
        res.status(500).send(error);
      });
  });

  router.get('/open_order_setup/:number', function (req, res) {
    var documentNumer = Number(req.params.number);
    var fileName = documentNumer + '-1.doc';
    var destination = path.join(__dirname, '../../../public/docs/');

    res.download(destination + fileName, fileName, function (err) {
      if (err) {
        res.send('Нет файла!');
      }
    });
  });

  router.get('/open_order_service/:number', function (req, res) {
    var documentNumer = Number(req.params.number);
    var fileName = documentNumer + '-2.doc';
    var destination = path.join(__dirname, '../../../public/docs/');

    res.download(destination + fileName, fileName, function (err) {
      if (err) {
        res.send('Нет файла!');
      }
    });
  });

  router.get('/print_receipt_for_apartment/:id', async function (req, res) {
    const apartmentId = parseInt(req.params.id);
    const orderId = await getOrderIdFromApartment(apartmentId);

    const printOrderReceipts = new PrintOrderReceipts(orderId, res);
    printOrderReceipts.oneApartment(apartmentId);
  });

  router.post('/save', async function (req, res) {

    var orderModel = new OrderModel();
    orderModel.id = parseInt(req.body.id);
    orderModel.contractNumber = req.body.contractNumber;
    orderModel.createDate = req.body.createDate == null ? moment(new Date()).format('YYYY-MM-DD') : moment(req.body.createDate, 'DD.MM.YYYY').format('YYYY-MM-DD');
    orderModel.endContract = ((req.body.endContract != null) && (req.body.endContract.trim().length > 0)) ? moment(req.body.endContract, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;
    orderModel.creditTo = req.body.creditTo != null ? moment(req.body.creditTo, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;
    orderModel.repaid = req.body.repaid === 'on' ? 1 : 0;
    orderModel.fullAddress = req.body.fullAddress;
    orderModel.porch = req.body.porch;
    orderModel.numeration = req.body.numeration;
    orderModel.onePerson = req.body.onePerson === 'on' ? 1 : 0;
    orderModel.serviceNumber = req.body.serviceNumber;
    orderModel.startService = ((req.body.startService != null) && (req.body.startService.trim().length > 0)) ? moment(req.body.startService, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;
    orderModel.endService = ((req.body.endService != null) && (req.body.endService.trim().length > 0)) ? moment(req.body.endService, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;
    orderModel.maintenanceContract = req.body.maintenanceContract;
    orderModel.startApartment = req.body.startApartment.trim().length > 0 ? parseInt(req.body.startApartment) : null;
    orderModel.endApartment = req.body.endApartment.trim().length > 0 ? parseInt(req.body.endApartment) : null;
    orderModel.normalPayment = Number(req.body.normalPayment);
    orderModel.privilegePayment = Number(req.body.privilegePayment);
    orderModel.receiptPrinting = ((req.body.receiptPrinting != null) && (req.body.receiptPrinting.trim().length > 0)) ? moment(req.body.receiptPrinting, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;
    orderModel.contractInfo = req.body.contractInfo;
    orderModel.serviceInfo = req.body.serviceInfo;
    orderModel.firstYear = req.body.firstYear === 'on' ? 1 : 0;

    try {
      orderModel.equipment = JSON.parse(req.body.equipment);
      orderModel.client = JSON.parse(req.body.client);
      orderModel.address = JSON.parse(req.body.address);
      orderModel.complete = JSON.parse(req.body.complete);
      orderModel.apartments = JSON.parse(req.body.apartments);
    } catch (error) {
      console.log(error);
    }

    const uid = await isExistsContractNumber(orderModel.contractNumber);

    req.assert('contractNumber', 'Номер договора не введен').notEmpty();
    req.assert('contractNumber', 'Такой номер уже существует!').custom((data) => {
      if (orderModel.id > 0) {
        return (orderModel.id === uid) && (parseInt(orderModel.contractNumber) === parseInt(data));
      }
      else {
        return (uid === null) || ((uid) && (uid === 0));
      }
    });
    req.assert('createDate', 'Дата создания не заполнена').notEmpty();
    req.assert('equipment', 'Оборудование не заполнено').custom(function (data) {
      var result = false;
      try {
        var equipment = JSON.parse(data);
        result = +equipment.key > 0;
      } catch (error) {

      }
      return result;
    });
    req.assert('creditTo', 'Дата кредита не заполнена').notEmpty();
    req.assert('address', 'Адрес не заполнен').custom(function (data) {
      var result = false;
      try {
        var address = JSON.parse(data);
        result = (+address.city.key > 0) && (+address.street.key > 0) && (+address.house.key > 0);
      } catch (error) {

      }
      return result;
    });
    req.assert('porch', 'Номер подъезда не заполнен').isNumeric();
    req.assert('numeration', 'Нумерация не заполнена').notEmpty();

    var errors = req.validationErrors();
    if (!errors) {

      if ('printingReceipts' in req.body) {
        if (Number(OrderModel.id) === 0) {
          res.status(200);
          return;
        }
        printingReceipts(orderModel.id, res);
        return;
      }

      if (orderModel.id != 0) {
        try {
          await updateOrder(orderModel);
          await deleteExistsApartments(orderModel);
          await updateApartments(orderModel);
          await checkCurrentPeriod(orderModel.id);
          await checkPreviousPeriod(orderModel.id);
        } catch (err) {
          console.log('/save(id != 0)::' + err.message);
        }
      } else {
        try {
          orderModel.id = await saveOrder(orderModel);
          await insertApartments(orderModel);
          await checkCurrentPeriod(orderModel.id);
          await checkPreviousPeriod(orderModel.id);
        } catch (err) {
          console.log('/save(id == 0)::' + err.message);
        }
      }
      if ('save_and_close' in req.body) {
        res.redirect('/orders');
      }
      if ('save' in req.body) {
        res.redirect('/orders/edit/' + orderModel.id);
      }

    } else {
      res.render('docs/forms/order2.ejs', {
        title: 'Договор',
        data: orderModel,
        moment: moment,
        utils: utils,
        hostIP: hostIP,
        hostPort: hostPort,
        errors: errors,
        apartments: [],
        user: req.session.userName
      });
    }
  });

  router.post('/delete', function (req, res) {
    if ((req.body.id) && (isFinite(+req.body.id))) {
      db.get().getConnection(function (err, connection) {
        connection.query(
          ' DELETE FROM cards WHERE card_id = ?', [+req.body.id],
          function (err) {
            connection.release();
            if (err) {
              res.status(500).send({
                'code': 500,
                'msg': 'Database Error',
                'err': JSON.stringify(err)
              });
            } else {
              res.status(200).send({
                'result': 'OK'
              });
            }
          }
        );
      });
    } else {
      res.status(500).send({
        code: 500,
        msg: 'Incorrect parameter'
      });
    }
  });

  router.post('/search_equipment', function (req, res) {
    var data = req.body;
    var suggestion = '';
    if ((data) && (typeof (data) === 'object') && ('suggestion' in data)) {
      suggestion = data.suggestion.trim();

      var queryText =
        ' SELECT a.equipment_id AS id, a.name AS value' +
        ' FROM equipments a';
      if (suggestion.length > 0) {
        queryText += ' WHERE a.name LIKE ' + `'` + suggestion + '%' + `'`;
      }
      queryText += ' ORDER BY a.name ASC';
      queryText += ' LIMIT ' + ('limit' in data ? data.limit : cfg.rowsLimit);

      db.get().getConnection(function (err, connection) {
        connection.query(
          queryText, [],
          function (err, rows) {
            connection.release();

            if (err) {
              res.status(500).send({
                'code': 500,
                'msg': 'Database Error',
                'err': JSON.stringify(err)
              });
            } else {
              res.status(200).send(rows);
              // res.status(200).json(rows);
            }
          }
        );
      });
    } else {
      res.status(500).send({
        code: 500,
        msg: 'Incorrect parameter'
      });
    }
  });

  router.post('/find_equipment', (req, res) => {
    const data = req.body;
    if ((data) && (typeof (data) === 'object') && ('suggestion' in data)) {
      const rowsCount = 'limit' in data ? data.limit : cfg.rowsLimit;
      const params = {
        suggestion: data.suggestion,
        rowsCount,
        category: 1,
      };
      common.filterEquipments(params, (err, rows) => {
        res.status(200).send(rows);
      });
    } else {
      res.status(500).send({
        code: 500,
        msg: 'Incorrect parameter'
      });
    }
  });

  router.post('/find_full_address', function (req, res) {
    const { rowsCount, suggestion, core } = { ...req.body };
    // var data = req.body;
    if (suggestion) {
      var params = {
        suggestion: suggestion,
        rowsCount: rowsCount,
        core: core
      };
      common.outFullAddress(params, function (err, rows) {
        res.status(200).send(rows);
      });
    } else {
      res.status(500).send({
        code: 500,
        msg: 'Incorrect parameter'
      });
    }
  });

  router.post('/find_city', (req, res) => {
    const data = req.body;
    if ((data) && (typeof (data) === 'object') && ('cityName' in data)) {
      const rowsCount = 'limit' in data ? data.limit : cfg.rowsLimit;
      const params = { ...data, rowsCount: rowsCount };
      common.filterCities(params, (err, rows) => {
        res.status(200).send(rows);
      });
    } else {
      res.status(500).send({
        code: 500,
        msg: 'Incorrect parameter'
      });
    }
  });

  router.post('/find_street', (req, res) => {
    const data = req.body;
    if ((data) && (typeof (data) === 'object') && ('streetName' in data) && ('cityId' in data)) {
      const rowsCount = 'limit' in data ? data.limit : cfg.rowsLimit;
      const params = { ...data, rowsCount: rowsCount };
      common.filterStreets(params, (err, rows) => {
        res.status(200).send(rows);
      });
    } else {
      res.status(500).send({
        code: 500,
        msg: 'Incorrect parameter'
      });
    }
  });

  router.post('/find_house', (req, res) => {
    const data = req.body;
    if ((data) && (typeof (data) === 'object') && ('houseNumber' in data) && ('streetId' in data)) {
      const rowsCount = 'limit' in data ? data.limit : cfg.rowsLimit;
      const params = { ...data, rowsCount: rowsCount };
      common.filterHouses(params, (err, rows) => {
        res.status(200).send(rows);
      });
    } else {
      res.status(500).send({
        code: 500,
        msg: 'Incorrect parameter'
      });
    }
  });

  router.post('/find_porch', async (req, res) => {
    const data = req.body;
    if ((data) && (typeof (data) === 'object') && ('porch' in data) && ('houseId' in data)) {
      const rowsCount = 'limit' in data ? data.limit : cfg.rowsLimit;
      const params = { ...data, rowsCount: rowsCount };
      const rows = await common.filterPorches(params);
      res.status(200).send(rows);
    } else {
      res.status(500).send({
        code: 500,
        msg: 'Incorrect parameter'
      });
    }
  });

  router.post('/find_order', function (req, res) {
    var data = req.body;
    if ((data) && (typeof (data) === 'object') && ('orderNumber' in data)) {
      var orderNumber = data.orderNumber;
      var rowsCount = 'limit' in data ? data.limit : cfg.rowsLimit;
      common.filterOrders(orderNumber, rowsCount, function (err, rows) {
        res.status(200).send(rows);
      });
    } else {
      res.status(500).send({
        code: 500,
        msg: 'Incorrect parameter'
      });
    }
  });

  router.post('/find_prolonged_order', function (req, res) {
    var data = req.body;
    if ((data) && (typeof (data) === 'object') && ('orderNumber' in data)) {
      var orderNumber = data.orderNumber;
      var rowsCount = 'limit' in data ? data.limit : cfg.rowsLimit;
      common.filterProlongedOrders(orderNumber, rowsCount, function (err, rows) {
        res.status(200).send(rows);
      });
    } else {
      res.status(500).send({
        code: 500,
        msg: 'Incorrect parameter'
      });
    }
  });

  router.post('/find_client', function (req, res) {
    var data = req.body;
    if ((data) && (typeof (data) === 'object') && ('suggestion' in data)) {
      var rowsCount = 'limit' in data ? data.limit : cfg.rowsLimit;
      var params = {
        suggestion: data.suggestion,
        rowsCount: rowsCount
      };
      common.filterClients(params, function (err, rows) {
        res.status(200).send(rows);
      });
    } else {
      res.status(500).send({
        code: 500,
        msg: 'Incorrect parameter'
      });
    }
  });

  router.post('/payments_history', async function (req, res) {
    var data = req.body;
    var out = {
      personalAccount: '',
      payments: [],
      fines: [],
      prices: [],
      paymentOptions: [],
    };

    if ((data) && (typeof (data) === 'object') && ('id' in data)) {
      // var rowsCount = 'limit' in data ? data.limit : cfg.rowsLimit;

      try {
        const rawData = await getApartmentInfo(data.id);
        if ((rawData) && (rawData instanceof Object)) {
          out.personalAccount = generatePersonalAccount(rawData);
        }

        out.payments = await getPayments(data.id);
        out.fines = await getFines(data.id);
        out.prices = await getPrices(data.id);
        out.paymentOptions = await getPaymentOptions();

        res.status(200).send(out);
      } catch (error) {
        console.log(error.message);
        res.status(500).send(error.message);
      }

      // getPayments(data.id)
      //   .then(function (payments) {
      //     out.payments = payments;
      //     return getFines(data.id);
      //   })
      //   .then(function (fines) {
      //     out.fines = fines;
      //     return getPrices(data.id);
      //   })
      //   .then(function (prices) {
      //     out.prices = prices;
      //     res.status(200).send(out);
      //   })
      //   .catch(function (error) {
      //     console.log(error.message);
      //     res.status(500).send(error.message);
      //   });
    } else {
      res.status(500).send({
        code: 500,
        msg: 'Incorrect parameter'
      });
    }
  });

  router.post('/add_payment', async (req, res) => {

    const obj = {
      apartmentId: +req.body.id,
      amount: parseFloat(req.body.amount),
      payDate: moment(req.body.date, 'DD.MM.YYYY').format('YYYY-MM-DD'),
      // // mode: 2,
      mode: +req.body.option,
      // isRegistered: 0,
    };

    const apartmentData = await apartmentInfo(obj.apartmentId);

    try {
      const data = {
        ...obj,
        ...{ personalAccount: utils.buildPersonalAccount(0, apartmentData.prolongedContractNumber, apartmentData.letter, apartmentData.number) },
        ...{ number: apartmentData.number },
        ...{ letter: utils.decodeApartmentLetter(apartmentData.letter) },
        ...{ payMonth: moment(obj.payDate).month() + 1 },
        ...{ payYear: moment(obj.payDate).year() },
        ...{ createDate: obj.payDate },
        ...{ transaction: uuidv4() },
        ...{ fileName: uuidv4() },
        ...{ zipCode: '' },
        ...{ method: obj.mode },
      };

      const newPaymentId = await addPayment(data);
      await sp.calcPaymentAndDebt(obj.apartmentId);
      const apartmentInfo = await apartment.convertAnApartment(obj.apartmentId);
      const paymentsData = await paymentsHistory(obj.apartmentId);
      const dateOfLastPayment = await apartment.getDateOfLastPayment(obj.apartmentId);

      saveToLog(
        {
          prolongedContractNumber: apartmentData.prolongedContractNumber,
          number: apartmentData.number,
          letter: apartmentData.letter,
          amount: obj.amount,
          id: newPaymentId,
        }, 1);

      res.status(200).send({
        apartmentInfo,
        paymentsHistory: paymentsData,
        dateOfLastPayment,
      });
    } catch (error) {
      console.log(`Error: (/add_payment) - ${error}`);
      res.status(500).send({
        success: 'Bad',
      });
    }
  });

  // router.post('/add_payment_in_register', async (req, res) => {
  //
  //   const obj = {
  //     apartmentId: parseInt(req.body.id),
  //     amount: parseFloat(req.body.amount),
  //     payDate: moment(req.body.date, 'DD.MM.YYYY').format('YYYY-MM-DD'),
  //     mode: 2,
  //     isRegistered: 1
  //   };
  //
  //   const data = {
  //     ...obj,
  //     ...{
  //       payMonth: moment(obj.payDate).month() + 1
  //     },
  //     ...{
  //       payYear: moment(obj.payDate).year()
  //     },
  //     ...{
  //       createDate: obj.payDate
  //     }
  //   };
  //
  //   try {
  //     const uid = await addPayment(data);
  //     const paymentsData = await paymentsHistory(obj.apartmentId);
  //     res.status(200).send({
  //       paymentsHistory: paymentsData,
  //     });
  //   } catch (error) {
  //     console.log(`Error: (/add_payment_in_register) - ${error.message}`);
  //     res.status(500).send({
  //       success: 'Bad'
  //     });
  //     return;
  //   }
  // });

  router.post('/delete_payment', async (req, res) => {
    const data = req.body;
    if ((data) && (typeof (data) === 'object') && ('id' in data)) {
      const { apartmentId, amount } = await getApartmentId(data.id);
      await deletePayment(data.id);
      await sp.calcPaymentAndDebt(apartmentId);
      const info = await apartment.convertAnApartment(apartmentId);
      const dateOfLastPayment = await apartment.getDateOfLastPayment(apartmentId);
      const payments = await getPayments(apartmentId);

      const apartmentData = await apartmentInfo(apartmentId);
      saveToLog(
        {
          prolongedContractNumber: apartmentData.prolongedContractNumber,
          number: apartmentData.number,
          letter: apartmentData.letter,
          amount,
          id: data.id,
        }, 0);

      res.status(200).send({ info, dateOfLastPayment, payments });
    } else {
      res.status(500).send({
        code: 500,
        msg: 'Incorrect parameter',
      });
    }
  });

  router.post('/print_receipt_for_apartment', function (req, res) {
    var id = req.body.id;
    getOrderIdFromApartment(id).then(function (orderId) {
      printingReceipts(orderId, res);
    })
      .catch(function (error) {
        console.log(error);
        res.status(500).send(error);
      });
  });

  router.post('/change_address', (req, res) => {
    changeAddress(req.body).then((data) => {
      res.status(200).send(data);
    })
      .catch((error) => {
        console.log(error);
        res.status(500).send(error);
      });
  });

  router.post('/save_client', (req, res) => {
    saveClientData(req.body, res);
  });

  router.post('/check_payments', async (req, res) => {
    const data = {
      id: req.body.id,
    };

    const currentDate = `Дата: ${moment(new Date()).format('DD.MM.YYYY HH:mm:ss')}`;
    const info = [];
    info.push(currentDate);
    info.push('');

    const rawData = await checkPayments(data);
    if ('errorCode' in rawData[0][0]) {
      info.push(rawData[0][0].errorMessage);
    } else {
      const apartments = rawData[0];
      apartments.forEach((item) => {
        if (item.lastOneYearPayment + item.currentPayment !== 0) {
          const apartmentInfo = `${item.number}${utils.decodeApartmentLetter(item.letter)}`;
          if ((item.lastOneYearPayment < 0)
            && ((item.lastOneYearPayment + item.lastTwoYearPayment) !== 0)) {
            let addInfo = '';
            if (item.lastTwoYearPayment > 0) {
              addInfo = ` (есть долг за второй год - ${item.lastTwoYearPayment.toFixed(2)})`;
            }
            info.push(`Квартира ${apartmentInfo} - возможно, переплата ${item.lastOneYearPayment.toFixed(2)}${addInfo}.`);
          }
          if (item.lastOneYearPayment > 0) {
            let addInfo = '';
            if (item.lastTwoYearPayment > 0) {
              addInfo = ` (есть долг за второй год - ${item.lastTwoYearPayment.toFixed(2)})`;
            }
            if (item.locked) {
              addInfo += ' - заблокирован';
            }
            info.push(`Квартира ${apartmentInfo} - долг за прошлый год ${item.lastOneYearPayment.toFixed(2)}${addInfo}.`);
          }
          if (item.lastOneYearPayment === 0) {
            if (item.lastTwoYearPayment > 0) {
              let addInfo = '';
              addInfo = ` (есть долг за второй год - ${item.lastTwoYearPayment.toFixed(2)})`;
              if (item.locked) {
                addInfo += ' - заблокирован';
              }
              info.push(`Квартира ${apartmentInfo} - долг за прошлый год отсутствует${addInfo}.`);
            }
          }
        }
      });
    }

    if (info.length === 2) {
      info.push('Все нормально.');
    }

    res.status(200).send({
      message: info.join('\r\n'),
    });
  });

  return router;
};

const buildReportForSetup = (id, isCopyFile, cb) => {
  let sceleton = new models.ReportModel();
  getOrderInfo(id)
    .then(function (order) {
      if ((Array.isArray(order)) && (order.length === 1)) {
        sceleton.contractNumber = order[0].contractNumber;
        sceleton.createDate = order[0].createDate;
        sceleton.creditTo = order[0].creditTo;
        sceleton.equipment.name = order[0].equipmentName;
        sceleton.equipment.guaranteePeriod = order[0].guaranteePeriod;
        sceleton.city.name = order[0].cityName;
        sceleton.city.printType = order[0].printType;
        sceleton.streetName = order[0].streetName;
        sceleton.houseNumber = order[0].houseNumber;
        sceleton.porch = order[0].porch;
        sceleton.numeration = order[0].numeration;
        sceleton.clientSetupId = order[0].clientSetupId;
        sceleton.complete.equipment.quantity = order[0].equipment_quantity;
        sceleton.complete.equipment.price = order[0].equipment_price;
        sceleton.complete.equipment.cost = order[0].equipment_cost;
        sceleton.complete.mounting.quantity = order[0].mounting_quantity;
        sceleton.complete.mounting.price = order[0].mounting_price;
        sceleton.complete.mounting.cost = order[0].mounting_cost;
        sceleton.complete.subscriberUnit.quantity = order[0].subscriber_unit_quantity;
        sceleton.complete.subscriberUnit.price = order[0].subscriber_unit_price;
        sceleton.complete.subscriberUnit.cost = order[0].subscriber_unit_cost;
        sceleton.complete.key.quantity = order[0].key_quantity;
        sceleton.complete.key.price = order[0].key_price;
        sceleton.complete.key.cost = order[0].key_cost;
        sceleton.complete.door.quantity = order[0].door_quantity;
        sceleton.complete.door.price = order[0].door_price;
        sceleton.complete.door.cost = order[0].door_cost;
        sceleton.complete.subtotal.cost = order[0].subtotal;
        sceleton.complete.subtotalForApartment.cost = order[0].subtotal_for_apartment;
        sceleton.complete.discountForApartment.cost = order[0].discount_for_apartment;
        sceleton.complete.total.cost = order[0].total;
      }

      return getAddressInfo(sceleton.clientSetupId, 0);
    })
    .then(function (registeredAddress) {
      if ((Array.isArray(registeredAddress)) && (registeredAddress.length === 1)) {
        sceleton.client.registeredAddress.city = registeredAddress[0].cityName;
        sceleton.client.registeredAddress.street = registeredAddress[0].streetName;
        sceleton.client.registeredAddress.house = registeredAddress[0].houseNumber;
        sceleton.client.registeredAddress.apartment = registeredAddress[0].apartment;
      }
      return getAddressInfo(sceleton.clientSetupId, 1);
    })
    .then(function (actualAddress) {
      if ((Array.isArray(actualAddress)) && (actualAddress.length === 1)) {
        sceleton.client.actualAddress.city = actualAddress[0].cityName;
        sceleton.client.actualAddress.street = actualAddress[0].streetName;
        sceleton.client.actualAddress.house = actualAddress[0].houseNumber;
        sceleton.client.actualAddress.apartment = actualAddress[0].apartment;
      }
      return getClientInfo(sceleton.clientSetupId);
    })
    .then(function (passport) {
      if ((Array.isArray(passport)) && (passport.length === 1)) {
        sceleton.client.name = passport[0].clientName;
        sceleton.client.phones = passport[0].phones;
        sceleton.client.certificate.name = passport[0].certificate;
        sceleton.client.certificate.series = passport[0].series;
        sceleton.client.certificate.number = passport[0].number;
        sceleton.client.certificate.issued = passport[0].issued;
        sceleton.client.certificate.department = passport[0].department;
      }
      const outputFile = generateReportForSetup(sceleton, isCopyFile);
      if (typeof cb === 'function') {
        cb(outputFile);
      }
    })
    .catch(function (error) {
      console.log(error.message);
      if (typeof cb === 'function') {
        cb(null);
      }
    });
};

const buildReportForService = (id, isCopyFile, cb) => {
  let sceleton = new models.ReportModel();
  getOrderInfo(id)
    .then(function (order) {
      if ((Array.isArray(order)) && (order.length === 1)) {
        sceleton.contractNumber = order[0].contractNumber;
        sceleton.createDate = order[0].createDate;
        sceleton.creditTo = order[0].creditTo;
        sceleton.equipment.name = order[0].equipmentName;
        sceleton.equipment.guaranteePeriod = order[0].guaranteePeriod;
        sceleton.city.name = order[0].cityName;
        sceleton.city.printType = order[0].printType;
        sceleton.streetName = order[0].streetName;
        sceleton.houseNumber = order[0].houseNumber;
        sceleton.porch = order[0].porch;
        sceleton.numeration = order[0].numeration;
        sceleton.clientSetupId = order[0].clientSetupId;
        sceleton.clientServiceId = order[0].clientServiceId;
      }

      return getAddressInfo(sceleton.clientServiceId, 0);
    })
    .then(function (registeredAddress) {
      if ((Array.isArray(registeredAddress)) && (registeredAddress.length === 1)) {
        sceleton.client.registeredAddress.city = registeredAddress[0].cityName;
        sceleton.client.registeredAddress.street = registeredAddress[0].streetName;
        sceleton.client.registeredAddress.house = registeredAddress[0].houseNumber;
        sceleton.client.registeredAddress.apartment = registeredAddress[0].apartment;
      }
      return getAddressInfo(sceleton.clientServiceId, 1);
    })
    .then(function (actualAddress) {
      if ((Array.isArray(actualAddress)) && (actualAddress.length === 1)) {
        sceleton.client.actualAddress.city = actualAddress[0].cityName;
        sceleton.client.actualAddress.street = actualAddress[0].streetName;
        sceleton.client.actualAddress.house = actualAddress[0].houseNumber;
        sceleton.client.actualAddress.apartment = actualAddress[0].apartment;
      }
      return getClientInfo(sceleton.clientServiceId);
    })
    .then(function (passport) {
      if ((Array.isArray(passport)) && (passport.length === 1)) {
        sceleton.client.name = passport[0].clientName;
        sceleton.client.phones = passport[0].phones;
        sceleton.client.certificate.name = passport[0].certificate;
        sceleton.client.certificate.series = passport[0].series;
        sceleton.client.certificate.number = passport[0].number;
        sceleton.client.certificate.issued = passport[0].issued;
        sceleton.client.certificate.department = passport[0].department;
      }
      const outputFile = generateReportForService(sceleton, isCopyFile);
      if (typeof cb === 'function') {
        cb(outputFile);
      }
    })
    .catch(function (error) {
      console.log(error);
      if (typeof cb === 'function') {
        cb(null);
      }
    });
};

const saveClientData = async (data, res) => {
  var clientModel = new ClientModel();
  clientModel.id = data.id;
  clientModel.lastName = data.lastName;

  clientModel.certificate.typeId = data.certificateId;
  clientModel.certificate.series = data.certificateSeries;
  clientModel.certificate.number = data.certificateNumber;
  clientModel.certificate.issued = ((data.issued != null) && (data.issued.trim().length > 0)) ? moment(data.issued, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;
  clientModel.certificate.department = data.department;
  clientModel.certificate.phones = data.phones;

  clientModel.registeredAddress.city.key = data.registeredAddress.cityId;
  clientModel.registeredAddress.street.key = data.registeredAddress.streetId;
  clientModel.registeredAddress.house.key = data.registeredAddress.houseId;
  clientModel.registeredAddress.apartment = data.registeredAddress.apartment;

  clientModel.actualAddress.city.key = data.actualAddress.cityId;
  clientModel.actualAddress.street.key = data.actualAddress.streetId;
  clientModel.actualAddress.house.key = data.actualAddress.houseId;
  clientModel.actualAddress.apartment = data.actualAddress.apartment;

  try {
    if (clientModel.id > 0) {
      await operationsWithClient.updateClient(clientModel);
      await operationsWithClient.updateClientFace(clientModel);
      await operationsWithClient.updateClientRegisteredAddress(clientModel);
      await operationsWithClient.updateClientActualAddress(clientModel);
    }
    else {
      let uid = await operationsWithClient.addClient(clientModel);
      clientModel.id = uid;
      await operationsWithClient.addClientFace(clientModel);
      await operationsWithClient.addClientRegisteredAddress(clientModel);
      await operationsWithClient.addClientActualAddress(clientModel);
    }
    res.status(200).send({ id: clientModel.id });
  }
  catch (error) {
    if (clientModel.id > 0) {
      console.log('Client update Error');
    }
    else {
      console.log('Client insert Error');
    }
    res.status(500);
  }

};

module.exports.buildReportForSetup = buildReportForSetup;
module.exports.buildReportForService = buildReportForService;