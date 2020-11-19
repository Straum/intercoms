'use strict';

const path = require('path');
const express = require('express');

let db = require('../../../lib/db');
const visibleRows = require('../../../lib/config').config.visibleRows;
let ServiceModel = require('../../../models/service').ServiceModel;

function getRecordsCount(queryText) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        queryText, [],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          }
          else {
            const data = rows ? (rows.length === 1 ? { ...rows[0] } : null) : null;
            resolve(data);
          }
        });
    });
  });
}

function getRecords(textQuery) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(textQuery, [],
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

function getService(id) {

  let textQuery = `SELECT a.service_id AS id, a.full_name AS fullName, a.short_name AS shortName FROM services a WHERE a.service_id = ?`;

  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(textQuery, [id],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          }
          else {
            const data = rows ? (rows.length === 1 ? { ...rows[0] } : null) : null;
            resolve(data);
          }
        });
    });
  });
}

function updateService(data) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        `UPDATE services SET full_name = ?, short_name = ? WHERE service_id = ?`,
        [
          data.fullName,
          data.shortName,
          data.id,
        ], function (err) {
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

function saveService(data) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        `INSERT INTO services (full_name, short_name) VALUES (?,?)`,
        [
          data.fullName,
          data.shortName
        ], function (err, rows) {
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

let Filters = function () {
  this.conditions = {
    fullName: '',
    shortName: ''
  };
  this.whereSQL = '';
  this.orderBy = '';
};

let filterBuilder = function (req) {

  let obj = {};
  let filters = new Filters();
  let cloneFilters = new Filters();
  let where = '';

  if (!('filtersServices' in req.session)) {
    req.session.filtersServices = filters;
  }
  cloneFilters = { ...req.session.filtersServices };

  try {
    if (req.query) {
      if ('filters' in req.query) {
        obj = JSON.parse(req.query.filters);

        if (obj.fullName.trim().length > 0) {
          where += ` AND (a.full_name LIKE '%${obj.fullName.trim()}%')`;
        }
        cloneFilters.conditions.fullName = obj.fullName.trim();

        if (obj.shortName.trim().length > 0) {
          where += ` AND (a.short_name LIKE '%${obj.shortName.trim()}%')`;
        }
        cloneFilters.conditions.shortName = obj.shortName.trim();

        cloneFilters.whereSQL = where;
      }
    }

    req.session.filtersServices = cloneFilters;

  } catch (err) {
    throw (err);
  }
  return cloneFilters;
};

let filterRecords = async function (req, res) {

  const add = filterBuilder(req);

  let countRecords = 0;
  let pageCount = 0;
  let rows = [];

  let queryRecordsCount =
    `SELECT COUNT(*) AS count
    FROM services a WHERE (a.service_id > 0)
    AND (a.is_deleted = 0) ${add.whereSQL}`;

  let queryRecords =
    `SELECT a.service_id AS id, a.full_name AS fullName, a.short_name As shortName
    FROM services a WHERE (a.service_id > 0) AND (a.is_deleted = 0)
    ${add.whereSQL}
    ${add.orderBy}
    ORDER BY a.full_name ASC
    LIMIT ${visibleRows}`;

  await getRecordsCount(queryRecordsCount)
    .then(function (result) {
      countRecords = result ? result.count : 0;
      pageCount = (countRecords / visibleRows) < 1 ? 0 : Math.ceil(countRecords / visibleRows);
    })
    .catch(function (error) {
      console.log('Error getRecordsCount: ' + error);
    });

  await getRecords(queryRecords)
    .then(function (result) {
      rows = result;
    })
    .catch(function (error) {
      console.log('Error getRecords: ' + error);
    });

  const currentPage = 1;
  res.render('refs/services.ejs', {
    title: 'Сервисы для ремонта',
    data: rows,
    pageCount: pageCount,
    currentPage: currentPage,
    visibleRows: visibleRows,
    countRecords: countRecords,
    user: req.session.userName,
    filters: add.conditions
  });

};

module.exports = function () {
  const router = express.Router();

  router.get('/', function (req, res) {
    filterRecords(req, res);
  });

  router.get('/filter', function (req, res) {
    filterRecords(req, res);
  });

  router.get('/edit/:id', async function (req, res) {
    const id = req.params.id;
    let model = new ServiceModel();

    await getService(id).then(function (data) {
      if (data) {
        model.id = data.id;
        model.fullName = data.fullName;
        model.shortName = data.shortName;
      }

    })
      .catch(function (error) {
        console.log(error.message);
        res.status(500).send(error.message);
      });

    res.render('refs/forms/service.ejs', {
      title: 'Сервис для ремонта',
      data: model,
      errors: {},
      user: req.session.userName
    });
  });

  router.get('/add', function (req, res) {
    let model = new ServiceModel();

    res.render('refs/forms/service.ejs', {
      title: 'Сервис для ремонта',
      data: model,
      errors: {},
      user: req.session.userName
    });
  });

  router.get('/:offset', async function (req, res) {
    const offset = +req.params.offset;
    let pageCount = 0;
    let countRecords = 0;
    let currentPage = 1;
    let rows = [];

    let add = filterBuilder(req);

    let queryRecordsCount =
      `SELECT COUNT(*) AS count
      FROM services a WHERE (a.service_id > 0)
      AND (a.is_deleted = 0) ${add.whereSQL}`;

    let queryRecords =
      `SELECT a.service_id AS id, a.full_name AS fullName, a.short_name As shortName
      FROM services a WHERE (a.service_id > 0) AND (a.is_deleted = 0)
      ${add.whereSQL}
      ${add.orderBy}
      ORDER BY a.full_name ASC
      LIMIT ${visibleRows}
      OFFSET ${offset}`;

    await getRecordsCount(queryRecordsCount)
      .then(function (result) {
        countRecords = result ? result.count : 0;
        pageCount = (countRecords / visibleRows) < 1 ? 0 : Math.ceil(countRecords / visibleRows);
      })
      .catch(function (error) {
        console.log('Error getRecordsCount: ' + error);
      });

    await getRecords(queryRecords)
      .then(function (result) {
        rows = result;
      })
      .catch(function (error) {
        console.log('Error getRecords: ' + error);
      });

    currentPage = Math.ceil(offset / visibleRows) + 1;
    res.render('refs/services.ejs', {
      title: 'Сервисы для ремонта',
      data: rows,
      pageCount: pageCount,
      currentPage: currentPage,
      visibleRows: visibleRows,
      countRecords: countRecords,
      user: req.session.userName,
      filters: add.conditions
    });

  });

  router.post('/save', function (req, res) {

    let model = new ServiceModel;
    model.id = Number(req.body.id);
    model.fullName = req.body.fullName;
    model.shortName = req.body.shortName;

    req.assert('fullName', 'Полное наименование не заполнено').notEmpty();
    req.assert('shortName', 'Сокращение не заполненo').notEmpty();

    let errors = req.validationErrors();
    if (!errors) {

      if (model.id != 0) {
        updateService(model)
          .then(function () {
            res.redirect('/services');
          })
          .catch(function (error) {
            console.log(error);
          });
      }
      else {
        saveService(model)
          .then(function () {
            res.redirect('/services');
          })
          .catch(function (error) {
            console.log(error);
          });
      }
    }
    else {
      res.render('refs/forms/service.ejs', {
        title: 'Сервис для ремонта',
        data: model,
        errors: errors,
        user: req.session.userName
      });
    }
  });

  router.post('/delete', function (req, res) {
    if ((req.body.id) && (isFinite(+req.body.id))) {
      db.get().getConnection(function (err, connection) {
        connection.query(
          'UPDATE services SET is_deleted = 1 WHERE service_id = ?', [+req.body.id], function (err) {
            connection.release();
            if (err) {
              res.status(500).send({
                code: 500,
                msg: 'Database Error',
                err: JSON.stringify(err)
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

  return router;
};