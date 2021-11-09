const express = require('express');
const moment = require('moment');
const db = require('../../../lib/db');
const { invalidDate } = require('../../../lib/utils');
const queries = require('../../../queries/payments_by_banks');

const getPaymentsByBanksData = (params) => new Promise((resolve, reject) => {
  const {
    startDate,
    endDate,
    urbanDirection,
  } = params;

  db.get().getConnection((err, connection) => {
    connection.query(
      queries.paymentsByBanks, [
        startDate,
        endDate,
        urbanDirection,
      ],
      (error, rows) => {
        connection.release();
        if (error) {
          reject();
        } else {
          resolve(rows.length === 0 ? null : rows);
        }
      },
    );
  });
});

module.exports = () => {
  const router = express.Router();

  router.get('/', (req, res) => {
    const startDate = moment().startOf('month').format('DD.MM.YYYY');
    const endDate = moment().endOf('month').format('DD.MM.YYYY');
    const urbanDirection = 2;
    const data = {
      startDate,
      endDate,
      urbanDirection,
    };

    res.render('reports/payments_by_bank.ejs', {
      title: 'Платежи по банкам',
      data,
      errors: {},
      user: req.session.userName,
    });
  });

  router.post('/generate', async (req, res) => {
    let startDate = moment(req.body.startDate, 'DD.MM.YYYY').format('YYYY-MM-DD');
    let endDate = moment(req.body.endDate, 'DD.MM.YYYY').format('YYYY-MM-DD');
    const urbanDirection = parseInt(req.body.city, 10);

    req.assert('startDate', 'Начальная дата не заполнена').notEmpty();
    req.assert('endDate', 'Конечная дата не заполнена').notEmpty();

    const errors = req.validationErrors();
    if (!errors) {
      const params = {
        startDate,
        endDate,
        urbanDirection,
      };

      const payments = await getPaymentsByBanksData(params);

      res.render('reports/table_payments_by_bank.ejs', {
        title: 'Платежи по банкам',
        data: params,
        payments,
        moment,
        errors: {},
        user: req.session.userName,
      });
    } else {
      if ((startDate.localeCompare(invalidDate) !== 0) && (startDate.trim().length !== 0)) {
        startDate = req.body.startDate;
      }
      if ((endDate.localeCompare(invalidDate) !== 0) && (endDate.trim().length !== 0)) {
        endDate = req.body.endDate;
      }

      const data = {
        startDate,
        endDate,
        urbanDirection,
      };

      res.render('reports/payments_by_bank.ejs', {
        title: 'Платежи по банкам',
        data,
        errors,
        user: req.session.userName,
      });
    }
  });

  return router;
};
