'use strict';

const express = require('express');

module.exports = function () {
  var router = express.Router();

  // References
  router.use('/equipment', require('./refs/equipment')());
  router.use('/clients', require('./refs/clients')());
  router.use('/organizations', require('./refs/organizations')());
  router.use('/cities', require('./refs/cities')());
  router.use('/streets', require('./refs/streets')());
  router.use('/templates', require('./refs/templates')());

  // Docs
  router.use('/orders', require('./docs/orders')());
  router.use('/registers', require('./docs/registers')());
  router.use('/payments', require('./docs/payments')());
  router.use('/applications', require('./docs/applications')());
  router.use('/requests', require('./docs/requests')());

  // Other
  router.get('/', function (req, res) {
    res.render('index.ejs');
  });

  router.use(function (req, res) {
    res.statusCode = 404;
    res.end('404!');
  });
  return router;
};