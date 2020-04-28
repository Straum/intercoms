module.exports.OrderModel = function () {
  'use strict';
  this.id = 0;
  this.contractNumber = 0;
  this.createDate = null;
  this.endContract = null;
  this.creditTo = null;
  this.repaid = false;

  this.equipment = {
    key: 0,
    value: ''
  };
  this.city = {
    key: 0,
    value: ''
  };
  this.street = {
    key: 0,
    value: '',
    cityId: 0
  };
  this.house = {
    key: 0,
    value: '',
    streetId: 0
  };
  this.porch = 0;
  this.numeration = '';
  this.address = '';

  this.client = {
    contract: {
      key: 0,
      value: '',
      phones: ''
    },
    service:  {
      key: 0,
      value: '',
      phones: ''
    },
    onePerson: false
  };

  this.serviceNumber = '';
  this.startService = null;
  this.endService = null;
  this.maintenanceContract = 0;
  this.startApartment = 0;
  this.endApartment = 0;
  this.normalPayment = 0;
  this.privilegePayment = 0;
  this.receiptPrinting = null;

  this.contractInfo = '';
  this.serviceInfo = '';

  return this;
};