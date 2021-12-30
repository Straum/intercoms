const db = require('../../lib/db');

exports.login = (req, res) => {
  let message = '';

  if (req.method === 'POST') {
    const post = req.body;
    const name = post.userName;
    const pass = post.password;

    const sql = `SELECT user_id AS id, first_name AS firstName, last_name AS lastName, user_name AS userName FROM users WHERE is_deleted = 0 AND user_name = '${name}' and password = '${pass}'`;

    db.get().getConnection((err, connection) => {
      connection.query(sql, [], (error, rows) => {
        if (error) {
          throw error;
        }
        connection.release();

        if (Array.isArray(rows) && (rows.length >= 1)) {
          req.session.userName = rows[0].userName;
          res.redirect('home');
        } else {
          message = 'Неверный логин или пароль';
          res.render('signin', { message });
        }
      });
    });
  } else {
    res.render('signin', { message });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
};

exports.home = (req, res) => {
  res.render('home', { user: req.session.userName });
};
