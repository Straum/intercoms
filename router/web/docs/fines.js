const express = require('express');
const moment = require('moment');
const db = require('../../../lib/db');
const { rowsLimit } = require('../../../lib/config').config;
const { decodeApartmentLetter } = require('../../../lib/utils');
const { enumApartmentLetters } = require('../../../lib/utils');
const { FineModel } = require('../../../models/fine');
const common = require('../../common/typeheads');
const verifications = require('../../common/verifications');
const { PrintReceipts } = require('../../../lib/receipts/fines');

const getTotalRecords = () => {
  const queryText = 'SELECT count(*) AS totalRecords FROM fines a WHERE a.is_deleted = 0';

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

const getTableData = (visibleRows, offset) => {
  const queryText = `SELECT
    a.fine_id AS id, DATE(a.create_dt) AS createDate,
    a.amount_of_fine AS amount, a.actual_amount AS actualAmount,
    a.paid AS isPaid, a.old_fine AS oldFine, a.payment_dt AS paymentDate,
    a.half_paid AS halfPaid,
    b.number AS apartmentNumber, b.letter,
    c.contract_number AS contractNumber, c.m_contract_number AS prolongedContractNumber,
    d.name AS cityName, e.name AS streetName, f.number AS houseNumber, c.porch
    FROM fines a
    LEFT JOIN apartments b ON b.apartment_id = a.apartment_id
    LEFT JOIN cards c ON c.card_id = b.card_id
    LEFT JOIN cities d ON d.city_id = c.city_id
    LEFT JOIN streets e ON e.street_id = c.street_id
    LEFT JOIN houses f ON f.house_id = c.house_id
    WHERE a.is_deleted = 0
    ORDER BY a.create_dt DESC
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

const getFine = (id) => {
  const queryText = `SELECT
    a.fine_id AS id, DATE(a.create_dt) AS createDate,
    a.amount_of_fine AS amount, a.actual_amount As actualAmount,
    a.payment_document AS paymentDocument,
    a.paid AS isPaid, a.old_fine AS oldFine, a.payment_dt AS paymentDate,
    a.apartment_id AS apartmentId, a.remark,
    b.number AS apartmentNumber, b.letter AS apartmentLetter,
    c.contract_number AS contractNumber, c.m_contract_number AS prolongedContractNumber,
    d.city_id AS cityId, d.name AS cityName,
    e.street_id AS streetId, e.name AS streetName,
    f.house_id AS houseId, f.number AS houseNumber,
    c.porch
    FROM fines a
    LEFT JOIN apartments b ON b.apartment_id = a.apartment_id
    LEFT JOIN cards c ON c.card_id = b.card_id
    LEFT JOIN cities d ON d.city_id = c.city_id
    LEFT JOIN streets e ON e.street_id = c.street_id
    LEFT JOIN houses f ON f.house_id = c.house_id
    WHERE a.fine_id = ${id}
    `;

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

const informationOnContract = (id, isProlongedContract) => {
  let queryText = `SELECT
  b.city_id AS cityId, b.name AS cityName,
  b.parent_id AS areaId, UPPER(c.name) AS areaName,
  c.no_streets AS noStreets, c.no_houses AS noHouses,
  d.name AS streetName, e.number AS houseNumber,
  a.porch
  FROM cards a
  LEFT JOIN cities b ON b.city_id = a.city_id
  LEFT JOIN cities c ON c.city_id = b.parent_id
  LEFT JOIN streets d ON d.street_id = a.street_id
  LEFT JOIN houses e ON e.house_id = a.house_id
  WHERE
  `;

  const where = isProlongedContract
    ? ` (a.m_contract_number = ${id}) AND (a.is_deleted = 0) AND (a.rank = 0)`
    : ` (a.contract_number = ${id}) AND (a.is_deleted = 0) AND (a.rank = 0)`;

  queryText += where;

  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        queryText, [], (error, rows) => {
          connection.release();
          if (error) {
            reject();
          } else {
            resolve(rows[0] || null);
          }
        },
      );
    });
  });
};

async function updateDocument(model) {
  const queryText = `UPDATE fines SET
    create_dt = ?,
    apartment_id = ?,
    amount_of_fine = ?,
    remark = ?
    WHERE fine_id = ?`;

  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(queryText, [
        model.createDate,
        model.apartment.id,
        model.amount,
        model.remark,
        model.id,
      ], (error) => {
        connection.release();
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  });
}

async function insertDocument(model) {
  const queryText = `INSERT INTO fines
    (create_dt, apartment_id, amount_of_fine, remark)
    VALUES ("${model.createDate}", ${model.apartment.id}, ${model.amount}, "${model.remark}")`;

  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(queryText, [], (error, rows) => {
        connection.release();
        if (error) {
          reject(error);
        } else {
          resolve(rows.insertId);
        }
      });
    });
  });
}

async function deleteRecord(id) {
  const queryText = 'UPDATE fines SET is_deleted = 1 WHERE fine_id = ?';

  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(queryText, [id], (error) => {
        connection.release();
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  });
}

function printReceipt(fineId, res) {
  const printReceiptForFine = new PrintReceipts(fineId, res);
  printReceiptForFine.go().then();
}

module.exports = () => {
  const router = express.Router();

  router.get('/', async (req, res) => {
    const { totalRecords } = await getTotalRecords();
    const rows = await getTableData(rowsLimit, 0);
    const currentPage = Math.ceil(0 / rowsLimit) + 1;
    const pageCount = (totalRecords / rowsLimit) < 1 ? 0 : Math.ceil(totalRecords / rowsLimit);

    res.render('./docs/fines.ejs', {
      title: 'Подключения',
      rows,
      currentPage,
      pageCount,
      totalRecords,
      rowsLimit,
      moment,
      decodeApartmentLetter,
      user: req.session.userName,
    });
  });

  router.get('/add', (req, res) => {
    const fineModel = new FineModel();
    res.render('./docs/forms/fine.ejs', {
      title: 'Подключение',
      model: fineModel,
      errors: {},
      moment,
      enumApartmentLetters,
      user: req.session.userName,
    });
  });

  router.get('/:offset', async (req, res) => {
    const { params: { offset } } = req;
    const { totalRecords } = await getTotalRecords();
    const rows = await getTableData(rowsLimit, +offset);
    const currentPage = Math.ceil(+offset / rowsLimit) + 1;
    const pageCount = (totalRecords / rowsLimit) < 1 ? 0 : Math.ceil(totalRecords / rowsLimit);

    res.render('./docs/fines.ejs', {
      title: 'Подключения',
      rows,
      currentPage,
      pageCount,
      totalRecords,
      rowsLimit,
      moment,
      decodeApartmentLetter,
      user: req.session.userName,
    });
  });

  router.get('/edit/:id', async (req, res) => {
    const { params: { id } } = req;
    const fineModel = new FineModel();

    const data = await getFine(id);
    fineModel.id = data.id;
    fineModel.createDate = data.createDate;
    fineModel.amount = data.amount;
    fineModel.porch = data.porch;
    fineModel.remark = data.remark;

    fineModel.payment.date = data.paymentDate;
    fineModel.payment.amount = data.actualAmount;
    fineModel.payment.document = data.paymentDocument;

    fineModel.contract.normal = data.contractNumber;
    fineModel.contract.prolonged = data.prolongedContractNumber;

    fineModel.address.city.id = data.cityId;
    fineModel.address.city.name = data.cityName;
    fineModel.address.street.id = data.streetId;
    fineModel.address.street.name = data.streetName;
    fineModel.address.house.id = data.houseId;
    fineModel.address.house.number = data.houseNumber;
    fineModel.address.full = fineModel.fullAddress;

    fineModel.apartment.number = data.apartmentNumber;
    fineModel.apartment.letter = data.apartmentLetter;

    res.render('./docs/forms/fine.ejs', {
      title: 'Подключение',
      model: fineModel,
      errors: {},
      moment,
      enumApartmentLetters,
      user: req.session.userName,
    });
  });

  router.post('/save', async (req, res) => {
    const fineModel = new FineModel();
    const address = req.body.fullAddress;
    const data = await common.parseAddress(address);
    if (data.success) {
      fineModel.address.city.id = data.city.id;
      fineModel.address.street.id = data.street.id;
      fineModel.address.house.id = data.house.id;
    }

    fineModel.id = +req.body.id;
    fineModel.createDate = ((req.body.createDate) && (req.body.createDate.trim().length > 0))
      ? moment(req.body.createDate, 'DD.MM.YYYY').format('YYYY-MM-DD')
      : null;
    fineModel.amount = Number.isNaN(parseFloat(req.body.amount)) ? 0 : parseFloat(req.body.amount);
    fineModel.contract.normal = req.body.contract;
    fineModel.contract.prolonged = req.body.extendedContact;
    fineModel.address.full = address;
    fineModel.porch = req.body.porch;
    fineModel.apartment.number = req.body.apartment;
    fineModel.apartment.letter = req.body.letter;
    fineModel.remark = req.body.remark;

    fineModel.payment.date = ((req.body.dateOfPayment)
      && (req.body.dateOfPayment.trim().length > 0))
      ? moment(req.body.dateOfPayment, 'DD.MM.YYYY HH:mm').format('YYYY-MM-DD HH:mm')
      : null;
    fineModel.payment.amount = Number.isNaN(parseFloat(req.body.actualAmount))
      ? 0
      : parseFloat(req.body.actualAmount);
    fineModel.payment.document = req.body.paymentDocument.length > 0
      ? req.body.paymentDocument
      : null;

    req.assert('createDate', 'Дата создания не заполнена').notEmpty();
    req.assert('contract', 'Договор не указан').notEmpty();
    req.assert('fullAddress', 'Адрес не заполнен или неправильный').custom(() => data.success);
    req.assert('porch', 'Подьезд не указан').notEmpty();
    req.assert('apartment', 'Номер квартиры не заполнен').notEmpty();

    const result = await verifications.validApartment(
      fineModel.apartment.number, fineModel.apartment.letter, fineModel.contract.normal,
    );
    if (result.isExists) {
      fineModel.apartment.id = result.id;
    } else {
      req.assert('apartment', 'Номер квартиры вне диапазона квартир договора').custom(() => result.isExists);
    }

    req.assert('amount', 'Сумма к оплате не заполнена').notEmpty();
    req.assert('amount', 'Сумма к оплате должна быть больше нуля').custom((amount) => {
      let out = parseFloat(amount);
      if (Number.isNaN(out)) {
        out = 0;
      }
      return out !== 0;
    });

    const errors = req.validationErrors();
    if (!errors) {
      if ('printReceipt' in req.body) {
        printReceipt(fineModel.id, res);
        return;
      }

      if (fineModel.id) {
        await updateDocument(fineModel);
      } else {
        fineModel.id = await insertDocument(fineModel);
      }
      if ('saveAndClose' in req.body) {
        res.redirect('/fines');
      }
      if ('save' in req.body) {
        res.redirect(`/fines/edit/${fineModel.id}`);
      }
    } else {
      res.render('./docs/forms/fine.ejs', {
        title: 'Подключение',
        model: fineModel,
        errors,
        moment,
        enumApartmentLetters,
        user: req.session.userName,
      });
    }
  });

  router.post('/find_order', async (req, res) => {
    const { contractNumber, limit } = req.body;
    const data = await common.findOrderLookupProlongedOrder(
      contractNumber, limit,
    );
    res.status(200).send(data);
  });

  router.post('/find_prolonged_order', async (req, res) => {
    const { prolongedContractNumber, limit } = req.body;
    const data = await common.findProlongedOrderLookupOrder(
      prolongedContractNumber, limit,
    );
    res.status(200).send(data);
  });

  router.post('/full_address', (req, res) => {
    const { suggestion, limit } = req.body;
    common.getFullAddress3({ suggestion, limit }, (data) => {
      res.status(200).send(data);
    }).then();
  });

  router.post('/information_on_contract', async (req, res) => {
    const { contractNumber } = req.body;
    const data = await informationOnContract(contractNumber, false);
    let fullAddress = '';
    if (data) {
      fullAddress = `${data.cityName}`;
      if (data.areaId > 0) {
        fullAddress = `${data.areaName}, ${data.cityName}`;
      }
      if (!data.noStreets) {
        fullAddress += `, ${data.streetName}`;
      }
      if (!data.noHouses) {
        fullAddress += `, ${data.houseNumber}`;
      }
    }
    res.status(200).send({ fullAddress, porch: data.porch });
  });

  router.post('/information_on_prolonged_contract', async (req, res) => {
    const { prolongedContractNumber } = req.body;
    const data = await informationOnContract(prolongedContractNumber, true);
    let fullAddress = '';
    if (data) {
      fullAddress = `${data.cityName}`;
      if (data.areaId > 0) {
        fullAddress = `${data.areaName}, ${data.cityName}`;
      }
      if (!data.noStreets) {
        fullAddress += `, ${data.streetName}`;
      }
      if (!data.noHouses) {
        fullAddress += `, ${data.houseNumber}`;
      }
    }
    res.status(200).send({ fullAddress, porch: data.porch });
  });

  router.post('/find_porchs_at_address', async (req, res) => {
    const { address, porch } = req.body;
    const data = await common.parseAddress(address);
    if (data.success) {
      const response = await common.filterPorches(
        {
          houseId: data.house.id,
          porch,
          rowsCount: rowsLimit,
        },
      );
      res.status(200).send(response);
    } else {
      res.status(200).send([]);
    }
  });

  router.post('/find_order', async (req, res) => {
    const { address, porch } = req.body;
    const data = await common.parseAddress(address);
    if (data.success) {
      const response = await common.findOrder(
        {
          houseId: data.house.id,
          porch,
        },
      );
      res.status(200).send(response);
    } else {
      res.status(200).send(null);
    }
  });

  router.post('/delete', async (req, res) => {
    const { id } = req.body;
    await deleteRecord(id);
    res.status(200).send();
  });

  return router;
};
