'use strict';

const path = require('path');
const express = require('express');
var db = require('../../../lib/db');
const visibleRows = require('../../../lib/config').config.visibleRows;
var rowsLimit = require('../../../lib/config').config.rowsLimit;
var moment = require('moment');
var utils = require('../../../lib/utils');
var order = require('../../../lib/order_service');
const queryOrder = require('../../../queries/orders').getOrder;
var common = require('../../common/typeheads');
var OrderModel = require('../../models/order').OrderModel;
var models = require('../../models/order');

var PizZip = require('pizzip');
var Docxtemplater = require('docxtemplater');
var fs = require('fs');
const { isArray } = require('util');

require('shelljs/global');

function getPayments(id) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT' +
        ' a.payment_id AS uid,' +
        ' a.create_date AS createDate,' +
        ' a.pay_month AS payMonth,' +
        ' a.pay_year AS payYear,' +
        ' a.pay_date AS payDate,' +
        ' a.amount,' +
        ' a.`mode`,' +
        ' a.privilege,' +
        ' b.name as organizationName' +
        ' FROM payments a' +
        ' LEFT JOIN organizations b ON b.organization_id = a.mode' +
        ' WHERE' +
        ' a.apartment_id = ?' +
        ' ORDER BY' +
        ' a.pay_date DESC', [id],
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

function getFines(id) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT' +
        ' a.fine_id AS uid,' +
        ' a.create_dt AS createDate,' +
        ' a.amount_of_fine AS amount,' +
        ' a.remark,' +
        ' a.paid' +
        ' FROM fines a' +
        ' WHERE' +
        ' a.apartment_id = ?' +
        ' ORDER BY' +
        ' a.create_dt DESC', [id],
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

