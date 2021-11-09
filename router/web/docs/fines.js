const express = require('express');
const moment = require('moment');
const db = require('../../../lib/db');
const { rowsLimit } = require('../../../lib/config').config;
const { decodeApartmentLetter } = require('../../../lib/utils');
const { enumApartmentLetters } = require('../../../lib/utils');
const { FineModel } = require('../../../models/fine');

const getTotalRecords = () => {
  const queryText = 'SELECT count(*) AS totalRecords FROM fines';

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
    a.fine_id AS id, DATE(a.create_dt) AS createDate, a.amount_of_fine AS amount,
    a.paid AS isPaid, a.old_fine AS oldFine, a.payment_dt AS paymentDate,
    b.number AS apartmentNumber, b.letter,
    c.contract_number AS contractNumber, c.m_contract_number AS prolongedContractNumber,
    d.name AS cityName, e.name AS streetName, f.number AS houseNumber, c.porch
    FROM fines a
    LEFT JOIN apartments b ON b.apartment_id = a.apartment_id
    LEFT JOIN cards c ON c.card_id = b.card_id
    LEFT JOIN cities d ON d.city_id = c.city_id
    LEFT JOIN streets e ON e.street_id = c.street_id
    LEFT JOIN houses f ON f.house_id = c.house_id
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
    a.fine_id AS id, DATE(a.create_dt) AS createDate, a.amount_of_fine AS amount,
    a.paid AS isPaid, a.old_fine AS oldFine, a.payment_dt AS paymentDate,
    a.apartment_id AS apartmentId,
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
    LIMIT 1
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
    fineModel.paymentDate = data.paymentDate;
    fineModel.amount = data.amount;
    fineModel.porch = data.porch;

    fineModel.contract.normal = data.contractNumber;
    fineModel.contract.prolonged = data.prolongedContractNumber;

    fineModel.address.city.id = data.cityId;
    fineModel.address.city.name = data.cityName;
    fineModel.address.street.id = data.streetId;
    fineModel.address.street.name = data.streetName;
    fineModel.address.house.id = data.houseId;
    fineModel.address.house.number = data.houseNumber;

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
    const model = new FineModel();
    const { body: { box } } = req;

    const data = JSON.parse(box);

    model.address.city.id = data.cityId;
    model.address.street.id = data.streetId;
    model.address.house.id = data.houseId;
    model.apartment.id = data.apartmentId;

    model.createDate = ((req.body.createDate) && (req.body.createDate.trim().length > 0))
      ? moment(req.body.createDate, 'DD.MM.YYYY HH:mm').format('YYYY-MM-DD HH:mm')
      : null;
    model.amount = req.body.amount;
    model.contract.normal = req.body.contract;
    model.contract.prolonged = req.body.extendedContact;
    model.porch = req.body.porch;
    model.apartment.number = req.body.apartment;
    model.apartment.letter = req.body.letter;

    req.assert('createDate', 'Дата создания не заполнена').notEmpty();

    const queryText = `INSERT INTO fines
      (create_dt, amount_of_fine)
      VALUES ("${model.createDate}", ${model.amount})`;

    const promise = new Promise((resolve, reject) => {
      db.get().getConnection((err, connection) => {
        connection.query(queryText, [], (error) => {
          connection.release();
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    });

    await promise;

    res.redirect('/fines');
  });

  router.put('/save/:id', (req, res) => {
    // const model = new FineModel();

    // const { body: { box } } = req;
    // model.id = req.body.

    res.redirect('/fines');
  });

  return router;
};
