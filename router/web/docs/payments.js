const express = require('express');
const moment = require('moment');
const path = require('path');
const PDFDocument = require('pdfkit');
const SVGtoPDF = require('svg-to-pdfkit');
const barcode = require('pure-svg-code/barcode');
const qrcode = require('pure-svg-code/qrcode');

const db = require('../../../lib/db');
const { visibleRows } = require('../../../lib/config').config;
const { daysToPayReceipt } = require('../../../lib/config').config;
const { MakePayments } = require('../../../lib/make-payments');
const firmBankDetails = require('../../../lib/firm_bank_details').firm;
const utils = require('../../../lib/utils');
const verifications = require('../../common/verifications');
const { PaymentModel } = require('../../../models/payment');
const { PaymentsLogic } = require('../../../logic/docs/payments');
const { rowsLimit } = require('../../../lib/config');
const typeahead = require('../../common/typeheads');
const apartment = require('../../common/apartments');
const sp = require('../../common/stored_procedures');
const logger = require('../../../lib/winston');

function printReceipt(model, res) {
  const fullApartmentNumber = `${model.apartment.number}${utils.decodeApartmentLetter(Number(model.apartment.letter))}`;

  // const amount = parseFloat(model.amount).toString().trim();
  let subtotal = parseFloat(model.amount) + parseFloat(model.apartment.debt);
  if (subtotal < 0) {
    subtotal = 0.00;
  }
  const subtotalStr = subtotal.toString().trim();
  let rpts = 5 - (subtotalStr.length);
  const outSum = (rpts > 0 ? '0'.repeat(rpts) : '') + subtotalStr;

  const sum = subtotal * 100;

  rpts = 6 - (model.contract.prolonged.trim().length);
  const outContractNumber = (rpts > 0 ? '0'.repeat(rpts) : '') + model.contract.prolonged.trim();

  rpts = (3 - model.apartment.number.trim().length);
  const outApartment = (rpts > 0 ? '0'.repeat(rpts) : '') + model.apartment.number.trim();

  // BarCode and QRCode
  const barCodeData = [];
  barCodeData.push(firmBankDetails.payeeINN);
  barCodeData.push(model.payMonth < 10 ? `0${model.payMonth}` : model.payMonth.toString());
  barCodeData.push((Number(model.payYear) - 2000) < 10 ? `0${Number(model.payYear) - 2000}` : (Number(model.payYear) - 2000).toString());
  barCodeData.push(outSum);
  barCodeData.push('00');
  barCodeData.push(model.isDuplicate ? '1' : '0');
  barCodeData.push(outContractNumber);
  barCodeData.push(model.apartment.letter);
  barCodeData.push(outApartment);
  const outBarcode = barCodeData.join('');

  const clientAccountData = [];
  clientAccountData.push(model.isDuplicate ? '1' : '0');
  clientAccountData.push(outContractNumber);
  clientAccountData.push(model.apartment.letter);
  clientAccountData.push(outApartment);
  const clientAccount = clientAccountData.join('');

  const contentData = [];
  // contentData.push('ST00012|');
  contentData.push('ST00011|');
  contentData.push(`Name=${firmBankDetails.name}|`);
  contentData.push(`PersonalAcc=${firmBankDetails.personalAcc}|`);
  contentData.push(`BankName=${firmBankDetails.bankName}|`);
  contentData.push(`BIC=${firmBankDetails.bic}|`);
  contentData.push(`CorrespAcc=${firmBankDetails.correspAcc}|`);
  contentData.push(`PersAcc=${clientAccount}|`);
  contentData.push(`Category=${firmBankDetails.category}|`);
  contentData.push(`TechCode=${firmBankDetails.techCode}|`);
  contentData.push(`PayeeINN=${firmBankDetails.payeeINN}|`);

  contentData.push(`Sum=${sum.toString()}`);
  const content = contentData.join('');

  let deadline = '';
  if (model.contract.startService != null) {
    deadline = moment(model.contract.startService).add(daysToPayReceipt, 'days').format('DD.MM.YYYY');
  }

  // Generate pdf
  const filename = 'receipt.pdf';
  res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-type', 'application/pdf');

  const vkImage = path.join(__dirname, '../../../public/images/vk_logo_icon.jpg');
  const adImage = path.join(__dirname, '../../../public/images/new_logo_2.jpg');

  const doc = new PDFDocument();
  doc.margins = {
    top: 14,
    bottom: 0,
    left: 0,
    right: 0,
  };

  doc.layout = 'portrait'; // 'landscape'

  doc.registerFont('Arial', 'fonts//arial.ttf');
  doc.registerFont('ArialBold', 'fonts//arialbd.ttf');

  doc.fontSize(8);

  // First third

  doc.font('ArialBold');
  doc.text(`OOO «ДOМОФОН-СЕРВИС»  ${model.contract.city.phone}`, 134, 28, { align: 'left', width: 183 });

  doc.font('Arial');
  doc.text('(наименование получателя платежа)', 134, 38, { align: 'left' });
  doc.text('Форма № ПД-4', 489, 28, { align: 'right', linebreak: false, width: 66 });

  doc.text('6027089952', 134, 54, { align: 'center', width: 105 });
  doc.text('(ИНН получателя платежа)', 134, 64, { align: 'center', width: 105 });

  doc.text('40702810351000104846', 321, 54, { align: 'center', width: 198 });
  doc.text('(номер счета получателя платежа)', 321, 64, { align: 'center', width: 198 });

  doc.text('Отделение № 8630 Сбербанка России, г. Псков', 134, 75, { align: 'left', width: 184, underline: true });
  doc.text('БИК', 321, 75, { align: 'center', width: 27 });
  doc.text('045805602', 348, 75, { align: 'center', width: 66 });

  doc.text('л/с', 423, 75, { align: 'center', width: 27 });
  doc.text(clientAccount, 450, 75, { align: 'center', width: 69 });

  doc.text('(наименование банка получателя платежа)', 134, 85, { align: 'left', width: 183 });

  doc.text('Номер кор./сч. банка получателя платежа', 134, 99, { align: 'right', width: 183 });
  doc.text('30101810300000000602', 321, 99, { align: 'center', width: 198 });

  doc.font('ArialBold');
  doc.text(`Оплата за ГОДОВОЕ обслуживание домофона с ${moment(model.contract.startService).format('DD.MM.YYYY')} по ${moment(model.contract.endService).format('DD.MM.YYYY')} г., (Договор № ${model.contract.prolonged})`, 134, 114, { align: 'left', width: 419 });

  doc.font('Arial');
  doc.text('(наименование платежа)', 134, 123, { align: 'center', width: 419 });

  doc.text('Адрес плательщика', 134, 139, { align: 'left', width: 79 });

  doc.font('ArialBold')
    .fontSize(10)
    .text(`${model.fullAddress}, кв. ${fullApartmentNumber}`, 218, 137, { align: 'left', width: 335 });

  doc.font('Arial')
    .fontSize(11)
    .text('Сумма платежа, руб.', 134, 152, { align: 'left', width: 342 })
    .text(parseFloat(model.amount).toFixed(2), 480, 152, { align: 'left', width: 72 });

  if (model.apartment.debt !== 0) {
    doc
      .text(`Задолженность за период с ${moment(model.contract.startService).subtract(1, 'years').format('DD.MM.YYYY')} по ${moment(model.contract.endService).subtract(1, 'years').format('DD.MM.YYYY')}, руб.`, 134, 165, { align: 'left', width: 342 })
      .text(parseFloat(model.apartment.debt).toFixed(2), 480, 165, { align: 'left', width: 72 });
  }

  doc.font('ArialBold')
    .fontSize(11)
    .text('К оплате, руб.', 134, 178, { align: 'left', width: 342 })
    .text(parseFloat(model.amount + model.apartment.debt).toFixed(2), 480, 178, { align: 'left', width: 72 })

    .fontSize(10)
    .text(model.contract.city.vkAddress, 150, 193, { align: 'left', width: 108 });

  doc.font('Arial')
    .fontSize(9)
    .text('Подпись плательщика', 347, 193, { align: 'right', width: 99 });

  doc.image(vkImage, 134, 193, { width: 12 });

  // Second third
  doc.fontSize(8);
  doc.font('ArialBold');
  doc.text(`OOO «ДOМОФОН-СЕРВИС»  ${model.contract.city.phone}  ${model.contract.city.office}`, 134, 219, { align: 'left', width: 360 });

  doc.font('Arial');
  doc.text('(наименование получателя платежа)', 134, 229, { align: 'left' });
  doc.text('Форма № ПД-4', 489, 219, { align: 'right', linebreak: false, width: 66 });

  doc.text('6027089952', 134, 243, { align: 'center', width: 105 });
  doc.text('(ИНН получателя платежа)', 134, 253, { align: 'center', width: 105 });

  doc.text('КПП', 246, 243, { align: 'right', width: 30 });
  doc.text('602701001', 279, 243, { align: 'center', width: 75 });

  doc.text('40702810351000104846', 360, 243, { align: 'center', width: 195 });
  doc.text('(номер счета получателя платежа)', 360, 253, { align: 'center', width: 195 });

  doc.text('Отделение № 8630 Сбербанка России, г. Псков', 134, 267, { align: 'left', width: 195, underline: true });
  doc.text('БИК', 333, 267, { align: 'center', width: 27 });
  doc.text('045805602', 360, 267, { align: 'center', width: 66 });

  doc.text('л/с', 459, 267, { align: 'center', width: 27 });
  doc.text(clientAccount, 489, 267, { align: 'center', width: 66 });

  doc.text('(наименование банка получателя платежа)', 134, 277, { align: 'left', width: 195 });

  doc.text('Номер кор./сч. банка получателя платежа', 134, 291, { align: 'right', width: 183 });
  doc.text('30101810300000000602', 321, 291, { align: 'center', width: 198 });

  doc.font('ArialBold');
  doc.text(`Оплата за ГОДОВОЕ обслуживание домофона с ${moment(model.contract.startService).format('DD.MM.YYYY')} по ${moment(model.contract.endService).format('DD.MM.YYYY')} г., (Договор № ${model.contract.prolonged})`, 134, 305, { align: 'left', width: 419 });

  doc.font('Arial');
  doc.text('(наименование платежа)', 134, 314, { align: 'center', width: 419 });

  doc.text('Адрес плательщика', 134, 326, { align: 'left', width: 79 });

  doc.font('ArialBold')
    .fontSize(10)
    .text(`${model.fullAddress}, кв. ${fullApartmentNumber}`, 218, 323, { align: 'left', width: 335 });

  doc.fontSize(8)
    .font('ArialBold')
    .text(`К оплате ${parseFloat(model.amount + model.apartment.debt).toFixed(2)}, руб.`, 134, 337, { align: 'left', width: 255 });

  doc.fontSize(9)
    .font('Arial')
    .text('Оплачено', 396, 337, { align: 'right', width: 51 });

  doc.fontSize(8)
    .font('ArialBold')
    .text(`ОПЛАТИТЬ ДО ${deadline} г.`, 134, 352, { align: 'left', width: 189 });

  doc
    .moveTo(132, 350)
    .lineTo(323, 350)
    .lineTo(323, 364)
    .lineTo(132, 364)
    .lineTo(132, 350)
    .stroke();

  doc.fontSize(9)
    .font('Arial')
    .text('Подпись плательщика', 348, 352, { align: 'right', width: 99 });

  doc.image(vkImage, 134, 369, { width: 12 });

  const y = Number(model.contract.city.printType) === 1 ? 348 : 338;
  doc.font('ArialBold')
    .fontSize(10)
    .text(model.contract.city.vkAddress, 149, 369, { align: 'left', width: 108 })

    .fontSize(16)
    .text(`Тел. ${model.contract.city.phone}`, 15, y, { align: 'center', width: 102 })
    // .text('Тел. ' + model.contract.city.phone, 15, 348, { align: 'center', width: 102 })

    .fontSize(11)
    .text('domofon@mail.ru', 15, 378, { align: 'center', width: 102 });
  // .text('domofon@mail.ru', 15, 374, { align: 'center', width: 102 });

  doc.image(adImage, 15, 222, { width: 100 });

  // Last third

  doc.font('Arial')
    .fontSize(8);

  doc.moveTo(453, 203) // Подпись плательщика
    .lineTo(564, 203)
    .stroke();

  doc.moveTo(453, 347) // Оплачено
    .lineTo(564, 347)
    .stroke();

  doc.moveTo(453, 362) // Подпись плательщика
    .lineTo(564, 362)
    .stroke();

  // Вертикальная большая линия
  doc.moveTo(126, 22)
    .lineTo(126, 398)
    .stroke();

  // Горизонтальная большая линия
  doc.moveTo(9, 211) // Подпись плательщика
    .lineTo(564, 211)
    .stroke();

  doc
    .rect(134, 52, 105, 12) // x, y, width, height
    .dash(1, { space: 1 })
    .stroke();

  doc
    .rect(321, 52, 198, 12)
    .dash(1, { space: 1 })
    .stroke();

  doc
    .rect(348, 73, 66, 12)
    .dash(1, { space: 1 })
    .stroke();

  doc
    .rect(450, 73, 69, 12)
    .dash(1, { space: 1 })
    .stroke();

  doc
    .rect(321, 97, 198, 12)
    .dash(1, { space: 1 })
    .stroke();

  doc
    .rect(134, 241, 105, 12)
    .dash(1, { space: 1 })
    .stroke();

  doc
    .rect(279, 241, 75, 12)
    .dash(1, { space: 1 })
    .stroke();

  doc
    .rect(360, 241, 195, 12)
    .dash(1, { space: 1 })
    .stroke();

  doc
    .rect(360, 267, 66, 12)
    .dash(1, { space: 1 })
    .stroke();

  doc
    .rect(489, 267, 66, 12)
    .dash(1, { space: 1 })
    .stroke();

  doc
    .rect(321, 289, 198, 12)
    .dash(1, { space: 1 })
    // .fill('red')
    .stroke();

  const barcodeOptions = { width: 158, height: 20 };
  const barCode = barcode(outBarcode, 'code128', { width: 158, barWidth: 0.6, barHeight: 20 });
  SVGtoPDF(doc, barCode, 321, 20, barcodeOptions);
  doc.fontSize(8)
    .font('Arial')
    .text(outBarcode, 321, 40, { align: 'center', width: 158 });

  const qrOptions = { width: 126, height: 126 };
  const qrCode = qrcode({
    content,
    padding: 0,
    width: 126,
    height: 126,
    color: '#000000',
    background: '#ffffff',
    ecl: 'M',
  });

  SVGtoPDF(doc, qrCode, 16, 56, qrOptions);

  doc.pipe(res);
  doc.end();
}

