exports.getCard = function (kind, houseId, porch) {
    'use strict';
    if (kind === 0) {
        return ` SELECT a.card_id AS cardId, a.contract_number AS contractNumber,
        a.m_contract_number AS mContractNumber,
        a.maintenance_contract AS maintenanceContract,
        (DATEDIFF(NOW(), (DATE_ADD(a.create_date, INTERVAL 365 DAY))) < 0) AS isYoungAge
        FROM cards a
        WHERE (a.house_id = ${houseId})
        AND (a.porch = ${porch})
        AND (a.is_deleted = 0)
        ORDER BY a.create_date DESC
        LIMIT 1`;
    }
    else {
       return ` SELECT a.card_id AS cardId, a.contract_number AS contractNumber,
        a.m_contract_number AS mContractNumber,
        a.maintenance_contract AS maintenanceContract,
        (DATEDIFF(NOW(), (DATE_ADD(a.create_date, INTERVAL 365 DAY))) < 0) AS isYoungAge
        FROM cards a
        WHERE (a.house_id = ${houseId})
        AND (${porch} >= a.m_start_apartment)
        AND (${porch} <= a.m_end_apartment)
        AND (a.is_deleted = 0)
        ORDER BY a.create_date DESC
        LIMIT 1`;
    }
};