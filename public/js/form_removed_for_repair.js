let lastActiveInput;

function Address() {
  // this.level = 0;
  this.area = {
    id: 0,
    name: ''
  };
  this.city = {
    id: 0,
    name: ''
  };
  this.street = {
    id: 0,
    name: ''
  };
  this.house = {
    id: 0,
    number: ''
  };
  this.isCity = 0;
  this.noStreets = 0;
  this.noHouses = 0;
}

let gAddress = new Address();

$('[data-toggle="tooltip"]').tooltip();

$('.date').datetimepicker({
  locale: 'ru'
});

$('#fullAddress').typeahead({
  items: 15,
  source: function (query, process) {
    let results = [];
    map = {};

    axios.post('/removed_for_repair/full_address', {
      suggestion: query,
      limit: 15
    }
    ).then(function (response) {
      const data = response.data;

      const verifyNames = ((typeof data === 'object') && ('items' in data) && ('level' in data));
      if (!verifyNames) return;

      const level = data.level;
      const items = data.items;

      if (!Array.isArray(items)) return;

      items.forEach((item, index) => {
        item.level = level;
        let uniqueIndex = '';
        switch (level) {
          case 0:
            uniqueIndex = item.cityName;
            break;

          case 1:
            uniqueIndex = `${item.cityName}, ${item.streetName}`;
            break;

          case 2:
            uniqueIndex = `${item.cityName}, ${item.streetName}, ${item.houseNumber}`;
            break;

          case 3:
            uniqueIndex = `${item.areaName}, ${item.cityName}`;
            break;

          case 4:
            uniqueIndex = `${item.areaName}, ${item.cityName}, ${item.streetName}`;
            break;

          case 5:
            uniqueIndex = `${item.areaName}, ${item.cityName}, ${item.streetName}, ${item.houseNumber}`;
            break;

          default:
            break;
        }

        map[uniqueIndex] = item;
        results.push(uniqueIndex);

      });
      process(results);
    }).catch(function (error) {
      console.log(error);
    });
  },
  updater: function (element) {
    const selectedElement = map[element];
    let caption = '';
    let address = { ...gAddress };
    // address.level = selectedElement.level;
    switch (selectedElement.level) {
      case 0:
        if (+selectedElement.isCity === 0) {
          address.area.id = selectedElement.cityId;
          address.area.name = selectedElement.cityName;
        }
        else {
          address.city.id = selectedElement.cityId;
          address.city.name = selectedElement.cityName;
        }
        address.isCity = selectedElement.isCity;

        caption = `${selectedElement.cityName}, `;
        break;
      case 1:
        address.city.id = selectedElement.cityId;
        address.city.name = selectedElement.cityName;
        address.street.id = selectedElement.streetId;
        address.street.name = selectedElement.streetName;

        caption = `${selectedElement.cityName}, ${selectedElement.streetName}, `;
        break;
      case 2:
        address.city.id = selectedElement.cityId;
        address.city.name = selectedElement.cityName;
        address.street.id = selectedElement.streetId;
        address.street.name = selectedElement.streetName;
        address.house.id = selectedElement.houseId;
        address.house.number = selectedElement.houseNumber;

        caption = `${selectedElement.cityName}, ${selectedElement.streetName}, ${selectedElement.houseNumber}`;
        break;
      case 3:
        address.area.id = selectedElement.areaId;
        address.area.name = selectedElement.areaName;
        address.city.id = selectedElement.cityId;
        address.city.name = selectedElement.cityName;
        address.noStreets = selectedElement.noStreets;

        if (selectedElement.noStreets) {
          caption = `${selectedElement.areaName}, ${selectedElement.cityName}`;
        }
        else {
          caption = `${selectedElement.areaName}, ${selectedElement.cityName}, `;
        }
        break;
      case 4:
        address.area.id = selectedElement.areaId;
        address.area.name = selectedElement.areaName;
        address.city.id = selectedElement.cityId;
        address.city.name = selectedElement.cityName;
        address.street.id = selectedElement.streetId;
        address.street.name = selectedElement.streetName;
        address.noHouses = selectedElement.noHouses;

        if (selectedElement.noHouses) {
          caption = `${selectedElement.areaName}, ${selectedElement.cityName}, ${selectedElement.streetName}`;
        }
        else {
          caption = `${selectedElement.areaName}, ${selectedElement.cityName}, ${selectedElement.streetName}, `;
        }
        break;
      case 5:
        address.area.id = selectedElement.areaId;
        address.area.name = selectedElement.areaName;
        address.city.id = selectedElement.cityId;
        address.city.name = selectedElement.cityName;
        address.street.id = selectedElement.streetId;
        address.street.name = selectedElement.streetName;
        address.house.id = selectedElement.houseId;
        address.house.number = selectedElement.houseNumber;

        caption = `${selectedElement.areaName}, ${selectedElement.cityName}, ${selectedElement.streetName}, ${selectedElement.houseNumber}`;
        break;
    }

    document.getElementById('address').value = JSON.stringify(address);
    return caption;

  }
});

function clearAddress() {
  let address = { ...gAddress };
  document.getElementById('address').value = JSON.stringify(address);
  document.getElementById('fullAddress').value = '';
  document.getElementById('fullAddress').focus();
}


function clearEquipment() {
  let obj = JSON.parse(document.getElementById('equipment').value);
  if (obj) {
    obj.id = 0;
    obj.name = '';
    document.getElementById('equipment').value = JSON.stringify(obj);
  }
  document.getElementById('equipmentName').value = '';
}

let onChangeEquipmentType = function (e) {
  let obj = JSON.parse(document.getElementById('equipment').value);
  if (obj) {
    if (+obj.id != +e.target.value) clearEquipment();
  }
}

