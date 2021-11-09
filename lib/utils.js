exports.decodeApartmentLetter = (number) => {
  const letters = ['', 'а', 'б', 'в', 'г', 'д', 'е', 'м', 'з', 'к'];
  return letters[number] || '';
  // switch (number) {
  //   case 1:
  //     return 'а';
  //   case 2:
  //     return 'б';
  //   case 3:
  //     return 'в';
  //   case 4:
  //     return 'г';
  //   case 5:
  //     return 'д';
  //   case 6:
  //     return 'е';
  //   case 7:
  //     return 'м';
  //   case 8:
  //     return 'з';
  //   case 9:
  //     return 'к';
  //   default:
  //     return '';
  // }
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
  'декабрь',
];

exports.paymentMethod = [
  'Квитанция',
  'Вручную',
];

exports.maintenanceContract = [
  'Нет',
  'Есть',
  'Приостановлено',
];

exports.paymentTypes = [
  'Нет данных',
  'Безналичными',
  'Наличными',
];

exports.enumCertificates = [
  { id: 0, value: 'Нет данных' },
  { id: 1, value: 'Паспорт гражданина России' },
  { id: 2, value: 'Загранпаспорт гражданина Рoccии' },
  { id: 3, value: 'Паспорт гражданина СССР' },
  { id: 4, value: 'Загранпаспорт гр. СССР' },
  { id: 5, value: 'Удостоверение личности офицера' },
  { id: 6, value: 'Военный билет солдата (матроса, сержанта, старшины)' },
  { id: 7, value: 'Военный билет офицера запаса' },
  { id: 16, value: 'Иностранный паспорт' },
];

exports.enumApartmentLetters = [
  'Нет',
  'А',
  'Б',
  'В',
  'Г',
  'Д',
  'Е',
  'М',
  'З',
  'K',
];

exports.convertDateToMySQLDate = (date, onlyDate) => {
  this.isValid = false;
  this.outputDate = date;

  this.verify = () => {
    if (typeof date !== 'string') return;
    const dt = date.trim();
    const arr = dt.split(' ');
    if ((typeof arr === 'object') && (Array.isArray(arr))) {
      if (arr.length >= 1) {
        if (arr[0].trim().length !== 10) return;
        const day = arr[0].substr(0, 2);
        const month = arr[0].substr(3, 2);
        const year = arr[0].substr(6, 4);

        this.outputDate = `${year}-${month}-${day}`;

        if ((!onlyDate) && (arr.length > 1)) {
          const time = arr[1].split(':');
          if ((typeof time === 'object') && (Array.isArray(time))) {
            if (time.length <= 3) {
              this.outputDate += ' ';
              for (let ind = 0; ind < time.length; ind += 1) {
                this.outputDate += time[ind].toString();
                if (ind < time.length - 1) {
                  this.outputDate += ':';
                }
              }
            }
          }
        }
        this.isValid = true;
      }
    }
  };

  this.isValid = () => this.isValid;

  this.outputDate = () => this.outputDate;

  this.verify();
};

exports.formatStringWithEllipses = (str, maxLength) => {
  const ellipse = '...';
  if ((typeof str === 'string') && (str.length >= maxLength) && (str.length > ellipse.length)) {
    return str.slice(0, (maxLength - 1) - ellipse.length) + ellipse;
  }
  return str;
};

exports.buildPersonalAccount = (dup, prolongedContractNumber, apartmentLetter, apartmentNumber) => {
  let rpts = 6 - (prolongedContractNumber.trim().length);
  const outProlongedContractNumber = (rpts > 0 ? '0'.repeat(rpts) : '') + prolongedContractNumber.trim();

  rpts = (3 - apartmentNumber.toString().trim().length);
  const outApartment = (rpts > 0 ? '0'.repeat(rpts) : '') + apartmentNumber.toString().trim();

  const clientAccountData = [];
  clientAccountData.push(dup.toString());
  clientAccountData.push(outProlongedContractNumber);
  clientAccountData.push(apartmentLetter.toString());
  clientAccountData.push(outApartment);

  return clientAccountData.join('');
};

// Error message from moment package (compare messages)
exports.invalidDate = 'Invalid date';
