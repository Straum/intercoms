'use strict';

const fs = require('fs');
const path = require('path');
const iconvlite = require('iconv-lite');
var db = require('../lib/db');
var decodeApartmentLetter = require('../lib/utils').decodeApartmentLetter;
var moment = require('moment');
const { Console } = require('console');

const REPLACE_PART_INPUT_PATH = '\\public\\in';
const REPLACE_PART_OUTPUT_PATH = '\\public\\out';

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

var modelRussiaPost = {
  zipCode: '', // Код почтового отделения
  personalAccount: '',
  amountOfOperation: '',
  dayPayment: '',
  monthPayment: '',
  yearPayment: ''
}

var modelSlavia = {
  personalAccount: '', // Лицевой счет
  amountOfOperation: '', // Сумма операции
  paymentDate: '', // Дата платежа
}

var Payer = {
  isDuplicate: false,
  prolongContractNumber: '',
  letter: '',
  apartment: ''
}

var prepareData = {
  personalAccount: '',
  apartment: '',
  letter: '',
  paymentDateTime: '',
  amount: '',
  payMonth: 0,
  payYear: 0,
  fileName: '',
  uniqueCode: '',
  zipCode: '',
  organizationId: 0
}

function MakePayments() {

  this.processFile = {
    fullPath: '',
    buffer: {},
    name: []
  },

    this.info = {
      warnings: 0,
      blocked: 0,
      lines: []
    }

  return this;
};

function moveFile(fullPathIn, fullPathOut) {
  fs.rename(fullPathIn, fullPathOut, function (err) {
    if (err) {
      console.log('Ошибка при перемещении файла ' + fullPathIn + '. Описание ошибки: ' + err);
    }
    console.log('Файл ' + fullPathIn + ' успешно перемещен');
  });
};

function getFullApartment(data) {
  Payer.isDuplicate = Number(data.substr(0, 1)) > 0;
  Payer.prolongContractNumber = data.substr(1, 6);
  Payer.letter = data.substr(7, 1);
  Payer.apartment = data.substr(8, 3);

  return {
    apartment: Payer.apartment,
    letter: decodeApartmentLetter(Number(Payer.letter))
  };
}

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

  for (var file of files) {
    this.fileFullPath(file);
    await this.parseFile(true, function (error, data) {
      console.log('**', data);
    });
  }

  if (this.info.lines.length === 0) {
    this.info.lines.push('Нет данных.');
  }

  this.info.lines.push('');
  this.info.lines.push('Предупреждений: ' + this.info.warnings + ', ' + 'заблокировано: ' + this.info.blocked + '.');
  callback(null, this.info.lines.join('\n'));
  console.log('end');
}

