const { relativeTimeThreshold } = require("moment");

module.exports.PaymentModelForRegister = function () {
  'use strict';
  this.id = 0;
  this.payDate = null;
  this.prolongedContractNumber = 0;
  this.address = '';
  this.apartment = '';
  this.amount = 0;
};

module.exports.ContractModelForRegister = function () {
  'use strict';
  this.id = 0;
  this.createDate = null;
  this.contractNumber = 0;
  this.prolongedContractNumber = 0;
  this.startService = null;
  this.endService = null;
};

module.exports.RegisterModel = function () {
  'use strict';
  this.id = 0;
  this.createDate = null;
  this.startFrom = null;
  this.endTo = null;
  this.latestChange = null;
  this.find = {
    contractNumber: 0,
    isProlonged: false
  }
  this.contracts = [];
  this.payments = [];
  this.newMethod = 0;
};

module.exports.DataModel = function () {
  'use strict';
  this.personalAccount1 = '';
  this.personalAccount2 = '';
  this.fullAddress = '';
  this.monthAndYear = '';
  this.amount = '';
};

module.exports.PrintModelForRegister = function () {
  'use strict';
  this.startFrom = null;
  this.endTo = null;
  this.newMethod = 0;
  this.data = [];
};

