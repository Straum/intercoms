'use strict';

const express = require('express');
var db = require('../../../lib/db.js');
const visibleRows = require('../../../lib/config').config.visibleRows;

module.exports = function () {
  var router = express.Router();

  router.get('/', function (req, res) {
    var pageCount = 0;
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT COUNT(*) AS count' +
        ' FROM workers WHERE worker_id > 0', [], function (err, rows) {
          connection.release();
          pageCount =
            (rows[0].count / visibleRows) < 1 ? 0 : Math.ceil(rows[0].count / visibleRows);

          db.get().getConnection(function (err, connection) {
            connection.query(
              ' SELECT a.worker_id AS id, a.name, a.is_work' +
              ' FROM workers a' +
              ' WHERE a.worker_id > 0' +
              ' ORDER BY a.name ASC' +
              ' LIMIT ?', [visibleRows], function (err, rows) {
                if (err) {
                  throw err;
                }
                connection.release();

                if (err) {
                  console.error(err);
                  res.status(500).send({
                    'code': 500,
                    'msg': 'Database error'
                  });
                } else {
                  var currentPage = 1;
                  res.render('refs/workers.ejs', {
                    'title': 'Персонал',
                    'data': rows,
                    'pageCount': pageCount,
                    'currentPage': currentPage,
                    'visibleRows': visibleRows
                  });
                }
              });
          });
        });
    });
  });

  router.get('/edit/:id', function (req, res) {
    var id = req.params.id;
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT a.worker_id AS id, a.name, a.is_work' +
        ' FROM workers a' +
        ' WHERE a.worker_id = ?', [id], function (err, rows) {
          if (err) {
            throw err;
          }
          connection.release();

          if (err) {
            console.error(err);
            res.status(500).send({
              'code': 500,
              'msg': 'Database error'
            });
          } else {
            res.render('refs/forms/worker.ejs', {
              'title': 'Персонал',
              'data': rows[0]
            });
          }
        });
    });
  });

  router.get('/add', function (req, res) {
    res.render('refs/forms/worker.ejs', {
      'title': 'Персонал'
    });
  });

  router.get('/:offset', function (req, res) {
    var offset = +req.params.offset;
    var pageCount = 0;
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT COUNT(*) AS count' +
        ' FROM workers WHERE worker_id > 0', [], function (err, rows) {
          connection.release();
          pageCount = 
            (rows[0].count / visibleRows) < 1 ? 0 : Math.ceil(rows[0].count / visibleRows);
          if ((offset > pageCount * visibleRows)) {
            offset = (pageCount - 1) * visibleRows;
          }

          db.get().getConnection(function (err, connection) {
            connection.query(
              ' SELECT a.worker_id AS id, a.name' +
              ' FROM workers a' +
              ' WHERE a.worker_id > 0' +
              ' ORDER BY a.name ASC' +
              ' LIMIT ?' +
              ' OFFSET ?', [visibleRows, offset], function (err, rows) {
                if (err) {
                  throw err;
                }
                connection.release();

                if (err) {
                  console.error(err);
                  res.status(500).send({
                    'code': 500,
                    'msg': 'Database error'
                  });
                } else {
                  var currentPage = Math.ceil(offset / visibleRows) + 1;
                  res.render('refs/workers.ejs', {
                    'title': 'Персонал',
                    'data': rows,
                    'pageCount': pageCount,
                    'currentPage': currentPage,
                    'visibleRows': visibleRows
                  });
                }
              });
          });
        });
    });
  });

  router.post('/save', function (req, res) {
    var isWork = req.body.is_work ? (req.body.is_work === 'on' ? 1 : 0) : 0;
    if ((req.body.id) && (isFinite(+req.body.id))) {
      db.get().getConnection(function (err, connection) {
        connection.query(
          ' UPDATE workers SET name = ?, is_work = ?' +
          ' WHERE worker_id = ?', [
              req.body.name,
              isWork,
              req.body.id
            ], function (err) {
            connection.release();
            if (err) {
              res.status(500).send({ 'code': 500, 'msg': 'Database Error' });
            } else {
              res.redirect('/workers');
            }
          }
        );
      });
    }
    else {
      db.get().getConnection(function (err, connection) {
        connection.query(
          ' INSERT INTO workers (name, is_work)' +
          ' VALUE(?, ?)', [
              req.body.name, 
              isWork
            ], function (err) {
            connection.release();
            if (err) {
              res.status(500).send({ 'code': 500, 'msg': 'Database Error' });
            } else {
              res.redirect('/workers');
            }
          }
        );
      });
    }
  });

  router.post('/delete', function (req, res) {
    if ((req.body.id) && (isFinite(+req.body.id))) {
      db.get().getConnection(function (err, connection) {
        connection.query(
          ' DELETE FROM workers WHERE worker_id = ?', [+req.body.id], function (err) {
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
    }
    else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  return router;
};