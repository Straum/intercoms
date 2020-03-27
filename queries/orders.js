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
    a.maintenance_contract,
    a.attention,
    b.city_id AS cityId,
    b.name AS cityName,
    c.street_id AS streetId,
    c.name AS streetName,
    d.house_id AS houseId,
    d.number AS houseNumber,
    a.porch,
    a.numeration,

    a.client_id,
    f.name AS client_name,
    h.phones,

    a.m_repaid,
    a.m_contract_number,
    a.start_service,
    a.end_service,
    a.m_prolongation,
    a.m_payment,
    a.m_payment_type_id,
    a.m_start_apartment,
    a.m_end_apartment,
    a.normal_payment,
    a.privilege_payment,
    a.receipt_printing,

    a.m_client_id,
    g.name AS m_client_name,
    i.phones AS m_phones,
    a.is_one_person,

    a.contract_info,
    a.service_info
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