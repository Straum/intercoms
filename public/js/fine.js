class Application {
  constructor() {
    this.contractNumber = '';
    this.prolongedContractNumber = '';
    this.fullAddress = '';
    this.porch = '';
  }

  clearContractNumber() {
    this.contractNumber = '';
    document.getElementById('contract').value = this.contractNumber;
  }

  clearProlongedContractNumber() {
    this.prolongedContractNumber = '';
    document.getElementById('prolongedContract').value = this.prolongedContractNumber;
  }

  clearFullAddress() {
    this.fullAddress = '';
    document.getElementById('fullAddress').value = this.fullAddress;
  }

  clearPorch() {
    this.porch = '';
    document.getElementById('porch').value = this.porch;
  }

  static async postData(url = '', data = {}) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  set sFullAddress(value) {
    this.fullAddress = value;
    document.getElementById('fullAddress').value = value;
  }

  get gFullAddress() {
    return this.fullAddress;
  }

  set sPorch(value) {
    this.porch = value;
    document.getElementById('porch').value = value;
  }
}

const app = new Application();

$('#contract').typeahead({
  items: 15,
  source: (query, process) => {
    const results = [];
    map = [];

    axios.post('/fines/find_order', {
      contractNumber: query,
      limit: 15,
    }).then((response) => {
      const { data } = response;
      data.forEach((item) => {
        map[item.contractNumber] = item;
        results.push(item.contractNumber);
      });
      process(results);
    }).catch((error) => {
      // eslint-disable-next-line no-console
      console.log(error);
    });
  },
  updater: (element) => {
    app.clearProlongedContractNumber();
    app.contractNumber = map[element].contractNumber;
    app.prolongedContractNumber = map[element].prolongedContractNumber;
    document.getElementById('prolongedContract').value = app.prolongedContractNumber;
    Application.postData(
      '/fines/information_on_contract',
      { contractNumber: app.contractNumber })
      .then((data) => {
        app.sFullAddress = data.fullAddress;
        app.sPorch = data.porch;
      });
    return element;
  },
});

$('#prolongedContract').typeahead({
  items: 15,
  source: (query, process) => {
    const results = [];
    map = [];

    axios.post('/fines/find_prolonged_order', {
      prolongedContractNumber: query,
      limit: 15,
    }).then((response) => {
      const { data } = response;
      data.forEach((item) => {
        map[item.contractNumber] = item;
        results.push(item.contractNumber);
      });
      process(results);
    }).catch((error) => {
      // eslint-disable-next-line no-console
      console.log(error);
    });
  },
  updater: (element) => {
    app.clearContractNumber();
    app.prolongedContractNumber = map[element].prolongedContractNumber;
    app.contractNumber = map[element].contractNumber;
    document.getElementById('contract').value = app.contractNumber;
    Application.postData(
      '/fines/information_on_prolonged_contract',
      { prolongedContractNumber: app.prolongedContractNumber })
      .then((data) => {
        app.sFullAddress = data.fullAddress;
        app.sPorch = data.porch;
      });
    return element;
  },
});

