'use strict';

const express = require('express');
const { body } = require('express-validator/check');
var db = require('../../../lib/db.js');

function insertApplicationsTable(data, workerId) {
  return new Promise((resolve, reject) => {

    let queryText = [];
    data.forEach((item) => {

      if (item.table.length > 0) {
        item.table.forEach((value) => {
          queryText.push(
            `UPDATE faults SET decision = '${value.decision}', worker_id = ${workerId}, completion_dt = '${value.completion}', is_done = 1 WHERE fault_id = ${value.rowId};`
          )
        });
      }
    });

    db.get().getConnection(function (err, connection) {
      connection.query(
        queryText.join(''), [],
        function (err) {
          connection.release();
          if (err) {
            reject();
          }
          else {
            resolve();
          }
        });
    });

  });
}

function insertApplicationsHeader(data, workerId) {
  return new Promise((resolve, reject) => {

    let queryText = [];
    data.forEach((item) => {
        queryText.push(
          `UPDATE applications SET worker_id = ${workerId}, is_done = ${item.isDone}, close_date = NOW(), work_with_mobile_app = 1 WHERE application_id = ${item.documentId};`
        )
    });

    db.get().getConnection(function (err, connection) {
      connection.query(
        queryText.join(''), [],
        function (err) {
          connection.release();
          if (err) {
            reject();
          }
          else {
            resolve();
          }
        });
    });

  });
}

function getCurrentApplicationsHeader(workerId) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(`
        SELECT a.application_id AS documentId, DATE_FORMAT(a.create_date, '%Y-%m-%d %H:%i:%s') AS createDate,
        a.phone, b.city_id AS cityId, c.street_id AS streetId, d.house_id AS houseId,
        b.name AS cityName, c.name AS streetName,
        d.number AS houseNumber, a.porch, a.kind,
        a.features AS isDisablingApartments,
        a.is_time_range AS isTimeRange, a.hour_from AS hourFrom, a.hour_to AS hourTo
        FROM applications a
        LEFT JOIN cities b ON b.city_id = a.city_id
        LEFT JOIN streets c ON c.street_id = a.street_id
        LEFT JOIN houses d ON d.house_id = a.house_id
        WHERE (a.application_id > 0)
        AND (a.is_done = 0)
        AND (a.is_deleted = 0)
        AND (a.worker_id = ?)
        ORDER BY a.is_time_range DESC, b.name ASC, c.name ASC, d.number ASC`, [workerId], (err, rows) => {
        connection.release();

        var currentApplications = [];
        if (err) {
          console.error(err);
          reject();
        }
        else {
          let address = '';
          let cityName = '';
          rows.forEach((item) => {

            if (+item.cityId > 0) {
              cityName = item.cityName;
            }
            if (+item.streetId > 0) {
              address = `${item.streetName}`;
            }
            if (+item.houseId > 0) {
              address = `${address}, ${item.houseNumber}`;
            }

            const kind = +item.kind === 0 ? 'пoдъезд' : 'квартира';
            address = `${address}, ${kind} ${item.porch}`;

            currentApplications.push({
              id: item.documentId,
              createDate: item.createDate,
              phone: item.phone,
              cityName: cityName,
              address: address,
              isTimeRange: item.isTimeRange != 0,
              hourFrom: item.hourFrom,
              hourTo: item.hourTo,
              isDisablingApartments: item.isDisablingApartments,
            });
          });
          resolve({
            docs: currentApplications
          })
        }
      });
    });
  });
}

function getCurrentApplicationTable(documentId) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(`
        SELECT a.fault_id AS rowId, a.name,
        a.decision, a.is_done AS isDone, DATE_FORMAT(a.completion_dt, '%Y-%m-%d %H:%i:%s') AS completionDateTime
        FROM faults a
        WHERE (a.application_id = ?)`, [documentId], (err, rows) => {
        connection.release();

        if (err) {
          console.error(err);
          reject();
        }
        else {
          resolve({ table: [...rows] })
        }
      });
    });
  });
}

