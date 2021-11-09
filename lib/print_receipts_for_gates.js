const path = require('path');
const moment = require('moment');
const PDFDocument = require('pdfkit');
const SVGtoPDF = require('svg-to-pdfkit');
const barcode = require('pure-svg-code/barcode');
// const qrcode = require('pure-svg-code/qrcode');
const QRCode = require('qrcode-svg');

const db = require('./db');
const utils = require('./utils');
const { daysToPayReceipt } = require('./config').config;
const { firm } = require('./firm_bank_details');

function Apartment(id, number, letter, locked, exempt, payment, debt, prevPayment) {
  this.id = id;
  this.number = number;
  this.letter = letter;
  this.locked = locked;
  this.exempt = exempt;
  this.payment = payment;
  this.debt = debt;
  this.prevPayment = prevPayment;
  return this;
}

function Gate() {
  this.contractNumber = '';
  this.startService = null;
  this.endService = null;
  this.payment = 0.00;
  this.city = {
    name: '',
    printType: 1,
    phone: '',
    office: '',
  };
  this.streetName = '';
  this.houseNumber = '';
  this.payMonth = 0;
  this.payYear = 2000;
  return this;
}

class PrintReceipts {
  constructor(documentId, res) {
    this.documentId = documentId;
    this.gate = new Gate();

    this.apartments = [];

    this.res = res;
  }

  extractGate() {
    return new Promise((resolve, reject) => {
      db.get().getConnection((err, connection) => {
        connection.query(
          `SELECT a.contract_number AS contractNumber, a.start_service AS startService,
          a.end_service AS endService, a.normal_payment AS payment,
          b.name AS cityName, b.print_type AS printType, b.phone, b.office_address AS office,
          c.name AS streetName, d.number AS houseNumber,
          MONTH(a.end_service) AS payMonth, YEAR(a.end_service) AS payYear
          FROM cards a
          LEFT JOIN cities b ON b.city_id = a.city_id
          LEFT JOIN streets c ON c.street_id = a.street_id
          LEFT JOIN houses d ON d.house_id = a.house_id
          WHERE a.card_id = ?`, [this.documentId],
          (error, rows) => {
            connection.release();
            if (error) {
              // eslint-disable-next-line no-console
              console.log(`Error from PrintReceipts.extractGate(): ' ${error.message}`);
              reject();
            } else {
              const row = rows[0];
              resolve({
                contractNumber: `${row.contractNumber}`,
                startService: row.startService,
                endService: row.endService,
                payment: row.payment,
                cityName: row.cityName,
                printType: row.printType,
                phone: row.phone,
                office: row.office,
                streetName: row.streetName,
                houseNumber: row.houseNumber,
                payMonth: row.payMonth,
                payYear: row.payYear,
              });
            }
          },
        );
      });
    });
  }

  calculateAccrual() {
    return new Promise((resolve, reject) => {
      db.get().getConnection((err, connection) => {
        connection.query(
          'CALL find_debt_under_order(?)', [this.documentId],
          (error, rows) => {
            connection.release();
            if (error) {
              // eslint-disable-next-line no-console
              console.log(`Error from PrintReceipts.calculateAccrual(): ' + ${error.message}`);
              reject();
            } else {
              resolve(rows[0]);
            }
          },
        );
      });
    });
  }

  static printNicePersonalAccount(personalAccount) {
    if (typeof personalAccount === 'string') {
      if (personalAccount.trim().length > 4) {
        return `${personalAccount.slice(0, -4)}-${personalAccount.slice(-4)}`;
      }
    }
    return personalAccount;
  }

