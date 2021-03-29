exports.getCountRecordsUnderRepair =
  `SELECT COUNT(*) AS count
    FROM removed_for_repair a
    WHERE (a.removed_for_repair_id > 0) AND (a.is_done = 0) AND (a.is_deleted = 0)`;

exports.getCountRecordsCompleted =
  `SELECT COUNT(*) AS count
    FROM removed_for_repair a
    WHERE (a.removed_for_repair_id > 0) AND (a.is_done = 1) AND (a.is_deleted = 0)`;

exports.getRecordsUnderRepair =
  `SELECT a.removed_for_repair_id AS id, a.create_date AS createDate, a.office,
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
    WHERE (a.removed_for_repair_id > 0) AND (a.is_deleted = 0) AND (a.is_done = 0)`;


exports.getRecordsCompleted =
  `SELECT a.removed_for_repair_id AS id, a.create_date AS createDate, a.office,
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
    WHERE (a.removed_for_repair_id > 0) AND (a.is_deleted = 0) AND (a.is_done = 1)`;