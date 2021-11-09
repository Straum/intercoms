class FineModel {
  constructor() {
    this.id = 0;
    this.createDate = null;
    this.paymentDate = null;
    this.amount = 0;

    this.contract = {
      normal: '',
      prolonged: '',
    };

    this.address = {
      city: {
        id: 0,
        name: '',
      },
      street: {
        id: 0,
        name: '',
      },
      house: {
        id: 0,
        number: '',
      },
    };

    this.porch = '';

    this.apartment = {
      id: 0,
      number: '',
      letter: 0,
    };
  }

  fullAddress() {
    let result = '';
    if (this.address.city.id > 0) {
      result = `${this.address.city.name}`;
      if (this.address.street.id > 0) {
        result = `${this.address.city.name}, ${this.address.street.name}`;
        if (this.address.house.id > 0) {
          result = `${this.address.city.name}, ${this.address.street.name}, ${this.address.house.number}`;
        }
      }
    }
    return result;
  }
}

module.exports.FineModel = FineModel;