function getApartmentDebt(apartmentId) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        'CALL find_out_debt(?)', [apartmentId],
        (error, rows) => {
          connection.release();
          if (error) {
            reject();
          } else {
            resolve({ debt: rows[0][0].debt, way: rows[0][0].way });
          }
        },
      );
    });
  });
}

function getOrderIsActive(cardId) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        'SELECT (a.maintenance_contract = 1) AS isActive FROM cards a WHERE a.card_id = ?', [cardId],
        (error, rows) => {
          connection.release();
          if (error) {
            reject();
          } else if (rows.length === 0) {
            resolve({ isActive: 0 });
          } else {
            resolve({ isActive: rows[0].isActive === 1 });
          }
        },
      );
    });
  });
}

function getCityInfo(cardId) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        'CALL get_city_info(?)', [cardId],
        (error, rows) => {
          connection.release();
          if (error) {
            reject();
          } else {
            resolve({
              printType: rows[0][0].printType,
              cityName: rows[0][0].cityName.trim(),
              phone: rows[0][0].phone.trim(),
              vkAddress: rows[0][0].vkAddress.trim(),
              office: rows[0][0].officeAddress.trim(),
            });
          }
        },
      );
    });
  });
}

function updatePayment(data) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        `UPDATE payments
        SET create_date = ?,
        apartment_id = ?,
        pay_month = ?,
        pay_year = ?,
        amount = ?,
        pay_date = ?,
        mode = ?,
        is_registered = ?
        WHERE payment_id = ?`, [
          data.createDate,
          data.apartment.id,
          data.payMonth,
          data.payYear,
          data.amount,
          data.payDate,
          data.mode,
          data.isRegistered,
          data.id,
        ],
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

