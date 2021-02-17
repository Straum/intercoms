'use strict';
exports.paymentsByBanks = `
  SELECT
    SUM(CASE WHEN a.mode = 0 THEN a.amount END) AS sberbank,
    SUM(CASE WHEN a.mode = 1 THEN a.amount END) AS kvitanzia,
    SUM(CASE WHEN a.mode = 2 THEN a.amount END) AS vrucnuju,
    SUM(CASE WHEN a.mode = 3 THEN a.amount END) AS rosselhozbank,
    SUM(CASE WHEN a.mode = 4 THEN a.amount END) AS slavia
  FROM
    payments a
  LEFT JOIN apartments b ON b.apartment_id = a.apartment_id
  LEFT JOIN cards c ON c.card_id = b.card_id
  LEFT JOIN cities d ON d.city_id = c.city_id
  WHERE
    (a.pay_date BETWEEN ? AND ?)
  AND
    (d.print_type = ?)
`;