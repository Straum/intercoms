'use strict';

const express = require('express');

module.exports = function () {
  var router = express.Router();

  router.get('/', function (req, res) {
    res.render('refs/streets.ejs', {
      'title': 'Улицы'
    });
  });

  return router;
};