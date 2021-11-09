/* eslint-disable global-require */
const fs = require('fs');

const express = require('express');
const user = require('../authorization/login');

module.exports = () => {
  const router = express.Router();

  router.post('/image', (req, res) => {
    const { body: { name, image } } = req;
    const realFile = Buffer.from(image, 'base64');

    const fileName = `./public/photos/${name}`;

    fs.writeFile(fileName, realFile, (err) => {
      if (err)
        console.log(err);
    });
    res.send('OK');
  });

  router.get('/', (req, res) => {
    const { session: { userId } } = req;
    if (userId == null) {
      const message = '';
      res.render('signin', { message });
    } else {
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
  router.use('/gates', require('./docs/gates')());
  router.use('/fines', require('./docs/fines')());
  router.use('/registers', require('./docs/registers')());
  router.use('/payments', require('./docs/payments')());
  router.use('/applications', require('./docs/applications')());
  router.use('/requests', require('./docs/requests')());
  router.use('/info', require('./docs/infos')());
  router.use('/removed_for_repair', require('./docs/removed_for_repair')());

  // Reports
  router.use('/report_payments_by_banks', require('./reports/payments_by_banks')());

  // API
  router.use('/api', require('./api/index')());

  router.use('/signup', require('../authorization')());
  router.use('/login', user.login);
  router.use('/home', user.home);
  router.use('/logout', user.logout);

  router.use((req, res) => {
    res.statusCode = 404;
    res.end('404!');
  });

  return router;
};
