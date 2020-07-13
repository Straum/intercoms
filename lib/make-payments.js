'use strict';

const fs = require('fs');
const path = require('path');
const iconvlite = require('iconv-lite');
var db = require('../lib/db');
var decodeApartmentLetter = require('../lib/utils').decodeApartmentLetter;
var moment = require('moment');
const { Console } = require('console');

const detailsOfCompany = {
  category: '1488003966',
  INN: '6027089952',
  personalAccount: '40702810351000104846'
};

const bankSlavia = {
  marker: 'dsrv'
};

const russianPost = {
  marker: 'DO'
}

var modelSberbank = {
  paymentDate: '', // Дата платежа
  paymentTime: '', // Время платежа
  departmentNumber: '', // Номер отделения
  cashierNumber: '', // Номер кассира/УС/СБОЛ
  uniqueTransactionCode: '', // Уникальный код операции в ЕПС (СУИП)
  personalAccount: '', // Лицевой счет
  lastName: '', // Фамилия, Имя, Отчество
  fullAddress: '', // Адрес
  paymentPeriod: '', // Период оплаты
  amountOfOperation: '', // Сумма операции
  transferAmount: '', // Сумма перевода
  amountOfFeeToBank: '' // Сумма комиссии банку
}

var Payer = {
  isDuplicate: false,
  prolongContractNumber: '',
  letter: '',
  apartment: ''
}

function MakePayments() {

  this.processFile = {
    fullPath: '',
    buffer: {},
    name: ''
  },

  this.info = {
    warnings: 0,
    blocked: 0,
    lines: []
  }

  return this;
};

MakePayments.prototype.start = async function (destination, callback) {
  console.log('begin');
  var files = [];
  fs.readdirSync(destination).forEach(fileName => {
    console.log(fileName);
    var outFile = destination + fileName;

    files.push(outFile);

    // this.fileFullPath(outFile);
    // this.parseFile(true, function(error, data) {
    //   console.log('**', data);
    // });

  });

  for (var file of files ) {
    this.fileFullPath(file);
    await this.parseFile(true, function(error, data) {
        console.log('**', data);
      });
  }
  callback(null, this.info);
  console.log('end');
}

MakePayments.prototype.parseFile = async function (isEnablePayments) {

  var fileInfo = path.parse(this.processFile.fullPath);
  var words = fileInfo.name.split('_');

  this.processFile.buffer = fs.readFileSync(this.processFile.fullPath);
  this.processFile.name = fileInfo.name;

  if (Array.isArray(words) && (words.length > 0)) {

    switch (words.length) {
      case 2:
        if (words[0].trim() == bankSlavia.marker) {
          console.log('ЭТО СЛАВИЯ!!!!');
        }
        return;
      case 3:
        if ((words[0].trim().length === 1) && ((words[1].trim().length >= russianPost.marker.length) && (words[1].trim().substr(0, 2) == russianPost.marker))) {
          console.log('ЭТО ПОЧТА РОССИИ!!!!');
        }
        return;
      case 4:
        if ((words[0].trim() == detailsOfCompany.category) && (words[1].trim() == detailsOfCompany.INN) && (words[2].trim() == detailsOfCompany.personalAccount)) {
          await this.parseSberbank('win1251');
          console.log('ЭТО СБЕРБАНК!!!!');
        }
        return;
      default:
        // bad file, skip
        return;
    }
  }
  else {
    // bad file, skip
  }
};

MakePayments.prototype.parseSberbank = async function (codePage) {
  var self = this;
  var strContent = iconvlite.decode(this.processFile.buffer, codePage);
  var lines = strContent.split(/\n/);
  // lines.forEach(function (element) {
  for (const element of lines) {

    if ((element.trim().length != 0) && (element.substr(0, 1) != '=')) {
      let segments = element.trim().split(';');
      if ((Array.isArray(segments)) && (segments.length <= 13)) {

        modelSberbank.paymentDate = segments[0];
        modelSberbank.paymentTime = segments[1];
        modelSberbank.departmentNumber = segments[2];
        modelSberbank.cashierNumber = segments[3];
        modelSberbank.uniqueTransactionCode = segments[4];
        modelSberbank.personalAccount = segments[5];
        modelSberbank.lastName = segments[6];
        modelSberbank.fullAddress = segments[7];
        modelSberbank.paymentPeriod = segments[8];
        modelSberbank.amountOfOperation = segments[9];
        modelSberbank.transferAmount = segments[10];
        modelSberbank.amountOfFeeToBank = segments[11];

        // console.log('personalAccounT: ' + modelSberbank.personalAccount);

        await this.insertDataFromSberbank(modelSberbank)
          .then(function (data) {
            self.info.warnings += data.warnings;
            self.info.blocked += data.blocked;
            self.info.lines = self.info.lines.concat(data.lines);
            console.log('personalAccounT: ' + modelSberbank.personalAccount);
          })
          .catch(function (error) {
            console.log('ERROR: ' + error.message);
          });

      }
      console.log(element);
    }
  }

  // });
};

MakePayments.prototype.insertDataFromSberbank = function (data) {
  var self = this;

  return new Promise(function (resolve, reject) {

    Payer.isDuplicate = Number(data.personalAccount.substr(0, 1)) > 0;
    Payer.prolongContractNumber = data.personalAccount.substr(1, 6);
    Payer.letter = data.personalAccount.substr(7, 1);
    Payer.apartment = data.personalAccount.substr(8, 3);

    var fullApartment = Number(Payer.apartment) + decodeApartmentLetter(Number(Payer.letter));

    var paymentDateTimeString = data.paymentDate.trim() + ' ' + data.paymentTime;
    var paymentDateTime = moment(paymentDateTimeString, 'DD-MM-YYYY HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
    console.log(paymentDateTime);

    db.get().getConnection(function (err, connection) {
      connection.query(
        'CALL enter_payment(?,?,?,?,?,?,?,?,?)', [
          data.personalAccount,
          fullApartment,
          paymentDateTime,
          data.amountOfOperation.replace(/,/g, '.'),
          Number(data.paymentPeriod.substr(0, 2)),
          Number(data.paymentPeriod.substr(2, 2)) + 2000,
          self.processFile.name,
          data.uniqueTransactionCode,
          1
        ],
        function (err, rows) {
          connection.release();
          if (err) {
            console.log('err:' + err.message);
            reject();
          }
          else {
            // console.log('success!');
            // console.log(rows[0]);
            console.log('Result:' + rows[0][0].result);
            var bigRow = rows[0][0].stringWarning;
            var lines = bigRow.split(';');
            var arr = [];
            if ((Array.isArray(lines)) && (lines.length > 0)) {
              lines.forEach(function(item) {
                if (item.trim() != '') {
                  arr.push(item);
                }
              })
            }

            resolve({
              result: rows[0][0].result,
              warnings: rows[0][0].warnings,
              blocked: rows[0][0].blocked,
              lines: arr
            });
          }
        });
    });
  });

};

MakePayments.prototype.fileFullPath = function (fileFullPath) {
  if (this.processFile.fullPatfileFullPathh != fileFullPath) {
    this.processFile.fullPath = fileFullPath;
  }
};

module.exports.MakePayments = MakePayments;