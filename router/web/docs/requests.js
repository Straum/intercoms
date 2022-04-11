const express = require('express');
// const moment = require('moment');
// const db = require('../../../lib/db');
// const { visibleRows } = require('../../../lib/config').config;
// const utils = require('../../../lib/utils');

module.exports = () => {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.render('docs/requests.ejs');
  });

  // router.get('/edit/:id', (req, res) => {
  // });

  router.get('/edit_done', (req, res) => {
    res.render('docs/forms/done_application.ejs');
  });

  router.get('/add', (req, res) => {
    res.render('docs/forms/request.ejs');
  });

  router.get('/completed', (req, res) => {
    res.render('docs/done_request.ejs');
  });

  return router;
};
