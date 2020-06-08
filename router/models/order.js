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

  this.address = {
    city: {
      key: 0,
      value: ''
    },
    street: {
      key: 0,
      value: '',
      cityId: 0
    },
    house: {
      key: 0,
      value: '',
      streetId: 0
    }
  },
  this.fullAddress = '';
  
  this.porch = 0;
  this.numeration = '';

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
  };

  this.onePerson = false;

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

  this.complete = {
    equipment: {
      quantity: 1,
      price: 0.00,
      cost: 0.00
    },
    mounting: {
      quantity: 1,
      price: 0.00,
      cost: 0.00
    },
    subscriberUnit: {
      quantity: 1,
      price: 0.00,
      cost: 0.00
    },
    key: {
      quantity: 1,
      price: 0.00,
      cost: 0.00
    },
    door: {
      quantity: 1,
      price: 0.00,
      cost: 0.00
    },
    subtotal: {
      cost: 0.00
    },
    subtotalForApartment: {
      cost: 0.00
    },
    discountForApartment: {
      cost: 0.00
    },
    total: {
      cost: 0.00
    }
  };

  return this;
};

module.exports.ReportModel = function () {
  'use strict';
  this.contractNumber = 0;
  this.createDate = null;
  this.creditTo = null;
  this.equipment = {
    name: '',
    guaranteePeriod: 0
  },
  this.city = {
    name: '',
    printType: 1
  },
  this.streetName = '';
  this.houseNumber = '';
  this.numeration = '';
  this.porch = 0;
  this.clientSetupId = 0;
  this.clientServiceId = 0;
  
  this.client = {
    name: '',
    phones: '',
    
    registeredAddress: {
      city: '',
      street: '',
      house: '',
      apartment: ''
    },

    actualAddress: {
      city: '',
      street: '',
      house: '',
      apartment: ''
    },
    
    certificate: {
      name: '',
      series: '',
      number: '',
      issued: null,
      department: '',
    }
  };

  this.complete = {
    equipment: {
      quantity: 1,
      price: 0.00,
      cost: 0.00
    },
    mounting: {
      quantity: 1,
      price: 0.00,
      cost: 0.00
    },
    subscriberUnit: {
      quantity: 1,
      price: 0.00,
      cost: 0.00
    },
    key: {
      quantity: 1,
      price: 0.00,
      cost: 0.00
    },
    door: {
      quantity: 1,
      price: 0.00,
      cost: 0.00
    },
    subtotal: {
      cost: 0.00
    },
    subtotalForApartment: {
      cost: 0.00
    },
    discountForApartment: {
      cost: 0.00
    },
    total: {
      cost: 0.00
    }
  };
 
  return this;
};