'use strict';

const MAX_LENGTH = 60;
const express = require('express');
var PDFDocument = require('pdfkit');
// var PDFDoc = require('pdfmake');
var db = require('../../../lib/db');
const visibleRows = require('../../../lib/config').config.visibleRows;
const rowsLimit = require('../../../lib/config').config.rowsLimit;
var moment = require('moment');
var utils = require('../../../lib/utils');
var isCheckPerformer = false;
var queryGetCard = require('../../../queries/applications').getCard;
var common = require('../../common/typeheads');
const { application } = require('express');
var ApplicationModel = require('../../../models/application').ApplicationModel;

var generateReport = function (req, res) {

  var tableFaults = [];
  try {
    tableFaults = JSON.parse(req.body.faults);
  } catch (error) {
    //
  }

  var doc = new PDFDocument();
  doc.registerFont('Fuh', 'fonts//DejaVuSans.ttf');
  var filename = 'application.pdf';
  res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
  res.setHeader('Content-type', 'application/pdf');

  doc.registerFont('DejaVuSans', 'fonts//DejaVuSans.ttf');
  doc.font('DejaVuSans');

  doc.fontSize(14);
  doc.text('Заявка от ' + req.body.createDate, 50, 50, { align: 'center' });

  doc.fontSize(12);
  doc
    .text('Адрес: ' + req.body.address + ', подъезд: ' + req.body.porch, 50, 90)
    .text('Телефон: ' + req.body.phone, 50, 110);

  doc.moveDown();
  doc.x = 50;
  doc
    .text('Список неисправностей', { underline: true });
  doc.moveDown();

  // var list = [];
  // tableFaults.forEach(function (item) {
  //   list.push(item.value);
  // });
  // doc.list(list);
  // doc.moveDown();
  doc.text('Всего неисправностей: ' + tableFaults.length);

  doc.moveDown();
  doc.text('Исполнитель: ' + req.body.performer, 50);

  doc.pipe(res);
  doc.end();
};

var getCity = function (cityName, callback) {
  db.get().getConnection(function (err, connection) {
    connection.query(
      ' SELECT a.city_id AS cityId' +
      ' FROM cities a' +
      ' WHERE a.name = ?' +
      ' LIMIT 1', [cityName], function (err, rows) {
        connection.release();

        if (typeof callback === 'function') {
          if (rows.length === 1) {
            callback(rows[0].cityId);
          }
          else {
            callback(null);
          }
        }
      }
    );
  });
};

var getStreets = function (cityId, streetName, rowsLimit, callback) {
  var queryText = ' SELECT a.street_id AS streetId, a.name AS streetName' +
    ' FROM streets a' +
    ' WHERE (a.city_id = ' + cityId + ')';

  if ((typeof streetName === 'string') && (streetName.trim() !== '')) {
    queryText += ' AND (a.name LIKE ' + `'` + streetName.trim() + '%' + `'` + ')';
  }

  queryText += ' LIMIT ' + rowsLimit;

  db.get().getConnection(function (err, connection) {
    connection.query(
      queryText, [], function (err, rows) {
        connection.release();

        if (typeof callback === 'function') {
          callback(rows);
        }
      }
    );
  });
};

var getHouses = function (cityId, streetName, houseNumber, rowsLimit, callback) {
  getStreets(cityId, streetName, 1, function (streets) {
    if ((Array.isArray(streets)) && (streets.length === 1)) {
      var streetId = streets[0].streetId;

      var queryText = ' SELECT a.house_id, a.number AS house_number, a.street_id' +
        ' FROM houses a' +
        ' WHERE (a.street_id = ' + streetId + ')';

      if ((typeof houseNumber === 'string') && (houseNumber.trim().length > 0)) {
        queryText += ' AND (a.number LIKE ' + `'` + houseNumber.trim() + '%' + `'` + ')';
      }

      queryText += ' LIMIT ' + rowsLimit;

      db.get().getConnection(function (err, connection) {
        connection.query(
          queryText, [], function (err, rows) {
            connection.release();

            if (typeof callback === 'function') {
              callback(rows);
            }
          }
        );
      });
    }
  });
};

var saveTable = function (id, table, callback) {

  var s = 'INSERT INTO faults (application_id, name, decision, worker_id, is_done, completion_dt) VALUES';
  var isAccepted = true;
  for (var ind = 0; ind < table.length; ind++) {

    if (+table[ind].isDone === 0) {
      isAccepted = false;
    }

    // FIXME: Добить нормальную проверку!!!
    // var checkDate = new utils.convertDateToMySQLDate(table[ind].completionDT, true);
    // var myDate = table[ind].completionDT;
    // if (typeof myDate === 'string') {
    //   if (myDate.length > 10) {
    //     myDate = myDate.substr(0, 10);
    //   }
    // }

    var saveDate = 'null';
    if (+table[ind].isDone === 1) {
      var myDate = moment(new Date()).format('YYYY-MM-DD');
      saveDate = '"' + myDate + '"';
    }

    s += ' (' +

      id + ', ' +
      '"' + table[ind].faultName + '", ' +
      '"' + table[ind].decision + '", ' +
      table[ind].workerId + ', ' +
      table[ind].isDone + ', ' +
      // '"' +  checkDate.outputDate() + '"' +
      // typeof myDate === 'string' ? '"' +  myDate + '"' : 'null' +
      // '"' + myDate + '"' +
      saveDate +

      ')';
    if (ind < table.length - 1) {
      s += ',';
    }
  }

  // console.log('s = ' + s);

  db.get().getConnection(function (err, connection) {
    connection.query(s, [], function () {
      connection.release();

      if (err) {
        throw err;
      }

      if (typeof callback === 'function') {
        callback(isAccepted);
      }

    });
  });
};

var Filters = function () {
  this.conditions = {
    period: {
      start: '',
      end: '',
      sortBy: 'DESC',
      allRecords: true
    },
    city: { id: 0, name: '' },
    street: { id: 0, name: '', cityId: 0 },
    house: { id: 0, number: '', streetId: 0 },
    performer: { id: 0, name: '' },
    emptyPerformers: false
  };
  this.whereSQL = '';
  this.orderBy = '';
};

