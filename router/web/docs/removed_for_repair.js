const express = require('express');
const moment = require('moment');

const db = require('../../../lib/db');
const { visibleRows } = require('../../../lib/config').config;
const { rowsLimit } = require('../../../lib/config').config;
const common = require('../../common/typeheads');
const queries = require('../../../queries/removed_for_repair');
const { RemovedForRepairModel } = require('../../../models/removed_for_repair');

class Filters {
  constructor() {
    this.conditions = {
      period: {
        start: '',
        end: '',
      },
    };
    this.whereSQL = '';
    this.orderBy = '';
  }
}

const filterBuilder = (req, underRepair) => {
  const filters = new Filters();
  let cloneFilters = new Filters();

  const startDate = moment('2000-01-01').format('YYYY-MM-DD');
  const endDate = moment().endOf('month').toDate();

  if (underRepair) {
    if (!('filtersUnderRepair' in req.session)) {
      req.session.filtersUnderRepair = filters;
    }
    cloneFilters = req.session.filtersUnderRepair;
    if (cloneFilters.conditions.period.start === '') {
      cloneFilters.conditions.period.start = moment(startDate).format('YYYY-MM-DD');
    }
    if (cloneFilters.conditions.period.end === '') {
      cloneFilters.conditions.period.end = moment(endDate).format('YYYY-MM-DD');
    }

    if ((req.body) && (req.body.startDate) && (req.body.endDate)) {
      cloneFilters.conditions.period.start = moment(req.body.startDate, 'DD.MM.YYYY').format('YYYY-MM-DD');
      cloneFilters.conditions.period.end = moment(req.body.endDate, 'DD.MM.YYYY').format('YYYY-MM-DD');
    }

    req.session.filtersUnderRepair = cloneFilters;
  } else {
    if (!('filtersRepairIsDone' in req.session)) {
      req.session.RepairIsDone = filters;
    }
    cloneFilters = req.session.RepairIsDone;

    if (cloneFilters.conditions.period.start === '') {
      cloneFilters.conditions.period.start = moment(startDate).format('YYYY-MM-DD HH:mm');
    }
    if (cloneFilters.conditions.period.end === '') {
      cloneFilters.conditions.period.end = moment(endDate).format('YYYY-MM-DD HH:mm');
    }

    if ((req.body) && (req.body.startDate) && (req.body.endDate)) {
      cloneFilters.conditions.period.start = moment(req.body.startDate, 'DD.MM.YYYY HH:mm').format('YYYY-MM-DD HH:mm');
      cloneFilters.conditions.period.end = moment(req.body.endDate, 'DD.MM.YYYY HH:mm').format('YYYY-MM-DD HH:mm');
    }

    req.session.RepairIsDone = cloneFilters;
  }

  cloneFilters.whereSQL = `AND a.create_date BETWEEN '${cloneFilters.conditions.period.start}' AND '${cloneFilters.conditions.period.end}'`;
  cloneFilters.orderBy = 'ORDER BY a.create_date ASC';

  return cloneFilters;
};

const findRecordsUnderRepair = async (req, res, offset) => {
  const indication = {
    status: 'underRepair',
    countRecords: 0,
    pageCount: 0,
    currentPage: 1,
    visibleRows,
  };

  const add = filterBuilder(req, true);

  const queryRecordsCount = `${queries.getCountRecordsUnderRepair} ${add.whereSQL}`;
  const {
    count,
  } = await getRecordsCount(queryRecordsCount);
  indication.countRecords = count;
  indication.pageCount = (indication.countRecords / visibleRows) < 1 ? 0 : Math.ceil(indication.countRecords / visibleRows);
  if (offset > 0) {
    indication.currentPage = Math.ceil(offset / visibleRows) + 1;
    if (indication.pageCount >= 1) {
      indication.currentPage = Math.min(indication.currentPage, indication.pageCount);
    }
  }

  const queryRecords = offset > 0
    ? `${queries.getRecordsUnderRepair} ${add.whereSQL} ${add.orderBy} LIMIT ${visibleRows} OFFSET ${offset}`
    : `${queries.getRecordsUnderRepair} ${add.whereSQL} ${add.orderBy} LIMIT ${visibleRows}`;
  const rows = await getRecords(queryRecords);

  res.render('docs/removed_for_repair.ejs', {
    title: 'Снято в ремонт',
    data: rows,
    indication,
    moment,
    user: req.session.userName,
    filters: add.conditions,
  });
};

