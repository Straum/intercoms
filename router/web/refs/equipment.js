const express = require("express");
const db = require("../../../lib/db");
const { visibleRows } = require("../../../lib/config").config;

function getTypesOfEquipment() {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        `SELECT type_of_equipment_id AS typeOfEquipmentId, name AS equipmentName
        FROM types_of_equipment
        WHERE type_of_equipment_id > 0
        ORDER BY name ASC`, [],
        (error, rows) => {
          connection.release();
          if (error) {
            reject();
          } else {
            resolve(rows);
          }
        },
      );
    });
  });
}

function getEquipment(id) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        `SELECT a.equipment_id AS id, a.name, a.guarantee_period AS guaranteePeriod,
        type_of_equipment_id AS typeOfEquipmentId
        FROM equipments a
        WHERE a.equipment_id = ?`, [id],
        (error, rows) => {
          connection.release();
          if (error) {
            reject();
          } else {
            resolve(rows[0]);
          }
        },
      );
    });
  });
}

module.exports = () => {
  const router = express.Router();

  router.get("/", function (req, res) {
    var pageCount = 0;
    db.get().getConnection(function (err, connection) {
      connection.query(
        " SELECT COUNT(*) AS count" + " FROM equipments WHERE equipment_id > 0",
        [],
        function (err, rows) {
          connection.release();
          pageCount =
            rows[0].count / visibleRows < 1
              ? 0
              : Math.ceil(rows[0].count / visibleRows);

          db.get().getConnection(function (err, connection) {
            connection.query(
              `SELECT a.equipment_id AS id, a.name, a.guarantee_period AS guaranteePeriod, b.name AS equipmentType
              FROM equipments a
              LEFT JOIN types_of_equipment b ON b.type_of_equipment_id = a.type_of_equipment_id
              WHERE a.equipment_id > 0
              ORDER BY a.name ASC
              LIMIT ?`,
              [visibleRows],
              function (err, rows) {
                if (err) {
                  throw err;
                }
                connection.release();

                if (err) {
                  console.error(err);
                  res.status(500).send({
                    code: 500,
                    msg: "Database error",
                  });
                } else {
                  var currentPage = 1;
                  res.render("refs/equipment.ejs", {
                    title: "Оборудование",
                    data: rows,
                    pageCount: pageCount,
                    currentPage: currentPage,
                    visibleRows: visibleRows,
                    user: req.session.userName,
                  });
                }
              }
            );
          });
        }
      );
    });
  });

  router.get('/edit/(:id)', async (req, res) => {
    const { id } = req.params;
    const typesOfEquipment = await getTypesOfEquipment();
    const equipment = await getEquipment(id);

    res.render('refs/forms/equipment/edit.ejs', {
      title: 'Редактировать оборудование',
      data: { ...equipment, typesOfEquipment },
      user: req.session.userName,
    });
  });

  router.get('/add', async (req, res) => {
    const typesOfEquipment = await getTypesOfEquipment();

    res.render('refs/forms/equipment/add.ejs', {
      title: 'Добавьте оборудование',
      data: {
        name: '',
        guaranteePeriod: 0,
        typeOfEquipmentId: 1,
        typesOfEquipment,
      },
      user: req.session.userName,
    });
  });

  router.get("/:offset", function (req, res) {
    var offset = +req.params.offset;
    var pageCount = 0;
    db.get().getConnection(function (err, connection) {
      connection.query(
        " SELECT COUNT(*) AS count" + " FROM equipments WHERE equipment_id > 0",
        [],
        function (err, rows) {
          connection.release();
          pageCount =
            rows[0].count / visibleRows < 1
              ? 0
              : Math.ceil(rows[0].count / visibleRows);
          if (offset > pageCount * visibleRows) {
            offset = (pageCount - 1) * visibleRows;
          }

          db.get().getConnection(function (err, connection) {
            connection.query(
              `SELECT a.equipment_id AS id, a.name, a.guarantee_period AS guaranteePeriod, b.name AS equipmentType
              FROM equipments a
              LEFT JOIN types_of_equipment b ON b.type_of_equipment_id = a.type_of_equipment_id
              WHERE a.equipment_id > 0
              ORDER BY a.name ASC
              LIMIT ?
              OFFSET ?`,
              [visibleRows, offset],
              function (err, rows) {
                connection.release();

                if (err) {
                  console.error(err);
                  res.status(500).send({
                    code: 500,
                    msg: "Database error",
                  });
                } else {
                  var currentPage = Math.ceil(offset / visibleRows) + 1;
                  res.render("refs/equipment.ejs", {
                    title: "Оборудование",
                    data: rows,
                    pageCount: pageCount,
                    currentPage: currentPage,
                    visibleRows: visibleRows,
                    user: req.session.userName,
                  });
                }
              }
            );
          });
        }
      );
    });
  });

  router.post("/", function (req, res) {
    req.assert("name", "Заполните наименование").notEmpty();
    req
      .assert("years", "Гарантийный срок должен быть числом или пустым")
      .optional({ checkFalsy: true })
      .isDecimal();
    var errors = req.validationErrors();

    if (!errors) {
      var data = {
        name: req.sanitize("name").escape().trim(),
        type_of_equipment_id: req.body.type_of_equipment,
        years: req.sanitize("years").escape().trim(),
      };

      db.get().getConnection(function (err, connection) {
        connection.query(
          `INSERT INTO equipments (name, type_of_equipment_id, guarantee_period) VALUE(?, ?, ?)`,
          [data.name, data.type_of_equipment_id, data.years],
          function (err) {
            connection.release();
            if (err) {
              res.status(500).send({
                code: 500,
                msg: "Database Error",
              });
            } else {
              res.redirect("/equipment");
            }
          }
        );
      });
    } else {
      req.flash("errors", errors);

      res.render("refs/forms/equipment/add.ejs", {
        title: "Добавить оборудование",
        data: {
          name: req.body.name,
          guaranteePeriod: req.body.years,
        },
        user: req.session.userName,
      });
    }
  });

  router.put("/edit/(:id)", function (req, res) {
    var id = req.params.id;

    req.assert("name", "Заполните наименование").notEmpty();
    req
      .assert("years", "Гарантийный срок должен быть числом или пустым")
      .optional({ checkFalsy: true })
      .isDecimal();
    var errors = req.validationErrors();

    if (!errors) {
      var data = {
        name: req.sanitize("name").escape().trim(),
        type_of_equipment_id: req.body.type_of_equipment,
        years: req.sanitize("years").escape().trim(),
      };
      db.get().getConnection(function (err, connection) {
        connection.query(
          `UPDATE equipments SET
            name = ?,
            type_of_equipment_id = ?,
            guarantee_period = ?
            WHERE equipment_id = ?`,
          [data.name, data.type_of_equipment_id, data.years, id],
          function (err) {
            connection.release();
            if (err) {
              res.status(500).send({
                code: 500,
                msg: "Database Error",
              });
            } else {
              res.redirect("/equipment");
            }
          }
        );
      });
    } else {
      req.flash("errors", errors);

      res.render("refs/forms/template/edit.ejs", {
        title: "Редактировать оборудование",
        data: {
          id: id,
          name: req.body.name,
          guaranteePeriod: req.body.years,
        },
        user: req.session.userName,
      });
    }
  });

  router.delete("/", function (req, res) {
    if (req.body.id && isFinite(+req.body.id)) {
      db.get().getConnection(function (err, connection) {
        connection.query(
          " DELETE FROM equipments WHERE equipment_id = ?",
          [+req.body.id],
          function (err) {
            connection.release();
            if (err) {
              res.status(500).send({
                code: 500,
                msg: "Database Error",
                err: JSON.stringify(err),
              });
            } else {
              res.status(200).send({
                result: "OK",
              });
            }
          }
        );
      });
    } else {
      res.status(500).send({
        code: 500,
        msg: "Incorrect parameter",
      });
    }
  });

  return router;
};
