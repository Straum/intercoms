exports.getOrder = `
  SELECT
    a.card_id AS id,
    a.contract_number AS contractNumber,
    a.create_date AS createDate,
    a.equipment_id AS equipmentId,
    e.name AS equipmentName,
    a.end_contract AS endContract,
    a.credit_to AS creditTo,
    a.repaid,
    a.maintenance_contract AS maintenanceContract,
    a.attention,
    b.city_id AS cityId,
    b.name AS cityName,
    c.street_id AS streetId,
    c.name AS streetName,
    d.house_id AS houseId,
    d.number AS houseNumber,
    a.porch,
    a.numeration,

    a.client_id AS clientId,
    f.name AS clientName,
    h.phones,

    a.m_repaid,
    a.m_contract_number AS serviceNumber,
    a.start_service AS startService,
    a.end_service AS endService,
    a.m_prolongation,
    a.m_payment,
    a.m_payment_type_id,
    a.m_start_apartment AS startApartment,
    a.m_end_apartment AS endApartment,
    a.normal_payment AS normalPayment,
    a.privilege_payment AS privilegePayment,
    a.receipt_printing AS receiptPrinting,

    a.m_client_id AS clientServiceId,
    g.name AS clientServiceName,
    i.phones AS clientServicePhones,
    a.is_one_person AS onePerson,

    a.contract_info AS contractInfo,
    a.service_info AS serviceInfo
  FROM
    cards a
  LEFT JOIN cities b ON a.city_id = b.city_id
  LEFT JOIN streets c ON a.street_id = c.street_id
  LEFT JOIN houses d ON a.house_id = d.house_id
  LEFT JOIN equipments e ON a.equipment_id = e.equipment_id
  LEFT JOIN clients f ON a.client_id = f.client_id
  LEFT JOIN clients g ON a.m_client_id = g.client_id
  LEFT JOIN faces h ON a.client_id = h.client_id
  LEFT JOIN faces i ON a.m_client_id = i.client_id
  WHERE
    a.card_id = ?`;