MakePayments.prototype.parseFile = async function (isEnablePayments) {
  var self = this;

  var fileInfo = path.parse(this.processFile.fullPath);
  var words = fileInfo.name.split('_');

  var outPath = fileInfo.dir.replace(REPLACE_PART_INPUT_PATH, REPLACE_PART_OUTPUT_PATH);
  var fullPathOut = path.join(outPath, '/', fileInfo.base);

  this.processFile.buffer = fs.readFileSync(this.processFile.fullPath);
  this.processFile.name = fileInfo.name;

  if (Array.isArray(words) && (words.length > 0)) {

    switch (words.length) {
      case 2:
        if (words[0].trim() == bankSlavia.marker) {
          await this.parseSlavia('win1251');
          moveFile(this.processFile.fullPath, fullPathOut);
          console.log('ЭТО СЛАВИЯ!!!!');
        }
        return;
      case 3:
        if ((words[0].trim().length === 1) && ((words[1].trim().length >= russianPost.marker.length) && (words[1].trim().substr(0, 2) == russianPost.marker))) {
          await this.parseRussianPost('cp866');
          moveFile(this.processFile.fullPath, fullPathOut);
          console.log('ЭТО ПОЧТА РОССИИ!!!!');
        }
        return;
      case 4:
        if ((words[0].trim() == detailsOfCompany.category) && (words[1].trim() == detailsOfCompany.INN) && (words[2].trim() == detailsOfCompany.personalAccount)) {
          await this.parseSberbank('win1251');
          moveFile(this.processFile.fullPath, fullPathOut);
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
  var rowNumber = 1;

  for (const element of lines) {

    if ((element.trim().length != 0) && (element.substr(0, 1) != '=')) {
      let segments = element.trim().split(';');
      if ((Array.isArray(segments)) && (segments.length <= 13)) {

        modelSberbank.paymentDate = segments[0].trim();
        modelSberbank.paymentTime = segments[1].trim();
        modelSberbank.departmentNumber = segments[2].trim();
        modelSberbank.cashierNumber = segments[3].trim();
        modelSberbank.uniqueTransactionCode = segments[4].trim();
        modelSberbank.personalAccount = segments[5].trim();
        modelSberbank.lastName = segments[6].trim();
        modelSberbank.fullAddress = segments[7].trim();
        modelSberbank.paymentPeriod = segments[8].trim();
        modelSberbank.amountOfOperation = segments[9].trim();
        modelSberbank.transferAmount = segments[10].trim();
        modelSberbank.amountOfFeeToBank = segments[11].trim();

        var paymentDateTimeString = modelSberbank.paymentDate.trim() + ' ' + modelSberbank.paymentTime;
        var info = getFullApartment(modelSberbank.personalAccount);

        prepareData.personalAccount = modelSberbank.personalAccount;
        prepareData.apartment = Number(info.apartment);
        prepareData.letter = info.letter;
        prepareData.paymentDateTime = moment(paymentDateTimeString, 'DD-MM-YYYY HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
        prepareData.amount = modelSberbank.amountOfOperation.replace(/,/g, '.');
        prepareData.payMonth = Number(modelSberbank.paymentPeriod.substr(0, 2));
        prepareData.payYear = Number(modelSberbank.paymentPeriod.substr(2, 2)) + 2000;
        prepareData.fileName = this.processFile.name;
        prepareData.uniqueCode = rowNumber.toString() + '_' + modelSberbank.uniqueTransactionCode;
        prepareData.zipCode = '';
        prepareData.organizationId = 0;

        await this.insertData(prepareData)
          .then(function (data) {
            self.info.warnings += data.warnings;
            self.info.blocked += data.blocked;
            self.info.lines = self.info.lines.concat(data.lines);
            console.log('personalAccounT: ' + prepareData.personalAccount);
          })
          .catch(function (error) {
            console.log('ERROR: ' + error.message);
          });
        // await this.insertDataFromSberbank(modelSberbank)
        //   .then(function (data) {
        //     self.info.warnings += data.warnings;
        //     self.info.blocked += data.blocked;
        //     self.info.lines = self.info.lines.concat(data.lines);
        //     console.log('personalAccounT: ' + modelSberbank.personalAccount);
        //   })
        //   .catch(function (error) {
        //     console.log('ERROR: ' + error.message);
        //   });

      }
      console.log(element);
    }
    rowNumber++;
  }

};

MakePayments.prototype.parseRussianPost = async function (codePage) {
  var self = this;
  var strContent = iconvlite.decode(this.processFile.buffer, codePage);
  var lines = strContent.split(/\n/);
  var rowNumber = 1;

  for (const element of lines) {

    if (element.trim().length != 0) {
      let segments =
        element.trim().split('/');

      if ((Array.isArray(segments)) && (segments.length === 3)) {

        var desiredString = segments[0];
        var data = desiredString.trim().replace(/  +/g, ' ').split(' ');

        modelRussiaPost.zipCode = data[0].trim();
        modelRussiaPost.personalAccount = data[1].trim();
        modelRussiaPost.amountOfOperation = data[2].trim();
        modelRussiaPost.dayPayment = data[3].trim();

        modelRussiaPost.monthPayment = segments[1].trim();
        modelRussiaPost.yearPayment = segments[2].trim();

        var paymentDateTimeString = modelRussiaPost.yearPayment + '-' + modelRussiaPost.monthPayment + '-' + modelRussiaPost.dayPayment;
        var info = getFullApartment(modelRussiaPost.personalAccount);

        prepareData.personalAccount = modelRussiaPost.personalAccount;
        prepareData.apartment = Number(info.apartment);
        prepareData.letter = info.letter;
        prepareData.paymentDateTime = moment(paymentDateTimeString).format('YYYY-MM-DD HH:mm:ss');
        prepareData.amount = modelRussiaPost.amountOfOperation.replace(/,/g, '.');
        prepareData.payMonth = Number(modelRussiaPost.monthPayment);
        prepareData.payYear = Number(modelRussiaPost.yearPayment);
        prepareData.fileName = this.processFile.name;
        prepareData.uniqueCode = rowNumber.toString() + '_' + modelRussiaPost.zipCode + '_' + modelRussiaPost.personalAccount;
        prepareData.zipCode = modelRussiaPost.zipCode;
        prepareData.organizationId = 1;

        await this.insertData(prepareData)
          .then(function (data) {
            self.info.warnings += data.warnings;
            self.info.blocked += data.blocked;
            self.info.lines = self.info.lines.concat(data.lines);
            console.log('personalAccounT: ' + prepareData.personalAccount);
          })
          .catch(function (error) {
            console.log('ERROR: ' + error.message);
          });

        // await this.insertDataFromRussiaPost(modelRussiaPost)
        //   .then(function (data) {
        //     self.info.warnings += data.warnings;
        //     self.info.blocked += data.blocked;
        //     self.info.lines = self.info.lines.concat(data.lines);
        //     console.log('personalAccounT: ' + modelRussiaPost.personalAccount);
        //   })
        //   .catch(function (error) {
        //     console.log('ERROR: ' + error.message);
        //   });

      }
      console.log(element);
    }
    rowNumber++;
  }
  };

MakePayments.prototype.parseSlavia = async function (codePage) {
  var self = this;
  var strContent = iconvlite.decode(this.processFile.buffer, codePage);
  var lines = strContent.split(/\n/);
  var rowNumber = 1;

  for (const element of lines) {

    if (element.trim().length != 0) {
      let segments = element.trim().split(';');
      if ((Array.isArray(segments)) && (segments.length <= 10)) {

        modelSlavia.personalAccount = segments[0].trim();
        modelSlavia.uniqueTransactionCode = rowNumber.toString() + '_' + modelSlavia.personalAccount; // emulate unique transaction
        modelSlavia.amountOfOperation = segments[3];
        modelSlavia.paymentDate = segments[9];

        var paymentDateTimeString = modelSlavia.paymentDate;
        var info = getFullApartment(modelSlavia.personalAccount);
        var dt = paymentDateTimeString.split('/');

        prepareData.personalAccount = modelSlavia.personalAccount;
        prepareData.apartment = Number(info.apartment);
        prepareData.letter = info.letter;
        prepareData.paymentDateTime = moment(paymentDateTimeString, 'DD/MM/YYYY HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
        prepareData.amount = modelSlavia.amountOfOperation.replace(/,/g, '.');
        prepareData.payMonth = Number(dt[1]);
        prepareData.payYear = Number(dt[2]);
        prepareData.fileName = this.processFile.name;
        prepareData.uniqueCode = rowNumber.toString() + '_' + modelSlavia.personalAccount;
        prepareData.zipCode = '';
        prepareData.organizationId = 4;

        await this.insertData(prepareData)
          .then(function (data) {
            self.info.warnings += data.warnings;
            self.info.blocked += data.blocked;
            self.info.lines = self.info.lines.concat(data.lines);
            console.log('personalAccounT: ' + prepareData.personalAccount);
          })
          .catch(function (error) {
            console.log('ERROR: ' + error.message);
          });
        // await this.insertDataFromSlavia(modelSlavia)
        //   .then(function (data) {
        //     self.info.warnings += data.warnings;
        //     self.info.blocked += data.blocked;
        //     self.info.lines = self.info.lines.concat(data.lines);
        //     console.log('personalAccounT: ' + modelSlavia.personalAccount);
        //   })
        //   .catch(function (error) {
        //     console.log('ERROR: ' + error.message);
        //   });

      }
      console.log(element);
    }
    rowNumber++;
  }

};

// MakePayments.prototype.insertDataFromSberbank = function (data) {
//   var self = this;

//   return new Promise(function (resolve, reject) {

//     Payer.isDuplicate = Number(data.personalAccount.substr(0, 1)) > 0;
//     Payer.prolongContractNumber = data.personalAccount.substr(1, 6);
//     Payer.letter = data.personalAccount.substr(7, 1);
//     Payer.apartment = data.personalAccount.substr(8, 3);

//     var fullApartment = Number(Payer.apartment) + decodeApartmentLetter(Number(Payer.letter));

//     var paymentDateTimeString = data.paymentDate.trim() + ' ' + data.paymentTime;
//     var paymentDateTime = moment(paymentDateTimeString, 'DD-MM-YYYY HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
//     console.log(paymentDateTime);

//     db.get().getConnection(function (err, connection) {
//       connection.query(
//         'CALL enter_payment(?,?,?,?,?,?,?,?,?,?)', [
//         data.personalAccount,
//         fullApartment,
//         paymentDateTime,
//         data.amountOfOperation.replace(/,/g, '.'),
//         Number(data.paymentPeriod.substr(0, 2)),
//         Number(data.paymentPeriod.substr(2, 2)) + 2000,
//         self.processFile.name,
//         data.uniqueTransactionCode,
//         '',
//         0
//       ],
//         function (err, rows) {
//           connection.release();
//           if (err) {
//             console.log('err:' + err.message);
//             reject();
//           }
//           else {
//             // console.log('success!');
//             // console.log(rows[0]);
//             console.log('Result:' + rows[0][0].result);
//             var bigRow = rows[0][0].stringWarning;
//             var lines = bigRow.split(';');
//             var arr = [];
//             if ((Array.isArray(lines)) && (lines.length > 0)) {
//               lines.forEach(function (item) {
//                 if (item.trim() != '') {
//                   arr.push(item);
//                 }
//               })
//             }

//             resolve({
//               result: rows[0][0].result,
//               warnings: rows[0][0].warnings,
//               blocked: rows[0][0].blocked,
//               lines: arr
//             });
//           }
//         });
//     });
//   });
// };

// MakePayments.prototype.insertDataFromRussiaPost = function (data) {
//   var self = this;

//   return new Promise(function (resolve, reject) {

//     Payer.isDuplicate = Number(data.personalAccount.substr(0, 1)) > 0;
//     Payer.prolongContractNumber = data.personalAccount.substr(1, 6);
//     Payer.letter = data.personalAccount.substr(7, 1);
//     Payer.apartment = data.personalAccount.substr(8, 3);

//     var fullApartment = Number(Payer.apartment) + decodeApartmentLetter(Number(Payer.letter));

//     var paymentDateTimeString = data.yearPayment + '-' + data.monthPayment + '-' + data.dayPayment;
//     var paymentDateTime = moment(paymentDateTimeString).format('YYYY-MM-DD HH:mm:ss');
//     console.log(paymentDateTime);

//     db.get().getConnection(function (err, connection) {
//       connection.query(
//         'CALL enter_payment(?,?,?,?,?,?,?,?,?,?)', [
//         data.personalAccount,
//         fullApartment,
//         paymentDateTime,
//         data.amountOfOperation.replace(/,/g, '.'),
//         Number(data.monthPayment),
//         Number(data.yearPayment),
//         self.processFile.name,
//         data.uniqueTransactionCode,
//         data.zipCode,
//         1
//       ],
//         function (err, rows) {
//           connection.release();
//           if (err) {
//             console.log('err:' + err.message);
//             reject();
//           }
//           else {
//             // console.log('success!');
//             // console.log(rows[0]);
//             console.log('Result:' + rows[0][0].result);
//             var bigRow = rows[0][0].stringWarning;
//             var lines = bigRow.split(';');
//             var arr = [];
//             if ((Array.isArray(lines)) && (lines.length > 0)) {
//               lines.forEach(function (item) {
//                 if (item.trim() != '') {
//                   arr.push(item);
//                 }
//               })
//             }

//             resolve({
//               result: rows[0][0].result,
//               warnings: rows[0][0].warnings,
//               blocked: rows[0][0].blocked,
//               lines: arr
//             });
//           }
//         });
//     });
//   });
// };

// MakePayments.prototype.insertDataFromSlavia = function (data) {
//   var self = this;

//   return new Promise(function (resolve, reject) {

//     Payer.isDuplicate = Number(data.personalAccount.substr(0, 1)) > 0;
//     Payer.prolongContractNumber = data.personalAccount.substr(1, 6);
//     Payer.letter = data.personalAccount.substr(7, 1);
//     Payer.apartment = data.personalAccount.substr(8, 3);

//     var fullApartment = Number(Payer.apartment) + decodeApartmentLetter(Number(Payer.letter));

//     var paymentDateTimeString = data.paymentDate;
//     var paymentDateTime = moment(paymentDateTimeString, 'DD/MM/YYYY HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
//     console.log(paymentDateTime);

//     var dt = paymentDateTimeString.split('/');

//     db.get().getConnection(function (err, connection) {
//       connection.query(
//         'CALL enter_payment(?,?,?,?,?,?,?,?,?,?)', [
//         data.personalAccount,
//         fullApartment,
//         paymentDateTime,
//         data.amountOfOperation.replace(/,/g, '.'),
//         Number(dt[1]),
//         Number(dt[2]),
//         self.processFile.name,
//         data.uniqueTransactionCode,
//         '',
//         4
//       ],
//         function (err, rows) {
//           connection.release();
//           if (err) {
//             console.log('err:' + err.message);
//             reject();
//           }
//           else {
//             // console.log('success!');
//             // console.log(rows[0]);
//             console.log('Result:' + rows[0][0].result);
//             var bigRow = rows[0][0].stringWarning;
//             var lines = bigRow.split(';');
//             var arr = [];
//             if ((Array.isArray(lines)) && (lines.length > 0)) {
//               lines.forEach(function (item) {
//                 if (item.trim() != '') {
//                   arr.push(item);
//                 }
//               })
//             }

//             resolve({
//               result: rows[0][0].result,
//               warnings: rows[0][0].warnings,
//               blocked: rows[0][0].blocked,
//               lines: arr
//             });
//           }
//         });
//     });
//   });
// };

MakePayments.prototype.insertData = function (data) {
  var self = this;

  return new Promise(function (resolve, reject) {
    db.get().getConnection(function (err, connection) {
      connection.query(
        'CALL enter_payment(?,?,?,?,?,?,?,?,?,?,?)', [
        data.personalAccount,
        data.apartment,
        data.letter,
        data.paymentDateTime,
        data.amount,
        data.payMonth,
        data.payYear,
        data.fileName,
        data.uniqueCode,
        data.zipCode,
        data.organizationId
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
              lines.forEach(function (item) {
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