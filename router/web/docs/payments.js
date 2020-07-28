'use strict';

const express = require('express');
var db = require('../../../lib/db.js');
const visibleRows = require('../../../lib/config').config.visibleRows;
var moment = require('moment');
var utils = require('../../../lib/utils.js');
const path = require('path');
const fs = require('fs');
var iconvlite = require('iconv-lite');
let MakePayments = require('../../../lib/make-payments').MakePayments;
var common = require('../../common/typeheads');
const { PaymentModel } = require('../../models/payment.js');
var PDFDocument = require('pdfkit');

function printReceipt(req, res) {

  var doc = new PDFDocument();
  doc.registerFont('Fuh', 'fonts//DejaVuSans.ttf');
  var filename = 'receipt.pdf';
  res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
  res.setHeader('Content-type', 'application/pdf');

  var vkImage = path.join(__dirname, '../../../public/images/vk_logo_icon.jpg');
  var adImage = path.join(__dirname, '../../../public/images/new_logo_2.jpg');

  doc.margins = {
    top: 14,
    bottom: 0,
    left: 0,
    right: 0
  };

  doc.layout = 'portrait', // 'landscape'

    doc.registerFont('Arial', 'fonts//arial.ttf');
  doc.registerFont('ArialBold', 'fonts//arialbd.ttf');

  doc.fontSize(8);

  //   info: {
  //     Title: 'title',
  //     Author: 'author', // the name of the author
  //     Subject: '', // the subject of the document
  //     Keywords: 'pdf;javascript'; // keywords associated with the document
  //     CreationDate: 'DD/MM/YYYY', // the date the document was created (added automatically by PDFKit)
  //     ModDate: 'DD/MM/YYYY' // the date the document was last modified
  // }

  // First third

  doc.font('ArialBold');
  doc.text('OOO «ДOМОФОН-СЕРВИС»   72-10-10', 134, 28, { align: 'left', width: 183 });

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
  doc.text('00103370254', 450, 75, { align: 'center', width: 69 });

  doc.text('(наименование банка получателя платежа)', 134, 85, { align: 'left', width: 183 });

  doc.text('Номер кор./сч. банка получателя платежа', 134, 99, { align: 'right', width: 183 });
  doc.text('30101810300000000602', 321, 99, { align: 'center', width: 198 });

  doc.font('ArialBold');
  doc.text('Оплата за ГОДОВОЕ обслуживание домофона с 06.08.2020 по 06.08.2021 г., (Договор № 100337)', 134, 114, { align: 'left', width: 419 });

  doc.font('Arial');
  doc.text('(наименование платежа)', 134, 123, { align: 'center', width: 419 });

  doc.text('Адрес плательщика', 134, 139, { align: 'left', width: 79 });

  doc.font('ArialBold')
    .fontSize(10)
    .text('г. ПСКОВ, ул. ТРУДА, д. 50, кв. 254', 218, 137, { align: 'left', width: 335 });

  doc.font('Arial')
    .fontSize(11)
    .text('Сумма платежа, руб.', 134, 152, { align: 'left', width: 342 })
    .text('580.00', 480, 152, { align: 'left', width: 72 })
    .text('Задолженность за период с 06.08.2019 по 06.08.2020, руб.', 134, 165, { align: 'left', width: 342 })
    .text('0.00', 480, 165, { align: 'left', width: 72 });

  doc.font('ArialBold')
    .fontSize(11)
    .text('К оплате, руб.', 134, 178, { align: 'left', width: 342 })
    .text('580.00', 480, 178, { align: 'left', width: 72 })

    .fontSize(10)
    .text('vk.com/safetypskov', 150, 193, { align: 'left', width: 108 });

  doc.font('Arial')
    .fontSize(9)
    .text('Подпись плательщика', 347, 193, { align: 'right', width: 99 });

  doc.image(vkImage, 134, 193, { width: 12 });

  // Second third
  doc.fontSize(8);
  doc.font('ArialBold');
  doc.text('OOO «ДOМОФОН-СЕРВИС»   72-10-10', 134, 219, { align: 'left', width: 183 });

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
  doc.text('00103370254', 489, 267, { align: 'center', width: 66 });

  doc.text('(наименование банка получателя платежа)', 134, 277, { align: 'left', width: 195 });

  doc.text('Номер кор./сч. банка получателя платежа', 134, 291, { align: 'right', width: 183 });
  doc.text('30101810300000000602', 321, 291, { align: 'center', width: 198 });

  doc.font('ArialBold');
  doc.text('Оплата за ГОДОВОЕ обслуживание домофона с 06.08.2020 по 06.08.2021 г., (Договор № 100337)', 134, 305, { align: 'left', width: 419 });

  doc.font('Arial');
  doc.text('(наименование платежа)', 134, 314, { align: 'center', width: 419 });

  doc.text('Адрес плательщика', 134, 326, { align: 'left', width: 79 });

  doc.font('ArialBold')
    .fontSize(10)
    .text('г. ПСКОВ, ул. ТРУДА, д. 50, кв. 254', 218, 323, { align: 'left', width: 335 });

  doc.fontSize(8)
    .font('ArialBold')
    .text('К оплате 580.00, руб.', 134, 337, { align: 'left', width: 255 });

  doc.fontSize(9)
    .font('Arial')
    .text('Оплачено', 396, 337, { align: 'right', width: 51 });

  doc.fontSize(8)
    .font('ArialBold')
    .text('ОПЛАТИТЬ ДО 20.09.2020 г.', 134, 352, { align: 'left', width: 189 });

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

  doc.font('ArialBold')
    .fontSize(10)
    .text('vk.com/safetypskov', 149, 369, { align: 'left', width: 108 })

    .fontSize(16)
    .text('Тел. 72-10-10', 15, 348, { align: 'center', width: 102 })

    .fontSize(11)
    .text('domofon@mail.ru', 15, 374, { align: 'center', width: 102 });

  doc.image(adImage, 15, 222, { width: 100 });

  // Last third

  doc.font('Arial')
    .fontSize(8);

  doc.moveTo(453, 203) // Подпись плательщика
    .lineTo(564, 203)
    .stroke();

  doc.moveTo(453, 347)  // Оплачено
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
    .lineTo(560, 211)
    .stroke();

  doc.
    rect(134, 52, 105, 12) // x, y, width, height
    .dash(1, { space: 1 })
    .stroke();

  doc.
    rect(321, 52, 198, 12)
    .dash(1, { space: 1 })
    .stroke();

  doc.
    rect(348, 73, 66, 12)
    .dash(1, { space: 1 })
    .stroke();

  doc.
    rect(450, 73, 69, 12)
    .dash(1, { space: 1 })
    .stroke();

  doc.
    rect(321, 97, 198, 12)
    .dash(1, { space: 1 })
    .stroke();

  doc.
    rect(134, 241, 105, 12)
    .dash(1, { space: 1 })
    .stroke();

  doc.
    rect(279, 241, 75, 12)
    .dash(1, { space: 1 })
    .stroke();

  doc.
    rect(360, 241, 195, 12)
    .dash(1, { space: 1 })
    .stroke();

  doc.
    rect(360, 267, 66, 12)
    .dash(1, { space: 1 })
    .stroke();

  doc.
    rect(489, 267, 66, 12)
    .dash(1, { space: 1 })
    .stroke();

  doc.
    rect(321, 289, 198, 12)
    .dash(1, { space: 1 })
    // .fill('red')
    .stroke();

  doc.pipe(res);
  doc.end();
}

