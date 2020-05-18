'use strict';

exports.decodeApartmentLetter = function (number) {
  switch (number) {
    case 1:
      return 'а';
    case 2:
      return 'б';
    case 3:
      return 'в';
    case 4:
      return 'г';
    case 5:
      return 'д';
    case 6:
      return 'е';
    case 7:
      return 'м';
    case 8:
      return 'з';
    case 9:
      return 'к';
    default:
      return '';
  }
};

exports.russianNamesOfMonth = [
  'январь',
  'февраль',
  'март',
  'апрель',
  'май',
  'июнь',
  'июль',
  'август',
  'сентябрь',
  'октябрь',
  'ноябрь',
  'декабрь'
];

exports.paymentMethod = [
  'Квитанция',
  'Вручную'
];

exports.maintenanceContract = [
  'Нет',
  'Есть',
  'Приостановлено'
];

exports.paymentTypes = [
  'Нет данных',
  'Безналичными',
  'Наличными'
];

exports.enumCertificates = [
  {id: 0, value: 'Нет данных'},
  {id: 1, value: 'Паспорт гражданина России'},
  {id: 2, value: 'Загранпаспорт гражданина Рoccии'},
  {id: 3, value: 'Паспорт гражданина СССР'},
  {id: 4, value: 'Загранпаспорт гр. СССР'},
  {id: 5, value: 'Удостоверение личности офицера'},
  {id: 6, value: 'Военный билет солдата (матроса, сержанта, старшины)'},
  {id: 7, value: 'Военный билет офицера запаса'},
  {id: 16, value: 'Иностранный паспорт'},
];

exports.convertDateToMySQLDate = function(date, onlyDate) {
  this._isValid = false;
  this._outputDate = date;

  this.verify = function() {
    if (typeof date !== 'string') return;
    var dt = date.trim();
    var arr = dt.split(' ');
    if ((typeof arr === 'object') && (Array.isArray(arr))) {
      if (arr.length >= 1) {
        if (arr[0].trim().length !== 10) return;
        var day = arr[0].substr(0, 2);
        var month = arr[0].substr(3, 2);
        var year = arr[0].substr(6, 4);

        this._outputDate = year + '-' + month + '-' + day;

        if ((! onlyDate) && (arr.length > 1)) {
          var time = arr[1].split(':');
          if ((typeof time === 'object') && (Array.isArray(time))) {
            if (time.length <= 3) {
              this._outputDate += ' ';
              for (var ind = 0; ind < time.length; ind++) {
                this._outputDate += time[ind].toString();
                if (ind < time.length - 1) {
                  this._outputDate += ':';
                }
              }
            }
          }
        }
        this._isValid = true;
      }
    }
  };

  this.isValid = function() {
    return this._isValid;
  };

  this.outputDate = function() {
    return this._outputDate;
  };

  this.verify();
};

exports.formatStringWithEllipses = function (str, maxLength) {
  var ellipse = '...';
  if ((typeof str === 'string') && (str.length >= maxLength) && (str.length > ellipse.length)) {
    return str.slice(0, (maxLength - 1) - ellipse.length) + ellipse;
  }
  else {
    return str;
  }
};