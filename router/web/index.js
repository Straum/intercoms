'use strict';

var fs = require('fs');

const express = require('express');
var user = require('../authorization/login');

module.exports = function () {
  var router = express.Router();

  router.post('/image', function (req, res) {
    var name = req.body.name;
    var img = req.body.image;
    var realFile = Buffer.from(img, 'base64');

    var fileName = './public/photos/' + name;

    fs.writeFile(fileName, realFile, function (err) {
      if (err)
        console.log(err);
    });
    res.send('OK');
  });

  router.get('/', function (req, res) {
    var userId = req.session.userId;
      if (userId == null) {
      // res.render('index.ejs');
      var message = '';
      res.render('signin', {message: message});
    }
    else {
      res.redirect('home');
    }
  });

  // References
  router.use('/equipment', require('./refs/equipment')());
  router.use('/workers', require('./refs/workers')());
  router.use('/clients', require('./refs/clients')());
  router.use('/organizations', require('./refs/organizations')());
  router.use('/services', require('./refs/services')());
  router.use('/cities', require('./refs/cities')());
  router.use('/streets', require('./refs/streets')());
  router.use('/templates', require('./refs/templates')());

  // Docs
  router.use('/orders', require('./docs/orders')());
  router.use('/registers', require('./docs/registers')());
  router.use('/payments', require('./docs/payments')());
  router.use('/applications', require('./docs/applications')());
  router.use('/requests', require('./docs/requests')());
  router.use('/info', require('./docs/infos')());
  router.use('/removed_for_repair', require('./docs/removed_for_repair')());

  // API
  router.use('/api', require('./api/index')());

  router.use('/signup', require('../authorization')());
  router.use('/login', user.login);
  router.use('/home', user.home);
  router.use('/logout', user.logout);

  router.use(function (req, res) {
    res.statusCode = 404;
    res.end('404!');
  });

  return router;
};