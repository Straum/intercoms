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
    // res.render('refs/equipment.ejs');
  });
  return router;
};