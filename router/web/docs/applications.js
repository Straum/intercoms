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
    res.render('docs/forms/application.ejs');
  });

  router.get('/completed', function (req, res) {
    res.render('docs/done_applications.ejs');
  });

  return router;
};