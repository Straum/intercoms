'use strict';

const express = require('express');
var db = require('../../../lib/db.js');

module.exports = function () {
  var router = express.Router();

  router.get('/', function (req, res) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT a.equipment_id AS id, a.name, a.guarantee_period' +
        ' FROM equipments a' + 
        ' WHERE a.equipment_id > 0' +
        ' ORDER BY a.name ASC', [], function (err, rows) {
          if (err) {
            throw err;
          }
          connection.release();

          if (err) {
            console.error(err);
            res.status(500).send({
              code: 500,
              msg: 'Database error'
            });
          } else {
            res.render('refs/equipment.ejs', { data: rows });
          }
        });
    });
  });
  
  router.get('/edit/:id', function (req, res) {
    var id = req.params.id;
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT a.equipment_id AS id, a.name, a.guarantee_period' +
        ' FROM equipments a' + 
        ' WHERE a.equipment_id = ?', [id], function (err, rows) {
          if (err) {
            throw err;
          }
          connection.release();

          if (err) {
            console.error(err);
            res.status(500).send({
              code: 500,
              msg: 'Database error'
            });
          } else {
            res.render('refs/forms/equipment.ejs', { 
              data:rows[0]
            });
          }
        });
      });
  });

  router.get('/add', function (req, res) {
    res.render('refs/forms/equipment.ejs');
  });

  router.post('/save', function (req, res) {
    if ((req.body.id) && (isFinite(+req.body.id))) {
      db.get().getConnection(function (err, connection) {
        connection.query(
          ' UPDATE equipments SET name = ?, guarantee_period = ?' + 
          ' WHERE equipment_id = ?', [req.body.name, req.body.years, req.body.id], function(err) {
            connection.release();            
            if (err) {
              res.status(500).send({code: 500, msg: 'Database Error'});
            }else{
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
          ' VALUE(?, ?)', [req.body.name, req.body.years], function(err) {
            connection.release();            
            if (err) {
              res.status(500).send({code: 500, msg: 'Database Error'});
            }else{
              res.redirect('/equipment');
            }
          }
        );
      });
    }
  });

  return router;
};