function savePayment(data) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        `INSERT INTO payments (
        create_date, apartment_id, pay_month, pay_year, amount, pay_date, mode, is_registered)
        VALUES (?,?,?,?,?,?,?,?)`, [
          data.createDate,
          data.apartment.id,
          data.payMonth,
          data.payYear,
          data.amount,
          data.payDate,
          data.mode,
          data.isRegistered,
        ],
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

function deletePayment(paymentId) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        'UPDATE payments SET is_deleted = 1, delete_dt = NOW() WHERE payment_id = ?', [paymentId],
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

// function getApartmentFromPayment(paymentId) {
//   return new Promise((resolve, reject) => {
//     db.get().getConnection((err, connection) => {
//       connection.query(
//         'SELECT apartment_id AS apartmentId FROM payments WHERE payment_id = ?', [paymentId],
//         (error, rows) => {
//           connection.release();
//           if (error) {
//             reject();
//           } else {
//             resolve({ ...rows[0] });
//           }
//         },
//       );
//     });
//   });
// }

function savePaymentsHistory(data) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        'INSERT INTO payments_history (create_dt, comment) values (NOW(), ?)', [data],
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

function saveToLog(model, index) {
  if (model instanceof PaymentModel) {
    let descriptionOfOperation = '';
    switch (index) {
      case 0:
        descriptionOfOperation = 'Удаление платежа';
        break;
      case 1:
        descriptionOfOperation = 'Новый платеж';
        break;
      case 2:
        descriptionOfOperation = 'Изменение платежа';
        break;
      default:
        break;
    }

    logger.info();
    logger.info('');
    logger.info(`Платеж. ${descriptionOfOperation}`);
    logger.info(`Договор ТО № ${model.contract.prolonged}`);
    logger.info(`Квартира   : ${model.apartment.number}${utils.decodeApartmentLetter(model.apartment.letter)}`);
    logger.info(`Сумма      : ${model.amount.toFixed(2)}`);
    logger.info(`ID платежа : ${model.id}`);
    logger.info('');
  }
}