var filterBuilder = function (req, isDone) {

  var obj = {};
  var filters = new Filters();
  var cloneFilters = new Filters();
  var where = '';

  var startDate = moment().startOf('month').toDate();
  var endDate = moment().endOf('month').toDate();
  // var endDate = moment().endOf('month').endOf('day').toDate();
  var _start = '';
  var _end = '';

  if (isDone) {
    if (!('filtersDoneApplications' in req.session)) {
      req.session.filtersDoneApplications = filters;
    }
    cloneFilters = req.session.filtersDoneApplications;

    if (cloneFilters.conditions.period.start === '') {
      cloneFilters.conditions.period.start = moment(startDate).format('YYYY-MM-DD HH:mm');
    }
    if (cloneFilters.conditions.period.end === '') {
      cloneFilters.conditions.period.end = moment(endDate).format('YYYY-MM-DD HH:mm');
    }

    try {
      if (req.query) {
        if ('filters' in req.query) {
          obj = JSON.parse(req.query.filters);

          if (+obj.city.id > 0) {
            where += ' AND (a.city_id = ' + obj.city.id + ')';
          }
          cloneFilters.conditions.city = {
            id: obj.city.id,
            name: obj.city.name
          };

          if (+obj.street.id > 0) {
            where += ' AND (a.street_id = ' + obj.street.id + ')';
          }
          cloneFilters.conditions.street = {
            id: obj.street.id,
            name: obj.street.name,
            cityId: obj.street.cityId
          };

          if (+obj.house.id > 0) {
            where += ' AND (a.house_id = ' + obj.house.id + ')';
          }
          cloneFilters.conditions.house = {
            id: obj.house.id,
            number: obj.house.number,
            streetId: obj.house.streetId
          };

          if (+obj.performer.id > 0) {
            where += ' AND (a.worker_id = ' + obj.performer.id + ')';
          }
          cloneFilters.conditions.performer = {
            id: obj.performer.id,
            name: obj.performer.name,
          };

          cloneFilters.conditions.period.sortBy = obj.period.sortBy;

          _start = obj.period.start; // YYYY-MM-DD HH:mm
          if (typeof _start === 'string') {
            if (_start.length > 0) {
              cloneFilters.conditions.period.start = _start;
            }
            else {
              cloneFilters.conditions.period.start = moment(startDate).format('YYYY-MM-DD HH:mm');
            }
          }

          _end = obj.period.end; // YYYY-MM-DD HH:mm
          if (typeof _end === 'string') {
            if (_end.length > 0) {
              cloneFilters.conditions.period.end = _end;
            }
            else {
              cloneFilters.conditions.period.end = endDate;
            }
          }

          where += ' AND (a.close_date >= ' + '"' + cloneFilters.conditions.period.start + '")';
          where += ' AND (a.close_date <= ' + '"' + cloneFilters.conditions.period.end + '")';

          cloneFilters.whereSQL = where;
        }
      }

      req.session.filtersDoneApplications = cloneFilters;

    }
    catch (err) {
      throw (err);
    }

  }
  else {
    if (!('filtersApplications' in req.session)) {
      req.session.filtersApplications = filters;
    }
    cloneFilters = req.session.filtersApplications;

    if (cloneFilters.conditions.period.start === '') {
      cloneFilters.conditions.period.start = moment(startDate).format('YYYY-MM-DD HH:mm');
    }
    if (cloneFilters.conditions.period.end === '') {
      cloneFilters.conditions.period.end = moment(endDate).format('YYYY-MM-DD HH:mm');
    }

    try {
      if (req.query) {
        if ('filters' in req.query) {
          obj = JSON.parse(req.query.filters);

          if (+obj.city.id > 0) {
            where += ' AND (a.city_id = ' + obj.city.id + ')';
          }
          cloneFilters.conditions.city = {
            id: obj.city.id,
            name: obj.city.name
          };

          if (+obj.street.id > 0) {
            where += ' AND (a.street_id = ' + obj.street.id + ')';
          }
          cloneFilters.conditions.street = {
            id: obj.street.id,
            name: obj.street.name,
            cityId: obj.street.cityId
          };

          if (+obj.house.id > 0) {
            where += ' AND (a.house_id = ' + obj.house.id + ')';
          }
          cloneFilters.conditions.house = {
            id: obj.house.id,
            number: obj.house.number,
            streetId: obj.house.streetId
          };

          if (obj.emptyPerformers) {
            where += ' AND (a.worker_id = 0)';
          }
          else {
            if (+obj.performer.id > 0) {
              where += ' AND (a.worker_id = ' + obj.performer.id + ')';
            }
          }
          cloneFilters.conditions.emptyPerformers = obj.emptyPerformers;
          cloneFilters.conditions.performer = {
            id: obj.performer.id,
            name: obj.performer.name,
          };

          cloneFilters.conditions.period.sortBy = obj.period.sortBy;
          cloneFilters.conditions.period.allRecords = obj.period.allRecords;

          _start = obj.period.start; // YYYY-MM-DD HH:mm
          if (typeof _start === 'string') {
            if (_start.length > 0) {
              cloneFilters.conditions.period.start = _start;
            }
            else {
              cloneFilters.conditions.period.start = moment(startDate).format('YYYY-MM-DD HH:mm');
            }
          }

          _end = obj.period.end; // YYYY-MM-DD HH:mm
          if (typeof _end === 'string') {
            if (_end.length > 0) {
              cloneFilters.conditions.period.end = _end;
            }
            else {
              cloneFilters.conditions.period.end = endDate;
            }
          }

          if (!cloneFilters.conditions.period.allRecords) {
            where += ' AND (a.create_date >= ' + '"' + cloneFilters.conditions.period.start + '")';
            where += ' AND (a.create_date <= ' + '"' + cloneFilters.conditions.period.end + '")';
          }

          cloneFilters.whereSQL = where;
        }
      }

      req.session.filtersApplications = cloneFilters;

    }
    catch (err) {
      throw (err);
    }

  }

  // if (! ('filtersApplications' in req.session)) {
  //   req.session.filtersApplications = filters;
  // }
  // cloneFilters = req.session.filtersApplications;

  // if (usePeriod) {
  //   if (cloneFilters.conditions.period.start === '') {
  //     cloneFilters.conditions.period.start = moment(startDate).format('YYYY-MM-DD HH:mm');
  //   }
  //   if (cloneFilters.conditions.period.end === '') {
  //     cloneFilters.conditions.period.end = moment(endDate).format('YYYY-MM-DD HH:mm');
  //   }
  // }

  // try {
  //   if (req.query) {
  //     if ('filters' in req.query) {
  //       obj = JSON.parse(req.query.filters);

  //       if (+obj.city.id > 0) {
  //         where += ' AND (a.city_id = ' + obj.city.id + ')';
  //       }
  //       cloneFilters.conditions.city = {
  //         id: obj.city.id,
  //         name: obj.city.name
  //       };

  //       if (+obj.street.id > 0) {
  //         where += ' AND (a.street_id = ' + obj.street.id + ')';
  //       }
  //       cloneFilters.conditions.street = {
  //         id: obj.street.id,
  //         name: obj.street.name,
  //         cityId: obj.street.cityId
  //       };

  //       if (+obj.house.id > 0) {
  //         where += ' AND (a.house_id = ' + obj.house.id + ')';
  //       }
  //       cloneFilters.conditions.house = {
  //         id: obj.house.id,
  //         number: obj.house.number,
  //         streetId: obj.house.streetId
  //       };

  //       if (+obj.performer.id > 0) {
  //         where += ' AND (a.worker_id = ' + obj.performer.id + ')';
  //       }
  //       cloneFilters.conditions.performer = {
  //         id: obj.performer.id,
  //         name: obj.performer.name,
  //       };

  //       if (usePeriod) {
  //         var _start = obj.period.start; // YYYY-MM-DD HH:mm
  //         if (typeof _start  === 'string') {
  //           if (_start.length > 0) {
  //             cloneFilters.conditions.period.start = _start;
  //           }
  //           else {
  //             cloneFilters.conditions.period.start = moment(startDate).format('YYYY-MM-DD HH:mm');
  //           }
  //         }

  //         var _end = obj.period.end; // YYYY-MM-DD HH:mm
  //         if (typeof _end  === 'string') {
  //           if (_end.length > 0) {
  //             cloneFilters.conditions.period.end = _end;
  //           }
  //           else {
  //             cloneFilters.conditions.period.end = endDate;
  //           }
  //         }

  //         where += ' AND (a.close_date >= ' + '"' + cloneFilters.conditions.period.start  + '")';
  //         where += ' AND (a.close_date <= ' + '"' + cloneFilters.conditions.period.end  + '")';
  //       }

  //       cloneFilters.whereSQL = where;
  //     }
  //   }

  //   req.session.filtersApplications = cloneFilters;

  // }
  // catch (err) {
  //   throw (err);
  // }
  return cloneFilters;
};

// var additionalWhereInQuery = function (req, usePeriod) {

//   var obj = {};
//   var settings = {
//     filter: {
//       city: { id: 0, value: '' },
//       street: { id: 0, value: '' },
//       house: { id: 0, value: '' },
//       performer: { id: 0, value: '' },
//       period: {
//         start: '',
//         end: ''
//       }
//     },
//     where: ''
//   };
//   var where = '';

//   if (! ('applicationsSettings' in req.session)) {
//     req.session.applicationsSettings = settings;
//   }

//   if (usePeriod) {
//     if (req.session.applicationsSettings.filter.period.start === '') {
//       var startDate = moment().startOf('month').toDate();
//       req.session.applicationsSettings.filter.period.start = moment(startDate).format('YYYY-MM-DD HH:mm');
//     }
//     if (req.session.applicationsSettings.filter.period.end === '') {
//       var endDate = moment().endOf('month').toDate();
//       req.session.applicationsSettings.filter.period.end = moment(endDate).format('YYYY-MM-DD HH:mm');
//     }
//   }

//   try {
//     if (req.query) {
//       if ('cityId' in req.query) {
//         obj = JSON.parse(req.query.cityId);
//         if (+ obj.id > 0) {
//           where += ' AND (a.city_id = ' + obj.id + ')';
//           req.session.applicationsSettings.filter.city = {
//             id: obj.id,
//             value: obj.value
//           };
//         }
//       }

//       // if (('streetId' in req.query) && (req.query.streetId.trim() !== '')) {
//       //   result.where += ' AND (a.street_id = ' + req.query.streetId + ')';
//       // }
//       if ('streetId' in req.query) {
//         obj = JSON.parse(req.query.streetId);
//         if (+ obj.id > 0) {
//           where += ' AND (a.street_id = ' + obj.id + ')';
//           req.session.applicationsSettings.filter.street = {
//             id: obj.id,
//             value: obj.value
//           };
//         }
//       }

//       if ('houseId' in req.query) {
//         obj = JSON.parse(req.query.houseId);
//         if (+ obj.id > 0) {
//           where += ' AND (a.house_id = ' + obj.id + ')';
//           req.session.applicationsSettings.filter.house = {
//             id: obj.id,
//             value: obj.value
//           };
//         }
//       }

//       // if (('houseId' in req.query) && (req.query.houseId.trim() !== '')) {
//       //   result.where += ' AND (a.house_id = ' + req.query.houseId + ')';
//       // }

//       if ('performerId' in req.query) {
//         obj = JSON.parse(req.query.performerId);
//         if (+ obj.id > 0) { // + add "No data"
//         where += ' AND (a.worker_id = ' + obj.id + ')';
//         req.session.applicationsSettings.filter.performer = {
//             id: obj.id,
//             value: obj.value
//           };
//         }
//       }

//       if (usePeriod) {
//         if ('startDate' in req.query) {
//           var start = req.query.startDate;
//           if ((typeof start  === 'string') && (start.length > 0)) {
//             req.session.applicationsSettings.filter.period.start = moment(start, 'DD.MM.YYYY HH:mm').format('YYYY-MM-DD HH:mm');
//           }
//         }
//         where += ' AND (a.close_date >= ' + '"' + req.session.applicationsSettings.filter.period.start + '")';

//         if ('endDate' in req.query) {
//           var end = req.query.endDate;
//           if ((typeof end  === 'string') && (end.length > 0)) {
//             req.session.applicationsSettings.filter.period.end = moment(end, 'DD.MM.YYYY HH:mm').format('YYYY-MM-DD HH:mm');
//           }
//         }
//         where += ' AND (a.close_date <= ' + '"' + req.session.applicationsSettings.filter.period.end + '")';
//       }

//     }
//     req.session.applicationsSettings.where = where;
//   }
//   catch (err) {
//     throw (err);
//   }
//   return req.session.applicationsSettings;
// };

