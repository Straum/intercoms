const mysql = require('mysql');
let pool = null;

exports.connect = () => {
  pool = mysql.createPool({
    connectionLimit: 100,
    host: 'localhost',
    user: '9pskov',
    password: '9pskov',
    database: 'intercoms',
    multipleStatements: true,
  });
};

exports.get = () => pool;

exports.showDatabaseError = (codeError, err) => ({
  code: codeError,
  msg: 'Database Error',
  errorMessage: err.message,
});
