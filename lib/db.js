'use  strict';

var mysql = require('mysql');
var pool = null;

exports.connect = function () {
  pool = mysql.createPool({
    connectionLimit: 100,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'intercoms'
  });
};

exports.get = function () {
  return pool;
};