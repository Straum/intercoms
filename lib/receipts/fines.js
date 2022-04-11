const path = require('path');
const moment = require('moment');
const PDFDocument = require('pdfkit');
const SVGtoPDF = require('svg-to-pdfkit');
const barcode = require('pure-svg-code/barcode');
const QRCode = require('qrcode-svg');

const db = require('../db');
const utils = require('../utils');
const { daysToPayReceipt } = require('../config').config;
const { firm } = require('../firm_bank_details');
const { FineModel } = require('../../models/fine');
const { buildPersonalAccountForFine } = require('../utils');

class PrintReceipts {
  constructor(documentId, res) {
    this.documentId = documentId;
    this.fine = new FineModel();
    this.res = res;
  }

  getPersonalAccount() {
    const MAX_LENGTH = 6;
    return `${this.fine.id}`.padStart(MAX_LENGTH, '0');
  }

  extractFine() {
    return new Promise((resolve, reject) => {
      db.get().getConnection((err, connection) => {
        connection.query(
          `SELECT
            a.fine_id AS id, DATE(a.create_dt) AS createDate, a.amount_of_fine AS amount,
            a.paid AS isPaid, a.old_fine AS oldFine, a.payment_dt AS paymentDate,
            a.apartment_id AS apartmentId, a.remark,
            b.number AS apartmentNumber, b.letter AS apartmentLetter,
            c.contract_number AS contractNumber, c.m_contract_number AS prolongedContractNumber,
            c.start_service AS startService, c.end_service AS endService,
            d.city_id AS cityId, d.name AS cityName, d.print_type AS cityPrintType,
            d.phone AS cityPhone, d.link AS cityLink, d.office_address AS cityOffice,
            e.street_id AS streetId, e.name AS streetName,
            f.house_id AS houseId, f.number AS houseNumber,
            c.porch
          FROM fines a
          LEFT JOIN apartments b ON b.apartment_id = a.apartment_id
          LEFT JOIN cards c ON c.card_id = b.card_id
          LEFT JOIN cities d ON d.city_id = c.city_id
          LEFT JOIN streets e ON e.street_id = c.street_id
          LEFT JOIN houses f ON f.house_id = c.house_id
          WHERE a.fine_id = ?`, [this.documentId],
          (error, rows) => {
            connection.release();
            if (error) {
              // eslint-disable-next-line no-console
              console.log(`Error from PrintReceipts.extractFine(): ' ${error.message}`);
              reject();
            } else {
              resolve({ ...rows[0] } || null);
            }
          },
        );
      });
    });
  }

