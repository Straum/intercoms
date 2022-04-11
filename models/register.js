module.exports.PaymentModelForRegister = function() {
  this.id = 0;
  this.payDate = null;
  this.prolongedContractNumber = 0;
  this.address = '';
  this.apartment = '';
  this.amount = 0;
};

module.exports.ContractModelForRegister = function() {
  this.id = 0;
  this.createDate = null;
  this.contractNumber = 0;
  this.prolongedContractNumber = 0;
  this.startService = null;
  this.endService = null;
};

module.exports.RegisterModel = function() {
  this.id = 0;
  this.createDate = null;
  this.startFrom = null;
  this.endTo = null;
  this.latestChange = null;
  this.find = {
    contractNumber: 0,
    isProlonged: false,
  };
  this.contracts = [];
  this.payments = [];
  this.newMethod = 0;
};

module.exports.DataModel = function() {
  this.personalAccount1 = '';
  this.personalAccount2 = '';
  this.fullAddress = '';
  this.monthAndYear = '';
  this.amount = '';
};

module.exports.DataModel2022 = function() {
  this.personalAccount = '';
  this.els = '';
  this.fias = '';
  this.fullName = '';
  this.fullAddress = '';
  this.monthAndYear = '';
  this.balance = '';
  this.amount = '';
};


module.exports.PrintModelForRegister = function() {
  this.startFrom = null;
  this.endTo = null;
  this.newMethod = 0;
  this.data = [];
};
