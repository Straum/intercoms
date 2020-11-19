'use strict';

const path = require('path');
const express = require('express');

var db = require('../../../lib/db');
const visibleRows = require('../../../lib/config').config.visibleRows;
const rowsLimit = require('../../../lib/config').config.rowsLimit;
let moment = require('moment');
var common = require('../../common/typeheads');
const { query } = require('express-validator/check');
const { RemovedForRepairModel } = require('../../../models/removed_for_repair');

function getRecordsCount(queryText) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(queryText, [],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          }
          else {
            const data = rows ? (rows.length === 1 ? { ...rows[0] } : null) : null;
            resolve(data);
          }
        });
    });
  });
}

function getRecords(textQuery) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(textQuery, [],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          }
          else {
            resolve(rows);
          }
        });
    });
  });
}

function getEquipmentTypes(includeNoData) {
  let textQuery = `SELECT a.type_of_equipment_id AS id, a.name FROM types_of_equipment a ${includeNoData ? '' : 'WHERE a.type_of_equipment_id > 0'} ORDER BY a.name`;

  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(textQuery, [],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          }
          else {
            resolve(rows);
          }
        });
    });
  });
}

function getData(id) {
  let textQuery =
    `SELECT a.removed_for_repair_id AS id, a.create_date AS createDate, a.personal_data AS personalData, a.phones,
    a.office, e.parent_id AS areaId, UPPER(h.name) AS areaName, a.city_id AS cityId, UPPER(e.name) AS cityName,
    a.street_id AS streetId, UPPER(f.name) AS streetName, a.house_id AS houseId, UPPER(g.number) AS houseNumber,
    e.is_city AS isCity, e.no_streets AS noStreets, e.no_houses AS noHouses,
    a.equipment_type AS equipmentType, a.equipment_model AS equipmentId, b.name AS equipmentName, a.series, a.repair,
    a.worker_id AS workerId, c.name AS workerName, a.service_id AS serviceId, d.full_name AS serviceName
    FROM removed_for_repair a
    LEFT JOIN equipments b ON b.equipment_id = a.equipment_model
    LEFT JOIN workers c ON c.worker_id = a.worker_id
    LEFT JOIN services d ON d.service_id = a.service_id
    LEFT JOIN cities e ON e.city_id = a.city_id
    LEFT JOIN streets f ON f.street_id = a.street_id
    LEFT JOIN houses g ON g.house_id = a.house_id
    LEFT JOIN cities h ON h.city_id = e.parent_id
    WHERE a.removed_for_repair_id = ?`;

  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(textQuery, [id],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          }
          else {
            const data = rows ? (rows.length === 1 ? { ...rows[0] } : null) : null;
            resolve(data);
          }
        });
    });
  });
}

