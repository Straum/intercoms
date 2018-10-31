'use strict';

const express = require('express');
var db = require('../../../lib/db.js');

module.exports = function () {
    var router = express.Router();

    router.get('/v1/test_connection', function (req, res) {
        res.status(200).send(JSON.stringify({ 'test_connection': 'successful' }));
    });

    router.get('/v1/current_orders/:id', function (req, res) {
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
                ' AND a.is_done = 0' +
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


    return router;
};