$('#fullAddress').typeahead({
  items: 15,
  source: (query, process) => {
    const results = [];
    map = [];

    axios.post('/fines/full_address', {
      suggestion: query,
      limit: 15,
    }).then((response) => {
      const { data } = response;

      const verifyNames = ((typeof data === 'object') && ('items' in data) && ('level' in data));
      if (!verifyNames) return;

      const { level, items } = data;

      if (!Array.isArray(items)) return;

      items.forEach((item) => {
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
            if ((!item.noStreets) && (!item.noHouses)) {
              uniqueIndex = `${item.areaName}, ${item.cityName}, ${item.streetName}`;
            }
            if ((item.noStreets) && (!item.noHouses)) {
              uniqueIndex = `${item.areaName}, ${item.cityName}, ${item.houseNumber}`;
            }
            if ((item.noStreets) && (item.noHouses)) {
              uniqueIndex = `${item.areaName}, ${item.cityName}`;
            }
            break;

          case 5:
            uniqueIndex = `${item.areaName}, ${item.cityName}, ${item.streetName}, ${item.houseNumber}`;
            break;

          default:
            break;
        }

        map[uniqueIndex] = { ...item, ...{ level } };
        results.push(uniqueIndex);
      });
      process(results);
    }).catch((error) => {
      // eslint-disable-next-line no-console
      console.log(error);
    });
  },
  updater: (element) => {
    const fullAddress = document.getElementById('fullAddress');
    const selectedElement = map[element];
    let caption = '';
    // let address = { ...gAddress };
    // address.level = selectedElement.level;
    switch (selectedElement.level) {
      case 0:
        if (+selectedElement.isCity === 0) {
          fullAddress.dataset.areaId = selectedElement.cityId;
          // address.area.id = selectedElement.cityId;
          // address.area.name = selectedElement.cityName;
        } else {
          // address.city.id = selectedElement.cityId;
          // address.city.name = selectedElement.cityName;
          fullAddress.dataset.areaId = 0;
          fullAddress.dataset.cityId = selectedElement.cityId;
        }
        // address.isCity = selectedElement.isCity;

        caption = `${selectedElement.cityName}, `;
        break;
      case 1:
        // address.city.id = selectedElement.cityId;
        // address.city.name = selectedElement.cityName;
        // address.street.id = selectedElement.streetId;
        // address.street.name = selectedElement.streetName;
        fullAddress.dataset.areaId = 0;
        fullAddress.dataset.cityId = selectedElement.cityId;
        fullAddress.dataset.streetId = selectedElement.streetId;

        caption = `${selectedElement.cityName}, ${selectedElement.streetName}, `;
        break;
      case 2:
        // address.city.id = selectedElement.cityId;
        // address.city.name = selectedElement.cityName;
        // address.street.id = selectedElement.streetId;
        // address.street.name = selectedElement.streetName;
        // address.house.id = selectedElement.houseId;
        // address.house.number = selectedElement.houseNumber;
        fullAddress.dataset.areaId = 0;
        fullAddress.dataset.cityId = selectedElement.cityId;
        fullAddress.dataset.streetId = selectedElement.streetId;
        fullAddress.dataset.houseId = selectedElement.houseId;

        caption = `${selectedElement.cityName}, ${selectedElement.streetName}, ${selectedElement.houseNumber}`;
        break;
      case 3:
        // address.area.id = selectedElement.areaId;
        // address.area.name = selectedElement.areaName;
        // address.city.id = selectedElement.cityId;
        // address.city.name = selectedElement.cityName;
        // address.noStreets = selectedElement.noStreets;
        // address.noHouses = selectedElement.noHouses;

        fullAddress.dataset.areaId = selectedElement.areaId;
        fullAddress.dataset.cityId = selectedElement.cityId;

        if (selectedElement.noStreets) {
          if (selectedElement.noHouses) {
            caption = `${selectedElement.areaName}, ${selectedElement.cityName}`;
          } else {
            caption = `${selectedElement.areaName}, ${selectedElement.cityName}, `;
          }
        } else {
          caption = `${selectedElement.areaName}, ${selectedElement.cityName}, `;
        }
        break;
      case 4:
        // address.area.id = selectedElement.areaId;
        // address.area.name = selectedElement.areaName;
        // address.city.id = selectedElement.cityId;
        // address.city.name = selectedElement.cityName;
        // address.street.id = selectedElement.streetId;
        // address.street.name = selectedElement.streetName;
        // address.noStreets = selectedElement.noStreets;
        // address.noHouses = selectedElement.noHouses;
        fullAddress.dataset.areaId = selectedElement.areaId;
        fullAddress.dataset.cityId = selectedElement.cityId;
        fullAddress.dataset.streetId = selectedElement.streetId;

        if (selectedElement.noStreets) {
          if (selectedElement.noHouses) {
            fullAddress.dataset.houseId = 0;
            caption = `${selectedElement.areaName}, ${selectedElement.cityName}`;
          } else {
            // address.house.id = selectedElement.houseId;
            // address.house.number = selectedElement.houseNumber;
            fullAddress.dataset.houseId = selectedElement.houseId;
            caption = `${selectedElement.areaName}, ${selectedElement.cityName}, ${selectedElement.houseNumber}`;
          }
        } else if (selectedElement.noHouses) {
          caption = `${selectedElement.areaName}, ${selectedElement.cityName}, ${selectedElement.streetName}`;
        } else {
          caption = `${selectedElement.areaName}, ${selectedElement.cityName}, ${selectedElement.streetName}, `;
        }
        break;
      case 5:
        // address.area.id = selectedElement.areaId;
        // address.area.name = selectedElement.areaName;
        // address.city.id = selectedElement.cityId;
        // address.city.name = selectedElement.cityName;
        // address.street.id = selectedElement.streetId;
        // address.street.name = selectedElement.streetName;
        // address.house.id = selectedElement.houseId;
        // address.house.number = selectedElement.houseNumber;

        fullAddress.dataset.areaId = selectedElement.areaId;
        fullAddress.dataset.cityId = selectedElement.cityId;
        fullAddress.dataset.streetId = selectedElement.streetId;
        fullAddress.dataset.houseId = selectedElement.houseId;

        caption = `${selectedElement.areaName}, ${selectedElement.cityName}, ${selectedElement.streetName}, ${selectedElement.houseNumber}`;
        break;
      default:
    }

    // fullAddress.value = caption;
    app.fullAddress = caption;
    return caption;
  },
});

$('#porch').typeahead({
  items: 15,
  source: (query, process) => {
    const results = [];
    map = [];

    Application.postData(
      '/fines/find_porchs_at_address',
      {
        address: document.getElementById('fullAddress').value,
        porch: query,
      },
    ).then((response) => {
      response.forEach((item) => {
        map[item.value] = item;
        results.push(item.value);
      });
      process(results);
    }).catch((error) => {
      // eslint-disable-next-line no-console
      console.log(error);
    });
  },
  updater: (element) => {
    const { id } = map[element];
    app.contractNumber = map[element].contractNumber;
    app.prolongedContractNumber = map[element].prolongedContractNumber;
    document.getElementById('contract').value = app.contractNumber;
    document.getElementById('prolongedContract').value = app.prolongedContractNumber;
    return element;
  },
});

const elements = document.getElementsByClassName('btn btn-default clear');
for (let index = 0; index < elements.length; index += 1) {
  elements[index].addEventListener('click', (e) => {
    switch (e.currentTarget.dataset.attribute) {
      case 'clear-contract':
        app.clearContractNumber();
        app.clearProlongedContractNumber();
        app.clearFullAddress();
        app.clearPorch();
        break;
      case 'clear-prolonged-contract':
        app.clearContractNumber();
        app.clearProlongedContractNumber();
        app.clearFullAddress();
        app.clearPorch();
        break;
      case 'clear-full-address':
        app.clearContractNumber();
        app.clearProlongedContractNumber();
        app.clearFullAddress();
        app.clearPorch();
        break;
      default:
        break;
    }
  });
}

// function clearAddress() {
//   let address = { ...gAddress };
//   document.getElementById('address').value = JSON.stringify(address);
//   document.getElementById('fullAddress').value = '';
//   document.getElementById('fullAddress').focus();
// }
