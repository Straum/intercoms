'use strict';
var db = require('../../lib/db');

exports.login = function (req, res) {
  var message = '';

  if (req.method === 'POST') {
    var post = req.body;
    var name = post.userName;
    var pass = post.password;

    var sql = "SELECT user_id AS id, first_name AS firstName, last_name AS lastName, user_name AS userName FROM `users` WHERE is_deleted = 0 AND `user_name`='" + name + "' and password = '" + pass + "'";

    db.get().getConnection(function (err, connection) {
      connection.query(sql, [], function (err, rows) {

        if (err) {
          throw err;
        }
        connection.release();

        if (Array.isArray(rows) && (rows.length >= 1)) {
          req.session.userName = rows[0].userName;
          res.redirect('home');
        }
        else {
          message = 'Неверный логин или пароль';
          res.render('signin', { message: message });
        }

      });
    });
  } else {
    res.render('signin', { message: message });
  }

};

exports.logout = function (req, res) {
  req.session.destroy(function (err) {
    res.redirect('/login');
 });
};

exports.home = function (req, res) {
  res.render('home', {user: req.session.userName});
};
