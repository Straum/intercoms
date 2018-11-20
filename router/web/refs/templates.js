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
        ' FROM templates WHERE template_id > 0', [], function (err, rows) {
          connection.release();
          pageCount =
            (rows[0].count / visibleRows) < 1 ? 0 : Math.ceil(rows[0].count / visibleRows);

          db.get().getConnection(function (err, connection) {
            connection.query(
              ' SELECT a.template_id AS id, a.name' +
              ' FROM templates a' +
              ' WHERE a.template_id > 0' +
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
                  res.render('refs/templates.ejs', {
                    'title': 'Шаблоны',
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

  router.get('/add', function (req, res) {
    res.render('refs/forms/template/add.ejs', {
      'title': 'Добавить шаблон',
      'data': {
        name: ''
      }
    });
  });

  router.get('/edit/:id', function (req, res) {
    var id = req.params.id;
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT a.template_id AS id, a.name' +
        ' FROM templates a' +
        ' WHERE a.template_id = ?', [id], function (err, rows) {
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
            res.render('refs/forms/template/edit.ejs', {
              'title': 'Редактировать шаблон',
              'data': rows[0]
            });
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
        ' FROM templates WHERE template_id > 0', [], function (err, rows) {
          connection.release();
          pageCount = 
            (rows[0].count / visibleRows) < 1 ? 0 : Math.ceil(rows[0].count / visibleRows);
          if ((offset > pageCount * visibleRows)) {
            offset = (pageCount - 1) * visibleRows;
          }

          db.get().getConnection(function (err, connection) {
            connection.query(
              ' SELECT a.template_id AS id, a.name' +
              ' FROM templates a' +
              ' WHERE a.template_id > 0' +
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
                  res.render('refs/templates.ejs', {
                    'title': 'Шаблоны',
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

  router.post('/', function (req, res) {
    req.assert('name', 'Заполните наименование').notEmpty();
    var errors = req.validationErrors();
    
    if ( !errors ) {
      var data = {
        name: req.sanitize('name').escape().trim()
      };

      db.get().getConnection(function (err, connection) {
        connection.query(
          ' INSERT INTO templates (name)' +
          ' VALUE(?)', [
              data.name
            ], function (err) {
            connection.release();
            if (err) {
              res.status(500).send({ 'code': 500, 'msg': 'Database Error' });
            } else {
              res.redirect('/templates');
            }
          }
        );
      });
    }
    else {
      req.flash('errors', errors);

      res.render('refs/forms/template/add.ejs', {
        'title': 'Добавить шаблон',
        'data': {
          name: req.body.name
        }
      });  
    }
  });

  router.put('/edit/(:id)', function (req, res) {
    var id = req.params.id;
    req.assert('name', 'Заполните наименование').notEmpty();
    var errors = req.validationErrors();
    
    if ( !errors ) {
      var data = {
        name: req.sanitize('name').escape().trim()
      };

      db.get().getConnection(function (err, connection) {
        connection.query(
          ' UPDATE templates SET name = ?' +
          ' WHERE template_id = ?', [
              data.name, 
              id
            ], function (err) {
            connection.release();
            if (err) {
              res.status(500).send({ 'code': 500, 'msg': 'Database Error' });
            } else {
              res.redirect('/templates');
            }
          }
        );
      });
    }
    else {
      req.flash('errors', errors);

      res.render('refs/forms/template/add.ejs', {
        'title': 'Редактировать шаблон',
        'data': {
          'id': req.params.id,
          'name': req.body.name
        }
      });  
    }
  });

  router.delete('/', function (req, res) {
    if ((req.body.id) && (isFinite(+req.body.id))) {
      db.get().getConnection(function (err, connection) {
        connection.query(
          ' DELETE FROM templates WHERE template_id = ?', [+req.body.id], function (err) {
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