const findRecordsCompleted = async (req, res, offset) => {
  const indication = {
    status: 'completed',
    countRecords: 0,
    pageCount: 0,
    currentPage: 1,
    visibleRows,
  };

  const add = filterBuilder(req, false);

  const queryRecordsCount = `${queries.getCountRecordsCompleted} ${add.whereSQL}`;
  const {
    count,
  } = await getRecordsCount(queryRecordsCount);
  indication.countRecords = count;
  indication.pageCount = (indication.countRecords / visibleRows) < 1 ? 0 : Math.ceil(indication.countRecords / visibleRows);
  if (offset > 0) {
    indication.currentPage = Math.ceil(offset / visibleRows) + 1;
    if (indication.pageCount >= 1) {
      indication.currentPage = Math.min(indication.currentPage, indication.pageCount);
    }
  }

  const queryRecords = offset > 0
    ? `${queries.getRecordsCompleted} ${add.whereSQL} ${add.orderBy} LIMIT ${visibleRows} OFFSET ${offset}`
    : `${queries.getRecordsCompleted} ${add.whereSQL} ${add.orderBy} LIMIT ${visibleRows}`;
  const rows = await getRecords(queryRecords);

  res.render('docs/removed_for_repair_completed.ejs', {
    title: 'Снято в ремонт',
    data: rows,
    indication,
    moment,
    user: req.session.userName,
    filters: add.conditions,
  });
};

function getRecordsCount(queryText) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(queryText, [],
        (error, rows) => {
          connection.release();
          if (error) {
            reject();
          } else {
            let data = null;
            if ((rows) && (rows.length === 1)) {
              data = rows[0];
            }
            resolve(data);
          }
        });
    });
  });
}

function getRecords(textQuery) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(textQuery, [],
        (error, rows) => {
          connection.release();
          if (error) {
            reject();
          } else {
            resolve(rows);
          }
        });
    });
  });
}

function getEquipmentTypes(includeNoData) {
  const textQuery = `SELECT a.type_of_equipment_id AS id, a.name FROM types_of_equipment a ${includeNoData ? '' : 'WHERE a.type_of_equipment_id > 0'} ORDER BY a.name`;

  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(textQuery, [],
        (err, rows) => {
          connection.release();
          if (err) {
            reject();
          } else {
            resolve(rows);
          }
        });
    });
  });
}

function getData(id) {
  const textQuery = `SELECT a.removed_for_repair_id AS id, a.create_date AS createDate, a.personal_data AS personalData, a.phones,
    a.office, e.parent_id AS areaId, UPPER(h.name) AS areaName, a.city_id AS cityId, UPPER(e.name) AS cityName,
    a.street_id AS streetId, UPPER(f.name) AS streetName, a.house_id AS houseId, UPPER(g.number) AS houseNumber,
    e.is_city AS isCity, e.no_streets AS noStreets, e.no_houses AS noHouses,
    a.equipment_type AS equipmentType, a.equipment_model AS equipmentId, b.name AS equipmentName, a.series, a.repair,
    a.worker_id AS workerId, c.name AS workerName, a.service_id AS serviceId, d.full_name AS serviceName,
    a.is_done AS isDone
    FROM removed_for_repair a
    LEFT JOIN equipments b ON b.equipment_id = a.equipment_model
    LEFT JOIN workers c ON c.worker_id = a.worker_id
    LEFT JOIN services d ON d.service_id = a.service_id
    LEFT JOIN cities e ON e.city_id = a.city_id
    LEFT JOIN streets f ON f.street_id = a.street_id
    LEFT JOIN houses g ON g.house_id = a.house_id
    LEFT JOIN cities h ON h.city_id = e.parent_id
    WHERE a.removed_for_repair_id = ?`;

  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(textQuery, [id],
        (err, rows) => {
          connection.release();
          if (err) {
            reject();
          } else {
            const data = rows ? (rows.length === 1 ? {
              ...rows[0],
            } : null) : null;
            resolve(data);
          }
        });
    });
  });
}

function updateData(data) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
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
        service_id = ?,
        is_done =?
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
          data.isDone,
          data.id,
        ],
        (err) => {
          connection.release();
          if (err) {
            reject();
          } else {
            resolve();
          }
        },
      );
    });
  });
}