var downloadReport = function (req, res) {
  var add = filterBuilder(req, false);

  var fullQuery =
    ' SELECT a.application_id AS documentId, DATE_FORMAT(a.create_date, "%d.%m.%Y %H:%i") AS createDate,' +
    ' b.name AS cityName, c.name AS streetName,' +
    ' d.number AS houseNumber, a.porch, a.kind, ' +
    ' a.phone, ' +
    ' f.name AS performerName,' +
    ' (SELECT COUNT(*) FROM faults e WHERE e.application_id  = a.application_id) AS rowsInDoc' +
    ' FROM applications a' +
    ' LEFT JOIN cities b ON b.city_id = a.city_id' +
    ' LEFT JOIN streets c ON c.street_id = a.street_id' +
    ' LEFT JOIN houses d ON d.house_id = a.house_id' +
    ' LEFT JOIN workers f ON f.worker_id = a.worker_id' +
    ' WHERE (a.application_id > 0)' +
    ' AND (a.is_done = 0)' +
    ' AND (a.is_deleted = 0)' + add.whereSQL +
    ' ORDER BY f.name , a.create_date ASC';

  var doc = new PDFDocument();
  doc.registerFont('Fuh', 'fonts//DejaVuSans.ttf');
  var filename = 'applications.pdf';
  res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
  res.setHeader('Content-type', 'applications/pdf');

  doc.registerFont('DejaVuSans', 'fonts//DejaVuSans.ttf');
  doc.font('DejaVuSans');

  db.get().getConnection(function (err, connection) {
    connection.query(
      fullQuery, function (err, rows) {
        if (err) {
          throw err;
        }
        connection.release();

        if (err) {
          console.error(err);
          res.status(500).send(db.showDatabaseError(500, err));
        } else {

          var dataset = rows;

          var parameters = '';
          if (Array.isArray(rows) && (rows.length > 0)) {
            for (var ind = 0; ind < rows.length; ind++) {
              parameters += rows[ind].documentId + (ind < rows.length - 1 ? ', ' : '');
            }
            parameters = '(' + parameters + ')';
          }

          db.get().getConnection(function (err, connection) {
            var stringSQL =
              ' SELECT a.application_id AS documentId, a.name AS problemDescription' +
              ' FROM faults a' +
              ' WHERE a.application_id IN ';
            if (parameters.trim().length === 0) {
              parameters = '(-1)';
            }
            stringSQL += parameters;

            connection.query(
              stringSQL, [], function (err, rows) {
                connection.release();

                if (err) {
                  res.status(500).send(db.showDatabaseError(500, err));
                }
                else {

                  doc.x = 50;

                  doc.fontSize(14);
                  doc.text('Текущие заявки', { align: 'center' });
                  doc.moveDown();
                  doc.moveDown();

                  dataset.forEach(function (item) {
                    var list = [];

                    rows.forEach(function (fault) {
                      // FIXME: filter!!!!!
                      if (+item.documentId === +fault.documentId) {
                        list.push(fault.problemDescription);
                      }
                    });

                    doc.fontSize(14);
                    doc.text('Заявка от ' + item.createDate, { align: 'center' });
                    doc.moveDown();

                    doc.fontSize(12);
                    doc
                      .text('Адрес: ' + item.cityName + ',' + item.streetName + ', ' + item.houseNumber + (+item.kind === 0 ? ', подъезд ' : ', квартира ') + item.porch)
                      .text('Телефон: ' + item.phone)

                      .moveDown()
                      .text('Список неисправностей', { underline: true })
                      .list(list)
                      // .text('Всего неисправностей: ' + list.length)
                      // .moveDown()
                      // .text('Исполнитель: ' + item.performerName)
                      .moveDown()
                      .moveDown();
                  });
                  doc.pipe(res);
                  doc.end();
                }
              });
          });
        }
      });
  });
};

var downloadDoneReport = function (req, res) {
  var add = filterBuilder(req, true);

  var fullQuery =
    ' SELECT a.application_id AS documentId, DATE_FORMAT(a.create_date, "%d.%m.%Y %H:%i") AS createDate,' +
    ' b.name AS cityName, c.name AS streetName,' +
    ' d.number AS houseNumber, a.porch, a.kind, ' +
    ' a.phone, ' +
    ' f.name AS performerName,' +
    ' a.close_date AS closeDate, ' +
    ' (SELECT COUNT(*) FROM faults e WHERE e.application_id  = a.application_id) AS rowsInDoc' +
    ' FROM applications a' +
    ' LEFT JOIN cities b ON b.city_id = a.city_id' +
    ' LEFT JOIN streets c ON c.street_id = a.street_id' +
    ' LEFT JOIN houses d ON d.house_id = a.house_id' +
    ' LEFT JOIN workers f ON f.worker_id = a.worker_id' +
    ' WHERE (a.application_id > 0)' +
    ' AND (a.is_done = 1)' +
    ' AND (a.is_deleted = 0)' + add.whereSQL +
    ' ORDER BY f.name , a.create_date ASC';

  var doc = new PDFDocument();
  doc.registerFont('Fuh', 'fonts//DejaVuSans.ttf');
  var filename = 'done_applications.pdf';
  res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
  res.setHeader('Content-type', 'applications/pdf');

  doc.registerFont('DejaVuSans', 'fonts//DejaVuSans.ttf');
  doc.font('DejaVuSans');

  db.get().getConnection(function (err, connection) {
    connection.query(
      fullQuery, function (err, rows) {
        if (err) {
          throw err;
        }
        connection.release();

        if (err) {
          console.error(err);
          res.status(500).send(db.showDatabaseError(500, err));
        } else {

          var dataset = rows;

          var parameters = '';
          if (Array.isArray(rows) && (rows.length > 0)) {
            for (var ind = 0; ind < rows.length; ind++) {
              parameters += rows[ind].documentId + (ind < rows.length - 1 ? ', ' : '');
            }
            parameters = '(' + parameters + ')';
          }

          db.get().getConnection(function (err, connection) {
            var stringSQL =
              ' SELECT a.application_id AS documentId, a.name AS problemDescription, a.decision' +
              ' FROM faults a' +
              ' WHERE a.application_id IN ';
            if (parameters.trim().length === 0) {
              parameters = '(-1)';
            }
            stringSQL += parameters;

            connection.query(
              stringSQL, [], function (err, rows) {
                connection.release();

                if (err) {
                  res.status(500).send(db.showDatabaseError(500, err));
                }
                else {

                  doc.x = 50;
                  doc.fontSize(14);
                  doc.text('Исполненные заявки', { align: 'center' });
                  doc.moveDown();
                  doc.moveDown();
                  dataset.forEach(function (item) {
                    var list = [];

                    rows.forEach(function (fault) {
                      // FIXME: filter!!!!!
                      if (+item.documentId === +fault.documentId) {
                        list.push(fault.problemDescription + ' (' + fault.decision + ')');
                      }
                    });

                    doc.fontSize(14);
                    doc.text('Заявка от ' + item.createDate, { align: 'center' });
                    doc.moveDown();

                    doc.fontSize(12);
                    doc
                      .text('Адрес: ' + item.cityName + ',' + item.streetName + ', ' + item.houseNumber + (+item.kind === 0 ? ', подъезд ' : ', квартира ') + item.porch)
                      .text('Телефон: ' + item.phone)

                      .moveDown()
                      .text('Список неисправностей', { underline: true })
                      .list(list)
                      // .text('Всего неисправностей: ' + list.length)
                      .moveDown()
                      .text('Исполнитель: ' + item.performerName)
                      .text('Выполнено: ' + moment(item.closeDate).format('DD.MM.YYYY HH:mm'))
                      .moveDown()
                      .moveDown();
                  });
                  doc.pipe(res);
                  doc.end();
                }
              });
          });
        }
      });
  });
};