function getData(id) {
  return new Promise((resolve, reject) => {
    db.get().getConnection((err, connection) => {
      connection.query(
        `SELECT a.payment_id AS id,
        a.create_date AS createDate,
        a.apartment_id AS apartmentId,
        a.pay_month AS payMonth,
        a.pay_year AS payYear,
        a.amount,
        a.pay_date AS payDate,
        a.mode,
        a.transaction,
        a.zip_code AS zipCode,
        a.file_name AS fileName,
        a.is_registered AS isRegistered,
        b.number,
        b.letter,
        c.card_id AS cardId,
        c.contract_number AS contractNumber,
        c.m_contract_number AS prolongedContractNumber,
        c.start_service AS startService,
        c.end_service AS endService,
        c.m_duplicate AS isDuplicate,
        c.receipt_printing AS receiptPrint,
        d.name AS cityName,
        e.name AS streetName,
        f.number AS houseNumber
        FROM payments a
        LEFT JOIN apartments b ON b.apartment_id = a.apartment_id
        LEFT JOIN cards c ON c.card_id = b.card_id
        LEFT JOIN cities d ON d.city_id = c.city_id
        LEFT JOIN streets e ON e.street_id = c.street_id
        LEFT JOIN houses f ON f.house_id = c.house_id
        WHERE a.payment_id = ?`, [id], (error, rows) => {
          connection.release();
          if (error) {
            reject();
          } else {
            const paymentModel = new PaymentModel();
            const data = rows[0];
            paymentModel.id = data.id;
            paymentModel.createDate = data.createDate;
            paymentModel.apartment.id = data.apartmentId;
            paymentModel.apartment.number = data.number;
            paymentModel.apartment.letter = data.letter;
            paymentModel.amount = data.amount;
            paymentModel.transaction = data.transaction;
            paymentModel.payDate = data.payDate;
            paymentModel.mode = data.mode;
            paymentModel.zipCode = data.zipCode;
            paymentModel.fileName = data.fileName;
            paymentModel.isRegistered = data.isRegistered;

            paymentModel.contract.id = data.cardId;
            paymentModel.contract.normal = data.contractNumber;
            paymentModel.contract.prolonged = data.prolongedContractNumber;
            paymentModel.contract.startService = data.startService;
            paymentModel.contract.endService = data.endService;
            paymentModel.contract.isDuplicate = data.isDuplicate;
            paymentModel.fullAddress = data.cityName.trim()
              + (data.streetName.trim() !== '' ? (`, ${data.streetName.trim()}`) : '')
              + (data.houseNumber.trim() !== '' ? (`, ${data.houseNumber.trim()}`) : '');

            resolve(paymentModel);
          }
        },
      );
    });
  });
}