function updateData(data) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        `UPDATE removed_for_repair SET
        create_date = ?,
        personal_data = ?,
        phones = ?,
        office = ?,
        city_id = ?,
        street_id = ?,
        house_id = ?,
        equipment_type = ?,
        equipment_model = ?,
        series = ?,
        repair = ?,
        worker_id = ?,
        service_id = ?
        WHERE removed_for_repair_id = ?`, [
        data.createDate,
        data.personalData,
        data.phones,
        data.office,
        data.address.city.id,
        data.address.street.id,
        data.address.house.id,
        data.equipmentType,
        data.equipment.id,
        data.series,
        data.repair,
        data.worker.id,
        data.service.id,
        data.id], function (err) {
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

function insertData(data) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        `INSERT INTO removed_for_repair (create_date, personal_data, phones, office,
        city_id, street_id, house_id,
        equipment_type, equipment_model, series, repair, worker_id, service_id)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
        data.createDate,
        data.personalData,
        data.phones,
        data.office,
        data.address.city.id,
        data.address.street.id,
        data.address.house.id,
        data.equipmentType,
        data.equipment.id,
        data.series,
        data.repair,
        data.worker.id,
        data.service.id], function (err, rows) {
          connection.release();
          if (err) {
            reject();
          }
          else {
            resolve(rows.insertId);
          }
        });
    });
  });
}

var Filters = function () {
  this.conditions = {
    period: {
      start: '',
      end: ''
    },
    // city: { id: 0, name: '' },
    // street: { id: 0, name: '', cityId: 0 },
    // house: { id: 0, number: '', streetId: 0 },
    // porch: { number: 0, houseId: 0 },
    // number: {
    //   order: 0,
    //   prolongedOrder: 0
    // },
    // onlyMaintenanceService: false
  };
  this.whereSQL = '';
  this.orderBy = '';
};

var filterBuilder = function (req) {

  var obj = {};
  var filters = new Filters();
  var cloneFilters = new Filters();
  var where = '';

  // var startDate = moment().startOf('month').toDate();
  var startDate = moment('2000-01-01').format('YYYY-MM-DD');
  var endDate = moment().endOf('month').toDate();

  if (!('filtersRemovedForRepair' in req.session)) {
    req.session.filtersRemovedForRepair = filters;
  }
  cloneFilters = req.session.filtersRemovedForRepair;

  if (cloneFilters.conditions.period.start === '') {
    cloneFilters.conditions.period.start = moment(startDate).format('YYYY-MM-DD HH:mm');
  }
  if (cloneFilters.conditions.period.end === '') {
    cloneFilters.conditions.period.end = moment(endDate).format('YYYY-MM-DD HH:mm');
  }

  //   try {
  //     if (req.query) {
  //       if ('filters' in req.query) {
  //         obj = JSON.parse(req.query.filters);

  //         if (+obj.city.id > 0) {
  //           where += ' AND (a.city_id = ' + obj.city.id + ')';
  //         }
  //         cloneFilters.conditions.city = {
  //           id: obj.city.id,
  //           name: obj.city.name
  //         };

  //         if (+obj.street.id > 0) {
  //           where += ' AND (a.street_id = ' + obj.street.id + ')';
  //         }
  //         cloneFilters.conditions.street = {
  //           id: obj.street.id,
  //           name: obj.street.name,
  //           cityId: obj.street.cityId
  //         };

  //         if (+obj.house.id > 0) {
  //           where += ' AND (a.house_id = ' + obj.house.id + ')';
  //         }
  //         cloneFilters.conditions.house = {
  //           id: obj.house.id,
  //           number: obj.house.number,
  //           streetId: obj.house.streetId
  //         };

  //         if (+obj.porch.number > 0) { // + add "No data"
  //           where += ' AND (a.porch = ' + obj.porch.number + ')';
  //           cloneFilters.conditions.porch = {
  //             number: obj.porch.number
  //           };
  //         }

  //         if (+obj.number.order > 0) {
  //           where += ' AND (a.contract_number = ' + obj.number.order + ')';
  //         }
  //         cloneFilters.conditions.number.order = obj.number.order;

  //         if (+obj.number.prolongedOrder > 0) {
  //           where += ' AND (a.m_contract_number = ' + obj.number.prolongedOrder + ')';
  //         }
  //         cloneFilters.conditions.number.prolongedOrder = obj.number.prolongedOrder;

  //         if ('onlyMaintenanceService' in obj) {
  //           cloneFilters.conditions.onlyMaintenanceService = obj.onlyMaintenanceService;
  //         }

  //         var _start = obj.period.start; // YYYY-MM-DD HH:mm
  //         if (typeof _start === 'string') {
  //           if (_start.length > 0) {
  //             cloneFilters.conditions.period.start = _start;
  //           } else {
  //             cloneFilters.conditions.period.start = moment(startDate).format('YYYY-MM-DD HH:mm');
  //           }
  //         }

  //         var _end = obj.period.end; // YYYY-MM-DD HH:mm
  //         if (typeof _end === 'string') {
  //           if (_end.length > 0) {
  //             cloneFilters.conditions.period.end = _end;
  //           } else {
  //             cloneFilters.conditions.period.end = endDate;
  //           }
  //         }

  //         if (cloneFilters.conditions.onlyMaintenanceService) {
  //           where += ' AND (maintenance_contract >= 1)';
  //           where += ' AND (a.end_service >= ' + '"' + cloneFilters.conditions.period.start + '")';
  //           where += ' AND (a.end_service <= ' + '"' + cloneFilters.conditions.period.end + '")';

  //           cloneFilters.orderBy = ' ORDER BY a.end_service DESC, a.contract_number DESC';
  //         } else {
  //           where += ' AND (a.create_date >= ' + '"' + cloneFilters.conditions.period.start + '")';
  //           where += ' AND (a.create_date <= ' + '"' + cloneFilters.conditions.period.end + '")';

  //           cloneFilters.orderBy = ' ORDER BY a.create_date DESC, a.contract_number DESC';
  //         }

  //         cloneFilters.whereSQL = where;
  //       }
  //     }

  //     req.session.filtersOrders = cloneFilters;

  //   } catch (err) {
  //     throw (err);
  //   }
  return cloneFilters;
  // return req.session.filtersOrders;
};

var filterRecords = async function (req, res) {

  const add = filterBuilder(req);

  let countRecords = 0;
  let pageCount = 0;
  let rows = [];

  const queryRecordsCount = `SELECT COUNT(*) AS count FROM removed_for_repair a WHERE (a.removed_for_repair_id > 0) AND (a.is_deleted = 0) ${add.whereSQL}`;

  const queryRecords =
    `SELECT a.removed_for_repair_id AS id, a.create_date AS createDate, a.office,
    f.parent_id AS areaId, UPPER(k.name) AS areaName, a.city_id AS cityId, UPPER(f.name) AS cityName,
    a.street_id AS streetId, UPPER(g.name) AS streetName, a.house_id AS houseId, UPPER(h.number) AS houseNumber,
    e.type_of_equipment_id AS equipmentTypeId, e.name AS equipmentType,
    b.name AS equipmentName, c.name AS workerName, d.short_name AS serviceName
    FROM removed_for_repair a
    LEFT JOIN equipments b ON b.equipment_id = a.equipment_model
    LEFT JOIN workers c ON c.worker_id = a.worker_id
    LEFT JOIN services d ON d.service_id = a.service_id
    LEFT JOIN types_of_equipment e ON e.type_of_equipment_id = a.equipment_type
    LEFT JOIN cities f ON f.city_id = a.city_id
    LEFT JOIN streets g ON g.street_id = a.street_id
    LEFT JOIN houses h ON h.house_id = a.house_id
    LEFT JOIN cities k ON k.city_id = f.parent_id
    WHERE (a.removed_for_repair_id > 0) AND (a.is_deleted = 0) ${add.whereSQL} ${add.orderBy} LIMIT ${visibleRows}`;

  await getRecordsCount(queryRecordsCount)
    .then(function (result) {
      countRecords = result ? result.count : 0;
      pageCount = (countRecords / visibleRows) < 1 ? 0 : Math.ceil(countRecords / visibleRows);
    })
    .catch(function (error) {
      console.log('Error getRecordsCount: ' + error);
    });

  await getRecords(queryRecords)
    .then(function (result) {
      rows = result;
    })
    .catch(function (error) {
      console.log('Error getRecords: ' + error);
    });


  const currentPage = 1;
  res.render('docs/removed_for_repair.ejs', {
    title: 'Снято в ремонт',
    data: rows,
    pageCount: pageCount,
    currentPage: currentPage,
    visibleRows: visibleRows,
    countRecords: countRecords,
    moment: moment,
    user: req.session.userName,
    filters: add.conditions
  });

};

module.exports = function () {
  var router = express.Router();

  router.get('/', function (req, res) {
    filterRecords(req, res);
  });

  router.get('/edit/:id', async function (req, res) {
    const id = req.params.id;
    let model = new RemovedForRepairModel();

    let equipmentTypes = [];
    await getEquipmentTypes(false).then((data) => equipmentTypes = [...data]
    )
      .catch((error) => {
        console.log(error.message);
        res.status(500).send(error.message);
      });

    await getData(id).then(function (data) {
      if (data) {
        model.id = data.id;
        model.createDate = data.createDate;
        model.personalData = data.personalData;
        model.phones = data.phones;
        model.office = data.office;

        model.address.area.id = data.areaId;
        model.address.area.name = data.areaName;
        model.address.city.id = data.cityId;
        model.address.city.name = data.cityName;
        model.address.street.id = data.streetId;
        model.address.street.name = data.streetName;
        model.address.house.id = data.houseId;
        model.address.house.number = data.houseNumber;
        model.address.isCity = data.isCity;
        model.address.noStreets = data.noStreets;
        model.address.noHouses = data.noHouses;

        model.equipmentType = data.equipmentType;
        model.equipment.id = data.equipmentId || 0;
        model.equipment.name = data.equipmentName || '';
        model.series = data.series;
        model.repair = data.repair;
        model.worker.id = data.workerId || 0;
        model.worker.name = data.workerName || '';
        model.service.id = data.serviceId || 0;
        model.service.name = data.serviceName || '';
      }
    })
      .catch(function (error) {
        console.log(error.message);
        res.status(500).send(error.message);
      });

    res.render('docs/forms/removed_for_repair.ejs', {
      title: 'Сервис для ремонта',
      data: model,
      equipmentTypes: equipmentTypes,
      moment: moment,
      errors: {},
      user: req.session.userName
    });

  });

  router.get('/add', async function (req, res) {
    var model = new RemovedForRepairModel();

    let equipmentTypes = [];
    await getEquipmentTypes(false).then((data) => equipmentTypes = [...data]
    )
      .catch((error) => {
        console.log(error.message);
        res.status(500).send(error.message);
      });

    res.render('docs/forms/removed_for_repair.ejs', {
      title: 'Снято в ремонт',
      data: model,
      equipmentTypes: equipmentTypes,
      moment: moment,
      errors: {},
      user: req.session.userName
    });
  });

  router.get('/filter', function (req, res) {
    filterRecords(req, res);
  });

  router.get('/:offset', async function (req, res) {

    const add = filterBuilder(req);

    let offset = +req.params.offset;
    let currentPage = Math.ceil(offset / visibleRows) + 1;
    let countRecords = 0;
    let pageCount = 0;
    let rows = [];

    const queryRecordsCount = `SELECT COUNT(*) AS count FROM removed_for_repair a WHERE (a.removed_for_repair_id > 0) AND (a.is_deleted = 0) ${add.whereSQL}`;

    const queryRecords =
      `SELECT a.removed_for_repair_id AS id, a.create_date AS createDate, a.office,
      f.parent_id AS areaId, UPPER(k.name) AS areaName, a.city_id AS cityId, UPPER(f.name) AS cityName,
      a.street_id AS streetId, UPPER(g.name) AS streetName, a.house_id AS houseId, UPPER(h.number) AS houseNumber,
      e.type_of_equipment_id AS equipmentTypeId, e.name AS equipmentType,
      b.name AS equipmentName, c.name AS workerName, d.short_name AS serviceName
      FROM removed_for_repair a
      LEFT JOIN equipments b ON b.equipment_id = a.equipment_model
      LEFT JOIN workers c ON c.worker_id = a.worker_id
      LEFT JOIN services d ON d.service_id = a.service_id
      LEFT JOIN types_of_equipment e ON e.type_of_equipment_id = a.equipment_type
      LEFT JOIN cities f ON f.city_id = a.city_id
      LEFT JOIN streets g ON g.street_id = a.street_id
      LEFT JOIN houses h ON h.house_id = a.house_id
      LEFT JOIN cities k ON k.city_id = f.parent_id
      WHERE (a.removed_for_repair_id > 0) AND (a.is_deleted = 0) ${add.whereSQL} ${add.orderBy} LIMIT ${visibleRows} OFFSET ${offset}`;

    await getRecordsCount(queryRecordsCount)
      .then(function (result) {
        countRecords = result ? result.count : 0;
        pageCount = (countRecords / visibleRows) < 1 ? 0 : Math.ceil(countRecords / visibleRows);
      })
      .catch(function (error) {
        console.log('Error getRecordsCount: ' + error);
      });

    await getRecords(queryRecords)
      .then(function (result) {
        rows = result;
      })
      .catch(function (error) {
        console.log('Error getRecords: ' + error);
      });

    res.render('docs/removed_for_repair.ejs', {
      title: 'Снято в ремонт',
      data: rows,
      pageCount: pageCount,
      currentPage: currentPage,
      visibleRows: visibleRows,
      countRecords: countRecords,
      moment: moment,
      user: req.session.userName,
      filters: add.conditions
    });
  });

  router.post('/save', async function (req, res) {

    let equipmentTypes = [];
    await getEquipmentTypes(false).then((data) => equipmentTypes = [...data]);

    let model = new RemovedForRepairModel();
    model.id = +req.body.id;
    model.createDate = req.body.createDate == null ? moment(new Date()).format('YYYY-MM-DD HH:mm') : moment(req.body.createDate, 'DD.MM.YYYY HH:mm').format('YYYY-MM-DD HH:mm');
    model.personalData = req.body.personalData;
    model.phones = req.body.phones;
    model.office = req.body.office;
    model.equipmentType = +req.body.equipmentType;
    model.series = req.body.series.trim().length === 0 ? null : req.body.series;
    model.repair = req.body.repair;

    try {
      model.address = JSON.parse(req.body.address);
      model.equipment = JSON.parse(req.body.equipment);
      model.worker = JSON.parse(req.body.worker);
      model.service = JSON.parse(req.body.service);
    } catch (error) {
      console.log(error);
    }

    req.assert('createDate', 'Дата создания не заполнена').notEmpty();
    req.assert('personalData', 'ФИО не заполнена').notEmpty();
    req.assert('repair', 'Неисправность не заполнена').notEmpty();

    req.assert('address', 'Адрес не заполнен').custom(function (data) {
      let result = false
      let address = JSON.parse(data);
      if (address) {
        let resultOne = +address.area.id > 0;
        let resultTwo = (+address.city.id > 0) && (+address.street.id > 0) && (+address.house.id > 0);

        result = resultOne ? resultOne && resultTwo : resultTwo;
      }
      return result;
    });

    req.assert('equipment', 'Оборудование не заполнено').custom(function (data) {
      let result = false
      try {
        var equipment = JSON.parse(data);
        result = +equipment.id > 0;
      } catch (error) {

      }
      return result;
    });

    req.assert('worker', 'Исполнитель не заполнен').custom(function (data) {
      let result = false
      try {
        const worker = JSON.parse(data);
        result = +worker.id > 0;
      } catch (error) {

      }
      return result;
    });

    req.assert('service', 'Передано на ремонт не заполнено').custom(function (data) {
      let result = false
      try {
        const service = JSON.parse(data);
        result = +service.id > 0;
      } catch (error) {

      }
      return result;
    });

    let errors = req.validationErrors();
    if (!errors) {

      if (model.id != 0) {
        await updateData(model).then(() => res.redirect('/removed_for_repair'))
          .catch(function (error) {
            console.log(error.message);
            res.status(500).send(error.message);
          });
      }
      else {
        await insertData(model).then(() => res.redirect('/removed_for_repair'))
          .catch(function (error) {
            console.log(error.message);
            res.status(500).send(error.message);
          });
      }
    }
    else {
      res.render('docs/forms/removed_for_repair.ejs', {
        title: 'Снято в ремонт',
        data: model,
        equipmentTypes: equipmentTypes,
        moment: moment,
        errors: errors,
        user: req.session.userName
      });
    }
  });

  router.post('/delete', function (req, res) {
    if ((req.body.id) && (isFinite(+req.body.id))) {
      db.get().getConnection(function (err, connection) {
        connection.query(
          'UPDATE removed_for_repair SET is_deleted = 1 WHERE removed_for_repair_id = ?', [+req.body.id], function (err) {
            connection.release();
            if (err) {
              connection.release();
              res.status(500).send({
                code: 500,
                msg: 'Database Error',
                err: JSON.stringify(err)
              });
            } else {
              res.status(200).send({ result: 'OK' });
            }
          }
        );
      });
    } else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  router.post('/filter_equipment', function (req, res) {
    let data = req.body;
    if ((data) && (typeof (data) === 'object') && ('suggestion' in data) && ('kind' in data)) {
      let rowsCount = 'limit' in data ? data.limit : rowsLimit;
      let params = {
        suggestion: data.suggestion,
        kind: data.kind,
        rowsCount: rowsCount
      };
      common.filterEquipment(params, function (err, rows) {
        res.status(200).send(rows);
      });
    }
    else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  router.post('/fast_filter', function (req, res) {
    let data = req.body;
    if ((data) && (typeof (data) === 'object') && ('suggestion' in data) && ('element' in data)) {
      let rowsCount = 'limit' in data ? data.limit : rowsLimit;
      let params = {
        suggestion: data.suggestion,
        element: data.element,
        rowsCount: rowsCount
      };
      common.fastFilter(params, function (err, rows) {
        res.status(200).send(rows);
      });
    }
    else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  router.post('/add_equipment', function (req, res) {
    let data = req.body;
    if ((data) && (typeof (data) === 'object') && ('name' in data) && ('kind' in data)) {
      let params = {
        name: data.name,
        kind: data.kind
      };
      common.addEquipment(params, function (err, insertId) {
        res.status(200).send({ insertId: insertId });
      });
    }
    else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  router.post('/full_address', function (req, res) {
    let data = req.body;
    if ((data) && (typeof (data) === 'object') && ('suggestion' in data) && ('limit' in data)) {
      let params = {
        suggestion: data.suggestion,
        limit: data.limit
      };
      common.getFullAddress2(params, function (err, items) {
        res.status(200).send(items);
      });
    }
    else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });


  return router;

};