var applicationsReport = function (req, res) {

  var add = filterBuilder(req, false);

  var fullQuery =
    ' SELECT a.application_id AS documentId, DATE_FORMAT(a.create_date, "%d.%m.%Y %H:%i") AS createDate,' +
    ' b.name AS cityName, c.name AS streetName,' +
    ' d.number AS houseNumber, a.porch, a.kind, ' +
    ' a.phone, a.completion_date AS completionDate, a.weight, ' +
    ' f.name AS performerName,' +
    ' (SELECT COUNT(*) FROM faults e WHERE e.application_id  = a.application_id) AS rowsInDoc' +
    ' FROM applications a' +
    ' LEFT JOIN cities b ON b.city_id = a.city_id' +
    ' LEFT JOIN streets c ON c.street_id = a.street_id' +
    ' LEFT JOIN houses d ON d.house_id = a.house_id' +
    ' LEFT JOIN workers f ON f.worker_id = a.worker_id' +
    ' WHERE (a.application_id > 0)' +
    ' AND (a.is_done = 0)' +
    ' AND (a.is_deleted = 0)' + add.whereSQL +
    ' ORDER BY b.name, c.name, d.number ASC';
  // ' ORDER BY f.name , a.create_date ASC';

  var filename = 'applications.pdf';
  res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
  res.setHeader('Content-type', 'applications/pdf');


  // doc.registerFont('DejaVuSans', 'fonts//DejaVuSans.ttf');
  // doc.font('DejaVuSans');

  var fonts = {
    Roboto: {
      normal: 'fonts//DejaVuSans.ttf',
      bold: 'fonts/DejaVuSans-Bold.ttf',
      italics: 'fonts/DejaVuSans-BoldOblique.ttf',
      bolditalics: 'fonts/DejaVuSans-BoldOblique.ttf'
    }
  };

  // var fonts = {
  //   DejaVuSans: {
  //     normal: 'fonts/DejaVuSans.ttf',
  //     bold: 'fonts/DejaVuSans.ttf',
  //     italics: 'fonts/DejaVuSans.ttf',
  //     bolditalics: 'fonts/DejaVuSans.ttf'
  //   }
  // };

  // var fonts = {
  //   Roboto: {
  //     normal: 'Courier',
  //     bold: 'Courier-Bold',
  //     italics: 'Courier-Oblique',
  //     bolditalics: 'Courier-BoldOblique'
  //   },
  //   Courier: {
  //     normal: 'Courier',
  //     bold: 'Courier-Bold',
  //     italics: 'Courier-Oblique',
  //     bolditalics: 'Courier-BoldOblique'
  //   },
  //   Helvetica: {
  //     normal: 'Helvetica',
  //     bold: 'Helvetica-Bold',
  //     italics: 'Helvetica-Oblique',
  //     bolditalics: 'Helvetica-BoldOblique'
  //   },
  //   Times: {
  //     normal: 'Times-Roman',
  //     bold: 'Times-Bold',
  //     italics: 'Times-Italic',
  //     bolditalics: 'Times-BoldItalic'
  //   },
  //   Symbol: {
  //     normal: 'Symbol'
  //   },
  //   ZapfDingbats: {
  //     normal: 'ZapfDingbats'
  //   }
  // };

  var PdfPrinter = require('pdfmake/src/printer');
  var printer = new PdfPrinter(fonts);

  db.get().getConnection(function (err, connection) {
    connection.query(
      fullQuery, function (err, rows) {
        if (err) {
          throw err;
        }
        connection.release();

        if (err) {
          console.error(err);
          res.status(500).send(db.showDatabaseError(500, err));
        } else {

          var dataset = rows;

          var parameters = '';
          if (Array.isArray(rows) && (rows.length > 0)) {
            for (var ind = 0; ind < rows.length; ind++) {
              parameters += rows[ind].documentId + (ind < rows.length - 1 ? ', ' : '');
            }
            parameters = '(' + parameters + ')';
          }

          db.get().getConnection(function (err, connection) {
            var stringSQL =
              ' SELECT a.application_id AS documentId, a.name AS problemDescription' +
              ' FROM faults a' +
              ' WHERE a.application_id IN ';
            if (parameters.trim().length === 0) {
              parameters = '(-1)';
            }
            stringSQL += parameters;

            connection.query(
              stringSQL, [], function (err, rows) {
                connection.release();

                if (err) {
                  res.status(500).send(db.showDatabaseError(500, err));
                }
                else {

                  var header = 'Отчет по всем заявкам';
                  if (!add.conditions.period.allRecords) {
                    header = 'Отчет по заявкам с ' + moment(add.conditions.period.start).format('DD.MM.YYYY') + ' по ' + moment(add.conditions.period.end).format('DD.MM.YYYY');
                  }
                  var tableData = [];
                  tableData.push(
                    [
                      { text: '№', bold: true },
                      { text: 'Город и улица', bold: true },
                      { text: 'Дом', bold: true },
                      { text: 'Номера', bold: true },
                      { text: 'Телефон', bold: true },
                      { text: 'Проблемы', bold: true },
                      { text: 'Примечание', bold: true },
                    ]);

                  dataset.forEach(function (item, index) {

                    var problem = '';
                    rows.forEach(function (fault) {
                      if (+item.documentId === +fault.documentId) {
                        problem += (problem.length > 0 ? ', ' : '') + fault.problemDescription;
                      }
                    });


                    var isLineThrough = ((item.completionDate != null) && (item.weight >= 0));
                    tableData.push([
                      { text: index + 1, style: 'normalText' },
                      { text: item.cityName + ', ' + item.streetName, style: 'normalText' },
                      { text: item.houseNumber, style: 'normalText' },
                      { text: (+item.kind === 0 ? 'под. ' : 'кв. ') + item.porch, style: 'normalText' },
                      { text: item.phone, style: 'normalText' },
                      isLineThrough ? { text: problem, style: 'normalText', decoration: 'lineThrough' } : { text: problem, style: 'normalText' },
                      ''
                    ]);
                  });

                  var dd = {
                    pageSize: 'A4',
                    pageOrientation: 'landscape',
                    pageMargins: [40, 60, 40, 60],
                    content: [
                      {
                        alignment: 'justify',
                        layout: 'lightHorizontalLines', // optional
                        columns: [
                          {
                            text: header
                          },
                          {
                            text: 'Дата печати: ' + moment(new Date()).format('DD.MM.YYYY'), alignment: 'right'
                          }
                        ],
                      },
                      {
                        text: '\n\n'
                      },
                      {
                        table: {
                          headerRows: 1,
                          widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', '*'],
                          body: tableData
                        }
                      }
                    ],
                    defaultStyle: {
                      font: 'Roboto'
                    },
                    styles: {
                      header: {
                        fontSize: 18,
                        bold: true
                      },
                      normalText: {
                        fontSize: 11
                      }
                    }
                  };

                  var pdfDoc = printer.createPdfKitDocument(dd);
                  pdfDoc.pipe(res);
                  pdfDoc.end();



                  // doc.x = 50;

                  // doc.fontSize(14);
                  // doc.text('Текущие заявки', { align: 'center' });
                  // doc.moveDown();
                  // doc.moveDown();

                  // dataset.forEach(function (item) {
                  //   var list = [];

                  //   rows.forEach(function (fault) {
                  //     // FIXME: filter!!!!!
                  //     if (+item.documentId === +fault.documentId) {
                  //       list.push(fault.problemDescription);
                  //     }
                  //   });

                  //   doc.fontSize(14);
                  //   doc.text('Заявка от ' + item.createDate, { align: 'center' });
                  //   doc.moveDown();

                  //   doc.fontSize(12);
                  //   doc
                  //     .text('Адрес: ' + item.cityName + ',' + item.streetName + ', ' + item.houseNumber + (+item.kind === 0 ? ', подъезд ' : ', квартира ') + item.porch)
                  //     .text('Телефон: ' + item.phone)

                  //     .moveDown()
                  //     .text('Список неисправностей', { underline: true })
                  //     .list(list)
                  //     // .text('Всего неисправностей: ' + list.length)
                  //     // .moveDown()
                  //     // .text('Исполнитель: ' + item.performerName)
                  //     .moveDown()
                  //     .moveDown();
                  // });
                  // doc.pipe(res);
                  // doc.end();
                }
              });
          });
        }
      });
  });

};

var redirectToAccepted = function (res, uid) {
  db.get().getConnection(function (err, connection) {
    connection.query(
      ' UPDATE applications SET' +
      ' is_done = ?,' +
      ' close_date = NOW()' +
      ' WHERE application_id = ?', [1, uid], function (err) {

        connection.release();

        if (err) {
          res.status(500).send(db.showDatabaseError(500, err));
        }

        // res.redirect('/applications/completed');
        res.redirect('/applications');

      });
  });
};

var findRecords = function (req, res) {
  if ('downloadReport' in req.query) {
    // downloadReport(req, res);
    applicationsReport(req, res);
    return;
  }

  var countRecords = 0;
  var pageCount = 0;
  var unReleasedData = 0;

  var add = filterBuilder(req, false);

  var countRecordsQuery =
    ' SELECT COUNT(*) AS count, ' +
    ' COUNT(CASE WHEN a.worker_id = 0 THEN 1 END) AS unReleasedData' +
    ' FROM applications a WHERE (a.application_id > 0)' +
    ' AND (a.is_done = 0)' +
    ' AND (a.is_deleted = 0)' + add.whereSQL;

  var fullQuery =
    ' SELECT a.application_id AS documentId, a.create_date AS createDate, a.weight, ' +
    ' a.completion_date AS completionDate, b.name AS cityName, c.name AS streetName,' +
    ' d.number AS houseNumber, e.name AS performerName, e.worker_id AS performerId, ' +
    ' CASE ' +
    ' WHEN a.kind = 0 THEN CONCAT("под. ", a.porch)' +
    ' WHEN a.kind = 1 THEN CONCAT("кв. ", a.porch)' +
    ' END AS numeration, ' +
    ' a.close_date AS closeData, ' +
    ' (SELECT COUNT(*) FROM faults e WHERE e.application_id  = a.application_id) AS rowsInDoc ' +
    ' FROM applications a' +
    ' LEFT JOIN cities b ON b.city_id = a.city_id' +
    ' LEFT JOIN streets c ON c.street_id = a.street_id' +
    ' LEFT JOIN houses d ON d.house_id = a.house_id' +
    ' LEFT JOIN workers e ON e.worker_id = a.worker_id' +
    ' WHERE (a.application_id > 0)' +
    ' AND (a.is_done = 0)' +
    ' AND (a.is_deleted = 0)' + add.whereSQL +
    ' ORDER BY a.weight ASC, a.create_date ' + add.conditions.period.sortBy +
    ' LIMIT ' + visibleRows;


  db.get().getConnection(function (err, connection) {
    connection.query(
      countRecordsQuery, [], function (err, rows) {
        connection.release();
        countRecords = rows[0].count;
        unReleasedData = rows[0].unReleasedData;
        pageCount = (countRecords / visibleRows) < 1 ? 0 : Math.ceil(countRecords / visibleRows);

        db.get().getConnection(function (err, connection) {
          connection.query(
            fullQuery, [], function (err, rows) {
              connection.release();

              if (err) {
                res.status(500).send(db.showDatabaseError(500, err));
              } else {
                var currentPage = 1;

                var dataset = rows;
                for (var ind = 0; ind < dataset.length; ind++) {
                  dataset[ind].problemDescription = '';
                }

                var parameters = '';
                if (Array.isArray(rows) && (rows.length > 0)) {
                  for (ind = 0; ind < rows.length; ind++) {
                    parameters += rows[ind].documentId + (ind < rows.length - 1 ? ', ' : '');
                  }
                  parameters = '(' + parameters + ')';
                }

                db.get().getConnection(function (err, connection) {
                  var stringSQL =
                    ' SELECT a.application_id AS documentId, a.name AS problemDescription FROM faults a' +
                    ' WHERE a.application_id IN ';
                  if (parameters.trim().length === 0) {
                    parameters = '(-1)';
                  }
                  stringSQL += parameters;

                  connection.query(
                    stringSQL, [], function (err, rows) {
                      connection.release();

                      if (err) {
                        res.status(500).send(db.showDatabaseError(500, err));
                      }
                      else {
                        rows.forEach(function (item) {
                          for (var ind = 0; ind < dataset.length; ind++) {
                            if (dataset[ind].documentId === item.documentId) {
                              dataset[ind].problemDescription += (dataset[ind].problemDescription.trim().length > 0 ? ', ' : '') + item.problemDescription;
                              if (dataset[ind].problemDescription.length >= MAX_LENGTH) {
                                dataset[ind].problemDescription = utils.formatStringWithEllipses(dataset[ind].problemDescription, MAX_LENGTH);
                              }
                              break;
                            }
                          }
                        });
                        res.render('docs/applications.ejs', {
                          data: dataset,
                          pageCount: pageCount,
                          currentPage: currentPage,
                          visibleRows: visibleRows,
                          countRecords: countRecords,
                          unReleasedData: unReleasedData,
                          moment: moment,
                          filters: add.conditions,
                          user: req.session.userName
                        });
                      }
                    });
                });
              }
            });
        });
      });
  });
};

