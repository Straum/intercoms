'use strict';

const fs = require('fs');
const path = require('path');
var moment = require('moment');
var PDFDocument = require('pdfkit');
var SVGtoPDF = require('svg-to-pdfkit');
var barcode = require('pure-svg-code/barcode');
var qrcode = require('pure-svg-code/qrcode');

var db = require('./db');
var utils = require('./utils');
const daysToPayReceipt = require('./config').config.daysToPayReceipt;
var firmBankDetails = require('../lib/firm_bank_details').firm;

function Apartment(id, number, letter, privilege, locked, exempt, payment, debt, prevPayment) {
  this.id = id;
  this.number = number;
  this.letter = letter;
  this.privilege = privilege;
  this.locked = locked;
  this.exempt = exempt;
  this.payment = payment;
  this.debt = debt;
  this.prevPayment = prevPayment;
  return this;
}

function Order() {
  this.prolongedContractNumber = '';
  this.startService = null;
  this.endService = null;
  this.normalPayment = 0.00;
  this.privilegePayment = 0.00;
  this.city = {
    name: '',
    printType: 1,
    phone: '',
    vkLink: '',
    office: ''
  };
  this.streetName = '';
  this.houseNumber = '';
  this.isDuplicate = 0;
  this.payMonth = 0;
  this.payYear = 2000;
  return this;
}

function PrintOrderReceipts(cardId, res) {
  this.cardId = cardId;
  this.order = new Order();

  this.apartments = [];

  this.res = res;
  return this;
}

PrintOrderReceipts.prototype.go = async function (destination, callback) {
  var self = this;
  await this.extractOrder()
    .then(function (data) {
      self.order.prolongedContractNumber = data.prolongedContractNumber;
      self.order.startService = data.startService;
      self.order.endService = data.endService;
      self.order.normalPayment = data.normalPayment;
      self.order.privilegePayment = data.privilegePayment;
      self.order.city.name = data.cityName;
      self.order.city.printType = data.printType;
      self.order.city.phone = data.phone;
      self.order.city.vkLink = data.vkLink;
      self.order.city.office = data.office;
      self.order.streetName = data.streetName;
      self.order.houseNumber = data.houseNumber;
      self.order.payMonth = data.payMonth;
      self.order.payYear = data.payYear;
    })
    .catch(function (error) {
      console.log('Error: ' + error.message);
    });

  await this.calculateAccrual()
    .then(function (data) {
      if (Array.isArray(data)) {
        data.forEach(function (item) {

          var apartment = new Apartment(
            item.apartmentId,
            item.number,
            item.letter,
            item.privilege,
            item.locked,
            item.exempt,
            item.payment,
            item.debt,
            item.prevPayment
          )

          self.apartments.push(apartment);

        });
      }
    })
    .catch(function (error) {
      console.log('Error: ' + error.message);
    });

  this.generatePdf();
}

PrintOrderReceipts.prototype.oneApartment = async function (apartmentId) {
  var self = this;
  await this.extractOrder()
    .then(function (data) {
      self.order.prolongedContractNumber = data.prolongedContractNumber;
      self.order.startService = data.startService;
      self.order.endService = data.endService;
      self.order.normalPayment = data.normalPayment;
      self.order.privilegePayment = data.privilegePayment;
      self.order.city.name = data.cityName;
      self.order.city.printType = data.printType;
      self.order.city.phone = data.phone;
      self.order.city.vkLink = data.vkLink;
      self.order.city.office = data.office;
      self.order.streetName = data.streetName;
      self.order.houseNumber = data.houseNumber;
      self.order.payMonth = data.payMonth;
      self.order.payYear = data.payYear;
    })
    .catch(function (error) {
      console.log('Error: ' + error.message);
    });

  await this.calculateAccrual()
    .then(function (data) {
      if (Array.isArray(data)) {

        var out = data.filter(function (item) {
          return item.apartmentId === +apartmentId;
        });
        if (out.length === 1) {
          let obj = {...out[0]};
          const apartment = new Apartment(
            obj.apartmentId,
            obj.number,
            obj.letter,
            obj.privilege,
            obj.locked,
            obj.exempt,
            obj.payment,
            obj.debt,
            obj.prevPayment
          );

          self.apartments.push(apartment);
        }
      }

    })
    .catch(function (error) {
      console.log('Error: ' + error.message);
    });

  this.generatePdf();
}