function getPrices(id) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT' +
        ' a.start_service AS startService,' +
        ' a.end_service AS endService,' + 
        ' a.normal_payment AS normalPayment,' + 
        ' a.privilege_payment As privilegePayment,' + 
        ' a.receipt_printing AS receiptPrinting' + 
        ' FROM' +
        ' cards_history a' +
        ' INNER JOIN apartments b ON b.card_id = a.card_id' +
        ' WHERE' + 
        ' b.apartment_id = ?' +
        ' ORDER BY a.start_service DESC', [id],
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
      ' total = ?' +
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
          data.id], function (err) {
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

function updateApartments(data) {
  return new Promise(function (resolve, reject) {

    var queries = '';

    var existingApartments = data.apartments.table;
    if (isArray(existingApartments) && (existingApartments.length > 0)) {
      existingApartments.forEach(function(item) {
        queries += 'UPDATE apartments SET number = ' + item.number + ', letter = ' + item.letter + ', paid = ' + item.paid + ', privilege = ' + item.privilege + ', exempt = ' + item.exempt + ', locked = ' + item.locked + ' WHERE apartment_id = ' + item.uid + ';';
      });
    }

    var deletedApartments = data.apartments.isDeleted;
    if (isArray(deletedApartments) && (deletedApartments.length > 0)) {
      deletedApartments.forEach(function(item) {
        queries += 'DELETE FROM apartments WHERE apartment_id = ' + item + ';';
      });
    }

    if (queries !== '') {
      db.get().getConnection(function (err, connection) {
      connection.query(queries, [], function (err) {
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
    else {
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
      ' m_contract_number, start_service, end_service, maintenance_contract, m_start_apartment, m_end_apartment,' +
      ' normal_payment, privilege_payment, receipt_printing,' +
      ' contract_info, service_info,' +
      ' equipment_quantity, equipment_price, equipment_cost,' +
      ' mounting_quantity, mounting_price, mounting_cost,' +
      ' subscriber_unit_quantity, subscriber_unit_price, subscriber_unit_cost,' +
      ' key_quantity, key_price, key_cost,' +
      ' door_quantity, door_price, door_cost,' +
      ' subtotal, subtotal_for_apartment, discount_for_apartment, total)' +
      ' VALUES (' + 
      ' ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [
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
          data.complete.total.cost], function (err, rows) {
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
        ' LIMIT 1', [orderId], function (err, rows) {
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
        ' LIMIT 1', [clientId, residenceType], function (err, rows) {
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
        ' LIMIT 1', [clientId], function (err, rows) {
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

function addressOfClient(data) {
  var out = [];
  try {
    if ((data.city) && (data.city.trim() != '')) {
      out.push('Город: ' + data.city);
      {
        if (data.street.trim() != '') {
          out.push(', улица: ' + data.street);
        }
        if (data.house.trim() != '') {
          out.push(', дом: ' + data.house);
        }
        if (data.apartment.trim() != '') {
          out.push(', кв: ' + data.apartment);
        }
      }
    }
  }
  catch (err) {
    console.log('addressOfClient error: ', err.message);
  };
  return out.join('');
}

function passportData(data) {
  var out = [];
  try {
    if ((data.name) && (data.name.trim() != '')) {
      out.push(data.name);
      {
        if ((data.series) && (data.series.trim() != '')) {
          out.push(' серия ' + data.series);
        }
        if ((data.number) && (data.number.trim() != '')) {
          out.push(' № ' + data.number);
        }
        if (data.issued) {
          out.push(' выдан ' + moment(data.issued).format('DD.MM.YYYY'));
        }
        if ((data.department) && (data.department.trim() != '')) {
          out.push(' ' + data.department);
        }
      }
    }
  }
  catch (err) {
    console.log('passportData error: ', err.message);
  };
  return out.join('');
}

function generateReportForSetup(res, sceleton) {
  var templateFile = (sceleton.city.printType == 1) ? 'setup_pskov.docx' : 'setup_vluki.docx';
  var content = fs
    .readFileSync(path.join(__dirname, '../../../public/templates/' + templateFile), 'binary');

  var zip = new PizZip(content);
  var doc;
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
    MES: sceleton.equipment.guaranteePeriod == 0 ? 12 : sceleton.equipment.guaranteePeriod * 12,
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
    total: sceleton.complete.total.cost.toFixed(2)
  });

  try {
    doc.render()
  } catch (error) {
    errorHandler(error);
  }

  var buf = doc.getZip()
    .generate({ type: 'nodebuffer' });

  var outputFile = path.join(__dirname, '../../../public/docs/') + sceleton.contractNumber + '-1.doc';
  // buf is a nodejs buffer, you can either write it to a file or do anything else with it.
  fs.writeFileSync(outputFile, buf);

  res.download(outputFile, sceleton.contractNumber + '-1', function (err) {
    if (err) {
      res.send('Нет файла!');
    }
  });  

}

function generateReportForService(res, sceleton) {
  // Orginal code
  // https://www.tutorialswebsite.com/replace-word-document-placeholder-node-js/

  var templateFile = (sceleton.city.printType == 1) ? 'service_pskov.docx' : 'service_vluki.docx';
  var content = fs
    .readFileSync(path.join(__dirname, '../../../public/templates/' + templateFile), 'binary');

  var zip = new PizZip(content);
  var doc;
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
    doc.render()
  } catch (error) {
    errorHandler(error);
  }

  var buf = doc.getZip()
    .generate({ type: 'nodebuffer' });

  var outputFile = path.join(__dirname, '../../../public/docs/') + sceleton.contractNumber + '-2.doc';
  fs.writeFileSync(outputFile, buf);

  res.download(outputFile, sceleton.contractNumber + '-2', function (err) {
    if (err) {
      res.send('Нет файла!');
    }
  });
};

function replaceErrors(key, value) {
  if (value instanceof Error) {
    return Object.getOwnPropertyNames(value).reduce(function (error, key) {
      error[key] = value[key];
      return error;
    }, {});
  }
  return value;
}

function errorHandler(error) {
  console.log(JSON.stringify({ error: error }, replaceErrors));

  if (error.properties && error.properties.errors instanceof Array) {
    const errorMessages = error.properties.errors.map(function (error) {
      return error.properties.explanation;
    }).join("\n");
    console.log('errorMessages', errorMessages);
    // errorMessages is a humanly readable message looking like this :
    // 'The tag beginning with "foobar" is unopened'
  }
  throw error;
}

var Filters = function () {
  this.conditions = {
    period: {
      start: '',
      end: ''
    },
    city: { id: 0, name: '' },
    street: { id: 0, name: '', cityId: 0 },
    house: { id: 0, number: '', streetId: 0 },
    porch: { number: 0, houseId: 0 },
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

  var startDate = moment().startOf('month').toDate();
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
          cloneFilters.conditions.porch = {
            number: obj.porch.number
          };
        }

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
    ' WHERE (a.card_id > 0) AND (a.is_deleted = 0)' +
    add.whereSQL +
    add.orderBy +
    ' LIMIT ' + visibleRows;

  db.get().getConnection(function (err, connection) {
    connection.query(
      countRecordsQuery, [], function (err, rows) {
        connection.release();
        countRecords = rows[0].count;
        pageCount =
          (rows[0].count / visibleRows) < 1 ? 0 : Math.ceil(rows[0].count / visibleRows);

        db.get().getConnection(function (err, connection) {
          connection.query(
            fullQuery, [], function (err, rows) {
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
                  title: 'Договора',
                  data: rows,
                  pageCount: pageCount,
                  currentPage: currentPage,
                  visibleRows: visibleRows,
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

    order.getClientContractData(id, function (contractData) {
      contractClientData = order.decodeClientData(contractData);

      order.getClientServiceData(id, function (serviceData) {
        serviceClientData = order.decodeClientData(serviceData);

        order.getApartmentsFromContract(id, function (apartmentsList) {
          apartments = apartmentsList;

          db.get().getConnection(function (err, connection) {
            connection.query(
              queryOrder, [id], function (err, rows) {

                connection.release();

                if (err) {
                  console.error(err);
                  res.status(500).send(db.showDatabaseError(500, err));
                } else {

                  var data = rows[0];
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
                    orderModel.apartments.stat.paid = apartments.filter(function(element) {
                      return Number(element.paid) === 1;
                    }).length;
                    orderModel.apartments.stat.privilege = apartments.filter(function(element) {
                      return Number(element.privilege) === 1;
                    }).length;
                    orderModel.apartments.stat.exempt = apartments.filter(function(element) {
                      return Number(element.exempt) === 1;
                    }).length;
                    orderModel.apartments.stat.locked = apartments.filter(function(element) {
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

                  // res.render('docs/forms/order.ejs', {
                  res.render('docs/forms/order2.ejs', {
                    title: 'Договор',
                    data: orderModel,
                    moment: moment,
                    utils: utils,
                    errors: {},
                    // apartments: apartments,
                    user: req.session.userName
                  });
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
      errors: {},
      // apartments: [],
      user: req.session.userName
    });
  });

  router.get('/table', function (req, res) {
    var id = req.query.id;
    res.status(200).send({ 'table': id });
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
      ' WHERE (a.card_id > 0) AND (a.is_deleted = 0)' +
      add.whereSQL +
      add.orderBy +
      ' LIMIT ' + visibleRows +
      ' OFFSET ' + offset;

    db.get().getConnection(function (err, connection) {
      connection.query(
        countRecordsQuery, [], function (err, rows) {
          connection.release();
          countRecords = rows[0].count;
          pageCount =
            (rows[0].count / visibleRows) < 1 ? 0 : Math.ceil(rows[0].count / visibleRows);
          if ((offset > pageCount * visibleRows)) {
            offset = (pageCount - 1) * visibleRows;
          }

          db.get().getConnection(function (err, connection) {
            connection.query(
              fullQuery, [], function (err, rows) {
                connection.release();

                if (err) {
                  res.status(500).send(db.showDatabaseError(500, err));
                } else {
                  var currentPage = Math.ceil(offset / visibleRows) + 1;
                  res.render('docs/orders.ejs', {
                    title: 'Договора',
                    data: rows,
                    pageCount: pageCount,
                    currentPage: currentPage,
                    visibleRows: visibleRows,
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
                queryOrder, [id], function (err, rows) {

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

                    res.status(200).send({ order: data });
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
      .then(function(registeredAddress ) {
        if ((Array.isArray(registeredAddress)) && (registeredAddress.length === 1)) {
          sceleton.client.registeredAddress.city = registeredAddress[0].cityName;
          sceleton.client.registeredAddress.street = registeredAddress[0].streetName;
          sceleton.client.registeredAddress.house = registeredAddress[0].houseNumber;
          sceleton.client.registeredAddress.apartment = registeredAddress[0].apartment;
        }
        return getAddressInfo(sceleton.clientSetupId, 1);
      })
      .then(function(actualAddress ) {
        if ((Array.isArray(actualAddress)) && (actualAddress.length === 1)) {
          sceleton.client.actualAddress.city = actualAddress[0].cityName;
          sceleton.client.actualAddress.street = actualAddress[0].streetName;
          sceleton.client.actualAddress.house = actualAddress[0].houseNumber;
          sceleton.client.actualAddress.apartment = actualAddress[0].apartment;
        }
        return getClientInfo(sceleton.clientSetupId);
      })
      .then(function(passport) {
        if ((Array.isArray(passport)) && (passport.length === 1)) {
          sceleton.client.name = passport[0].clientName;
          sceleton.client.phones = passport[0].phones;
          sceleton.client.certificate.name = passport[0].certificate;
          sceleton.client.certificate.series = passport[0].series;
          sceleton.client.certificate.number = passport[0].number;
          sceleton.client.certificate.issued = passport[0].issued
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
      .then(function(registeredAddress ) {
        if ((Array.isArray(registeredAddress)) && (registeredAddress.length === 1)) {
          sceleton.client.registeredAddress.city = registeredAddress[0].cityName;
          sceleton.client.registeredAddress.street = registeredAddress[0].streetName;
          sceleton.client.registeredAddress.house = registeredAddress[0].houseNumber;
          sceleton.client.registeredAddress.apartment = registeredAddress[0].apartment;
        }
        return getAddressInfo(sceleton.clientServiceId, 1);
      })
      .then(function(actualAddress ) {
        if ((Array.isArray(actualAddress)) && (actualAddress.length === 1)) {
          sceleton.client.actualAddress.city = actualAddress[0].cityName;
          sceleton.client.actualAddress.street = actualAddress[0].streetName;
          sceleton.client.actualAddress.house = actualAddress[0].houseNumber;
          sceleton.client.actualAddress.apartment = actualAddress[0].apartment;
        }
        return getClientInfo(sceleton.clientServiceId);
      })
      .then(function(passport) {
        if ((Array.isArray(passport)) && (passport.length === 1)) {
          sceleton.client.name = passport[0].clientName;
          sceleton.client.phones = passport[0].phones;
          sceleton.client.certificate.name = passport[0].certificate;
          sceleton.client.certificate.series = passport[0].series;
          sceleton.client.certificate.number = passport[0].number;
          sceleton.client.certificate.issued = passport[0].issued
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

  router.post('/save', function (req, res) {

    var orderModel = new OrderModel();
    orderModel.id = req.body.id;
    orderModel.contractNumber = req.body.contractNumber;
    orderModel.createDate = req.body.createDate == null ? moment(new Date()).format('YYYY-MM-DD') : moment(req.body.createDate, 'DD.MM.YYYY').format('YYYY-MM-DD');
    orderModel.endContract = req.body.endContract != null ? moment(req.body.endContract, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;
    orderModel.creditTo = req.body.creditTo != null ? moment(req.body.creditTo, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;
    orderModel.repaid = req.body.repaid === 'on' ? 1 : 0;
    orderModel.fullAddress= req.body.fullAddress;
    orderModel.porch = req.body.porch;
    orderModel.numeration = req.body.numeration;
    orderModel.onePerson = req.body.onePerson === 'on' ? 1 : 0;
    orderModel.serviceNumber = req.body.serviceNumber;
    orderModel.startService = req.body.startService != null ? moment(req.body.startService, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;
    orderModel.endService = req.body.endService != null ? moment(req.body.endService, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;
    orderModel.maintenanceContract = req.body.maintenanceContract;
    orderModel.startApartment = req.body.startApartment;
    orderModel.endApartment = req.body.endApartment;
    orderModel.normalPayment = Number(req.body.normalPayment);
    orderModel.privilegePayment = Number(req.body.privilegePayment);
    orderModel.receiptPrinting = ((req.body.receiptPrinting != null) && (req.body.receiptPrinting.trim().length > 0)) ? moment(req.body.receiptPrinting, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;
    orderModel.contractInfo = req.body.contractInfo;
    orderModel.serviceInfo = req.body.serviceInfo;

    try {
      orderModel.equipment = JSON.parse(req.body.equipment);
      orderModel.client = JSON.parse(req.body.client);
      orderModel.address = JSON.parse(req.body.address);
      orderModel.complete = JSON.parse(req.body.complete);
      orderModel.apartments = JSON.parse(req.body.apartments);
    } catch (error) {
      console.log(error);
    }

    req.assert('contractNumber', 'Номер договора не введен').notEmpty();
    req.assert('createDate', 'Дата создания не заполнена').notEmpty();
    req.assert('equipment', 'Оборудование не заполнено').custom(function(data) {
      var result = false
      try {
        var equipment = JSON.parse(data);
        result = +equipment.key > 0;
      } catch (error) {

      }
      return result;
    });
    req.assert('creditTo', 'Дата кредита не заполнена').notEmpty();
    req.assert('address', 'Адрес не заполнен').custom(function(data) {
      var result = false
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
    if (! errors) {
      if (orderModel.id != 0) {
        updateOrder(orderModel)
        .then(function() {
          return updateApartments(orderModel);
        })
        .then(function() {
          res.redirect('/orders');
        })
        .catch(function(error) {
          console.log(error);
        });
      }
      else {
        saveOrder(orderModel)
        .then(function() {
          res.redirect('/orders');
        })
        .catch(function(error) {
          console.log(error);
        });
      }
    }
    else {
      res.render('docs/forms/order2.ejs', {
        title: 'Договор',
        data: orderModel,
        moment: moment,
        utils: utils,
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
          ' DELETE FROM cards WHERE card_id = ?', [+req.body.id], function (err) {
            connection.release();
            if (err) {
              res.status(500).send({
                'code': 500,
                'msg': 'Database Error',
                'err': JSON.stringify(err)
              });
            } else {
              res.status(200).send({ 'result': 'OK' });
            }
          }
        );
      });
    } else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
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
      queryText += ' LIMIT ' + ('limit' in data ? data.limit : rowsLimit);

      db.get().getConnection(function (err, connection) {
        connection.query(
          queryText, [], function (err, rows) {
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
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  router.post('/find_equipment', function (req, res) {
    var data = req.body;
    if ((data) && (typeof (data) === 'object') && ('suggestion' in data)) {
      var rowsCount = 'limit' in data ? data.limit : rowsLimit;
      var params = {
        suggestion: data.suggestion,
        rowsCount: rowsCount
      };
      common.filterEquipments(params, function (err, rows) {
        res.status(200).send(rows);
      });
    } else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  router.post('/find_full_address', function (req, res) {
    var data = req.body;
    if ((data) && (typeof (data) === 'object') && ('suggestion' in data)) {
      var rowsCount = 'rowsCount' in data ? data.rowsCount : rowsLimit;
      var params = {
        suggestion: data.suggestion,
        rowsCount: rowsCount
      };
      common.outFullAddress(params, function (err, rows) {
        res.status(200).send(rows);
      });
    }
    else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  router.post('/find_city', function (req, res) {
    var data = req.body;
    if ((data) && (typeof (data) === 'object') && ('cityName' in data)) {
      var rowsCount = 'limit' in data ? data.limit : rowsLimit;
      var params = {
        cityName: data.cityName,
        rowsCount: rowsCount
      };
      common.filterCities(params, function (err, rows) {
        res.status(200).send(rows);
      });
    } else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  router.post('/find_street', function (req, res) {
    var data = req.body;
    if ((data) && (typeof (data) === 'object') && ('streetName' in data) && ('cityId' in data)) {
      var rowsCount = 'limit' in data ? data.limit : rowsLimit;
      var params = {
        cityId: data.cityId,
        streetName: data.streetName,
        rowsCount: rowsCount
      };
      common.filterStreets(params, function (err, rows) {
        res.status(200).send(rows);
      });
    } else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  router.post('/find_house', function (req, res) {
    var data = req.body;
    if ((data) && (typeof (data) === 'object') && ('houseNumber' in data) && ('streetId' in data)) {
      var rowsCount = 'limit' in data ? data.limit : rowsLimit;
      var params = {
        streetId: data.streetId,
        houseNumber: data.houseNumber,
        rowsCount: rowsCount
      };
      common.filterHouses(params, function (err, rows) {
        res.status(200).send(rows);
      });
    } else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  router.post('/find_porch', function (req, res) {
    var data = req.body;
    if ((data) && (typeof (data) === 'object') && ('porch' in data) && ('houseId' in data)) {
      var rowsCount = 'limit' in data ? data.limit : rowsLimit;
      var params = {
        houseId: data.houseId,
        porch: data.porch,
        rowsCount: rowsCount
      };
      common.filterPorches(params, function (err, rows) {
        res.status(200).send(rows);
      });
    } else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  router.post('/find_order', function (req, res) {
    var data = req.body;
    if ((data) && (typeof (data) === 'object') && ('orderNumber' in data)) {
      var orderNumber = data.orderNumber;
      var rowsCount = 'limit' in data ? data.limit : rowsLimit;
      common.filterOrders(orderNumber, rowsCount, function (err, rows) {
        res.status(200).send(rows);
      });
    } else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  router.post('/find_prolonged_order', function (req, res) {
    var data = req.body;
    if ((data) && (typeof (data) === 'object') && ('orderNumber' in data)) {
      var orderNumber = data.orderNumber;
      var rowsCount = 'limit' in data ? data.limit : rowsLimit;
      common.filterProlongedOrders(orderNumber, rowsCount, function (err, rows) {
        res.status(200).send(rows);
      });
    } else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  router.post('/find_client', function (req, res) {
    var data = req.body;
    if ((data) && (typeof (data) === 'object') && ('suggestion' in data)) {
      var rowsCount = 'limit' in data ? data.limit : rowsLimit;
      var params = {
        suggestion: data.suggestion,
        rowsCount: rowsCount
      };
      common.filterClients(params, function (err, rows) {
        res.status(200).send(rows);
      });
    }
    else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  router.post('/payments_history', function (req, res) {
    var data = req.body;
    var out = {
      payments: [],
      fines: [],
      prices: []
    };
    if ((data) && (typeof (data) === 'object') && ('id' in data)) {
      var rowsCount = 'limit' in data ? data.limit : rowsLimit;

      getPayments(data.id)
      .then(function(payments) {
        out.payments = payments;
        return getFines(data.id);
      })
      .then(function(fines) {
        out.fines = fines;
        return getPrices(data.id);
      })
      .then(function(prices) {
        out.prices = prices;
        res.status(200).send(out);
      })
      .catch(function (error) {
        console.log(error.message);
        res.status(500).send(error.message);
      });
    }
    else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  return router;
};