  generatePdf() {
  // const self = this;
    const doc = new PDFDocument();
    const filename = 'receipts.pdf';
    this.res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    this.res.setHeader('Content-type', 'application/pdf');

    const adImage = path.join(__dirname, '../public/images/new_logo_2.jpg');

    doc.margins = {
      top: 14,
      bottom: 0,
      left: 0,
      right: 0,
    };

    doc.layout = 'portrait';

    doc.registerFont('Arial', 'fonts//arial.ttf');
    doc.registerFont('ArialBold', 'fonts//arialbd.ttf');

    const address = `${this.gate.city.name}, ${this.gate.streetName}, ${this.gate.houseNumber}`;

    this.apartments.forEach((item, index) => {
      if (item.exempt === 0) {
        doc.fontSize(8);

        const fullAddress = `${address}, кв. ${item.number}${utils.decodeApartmentLetter(item.letter)}`;

        let rpts = 6 - (this.gate.contractNumber.trim().length);
        const outContractNumber = (rpts > 0 ? '0'.repeat(rpts) : '') + this.gate.contractNumber.trim();

        rpts = (3 - item.number.toString().trim().length);
        const outApartment = (rpts > 0 ? '0'.repeat(rpts) : '') + item.number.toString().trim();

        const clientAccountData = [];
        clientAccountData.push('5');
        clientAccountData.push(outContractNumber);
        clientAccountData.push(item.letter.toString());
        clientAccountData.push(outApartment);

        const clientAccount = clientAccountData.join('');

        const amount = item.payment;
        let { debt } = item;
        if (debt < 0) {
          if ((debt <= -item.prevPayment) && (debt >= item.debt * 2)) {
            debt = 0;
          }
        }

        let subtotal = item.payment + debt;
        if (subtotal < 0) {
          subtotal = 0;
        }

        const sum = parseInt(subtotal * 100, 10);

        const subtotalStr = parseInt(subtotal, 10).toString();
        rpts = 5 - (subtotalStr.length);
        const outSum = (rpts > 0 ? '0'.repeat(rpts) : '') + subtotalStr;

        let deadline = '';
        if (this.gate.startService != null) {
          deadline = moment(this.gate.startService).add(daysToPayReceipt, 'days').format('DD.MM.YYYY');
        }

        // BarCode and QRCode
        const barCodeData = [];
        barCodeData.push(firm.payeeINN);
        barCodeData.push(this.gate.payMonth < 10 ? `0${this.gate.payMonth}` : this.gate.payMonth.toString());
        barCodeData.push((this.gate.payYear - 2000) < 10 ? `0${this.gate.payYear - 2000}` : (this.gate.payYear - 2000).toString());
        barCodeData.push(outSum);
        barCodeData.push('00');
        barCodeData.push('0');
        barCodeData.push(outContractNumber);
        barCodeData.push(item.letter.toString());
        barCodeData.push(outApartment);
        const outBarcode = barCodeData.join('');

        const contentData = [];
        contentData.push('ST00011|');
        contentData.push(`Name=${firm.name}|`);
        contentData.push(`PersonalAcc=${firm.personalAcc}|`);
        contentData.push(`BankName=${firm.bankName}|`);
        contentData.push(`BIC=${firm.bic}|`);
        contentData.push(`CorrespAcc=${firm.correspAcc}|`);
        contentData.push(`PersAcc=${clientAccount}|`);
        contentData.push(`Category=${firm.category}|`);
        contentData.push(`TechCode=${firm.techCode}|`);
        contentData.push(`PayeeINN=${firm.payeeINN}|`);

        contentData.push(`Sum=${sum.toString()}`);
        const content = contentData.join('');

        //-----------------------------------------------------

        doc.font('ArialBold');
        doc.text(`OOO «ДOМОФОН-СЕРВИС»  ${this.gate.city.phone}`, 154, 28, { align: 'left', width: 183 });

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
        doc.text('Оплата за ГОДОВОЕ обслуживание дополнительного оборудования', 154, 114, { align: 'left', width: 419 });

        doc.font('ArialBold');
        doc.text(`с ${moment(this.gate.startService).format('DD.MM.YYYY')}  по  ${moment(this.gate.endService).format('DD.MM.YYYY')} г., (Договор № ${this.gate.contractNumber})`, 154, 123, { align: 'left', width: 419 });

        doc.font('Arial');
        doc.text('Адрес плательщика', 154, 139, { align: 'left', width: 79 });

        doc.font('ArialBold')
          .fontSize(10)
          .text(`${fullAddress} (л/сч: ${clientAccount})`, 238, 137, { align: 'right', width: 335 });

        doc.font('Arial')
          .fontSize(11)
          .text('Сумма платежа, руб.', 154, 152, { align: 'left', width: 342 })
          .text(amount.toFixed(2), 500, 152, { align: 'left', width: 72 });

        if (debt !== 0) {
          doc
            .text(`Задолженность за период с ${moment(this.gate.startService).subtract(1, 'years').format('DD.MM.YYYY')} по ${moment(this.gate.endService).subtract(1, 'years').format('DD.MM.YYYY')}, руб.`, 154, 165, { align: 'left', width: 342 })
            .text(parseFloat(debt).toFixed(2), 500, 165, { align: 'left', width: 72 });
        }

        doc.font('ArialBold')
          .fontSize(11)
          .text('К оплате, руб.', 154, 178, { align: 'left', width: 342 })
          .text(subtotal.toFixed(2), 500, 178, { align: 'left', width: 72 })

          .fontSize(10)
          .text(this.gate.city.vkLink, 170, 193, { align: 'left', width: 108 });

        doc.font('Arial')
          .fontSize(9)
          .text('Подпись плательщика', 367, 193, { align: 'right', width: 99 });

        // // Second third
        doc.fontSize(8);
        doc.font('ArialBold');
        doc.text(`OOO «ДOМОФОН-СЕРВИС»  ${this.gate.city.phone}  ${this.gate.city.office}`, 154, 219, { align: 'left', width: 360 });

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
        doc.text('Оплата за ГОДОВОЕ обслуживание дополнительного оборудования', 154, 305, { align: 'left', width: 419 });

        doc.font('ArialBold');
        doc.text(`с ${moment(this.gate.startService).format('DD.MM.YYYY')}  по  ${moment(this.gate.endService).format('DD.MM.YYYY')} г., (Договор № ${this.gate.contractNumber})`, 154, 314, { align: 'left', width: 419 });

        doc.font('Arial');
        doc.text('Адрес плательщика', 154, 326, { align: 'left', width: 79 });

        doc.font('ArialBold')
          .fontSize(10)
          .text(`${fullAddress} (л/сч: ${clientAccount})`, 238, 323, { align: 'right', width: 335 });

        doc.fontSize(8)
          .font('ArialBold')
          .text(`К оплате ${subtotal.toFixed(2)}, руб.`, 154, 337, { align: 'left', width: 255 });

        doc.fontSize(9)
          .font('Arial')
          .text('Оплачено', 416, 337, { align: 'right', width: 51 });

        doc.fontSize(8)
          .font('ArialBold')
          .text(`ОПЛАТИТЬ ДО ${deadline} г.`, 154, 352, { align: 'left', width: 189 });

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

        const y = Number(this.gate.city.printType) === 1 ? 348 : 338;

        doc.fontSize(16)
          .text(`Тел. ${this.gate.city.phone}`, 35, y, { align: 'center', width: 102 })
          .fontSize(11)
          .text('domofon@mail.ru', 35, 378, { align: 'center', width: 102 });

        doc.image(adImage, 35, 222, { width: 100 });

        // // Last third

        doc.font('Arial')
          .fontSize(8);

        doc.moveTo(473, 203) // Подпись плательщика
          .lineTo(584, 203)
          .stroke();

        doc.moveTo(473, 347) // Оплачено
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

        doc.rect(154, 52, 105, 12) // x, y, width, height
          .dash(1, { space: 1 })
          .stroke();

        doc.rect(341, 52, 198, 12)
          .dash(1, { space: 1 })
          .stroke();

        doc.rect(368, 73, 66, 12)
          .dash(1, { space: 1 })
          .stroke();

        doc.rect(470, 73, 69, 12)
          .dash(1, { space: 1 })
          .stroke();

        doc.rect(341, 97, 198, 12)
          .dash(1, { space: 1 })
          .stroke();

        doc.rect(154, 241, 105, 12)
          .dash(1, { space: 1 })
          .stroke();

        doc.rect(299, 241, 75, 12)
          .dash(1, { space: 1 })
          .stroke();

        doc.rect(380, 241, 195, 12)
          .dash(1, { space: 1 })
          .stroke();

        doc.rect(380, 267, 66, 12)
          .dash(1, { space: 1 })
          .stroke();

        doc.rect(509, 267, 66, 12)
          .dash(1, { space: 1 })
          .stroke();

        doc.rect(341, 289, 198, 12)
          .dash(1, { space: 1 })
          // .fill('red')
          .stroke();

        const barcodeOptions = { width: 158, height: 20 };
        const barCode = barcode(outBarcode, 'code128', { width: 158, barWidth: 0.6, barHeight: 20 });
        SVGtoPDF(doc, barCode, 341, 20, barcodeOptions);
        doc.fontSize(8)
          .font('Arial')
          .text(outBarcode, 341, 40, { align: 'center', width: 158 });

        const qrOptions = { width: 126, height: 126 };
        const qrCode = new QRCode({
          content,
          padding: 0,
          width: 126,
          height: 126,
          color: '#000000',
          background: '#ffffff',
          ecl: 'M',
          swap: true,
        }).svg();

        SVGtoPDF(doc, qrCode, 36, 56, qrOptions);

        let addPage = (index < this.apartments.length - 1);
        if ((index === this.apartments.length - 2)
          && (this.apartments[this.apartments.length - 1].exempt === 1)) {
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

  async go() {
    await this.extractGate()
      .then((data) => {
        this.gate.contractNumber = data.contractNumber;
        this.gate.startService = data.startService;
        this.gate.endService = data.endService;
        this.gate.payment = data.payment;
        this.gate.city.name = data.cityName;
        this.gate.city.printType = data.printType;
        this.gate.city.phone = data.phone;
        this.gate.city.office = data.office;
        this.gate.streetName = data.streetName;
        this.gate.houseNumber = data.houseNumber;
        this.gate.payMonth = data.payMonth;
        this.gate.payYear = data.payYear;
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.log(`Error: ${error.message}`);
      });

    await this.calculateAccrual()
      .then((data) => {
        if (Array.isArray(data)) {
          data.forEach((item) => {
            const apartment = new Apartment(
              item.apartmentId,
              item.number,
              item.letter,
              item.locked,
              item.exempt,
              item.payment,
              item.debt,
              item.prevPayment,
            );
            this.apartments.push(apartment);
          });
        }
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.log(`Error: ${error.message}`);
      });

    this.generatePdf();
  }
}

module.exports.PrintReceipts = PrintReceipts;
