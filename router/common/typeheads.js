'use strict';

var db = require('../../lib/db');

var getCity = function (cityName, callback) {
  db.get().getConnection(function (err, connection) {
    connection.query(
      ' SELECT a.city_id AS cityId' +
      ' FROM cities a' +
      ' WHERE (a.is_deleted = 0) AND (a.name = ?)' +
      ' LIMIT 1', [cityName],
      function (err, rows) {
        connection.release();

        if (typeof callback === 'function') {
          if (rows.length === 1) {
            callback(rows[0].cityId);
          } else {
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
    ' WHERE (a.is_deleted = 0) AND (a.city_id = ' + cityId + ')';

  if ((typeof streetName === 'string') && (streetName.trim() !== '')) {
    queryText += ' AND (a.name LIKE ' + `'` + streetName.trim() + '%' + `'` + ')';
  }

  queryText += ' LIMIT ' + rowsLimit;

  db.get().getConnection(function (err, connection) {
    connection.query(
      queryText, [],
      function (err, rows) {
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
        ' WHERE (a.is_deleted = 0) AND (a.street_id = ' + streetId + ')';

      if ((typeof houseNumber === 'string') && (houseNumber.trim().length > 0)) {
        queryText += ' AND (a.number LIKE ' + `'` + houseNumber.trim() + '%' + `'` + ')';
      }

      queryText += ' LIMIT ' + rowsLimit;

      db.get().getConnection(function (err, connection) {
        connection.query(
          queryText, [],
          function (err, rows) {
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

module.exports.filterCities = function (params, callback) {

  var queryText =
    ' SELECT a.city_id AS id, a.name AS value' +
    ' FROM cities a';

  if (params.cityName.length > 0) {
    queryText += ' WHERE a.name LIKE ' + `'` + params.cityName + '%' + `'`;
  }

  queryText += ' ORDER BY a.name ASC';
  queryText += ' LIMIT ' + params.rowsCount;

  db.get().getConnection(function (err, connection) {
    connection.query(
      queryText, [],
      function (err, rows) {
        connection.release();

        if (err) {
          throw err;
        }

        if (typeof callback === 'function') {
          callback(null, rows);
        }

      }
    );
  });
};

module.exports.filterStreets = function (params, callback) {

  var queryText =
    ' SELECT a.street_id AS id, a.name AS value, city_id AS cityId' +
    ' FROM streets a';

  queryText += ' WHERE a.is_deleted = 0 AND a.city_id = ' + params.cityId;

  if (params.streetName.length > 0) {
    queryText += ' AND a.name LIKE ' + `'` + params.streetName + '%' + `'`;
  }

  queryText += ' ORDER BY a.name ASC';
  queryText += ' LIMIT ' + params.rowsCount;

  db.get().getConnection(function (err, connection) {
    connection.query(
      queryText, [],
      function (err, rows) {
        connection.release();

        if (err) {
          throw err;
        }

        if (typeof callback === 'function') {
          callback(null, rows);
        }

      }
    );
  });
};

module.exports.filterHouses = function (params, callback) {

  var queryText =
    ' SELECT a.house_id AS id, a.number AS value, street_id AS streetId' +
    ' FROM houses a';

  queryText += ' WHERE a.is_deleted = 0 AND a.street_id = ' + params.streetId;

  if (params.houseNumber.length > 0) {
    queryText += ' AND a.number LIKE ' + `'` + params.houseNumber + '%' + `'`;
  }

  queryText += ' ORDER BY a.number ASC';
  queryText += ' LIMIT ' + params.rowsCount;

  db.get().getConnection(function (err, connection) {
    connection.query(
      queryText, [],
      function (err, rows) {
        connection.release();

        if (err) {
          throw err;
        }

        if (typeof callback === 'function') {
          callback(null, rows);
        }

      }
    );
  });
};

module.exports.filterPorches = function (params, callback) {

  var queryText =
    ' SELECT a.card_id AS id, CAST(a.porch AS CHAR(11)) AS value' +
    ' FROM cards a';

  queryText += ' WHERE a.house_id = ' + params.houseId;

  if (params.porch.length > 0) {
    queryText += ' AND a.porch LIKE ' + `'` + params.porch + '%' + `'`;
  }

  queryText += ' ORDER BY a.porch ASC';
  queryText += ' LIMIT ' + params.rowsCount;

  db.get().getConnection(function (err, connection) {
    connection.query(
      queryText, [],
      function (err, rows) {
        connection.release();

        if (err) {
          throw err;
        }

        if (typeof callback === 'function') {
          callback(null, rows);
        }

      }
    );
  });
};

module.exports.filterEquipments = function (params, callback) {

  let queryText =
    `SELECT a.equipment_id AS id, a.name AS value, guarantee_period AS guaranteePeriod
    FROM equipments a
    WHERE (a.equipment_id > 0)`;

  if (params.suggestion.length > 0) {
    queryText += ` AND a.name LIKE '${params.suggestion.trim()}%'`;
  }

  queryText += ` ORDER BY a.name ASC LIMIT ${params.rowsCount}`;


  db.get().getConnection(function (err, connection) {
    connection.query(
      queryText, [],
      function (err, rows) {
        connection.release();

        if (err) {
          throw err;
        }

        if (typeof callback === 'function') {
          callback(null, rows);
        }
      }
    );
  });
};

module.exports.filterOrders = function (orderNumber, rowsCount, callback) {

  let queryText =
    `SELECT a.card_id AS id, CAST(a.contract_number AS CHAR(11)) AS value
      FROM cards a
      WHERE (a.is_deleted = 0)`;

  if (orderNumber.length > 0) {
    queryText += ` AND (a.contract_number LIKE '${orderNumber.trim()}%')`;
  }

  queryText += ` ORDER BY a.contract_number ASC LIMIT ${rowsCount}`;

  db.get().getConnection(function (err, connection) {
    connection.query(
      queryText, [],
      function (err, rows) {
        connection.release();

        if (err) {
          throw err;
        }

        if (typeof callback === 'function') {
          callback(null, rows);
        }
      }
    );
  });
};

module.exports.filterProlongedOrders = function (orderNumber, rowsCount, callback) {

  let queryText =
    `SELECT a.card_id AS id, a.m_contract_number AS value,
      a.contract_number AS contractNumber, a.start_service AS startService,
      a.end_service AS endService, m_start_apartment AS startApartment, m_end_apartment AS endApartment,
      a.m_duplicate AS isDuplicate, a.receipt_printing AS receiptPrint,
      b.name AS cityName, c.name AS streetName, d.number AS houseNumber
      FROM cards a
      LEFT JOIN cities b ON b.city_id = a.city_id
      LEFT JOIN streets c ON c.street_id = a.street_id
      LEFT JOIN houses d ON d.house_id = a.house_id
      WHERE (a.is_deleted = 0)`;

  if (orderNumber.length > 0) {
    queryText += ` AND (a.m_contract_number LIKE '${orderNumber.trim()}%')`;
  }

  queryText += ` ORDER BY a.m_contract_number ASC LIMIT ${rowsCount}`;

  db.get().getConnection(function (err, connection) {
    connection.query(
      queryText, [],
      function (err, rows) {
        connection.release();

        if (err) {
          throw err;
        }

        if (typeof callback === 'function') {
          callback(null, rows);
        }
      }
    );
  });
};

module.exports.filterPerformers = function (params, callback) {

  var queryText =
    ' SELECT a.worker_id AS id, a.name AS `value`' +
    ' FROM workers a' +
    ' WHERE (a.is_work = 0)';

  if (params.performerName.length > 0) {
    queryText += ' AND a.name LIKE ' + `'` + params.performerName.trim() + '%' + `'`;
  }

  queryText += ' ORDER BY a.name ASC';
  queryText += ' LIMIT ' + params.rowsCount;


  db.get().getConnection(function (err, connection) {
    connection.query(
      queryText, [],
      function (err, rows) {
        connection.release();

        if (err) {
          throw err;
        }

        if (typeof callback === 'function') {
          callback(null, rows);
        }
      }
    );
  });
};

module.exports.filterClients = function (params, callback) {

  var queryText =
    ' SELECT a.client_id AS id, a.name AS `value`, b.phones' +
    ' FROM clients a' +
    ' LEFT JOIN faces b ON b.client_id = a.client_id' +
    ' WHERE (a.is_deleted = 0)';

  if (params.suggestion.length > 0) {
    queryText += ' AND a.name LIKE ' + `'` + params.suggestion.trim() + '%' + `'`;
  }

  queryText += ' ORDER BY a.name ASC';
  queryText += ' LIMIT ' + params.rowsCount;


  db.get().getConnection(function (err, connection) {
    connection.query(
      queryText, [],
      function (err, rows) {
        connection.release();

        if (err) {
          throw err;
        }

        if (typeof callback === 'function') {
          callback(null, rows);
        }
      }
    );
  });
};

module.exports.outFullAddress = function (params, callback) {
  var words = params.suggestion.split(', ');
  if (!Array.isArray(words)) {
    return;
  }

  var outputData = {};
  var queryText = '';
  var items = [];

  if (words.length === 1) {
    queryText =
      ' SELECT a.city_id, a.name AS city_name' +
      ' FROM cities a';

    if (words[0].trim().length > 0) {
      queryText += ' WHERE a.name LIKE ' + `'` + words[0].trim() + '%' + `'`;
    }
    queryText += ' ORDER BY a.name ASC';
    queryText += ' LIMIT ' + params.rowsCount;

    db.get().getConnection(function (err, connection) {
      connection.query(
        queryText, [],
        function (err, rows) {
          connection.release();

          if (err) {
            throw (err);
          }

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
          callback(null, outputData);
          return;
        }
      );
    });
  } else if (words.length >= 2) {
    var cityId = 0;
    getCity(words[0].trim(), function (id) {
      if (id === null) {
        items.push({
          cityId: 0,
          cityName: 'Нет данных'
        });
        outputData.level = 0;
        outputData.items = items;
        callback(null, outputData);
        return;
      }
      cityId = id;
      getStreets(cityId, words[1], params.rowsCount, function (streets) {
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
          callback(null, outputData);
          return;
        }
        if (words.length === 3) {
          getHouses(cityId, words[1], words[2], params.rowsCount, function (houses) {
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
            callback(null, outputData);
          });
        }
      });
    });
  };
};

module.exports.filterEquipment = function (params, callback) {
  var queryText =
    `SELECT a.equipment_id AS id, a.name AS value
    FROM equipments a
    WHERE a.type_of_equipment_id = ${params.kind}`;

  if (params.suggestion.length > 0) {
    queryText += ' AND a.name LIKE ' + `'` + params.suggestion.trim() + '%' + `'`;
  }

  queryText += ' ORDER BY a.name ASC';
  queryText += ' LIMIT ' + params.rowsCount;

  db.get().getConnection(function (err, connection) {
    connection.query(
      queryText, [],
      function (err, rows) {
        connection.release();

        if (err) {
          throw err;
        }

        if (typeof callback === 'function') {
          callback(null, rows);
        }
      }
    );
  });
};

module.exports.fastFilter = function (params, callback) {
  let queryText = '';
  switch (params.element) {
    case 'workerName':
      queryText = `SELECT a.worker_id AS id, a.name AS value FROM workers a WHERE a.is_deleted = 0`;
      if (params.suggestion.length > 0) {
        queryText += ` AND a.name LIKE '${params.suggestion.trim()}%'`;
      }
      queryText += ` ORDER BY a.name ASC LIMIT ${params.rowsCount}`;
      break;

    case 'serviceName':
      queryText = `SELECT a.service_id AS id, a.full_name AS value FROM services a WHERE a.is_deleted = 0`;
      if (params.suggestion.length > 0) {
        queryText += ` AND a.full_name LIKE '${params.suggestion.trim()}%'`;
      }
      queryText += ` ORDER BY a.full_name ASC LIMIT ${params.rowsCount}`;

    default:
      break;
  }

  db.get().getConnection(function (err, connection) {
    connection.query(
      queryText, [],
      function (err, rows) {
        connection.release();

        if (err) {
          throw err;
        }

        if (typeof callback === 'function') {
          callback(null, rows);
        }
      }
    );
  });
};

module.exports.editEquipment = function (params, callback) {
  let queryText = `UPDATE equipments SET name = '${params.name}' WHERE equipment_id = ${params.id}`;

  db.get().getConnection(function (err, connection) {
    connection.query(
      queryText, [],
      function (err, rows) {
        connection.release();

        if (err) {
          throw err;
        }

        if (typeof callback === 'function') {
          callback(null, {
            operation: 'success'
          });
        }
      }
    );
  });
};

module.exports.addEquipment = function (params, callback) {
  let queryText = `INSERT INTO equipments (name, type_of_equipment_id) VALUES ('${params.name}', ${params.kind})`;

  db.get().getConnection(function (err, connection) {
    connection.query(
      queryText, [],
      function (err, rows) {
        connection.release();

        if (err) {
          throw err;
        }

        if (typeof callback === 'function') {
          callback(null, rows.insertId);
        }
      }
    );
  });
};

function filterVillages(areaId, word, limit) {
  return new Promise(function (resolve, reject) {

    let queryText =
      `SELECT a.parent_id AS areaId, UPPER(b.name) AS areaName, a.city_id AS cityId, UPPER(a.name) AS cityName, a.no_streets AS noStreets, a.no_houses AS noHouses FROM cities a
      LEFT JOIN cities b ON b.city_id = a.parent_id
      WHERE (a.city_id > 0) AND (a.parent_id = ${areaId}) AND (a.is_deleted = 0)`;

    if (word.length > 0) {
      queryText += ` AND (a.name LIKE '${word}%')`;
    }

    queryText += ` ORDER BY a.name ASC LIMIT ${limit}`;

    db.get().getConnection(function (err, connection) {
      connection.query(
        queryText, [],
        function (err, rows) {
          connection.release();

          if (err) {
            reject();
          } else {
            let items = [];
            if (Array.isArray(rows)) {
              items = [...rows];
            }
            resolve(items);
          }
        })
    })
  });
}

function filterCities(word, limit) {
  return new Promise(function (resolve, reject) {

    let queryText =
      `SELECT a.city_id AS cityId, UPPER(a.name) AS cityName, a.parent_id AS parentId, a.is_city AS isCity FROM cities a
      WHERE (a.city_id > 0) AND (a.parent_id = 0) AND (a.is_deleted = 0)`;
    if (word.length > 0) {
      queryText += ` AND (a.name LIKE '${word}%')`;
    }

    queryText += ` ORDER BY is_city DESC, a.name ASC LIMIT ${limit}`;

    db.get().getConnection(function (err, connection) {
      connection.query(
        queryText, [],
        function (err, rows) {
          connection.release();

          if (err) {
            reject();
          } else {
            let items = [];
            if (Array.isArray(rows)) {
              items = [...rows];
            }
            resolve(items);
          }
        })
    })
  });
}

function filterStreets(cityId, streetName, limit) {
  return new Promise(function (resolve, reject) {

    let queryText =
      `SELECT a.street_id AS streetId, UPPER(a.name) AS streetName, UPPER(b.name) AS cityName, b.city_id AS cityId, b.parent_id AS areaId, UPPER(c.name) AS areaName FROM streets a
      LEFT JOIN cities b ON b.city_id = a.city_id
      LEFT JOIN cities c ON c.city_id = b.parent_id
      WHERE (a.city_id = ${cityId}) AND (a.is_deleted = 0) AND (a.name LIKE '${streetName}%')
      ORDER BY a.name ASC LIMIT ${limit}`;

    db.get().getConnection(function (err, connection) {
      connection.query(
        queryText, [],
        function (err, rows) {
          connection.release();

          if (err) {
            reject();
          } else {
            let items = [];
            if (Array.isArray(rows)) {
              items = [...rows];
            }
            resolve(items);
          }
        })
    })
  });
}

function filterHouses(streetId, houseNumber, limit) {
  return new Promise(function (resolve, reject) {

    let queryText =
      `SELECT a.house_id AS houseId, UPPER(a.number) AS houseNumber, b.street_id AS streetId, UPPER(b.name) AS streetName, d.parent_id AS areaId, UPPER(d.name) AS areaName,
      UPPER(c.name) AS cityName, c.city_id AS cityId FROM houses a
      LEFT JOIN streets b ON b.street_id = a.street_id
      LEFT JOIN cities c ON c.city_id = b.city_id
      LEFT JOIN cities d ON d.city_id = c.parent_id
      WHERE (a.street_id = ${streetId}) AND (a.is_deleted = 0) AND (a.number LIKE '${houseNumber}%')
      ORDER BY a.number ASC LIMIT ${limit}`;

    db.get().getConnection(function (err, connection) {
      connection.query(
        queryText, [],
        function (err, rows) {
          connection.release();

          if (err) {
            reject();
          } else {
            let items = [];
            if (Array.isArray(rows)) {
              items = [...rows];
            }
            resolve(items);
          }
        })
    })
  });
}

function findVillageByName(areaId, name) {
  return new Promise(function (resolve, reject) {

    let queryText =
      `SELECT a.city_id AS id, UPPER(a.name), a.is_city AS isCity, a.no_streets AS noStreets, a.no_houses AS noHouses FROM cities a
      WHERE (a.name = '${name}') AND (a.parent_id = ${areaId}) AND (a.is_deleted = 0) LIMIT 1`;

    db.get().getConnection(function (err, connection) {
      connection.query(
        queryText, [],
        function (err, rows) {
          connection.release();

          if (err) {
            reject();
          } else {
            let village = [];
            if (Array.isArray(rows) && (rows.length === 1)) {
              village = {
                ...rows[0]
              };
            }
            resolve(village);
          }
        })
    })
  });
}

function findCityByName(name) {
  return new Promise(function (resolve, reject) {

    let queryText =
      `SELECT a.city_id AS id, UPPER(a.name), a.is_city AS isCity FROM cities a
      WHERE (a.name = '${name}') AND (a.is_deleted = 0) LIMIT 1`;

    db.get().getConnection(function (err, connection) {
      connection.query(
        queryText, [],
        function (err, rows) {
          connection.release();

          if (err) {
            reject();
          } else {
            let city = [];
            if (Array.isArray(rows) && (rows.length === 1)) {
              city = {
                ...rows[0]
              };
            }
            resolve(city);
          }
        })
    })
  });
}

function findStreetByName(cityId, name) {
  return new Promise(function (resolve, reject) {

    let queryText =
      `SELECT a.street_id AS id, UPPER(a.name) FROM streets a
      WHERE (a.name = '${name}') AND (a.is_deleted = 0) AND (a.city_id = ${cityId}) LIMIT 1`;

    db.get().getConnection(function (err, connection) {
      connection.query(
        queryText, [],
        function (err, rows) {
          connection.release();

          if (err) {
            reject();
          } else {
            let street = [];
            if (Array.isArray(rows) && (rows.length === 1)) {
              street = {
                ...rows[0]
              };
            }
            resolve(street);
          }
        })
    })
  });
}

module.exports.getFullAddress2 = async function (params, callback) {
  const words = params.suggestion.split(', ');
  if (!Array.isArray(words)) {
    return;
  }

  let outputData = {
    level: 0,
    items: []
  };

  if (words.length === 1) {

    await filterCities(words[0].trim(), params.limit)
      .then(function (items) {
        outputData.level = 0;
        outputData.items = items;
        callback(null, outputData);
        return;
      })
      .catch(function (error) {
        console.log('Error filterCities: ' + error);
      })
  }

  if (words.length >= 2) {

    let village = {
      id: 0,
      name: '',
      noStreets: 0,
      noHouses: 0
    };
    let city = {
      id: 0,
      isCity: true,
      name: '',
    };
    let street = {
      id: 0,
      name: ''
    };

    await findCityByName(words[0].trim())
      .then(function (data) {
        city = {
          ...data
        };
      })
      .catch(function (error) {
        console.log('Error findCityByName: ' + error);
      })

    if (city.isCity) {
      // City + streets
      if (words.length === 2) {
        await filterStreets(city.id, words[1].trim(), params.limit)
          .then(function (items) {
            outputData.level = 1;
            outputData.items = items;
            callback(null, outputData);
            return;
          })
          .catch(function (error) {
            console.log('Error filterStreets: ' + error);
          })
      }
      // City + street + houses
      if (words.length === 3) {
        await findStreetByName(city.id, words[1].trim())
          .then(function (data) {
            street = {
              ...data
            };
          })
          .catch(function (error) {
            console.log('Error findStreetByName: ' + error);
          })

        await filterHouses(street.id, words[2].trim(), params.limit)
          .then(function (items) {
            outputData.level = 2;
            outputData.items = items;
            callback(null, outputData);
            return;
          })
          .catch(function (error) {
            console.log('Error filterHouses: ' + error);
          })
      }
    } else {
      // Area + villages
      if (words.length === 2) {
        await filterVillages(city.id, words[1].trim(), params.limit)
          .then(function (items) {
            outputData.level = 3;
            outputData.items = items;
            callback(null, outputData);
            return;
          })
          .catch(function (error) {
            console.log('Error filterVillages: ' + error);
          })
      }
      if (words.length === 3) {
        await findVillageByName(city.id, words[1].trim())
          .then(function (data) {
            village = {
              ...data
            };
          })
          .catch(function (error) {
            console.log('Error findVillageByName: ' + error);
          })

        if (!village.noStreets) {
          await filterStreets(village.id, words[2].trim(), params.limit)
            .then(function (items) {
              outputData.items = items;
              return;
            })
            .catch(function (error) {
              console.log('Error filterStreets: ' + error);
            })
        }

        outputData.level = 4;
        callback(null, outputData);
      }
      if (words.length === 4) {
        await findVillageByName(city.id, words[1].trim())
          .then(function (data) {
            village = {
              ...data
            };
          })
          .catch(function (error) {
            console.log('Error findVillageByName: ' + error);
          })

        if ((!village.noStreets) && !(village.noHouses)) {
          await findStreetByName(village.id, words[2].trim())
            .then(function (data) {
              street = {
                ...data
              };
            })
            .catch(function (error) {
              console.log('Error findStreetByName: ' + error);
            })

          await filterHouses(street.id, words[3].trim(), params.limit)
            .then(function (items) {
              outputData.items = items;
            })
            .catch(function (error) {
              console.log('Error filterHouses: ' + error);
            })
        }

        outputData.level = 5;
        callback(null, outputData);
      }
    }

  }

};