PrintOrderReceipts.prototype.extractOrder = function () {
  var self = this;

  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        ' SELECT a.m_contract_number AS prolongedContractNumber, a.start_service AS startService,' +
        ' a.end_service AS endService, a.normal_payment AS normalPayment, a.privilege_payment AS privilegePayment,' +
        ' b.`name` AS cityName, b.print_type AS printType, b.phone, b.link AS vkLink, b.office_address AS office,' +
        ' c.`name` AS streetName, d.`number` AS houseNumber, m_duplicate AS isDuplicate,' +
        ' MONTH(a.end_service) AS payMonth, YEAR(a.end_service) AS payYear' +
        ' FROM cards a' +
        ' LEFT JOIN cities b ON b.city_id = a.city_id ' +
        ' LEFT JOIN streets c ON c.street_id = a.street_id ' +
        ' LEFT JOIN houses d ON d.house_id = a.house_id ' +
        ' WHERE a.card_id = ?', [self.cardId],
        function (err, rows) {
          connection.release();
          if (err) {
            console.log('Error from PrintReceipts.extractOrder(): ' + err.message);
            reject();
          }
          else {
            var row = rows[0];
            resolve({
              prolongedContractNumber: row.prolongedContractNumber,
              startService: row.startService,
              endService: row.endService,
              normalPayment: row.normalPayment,
              privilegePayment: row.privilegePayment,
              cityName: row.cityName,
              printType: row.printType,
              phone: row.phone,
              vkLink: row.vkLink,
              office: row.office,
              streetName: row.streetName,
              houseNumber: row.houseNumber,
              isDuplicate: row.isDuplicate,
              payMonth: row.payMonth,
              payYear: row.payYear
            });
          }
        });
    });
  });
}

PrintOrderReceipts.prototype.calculateAccrual = function () {
  var self = this;

  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        'CALL find_debt_under_order(?)', [self.cardId],
        function (err, rows) {
          connection.release();
          if (err) {
            console.log('Error from PrintReceipts.calculateAccrual(): ' + err.message);
            reject();
          }
          else {
            resolve(rows[0]);
          }
        });
    });
  });
}

