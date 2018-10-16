'use strict';

const express = require('express');
var db = require('../../../lib/db.js');
const visibleRows = require('../../../lib/config').config.visibleRows;
var moment = require('moment');

// var generateTable = function( id, page, search, callback) {
var generateTable = function(data, callback) {  

  var id = data.id;
  var page = data.page ? (+data.page > 1 ? +data.page : 1) : 1;  
  var offset = (+page - 1) * visibleRows;
  var pageCount = 0;
  var contract = data.search.trim();

  db.get().getConnection(function (err, connection) {

    var queryCount = 
      ' SELECT COUNT(*) AS count' +
      ' FROM' +
      ' lists_registers a';

    if (contract.length > 0) {
      queryCount += ' LEFT JOIN cards b ON b.card_id = a.card_id';
    }

    queryCount +=
      ' WHERE' + 
      ' a.register_id = ?';

    if (contract.length > 0) {
      queryCount += 
        data.prolonged ? ' AND b.m_contract_number = ' : ' AND b.contract_number = ';
        queryCount += contract;
    }

    connection.query(
      queryCount, [id], function(err, rows) {
        connection.release();

        pageCount =
          (rows[0].count / visibleRows) < 1 ? 0 : Math.ceil(rows[0].count / visibleRows);
        if ((offset > pageCount * visibleRows)) {
          offset = (pageCount - 1) * visibleRows;
        }

        var paginationContent = '';
        if (pageCount > 0) {
          if (page === 1) {
            paginationContent = 
              '<li class="page-item disabled">' +
                '<span class="page-link">&laquo;</span>' +
              '</li>';
          }
          else {
            paginationContent = 
              '<li class="page-item">' +
              '<a class="page-link">&laquo;</a>' +
              '</li>';
          }
          var i = (Number(page) > 5 ? Number(page) - 4 : 1);
          if (i !== 1) {
            paginationContent += 
              '<li class="page-item disabled">' +
                '<a class="page-link">...</a>' +
              '</li>';
          }
          for (; i <= (Number(page) + 4) && i <= pageCount; i++) {
            if (i === page) {
              paginationContent += 
                '<li class="page-item active">' +
                  '<span class="page-link">' +
                  i +
                  '<span class="sr-only">(current)</span>' +
                  '</span>' +
                '</li>';
              }
              else {
                paginationContent += 
                  '<li class="page-item">' +
                  '<a class="page-link">' +
                  i +
                  '</a>' +
                  '</li>';
              }
              if ((i === +page + 4) && (i < pageCount)) {
                paginationContent += 
                  '<li class="page-item disabled">' +
                  '<a class="page-link">...</a>' +
                  '</li>';
              }
          }
          if (+page === pageCount) {
            paginationContent += 
              '<li class="page-item disabled">' +
              '<a class="page-link">&raquo;</a>' +
              '</li>';
          }
          else {
            paginationContent += 
              '<li class="page-item">' +
              '<a class="page-link">&raquo;</a>' +
              '</li>';
          }
        }

        var queryRegisters = 
          ' SELECT' + 
          ' b.card_id,' +
          ' b.m_prolongation,' + 
          ' b.contract_number,' + 
          ' b.m_contract_number,' + 
          ` DATE_FORMAT(b.create_date, '%d.%m.%Y') AS create_date,` +
          ` DATE_FORMAT(b.start_service, '%d.%m.%Y') AS start_service,` + 
          ` DATE_FORMAT(b.end_service, '%d.%m.%Y') AS end_service` + 
          ' FROM' +
          ' lists_registers a' +
          ' LEFT JOIN cards b ON b.card_id = a.card_id' +
          ' WHERE' + 
          ' a.register_id = ?';

        if (contract.length > 0) {
          queryRegisters += 
            data.prolonged ? ' AND b.m_contract_number = ' : ' AND b.contract_number = ';
          queryRegisters += contract;
        }

        queryRegisters +=
          ' ORDER BY' +
          ' a.list_register_id' +
          ' LIMIT ?' +
          ' OFFSET ?';
      
        db.get().getConnection(function (err, connection) {
          connection.query(
            queryRegisters, [id, 100, +offset], function (err, rows) {

              if (err) {
                throw err;
              }
              connection.release();

              var result = '';
              if (! err) {
                var max = rows.length;
                for (var ind = 0; ind < max; ind++) {
                  result += 
                    // '<tr' + (ind % 2 ? ' class="table-info"' : '') + '>' +
                    // '<td style="width: 33%;" class="text-center align-middle">' + rows[ind].contract_number + '</td>' +
                    // '<td style="width: 33%;" class="text-center align-middle">' + rows[ind].m_contract_number + '</td>' +
                    // '<td style="width: 33%;" class="text-center align-middle">' + rows[ind].start_service + '</td>' +
                    // '</tr>' + 
                    // '<tr' + (ind % 2 ? ' class="table-info"' : '') + '>' +
                    // '<td style="width: 33%;" class="text-center align-middle">' + rows[ind].create_date + '</td>' +
                    // '<td style="width: 33%;" class="text-center align-middle">' + rows[ind].end_service + '</td>' +
                    // '<td style="width: 33%;" class="text-center align-middle">' + rows[ind].end_service + '</td>' +
                    // '</tr>';
                    '<tr' + (ind % 2 ? ' class="warning"' : '') + '>' +
                    '<td class="text-center align-middle">' + rows[ind].contract_number + '</td>' +
                    '<td class="text-center align-middle">' + rows[ind].m_contract_number + '</td>' +
                    '<td class="text-center align-middle">' + rows[ind].start_service + '</td>' +
                    '</tr>' + 
                    '<tr' + (ind % 2 ? ' class="warning"' : '') + '>' +
                    '<td class="text-center align-middle">' + rows[ind].create_date + '</td>' +
                    '<td class="text-center align-middle">' + rows[ind].end_service + '</td>' +
                    '<td class="text-center align-middle">' + rows[ind].end_service + '</td>' +
                    '</tr>';
                }
              }
              // return result;
              callback(result, paginationContent, pageCount);
            });
        });
      });
  });
};

