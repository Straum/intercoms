const db = require('../../lib/db');

module.exports.updateClient = (client) => {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        `UPDATE clients SET name = ? WHERE client_id = ?`, [client.lastName, client.id], (err) => {
          connection.release();
          if (err) {
            reject();
          } else {
            resolve();
          }
        });
    });
  });
};

module.exports.updateClientFace = (client) => {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        ` UPDATE faces SET
          doc_type_id = ?,
          series = ?,
          number = ?,
          issue_date = ?,
          issue = ?,
          phones = ?
          WHERE client_id = ?`, [
          client.certificate.typeId,
          client.certificate.series,
          client.certificate.number,
          client.certificate.issued,
          client.certificate.department,
          client.certificate.phones,
          client.id
        ], (err) => {
          connection.release();
          if (err) {
            reject();
          } else {
            resolve();
          }
        });
    });
  });
};

module.exports.updateClientRegisteredAddress = (client) => {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        ` UPDATE residence_clients SET
          city_id = ?,
          street_id = ?,
          house_id = ?,
          room_apartment = ?
          WHERE (client_id = ?)
          AND (residence_type_id = ?)`, [
          client.registeredAddress.city.key,
          client.registeredAddress.street.key,
          client.registeredAddress.house.key,
          client.registeredAddress.apartment,
          client.id,
          0,
        ], (err) => {
          connection.release();
          if (err) {
            reject();
          } else {
            resolve();
          }
        }
      );
    });
  });
};

module.exports.updateClientActualAddress = (client) => {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        ` UPDATE residence_clients SET
          city_id = ?,
          street_id = ?,
          house_id = ?,
          room_apartment = ?
          WHERE (client_id = ?)
          AND (residence_type_id = ?)`, [
          client.actualAddress.city.key,
          client.actualAddress.street.key,
          client.actualAddress.house.key,
          client.actualAddress.apartment,
          client.id,
          1,
        ], (err) => {
          connection.release();
          if (err) {
            reject();
          } else {
            resolve();
          }
        }
      );
    });
  });
};

module.exports.addClient = (client) => {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        ` INSERT INTO clients (name)
          VALUES (?)`, [client.lastName], (err, rows) => {
          connection.release();
          if (err) {
            reject();
          } else {
            resolve(rows.insertId);
          }
        });
    });
  });
};

module.exports.addClientFace = (client) => {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        ` INSERT INTO faces (
          doc_type_id,
          series,
          number,
          issue_date,
          issue,
          phones,
          client_id)
          VALUES (?,?,?,?,?,?,?)`,
        [
          client.certificate.typeId,
          client.certificate.series,
          client.certificate.number,
          client.certificate.issued,
          client.certificate.department,
          client.certificate.phones,
          client.id
        ],(err) => {
          connection.release();
          if (err) {
            reject();
          } else {
            resolve();
          }
        });
    });
  });
};

module.exports.addClientRegisteredAddress = (client) => {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        ` INSERT INTO residence_clients (
          city_id,
          street_id,
          house_id,
          room_apartment,
          client_id,
          residence_type_id)
          VALUES (?,?,?,?,?,?)`, [
          client.registeredAddress.city.key,
          client.registeredAddress.street.key,
          client.registeredAddress.house.key,
          client.registeredAddress.apartment,
          client.id,
          0,
        ], (err) => {
          connection.release();
          if (err) {
            reject();
          } else {
            resolve();
          }
        }
      );
    });
  });
};

module.exports.addClientActualAddress = (client) => {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        ` INSERT INTO residence_clients (
          city_id,
          street_id,
          house_id,
          room_apartment,
          client_id,
          residence_type_id)
          VALUES (?,?,?,?,?,?)`, [
          client.actualAddress.city.key,
          client.actualAddress.street.key,
          client.actualAddress.house.key,
          client.actualAddress.apartment,
          client.id,
          1,
        ], (err) => {
          connection.release();
          if (err) {
            reject();
          } else {
            resolve();
          }
        }
      );
    });
  });
};