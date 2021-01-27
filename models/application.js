module.exports.ApplicationModel = function () {
    'use strict';
    this.id = 0;
    this.createDate = null;
    this.completionDate = null;
    this.closeDate = null;

    this.address = {
      city: {
        id: 0,
        name: ''
      },
      street: {
        id: 0,
        name: ''
      },
      house: {
        id: 0,
        number: ''
      },
      number: '',
      kind: 0,
      full: '',
    };

    this.phone = '';
    this.faults = [];

    this.performer = {
        id: 0,
        name: ''
    };

    this.weight = 0;

    this.order = {
        id: 0,
        contractNumber: '',
        maintenanceContract: 0,
        prolongedContractNumber: '',
        isYoungAge: true
    };

    this.isDone = 0;
    this.isDisablingApartments = 0;
    this.isTimeRange = 0;
    this.hourFrom = 0;
    this.hourTo = 0;

    return this;
  };