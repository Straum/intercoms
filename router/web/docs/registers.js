'use strict';

const express = require('express');
var db = require('../../../lib/db.js');
const visibleRows = require('../../../lib/config').config.visibleRows;
var moment = require('moment');

module.exports = function () {
  var router = express.Router();

  router.get('/', function (req, res) {
    var pageCount = 0;
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT COUNT(*) AS count' +
        ' FROM registers', [], function (err, rows) {
          connection.release();
          pageCount =
            (rows[0].count / visibleRows) < 1 ? 0 : Math.ceil(rows[0].count / visibleRows);

          db.get().getConnection(function (err, connection) {
            connection.query(
              ' SELECT a.register_id AS id,' +
              ' a.create_date,' +
              ' a.start_date,' +
              ' a.end_date,' +
              ' a.last_modify_date,' +
              ' (SELECT COUNT(*) FROM lists_registers b WHERE' +
              ' b.register_id = a.register_id) AS docs' +
              ' FROM registers a' +
              // ' WHERE' +
              // ' a.create_date BETWEEN :start_date AND :end_date
              ' ORDER BY' +
              ' a.create_date DESC,' +
              ' a.register_id DESC' +
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
                  res.render('docs/registers.ejs', {
                    'data': rows,
                    'pageCount': pageCount,
                    'currentPage': currentPage,
                    'visibleRows': visibleRows,
                    'moment': moment
                  });
                }
              });
          });
        });
    });
  });

  router.get('/edit', function (req, res) {
    var pageCount = 0;
    console.log(req.query);
    var id = req.query.id;
    var offset = req.query.offset;
    if (typeof offset === 'undefined') {
      offset = 0;
    }
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT a.register_id AS id, a.create_date, a.start_date, a.end_date, a.last_modify_date' +
        ' FROM registers a' +
        ' WHERE a.register_id = ?', [id], function (err, rows) {
          if (err) {
            throw err;
          }
          var data = rows[0];

          db.get().getConnection(function (err, connection) {
            connection.query(
              ' SELECT COUNT(*) AS count' +
              ' FROM' +
              ' lists_registers a' +
              ' WHERE a.register_id = ?', [id], function(err, rows) {

              connection.release();
              pageCount =
                (rows[0].count / (visibleRows * 5)) < 1 ? 0 : Math.ceil(rows[0].count / (visibleRows * 5));

              var tableRows = [];
              db.get().getConnection(function (err, connection) {
                connection.query(
                  ' SELECT' + 
                  ' b.card_id,' +
                  ' b.m_prolongation,' + 
                  ' b.contract_number,' + 
                  ' b.m_contract_number,' + 
                  ` DATE_FORMAT(b.create_date, '%d.%m.%Y') AS create_date,` +
                  ` DATE_FORMAT(b.start_service, '%d.%m.%Y') AS start_service,` + 
                  ` DATE_FORMAT(b.end_service, '%d.%m.%Y') AS end_service` + 
                  ' FROM' +
                  ' lists_registers a' +
                  ' LEFT JOIN cards b ON b.card_id=a.card_id' +
                  ' WHERE' + 
                  ' a.register_id = ?' +
                  ' ORDER BY' +
                  ' a.list_register_id' +
                  ' LIMIT ?' +
                  ' OFFSET ?', [id, 100, +offset], function (err, rows) {
                    
                    connection.release();
                    
                    if (err) {
                      res.status(500).send({
                        'code': 500,
                        'msg': 'Database error'
                      });
                    }
                    else {
                      var currentPage = Math.ceil(offset / (visibleRows * 5)) + 1;
                      tableRows = rows;
                      res.render('docs/forms/registers.ejs', {
                        'data': data,
                        'moment': moment,
                        'tableRows': tableRows,
                        'pageCount': pageCount,
                        'currentPage': currentPage,
                        'visibleRows': visibleRows * 5
                      });
                    }
                  });
                });
              });
            });
          });
    });
  });

  // router.get('/edit/:id&:offset', function (req, res) {
  //   kk(req, res);
  // });

  router.get('/add', function (req, res) {
    res.render('refs/forms/equipment.ejs');
  });

  router.get('/table', function (req, res) {
    var id = req.query.id;
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT' + 
        ' b.card_id,' +
        ' b.m_prolongation,' + 
        ' b.contract_number,' + 
        ' b.m_contract_number,' + 
        ` DATE_FORMAT(b.create_date, '%d.%m.%Y') AS create_date,` +
        ` DATE_FORMAT(b.start_service, '%d.%m.%Y') AS start_service,` + 
        ` DATE_FORMAT(b.end_service, '%d.%m.%Y') AS end_service` + 
        ' FROM' +
        ' lists_registers a' +
        ' LEFT JOIN cards b ON b.card_id=a.card_id' +
        ' WHERE' + 
        ' a.register_id = ?' +
        ' ORDER BY' +
        ' a.list_register_id', [id], function (err, rows) {
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
            res.status(200).send({ 'table': rows });
          }
        });
    });
  });

  router.get('/:offset', function (req, res) {
    var offset = +req.params.offset;
    var pageCount = 0;
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT COUNT(*) AS count' +
        ' FROM registers', [], function (err, rows) {
          connection.release();
          pageCount =
            (rows[0].count / visibleRows) < 1 ? 0 : Math.ceil(rows[0].count / visibleRows);
          if ((offset > pageCount * visibleRows)) {
            offset = (pageCount - 1) * visibleRows;
          }

          db.get().getConnection(function (err, connection) {
            connection.query(
              ' SELECT a.register_id AS id,' +
              ' a.create_date,' +
              ' a.start_date,' +
              ' a.end_date,' +
              ' a.last_modify_date,' +
              ' (SELECT COUNT(*) FROM lists_registers b WHERE' +
              ' b.register_id = a.register_id) AS docs' +
              ' FROM registers a' +
              // ' WHERE' +
              // ' a.create_date BETWEEN :start_date AND :end_date
              ' ORDER BY' +
              ' a.create_date DESC,' +
              ' a.register_id DESC' +
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
                  res.render('docs/registry.ejs', {
                    'data': rows,
                    'pageCount': pageCount,
                    'currentPage': currentPage,
                    'visibleRows': visibleRows,
                    'moment': moment
                  });
                }
              });
          });
        });
    });
  });

  router.post('/save', function (req, res) {
    if ((req.body.id) && (isFinite(+req.body.id))) {
      db.get().getConnection(function (err, connection) {
        connection.query(
          ' UPDATE equipments SET name = ?, guarantee_period = ?' +
          ' WHERE equipment_id = ?', [req.body.name, req.body.years, req.body.id], function (err) {
            connection.release();
            if (err) {
              res.status(500).send({ 'code': 500, 'msg': 'Database Error' });
            } else {
              res.redirect('/equipment');
            }
          }
        );
      });
    }
    else {
      db.get().getConnection(function (err, connection) {
        connection.query(
          ' INSERT INTO equipments (name, guarantee_period)' +
          ' VALUE(?, ?)', [req.body.name, req.body.years], function (err) {
            connection.release();
            if (err) {
              res.status(500).send({ 'code': 500, 'msg': 'Database Error' });
            } else {
              res.redirect('/equipment');
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
          ' DELETE FROM equipments WHERE equipment_id = ?', [+req.body.id], function (err) {
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