var findCompletedRecords = function (req, res) {

  if ('downloadDoneReport' in req.query) {
    downloadDoneReport(req, res);
    return;
  }

  var pageCount = 0;
  var countRecords = 0;

  var add = filterBuilder(req, true);

  var countRecordsQuery =
    ' SELECT COUNT(*) AS count' +
    ' FROM applications a WHERE (a.application_id > 0)' +
    ' AND (a.is_done = 1)' +
    ' AND (a.is_deleted = 0)' + add.whereSQL;

  var fullQuery =
    ' SELECT a.application_id AS documentId, a.create_date AS createDate, a.weight, ' +
    ' b.name AS cityName, c.name AS streetName,' +
    ' d.number AS houseNumber, e.name AS performerName, a.porch, a.kind, ' +
    ' CASE ' +
    ' WHEN a.kind = 0 THEN CONCAT("под. ", a.porch)' +
    ' WHEN a.kind = 1 THEN CONCAT("кв. ", a.porch)' +
    ' END AS numeration, ' +
    ' a.close_date AS closeDate, ' +
    ' (SELECT COUNT(*) FROM faults e WHERE e.application_id  = a.application_id) AS rowsInDoc,' +
    ' f.contract_number AS contractNumber, f.m_contract_number AS prolongedContractNumber,' +
    ' f.maintenance_contract AS maintenanceContract' +
    ' FROM applications a' +
    ' LEFT JOIN cities b ON b.city_id = a.city_id' +
    ' LEFT JOIN streets c ON c.street_id = a.street_id' +
    ' LEFT JOIN houses d ON d.house_id = a.house_id' +
    ' LEFT JOIN workers e ON e.worker_id = a.worker_id' +
    ' LEFT JOIN cards f ON f.card_id = a.card_id' +
    ' WHERE (a.application_id > 0)' +
    ' AND (a.is_done = 1)' +
    ' AND (a.is_deleted = 0)' + add.whereSQL +
    ' ORDER BY a.create_date DESC' +
    ' LIMIT ' + visibleRows;

  db.get().getConnection(function (err, connection) {
    connection.query(countRecordsQuery, [], function (err, rows) {
      connection.release();
      countRecords = rows[0].count;
      pageCount =
        (countRecords / visibleRows) < 1 ? 0 : Math.ceil(countRecords / visibleRows);

      db.get().getConnection(function (err, connection) {
        connection.query(fullQuery, [], function (err, rows) {
          if (err) {
            throw err;
          }
          connection.release();

          if (err) {
            console.error(err);
            res.status(500).send(db.showDatabaseError(500, err));
          } else {
            var currentPage = 1;

            var dataset = rows;
            for (var ind = 0; ind < dataset.length; ind++) {
              dataset[ind].problemDescription = '';
            }

            var parameters = '';
            if (Array.isArray(rows) && (rows.length > 0)) {
              for (ind = 0; ind < rows.length; ind++) {
                parameters += rows[ind].documentId + (ind < rows.length - 1 ? ', ' : '');
              }
              parameters = '(' + parameters + ')';
            }

            db.get().getConnection(function (err, connection) {
              var stringSQL =
                ' SELECT a.application_id AS documentId, a.name AS problemDescription' +
                ' FROM faults a' +
                ' WHERE a.application_id IN ';
              if (parameters.trim().length === 0) {
                parameters = '(-1)';
              }
              stringSQL += parameters;

              connection.query(
                stringSQL, [], function (err, rows) {
                  connection.release();

                  if (err) {
                    res.status(500).send(db.showDatabaseError(500, err));
                  }
                  else {
                    rows.forEach(function (item) {
                      for (var ind = 0; ind < dataset.length; ind++) {
                        if (dataset[ind].documentId === item.documentId) {
                          dataset[ind].problemDescription += (dataset[ind].problemDescription.trim().length > 0 ? ', ' : '') + item.problemDescription;
                          if (dataset[ind].problemDescription.length >= MAX_LENGTH) {
                            dataset[ind].problemDescription = utils.formatStringWithEllipses(dataset[ind].problemDescription, MAX_LENGTH);
                          }
                          break;
                        }
                      }
                    });

                    res.render('docs/done_applications.ejs', {
                      data: dataset,
                      pageCount: pageCount,
                      currentPage: currentPage,
                      visibleRows: visibleRows,
                      countRecords: countRecords,
                      moment: moment,
                      filters: add.conditions,
                      user: req.session.userName
                    });
                  }
                });
            });
          }
        });
      });
    });
  });
};