module.exports = () => {
  const router = express.Router();

  router.get('/', (req, res) => {
    let pageCount = 0;
    db.get().getConnection((err, connection) => {
      connection.query(
        'SELECT COUNT(*) AS count FROM payments WHERE is_deleted = 0', [], (error, rows) => {
          connection.release();
          pageCount = (rows[0].count / visibleRows) < 1
            ? 0
            : Math.ceil(rows[0].count / visibleRows);

          db.get().getConnection((error1, connection1) => {
            connection1.query(
              `SELECT
              a.payment_id AS id,
              a.create_date AS createDate,
              a.amount,
              a.pay_date AS payDate,
              a.mode,
              a.is_registered AS isRegistered,
              b.number,
              b.letter,
              c.contract_number AS contractNumber,
              c.m_contract_number AS prolongedContractNumber,
              d.name AS cityName,
              e.name AS streetName,
              f.number AS houseNumber,
              c.porch
              FROM
              payments a
              LEFT JOIN apartments b ON b.apartment_id = a.apartment_id
              LEFT JOIN cards c ON c.card_id = b.card_id
              LEFT JOIN cities d ON d.city_id = c.city_id
              LEFT JOIN streets e ON e.street_id = c.street_id
              LEFT JOIN houses f ON f.house_id = c.house_id
              WHERE
              a.is_deleted = 0
              ORDER BY
              a.pay_date DESC,
              a.payment_id DESC
              LIMIT ?`, [visibleRows], (error2, rows2) => {
                if (error2) {
                  throw error2;
                }
                connection1.release();
                const currentPage = 1;
                res.render('docs/payments.ejs', {
                  title: 'Платежи',
                  data: rows2,
                  pageCount,
                  currentPage,
                  visibleRows,
                  moment,
                  utils,
                  user: req.session.userName,
                });
              },
            );
          });
        },
      );
    });
  });

  router.get('/edit/:id', (req, res) => {
    const paymentModel = new PaymentModel();
    const { id } = req.params;
    db.get().getConnection((err, connection) => {
      connection.query(
        `SELECT a.payment_id AS id,
        a.create_date AS createDate,
        a.apartment_id AS apartmentId,
        a.pay_month AS payMonth,
        a.pay_year AS payYear,
        a.amount,
        a.pay_date AS payDate,
        a.mode,
        a.transaction,
        a.zip_code AS zipCode,
        a.file_name AS fileName,
        a.is_registered AS isRegistered,
        b.number,
        b.letter,
        c.card_id AS cardId,
        c.contract_number AS contractNumber,
        c.m_contract_number AS prolongedContractNumber,
        c.start_service AS startService,
        c.end_service AS endService,
        c.m_duplicate AS isDuplicate,
        c.receipt_printing AS receiptPrint,
        d.name AS cityName,
        e.name AS streetName,
        f.number AS houseNumber
        FROM payments a
        LEFT JOIN apartments b ON b.apartment_id = a.apartment_id
        LEFT JOIN cards c ON c.card_id = b.card_id
        LEFT JOIN cities d ON d.city_id = c.city_id
        LEFT JOIN streets e ON e.street_id = c.street_id
        LEFT JOIN houses f ON f.house_id = c.house_id
        WHERE a.payment_id = ?`, [id], (error, rows) => {
          connection.release();
          if (error) {
            // eslint-disable-next-line no-console
            console.error(error);
            res.status(500).send({
              code: 500,
              msg: 'Database error',
            });
          } else {
            if (rows[0].length === 0) {
              // FIXME: not found
            }

            const data = rows[0];
            paymentModel.id = data.id;
            paymentModel.createDate = data.createDate;
            paymentModel.apartment.id = data.apartmentId;
            paymentModel.apartment.number = data.number;
            paymentModel.apartment.letter = data.letter;
            paymentModel.amount = data.amount;
            paymentModel.transaction = data.transaction;
            paymentModel.payDate = data.payDate;
            paymentModel.mode = data.mode;
            paymentModel.zipCode = data.zipCode;
            paymentModel.fileName = data.fileName;
            paymentModel.isRegistered = data.isRegistered;

            paymentModel.contract.id = data.cardId;
            paymentModel.contract.normal = data.contractNumber;
            paymentModel.contract.prolonged = data.prolongedContractNumber;
            paymentModel.contract.startService = data.startService;
            paymentModel.contract.endService = data.endService;
            paymentModel.contract.isDuplicate = data.isDuplicate;
            paymentModel.fullAddress = data.cityName.trim()
              + (data.streetName.trim() !== '' ? (`, ${data.streetName.trim()}`) : '')
              + (data.houseNumber.trim() !== '' ? (`, ${data.houseNumber.trim()}`) : '');

            res.render('docs/forms/payment.ejs', {
              title: 'Платеж',
              data: paymentModel,
              errors: {},
              moment,
              utils,
              user: req.session.userName,
            });
          }
        },
      );
    });
  });

  router.get('/add', (req, res) => {
    const paymentModel = new PaymentModel();
    res.render('docs/forms/payment.ejs', {
      title: 'Платеж',
      data: paymentModel,
      errors: {},
      moment,
      utils,
      user: req.session.userName,
    });
  });

  router.get('/table', (req, res) => {
    const { id } = req.query;
    db.get().getConnection((err, connection) => {
      connection.query(
        ' SELECT'
        + ' a.payment_id AS id,'
        + ' DATE_FORMAT(a.create_date, \'%d.%m.%Y\') AS createDate,'
        + ' a.pay_month,'
        + ' a.pay_year,'
        + ' DATE_FORMAT(a.pay_date, \'%d.%m.%Y\') AS pay_date,'
        + ' a.amount,'
        + ' a.mode,'
        + ' c.m_contract_number,'
        + ' d.name as org_name'
        + ' FROM payments a'
        + ' LEFT JOIN apartments b ON b.apartment_id = a.apartment_id'
        + ' LEFT JOIN cards c ON c.card_id = b.card_id'
        + ' LEFT JOIN organizations d ON d.organization_id = a.mode'
        + ' WHERE'
        + ' a.apartment_id = ?'
        + ' ORDER BY'
        + ' a.pay_date DESC', [id], (error, rows) => {
          if (error) {
            throw error;
          }
          connection.release();
          res.status(200).send({ table: rows });
        },
      );
    });
  });

  router.get('/load', async (req, res) => {
    const destination = path.join(__dirname, '../../../public/in/');

    const makePayments = new MakePayments();
    await makePayments.start(destination, (error, data) => {
      savePaymentsHistory(data)
        .then(
          res.redirect('/payments'),
        )
        .catch((err) => {
          res.status(500).send(err.message);
        });
    });
  });

  router.get('/:offset', (req, res) => {
    let offset = +req.params.offset;
    let pageCount = 0;
    db.get().getConnection((err, connection) => {
      connection.query(
        'SELECT COUNT(*) AS count FROM payments WHERE is_deleted = 0', [], (error, rows) => {
          connection.release();
          pageCount = (rows[0].count / visibleRows) < 1
            ? 0
            : Math.ceil(rows[0].count / visibleRows);
          if ((offset > pageCount * visibleRows)) {
            offset = (pageCount - 1) * visibleRows;
          }

          db.get().getConnection((error1, connection1) => {
            connection1.query(
              `SELECT
              a.payment_id AS id,
              a.create_date AS createDate,
              a.amount,
              a.pay_date AS payDate,
              a.mode,
              a.is_registered AS isRegistered,
              b.number,
              b.letter,
              c.card_id AS cardId,
              c.contract_number AS contractNumber,
              c.m_contract_number AS prolongedContractNumber,
              d.name AS cityName,
              e.name AS streetName,
              f.number AS houseNumber,
              c.porch
              FROM
              payments a
              LEFT JOIN apartments b ON b.apartment_id = a.apartment_id
              LEFT JOIN cards c ON c.card_id = b.card_id
              LEFT JOIN cities d ON d.city_id = c.city_id
              LEFT JOIN streets e ON e.street_id = c.street_id
              LEFT JOIN houses f ON f.house_id = c.house_id
              WHERE
              a.is_deleted = 0
              ORDER BY
              a.pay_date DESC,
              a.payment_id DESC
              LIMIT ?
              OFFSET ?`, [visibleRows, offset], (error2, rows2) => {
                connection1.release();
                if (error2) {
                  throw error2;
                }

                const currentPage = Math.ceil(offset / visibleRows) + 1;
                res.render('docs/payments.ejs', {
                  title: 'Платежи',
                  data: rows2,
                  pageCount,
                  currentPage,
                  visibleRows,
                  moment,
                  utils,
                  user: req.session.userName,
                });
              },
            );
          });
        },
      );
    });
  });

  router.post('/save', async (req, res) => {
    const paymentModel = new PaymentModel();
    paymentModel.id = req.body.id;
    paymentModel.createDate = ((req.body.createDate != null) && (req.body.createDate.trim().length > 0)) ? moment(req.body.createDate, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;
    paymentModel.apartment.number = req.body.apartment;
    paymentModel.apartment.letter = req.body.letter;
    paymentModel.mode = req.body.paymentType;
    paymentModel.amount = Number.isNaN(parseFloat(req.body.amount))
      ? 0
      : parseFloat(req.body.amount);
    paymentModel.payDate = ((req.body.dateOfPayment != null) && (req.body.dateOfPayment.trim().length > 0)) ? moment(req.body.dateOfPayment, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;

    paymentModel.contract.id = req.body.cardId;
    paymentModel.contract.normal = req.body.contract;
    paymentModel.contract.prolonged = req.body.extendedContract;
    paymentModel.contract.startService = ((req.body.startService != null) && (req.body.startService.trim().length > 0)) ? moment(req.body.startService, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;
    paymentModel.contract.endService = ((req.body.endService != null) && (req.body.endService.trim().length > 0)) ? moment(req.body.endService, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;
    paymentModel.contract.isDuplicate = Number(req.body.duplicate);
    paymentModel.contract.receiptPrint = req.body.receiptPrint;
    paymentModel.fullAddress = req.body.fullAddress;
    paymentModel.barcode = req.body.barcode;
    paymentModel.isRegistered = req.body.isRegistered ? 1 : 0;
    paymentModel.allowZeroAmount = req.body.allowZeroAmount ? 1 : 0;

    req.assert('createDate', 'Дата создания не заполнена').notEmpty();
    req.assert('cardId', 'Договор с таким номером не существует').custom((data) => Number(data) > 0);
    req.assert('extendedContract', 'Договор ТО не заполнен').notEmpty();
    req.assert('apartment', 'Квартира не заполнена').notEmpty();

    // TODO: Refactoring, replace with common/verifications.validApartment
    const result = await verifications.validApartment(
      paymentModel.apartment.number,
      paymentModel.apartment.letter,
      paymentModel.contract.normal,
    );
    if (result.isExists) {
      paymentModel.apartment.id = result.id;
    } else {
      req.assert('apartment', 'Номер квартиры вне диапазона квартир договора').custom(() => result.isExists);
    }

    await getOrderIsActive(paymentModel.contract.id)
      .then((response) => {
        if (!response.isActive) {
          req.assert('extendedContract', 'Договор не активный!').custom(() => response.isActive);
        }
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.log(error);
      });

    await getCityInfo(paymentModel.contract.id)
      .then((response) => {
        paymentModel.contract.city.printType = response.printType;
        paymentModel.contract.city.name = response.cityName;
        paymentModel.contract.city.phone = response.phone;
        paymentModel.contract.city.vkAddress = response.vkAddress;
        paymentModel.contract.city.office = response.office;
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.log(error);
      });

    if (paymentModel.allowZeroAmount === 0) {
      req.assert('amount', 'Сумма оплаты не заполнена').notEmpty();
      req.assert('amount', 'Сумма должна быть ненулевoй').custom((data) => {
        let out = parseFloat(data);
        if (Number.isNaN(out)) {
          out = 0;
        }
        return out !== 0;
      });
    }
    req.assert('dateOfPayment', 'Дата оплаты не заполнена').notEmpty();

    const errors = req.validationErrors();
    if (!errors) {
      paymentModel.payMonth = moment(paymentModel.payDate).month() + 1;
      paymentModel.payYear = moment(paymentModel.payDate).year();

      if ('printReceipt' in req.body) {
        await getApartmentDebt(paymentModel.apartment.id)
          .then((response) => {
            paymentModel.apartment.debt = response.debt;
            printReceipt(paymentModel, res);
          })
          .catch((error) => {
            // eslint-disable-next-line no-console
            console.log(`Error getApartmentDebt: ${error}`);
          });
      }
      if (+paymentModel.id !== 0) {
        await updatePayment(paymentModel);
        await apartment.convertAnApartment(paymentModel.apartment.id);
        await apartment.getDateOfLastPayment(paymentModel.apartment.id);
        await sp.calcPaymentAndDebt(paymentModel.apartment.id);
        saveToLog(paymentModel, 2);
        res.redirect('/payments');
      } else {
        await savePayment(paymentModel);
        await apartment.convertAnApartment(paymentModel.apartment.id);
        await apartment.getDateOfLastPayment(paymentModel.apartment.id);
        await sp.calcPaymentAndDebt(paymentModel.apartment.id);
        saveToLog(paymentModel, 1);
        res.redirect('/payments');
      }
    } else {
      res.render('docs/forms/payment.ejs', {
        title: 'Платеж',
        data: paymentModel,
        errors,
        moment,
        utils,
        user: req.session.userName,
      });
    }
  });

  router.post('/delete', async (req, res) => {
    if ((req.body.id) && (Number.isFinite(+req.body.id))) {
      const paymentModel = await getData(+req.body.id);
      const apartmentId = paymentModel.apartment.id;
      await deletePayment(req.body.id);
      await apartment.convertAnApartment(apartmentId);
      await apartment.getDateOfLastPayment(apartmentId);
      await sp.calcPaymentAndDebt(apartmentId);
      saveToLog(paymentModel, 0);
      res.status(200).send({ result: 'OK' });
    } else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  router.post('/find_prolonged_order', (req, res) => {
    const data = req.body;
    if ((data) && (typeof (data) === 'object') && ('suggestion' in data)) {
      const orderNumber = data.suggestion;
      const rowsCount = 'limit' in data ? data.limit : rowsLimit;
      typeahead.filterProlongedOrders(orderNumber, rowsCount, (err, rows) => {
        res.status(200).send(rows);
      });
    } else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  router.post('/parse_barcode', async (req, res) => {
    const paymentsLogic = new PaymentsLogic(req, res);
    const json = await paymentsLogic.parseBarCode(req.body.barcode);
    res.status(200).send(json);
  });

  return router;
};
