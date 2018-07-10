'use strict';

const express = require('express');

module.exports = function () {
  var router = express.Router();

  router.get('/',function (req,res) {
    res.send('brigades');
  });
  return router;
};