  generatePdf() {
    const doc = new PDFDocument();
    const filename = 'receipts.pdf';
    this.res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    this.res.setHeader('Content-type', 'application/pdf');

    const adImage = path.join(__dirname, '../../public/images/new_logo_2.jpg');

    doc.margins = {
      top: 14,
      bottom: 0,
      left: 0,
      right: 0,
    };

    doc.layout = 'portrait';

    doc.registerFont('Arial', 'fonts//arial.ttf');
    doc.registerFont('ArialBold', 'fonts//arialbd.ttf');

    const address = `${this.fine.address.full}`;

    doc.fontSize(8);

    const fullAddress = `${address}, кв. ${this.fine.apartment.number}${utils.decodeApartmentLetter(this.fine.apartment.letter)}`;

    const clientAccountData = [];
    clientAccountData.push(buildPersonalAccountForFine(7, this.fine.id));
    const clientAccount = clientAccountData.join('');
    const sum = this.fine.amount * 100;
    const outSum = `${sum}`.padStart(7, '0');

    const deadline = moment(this.fine.createDate).add(daysToPayReceipt, 'days').format('DD.MM.YYYY');
    const payMonth = this.fine.createDate.getMonth() + 1;
    const payYear = this.fine.createDate.getFullYear();

    // BarCode and QRCode
    const barCodeData = [];
    barCodeData.push(firm.payeeINN);
    barCodeData.push(`${payMonth}`.padStart(2, '0'));
    barCodeData.push(`${payYear - 2000}`.padStart(2, '0'));
    barCodeData.push(outSum);
    barCodeData.push(buildPersonalAccountForFine(7, this.fine.id));
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
    doc.text(`OOO «ДOМОФОН-СЕРВИС»  ${this.fine.address.city.phone}`, 154, 28, { align: 'left', width: 183 });

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
    doc.text('Оплата за ПОДКЛЮЧЕНИЕ', 154, 114, { align: 'left', width: 419 });

    doc.font('ArialBold');
    doc.text(`с ${moment(this.fine.contract.startService).format('DD.MM.YYYY')}  по  ${moment(this.fine.contract.endService).format('DD.MM.YYYY')} г., (Договор № ${this.fine.contract.normal})`, 154, 123, { align: 'left', width: 419 });

    doc.font('Arial');
    doc.text('Адрес плательщика', 154, 139, { align: 'left', width: 79 });

    doc.font('ArialBold')
      .fontSize(10)
      .text(`${fullAddress} (л/сч: ${clientAccount})`, 238, 137, { align: 'right', width: 335 });

    doc.font('Arial')
      .fontSize(11)
      .text('Сумма платежа, руб.', 154, 152, { align: 'left', width: 342 })
      .text(this.fine.amount.toFixed(2), 500, 152, { align: 'left', width: 72 });

    doc.font('ArialBold')
      .fontSize(11)
      .text('К оплате, руб.', 154, 178, { align: 'left', width: 342 })
      .text(this.fine.amount.toFixed(2), 500, 178, { align: 'left', width: 72 });

    doc.font('Arial')
      .fontSize(9)
      .text('Подпись плательщика', 367, 193, { align: 'right', width: 99 });

    // // Second third
    doc.fontSize(8);
    doc.font('ArialBold');
    doc.text(`OOO «ДOМОФОН-СЕРВИС»  ${this.fine.address.city.phone}  ${this.fine.address.city.office}`, 154, 219, { align: 'left', width: 360 });

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
    doc.text('Оплата за ПОДКЛЮЧЕНИЕ', 154, 305, { align: 'left', width: 419 });

    doc.font('ArialBold');
    doc.text(`с ${moment(this.fine.contract.startService).format('DD.MM.YYYY')}  по  ${moment(this.fine.contract.endService).format('DD.MM.YYYY')} г., (Договор № ${this.fine.contract.normal})`, 154, 314, { align: 'left', width: 419 });

    doc.font('Arial');
    doc.text('Адрес плательщика', 154, 326, { align: 'left', width: 79 });

    doc.font('ArialBold')
      .fontSize(10)
      .text(`${fullAddress} (л/сч: ${clientAccount})`, 238, 323, { align: 'right', width: 335 });

    doc.fontSize(8)
      .font('ArialBold')
      .text(`К оплате ${this.fine.amount.toFixed(2)}, руб.`, 154, 337, { align: 'left', width: 255 });

    doc.fontSize(9)
      .font('Arial')
      .text('Оплачено', 416, 337, { align: 'right', width: 51 });

    doc.fontSize(8)
      .font('ArialBold')
      .text('ПОДКЛЮЧЕНИЕ АБОНЕНТСКОГО УСТРОЙСТВА ПОСЛЕ ОПЛАТЫ КВИТАНЦИИ!', 154, 369, { align: 'left', width: 335 });
    // .text(`ОПЛАТИТЬ ДО ${deadline} г.`, 154, 352, { align: 'left', width: 189 });

    // doc
    //   .moveTo(152, 350)
    //   .lineTo(343, 350)
    //   .lineTo(343, 364)
    //   .lineTo(152, 364)
    //   .lineTo(152, 350)
    //   .stroke();

    doc.fontSize(9)
      .font('Arial')
      .text('Подпись плательщика', 368, 352, { align: 'right', width: 99 });

    const y = Number(this.fine.address.city.printType) === 1 ? 348 : 338;

    doc.fontSize(16)
      .text(`Тел. ${this.fine.address.city.phone}`, 35, y, { align: 'center', width: 102 })
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

    doc.rect(380, 265, 66, 12)
      .dash(1, { space: 1 })
      // .fill('red')
      .stroke();

    doc.rect(509, 265, 66, 12)
      .dash(1, { space: 1 })
      // .fill('green')
      .stroke();

    doc.rect(341, 289, 198, 12)
      .dash(1, { space: 1 })
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

    doc.pipe(this.res);
    doc.end();
  }

  async go() {
    await this.extractFine()
      .then((data) => {
        this.fine.id = data.id;
        this.fine.createDate = data.createDate;
        this.fine.paymentDate = data.paymentDate;
        this.fine.amount = data.amount;
        this.fine.porch = data.porch;
        this.fine.remark = data.remark;

        this.fine.contract.normal = data.contractNumber;
        this.fine.contract.prolonged = data.prolongedContractNumber;
        this.fine.contract.startService = data.startService;
        this.fine.contract.endService = data.endService;

        this.fine.address.city.id = data.cityId;
        this.fine.address.city.name = data.cityName;
        this.fine.address.city.printType = data.cityPrintType;
        this.fine.address.city.phone = data.cityPhone;
        this.fine.address.city.link = data.cityLink;
        this.fine.address.city.office = data.cityOffice;
        this.fine.address.street.id = data.streetId;
        this.fine.address.street.name = data.streetName;
        this.fine.address.house.id = data.houseId;
        this.fine.address.house.number = data.houseNumber;
        this.fine.address.full = this.fine.fullAddress;

        this.fine.apartment.number = data.apartmentNumber;
        this.fine.apartment.letter = data.apartmentLetter;
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.log(`Error: ${error.message}`);
      });

    this.generatePdf();
  }
}

module.exports.PrintReceipts = PrintReceipts;