document.getElementById('equipmentType').onchange = onChangeEquipmentType;

$('.filter-equipment').typeahead({
  items: 15,
  source: function (query, process) {
    let results = [];
    map = {};

    lastActiveInput = document.activeElement.name;

    axios.post('/removed_for_repair/filter_equipment', {
      suggestion: query,
      kind: document.getElementById('equipmentType').value,
      limit: 15
    }
    ).then(function (response) {
      let data = response.data;
      data.forEach(function (item) {
        map[item.value] = item;
        results.push(item.value);
      });
      process(results);
    }).catch(function (error) {
      console.log(error);
    });
  },
  updater: function (element) {
    // let elementName = document.activeElement.name;
    if (lastActiveInput === 'equipmentName') {
      let obj = {
        id: map[element].id,
        name: map[element].value
      }
      document.getElementById('equipment').value = JSON.stringify(obj);
    }
    if (lastActiveInput === 'newEquipmentName') {
      let obj = {
        id: map[element].id,
        name: map[element].value
      }
      // document.getElementById('newEquipment').value = JSON.stringify(obj);
    }
    return element;
  }
});

$('.fast-filter').typeahead({
  items: 15,
  source: function (query, process) {
    let results = [];
    map = {};

    lastActiveInput = document.activeElement.name;

    axios.post('/removed_for_repair/fast_filter', {
      suggestion: query,
      element: lastActiveInput,
      limit: 15
    }
    ).then(function (response) {
      let data = response.data;
      data.forEach(function (item) {
        map[item.value] = item;
        results.push(item.value);
      });
      process(results);
    }).catch(function (error) {
      console.log(error);
    });
  },
  updater: function (element) {
    try {
      // let elementName = document.activeElement.name;
      switch (lastActiveInput) {
        case 'workerName':
          let worker = JSON.parse(document.getElementById('worker').value);
          worker.id = map[element].id;
          worker.name = map[element].value;
          document.getElementById('worker').value = JSON.stringify(worker);
          break;
        case 'serviceName':
          let service = JSON.parse(document.getElementById('worker').value);
          service.id = map[element].id;
          service.name = map[element].value;
          document.getElementById('service').value = JSON.stringify(service);
          break;

        default:
          break;
      }
    }
    catch (e) {
      console.log('::fast_filter Error: ' + e.message);
    }
    return element;
  }
});

document.getElementById('clearAddress').addEventListener('click', function (e) {
  clearAddress();
});

document.getElementById('clearEquipment').addEventListener('click', function (e) {
  clearEquipment();
});

document.getElementById('clearWorker').addEventListener('click', function (e) {
  let obj = JSON.parse(document.getElementById('worker').value);
  if (obj) {
    obj.id = 0;
    obj.name = '';
    document.getElementById('worker').value = JSON.stringify(obj);
  }
  document.getElementById('workerName').value = '';
});

document.getElementById('clearService').addEventListener('click', function (e) {
  let obj = JSON.parse(document.getElementById('service').value);
  if (obj) {
    obj.id = 0;
    obj.name = '';
    document.getElementById('service').value = JSON.stringify(obj);
  }
  document.getElementById('serviceName').value = '';
});

document.getElementById('editEquipment').addEventListener('click', function (e) {
  let obj = JSON.parse(document.getElementById('equipment').value);
  if ((obj) && (obj.id === 0)) {
    document.getElementById('infoText').textContent = 'Оборудование не выбрано, изменять нечего.';
    $('#modalInfo').modal();
    return;
  }

  document.getElementById('newEquipmentName').value = obj.name;
  document.getElementById('dialogEquipmentCapton').textContent = 'Изменить оборудование';
  $('#equipmentDialog').modal();
});

document.getElementById('addEquipment').addEventListener('click', function (e) {
  document.getElementById('newEquipmentName').value = '';
  document.getElementById('dialogEquipmentCapton').textContent = 'Добавить оборудование';
  $('#equipmentDialog').modal();
});

document.getElementById('saveEquipment').addEventListener('click', function (e) {
  let obj = JSON.parse(document.getElementById('equipment').value);
  if (obj) {
    if (obj.id > 0) {
      axios.post('/removed_for_repair/edit_equipment', {
        id: obj.id,
        name: document.getElementById('newEquipmentName').value,
        kind: document.getElementById('equipmentType').value
      }
      ).then(function (response) {
        let equipment = {
          id: obj.id,
          name: document.getElementById('newEquipmentName').value
        }
        document.getElementById('equipment').value = JSON.stringify(equipment);
        document.getElementById('equipmentName').value = document.getElementById('newEquipmentName').value;
        $('#equipmentDialog').modal('hide');

      }).catch(function (error) {
        console.log(error);
        $('#equipmentDialog').modal('hide')
      });
    }
    else {
      axios.post('/removed_for_repair/add_equipment', {
        name: document.getElementById('newEquipmentName').value,
        kind: document.getElementById('equipmentType').value
      }
      ).then(function (response) {
        let data = response.data;

        let obj = {
          id: data.insertId,
          name: document.getElementById('newEquipmentName').value
        }
        document.getElementById('equipment').value = JSON.stringify(obj);
        document.getElementById('equipmentName').value = document.getElementById('newEquipmentName').value;
        $('#equipmentDialog').modal('hide');

      }).catch(function (error) {
        console.log(error);
        $('#equipmentDialog').modal('hide')
      });
    }
  }

});

$('#equipmentDialog').on('shown.bs.modal', function () {
  document.getElementById('newEquipmentName').focus();
})

$('#equipmentDialog').on('hidden.bs.modal', function (e) {
  let input = document.getElementById('equipmentName');
  input.focus();
  input.selectionStart = input.value.length;
})