module.exports = function () {
  var router = express.Router();

  router.get('/v1/test_connection', function (req, res) {
    res.status(200).send(JSON.stringify({ 'test_connection': 'successful' }));
  });

  router.get('/v1/current_orders/:id', async function (req, res) {
    const id = req.params.id;
    let currentApplications = [];

    await getCurrentApplicationsHeader(id)
      .then((data) => {
        currentApplications = [...data.docs];
      })
      .catch((error) => {
        console.log(`ERROR: ${error.message}`)
      })

    for (let document of currentApplications) {
      console.log(`${document.id} ===> ${document.address} ===> ${document.phone}`);
      await getCurrentApplicationTable(document.id)
        .then((data) => {
          document.table = [...data.table];
        })
        .catch((error) => {
          console.log(`ERROR: ${error.message}`)
        })

    }

    res.status(200).send(
      JSON.stringify(currentApplications)
    );



  });


  // db.get().getConnection(function (err, connection) {
  //   connection.query(
  //     ' SELECT a.application_id AS documentId, a.create_date AS createDate,' +
  //     ' a.phone, b.city_id AS cityId, c.street_id AS streetId, d.house_id AS houseId,' +
  //     ' b.name AS cityName, c.name AS streetName,' +
  //     ' d.number AS houseNumber, a.porch' +
  //     ' FROM applications a' +
  //     ' LEFT JOIN cities b ON b.city_id = a.city_id' +
  //     ' LEFT JOIN streets c ON c.street_id = a.street_id' +
  //     ' LEFT JOIN houses d ON d.house_id = a.house_id' +
  //     ' WHERE (a.application_id > 0)' +
  //     ' AND (a.is_done = 0)' +
  //     ' AND (a.is_deleted = 0)' +
  //     ' AND (a.worker_id = ?)' +
  //     ' ORDER BY a.create_date ASC', [id], function (err, rows) {
  //       connection.release();

  //       let currentApplications = [];
  //       if ((err) || (!Array.isArray(rows))) {
  //         console.error(err);
  //         res.status(500).send(
  //           JSON.stringify(currentApplications)
  //         );
  //       }
  //       else {
  //         let address = '';
  //         rows.forEach(function (item) {

  //           if (+item.cityId > 0) {
  //             address = item.cityName;
  //             if (+item.streetId > 0) {
  //               address += ', ' + item.streetName;
  //             }
  //             if (+item.houseId > 0) {
  //               address += ', ' + item.houseNumber;
  //             }
  //           }

  //           currentApplications.push({
  //             'id': item.documentId,
  //             // 'createDate': item.createDate,
  //             'phone': item.phone,
  //             'address': address
  //           });
  //         });
  //         res.status(200).send(
  //           JSON.stringify(currentApplications)
  //         );
  //       }
  //     });
  // });
  // });

  // router.get('/v1/current_orders/:id', async function (req, res) {
  //   var id = req.params.id;

  //   db.get().getConnection(function (err, connection) {
  //     connection.query(
  //       ' SELECT a.application_id AS documentId, a.create_date AS createDate,' +
  //       ' a.phone, b.city_id AS cityId, c.street_id AS streetId, d.house_id AS houseId,' +
  //       ' b.name AS cityName, c.name AS streetName,' +
  //       ' d.number AS houseNumber, a.porch' +
  //       ' FROM applications a' +
  //       ' LEFT JOIN cities b ON b.city_id = a.city_id' +
  //       ' LEFT JOIN streets c ON c.street_id = a.street_id' +
  //       ' LEFT JOIN houses d ON d.house_id = a.house_id' +
  //       ' WHERE (a.application_id > 0)' +
  //       ' AND (a.is_done = 0)' +
  //       ' AND (a.is_deleted = 0)' +
  //       ' AND (a.worker_id = ?)' +
  //       ' ORDER BY a.create_date ASC', [id], function (err, rows) {
  //         connection.release();

  //         var currentApplications = [];
  //         if ((err) || (!Array.isArray(rows))) {
  //           console.error(err);
  //           res.status(500).send(
  //             JSON.stringify(currentApplications)
  //           );
  //         }
  //         else {
  //           var address = '';
  //           rows.forEach(function (item) {

  //             if (+item.cityId > 0) {
  //               address = item.cityName;
  //               if (+item.streetId > 0) {
  //                 address += ', ' + item.streetName;
  //               }
  //               if (+item.houseId > 0) {
  //                 address += ', ' + item.houseNumber;
  //               }
  //             }

  //             currentApplications.push({
  //               'id': item.documentId,
  //               // 'createDate': item.createDate,
  //               'phone': item.phone,
  //               'address': address
  //             });
  //           });
  //           res.status(200).send(
  //             JSON.stringify(currentApplications)
  //           );
  //         }
  //       });
  //   });
  // });

  router.get('/v1/completed_orders/:id', function (req, res) {
    var id = req.params.id;

    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT a.application_id AS documentId, a.create_date AS createDate,' +
        ' a.phone, b.city_id AS cityId, c.street_id AS streetId, d.house_id AS houseId,' +
        ' b.name AS cityName, c.name AS streetName,' +
        ' d.number AS houseNumber, a.porch' +
        ' FROM applications a' +
        ' LEFT JOIN cities b ON b.city_id = a.city_id' +
        ' LEFT JOIN streets c ON c.street_id = a.street_id' +
        ' LEFT JOIN houses d ON d.house_id = a.house_id' +
        ' WHERE (a.application_id > 0)' +
        ' AND a.is_done = 1' +
        ' ORDER BY a.create_date ASC', [], function (err, rows) {
          connection.release();

          var currentApplications = [];
          if ((err) || (!Array.isArray(rows))) {
            console.error(err);
            res.status(500).send(
              JSON.stringify(currentApplications)
            );
          }
          else {
            var address = '';
            rows.forEach(function (item) {

              if (+item.cityId > 0) {
                address = item.cityName;
                if (+item.streetId > 0) {
                  address += ', ' + item.streetName;
                }
                if (+item.houseId > 0) {
                  address += ', ' + item.houseNumber;
                }
              }

              currentApplications.push({
                'id': item.documentId,
                'createDate': item.createDate,
                'phone': item.phone,
                'address': address
              });
            });
            res.status(200).send(
              JSON.stringify(currentApplications)
            );
          }
        });
    });
  });

  router.get('/v1/get_workers', function (req, res) {

    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT a.worker_id AS workerId, a.name AS workerName,' +
        ' a.phone ' +
        ' FROM workers a ' +
        ' WHERE (a.worker_id > 0)' +
        ' AND (a.is_work = 0)' +
        ' ORDER BY a.name ASC', [], function (err, rows) {
          connection.release();

          var listWorkers = [];
          if ((err) || (!Array.isArray(rows))) {
            console.error(err);
            res.status(500).send(
              JSON.stringify(listWorkers)
            );
          }
          else {
            rows.forEach(function (item) {
              listWorkers.push({
                'id': item.workerId,
                'name': item.workerName,
                'phone': phone
              });
            });
            res.status(200).send(
              JSON.stringify(currentApplications)
            );
          }
        });
    });
  });

  router.post('/v1/completed_applications/:id', async function (req, res) {
    var workerId = req.params.id;
    console.log(`id: ${workerId}`);

    const data = req.body;
    console.log(`outData: ${JSON.stringify(data)}`);

    await insertApplicationsTable(data, workerId)
      .then(() => {

      })
      .catch((error) => {
        console.log(`ERROR: ${error.message}`)
      })

    await insertApplicationsHeader(data, workerId)
      .then(() => {

      })
      .catch((error) => {
        console.log(`ERROR: ${error.message}`)
      })

    res.status(200).send({ result: 'success' });
  });


  return router;
};