module.exports = function () {
  var router = express.Router();

  router.get('/', function (req, res) {
    var pageCount = 0;
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT COUNT(*) AS count' +
        ' FROM registers', [], function (err, rows) {
          connection.release();
          pageCount =
            (rows[0].count / visibleRows) < 1 ? 0 : Math.ceil(rows[0].count / visibleRows);

          db.get().getConnection(function (err, connection) {
            connection.query(
              ' SELECT a.register_id AS id,' +
              ' a.create_date,' +
              ' a.start_date,' +
              ' a.end_date,' +
              ' a.last_modify_date,' +
              ' (SELECT COUNT(*) FROM lists_registers b WHERE' +
              ' b.register_id = a.register_id) AS docs' +
              ' FROM registers a' +
              // ' WHERE' +
              // ' a.create_date BETWEEN :start_date AND :end_date
              ' ORDER BY' +
              ' a.create_date DESC,' +
              ' a.register_id DESC' +
              ' LIMIT ?', [visibleRows], function (err, rows) {
                if (err) {
                  throw err;
                }
                connection.release();

                if (err) {
                  console.error(err);
                  res.status(500).send({
                    'code': 500,
                    'msg': 'Database error'
                  });
                } else {
                  var currentPage = 1;
                  res.render('docs/registers.ejs', {
                    'title': 'Реестр',
                    'data': rows,
                    'pageCount': pageCount,
                    'currentPage': currentPage,
                    'visibleRows': visibleRows,
                    'moment': moment
                  });
                }
              });
          });
        });
    });
  });

  router.get('/edit', function (req, res) {
    var pageCount = 0;
    console.log(req.query);
    var id = req.query.id;
    var offset = req.query.offset;
    if (typeof offset === 'undefined') {
      offset = 0;
    }
    var tableRowsCount = 0;

    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT a.register_id AS id, a.create_date, a.start_date, a.end_date, a.last_modify_date' +
        ' FROM registers a' +
        ' WHERE a.register_id = ?', [id], function (err, rows) {
          if (err) {
            throw err;
          }
          var data = rows[0];

          db.get().getConnection(function (err, connection) {
            connection.query(
              ' SELECT COUNT(*) AS count' +
              ' FROM' +
              ' lists_registers a' +
              ' WHERE a.register_id = ?', [id], function(err, rows) {

              connection.release();
              tableRowsCount = rows[0].count;
              pageCount =
                (rows[0].count / (visibleRows * 5)) < 1 ? 0 : Math.ceil(rows[0].count / (visibleRows * 5));

              var tableRows = [];
              db.get().getConnection(function (err, connection) {
                connection.query(
                  ' SELECT' + 
                  ' b.card_id,' +
                  ' b.m_prolongation,' + 
                  ' b.contract_number,' + 
                  ' b.m_contract_number,' + 
                  ` DATE_FORMAT(b.create_date, '%d.%m.%Y') AS create_date,` +
                  ` DATE_FORMAT(b.start_service, '%d.%m.%Y') AS start_service,` + 
                  ` DATE_FORMAT(b.end_service, '%d.%m.%Y') AS end_service` + 
                  ' FROM' +
                  ' lists_registers a' +
                  ' LEFT JOIN cards b ON b.card_id=a.card_id' +
                  ' WHERE' + 
                  ' a.register_id = ?' +
                  ' ORDER BY' +
                  ' a.list_register_id' +
                  ' LIMIT ?' +
                  ' OFFSET ?', [id, 100, +offset], function (err, rows) {
                    
                    connection.release();
                    
                    if (err) {
                      res.status(500).send({
                        'code': 500,
                        'msg': 'Database error'
                      });
                    }
                    else {
                      var currentPage = Math.ceil(offset / (visibleRows * 5)) + 1;
                      tableRows = rows;
                      res.render('docs/forms/register.ejs', {
                        'title': 'Реестр',
                        'data': data,
                        'moment': moment,
                        'tableRows': tableRows,
                        'tableRowsCount': tableRowsCount,
                        'pageCount': pageCount,
                        'currentPage': currentPage,
                        'visibleRows': visibleRows * 5
                      });
                    }
                  });
                });
              });
            });
          });
    });
  });

  // router.get('/edit/:id&:offset', function (req, res) {
  //   kk(req, res);
  // });

  router.get('/add', function (req, res) {
    res.render('docs/forms/equipment.ejs', {
      'title': 'Реестр'
    });
  });

  router.get('/table', function (req, res) {
    var id = req.query.id;
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT' + 
        ' b.card_id,' +
        ' b.m_prolongation,' + 
        ' b.contract_number,' + 
        ' b.m_contract_number,' + 
        ` DATE_FORMAT(b.create_date, '%d.%m.%Y') AS create_date,` +
        ` DATE_FORMAT(b.start_service, '%d.%m.%Y') AS start_service,` + 
        ` DATE_FORMAT(b.end_service, '%d.%m.%Y') AS end_service` + 
        ' FROM' +
        ' lists_registers a' +
        ' LEFT JOIN cards b ON b.card_id=a.card_id' +
        ' WHERE' + 
        ' a.register_id = ?' +
        ' ORDER BY' +
        ' a.list_register_id', [id], function (err, rows) {
          if (err) {
            throw err;
          }
          connection.release();

          if (err) {
            console.error(err);
            res.status(500).send({
              'code': 500,
              'msg': 'Database error'
            });
          } else {
            res.status(200).send({ 'table': rows });
          }
        });
    });
  });

  router.get('/:offset', function (req, res) {
    var offset = +req.params.offset;
    var pageCount = 0;
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT COUNT(*) AS count' +
        ' FROM registers', [], function (err, rows) {
          connection.release();
          pageCount =
            (rows[0].count / visibleRows) < 1 ? 0 : Math.ceil(rows[0].count / visibleRows);
          if ((offset > pageCount * visibleRows)) {
            offset = (pageCount - 1) * visibleRows;
          }

          db.get().getConnection(function (err, connection) {
            connection.query(
              ' SELECT a.register_id AS id,' +
              ' a.create_date,' +
              ' a.start_date,' +
              ' a.end_date,' +
              ' a.last_modify_date,' +
              ' (SELECT COUNT(*) FROM lists_registers b WHERE' +
              ' b.register_id = a.register_id) AS docs' +
              ' FROM registers a' +
              // ' WHERE' +
              // ' a.create_date BETWEEN :start_date AND :end_date
              ' ORDER BY' +
              ' a.create_date DESC,' +
              ' a.register_id DESC' +
              ' LIMIT ?' +
              ' OFFSET ?', [visibleRows, offset], function (err, rows) {
                if (err) {
                  throw err;
                }
                connection.release();

                if (err) {
                  console.error(err);
                  res.status(500).send({
                    'code': 500,
                    'msg': 'Database error'
                  });
                } else {
                  var currentPage = Math.ceil(offset / visibleRows) + 1;
                  res.render('docs/registers.ejs', {
                    'title': 'Реестр',
                    'data': rows,
                    'pageCount': pageCount,
                    'currentPage': currentPage,
                    'visibleRows': visibleRows,
                    'moment': moment
                  });
                }
              });
          });
        });
    });
  });

  router.post('/save', function (req, res) {
    if ((req.body.id) && (isFinite(+req.body.id))) {
      db.get().getConnection(function (err, connection) {
        connection.query(
          ' UPDATE equipments SET name = ?, guarantee_period = ?' +
          ' WHERE equipment_id = ?', [req.body.name, req.body.years, req.body.id], function (err) {
            connection.release();
            if (err) {
              res.status(500).send({ 'code': 500, 'msg': 'Database Error' });
            } else {
              res.redirect('/equipment');
            }
          }
        );
      });
    }
    else {
      db.get().getConnection(function (err, connection) {
        connection.query(
          ' INSERT INTO equipments (name, guarantee_period)' +
          ' VALUE(?, ?)', [req.body.name, req.body.years], function (err) {
            connection.release();
            if (err) {
              res.status(500).send({ 'code': 500, 'msg': 'Database Error' });
            } else {
              res.redirect('/equipment');
            }
          }
        );
      });
    }
  });

  router.post('/delete', function (req, res) {
    if ((req.body.id) && (isFinite(+req.body.id))) {
      db.get().getConnection(function (err, connection) {
        connection.query(
          ' DELETE FROM equipments WHERE equipment_id = ?', [+req.body.id], function (err) {
            connection.release();
            if (err) {
              res.status(500).send({
                'code': 500,
                'msg': 'Database Error',
                'err': JSON.stringify(err)
              });
            } else {
              res.status(200).send({ 'result': 'OK' });
            }
          }
        );
      });
    }
    else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  router.post('/edit', function (req, res) {
    var data = req.body.data;
    // var page = data.page ? (data.page > 1 ? data.page : 1) : 1;

    // generateTable(data.id, +page, data.search, function(dataTable, pageContent, pagesCount) {
    generateTable(data, function(dataTable, pageContent, pagesCount) {
      res.status(200).send({ 
        'result': 'OK', 
        'bodyTable': dataTable,
        'pageContent': pageContent,
        'pagesCount': pagesCount
      });
    });
  });

  return router;
};
