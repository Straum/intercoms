class Order {
  constructor() {
    this.contractNumber = '';
    this.prolongedContractNumber = '';
    this.startService = null;
    this.endService = null;
    this.normalPayment = 0.0;
    this.privilegePayment = 0.0;
    this.city = {
      name: '',
      printType: 1,
      phone: '',
      vkLink: '',
      office: '',
    };
    this.streetName = '';
    this.houseNumber = '';
    this.isDuplicate = 0;
    this.payMonth = 0;
    this.payYear = 2000;
    this.rank = 0;
  }
}

module.exports.Order = Order;
