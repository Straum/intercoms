'use strict';

const express = require('express');
var db = require('../../../lib/db.js');
const visibleRows = require('../../../lib/config.js').config.visibleRows;
var moment = require('moment');
var utils = require('../../../lib/uitils.js');

module.exports = function () {
  var router = express.Router();

  router.get('/', function (req, res) {
    res.render('docs/applications.ejs');
  });

  router.get('/edit/:id', function (req, res) {
    //
  });

  router.get('/edit_done', function (req, res) {
    res.render('docs/forms/done_application.ejs');
  });

  router.get('/add', function (req, res) {
    var faults = [];

    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT a.template_id AS id, a.name' +
        ' FROM templates a' +
        ' WHERE a.template_id > ?' +
        ' ORDER BY a.name ASC', [0], function (err, rows) {
          connection.release();
          if (rows !== undefined) {
            faults = rows;
          }

          res.render(
            'docs/forms/application.ejs',
            {
              'moment': moment,
              'faults': faults
            }
          );

      });
    });
  });

  router.get('/completed', function (req, res) {
    res.render('docs/done_applications.ejs');
  });

  router.post('/search_performer', function (req, res) {
    var data = req.body;
    var suggestion = '';
    if ((data) && (typeof (data) === 'object') && ('suggestion' in data)) {
      suggestion = data.suggestion.trim();

      var queryText =
        ' SELECT a.worker_id AS id, a.name AS value' +
        ' FROM workers a';
      if (suggestion.length > 0) {
        queryText += ' WHERE a.name LIKE ' + `'` + suggestion + '%' + `'`;
      }
      queryText += ' ORDER BY a.name ASC';
      queryText += ' LIMIT ' + ('limit' in data ? data.limit : 15);

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