function insertData(data) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        `INSERT INTO removed_for_repair (create_date, personal_data, phones, office,
        city_id, street_id, house_id,
        equipment_type, equipment_model, series, repair, worker_id, service_id, is_done)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
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
          data.isDone,
        ],
        (err, rows) => {
          connection.release();
          if (err) {
            reject();
          } else {
            resolve(rows.insertId);
          }
        },
      );
    });
  });
}

async function filterRecords(req, res) {
  const add = filterBuilder(req);

  let countRecords = 0;
  let isDoneRecords = 0;
  let pageCount = 0;
  let rows = [];

  const queryRecordsCount = `SELECT COUNT(*) AS count, COUNT(CASE WHEN a.is_done = 1 THEN 1 END) AS isDone
    FROM removed_for_repair a WHERE (a.removed_for_repair_id > 0) AND (a.is_deleted = 0) ${add.whereSQL}`;

  const queryRecords = `SELECT a.removed_for_repair_id AS id, a.create_date AS createDate, a.office,
    f.parent_id AS areaId, UPPER(k.name) AS areaName, a.city_id AS cityId, UPPER(f.name) AS cityName,
    f.no_streets AS noStreets, f.no_houses AS noHouses,
    a.street_id AS streetId, UPPER(g.name) AS streetName, a.house_id AS houseId, UPPER(h.number) AS houseNumber,
    e.type_of_equipment_id AS equipmentTypeId, e.name AS equipmentType,
    b.name AS equipmentName, c.name AS workerName, d.short_name AS serviceName,
    a.is_done AS isDone
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
    .then((result) => {
      countRecords = result ? result.count : 0;
      isDoneRecords = result ? result.isDone : 0;
      pageCount = (countRecords / visibleRows) < 1 ? 0 : Math.ceil(countRecords / visibleRows);
    })
    .catch((error) => {
      console.log(`Error getRecordsCount: ${error}`);
    });

  await getRecords(queryRecords)
    .then((result) => {
      rows = result;
    })
    .catch((error) => {
      console.log(`Error getRecords: ${error}`);
    });

  const currentPage = 1;
  res.render('docs/removed_for_repair.ejs', {
    title: 'Снято в ремонт',
    data: rows,
    pageCount,
    currentPage,
    visibleRows,
    countRecords,
    isDoneRecords,
    moment,
    user: req.session.userName,
    filters: add.conditions,
  });
};

