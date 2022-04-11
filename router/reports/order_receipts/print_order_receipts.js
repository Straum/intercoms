const path = require('path');
const moment = require('moment');
const PDFDocument = require('pdfkit');
const SVGtoPDF = require('svg-to-pdfkit');
const barcode = require('pure-svg-code/barcode');
const QRCode = require('qrcode-svg');

const db = require('../../../lib/db');
const utils = require('../../../lib/utils');
const { daysToPayReceipt } = require('../../../lib/config').config;
const { firm } = require('../../../lib/firm_bank_details');
const logger = require('../../../lib/winston');
const { Apartment } = require('./apartment');
const { Order } = require('./order');

class PrintOrderReceipts {
  constructor(cardId, res) {
    this.cardId = cardId;
    this.order = new Order();
    this.apartments = [];
    this.res = res;
    this.printReceiptsWithZeroDebt = true;
  }

  extractOrder() {
    return new Promise((resolve, reject) => {
      db.get().getConnection((err, connection) => {
        connection.query(
          `SELECT a.contract_number AS contractNumber, a.m_contract_number AS prolongedContractNumber,
          a.start_service AS startService, a.end_service AS endService, a.normal_payment AS normalPayment,
          a.privilege_payment AS privilegePayment, b.name AS cityName, b.print_type AS printType,
          b.phone, b.link AS vkLink, b.office_address AS office, c.name AS streetName, d.number AS houseNumber,
          m_duplicate AS isDuplicate, MONTH(a.end_service) AS payMonth, YEAR(a.end_service) AS payYear,
          a.rank
          FROM cards a
          LEFT JOIN cities b ON b.city_id = a.city_id
          LEFT JOIN streets c ON c.street_id = a.street_id
          LEFT JOIN houses d ON d.house_id = a.house_id
          WHERE a.card_id = ?`, [this.cardId],
          (error, rows) => {
            connection.release();
            if (error) {
              // eslint-disable-next-line no-console
              console.log(`Error from PrintReceipts.extractOrder(): ${error.message}`);
              reject();
            } else {
              const row = rows[0];
              resolve({
                contractNumber: row.contractNumber,
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
                payYear: row.payYear,
                rank: row.rank,
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
          'CALL find_debt_under_order_depth_2_year(?)', [this.cardId],
          (error, rows) => {
            connection.release();
            if (error) {
              // eslint-disable-next-line no-console
              console.log(`Error from PrintReceipts.calculateAccrual(): ${error.message}`);
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

  fillOrder(data) {
    this.order.contractNumber = data.contractNumber;
    this.order.prolongedContractNumber = data.prolongedContractNumber;
    this.order.startService = data.startService;
    this.order.endService = data.endService;
    this.order.normalPayment = data.normalPayment;
    this.order.privilegePayment = data.privilegePayment;
    this.order.city.name = data.cityName;
    this.order.city.printType = data.printType;
    this.order.city.phone = data.phone;
    this.order.city.vkLink = data.vkLink;
    this.order.city.office = data.office;
    this.order.streetName = data.streetName;
    this.order.houseNumber = data.houseNumber;
    this.order.payMonth = data.payMonth;
    this.order.payYear = data.payYear;
    this.order.rank = data.rank;

    if (this.order.rank) {
      this.order.prolongedContractNumber = data.contractNumber.toString();
    }
  }

  static fillApartment(data) {
    const apartment = new Apartment();
    apartment.id = data.apartmentId;
    apartment.number = data.number;
    apartment.letter = data.letter;
    apartment.privilege = data.privilege;
    apartment.locked = data.locked;
    apartment.exempt = data.exempt;
    apartment.debt.firstYear = data.lastOneYearDebt;
    apartment.debt.secondYear = data.lastSecondYearDebt;
    apartment.payment.current = data.currentPayment;
    if (apartment.privilege) {
      apartment.payment.currentYear = data.privilegePaymentCurrentYear;
      apartment.payment.firstYear = data.privilegePaymentFirstYear;
      apartment.payment.secondYear = data.privilegePaymentSecondYear;
    } else {
      apartment.payment.currentYear = data.normalPaymentCurrentYear;
      apartment.payment.firstYear = data.normalPaymentFirstYear;
      apartment.payment.secondYear = data.normalPaymentSecondYear;
    }
    apartment.enableCalc.firstYear = data.enableCalculateFirstYear !== 0;
    apartment.enableCalc.secondYear = data.enableCalculateSecondYear !== 0;
    return apartment;
  }

  generatePdf() {
    const doc = new PDFDocument();
    const filename = 'receipts.pdf';
    this.res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    this.res.setHeader('Content-type', 'application/pdf');

    const vkImage = path.join(__dirname, '../../../public/images/vk_logo_icon.jpg');
    const adImage = path.join(__dirname, '../../../public/images/new_logo_2.jpg');

    doc.margins = {
      top: 14,
      bottom: 0,
      left: 0,
      right: 0,
    };

    doc.layout = 'portrait';

    doc.registerFont('Arial', 'fonts//arial.ttf');
    doc.registerFont('ArialBold', 'fonts//arialbd.ttf');

    // First third
    const address = `${this.order.city.name}, ${this.order.streetName}, ${this.order.houseNumber}`;
    logger.info(`Договор ТО № ${this.order.prolongedContractNumber}`);
    logger.info(`Дата начала ТО : ${moment(this.order.startService).format('DD.MM.YYYY')}`);
    logger.info(`Дата конца ТО  : ${moment(this.order.endService).format('DD.MM.YYYY')}`);
    logger.info(`Плата обычная  : ${this.order.normalPayment.toFixed(2)}`);
    logger.info(`Плата льготная : ${this.order.privilegePayment.toFixed(2)}`);
    logger.info('');

    this.apartments.forEach((item, index) => {
      let apartmentInfoForLog = '';
      if (item.exempt === 0) {
        doc.fontSize(8);

        apartmentInfoForLog = `Кв. ${item.number}${utils.decodeApartmentLetter(item.letter)}`;
        let fullAddress = `${address}, кв. ${item.number}${utils.decodeApartmentLetter(item.letter)}`;
        if (this.order.city.printType === 2) {
          const VLuki = 'ВЕЛИКИЕ ЛУКИ';
          if (fullAddress.indexOf(VLuki) !== -1) {
            fullAddress = fullAddress.replace(VLuki, 'В.ЛУКИ');
          }
        }

        let rpts = 6 - (this.order.prolongedContractNumber.trim().length);
        const outContractNumber = (rpts > 0 ? '0'.repeat(rpts) : '') + this.order.prolongedContractNumber.trim();

        rpts = (3 - item.number.toString().trim().length);
        const outApartment = (rpts > 0 ? '0'.repeat(rpts) : '') + item.number.toString()
          .trim();

        const clientAccountData = [];
        clientAccountData.push(this.order.rank ? '5' : '0');
        clientAccountData.push(outContractNumber);
        clientAccountData.push(item.letter.toString());
        clientAccountData.push(outApartment);

        const clientAccount = clientAccountData.join('');

        let debt = item.calcDebt();
        let amount = item.payment.current;
        if (item.payment.current + item.payment.currentYear !== 0) {
          const totalCurrent = item.payment.currentYear - item.payment.current;
          const delta = debt - totalCurrent;
          if (delta > 0) {
            amount = item.payment.currentYear;
            debt -= totalCurrent;
          } else {
            amount = item.payment.currentYear + delta;
            debt = 0;
          }
        }

        const subtotal = amount + debt;

        const sum = parseInt(subtotal * 100, 10);

        const subtotalStr = parseInt(subtotal, 10).toString();
        rpts = 5 - (subtotalStr.length);
        const outSum = (rpts > 0 ? '0'.repeat(rpts) : '') + subtotalStr;

        let deadline = '';
        if (this.order.startService != null) {
          deadline = moment(this.order.startService).add(daysToPayReceipt, 'days').format('DD.MM.YYYY');
        }

        // BarCode and QRCode
        const barCodeData = [];
        barCodeData.push(firm.payeeINN);
        barCodeData.push(this.order.payMonth < 10 ? `0${this.order.payMonth}` : this.order.payMonth.toString());
        barCodeData.push((this.order.payYear - 2000) < 10 ? `0${this.order.payYear - 2000}` : (this.order.payYear - 2000).toString());
        barCodeData.push(outSum);
        barCodeData.push('00');
        barCodeData.push(this.order.rank ? '5' : '0');
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
        contentData.push(`KPP=${firm.KPP}|`);
        contentData.push(`Purpose=${firm.name}|`);

        contentData.push(`Sum=${sum.toString()}`);
        const content = contentData.join('');

        //-----------------------------------------------------

        doc.font('ArialBold');
        doc.text(`OOO «ДOМОФОН-СЕРВИС»  ${this.order.city.phone}`, 154, 28, { align: 'left', width: 183 });

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
        if (this.order.rank) {
          doc.text('Оплата за ГОДОВОЕ обслуживание дополнительного оборудования', 154, 114, { align: 'left', width: 419 });
          doc.text(`с ${moment(this.order.startService).format('DD.MM.YYYY')}  по  ${moment(this.order.endService).format('DD.MM.YYYY')} г., (Договор № ${this.order.contractNumber})`, 154, 123, { align: 'left', width: 419 });
          doc.font('Arial');
        } else {
          doc.text(`Оплата за ГОДОВОЕ обслуживание домофона с ${moment(this.order.startService).format('DD.MM.YYYY')} по ${moment(this.order.endService).format('DD.MM.YYYY')} г., (Договор № ${this.order.prolongedContractNumber})`, 154, 114, { align: 'left', width: 419 });
          doc.font('Arial');
          doc.text('(наименование платежа)', 154, 123, { align: 'center', width: 419 });
        }

        doc.text('Адрес плательщика', 154, 139, { align: 'left', width: 79 });

        doc.font('ArialBold')
          .fontSize(10)
          .text(`${fullAddress} (л/сч: ${clientAccount})`, 238, 137, { align: 'left', width: 335 });

        doc.font('Arial')
          .fontSize(11)
          .text('Сумма платежа, руб.', 154, 152, { align: 'left', width: 342 })
          .text(amount.toFixed(2), 500, 152, { align: 'left', width: 72 });

        apartmentInfoForLog += `, платеж: ${parseFloat(amount).toFixed(2)}`;

        if (debt !== 0) {
          doc
            .text(`Задолженность за период с ${moment(this.order.startService).subtract(1, 'years').format('DD.MM.YYYY')} по ${moment(this.order.endService).subtract(1, 'years').format('DD.MM.YYYY')}, руб.`, 154, 165, { align: 'left', width: 342 })
            .text(parseFloat(debt).toFixed(2), 500, 165, { align: 'left', width: 72 });
          apartmentInfoForLog += `, задолженность: ${parseFloat(debt).toFixed(2)}`;
        }

        apartmentInfoForLog += `, к оплате: ${subtotal.toFixed(2)}`;
        logger.info(apartmentInfoForLog);

        doc.font('ArialBold')
          .fontSize(11)
          .text('К оплате, руб.', 154, 178, { align: 'left', width: 342 })
          .text(subtotal.toFixed(2), 500, 178, { align: 'left', width: 72 })

          .fontSize(10)
          .text(this.order.city.vkLink, 170, 193, { align: 'left', width: 108 });

        doc.font('Arial')
          .fontSize(9)
          .text('Подпись плательщика', 367, 193, { align: 'right', width: 99 });

        if (!this.order.rank) {
          doc.image(vkImage, 154, 193, { width: 12 });
        }

        // // Second third
        doc.fontSize(8);
        doc.font('ArialBold');
        doc.text(`OOO «ДOМОФОН-СЕРВИС»  ${this.order.city.phone}  ${this.order.city.office}`, 154, 219, { align: 'left', width: 360 });

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
        if (this.order.rank) {
          doc.text('Оплата за ГОДОВОЕ обслуживание дополнительного оборудования', 154, 305, { align: 'left', width: 419 });
          doc.text(`с ${moment(this.order.startService).format('DD.MM.YYYY')}  по  ${moment(this.order.endService).format('DD.MM.YYYY')} г., (Договор № ${this.order.contractNumber})`, 154, 314, { align: 'left', width: 419 });
          doc.font('Arial');
        } else {
          doc.text(`Оплата за ГОДОВОЕ обслуживание домофона с ${moment(this.order.startService).format('DD.MM.YYYY')} по ${moment(this.order.endService).format('DD.MM.YYYY')} г., (Договор № ${this.order.prolongedContractNumber})`, 154, 305, { align: 'left', width: 419 });
          doc.font('Arial');
          doc.text('(наименование платежа)', 154, 314, { align: 'center', width: 419 });
        }

        // doc.font('Arial');
        // doc.text('(наименование платежа)', 154, 314, { align: 'center', width: 419 });

        doc.text('Адрес плательщика', 154, 326, { align: 'left', width: 79 });

        doc.font('ArialBold')
          .fontSize(10)
          .text(`${fullAddress} (л/сч: ${clientAccount})`, 238, 323, { align: 'left', width: 335 });

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

        if (!this.order.rank) {
          doc.image(vkImage, 154, 369, { width: 12 });
        }

        const y = Number(this.order.city.printType) === 1 ? 348 : 338;
        doc.font('ArialBold');

        if (!this.order.rank) {
          doc.fontSize(10)
            .text(this.order.city.vkLink, 169, 369, { align: 'left', width: 108 });
        }

        doc.fontSize(16)
          .text(`Тел. ${this.order.city.phone}`, 35, y, { align: 'center', width: 102 })

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
          .stroke();

        doc.rect(509, 265, 66, 12)
          .dash(1, { space: 1 })
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
    const orderData = await this.extractOrder();
    this.fillOrder(orderData);

    const data = await this.calculateAccrual();
    data.forEach((item) => {
      const apartment = PrintOrderReceipts.fillApartment(item);
      if (apartment.calcDebt() + apartment.payment.current !== 0) {
        this.apartments.push(apartment);
      }
    });

    logger.info('');
    logger.info('Печать квитаниций по квартирам');
    this.generatePdf();
    logger.info('');
  }

  async oneApartment(apartmentId) {
    const orderData = await this.extractOrder();
    this.fillOrder(orderData);

    const data = await this.calculateAccrual();
    const oneApartment = data.filter((item) => item.apartmentId === +apartmentId);
    if (oneApartment.length === 1) {
      const obj = { ...oneApartment[0] };
      const apartment = PrintOrderReceipts.fillApartment(obj);
      this.apartments.push(apartment);
    }

    logger.info('');
    logger.info('Печать квитаниции по квартире');
    this.generatePdf();
    logger.info('');
  }
}

module.exports.PrintOrderReceipts = PrintOrderReceipts;