function validApartment(number, letter, orderNumber) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT a.apartment_id AS id' +
        ' FROM apartments a' +
        ' LEFT JOIN cards b ON b.card_id = a.card_id' +
        ' WHERE (a.number = ?) AND (a.letter = ?) AND (b.contract_number = ?)' +
        ' LIMIT 1', [number, letter, orderNumber],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          }
          else {
            resolve({ isExists: rows.length > 0, id: rows.length > 0 ? rows[0].id : null });
          }
        });
    });
  });
}

function updatePayment(data) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' UPDATE payments' +
        ' SET create_date = ?,' +
        ' apartment_id = ?,' +
        ' pay_month = ?,' +
        ' pay_year = ?,' +
        ' amount = ?,' +
        ' pay_date = ?,' +
        ' `mode` = ?' +
        ' WHERE payment_id = ?', [
        data.createDate,
        data.apartment.id,
        data.payMonth,
        data.payYear,
        data.amount,
        data.payDate,
        data.mode,
        data.id
      ],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          }
          else {
            resolve(rows);
          }
        });
    });
  });
}

function savePayment(data) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' INSERT INTO payments (' +
        ' create_date, apartment_id, pay_month, pay_year, amount, pay_date, `mode`)' +
        ' VALUES (' +
        ' ?,?,?,?,?,?,?)', [
        data.createDate,
        data.apartment.id,
        data.payMonth,
        data.payYear,
        data.amount,
        data.payDate,
        data.mode
      ],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          }
          else {
            resolve(rows);
          }
        });
    });
  });
}

