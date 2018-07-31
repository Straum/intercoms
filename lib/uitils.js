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