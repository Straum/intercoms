const fs = require('fs');
const path = require('path');
const iconvlite = require('iconv-lite');
const moment = require('moment');
const db = require('./db');
const { decodeApartmentLetter } = require('./utils');
const { firm } = require('./firm_bank_details');

const REPLACE_PART_INPUT_PATH = '\\public\\in';
const REPLACE_PART_OUTPUT_PATH = '\\public\\out';

const bankSlavia = {
  marker: 'dsrv',
};

const russianPost = {
  marker: 'DO',
};

const modelSberbank = {
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
  amountOfFeeToBank: '', // Сумма комиссии банку
};

const modelRussiaPost = {
  zipCode: '', // Код почтового отделения
  personalAccount: '',
  amountOfOperation: '',
  dayPayment: '',
  monthPayment: '',
  yearPayment: '',
};

const modelSlavia = {
  personalAccount: '', // Лицевой счет
  amountOfOperation: '', // Сумма операции
  paymentDate: '', // Дата платежа
};

const Payer = {
  isDuplicate: false,
  prolongContractNumber: '',
  letter: '',
  apartment: '',
};

const prepareData = {
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
  organizationId: 0,
};

function MakePayments() {
  this.processFile = {
    fullPath: '',
    buffer: {},
    name: [],
  };

  this.info = {
    warnings: 0,
    blocked: 0,
    lines: [],
  };

  this.gates = {
    warnings: 0,
    blocked: 0,
    lines: [],
  };

  this.fines = {
    lines: [],
  };

  return this;
}

function moveFile(fullPathIn, fullPathOut) {
  fs.rename(fullPathIn, fullPathOut, (err) => {
    if (err) {
      // eslint-disable-next-line no-console
      console.log(`Ошибка при перемещении файла ${fullPathIn}. Описание ошибки: ${err}`);
    }
    // eslint-disable-next-line no-console
    console.log(`Файл ${fullPathIn} успешно перемещен.`);
  });
}

function getFullApartment(data) {
  Payer.isDuplicate = Number(data.substr(0, 1)) > 0;
  Payer.prolongContractNumber = data.substr(1, 6);
  Payer.letter = data.substr(7, 1);
  Payer.apartment = data.substr(8, 3);

  return {
    apartment: Payer.apartment,
    letter: decodeApartmentLetter(Number(Payer.letter)),
  };
}

MakePayments.prototype.start = async function (destination, callback) {
  // eslint-disable-next-line no-console
  console.log('begin');
  const files = [];
  fs.readdirSync(destination).forEach((fileName) => {
    // eslint-disable-next-line no-console
    console.log(fileName);
    const outFile = `${destination}${fileName}`;
    files.push(outFile);
  });

  for (const file of files) {
    this.fileFullPath(file);
    await this.parseFile(true, function (error, data) {
      console.log('**', data);
    });
  }

  if (this.info.lines.length === 0) {
    this.info.lines.push('Нет данных');
  }

  this.info.lines.push('');
  this.info.lines.push(`Предупреждений: ${this.info.warnings}, заблокировано: ${this.info.blocked}.`);
  this.info.lines.unshift('');
  this.info.lines.unshift('Договора по домофонам');

  let information = [...this.info.lines];

  if (this.gates.lines.length > 0) {
    this.info.lines.push('********************');
    this.info.lines.push('Договора по воротам.');
    this.info.lines.push('');
    information = [...information, ...this.gates.lines];
    information.push('');
    information.push(`Предупреждений: ${this.gates.warnings}, заблокировано: ${this.gates.blocked}.`);
  }

  if (this.fines.lines.length > 0) {
    information.push('');
    information.push('********************');
    information.push('Подключения.');
    information.push('');
    information = [...information, ...this.fines.lines];
  }

  callback(null, information.join('\n'));
  // eslint-disable-next-line no-console
  console.log('end');
};

MakePayments.prototype.parseFile = async function (isEnablePayments) {
  const fileInfo = path.parse(this.processFile.fullPath);
  const words = fileInfo.name.split('_');

  const outPath = fileInfo.dir.replace(REPLACE_PART_INPUT_PATH, REPLACE_PART_OUTPUT_PATH);
  const fullPathOut = path.join(outPath, '/', fileInfo.base);

  this.processFile.buffer = fs.readFileSync(this.processFile.fullPath);
  this.processFile.name = fileInfo.name;

  if (Array.isArray(words) && (words.length > 0)) {
    switch (words.length) {
      case 2: {
        if (words[0].trim() === bankSlavia.marker) {
          await this.parseSlavia('win1251');
          moveFile(this.processFile.fullPath, fullPathOut);
          // eslint-disable-next-line no-console
          console.log('ЭТО СЛАВИЯ!!!!');
        }
        break;
      }
      case 3: {
        if ((words[0].trim().length === 1) && ((words[1].trim().length >= russianPost.marker.length)
          && (words[1].trim().substr(0, 2) === russianPost.marker))) {
          await this.parseRussianPost('cp866');
          moveFile(this.processFile.fullPath, fullPathOut);
          // eslint-disable-next-line no-console
          console.log('ЭТО ПОЧТА РОССИИ!!!!');
        }
        break;
      }
      case 5: {
        // if ((words[0].trim() === firm.newCategory) && (words[1].trim() === firm.INN)
        //   && (words[2].trim() === firm.personalAcc))
        if ((words[1].trim() === firm.category) && (words[2].trim() === firm.payeeINN)
          && (words[3].trim() === firm.personalAcc)) {
          await this.parseSberbank('win1251');
          moveFile(this.processFile.fullPath, fullPathOut);
          // eslint-disable-next-line no-console
          console.log('ЭТО СБЕРБАНК!!!!');
        }
        break;
      }
      default:
        break;
    }
  } else {
    // bad file, skip
  }
};

