const path = require('path');
const express = require('express');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
// const PDFDocument = require('pdfkit');
const moment = require('moment');

const db = require('../../../lib/db');
const cfg = require('../../../lib/config').config;
const utils = require('../../../lib/utils');
// const order = require('../../../lib/order_service');
// const queryOrder = require('../../../queries/orders').getOrder;
// const queryDeleteExistsApartments = require('../../../queries/orders').deleteExistsApartments;
const common = require('../../common/typeheads');
// const { OrderModel } = require('../../../models/order');
const models = require('../../../models/order');
const { PrintReceipts } = require('../../../lib/print_receipts_for_gates');
const { ClientModel } = require('../../../models/client');
const operationsWithClient = require('../../common/operations_with_client');

const { hostIP, hostPort } = require('../../../lib/config').config;
const { rowsLimit } = require('../../../lib/config').config;
const { GateModel } = require('../../../models/gate');

require('shelljs/global');

const getApartmentInfo = (id) => new Promise((resolve, reject) => {
  db.get().getConnection((err, connection) => {
    connection.query(
      `SELECT a.number AS apartmentNumber, a.letter, b.m_contract_number  AS prolongedContractNumber,
      b.m_duplicate AS isDuplicate FROM apartments a
      LEFT JOIN cards b ON b.card_id = a.card_id
      WHERE a.apartment_id = ? LIMIT 1`, [id], (errors, rows) => {
        connection.release();
        if (errors) {
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

const generatePersonalAccount = (data) => {
  const out = [];

  let rpts = 6 - (data.prolongedContractNumber.trim().length);
  const outContractNumber = (rpts > 0 ? '0'.repeat(rpts) : '') + data.prolongedContractNumber.trim();

  rpts = (3 - data.apartmentNumber.toString().trim().length);
  const outApartment = (rpts > 0 ? '0'.repeat(rpts) : '') + data.apartmentNumber.toString().trim();

  out.push(data.isDuplicate ? '1' : '0');
  out.push(outContractNumber);
  out.push('_');
  out.push(data.letter.toString());
  out.push(outApartment);

  return out.join('');
};

class Filter {
  constructor() {
    this.conditions = {
      period: {
        start: '',
        end: '',
      },
      city: {
        id: 0,
        name: '',
      },
      street: {
        id: 0,
        name: '',
        cityId: 0,
      },
      house: {
        id: 0,
        number: '',
        streetId: 0,
      },
      contractNumber: 0,
    };
    this.whereSQL = '';
    this.orderBy = '';
  }
}

const getPayments = (id) => new Promise((resolve, reject) => {
  db.get().getConnection((err, connection) => {
    connection.query(
      ` SELECT
      'a.payment_id AS uid,
      'a.create_date AS createDate,
      'a.pay_month AS payMonth,
      'a.pay_year AS payYear,
      'a.pay_date AS payDate,
      'a.amount,
      'a.mode,
      'a.privilege,
      'b.name as organizationName
      'FROM payments a
      'LEFT JOIN organizations b ON b.organization_id = a.mode
      'WHERE
      '(a.apartment_id = ?)
      'AND (a.is_registered = 0)
      'ORDER BY
      'a.pay_date DESC, payment_id`, [id],
      (errors, rows) => {
        connection.release();
        if (errors) {
          reject(errors);
        } else {
          resolve(rows);
        }
      },
    );
  });
});

const getPaymentsByRegister = (id) => new Promise((resolve, reject) => {
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
      b.name as organizationName
      FROM payments a
      LEFT JOIN organizations b ON b.organization_id = a.mode
      WHERE
      (a.apartment_id = ?)
      AND (a.is_registered = 1)
      ORDER BY
      a.pay_date DESC, a.payment_id`, [id],
      (errors, rows) => {
        connection.release();
        if (errors) {
          reject(errors);
        } else {
          resolve(rows);
        }
      },
    );
  });
});

const getPrices = (id) => new Promise((resolve, reject) => {
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
      (errors, rows) => {
        connection.release();
        if (errors) {
          reject(errors);
        } else {
          resolve(rows);
        }
      },
    );
  });
});

const getGate = (id) => new Promise((resolve, reject) => {
  db.get().getConnection((err, connection) => {
    connection.query(
      `SELECT
      a.contract_number, a.create_date, a.client_id, a.city_id, a.street_id, a.house_id,
      a.start_service, a.end_service, a.maintenance_contract,
      a.m_start_apartment, a.m_end_apartment, a.normal_payment, a.receipt_printing, a.contract_info,
      b.name AS city_name, c.name AS street_name, d.number AS house_number,
      e.name AS area_name, b.parent_id AS area_id, b.no_streets, b.no_houses
      FROM cards a
      LEFT JOIN cities b ON b.city_id = a.city_id
      LEFT JOIN streets c ON c.street_id = a.street_id
      LEFT JOIN houses d ON d.house_id = a.house_id
      LEFT JOIN cities e ON e.city_id = b.parent_id
      WHERE a.card_id = ?`, [id],
      (errors, rows) => {
        connection.release();
        if (errors) {
          reject(errors);
        } else {
          resolve(rows.length === 1 ? rows[0] : null);
        }
      },
    );
  });
});

const getClient = (id) => new Promise((resolve, reject) => {
  db.get().getConnection((err, connection) => {
    connection.query(
      `SELECT
      a.client_id, a.name, b.phones FROM clients a
      LEFT JOIN faces b ON b.client_id = a.client_id
      WHERE a.client_id = ?`, [id],
      (errors, rows) => {
        connection.release();
        if (errors) {
          reject(errors);
        } else {
          resolve(rows.length === 1 ? rows[0] : null);
        }
      },
    );
  });
});

const getAparments = (id) => new Promise((resolve, reject) => {
  db.get().getConnection((err, connection) => {
    connection.query(
      `SELECT
      a.apartment_id, a.number, a.letter,  a.paid, a.half_paid,
      a.exempt, a.locked, a.paid_dt
      FROM apartments a
      WHERE a.card_id = ?
      ORDER BY a.number, a.letter`, [id],
      (errors, rows) => {
        connection.release();
        if (errors) {
          reject(errors);
        } else {
          resolve(rows);
        }
      },
    );
  });
});

const filterBuilder = (req) => {
  const filter = new Filter();
  // let obj = {};
  // let where = '';

  // var startDate = moment().startOf('month').toDate();
  const startDate = moment('2000-01-01').format('YYYY-MM-DD');
  const endDate = moment().endOf('month').toDate();

  if (!('filterGates' in req.session)) {
    req.session.filterGates = filter;
  }
  if (filter.conditions.period.start === '') {
    filter.conditions.period.start = moment(startDate).format('YYYY-MM-DD HH:mm');
  }
  if (filter.conditions.period.end === '') {
    filter.conditions.period.end = moment(endDate).format('YYYY-MM-DD HH:mm');
  }

  // try {
  //   if (req.query) {
  //     if ('filters' in req.query) {
  //       obj = JSON.parse(req.query.filters);

  //       if (+obj.city.id > 0) {
  //         where += ' AND (a.city_id = ' + obj.city.id + ')';
  //       }
  //       cloneFilters.conditions.city = {
  //         id: obj.city.id,
  //         name: obj.city.name
  //       };

  //       if (+obj.street.id > 0) {
  //         where += ' AND (a.street_id = ' + obj.street.id + ')';
  //       }
  //       cloneFilters.conditions.street = {
  //         id: obj.street.id,
  //         name: obj.street.name,
  //         cityId: obj.street.cityId
  //       };

  //       if (+obj.house.id > 0) {
  //         where += ' AND (a.house_id = ' + obj.house.id + ')';
  //       }
  //       cloneFilters.conditions.house = {
  //         id: obj.house.id,
  //         number: obj.house.number,
  //         streetId: obj.house.streetId
  //       };

  //       if (+obj.porch.number > 0) { // + add "No data"
  //         where += ' AND (a.porch = ' + obj.porch.number + ')';
  //       }
  //       cloneFilters.conditions.porch = {
  //         number: obj.porch.number
  //       };

  //       if (+obj.number.order > 0) {
  //         where += ' AND (a.contract_number = ' + obj.number.order + ')';
  //       }
  //       cloneFilters.conditions.number.order = obj.number.order;

  //       if (+obj.number.prolongedOrder > 0) {
  //         where += ' AND (a.m_contract_number = ' + obj.number.prolongedOrder + ')';
  //       }
  //       cloneFilters.conditions.number.prolongedOrder = obj.number.prolongedOrder;

  //       if ('onlyMaintenanceService' in obj) {
  //         cloneFilters.conditions.onlyMaintenanceService = obj.onlyMaintenanceService;
  //       }

  //       var _start = obj.period.start; // YYYY-MM-DD HH:mm
  //       if (typeof _start === 'string') {
  //         if (_start.length > 0) {
  //           cloneFilters.conditions.period.start = _start;
  //         } else {
  //           cloneFilters.conditions.period.start = moment(startDate).format('YYYY-MM-DD HH:mm');
  //         }
  //       }

  //       var _end = obj.period.end; // YYYY-MM-DD HH:mm
  //       if (typeof _end === 'string') {
  //         if (_end.length > 0) {
  //           cloneFilters.conditions.period.end = _end;
  //         } else {
  //           cloneFilters.conditions.period.end = endDate;
  //         }
  //       }

  //       if (cloneFilters.conditions.onlyMaintenanceService) {
  //         where += ' AND (maintenance_contract >= 1)';
  //         where += ' AND (a.end_service >= ' + '"' + cloneFilters.conditions.period.start + '")';
  //         where += ' AND (a.end_service <= ' + '"' + cloneFilters.conditions.period.end + '")';

  //         cloneFilters.orderBy = ' ORDER BY a.end_service DESC, a.contract_number DESC';
  //       } else {
  //         where += ' AND (a.create_date >= ' + '"' + cloneFilters.conditions.period.start + '")';
  //         where += ' AND (a.create_date <= ' + '"' + cloneFilters.conditions.period.end + '")';

  //         cloneFilters.orderBy = ' ORDER BY a.create_date DESC, a.contract_number DESC';
  //       }

  //       cloneFilters.whereSQL = where;
  //     }
  //   }

  //   req.session.filtersOrders = cloneFilters;

  // } catch (err) {
  //   throw (err);
  // }
  return filter;
};

const getTotalRecords = (filter) => {
  let verificationFilter = '';
  if (filter && typeof filter === 'string') {
    verificationFilter = `WHERE ${filter}`;
  }
  const queryText = `SELECT count(*) AS totalRecords FROM cards ${verificationFilter}`;

  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        queryText, [], (error, rows) => {
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
};

const getTableData = (visibleRows, offset, filter) => {
  let verificationFilter = '';
  if (filter && typeof filter === 'string') {
    verificationFilter = `WHERE ${filter}`;
  }
  const queryText = `SELECT
    a.card_id, a.create_date, a.contract_number,
    b.name AS city_name, c.name AS street_name, d.number AS house_number,
    a.m_start_apartment, a.m_end_apartment, a.end_service, a.receipt_printing,
    e.name AS area_name, b.parent_id AS area_id,
    b.no_streets, b.no_houses, b.city_id, c.street_id, d.house_id
    FROM cards a
    LEFT JOIN cities b ON b.city_id = a.city_id
    LEFT JOIN streets c ON c.street_id = a.street_id
    LEFT JOIN houses d ON d.house_id = a.house_id
    LEFT JOIN cities e ON e.city_id = b.parent_id
    ${verificationFilter}
    ORDER BY a.create_date DESC
    LIMIT ${visibleRows}
    OFFSET ${offset}`;

  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        queryText, [], (error, rows) => {
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
};

const isExistsContractNumber = (contractNumber) => new Promise((resolve, reject) => {
  db.get().getConnection((err, connection) => {
    connection.query(
      'SELECT a.card_id AS uid FROM cards a WHERE a.contract_number = ?', [contractNumber],
      (errors, rows) => {
        connection.release();
        if (errors) {
          reject();
        } else {
          resolve(rows.length > 0 ? rows[0].uid : null);
        }
      },
    );
  });
});

const paymentsHistory = async (apartmentId) => {
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
    out.fines = await getPaymentsByRegister(apartmentId);
    out.prices = await getPrices(apartmentId);
  } catch (error) {
    console.log(error.message);
  }
  return out;
};

const addPayment = (data) => new Promise((resolve, reject) => {
  db.get().getConnection((err, connection) => {
    connection.query(
      `INSERT INTO payments (
      create_date, apartment_id, pay_month, pay_year, amount, pay_date, mode, is_registered)
      VALUES (?,?,?,?,?,?,?,?)`, [
        data.createDate,
        data.apartmentId,
        data.payMonth,
        data.payYear,
        data.amount,
        data.payDate,
        data.mode,
        data.isRegistered,
      ], (errors, rows) => {
        connection.release();
        if (errors) {
          reject();
        } else {
          resolve(rows.insertId);
        }
      },
    );
  });
});

const getOrderIdFromApartment = (apartmentId) => new Promise((resolve, reject) => {
  db.get().getConnection((err, connection) => {
    connection.query(
      'SELECT card_id FROM apartments WHERE apartment_id = ?', [apartmentId],
      (errors, rows) => {
        connection.release();
        if (errors) {
          reject();
        } else {
          resolve((Array.isArray(rows) && rows.length === 1) ? rows[0].card_id : null);
        }
      },
    );
  });
});

function checkCurrentPeriod(documentId) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query('CALL check_current_period(?)', [documentId],
        (error) => {
          connection.release();
          if (error) {
            reject();
          } else {
            resolve();
          }
        });
    });
  });
}

function getPaymentOptions() {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        `SELECT a.organization_id AS id, a.name AS description
        FROM organizations a
        WHERE
        a.for_receipt > 0
        ORDER BY a.for_receipt ASC`, [],
        (error, rows) => {
          connection.release();
          if (err) {
            reject(error);
          } else {
            resolve(rows);
          }
        },
      );
    });
  });
}

const insertApartments = (data) => new Promise((resolve, reject) => {
  const apartments = data.apartments.grid;
  if (Array.isArray(apartments) && (apartments.length > 0) && (data.apartments.isRebuilt)) {
    let queries = '';
    apartments.forEach((item) => {
      queries += `INSERT INTO apartments (number, letter, paid, exempt, locked, card_id) VALUES (
        ${item.number},
        ${item.letter},
        ${item.paid},
        ${item.exempt},
        ${item.locked},
        ${data.id});`;
    });

    db.get().getConnection((err, connection) => {
      connection.query(queries, [], (errors) => {
        connection.release();
        if (errors) {
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

const deleteApartments = (data) => new Promise((resolve, reject) => {
  let queries = '';
  if ((data.id > 0) && (data.apartments.isRebuilt)) {
    const apartments = data.apartments.deleted;
    apartments.forEach((item) => {
      if (Number(item) > 0) {
        queries += `DELETE FROM apartments WHERE apartment_id = ${item};`;
      }
    });
  }

  if (queries) {
    db.get().getConnection((err, connection) => {
      connection.query(queries, [], (error) => {
        connection.release();
        if (error) {
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

const updateApartments = (data) => new Promise((resolve, reject) => {
  let queries = '';
  const apartments = data.apartments.grid;
  if (Array.isArray(apartments) && (apartments.length > 0)) {
    apartments.forEach((item) => {
      if (Number(item.uid) > 0) {
        queries += `UPDATE apartments SET number = ${item.number},
          letter = ${item.letter},
          paid = ${item.paid},
          exempt = ${item.exempt},
          locked = ${item.locked}
          WHERE apartment_id = ${item.uid};`;
      } else {
        queries += `INSERT INTO apartments (number, letter, paid, exempt, locked, card_id) VALUES (
          ${item.number},
          ${item.letter},
          ${item.paid},
          ${item.exempt},
          ${item.locked},
          ${data.id});`;
      }
    });
  }

  if (queries) {
    db.get().getConnection((err, connection) => {
      connection.query(queries, [], (error) => {
        connection.release();
        if (error) {
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

const insertGate = (data) => new Promise((resolve, reject) => {
  db.get().getConnection((err, connection) => {
    connection.query(
      `INSERT INTO cards (
      contract_number, create_date, client_id, city_id, street_id, house_id,
      start_service, end_service, maintenance_contract, m_start_apartment, m_end_apartment,
      normal_payment, receipt_printing, contract_info, rank)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
        data.contractNumber,
        data.created,
        data.client.id,
        data.address.city.id,
        data.address.street.id,
        data.address.house.id,
        data.startService,
        data.endService,
        data.maintenanceContract,
        data.apartmentFrom,
        data.apartmentTo,
        data.payment,
        data.receiptPrinting,
        data.info,
        1,
      ],
      (errors, rows) => {
        connection.release();
        if (err) {
          reject(errors);
        } else {
          resolve(rows.insertId);
        }
      },
    );
  });
});

const updateGate = (data) => new Promise((resolve, reject) => {
  db.get().getConnection((err, connection) => {
    connection.query(
      `UPDATE cards SET
      contract_number = ?,
      create_date = ?,
      client_id = ?,
      city_id = ?,
      street_id = ?,
      house_id = ?,
      start_service = ?,
      end_service = ?,
      maintenance_contract = ?,
      m_start_apartment = ?,
      m_end_apartment = ?,
      normal_payment = ?,
      receipt_printing = ?,
      contract_info = ?
      WHERE card_id = ?`, [
        data.contractNumber,
        data.created,
        data.client.id,
        data.address.city.id,
        data.address.street.id,
        data.address.house.id,
        data.startService,
        data.endService,
        data.maintenanceContract,
        data.apartmentFrom,
        data.apartmentTo,
        data.payment,
        data.receiptPrinting,
        data.info,
        data.id,
      ],
      (errors) => {
        connection.release();
        if (errors) {
          reject(errors);
        } else {
          resolve();
        }
      },
    );
  });
});

function changeAddress(data) {
  const { operation, value, parentId } = data;
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query('CALL change_address(?,?,?)', [operation, value, parentId],
        (error, rows) => {
          connection.release();
          if (error) {
            reject(error);
          } else {
            resolve(rows[0]);
          }
        });
    });
  });
}