PrintOrderReceipts.prototype.generatePdf = function () {
  var self = this;
  var doc = new PDFDocument();
  var filename = 'receipts.pdf';
  this.res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
  this.res.setHeader('Content-type', 'application/pdf');

  var vkImage = path.join(__dirname, '../public/images/vk_logo_icon.jpg');
  var adImage = path.join(__dirname, '../public/images/new_logo_2.jpg');

  doc.margins = {
    top: 14,
    bottom: 0,
    left: 0,
    right: 0
  };

  doc.layout = 'portrait';

  doc.registerFont('Arial', 'fonts//arial.ttf');
  doc.registerFont('ArialBold', 'fonts//arialbd.ttf');

  //   info: {
  //     Title: 'title',
  //     Author: 'author', // the name of the author
  //     Subject: '', // the subject of the document
  //     Keywords: 'pdf;javascript'; // keywords associated with the document
  //     CreationDate: 'DD/MM/YYYY', // the date the document was created (added automatically by PDFKit)
  //     ModDate: 'DD/MM/YYYY' // the date the document was last modified
  // }

  // First third

  var address = this.order.city.name + ', ' + this.order.streetName + ', ' + this.order.houseNumber;

  this.apartments.forEach(function (item, index) {

    if (item.exempt === 0) {
      // if ((item.exempt === 0) && (item.payment + item.debt > 0)) {


      doc.fontSize(8);

      var fullAddress = address + ', кв. ' + item.number + utils.decodeApartmentLetter(item.letter);

      var rpts = 6 - (self.order.prolongedContractNumber.trim().length);
      var outContractNumber = (rpts > 0 ? '0'.repeat(rpts) : '') + self.order.prolongedContractNumber.trim();

      rpts = (3 - item.number.toString().trim().length);
      var outApartment = (rpts > 0 ? '0'.repeat(rpts) : '') + item.number.toString().trim();

      var clientAccountData = [];
      clientAccountData.push(self.order.isDuplicate ? '1' : '0');
      clientAccountData.push(outContractNumber);
      clientAccountData.push(item.letter.toString());
      clientAccountData.push(outApartment);

      var clientAccount = clientAccountData.join('');

      var amount = item.payment;
      var debt = item.debt;
      if (debt < 0) {
        if ((debt <= -item.prevPayment) && (debt >= item.debt * 2)) {
          debt = 0;
        }
      }

      // var subtotal = item.payment + item.debt;
      var subtotal = item.payment + debt;
      if (subtotal < 0) {
        subtotal = 0;
      }

      var sum = parseInt(subtotal * 100);

      var subtotalStr = parseInt(subtotal).toString();
      rpts = 5 - (subtotalStr.length);
      var outSum = (rpts > 0 ? '0'.repeat(rpts) : '') + subtotalStr;

      var deadline = '';
      if (self.order.startService != null) {
        deadline = moment(self.order.startService).add(daysToPayReceipt, 'days').format('DD.MM.YYYY');
      }

      // BarCode and QRCode
      var barCodeData = [];
      barCodeData.push(firmBankDetails.payeeINN);
      barCodeData.push(self.order.payMonth < 10 ? '0' + self.order.payMonth : self.order.payMonth.toString());
      barCodeData.push((self.order.payYear - 2000) < 10 ? '0' + (self.order.payYear - 2000) : (self.order.payYear - 2000).toString());
      barCodeData.push(outSum);
      barCodeData.push('00');
      barCodeData.push(self.order.isDuplicate ? '1' : '0');
      barCodeData.push(outContractNumber);
      barCodeData.push(item.letter.toString());
      barCodeData.push(outApartment);
      var outBarcode = barCodeData.join('');

      var contentData = [];
      // contentData.push('ST00012|');
      contentData.push('ST00011|');
      contentData.push('Name=' + firmBankDetails.name + '|');
      contentData.push('PersonalAcc=' + firmBankDetails.personalAcc + '|');
      contentData.push('BankName=' + firmBankDetails.bankName + '|');
      contentData.push('BIC=' + firmBankDetails.bic + '|');
      contentData.push('CorrespAcc=' + firmBankDetails.correspAcc + '|');
      contentData.push('PersAcc=' + clientAccount + '|');
      contentData.push('Category=' + firmBankDetails.category + '|');
      contentData.push('TechCode=' + firmBankDetails.techCode + '|');
      contentData.push('PayeeINN=' + firmBankDetails.payeeINN + '|');

      contentData.push('Sum=' + sum.toString());
      var content = contentData.join('');

      //-----------------------------------------------------

      doc.font('ArialBold');
      doc.text('OOO «ДOМОФОН-СЕРВИС»  ' + self.order.city.phone, 154, 28, { align: 'left', width: 183 });

      doc.font('Arial');
      doc.text('(наименование получателя платежа)', 154, 38, { align: 'left' });
      doc.text('Форма № ПД-4', 509, 28, { align: 'right', linebreak: false, width: 66 });

      doc.text('6027089952', 154, 54, { align: 'center', width: 105 });
      doc.text('(ИНН получателя платежа)', 154, 64, { align: 'center', width: 105 });

      doc.text('40702810351000104846', 341, 54, { align: 'center', width: 198 });
      doc.text('(номер счета получателя платежа)', 341, 64, { align: 'center', width: 198 });

      doc.text('Отделение № 8630 Сбербанка России, г. Псков', 154, 75, { align: 'left', width: 184, underline: true });
      doc.text('БИК', 341, 75, { align: 'center', width: 27 });
      doc.text('045805602', 368, 75, { align: 'center', width: 66 });

      doc.text('л/с', 443, 75, { align: 'center', width: 27 });
      doc.text(clientAccount, 470, 75, { align: 'center', width: 69 });

      doc.text('(наименование банка получателя платежа)', 154, 85, { align: 'left', width: 183 });

      doc.text('Номер кор./сч. банка получателя платежа', 154, 99, { align: 'right', width: 183 });
      doc.text('30101810300000000602', 341, 99, { align: 'center', width: 198 });

      doc.font('ArialBold');
      doc.text('Оплата за ГОДОВОЕ обслуживание домофона с ' + moment(self.order.startService).format('DD.MM.YYYY') + ' по ' + moment(self.order.endService).format('DD.MM.YYYY') + ' г., (Договор № ' + self.order.prolongedContractNumber + ')', 154, 114, { align: 'left', width: 419 });

      doc.font('Arial');
      doc.text('(наименование платежа)', 154, 123, { align: 'center', width: 419 });

      doc.text('Адрес плательщика', 154, 139, { align: 'left', width: 79 });

      doc.font('ArialBold')
        .fontSize(10)
        .text(fullAddress, 238, 137, { align: 'left', width: 335 });

      doc.font('Arial')
        .fontSize(11)
        .text('Сумма платежа, руб.', 154, 152, { align: 'left', width: 342 })
        .text(amount.toFixed(2), 500, 152, { align: 'left', width: 72 });

      // if (item.debt != 0) {
      if (debt != 0) {
        doc
          .text('Задолженность за период с ' + moment(self.order.startService).subtract(1, 'years').format('DD.MM.YYYY') + ' по ' + moment(self.order.endService).subtract(1, 'years').format('DD.MM.YYYY') + ', руб.', 134, 165, { align: 'left', width: 342 })
          // .text(parseFloat(item.debt).toFixed(2), 480, 165, { align: 'left', width: 72 });
          .text(parseFloat(debt).toFixed(2), 500, 165, { align: 'left', width: 72 });
      }

      doc.font('ArialBold')
        .fontSize(11)
        .text('К оплате, руб.', 154, 178, { align: 'left', width: 342 })
        .text(subtotal.toFixed(2), 500, 178, { align: 'left', width: 72 })

        .fontSize(10)
        .text(self.order.city.vkLink, 170, 193, { align: 'left', width: 108 });

      doc.font('Arial')
        .fontSize(9)
        .text('Подпись плательщика', 367, 193, { align: 'right', width: 99 });

      doc.image(vkImage, 154, 193, { width: 12 });

      // // Second third
      doc.fontSize(8);
      doc.font('ArialBold');
      doc.text('OOO «ДOМОФОН-СЕРВИС»  ' + self.order.city.phone + '  ' + self.order.city.office, 154, 219, { align: 'left', width: 360 });

      doc.font('Arial');
      doc.text('(наименование получателя платежа)', 154, 229, { align: 'left' });
      doc.text('Форма № ПД-4', 509, 219, { align: 'right', linebreak: false, width: 66 });

      doc.text('6027089952', 154, 243, { align: 'center', width: 105 });
      doc.text('(ИНН получателя платежа)', 154, 253, { align: 'center', width: 105 });

      doc.text('КПП', 266, 243, { align: 'right', width: 30 });
      doc.text('602701001', 299, 243, { align: 'center', width: 75 });

      doc.text('40702810351000104846', 380, 243, { align: 'center', width: 195 });
      doc.text('(номер счета получателя платежа)', 380, 253, { align: 'center', width: 195 });

      doc.text('Отделение № 8630 Сбербанка России, г. Псков', 154, 267, { align: 'left', width: 195, underline: true });
      doc.text('БИК', 353, 267, { align: 'center', width: 27 });
      doc.text('045805602', 380, 267, { align: 'center', width: 66 });

      doc.text('л/с', 479, 267, { align: 'center', width: 27 });
      doc.text(clientAccount, 509, 267, { align: 'center', width: 66 });

      doc.text('(наименование банка получателя платежа)', 154, 277, { align: 'left', width: 195 });

      doc.text('Номер кор./сч. банка получателя платежа', 154, 291, { align: 'right', width: 183 });
      doc.text('30101810300000000602', 341, 291, { align: 'center', width: 198 });

      doc.font('ArialBold');
      doc.text('Оплата за ГОДОВОЕ обслуживание домофона с ' + moment(self.order.startService).format('DD.MM.YYYY') + ' по ' + moment(self.order.endService).format('DD.MM.YYYY') + ' г., (Договор № ' + self.order.prolongedContractNumber + ')', 154, 305, { align: 'left', width: 419 });

      doc.font('Arial');
      doc.text('(наименование платежа)', 154, 314, { align: 'center', width: 419 });

      doc.text('Адрес плательщика', 154, 326, { align: 'left', width: 79 });

      doc.font('ArialBold')
        .fontSize(10)
        .text(fullAddress, 238, 323, { align: 'left', width: 335 });

      doc.fontSize(8)
        .font('ArialBold')
        .text('К оплате ' + subtotal.toFixed(2) + ', руб.', 154, 337, { align: 'left', width: 255 });

      doc.fontSize(9)
        .font('Arial')
        .text('Оплачено', 416, 337, { align: 'right', width: 51 });

      doc.fontSize(8)
        .font('ArialBold')
        .text('ОПЛАТИТЬ ДО ' + deadline + ' г.', 154, 352, { align: 'left', width: 189 });

      doc
        .moveTo(152, 350)
        .lineTo(343, 350)
        .lineTo(343, 364)
        .lineTo(152, 364)
        .lineTo(152, 350)
        .stroke();

      doc.fontSize(9)
        .font('Arial')
        .text('Подпись плательщика', 368, 352, { align: 'right', width: 99 });

      doc.image(vkImage, 154, 369, { width: 12 });

      var y = Number(self.order.city.printType) === 1 ? 348 : 338;
      doc.font('ArialBold')
        .fontSize(10)
        .text(self.order.city.vkLink, 169, 369, { align: 'left', width: 108 })

        .fontSize(16)
        .text('Тел. ' + self.order.city.phone, 35, y, { align: 'center', width: 102 })
        // .text('Тел. ' + model.contract.city.phone, 15, 348, { align: 'center', width: 102 })

        .fontSize(11)
        .text('domofon@mail.ru', 35, 378, { align: 'center', width: 102 });
      // .text('domofon@mail.ru', 15, 374, { align: 'center', width: 102 });

      doc.image(adImage, 35, 222, { width: 100 });

      // // Last third

      doc.font('Arial')
        .fontSize(8);

      doc.moveTo(473, 203) // Подпись плательщика
        .lineTo(584, 203)
        .stroke();

      doc.moveTo(473, 347)  // Оплачено
        .lineTo(584, 347)
        .stroke();

      doc.moveTo(473, 362) // Подпись плательщика
        .lineTo(584, 362)
        .stroke();

      // Вертикальная большая линия
      doc.moveTo(146, 22)
        .lineTo(146, 398)
        .stroke();

      // Горизонтальная большая линия
      doc.moveTo(29, 211) // Подпись плательщика
        .lineTo(584, 211)
        .stroke();

      doc.
        rect(154, 52, 105, 12) // x, y, width, height
        .dash(1, { space: 1 })
        .stroke();

      doc.
        rect(341, 52, 198, 12)
        .dash(1, { space: 1 })
        .stroke();

      doc.
        rect(368, 73, 66, 12)
        .dash(1, { space: 1 })
        .stroke();

      doc.
        rect(470, 73, 69, 12)
        .dash(1, { space: 1 })
        .stroke();

      doc.
        rect(341, 97, 198, 12)
        .dash(1, { space: 1 })
        .stroke();

      doc.
        rect(154, 241, 105, 12)
        .dash(1, { space: 1 })
        .stroke();

      doc.
        rect(299, 241, 75, 12)
        .dash(1, { space: 1 })
        .stroke();

      doc.
        rect(380, 241, 195, 12)
        .dash(1, { space: 1 })
        .stroke();

      doc.
        rect(380, 267, 66, 12)
        .dash(1, { space: 1 })
        .stroke();

      doc.
        rect(509, 267, 66, 12)
        .dash(1, { space: 1 })
        .stroke();

      doc.
        rect(341, 289, 198, 12)
        .dash(1, { space: 1 })
        // .fill('red')
        .stroke();

      var barcodeOptions = { width: 158, height: 20 };
      var barCode = barcode(outBarcode, 'code128', { width: 158, barWidth: 0.6, barHeight: 20 });
      SVGtoPDF(doc, barCode, 341, 20, barcodeOptions);
      doc.fontSize(8)
        .font('Arial')
        .text(outBarcode, 341, 40, { align: 'center', width: 158 });

      var qrOptions = { width: 126, height: 126 };
      var qrCode = qrcode({
        content: content,
        padding: 0,
        width: 126,
        height: 126,
        color: "#000000",
        background: "#ffffff",
        ecl: "M"
      });

      SVGtoPDF(doc, qrCode, 36, 56, qrOptions);

      if (index === self.apartments.length - 2) {
        var t = index < (self.apartments.length - 1);
        var tt = self.apartments[self.apartments.length - 1].exempt === 0;
        var ttt = t && tt;
      }

      var addPage = (index < self.apartments.length - 1);
      if ((index === self.apartments.length - 2) && (self.apartments[self.apartments.length - 1].exempt === 1)) {
        addPage = !addPage;
      }
      if (addPage) {
        doc.addPage();
      }
    }

  });

  doc.pipe(this.res);
  doc.end();
}

module.exports.PrintOrderReceipts = PrintOrderReceipts;