MakePayments.prototype.parseSberbank = async function (codePage) {
  const self = this;
  const strContent = iconvlite.decode(this.processFile.buffer, codePage);
  const lines = strContent.split(/\n/);
  let rowNumber = 1;

  for (const element of lines) {
    if ((element.trim().length !== 0) && (element.substr(0, 1) !== '=')) {
      const segments = element.trim().split(';');
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
            switch (data.prefix) {
              case 5:
                self.gates.warnings += data.warnings;
                self.gates.blocked += data.blocked;
                self.gates.lines = self.gates.lines.concat(data.lines);
                break;
              case 7:
                self.fines.lines = self.fines.lines.concat(data.lines);
                break;
              default:
                self.info.warnings += data.warnings;
                self.info.blocked += data.blocked;
                self.info.lines = self.info.lines.concat(data.lines);
                break;
            }
            console.log('personalAccounT: ' + prepareData.personalAccount);
          })
          .catch(function (error) {
            console.log('ERROR: ' + error.message);
          });
      }
      console.log(element);
    }
    rowNumber += 1;
  }
};

MakePayments.prototype.parseRussianPost = async function (codePage) {
  const self = this;
  const strContent = iconvlite.decode(this.processFile.buffer, codePage);
  const lines = strContent.split(/\n/);
  let rowNumber = 1;

  for (const element of lines) {
    if (element.trim().length !== 0) {
      const segments = element.trim().split('/');
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
            // self.info.warnings += data.warnings;
            // self.info.blocked += data.blocked;
            // self.info.lines = self.info.lines.concat(data.lines);
            // console.log('personalAccounT: ' + prepareData.personalAccount);
            if (data.prefix === 5) {
              self.gates.warnings += data.warnings;
              self.gates.blocked += data.blocked;
              self.gates.lines = self.gates.lines.concat(data.lines);
            } else {
              self.info.warnings += data.warnings;
              self.info.blocked += data.blocked;
              self.info.lines = self.info.lines.concat(data.lines);
            }
          })
          .catch(function (error) {
            console.log('ERROR: ' + error.message);
          });
      }
      console.log(element);
    }
    rowNumber += 1;
  }
};

MakePayments.prototype.parseSlavia = async function (codePage) {
  const self = this;
  const strContent = iconvlite.decode(this.processFile.buffer, codePage);
  const lines = strContent.split(/\n/);
  let rowNumber = 1;

  for (const element of lines) {
    if (element.trim().length !== 0) {
      const segments = element.trim().split(';');
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
            // self.info.warnings += data.warnings;
            // self.info.blocked += data.blocked;
            // self.info.lines = self.info.lines.concat(data.lines);
            // console.log('personalAccounT: ' + prepareData.personalAccount);
            if (data.prefix === 5) {
              self.gates.warnings += data.warnings;
              self.gates.blocked += data.blocked;
              self.gates.lines = self.gates.lines.concat(data.lines);
            } else {
              self.info.warnings += data.warnings;
              self.info.blocked += data.blocked;
              self.info.lines = self.info.lines.concat(data.lines);
            }
          })
          .catch(function (error) {
            console.log('ERROR: ' + error.message);
          });
      }
      console.log(element);
    }
    rowNumber += 1;
  }
};

MakePayments.prototype.insertData = function (data) {
  const self = this;

  return new Promise(function (resolve, reject) {

    console.log(`CALL enter_payment_depth_2_year("${data.personalAccount}","${data.apartment}","${data.letter}","${data.paymentDateTime}",${data.amount},${data.payMonth},${data.payYear},"${data.fileName}","${data.uniqueCode}","${data.zipCode}",${data.organizationId},0,0)`);

    db.get().getConnection(function (err, connection) {
      connection.query(
        'CALL enter_payment(?,?,?,?,?,?,?,?,?,?,?)', [
        // 'CALL enter_payment_depth_2_year(?,?,?,?,?,?,?,?,?,?,?,?,?)', [
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
          data.organizationId,
          // 0,
          // 0,
        ],
        function (error, rows) {
          connection.release();
          if (error) {
            // console.log('error:' + error.message);
            reject();
          } else {
            // console.log('Result:' + rows[0][0].result);
            const bigRow = rows[0][0].stringWarning;
            const lines = bigRow.split(';');
            const arr = [];
            if ((Array.isArray(lines)) && (lines.length > 0)) {
              lines.forEach(function (item) {
                if (item.trim() !== '') {
                  arr.push(item);
                }
              });
            }
            resolve({
              result: rows[0][0].result,
              warnings: rows[0][0].warnings,
              blocked: rows[0][0].blocked,
              lines: arr,
              prefix: rows[0][0].prefix,
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
