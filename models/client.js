module.exports.ClientModel = function () {
  this.id = 0;
  this.lastName = '';

  this.certificate = {
    typeId: 0,
    series: '',
    number: '',
    issued: null,
    department: '',
    phones: '',
  };

  this.registeredAddress = {
    city: {
      key: 0,
      value: '',
    },
    street: {
      key: 0,
      value: '',
    },
    house: {
      key: 0,
      value: '',
    },
    apartment: '',
    fullAddress: '',
  };

  this.actualAddress = {
    city: {
      key: 0,
      value: '',
    },
    street: {
      key: 0,
      value: '',
    },
    house: {
      key: 0,
      value: '',
    },
    apartment: '',
    fullAddress: '',
  };

  return this;
};
