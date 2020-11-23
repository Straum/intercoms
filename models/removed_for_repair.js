module.exports.RemovedForRepairModel = function () {
  'use strict';
  this.id = 0;
  this.createDate = null;
  this.personalData = '';
  this.phones = '';
  this.office = '',
  this.address = {
    // level: 0,
    area: {
      id: 0,
      name: ''
    },
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
    isCity: 0,
    noStreets: 0,
    noHouses: 0,
  };
  this.equipmentType = 0,
  this.equipment = {
    id: 0,
    name: ''
  };
  this.series = '';
  this.repair - '';
  this.worker = {
    id: 0,
    name: ''
  };
  this.service = {
    id: 0,
    name: ''
  };
  this.isDone = 0;

};
