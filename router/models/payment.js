module.exports.PaymentModel = function () {
    'use strict';
    this.id = 0;
    this.createDate = null;
    this.apartment = {
        id: 0,
        number: '',
        letter: ''
    },
    this.amount = 0.00;
    this.transaction = '';
    this.payMonth = 0;
    this.payYear = 0;
    this.payDate = null;
    this.mode = 0;
    this.zipCode = '';
    this.fileName = '';

    // Additional info
    this.contract = {
        id: 0,
        normal: '',
        prolonged: '',
        startService: null,
        endService: null
    }
    this.fullAddress = '';
};