function savePaymentsHistory(data) {
  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        'INSERT INTO payments_history (create_dt, comment) values (NOW(), ?)', [data],
        function (err, rows) {
          connection.release();
          if (err) {
            reject();
          }
          else {
            resolve(rows);
          }
        });
    });
  });
}

module.exports = function () {
  var router = express.Router();

  router.get('/', function (req, res) {
    var pageCount = 0;
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT COUNT(*) AS count' +
        ' FROM payments', [], function (err, rows) {
          connection.release();
          pageCount =
            (rows[0].count / visibleRows) < 1 ? 0 : Math.ceil(rows[0].count / visibleRows);

          db.get().getConnection(function (err, connection) {
            connection.query(
              ' SELECT' +
              ' a.payment_id AS id,' +
              ' a.create_date AS createDate,' +
              ' a.amount,' +
              ' a.pay_date AS payDate,' +
              ' a.mode,' +
              ' b.number,' +
              ' b.letter,' +
              ' c.contract_number AS contractNumber,' +
              ' c.m_contract_number AS prolongedContractNumber,' +
              ' d.name AS cityName,' +
              ' e.name AS streetName,' +
              ' f.number AS houseNumber,' +
              ' c.porch' +
              ' FROM' +
              ' payments a' +
              ' LEFT JOIN apartments b ON b.apartment_id = a.apartment_id' +
              ' LEFT JOIN cards c ON c.card_id = b.card_id' +
              ' LEFT JOIN cities d ON d.city_id = c.city_id' +
              ' LEFT JOIN streets e ON e.street_id = c.street_id' +
              ' LEFT JOIN houses f ON f.house_id = c.house_id' +
              // ' WHERE'
              // ' a.pay_date BETWEEN :start_date AND :end_date' +
              ' ORDER BY' +
              ' a.pay_date DESC,' +
              ' a.payment_id DESC' +
              ' LIMIT ?', [visibleRows], function (err, rows) {
                if (err) {
                  throw err;
                }
                connection.release();

                if (err) {
                  console.error(err);
                  res.status(500).send({
                    'code': 500,
                    'msg': 'Database error'
                  });
                } else {
                  var currentPage = 1;
                  res.render('docs/payments.ejs', {
                    title: 'Платежи',
                    data: rows,
                    pageCount: pageCount,
                    currentPage: currentPage,
                    visibleRows: visibleRows,
                    moment: moment,
                    utils: utils,
                    user: req.session.userName
                  });
                }
              });
          });
        });
    });
  });

  router.get('/edit/:id', function (req, res) {
    var paymentModel = new PaymentModel();
    var id = req.params.id;
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT a.payment_id AS id,' +
        ' a.create_date AS createDate,' +
        ' a.apartment_id AS apartmentId,' +
        ' a.pay_month AS payMonth,' +
        ' a.pay_year AS payYear,' +
        ' a.amount,' +
        ' a.pay_date AS payDate,' +
        ' a.mode,' +
        ' a.transaction,' +
        ' a.zip_code AS zipCode,' +
        ' a.file_name AS fileName,' +
        ' b.number,' +
        ' b.letter,' +
        ' c.card_id AS cardId,' +
        ' c.contract_number AS contractNumber,' +
        ' c.m_contract_number AS prolongedContractNumber,' +
        ' c.start_service AS startService,' +
        ' c.end_service AS endService,' +
        ' d.name AS cityName,' +
        ' e.name AS streetName,' +
        ' f.number AS houseNumber' +
        ' FROM payments a' +
        ' LEFT JOIN apartments b ON b.apartment_id = a.apartment_id' +
        ' LEFT JOIN cards c ON c.card_id = b.card_id' +
        ' LEFT JOIN cities d ON d.city_id = c.city_id' +
        ' LEFT JOIN streets e ON e.street_id = c.street_id' +
        ' LEFT JOIN houses f ON f.house_id = c.house_id' +
        ' WHERE a.payment_id = ?', [id], function (err, rows) {
          if (err) {
            throw err;
          }
          connection.release();

          if (err) {
            console.error(err);
            res.status(500).send({
              'code': 500,
              'msg': 'Database error'
            });
          } else {

            if (rows[0].length === 0) {
              // FIXME: not found
            }

            var data = rows[0];
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

            paymentModel.contract.id = data.cardId;
            paymentModel.contract.normal = data.contractNumber;
            paymentModel.contract.prolonged = data.prolongedContractNumber;
            paymentModel.contract.startService = data.startService;
            paymentModel.contract.endService = data.endService;
            paymentModel.fullAddress =
              data.cityName.trim() +
              (data.streetName.trim() != '' ? (', ' + data.streetName.trim()) : '') +
              (data.houseNumber.trim() != '' ? (', ' + data.houseNumber.trim()) : '');

            res.render('docs/forms/payment.ejs', {
              title: 'Платеж',
              data: paymentModel,
              errors: {},
              moment: moment,
              utils: utils,
              user: req.session.userName
            });
          }
        });
    });
  });

  router.get('/add', function (req, res) {
    var paymentModel = new PaymentModel();
    res.render('docs/forms/payment.ejs', {
      title: 'Платеж',
      data: paymentModel,
      errors: {},
      moment: moment,
      utils: utils,
      user: req.session.userName
    });
  });

  router.get('/table', function (req, res) {
    var id = req.query.id;
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT' +
        ' a.payment_id AS id,' +
        ` DATE_FORMAT(a.create_date, '%d.%m.%Y') AS createDate,` +
        ' a.pay_month,' +
        ' a.pay_year,' +
        ` DATE_FORMAT(a.pay_date, '%d.%m.%Y') AS pay_date,` +
        ' a.amount,' +
        ' a.mode,' +
        ' c.m_contract_number,' +
        ' d.name as org_name' +
        ' FROM payments a' +
        ' LEFT JOIN apartments b ON b.apartment_id = a.apartment_id' +
        ' LEFT JOIN cards c ON c.card_id = b.card_id' +
        ' LEFT JOIN organizations d ON d.organization_id = a.mode' +
        ' WHERE' +
        ' a.apartment_id = ?' +
        ' ORDER BY' +
        ' a.pay_date DESC', [id], function (err, rows) {
          if (err) {
            throw err;
          }
          connection.release();

          if (err) {
            console.error(err);
            res.status(500).send({
              code: 500,
              msg: 'Database error'
            });
          } else {
            res.status(200).send({ table: rows });
          }
        });
    });
  });

  router.get('/load', async function (req, res) {
    var destination = path.join(__dirname, '../../../public/in/');

    var makePayments = new MakePayments();
    await makePayments.start(destination, function (error, data) {
      savePaymentsHistory(data)
        .then(
          // res.status(200).send({ 'status': 'success' })
          res.redirect('/payments')
        )
        .catch(function (error) {
          res.status(500).send(error.message);
        });;

    })

  });

  router.get('/:offset', function (req, res) {
    var offset = +req.params.offset;
    var pageCount = 0;
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT COUNT(*) AS count' +
        ' FROM payments', [], function (err, rows) {
          connection.release();
          pageCount =
            (rows[0].count / visibleRows) < 1 ? 0 : Math.ceil(rows[0].count / visibleRows);
          if ((offset > pageCount * visibleRows)) {
            offset = (pageCount - 1) * visibleRows;
          }

          db.get().getConnection(function (err, connection) {
            connection.query(
              ' SELECT' +
              ' a.payment_id AS id,' +
              ' a.create_date AS createDate,' +
              ' a.amount,' +
              ' a.pay_date AS payDate,' +
              ' a.mode,' +
              ' b.number,' +
              ' b.letter,' +
              ' c.card_id AS cardId,' +
              ' c.contract_number AS contractNumber,' +
              ' c.m_contract_number AS prolongedContractNumber,' +
              ' d.name AS cityName,' +
              ' e.name AS streetName,' +
              ' f.number AS houseNumber,' +
              ' c.porch' +
              ' FROM' +
              ' payments a' +
              ' LEFT JOIN apartments b ON b.apartment_id = a.apartment_id' +
              ' LEFT JOIN cards c ON c.card_id = b.card_id' +
              ' LEFT JOIN cities d ON d.city_id = c.city_id' +
              ' LEFT JOIN streets e ON e.street_id = c.street_id' +
              ' LEFT JOIN houses f ON f.house_id = c.house_id' +
              // ' WHERE'
              // ' a.pay_date BETWEEN :start_date AND :end_date' +
              ' ORDER BY' +
              ' a.pay_date DESC,' +
              ' a.payment_id DESC' +
              ' LIMIT ?' +
              ' OFFSET ?', [visibleRows, offset], function (err, rows) {
                if (err) {
                  //   throw err;
                  // }
                  connection.release();

                  // if (err) {
                  console.error(err);
                  res.status(500).send({
                    code: 500,
                    msg: 'Database error'
                  });
                } else {
                  var currentPage = Math.ceil(offset / visibleRows) + 1;
                  res.render('docs/payments.ejs', {
                    title: 'Платежи',
                    data: rows,
                    pageCount: pageCount,
                    currentPage: currentPage,
                    visibleRows: visibleRows,
                    moment: moment,
                    utils: utils,
                    user: req.session.userName
                  });
                }
              });
          });
        });
    });
  });

  router.post('/save', async function (req, res) {

    if ('printReceipt' in req.body) {
      printReceipt(req, res);
      return;
    }

    var paymentModel = new PaymentModel();
    paymentModel.id = req.body.id;
    paymentModel.createDate = ((req.body.createDate != null) && (req.body.createDate.trim().length > 0)) ? moment(req.body.createDate, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;
    paymentModel.apartment.number = req.body.apartment;
    paymentModel.apartment.letter = req.body.letter;
    paymentModel.mode = req.body.paymentType;
    paymentModel.amount = isNaN(parseFloat(req.body.amount)) ? 0 : parseFloat(req.body.amount);
    paymentModel.payDate = ((req.body.dateOfPayment != null) && (req.body.dateOfPayment.trim().length > 0)) ? moment(req.body.dateOfPayment, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;

    paymentModel.contract.id = req.body.cardId;
    paymentModel.contract.normal = req.body.contract;
    paymentModel.contract.prolonged = req.body.extendedContract;
    paymentModel.contract.startService = ((req.body.startService != null) && (req.body.startService.trim().length > 0)) ? moment(req.body.startService, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;
    paymentModel.contract.endService = ((req.body.endService != null) && (req.body.endService.trim().length > 0)) ? moment(req.body.endService, 'DD.MM.YYYY').format('YYYY-MM-DD') : null;

    req.assert('createDate', 'Дата создания не заполнена').notEmpty();
    req.assert('cardId', 'Договор с таким номером не существует').custom(function (data) {
      return Number(data) > 0;
    });

    req.assert('extendedContract', 'Договор ТО не заполнен').notEmpty();
    req.assert('apartment', 'Квартира не заполнена').notEmpty();

    await validApartment(paymentModel.apartment.number, paymentModel.apartment.letter, paymentModel.contract.normal)
      .then(function (result) {
        if (result.isExists) {
          paymentModel.apartment.id = result.id;
        }
        else {
          req.assert('apartment', 'Номер квартиры вне диапазона квартир договора').custom(function (data) {
            return result.isExists;
          });
        }
      })
      .catch(function (error) {
        console.log(error);
      })

    req.assert('amount', 'Сумма оплаты не заполнена').notEmpty();
    req.assert('amount', 'Сумма должна быть ненулевoй').custom(function (data) {
      var out = parseFloat(data);
      if (isNaN(out)) {
        out = 0;
      }
      return out > 0;
    });
    req.assert('dateOfPayment', 'Дата оплаты не заполнена').notEmpty();

    var errors = req.validationErrors();
    if (!errors) {

      paymentModel.payMonth = moment(paymentModel.payDate).month();
      paymentModel.payYear = moment(paymentModel.payDate).year();

      if (paymentModel.id != 0) {
        updatePayment(paymentModel)
          .then(function () {
            res.redirect('/payments');
          })
          .catch(function (error) {
            console.log(error);
          })
      }
      else {
        savePayment(paymentModel)
          .then(function () {
            res.redirect('/payments');
          })
          .catch(function (error) {
            console.log(error);
          })
      }
    }
    else {
      res.render('docs/forms/payment.ejs', {
        title: 'Платеж',
        data: paymentModel,
        errors: errors,
        moment: moment,
        utils: utils,
        user: req.session.userName
      });
    }

    // if ((req.body.id) && (isFinite(+req.body.id))) {
    //   db.get().getConnection(function (err, connection) {
    //     connection.query(
    //       ' UPDATE payments SET name = ?, guarantee_period = ?' +
    //       ' WHERE payment_id = ?', [req.body.name, req.body.years, req.body.id], function (err) {
    //         connection.release();
    //         if (err) {
    //           res.status(500).send({ 'code': 500, 'msg': 'Database Error' });
    //         } else {
    //           res.redirect('/equipment');
    //         }
    //       }
    //     );
    //   });
    // }
    // else {
    //   db.get().getConnection(function (err, connection) {
    //     connection.query(
    //       ' INSERT INTO payments (name, guarantee_period)' +
    //       ' VALUE(?, ?)', [req.body.name, req.body.years], function (err) {
    //         connection.release();
    //         if (err) {
    //           res.status(500).send({ code: 500, msg: 'Database Error' });
    //         } else {
    //           res.redirect('/payments');
    //         }
    //       }
    //     );
    //   });
    // }
  });

  router.post('/delete', function (req, res) {
    if ((req.body.id) && (isFinite(+req.body.id))) {
      db.get().getConnection(function (err, connection) {
        connection.query(
          ' DELETE FROM payments WHERE payment_id = ?', [+req.body.id], function (err) {
            connection.release();
            if (err) {
              res.status(500).send({
                code: 500,
                msg: 'Database Error',
                err: JSON.stringify(err)
              });
            } else {
              res.status(200).send({ result: 'OK' });
            }
          }
        );
      });
    }
    else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  router.post('/find_prolonged_order', function (req, res) {
    var data = req.body;
    if ((data) && (typeof (data) === 'object') && ('suggestion' in data)) {
      var orderNumber = data.suggestion;
      var rowsCount = 'limit' in data ? data.limit : rowsLimit;
      common.filterProlongedOrders(orderNumber, rowsCount, function (err, rows) {
        res.status(200).send(rows);
      });
    } else {
      res.status(500).send({ code: 500, msg: 'Incorrect parameter' });
    }
  });

  return router;
};