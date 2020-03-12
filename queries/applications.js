exports.getCard = function (kind, houseId, porch) {
    'use strict';
    if (kind === 0) {
        return ` SELECT a.card_id AS cardId, a.contract_number AS contractNumber,
        a.m_contract_number AS mContractNumber,
        a.maintenance_contract AS maintenanceContract FROM cards a
        WHERE (a.house_id = ${houseId}) 
        AND (a.porch = ${porch})
        LIMIT 1`;
    }
    else {
       return ` SELECT a.card_id AS cardId, a.contract_number AS contractNumber,
        a.m_contract_number AS mContractNumber,
        a.maintenance_contract AS maintenanceContract FROM cards a
        WHERE (a.house_id = ${houseId})
        AND (${porch} >= a.m_start_apartment)
        AND (${porch} <= a.m_end_apartment)
        LIMIT 1`;
    }
};