module.exports = function () {
  var router = express.Router();

  router.get('/', function (req, res) {
    findRecords(req, res);
  });

  router.get('/edit/:id', function (req, res) {
    var id = req.params.id;
    var applicationModel = new ApplicationModel();

    db.get().getConnection(function (err, connection) {
      // Load table
      connection.query(
        ' SELECT a.fault_id AS id, a.name AS faultName, a.decision, a.worker_id AS workerId,' +
        ' a.is_done AS isDone, a.completion_dt AS completionDT,' +
        ' b.name AS workerName' +
        ' FROM faults a' +
        ' LEFT JOIN workers b ON b.worker_id = a.worker_id' +
        ' WHERE a.application_id = ?', [id], function (err, rows) {
          connection.release();

          if (err) {
            console.error(err);
            res.status(500).send(db.showDatabaseError(500, err));
          } else {

            if ((rows !== undefined) && (rows.length > 0)) {
              applicationModel.faults = rows;
              applicationModel.faults.forEach(function (item) {
                item.faultName = item.faultName.replace(/\"/g, '\\\"');
              });
            }

            // Load Main form
            db.get().getConnection(function (err, connection) {
              connection.query(
                ' SELECT a.application_id AS id, a.is_done AS isDone, a.create_date AS createDate,' +
                ' a.completion_date AS completionDate, b.name AS cityName, c.name AS streetName,' +
                ' d.number AS houseNumber, a.porch, a.kind, a.phone,' +
                ' e.name AS performerName,' +
                ' b.city_id AS cityId, c.street_id AS streetId, d.house_id AS houseId,' +
                ' e.worker_id AS performerId,' +
                ' a.is_done AS isDone, a.close_date AS closeDate,' +
                ' a.card_id AS cardId,' +
                ' (SELECT g.contract_number FROM cards g WHERE g.card_id = a.card_id) AS contractNumber,' +
                ' (SELECT h.m_contract_number FROM cards h WHERE h.card_id = a.card_id) AS prolongedContractNumber,' +
                ' (SELECT i.maintenance_contract FROM cards i WHERE i.card_id = a.card_id) AS maintenanceContract' +
                ' FROM applications a' +
                ' LEFT JOIN cities b ON b.city_id = a.city_id' +
                ' LEFT JOIN streets c ON c.street_id = a.street_id' +
                ' LEFT JOIN houses d ON d.house_id = a.house_id' +
                ' LEFT JOIN workers e ON e.worker_id = a.worker_id' +
                ' WHERE (a.application_id = ?)' +
                ' LIMIT 1', [id], function (err, rows) {
                  connection.release();

                  if (err) {
                    console.error(err);
                    res.status(500).send(db.showDatabaseError(500, err));
                  } else {

                    applicationModel.id = rows[0].id;
                    applicationModel.createDate = rows[0].createDate;
                    applicationModel.completionDate = rows[0].completionDate;
                    applicationModel.closeDate = rows[0].closeDate;

                    applicationModel.address.city.id = rows[0].cityId;
                    applicationModel.address.street.id = rows[0].streetId;
                    applicationModel.address.house.id = rows[0].houseId;
                    applicationModel.address.city.name = rows[0].cityName;
                    applicationModel.address.street.name = rows[0].streetName
                    applicationModel.address.house.number = rows[0].houseNumber;

                    applicationModel.address.number = rows[0].porch;
                    applicationModel.address.kind = rows[0].kind;

                    if (applicationModel.address.city.id > 0) {
                      applicationModel.address.full = applicationModel.address.city.name.trim();
                      if (applicationModel.address.street.id > 0) {
                        applicationModel.address.full += ', ' + applicationModel.address.street.name.trim();
                        if (applicationModel.address.house.id > 0) {
                          applicationModel.address.full += ', ' + applicationModel.address.house.number.trim();
                        }
                      }
                    }

                    applicationModel.phone = rows[0].phone;
                    applicationModel.performer.id = rows[0].performerId;
                    applicationModel.performer.name = rows[0].performerName;

                    applicationModel.order.id = rows[0].cardId;
                    applicationModel.order.contractNumber = rows[0].contractNumber;
                    applicationModel.order.prolongedContractNumber = rows[0].prolongedContractNumber;
                    applicationModel.order.maintenanceContract = rows[0].maintenanceContract;

                    applicationModel.isDone = rows[0].isDone;

                    // data.documentId = rows[0].documentId;
                    // data.cityId = rows[0].cityId;
                    // data.streetId = rows[0].streetId;
                    // data.houseId = rows[0].houseId;
                    // data.performerId = rows[0].performerId;

                    // data.createDate = rows[0].createDate;
                    // data.completionDate = rows[0].completionDate;
                    // data.porch = rows[0].porch;
                    // data.kind = rows[0].kind;
                    // data.phone = rows[0].phone;
                    // data.performer = rows[0].performer;
                    // data.isDone = rows[0].isDone;
                    // data.closeDate = rows[0].closeDate;
                    // data.cardId = rows[0].cardId;
                    // data.contractNumber = rows[0].contractNumber;
                    // data.mContractNumber = rows[0].mContractNumber;
                    // data.maintenanceContract = rows[0].maintenanceContract;
                    // data.closeDate = rows[0].closeDate;

                    // data.address = '';
                    // if (rows[0].cityId > 0) {
                    //   data.address = rows[0].cityName.trim();
                    //   if (rows[0].streetId > 0) {
                    //     data.address += ', ' + rows[0].streetName;
                    //     if (rows[0].houseId > 0) {
                    //       data.address += ', ' + rows[0].houseNumber;
                    //     }
                    //   }
                    // }

                    res.render('docs/forms/application.ejs', {
                      data: applicationModel,
                      moment: moment,
                      errors: {},
                      user: req.session.userName
                    });
                  }
                }
              );
            });
          }
        });
    });
  });

  router.get('/edit_done', function (req, res) {
    res.render('docs/forms/done_application.ejs', { user: req.session.userName });
  });

  router.get('/add', function (req, res) {
    var applicationModel = new ApplicationModel();
    applicationModel.createDate = new Date();
    res.render(
      'docs/forms/application.ejs',
      {
        data: applicationModel,
        moment: moment,
        errors: {},
        user: req.session.userName
      }
    );
  });

  router.get('/filter', function (req, res) {
    findRecords(req, res);
  });

  router.get('/completed', function (req, res) {
    findCompletedRecords(req, res);
  });

  router.get('/done_filter', function (req, res) {
    findCompletedRecords(req, res);
  });

  router.post('/save', function (req, res) {

    // var tableFaults = [];

    if (req.body.generateReport) {
      generateReport(req, res);
      return;
    }

    if ('move' in req.body) {
      res.redirect('/applications');
      return;
    }

    var applicationModel = new ApplicationModel();
    applicationModel.id = Number(req.body.documentId);
    applicationModel.createDate = ((req.body.createDate != null) && (req.body.createDate.trim().length > 0)) ? moment(req.body.createDate, 'DD.MM.YYYY HH:mm').format('YYYY-MM-DD HH:mm') : null;
    applicationModel.completionDate = ((req.body.completionDate != null) && (req.body.completionDate.trim().length > 0)) ? moment(req.body.completionDate, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;
    applicationModel.address.city.id = Number(req.body.cityId);
    applicationModel.address.street.id = Number(req.body.streetId);
    applicationModel.address.house.id = Number(req.body.houseId);
    applicationModel.address.full = req.body.address;
    applicationModel.address.number = req.body.porch;
    applicationModel.address.kind = Number(req.body.kind);
    applicationModel.phone = req.body.phone;
    applicationModel.performer.id = Number(req.body.performerId);
    applicationModel.performer.name = req.body.performer;
    applicationModel.order.id = Number(req.body.cardId);
    applicationModel.isDone = Number(req.body.isDone);

    try {
      applicationModel.faults = JSON.parse(req.body.faults);
    }
    catch (error) {
      console.log(error);
    }

    req.assert('createDate', 'Дата создания не заполнена').notEmpty();
    req.assert('address', 'Адрес не заполнен').custom(function (data) {
      return (applicationModel.address.city.id > 0) && (applicationModel.address.street.id > 0) && (applicationModel.address.house.id > 0);
    });
    req.assert('porch', 'Номер подъезда или квартиры не заполнен').isNumeric();
    req.assert('faults', 'Не указана(ы) неисправность(и)').custom(function (data) {
      var result = false
      if ((typeof applicationModel.faults === 'object') && (Array.isArray(applicationModel.faults))) {
        result = applicationModel.faults.length > 0;
      }
      return result;
    });

    var errors = req.validationErrors();
    if (!errors) {
      // Запись в БД
      // var workerId = Number(req.body.performerId);
      // if (workerId.trim() === '') {
      //   workerId = 0;
      // }
      // var weight = 0;
      // if (workerId > 0) {
      //   weight = 2;
      // }

      if (applicationModel.performer.id > 0) {
        // weight = 2;
        applicationModel.weight = 2;
      }

      // if (checkCompletionDate.outputDate().length > 0) {
      //   var dt = moment(checkCompletionDate.outputDate()).startOf('day');
      //   var now = moment(new Date()).startOf('day');
      //   var offset = dt - now;
      //   if (offset <= 0) {
      //     weight = -1;
      //   }
      // }
      if (applicationModel.completionDate != null) {
        var dt = moment(applicationModel.completionDate).startOf('day');
        var now = moment(new Date()).startOf('day');
        var offset = dt - now;
        if (offset <= 0) {
          // weight = -1;
          applicationModel.weight = -1;
        }
      }

      if (applicationModel.id > 0) {

        // var isDone = +req.body.isDone;
        if ('move' in req.body) {
          applicationModel.isDone = 0;
        }

        db.get().getConnection(function (err, connection) {
          connection.query('DELETE FROM faults WHERE application_id = ?', [applicationModel.id], function () {

            connection.release();

            db.get().getConnection(function (err, connection) {
              connection.query(
                ' UPDATE applications SET' +
                ' create_date = ?,' +
                ' completion_date = ?,' +
                ' city_id = ?,' +
                ' street_id = ?,' +
                ' house_id = ?,' +
                ' porch = ?,' +
                ' kind = ?,' +
                ' phone = ?,' +
                ' worker_id = ?,' +
                ' is_done = ?,' +
                ' card_id = ?,' +
                ' weight = ?' +
                ' WHERE application_id = ?', [
                applicationModel.createDate,
                applicationModel.completionDate,
                applicationModel.address.city.id,
                applicationModel.address.street.id,
                applicationModel.address.house.id,
                applicationModel.address.number,
                applicationModel.address.kind,
                applicationModel.phone,
                applicationModel.performer.id,
                applicationModel.isDone,
                applicationModel.order.id,
                applicationModel.weight,
                applicationModel.id
              ], function (err) {
                connection.release();
                if (err) {
                  res.status(500).send(db.showDatabaseError(500, err));
                } else {
                  saveTable(applicationModel.id, applicationModel.faults, function (isAccepted) {
                    if (isAccepted) {
                      redirectToAccepted(res, applicationModel.id);
                    }
                    else {
                      res.redirect('/applications');
                    }
                  });
                }
              });
            });
          });
        });
      }
      else {
        db.get().getConnection(function (err, connection) {
          connection.query(
            ' INSERT INTO applications (create_date, completion_date, city_id, street_id, house_id, porch, kind, phone, worker_id, card_id, weight)' +
            ' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
            applicationModel.createDate,
            applicationModel.completionDate,
            applicationModel.address.city.id,
            applicationModel.address.street.id,
            applicationModel.address.house.id,
            applicationModel.address.number,
            applicationModel.address.kind,
            applicationModel.phone,
            applicationModel.performer.id,
            applicationModel.order.id,
            applicationModel.weight
          ], function (err, rows) {
            connection.release();
            if (err) {
              res.status(500).send(db.showDatabaseError(500, err));
            } else {
              saveTable(rows.insertId, applicationModel.faults, function (isAccepted) {
                if (isAccepted) {
                  redirectToAccepted(res, rows.insertId);
                }
                else {
                  res.redirect('/applications');
                }
              });
            }
          }
          );
        });
      }
    }
    else {
      res.render(
        'docs/forms/application.ejs',
        {
          moment: moment,
          data: applicationModel,
          errors: errors,
          user: req.session.userName
        }
      );
    }
  });

  router.post('/find_city', function (req, res) {
    var data = req.body;
    if ((data) && (typeof (data) === 'object') && ('cityName' in data)) {
      var rowsCount = 'limit' in data ? data.limit : rowsLimit;
      var params = {
        cityName: data.cityName,
        rowsCount: rowsCount
      };
      common.filterCities(params, function (err, rows) {
        res.status(200).send(rows);
      });
    }
    else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  router.post('/find_street', function (req, res) {
    var data = req.body;
    if ((data) && (typeof (data) === 'object') && ('streetName' in data) && ('cityId' in data)) {
      var rowsCount = 'limit' in data ? data.limit : rowsLimit;
      var params = {
        cityId: data.cityId,
        streetName: data.streetName,
        rowsCount: rowsCount
      };
      common.filterStreets(params, function (err, rows) {
        res.status(200).send(rows);
      });
    }
    else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  router.post('/find_house', function (req, res) {
    var data = req.body;
    if ((data) && (typeof (data) === 'object') && ('houseNumber' in data) && ('streetId' in data)) {
      var rowsCount = 'limit' in data ? data.limit : rowsLimit;
      var params = {
        streetId: data.streetId,
        houseNumber: data.houseNumber,
        rowsCount: rowsCount
      };
      common.filterHouses(params, function (err, rows) {
        res.status(200).send(rows);
      });
    }
    else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  router.post('/find_porch', function (req, res) {
    var data = req.body;
    if ((data) && (typeof (data) === 'object') && ('porch' in data) && ('houseId' in data)) {
      var rowsCount = 'limit' in data ? data.limit : rowsLimit;
      var params = {
        houseId: data.houseId,
        porch: data.porch,
        rowsCount: rowsCount
      };
      common.filterPorches(params, function (err, rows) {
        res.status(200).send(rows);
      });
    }
    else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  router.post('/find_performer', function (req, res) {
    var data = req.body;
    if ((data) && (typeof (data) === 'object') && ('performerName' in data)) {
      var rowsCount = 'limit' in data ? data.limit : rowsLimit;
      var params = {
        performerName: data.performerName,
        rowsCount: rowsCount
      };
      common.filterPerformers(params, function (err, rows) {
        res.status(200).send(rows);
      });
    }
    else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  // router.post('/search_city', function (req, res) {
  //   var data = req.body;
  //   var suggestion = '';
  //   if ((data) && (typeof (data) === 'object') && ('suggestion' in data)) {
  //     suggestion = data.suggestion.trim();

  //     var queryText =
  //       ' SELECT a.city_id AS id, a.name AS value' +
  //       ' FROM cities a';
  //     if (suggestion.length > 0) {
  //       queryText += ' WHERE a.name LIKE ' + `'` + suggestion + '%' + `'`;
  //     }
  //     queryText += ' ORDER BY a.name ASC';
  //     queryText += ' LIMIT ' + ('limit' in data ? data.limit : rowsLimit);

  //     db.get().getConnection(function (err, connection) {
  //       connection.query(
  //         queryText, [], function (err, rows) {
  //           connection.release();

  //           if (err) {
  //             res.status(res.status(500).send(db.showDatabaseError(500, err)));
  //           } else {
  //             res.status(200).send(rows);
  //           }
  //         }
  //       );
  //     });
  //   }
  //   else {
  //     res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
  //   }
  // });

  // router.post('/search_street', function (req, res) {
  //   var isWhere = false;
  //   var data = req.body;
  //   var suggestion = '';
  //   if ((data) && (typeof (data) === 'object') && ('suggestion' in data)) {
  //     suggestion = data.suggestion.trim();

  //     var queryText =
  //       ' SELECT a.street_id AS id, a.name AS value' +
  //       ' FROM streets a';

  //     if ('cityId' in data) {
  //       isWhere = true;
  //       queryText += ' WHERE (a.city_id = ' + data.cityId + ')';
  //     }
  //     if (suggestion.length > 0) {
  //       queryText += isWhere ? ' AND ' : ' WHERE';
  //       queryText += ' (a.name LIKE ' + `'` + suggestion + '%' + `'` + ')';
  //     }
  //     queryText += ' ORDER BY a.name ASC';
  //     queryText += ' LIMIT ' + ('limit' in data ? data.limit : rowsLimit);

  //     db.get().getConnection(function (err, connection) {
  //       connection.query(
  //         queryText, [], function (err, rows) {
  //           connection.release();

  //           if (err) {
  //             res.status(res.status(500).send(db.showDatabaseError(500, err)));
  //           } else {
  //             res.status(200).send(rows);
  //           }
  //         }
  //       );
  //     });
  //   }
  //   else {
  //     res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
  //   }
  // });

  // router.post('/search_house', function (req, res) {
  //   var isWhere = false;
  //   var data = req.body;
  //   var suggestion = '';
  //   if ((data) && (typeof (data) === 'object') && ('suggestion' in data)) {
  //     suggestion = data.suggestion.trim();

  //     var queryText =
  //       ' SELECT a.house_id AS id, a.number AS value' +
  //       ' FROM houses a';

  //     if ('streetId' in data) {
  //       isWhere = true;
  //       queryText += ' WHERE (a.street_id = ' + data.streetId + ')';
  //     }
  //     if (suggestion.length > 0) {
  //       queryText += isWhere ? ' AND ' : ' WHERE';
  //       queryText += ' (a.number LIKE ' + `'` + suggestion + '%' + `'` + ')';
  //     }
  //     queryText += ' ORDER BY a.number ASC';
  //     queryText += ' LIMIT ' + ('limit' in data ? data.limit : rowsLimit);

  //     db.get().getConnection(function (err, connection) {
  //       connection.query(
  //         queryText, [], function (err, rows) {
  //           connection.release();

  //           if (err) {
  //             res.status(500).send(db.showDatabaseError(500, err));
  //           } else {
  //             res.status(200).send(rows);
  //           }
  //         }
  //       );
  //     });
  //   }
  //   else {
  //     res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
  //   }
  // });


  // router.post('/search_performer', function (req, res) {
  //   var data = req.body;
  //   var suggestion = '';
  //   if ((data) && (typeof (data) === 'object') && ('suggestion' in data)) {
  //     suggestion = data.suggestion.trim();

  //     var queryText =
  //       ' SELECT a.worker_id AS id, a.name AS value' +
  //       ' FROM workers a';
  //     if (suggestion.length > 0) {
  //       queryText += ' WHERE a.name LIKE ' + `'` + suggestion + '%' + `'`;
  //     }
  //     queryText += ' ORDER BY a.name ASC';
  //     queryText += ' LIMIT ' + ('limit' in data ? data.limit : rowsLimit);

  //     db.get().getConnection(function (err, connection) {
  //       connection.query(
  //         queryText, [], function (err, rows) {
  //           connection.release();

  //           if (err) {
  //             res.status(500).send(db.showDatabaseError(500, err));
  //           } else {
  //             res.status(200).send(rows);
  //           }
  //         }
  //       );
  //     });
  //   }
  //   else {
  //     res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
  //   }
  // });

  router.post('/find_fault', function (req, res) {
    var data = req.body;
    var suggestion = '';
    if ((data) && (typeof (data) === 'object') && ('suggestion' in data)) {
      suggestion = data.suggestion.trim();

      var queryText =
        ' SELECT a.template_id AS id, a.name AS value' +
        ' FROM templates a' +
        ' WHERE (a.template_id > 0)';
      if (suggestion.length > 0) {
        queryText += ' AND (a.name LIKE ' + `'` + '%' + suggestion + '%' + `'` + ')';
      }
      queryText += ' ORDER BY a.name ASC';
      queryText += ' LIMIT ' + ('limit' in data ? data.limit : rowsLimit);

      db.get().getConnection(function (err, connection) {
        connection.query(
          queryText, [], function (err, rows) {
            connection.release();

            if (err) {
              res.status(500).send(db.showDatabaseError(500, err));
            } else {
              res.status(200).send(rows);
            }
          }
        );
      });
    }
    else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });


  router.post('/address_autocomplete', function (req, res) {
    var data = req.body;
    var suggestion = '';
    if ((data) && (typeof (data) === 'object') && ('suggestion' in data)) {
      suggestion = data.suggestion.trim();

      var words = suggestion.split(', ');
      if (!Array.isArray(words)) {
        return;
      }

      var outputData = {};
      var queryText = '';
      var items = [];

      // Only cit(ies)y
      if (words.length === 1) {
        queryText =
          ' SELECT a.city_id, a.name AS city_name' +
          ' FROM cities a';

        if (words[0].trim().length > 0) {
          queryText += ' WHERE a.name LIKE ' + `'` + words[0].trim() + '%' + `'`;
        }
        queryText += ' ORDER BY a.name ASC';
        queryText += ' LIMIT ' + ('limit' in data ? data.limit : rowsLimit);

        db.get().getConnection(function (err, connection) {
          connection.query(
            queryText, [], function (err, rows) {
              connection.release();

              if (err) {
                res.status(500).send(db.showDatabaseError(500, err));
              } else {
                if (Array.isArray(rows)) {
                  rows.forEach(function (item) {
                    items.push({
                      cityId: item.city_id,
                      cityName: item.city_name
                    });
                  });
                }

                outputData.level = 0;
                outputData.items = items;
                res.status(200).send(outputData);
              }
            }
          );
        });
      }
      else if (words.length >= 2) {
        var cityId = 0;
        getCity(words[0].trim(), function (id) {
          if (id === null) {
            items.push({
              cityId: 0,
              cityName: 'Нет данных'
            });
            outputData.level = 0;
            outputData.items = items;
            res.status(200).send(outputData);
            return;
          }
          cityId = id;
          getStreets(cityId, words[1], rowsLimit, function (streets) {
            if (words.length === 2) {
              if (Array.isArray(streets)) {
                streets.forEach(function (item) {
                  items.push({
                    cityId: cityId,
                    cityName: words[0].trim(),
                    streetId: item.streetId,
                    streetName: item.streetName
                  });
                });
              }

              outputData.level = 1;
              outputData.items = items;
              res.status(200).send(outputData);
            }
            if (words.length === 3) {
              getHouses(cityId, words[1], words[2], rowsLimit, function (houses) {
                if (Array.isArray(houses)) {
                  houses.forEach(function (item) {
                    items.push({
                      cityId: cityId,
                      cityName: words[0].trim(),
                      streetId: item.street_id,
                      streetName: words[1].trim(),
                      houseId: item.house_id,
                      houseNumber: item.house_number
                    });
                  });
                }

                outputData.level = 2;
                outputData.items = items;
                res.status(200).send(outputData);
              });
            }
          });
        });
      }
      else {
        res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
      }
    }

  });

  router.post('/order_info', function (req, res) {

    var queryText = queryGetCard(+req.body.kind, +req.body.houseId, +req.body.porch);

    db.get().getConnection(function (err, connection) {
      connection.query(
        queryText, [], function (err, rows) {
          connection.release();

          if (err) {
            res.status(500).send(db.showDatabaseError(500, err));
          } else {
            res.status(200).send(rows);
          }
        });
    });
  });

  router.get('/:offset', function (req, res) {
    var offset = +req.params.offset;
    var countRecords = 0;
    var pageCount = 0;
    var unReleasedData = 0;

    var add = filterBuilder(req, false);

    var countRecordsQuery =
      ' SELECT COUNT(*) AS count, ' +
      ' COUNT(CASE WHEN a.worker_id = 0 THEN 1 END) AS unReleasedData' +
      ' FROM applications a WHERE (a.application_id > 0)' +
      ' AND (a.is_done = 0)' +
      ' AND (a.is_deleted = 0)' + add.whereSQL;

    var fullQuery =
      ' SELECT a.application_id AS documentId, a.create_date AS createDate, a.weight, ' +
      ' a.completion_date AS completionDate, b.name AS cityName, c.name AS streetName,' +
      ' d.number AS houseNumber, e.name AS performerName,  e.worker_id AS performerId, ' +
      ' CASE ' +
      ' WHEN a.kind = 0 THEN CONCAT("под. ", a.porch)' +
      ' WHEN a.kind = 1 THEN CONCAT("кв. ", a.porch)' +
      ' END AS numeration, ' +
      ' a.close_date AS closeData, ' +
      ' (SELECT COUNT(*) FROM faults e WHERE e.application_id  = a.application_id) AS rowsInDoc ' +
      ' FROM applications a' +
      ' LEFT JOIN cities b ON b.city_id = a.city_id' +
      ' LEFT JOIN streets c ON c.street_id = a.street_id' +
      ' LEFT JOIN houses d ON d.house_id = a.house_id' +
      ' LEFT JOIN workers e ON e.worker_id = a.worker_id' +
      ' WHERE (a.application_id > 0)' +
      ' AND (a.is_done = 0)' +
      ' AND (a.is_deleted = 0)' + add.whereSQL +
      ' ORDER BY a.weight ASC, a.create_date ' + add.conditions.period.sortBy +
      ' LIMIT ' + visibleRows +
      ' OFFSET ' + offset;

    db.get().getConnection(function (err, connection) {
      connection.query(
        countRecordsQuery, [], function (err, rows) {
          connection.release();
          countRecords = rows[0].count;
          unReleasedData = rows[0].unReleasedData;
          pageCount =
            (countRecords / visibleRows) < 1 ? 0 : Math.ceil(countRecords / visibleRows);
          if ((offset > pageCount * visibleRows)) {
            offset = (pageCount - 1) * visibleRows;
          }

          db.get().getConnection(function (err, connection) {
            connection.query(
              fullQuery, [], function (err, rows) {
                connection.release();

                if (err) {
                  res.status(500).send(db.showDatabaseError(500, err));
                } else {
                  var currentPage = Math.ceil(offset / visibleRows) + 1;
                  var dataset = rows;
                  for (var ind = 0; ind < dataset.length; ind++) {
                    dataset[ind].problemDescription = '';
                  }

                  var parameters = '';
                  if (Array.isArray(rows) && (rows.length > 0)) {
                    for (ind = 0; ind < rows.length; ind++) {
                      parameters += rows[ind].documentId + (ind < rows.length - 1 ? ', ' : '');
                    }
                    parameters = '(' + parameters + ')';
                  }

                  db.get().getConnection(function (err, connection) {
                    var stringSQL =
                      ' SELECT a.application_id AS documentId, a.name AS problemDescription FROM faults a' +
                      ' WHERE a.application_id IN ';
                    if (parameters.trim().length === 0) {
                      parameters = '(-1)';
                    }
                    stringSQL += parameters;

                    connection.query(
                      stringSQL, [], function (err, rows) {
                        connection.release();

                        if (err) {
                          res.status(500).send(db.showDatabaseError(500, err));
                        }
                        else {
                          rows.forEach(function (item) {
                            for (var ind = 0; ind < dataset.length; ind++) {
                              if (dataset[ind].documentId === item.documentId) {
                                dataset[ind].problemDescription += (dataset[ind].problemDescription.trim().length > 0 ? ', ' : '') + item.problemDescription;
                                if (dataset[ind].problemDescription.length >= MAX_LENGTH) {
                                  dataset[ind].problemDescription = utils.formatStringWithEllipses(dataset[ind].problemDescription, MAX_LENGTH);
                                }
                                break;
                              }
                            }
                          });
                          res.render('docs/applications.ejs', {
                            data: dataset,
                            pageCount: pageCount,
                            currentPage: currentPage,
                            visibleRows: visibleRows,
                            countRecords: countRecords,
                            unReleasedData: unReleasedData,
                            moment: moment,
                            filters: add.conditions,
                            user: req.session.userName
                          });
                        }
                      });
                  });
                }
              });
          });
        });
    });
  });

  router.get('/completed/:offset', function (req, res) {
    var offset = +req.params.offset;
    var pageCount = 0;
    var countRecords = 0;

    var add = filterBuilder(req, true);

    var countRecordsQuery =
      ' SELECT COUNT(*) AS count' +
      ' FROM applications a WHERE (a.application_id > 0)' +
      ' AND (a.is_done = 1)' +
      ' AND (a.is_deleted = 0)' + add.whereSQL;

    var fullQuery =
      ' SELECT a.application_id AS documentId, a.create_date AS createDate, a.weight, ' +
      ' b.name AS cityName, c.name AS streetName,' +
      ' d.number AS houseNumber, e.name AS performerName,' +
      ' CASE ' +
      ' WHEN a.kind = 0 THEN CONCAT("под. ", a.porch)' +
      ' WHEN a.kind = 1 THEN CONCAT("кв. ", a.porch)' +
      ' END AS numeration, ' +
      ' a.close_date AS closeDate, ' +
      ' (SELECT COUNT(*) FROM faults e WHERE e.application_id  = a.application_id) AS rowsInDoc,' +
      ' f.contract_number AS contractNumber, f.m_contract_number AS prolongedContractNumber,' +
      ' f.maintenance_contract AS maintenanceContract' +
      ' FROM applications a' +
      ' LEFT JOIN cities b ON b.city_id = a.city_id' +
      ' LEFT JOIN streets c ON c.street_id = a.street_id' +
      ' LEFT JOIN houses d ON d.house_id = a.house_id' +
      ' LEFT JOIN workers e ON e.worker_id = a.worker_id' +
      ' LEFT JOIN cards f ON f.card_id = a.card_id' +
      ' WHERE (a.application_id > 0)' +
      ' AND (a.is_done = 1)' +
      ' AND (a.is_deleted = 0)' + add.whereSQL +
      ' ORDER BY a.create_date DESC' +
      ' LIMIT ' + visibleRows +
      ' OFFSET ' + offset;

    db.get().getConnection(function (err, connection) {
      connection.query(
        countRecordsQuery, [], function (err, rows) {
          connection.release();
          countRecords = rows[0].count;
          pageCount =
            (countRecords / visibleRows) < 1 ? 0 : Math.ceil(countRecords / visibleRows);
          if ((offset > pageCount * visibleRows)) {
            offset = (pageCount - 1) * visibleRows;
          }

          db.get().getConnection(function (err, connection) {
            connection.query(
              fullQuery, [visibleRows, offset], function (err, rows) {
                connection.release();

                if (err) {
                  res.status(500).send(db.showDatabaseError(500, err));
                } else {
                  var currentPage = Math.ceil(offset / visibleRows) + 1;
                  var dataset = rows;
                  for (var ind = 0; ind < dataset.length; ind++) {
                    dataset[ind].problemDescription = '';
                  }

                  var parameters = '';
                  if (Array.isArray(rows) && (rows.length > 0)) {
                    for (ind = 0; ind < rows.length; ind++) {
                      parameters += rows[ind].documentId + (ind < rows.length - 1 ? ', ' : '');
                    }
                    parameters = '(' + parameters + ')';
                  }

                  db.get().getConnection(function (err, connection) {
                    var stringSQL =
                      ' SELECT a.application_id AS documentId, a.name AS problemDescription FROM faults a' +
                      ' WHERE a.application_id IN ';
                    if (parameters.trim().length === 0) {
                      parameters = '(-1)';
                    }
                    stringSQL += parameters;

                    connection.query(
                      stringSQL, [], function (err, rows) {
                        connection.release();

                        if (err) {
                          res.status(500).send(db.showDatabaseError(500, err));
                        }
                        else {
                          console.log(rows);
                          rows.forEach(function (item) {
                            for (var ind = 0; ind < dataset.length; ind++) {
                              if (dataset[ind].documentId === item.documentId) {
                                dataset[ind].problemDescription += (dataset[ind].problemDescription.trim().length > 0 ? ', ' : '') + item.problemDescription;
                                if (dataset[ind].problemDescription.length >= MAX_LENGTH) {
                                  dataset[ind].problemDescription = utils.formatStringWithEllipses(dataset[ind].problemDescription, MAX_LENGTH);
                                }
                                break;
                              }
                            }
                          });
                          res.render('docs/done_applications.ejs', {
                            data: dataset,
                            pageCount: pageCount,
                            currentPage: currentPage,
                            visibleRows: visibleRows,
                            countRecords: countRecords,
                            moment: moment,
                            filters: add.conditions,
                            user: req.session.userName
                          });
                        }
                      });
                  });
                }
              });
          });
        });
    });
  });

  router.post('/delete', function (req, res) {
    if ((req.body.id) && (isFinite(+req.body.id))) {
      db.get().getConnection(function (err, connection) {
        connection.query(
          ' UPDATE applications SET' +
          ' is_deleted = ?' +
          ' WHERE application_id = ?', [1, +req.body.id], function (err) {
            connection.release();
            if (err) {
              res.status(500).send(db.showDatabaseError(500, err));
            } else {
              res.status(200).send(
                {
                  result: 'OK'
                });
            }
          }
        );
      });
    }
    else {
      res.status(500).send(
        {
          code: 500,
          msg: 'Incorrect parameter'
        });
    }
  });

  return router;
};
