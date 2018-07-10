'use strict';

const express = require('express');

module.exports = function () {
  var router = express.Router();
  
  // References
  router.use('/brigades',require('./refs/brigades')());
  router.use('/equipment',require('./refs/equipment')());
  router.use('/clients',require('./refs/clients')());
  router.use('/cities',require('./refs/cities')());
  router.use('/organizations',require('./refs/organizations')());
  
  // Docs
  router.use('/orders',require('./docs/orders')());
  router.use('/registry',require('./docs/registry')());
  router.use('/payments',require('./docs/payments')());
  
  // Other
  router.get('/',function (req,res) {
    res.render('index.ejs');
  });

  router.use(function(req, res) {
    res.statusCode = 404;
    res.end('404!');
  });
  return router;
};