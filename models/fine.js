class FineModel {
  constructor() {
    this.id = 0;
    this.createDate = null;
    this.amount = 0;
    this.remark = '';

    this.payment = {
      date: null,
      amount: 0,
      document: null,
    };

    this.contract = {
      normal: '',
      prolonged: '',
      startService: null,
      endService: null,
    };

    this.address = {
      area: {
        id: 0,
        name: '',
      },
      city: {
        id: 0,
        name: '',
        printType: 1,
        phone: '',
        link: '',
        office: '',
      },
      street: {
        id: 0,
        name: '',
      },
      house: {
        id: 0,
        number: '',
      },
      full: '',
    };

    this.porch = '';

    this.apartment = {
      id: 0,
      number: '',
      letter: 0,
    };
  }

  get fullAddress() {
    let result = '';
    if (this.address.area.id > 0) {
      result = `${this.address.area.name}, `;
    }
    if (this.address.city.id > 0) {
      result += `${this.address.city.name}`;
      if (this.address.street.id > 0) {
        result += `, ${this.address.street.name}`;
        if (this.address.house.id > 0) {
          result += `, ${this.address.house.number}`;
        }
      }
    }
    return result;
  }
}

module.exports.FineModel = FineModel;