const saveClientData = async (data, res) => {
  const clientModel = new ClientModel();
  clientModel.id = data.id;
  clientModel.lastName = data.lastName;

  clientModel.certificate.typeId = data.certificateId;
  clientModel.certificate.series = data.certificateSeries;
  clientModel.certificate.number = data.certificateNumber;
  clientModel.certificate.issued =  ((data.issued != null) && (data.issued.trim().length > 0)) ? moment(data.issued, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;
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
    } else {
      const uid = await operationsWithClient.addClient(clientModel);
      clientModel.id = uid;
      await operationsWithClient.addClientFace(clientModel);
      await operationsWithClient.addClientRegisteredAddress(clientModel);
      await operationsWithClient.addClientActualAddress(clientModel);
    }
    res.status(200).send({ id: clientModel.id });
  }
  catch (error) {
    if (clientModel.id > 0) {
      // eslint-disable-next-line no-console
      console.log('Client update Error');
    } else {
      // eslint-disable-next-line no-console
      console.log('Client insert Error');
    }
    res.status(500);
  }
};

module.exports = () => {
  const router = express.Router();

  router.get('/', async (req, res) => {
    const addFilter = 'rank = 1';
    const { totalRecords } = await getTotalRecords(addFilter);
    const rows = await getTableData(rowsLimit, 0, addFilter);
    const currentPage = Math.ceil(0 / rowsLimit) + 1;
    const pageCount = (totalRecords / rowsLimit) < 1 ? 0 : Math.ceil(totalRecords / rowsLimit);

    const data = [];
    rows.forEach((item) => {
      let fullAddress = item.area_id > 0 ? `${item.area_name}, ` : '';
      fullAddress += item.city_id > 0 ? `${item.city_name}` : '';
      fullAddress += ((item.street_id > 0) && (item.no_streets)) ? '' : `, ${item.street_name}`;
      fullAddress += ((item.house_id > 0) && (item.no_houses)) ? '' : `, ${item.house_number}`;

      data.push({
        id: item.card_id,
        contractNumber: item.contract_number,
        created: item.create_date,
        fullAddress,
        cityName: item.city_name,
        streetName: item.street_name,
        houseNumber: item.house_number,
        numeration: (item.m_start_apartment > 0 && item.m_end_apartment > 0) ? `${item.m_start_apartment} - ${item.m_end_apartment}` : '',
        endService: item.end_service,
        receiptPrinting: item.receipt_printing,
      });
    });

    const filter = filterBuilder(req);

    res.render('./docs/gates.ejs', {
      title: 'Ворота',
      data,
      currentPage,
      pageCount,
      totalRecords,
      rowsLimit,
      moment,
      filter: filter.conditions,
      user: req.session.userName,
    });
  });

  router.get('/add', (req, res) => {
    const gateModel = new GateModel();

    res.render('docs/forms/gate.ejs', {
      title: 'Договор на ворота',
      data: gateModel,
      moment,
      utils,
      hostIP,
      hostPort,
      errors: {},
      user: req.session.userName,
    });
  });

  //   router.get('/', function (req, res) {
  //     filterRecords(req, res);
  //   });

  router.get('/edit/:id', async (req, res) => {
    const { params: { id } } = req;

    const gateModel = new GateModel();
    const gateData = await getGate(id);
    gateModel.id = id;
    gateModel.contractNumber = gateData.contract_number;
    gateModel.created = gateData.create_date;
    gateModel.address.area.id = gateData.area_id;
    gateModel.address.area.name = gateData.area_name;
    gateModel.address.city.id = gateData.city_id;
    gateModel.address.city.name = gateData.city_name;
    gateModel.address.street.id = gateData.street_id;
    gateModel.address.street.name = gateData.street_name;
    gateModel.address.house.id = gateData.house_id;
    gateModel.address.house.number = gateData.house_number;
    gateModel.address.noStreets = gateData.no_streets;
    gateModel.address.noHouses = gateData.no_houses;
    gateModel.client.id = gateData.client_id;
    gateModel.startService = gateData.start_service;
    gateModel.endService = gateData.end_service;
    gateModel.maintenanceContract = gateData.maintenance_contract;
    gateModel.apartmentFrom = gateData.m_start_apartment;
    gateModel.apartmentTo = gateData.m_end_apartment;
    gateModel.payment = gateData.normal_payment;
    gateModel.receiptPrinting = gateData.receipt_printing;
    gateModel.info = gateData.contract_info;

    gateModel.address.full = gateData.area_id > 0 ? `${gateData.area_name}, ` : '';
    gateModel.address.full += gateData.city_id > 0 ? `${gateData.city_name}` : '';
    gateModel.address.full += gateData.street_id > 0 && gateData.no_streets ? '' : `, ${gateData.street_name}`;
    gateModel.address.full += gateData.house_id > 0 && gateData.no_houses ? '' : `, ${gateData.house_number}`;

    if (gateModel.address.city.id > 0) {
      gateModel.fullAddress = `${gateModel.address.city.name}, `;
      if (gateModel.address.street.id > 0) {
        gateModel.fullAddress += `${gateModel.address.street.name}, `;
        if (gateModel.address.house.id > 0) {
          gateModel.fullAddress += `${gateModel.address.house.number}`;
        }
      }
    }

    if (gateModel.apartmentFrom > 0 && gateModel.apartmentTo > 0) {
      gateModel.numeration = `${gateModel.apartmentFrom} -${gateModel.apartmentTo}`;
    }

    const clientData = await getClient(gateModel.client.id);
    gateModel.client.name = clientData.name;
    gateModel.client.phones = clientData.phones;

    const apartmentsData = await getAparments(gateModel.id);
    if (Array.isArray(apartmentsData) && apartmentsData.length > 0) {
      apartmentsData.forEach((item) => {
        gateModel.apartments.grid.push({
          uid: item.apartment_id,
          number: item.number,
          letter: item.letter,
          paid: item.paid,
          halfPaid: item.half_paid,
          exempt: item.exempt,
          locked: item.locked,
          paidDT: item.paid_dt,
        });

        if (item.paid === 1) {
          gateModel.apartments.stat.paid += 1;
        }
        if (item.exempt === 1) {
          gateModel.apartments.stat.exempt += 1;
        }
        if (item.locked === 1) {
          gateModel.apartments.stat.locked += 1;
        }
      });
    }

    res.render('docs/forms/gate.ejs', {
      title: 'Договор на ворота',
      data: gateModel,
      moment,
      utils,
      hostIP,
      hostPort,
      errors: {},
      user: req.session.userName,
    });
  });

  router.get('/:offset', async (req, res) => {
    const { params: { offset } } = req;
    const addFilter = 'rank = 1';
    const { totalRecords } = await getTotalRecords(addFilter);
    const rows = await getTableData(rowsLimit, +offset, addFilter);
    const currentPage = Math.ceil(+offset / rowsLimit) + 1;
    const pageCount = (totalRecords / rowsLimit) < 1 ? 0 : Math.ceil(totalRecords / rowsLimit);

    const data = [];
    rows.forEach((item) => {
      let fullAddress = item.area_id > 0 ? `${item.area_name}, ` : '';
      fullAddress += item.city_id > 0 ? `${item.city_name}` : '';
      fullAddress += ((item.street_id > 0) && (item.no_streets)) ? '' : `, ${item.street_name}`;
      fullAddress += ((item.house_id > 0) && (item.no_houses)) ? '' : `, ${item.house_number}`;

      data.push({
        id: item.gate_id,
        contractNumber: item.contract_number,
        created: item.create_date,
        fullAddress,
        cityName: item.city_name,
        streetName: item.street_name,
        houseNumber: item.house_number,
        numeration: (item.m_start_apartment > 0 && item.m_end_apartment > 0) ? `${item.m_start_apartment} - ${item.m_end_apartment}` : '',
        endService: item.end_service,
        receiptPrinting: item.receipt_printing,
      });
    });

    const filter = filterBuilder(req);

    res.render('./docs/gates.ejs', {
      title: 'Ворота',
      data,
      currentPage,
      pageCount,
      totalRecords,
      rowsLimit,
      moment,
      filter: filter.conditions,
      user: req.session.userName,
    });
  });

  router.post('/save', async (req, res) => {
    const gateModel = new GateModel();

    let blackbox = {};
    try {
      blackbox = JSON.parse(req.body.blackbox);
    } catch (error) {
      //
    }

    if (typeof blackbox === 'object') {
      gateModel.address.area.id = parseInt(blackbox.address.area.id, 10);
      gateModel.address.area.name = blackbox.address.area.name;
      gateModel.address.city.id = parseInt(blackbox.address.city.id, 10);
      gateModel.address.city.name = blackbox.address.city.name;
      gateModel.address.street.id = parseInt(blackbox.address.street.id, 10);
      gateModel.address.street.name = blackbox.address.street.name;
      gateModel.address.house.id = parseInt(blackbox.address.house.id, 10);
      gateModel.address.house.number = blackbox.address.house.number;
      gateModel.address.noStreets = blackbox.address.noStreets;
      gateModel.address.noHouses = blackbox.address.noHouses;
      gateModel.client.id = parseInt(blackbox.clientId, 10);
      gateModel.apartments = blackbox.apartments;
    }

    gateModel.id = +req.body.id;
    gateModel.contractNumber = parseInt(req.body.contractNumber, 10) || 0;
    gateModel.created = moment(req.body.created, 'DD.MM.YYYY').format('YYYY-MM-DD');
    gateModel.client.name = req.body.clientName;
    gateModel.address.full = req.body.fullAddress;
    gateModel.client.phones = req.body.clientPhones;
    gateModel.startService = ((req.body.startService != null) && (req.body.startService.trim().length > 0)) ? moment(req.body.startService, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;
    gateModel.endService = ((req.body.endService != null) && (req.body.endService.trim().length > 0)) ? moment(req.body.endService, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;
    gateModel.maintenanceContract = req.body.maintenanceContract;
    gateModel.apartmentFrom = req.body.apartmentFrom;
    gateModel.apartmentTo = req.body.apartmentTo;
    gateModel.payment = Number(req.body.payment) || 0;
    gateModel.receiptPrinting = ((req.body.receiptPrinting != null) && (req.body.receiptPrinting.trim().length > 0)) ? moment(req.body.receiptPrinting, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;
    gateModel.info = req.body.info;

    const gateId = (await isExistsContractNumber(gateModel.contractNumber));

    req.assert('contractNumber', 'Номер договора не введен.').notEmpty();
    req.assert('contractNumber', 'Номер договора не должен превышать 6 цифр.').isLength({ max: 6 });
    req.assert('contractNumber', 'Номер договора содержит исключительно цифры.').isNumeric();
    req.assert('contractNumber', 'Такой номер уже существует!').custom((data) => {
      if (gateModel.id > 0) {
        return (gateModel.id === gateId)
          && (parseInt(gateModel.contractNumber, 10) === parseInt(data, 10));
      }
      return (gateId === null) || ((gateId) && (gateId === 0));
    });
    req.assert('created', 'Дата создания не заполнена').notEmpty();
    req.assert('address', 'Адрес не заполнен').custom(() => (gateModel.address.city.id > 0)
        && (gateModel.address.street.id > 0) && (gateModel.address.house.id > 0));

    const errors = req.validationErrors();
    if (!errors) {
      if ('printingReceipts' in req.body) {
        const printReceipts = new PrintReceipts(gateModel.id, res);
        printReceipts.go();
        return;
      }

      if (gateModel.id === 0) {
        gateModel.id = await insertGate(gateModel);
        await insertApartments(gateModel);
      } else {
        await updateGate(gateModel);
        await deleteApartments(gateModel);
        await updateApartments(gateModel);
      }
      await checkCurrentPeriod(gateModel.id);
      if ('saveAndClose' in req.body) {
        res.redirect('/gates');
      }
      if ('save' in req.body) {
        res.redirect(`/gates/edit/${gateModel.id}`);
      }
    } else {
      res.render('docs/forms/gate.ejs', {
        title: 'Договор на ворота',
        data: gateModel,
        moment,
        utils,
        hostIP,
        hostPort,
        errors,
        user: req.session.userName,
      });
    }
  });

  router.post('/delete', (req, res) => {
    if ((req.body.id) && (Number.isFinite(+req.body.id))) {
      db.get().getConnection((err, connection) => {
        connection.query(
          'DELETE FROM cards WHERE card_id = ?', [+req.body.id],
          (error) => {
            connection.release();
            if (error) {
              res.status(500).send({
                code: 500,
                msg: 'Database Error',
                err: JSON.stringify(error),
              });
            } else {
              res.status(200).send({
                result: 'OK',
              });
            }
          },
        );
      });
    } else {
      res.status(500).send({
        code: 500,
        msg: 'Incorrect parameter',
      });
    }
  });

  router.post('/find_city', (req, res) => {
    const data = req.body;
    if ((data) && (typeof (data) === 'object') && ('cityName' in data)) {
      const rowsCount = 'limit' in data ? data.limit : cfg.rowsLimit;
      const params = { ...data, rowsCount };
      common.filterCities(params, (err, rows) => {
        res.status(200).send(rows);
      });
    } else {
      res.status(500).send({
        code: 500,
        msg: 'Incorrect parameter',
      });
    }
  });

  router.post('/find_street', (req, res) => {
    const data = req.body;
    if ((data) && (typeof (data) === 'object') && ('streetName' in data) && ('cityId' in data)) {
      const rowsCount = 'limit' in data ? data.limit : cfg.rowsLimit;
      const params = { ...data, rowsCount };
      common.filterStreets(params, (err, rows) => {
        res.status(200).send(rows);
      });
    } else {
      res.status(500).send({
        code: 500,
        msg: 'Incorrect parameter',
      });
    }
  });

  router.post('/find_house', (req, res) => {
    const data = req.body;
    if ((data) && (typeof (data) === 'object') && ('houseNumber' in data) && ('streetId' in data)) {
      const rowsCount = 'limit' in data ? data.limit : cfg.rowsLimit;
      const params = { ...data, rowsCount };
      common.filterHouses(params, (err, rows) => {
        res.status(200).send(rows);
      });
    } else {
      res.status(500).send({
        code: 500,
        msg: 'Incorrect parameter',
      });
    }
  });

  router.post('/change_address', (req, res) => {
    changeAddress(req.body).then((data) => {
      res.status(200).send(data);
    });
  });

  router.post('/save_client', (req, res) => {
    saveClientData(req.body, res);
  });

  return router;
};
