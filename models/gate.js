class GateModel {
  constructor() {
    this.id = 0;
    this.contractNumber = 0;
    this.created = null;

    this.address = {
      area: {
        id: 0,
        name: '',
      },
      city: {
        id: 0,
        name: '',
      },
      street: {
        id: 0,
        name: '',
        cityId: 0,
      },
      house: {
        id: 0,
        number: '',
        streetId: 0,
      },
      noStreets: 0,
      noHouses: 0,
      full: '',
    };

    this.numeration = '';

    this.client = {
      id: 0,
      name: '',
      phones: '',
    };

    this.startService = null;
    this.endService = null;
    this.maintenanceContract = 0;
    this.apartmentFrom = 0;
    this.apartmentTo = 0;
    this.payment = 0;
    this.receiptPrinting = null;

    this.apartments = {
      stat: {
        paid: 0,
        exempt: 0,
        locked: 0,
      },
      grid: [],
      deleted: [],
      isRebuilt: 0,
    };
    this.fullAddress = '';
    this.info = '';
  }

  // fullAddress() {
  //   let result = '';
  //   if (this.address.city.id > 0) {
  //     result = `${this.address.city.name}`;
  //     if (this.address.street.id > 0) {
  //       result = `${this.address.city.name}, ${this.address.street.name}`;
  //       if (this.address.house.id > 0) {
  //         result =
  //           `${this.address.city.name},
  //              ${this.address.street.name}, ${this.address.house.number}`;
  //       }
  //     }
  //   }
  //   return result;
  // }
}

module.exports.GateModel = GateModel;