module.exports = function () {
  const router = express.Router();

  router.get('/', (req, res) => {
    // filterRecords(req, res);
    findRecordsUnderRepair(req, res);
  });

  router.get('/edit/:id', async (req, res) => {
    const { id } = req.params;
    const model = new RemovedForRepairModel();

    let equipmentTypes = [];
    await getEquipmentTypes(false).then((data) => equipmentTypes = [...data])
      .catch((error) => {
        console.log(error.message);
        res.status(500).send(error.message);
      });

    await getData(id).then((data) => {
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

        model.isDone = data.isDone;
      }
    })
      .catch((error) => {
        console.log(error.message);
        res.status(500).send(error.message);
      });

    res.render('docs/forms/removed_for_repair.ejs', {
      title: 'Сервис для ремонта',
      data: model,
      equipmentTypes,
      moment,
      errors: {},
      user: req.session.userName,
    });
  });

  router.get('/add', async (req, res) => {
    const model = new RemovedForRepairModel();

    let equipmentTypes = [];
    await getEquipmentTypes(false).then((data) => equipmentTypes = [...data])
      .catch((error) => {
        console.log(error.message);
        res.status(500).send(error.message);
      });

    res.render('docs/forms/removed_for_repair.ejs', {
      title: 'Снято в ремонт',
      data: model,
      equipmentTypes,
      moment,
      errors: {},
      user: req.session.userName,
    });
  });

  // router.get('/filter', function (req, res) {
  //   // filterRecords(req, res);
  //   findRecordsUnderRepair(req, res, 0);
  // });

  router.get('/completed', (req, res) => {
    findRecordsCompleted(req, res, 0);
  });

  router.get('/completed/:offset', (req, res) => {
    const offset = +req.params.offset;
    findRecordsCompleted(req, res, offset);
  });

  router.get('/:offset', async (req, res) => {
    const offset = +req.params.offset;
    findRecordsUnderRepair(req, res, offset);
  });

  router.post('/filter', (req, res) => {
    findRecordsUnderRepair(req, res, 0);
  });

  router.post('/filter_completed', (req, res) => {
    findRecordsCompleted(req, res, 0);
  });

  router.post('/save', async (req, res) => {
    let equipmentTypes = [];
    await getEquipmentTypes(false).then((data) => equipmentTypes = [...data]);

    const model = new RemovedForRepairModel();
    model.id = +req.body.id;
    model.createDate = req.body.createDate == null ? moment(new Date()).format('YYYY-MM-DD HH:mm') : moment(req.body.createDate, 'DD.MM.YYYY HH:mm').format('YYYY-MM-DD HH:mm');
    model.personalData = req.body.personalData;
    model.phones = req.body.phones;
    model.office = req.body.office;
    model.equipmentType = +req.body.equipmentType;
    model.series = req.body.series.trim().length === 0 ? null : req.body.series;
    model.repair = req.body.repair;
    model.isDone = req.body.isDone === 'on' ? 1 : 0;

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

    req.assert('address', 'Адрес не заполнен').custom((data) => {
      let result = false;
      const address = JSON.parse(data);
      if (address) {
        const resultOne = +address.area.id > 0;
        const resultTwo = (+address.city.id > 0) && (+address.street.id > 0) && (+address.house.id > 0);

        result = resultOne ? resultOne && resultTwo : resultTwo;
      }
      return result;
    });

    req.assert('equipment', 'Оборудование не заполнено').custom((data) => {
      let result = false;
      try {
        const equipment = JSON.parse(data);
        result = +equipment.id > 0;
      } catch (error) {
        //
      }
      return result;
    });

    req.assert('worker', 'Исполнитель не заполнен').custom((data) => {
      let result = false;
      try {
        const worker = JSON.parse(data);
        result = +worker.id > 0;
      } catch (error) {
        //
      }
      return result;
    });

    req.assert('service', 'Передано на ремонт не заполнено').custom((data) => {
      let result = false;
      try {
        const service = JSON.parse(data);
        result = +service.id > 0;
      } catch (error) {
        //
      }
      return result;
    });

    const errors = req.validationErrors();
    if (!errors) {
      if (model.id !== 0) {
        await updateData(model).then(() => res.redirect('/removed_for_repair'))
          .catch((error) => {
            res.status(500).send(error.message);
          });
      } else {
        await insertData(model).then(() => res.redirect('/removed_for_repair'))
          .catch((error) => {
            res.status(500).send(error.message);
          });
      }
    } else {
      res.render('docs/forms/removed_for_repair.ejs', {
        title: 'Снято в ремонт',
        data: model,
        equipmentTypes,
        moment,
        errors,
        user: req.session.userName,
      });
    }
  });

  router.post('/delete', (req, res) => {
    const { id } = req.body;
    if ((id) && (Number.isFinite(+id))) {
      db.get().getConnection((err, connection) => {
        connection.query(
          'UPDATE removed_for_repair SET is_deleted = 1 WHERE removed_for_repair_id = ?', [id],
          (error) => {
            connection.release();
            if (error) {
              connection.release();
              res.status(500).send({
                code: 500,
                msg: 'Database Error',
                err: JSON.stringify(error),
              });
            } else {
              res.status(200).send();
            }
          },
        );
      });
    } else {
      res.status(500).send({
        code: 500,
        msg: 'Incorrect parameter',
      });
    }
  });

  router.post('/filter_equipment', (req, res) => {
    const data = req.body;
    if ((data) && (typeof (data) === 'object') && ('suggestion' in data) && ('kind' in data)) {
      const rowsCount = 'limit' in data ? data.limit : rowsLimit;
      const params = {
        suggestion: data.suggestion,
        kind: data.kind,
        rowsCount,
      };
      common.filterEquipment(params, (err, rows) => {
        res.status(200).send(rows);
      });
    } else {
      res.status(500).send({
        code: 500,
        msg: 'Incorrect parameter',
      });
    }
  });

  router.post('/fast_filter', (req, res) => {
    const data = req.body;
    if ((data) && (typeof (data) === 'object') && ('suggestion' in data) && ('element' in data)) {
      const rowsCount = 'limit' in data ? data.limit : rowsLimit;
      const params = {
        suggestion: data.suggestion,
        element: data.element,
        rowsCount,
      };
      common.fastFilter(params, (err, rows) => {
        res.status(200).send(rows);
      });
    } else {
      res.status(500).send({
        code: 500,
        msg: 'Incorrect parameter',
      });
    }
  });

  router.post('/edit_equipment', (req, res) => {
    const data = req.body;
    if ((data) && (typeof (data) === 'object') && ('id' in data) && ('name' in data) && ('kind' in data)) {
      const params = {
        id: data.id,
        name: data.name,
        kind: data.kind,
      };
      common.editEquipment(params, (err, data) => {
        res.status(200).send(data);
      });
    } else {
      res.status(500).send({
        code: 500,
        msg: 'Incorrect parameter',
      });
    }
  });

  router.post('/add_equipment', (req, res) => {
    const data = req.body;
    if ((data) && (typeof (data) === 'object') && ('name' in data) && ('kind' in data)) {
      const params = {
        name: data.name,
        kind: data.kind,
      };
      common.addEquipment(params, (err, insertId) => {
        res.status(200).send({
          insertId,
        });
      });
    } else {
      res.status(500).send({
        code: 500,
        msg: 'Incorrect parameter',
      });
    }
  });

  router.post('/full_address', (req, res) => {
    const data = req.body;
    if ((data) && (typeof (data) === 'object') && ('suggestion' in data) && ('limit' in data)) {
      const params = {
        suggestion: data.suggestion,
        limit: data.limit,
      };
      common.getFullAddress2(params, (err, items) => {
        res.status(200).send(items);
      });
    } else {
      res.status(500).send({
        code: 500,
        msg: 'Incorrect parameter',
      });
    }
  });

  return router;
};
