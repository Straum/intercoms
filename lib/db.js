'use  strict';

var mysql = require('mysql');
var pool = null;

exports.connect = function () {
  'use strict';
  pool = mysql.createPool({
    connectionLimit: 100,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'intercoms'
  });
};

exports.get = function () {
  'use strict';
  return pool;
};

exports.showDatabaseError = function (codeError, err) {
  'use strict';
  return {
    code: codeError,
    msg: 'Database Error',
    errorMessage: err.message
  };
};