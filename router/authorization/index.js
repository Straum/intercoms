'use strict';

const express = require('express');
var db = require('../../lib/db.js');

module.exports = function () {
  var router = express.Router();

  router.get('/', function (req, res) {
    var msg = '';
    res.render('signup', {message: msg});
  });

  router.post('/', function (req, res) {
    var post = req.body;
    var firstName = post.firstName;
    var lastName = post.lastName;
    var userName = post.userName;
    var password = post.password;

    var sql = 'INSERT INTO users (first_name, last_name, user_name, password) VALUES (' +
    '"' + firstName + '"' + ', ' +
    '"' + lastName + '"' + ', ' +
    '"' + userName + '"' + ', ' +
    '"' + password + '"' +
    ')';

    db.get().getConnection(function (err, connection) {
      connection.query(sql, [], function (err, rows) {

        if (err) {
          throw err;
        }
        connection.release();

        var message = 'Пользователь успешно создан!';
        res.render('signup', {message: message});

      });
    });
    
  });

  return router;
};