function confirmDelete(id) {
  $('#deletedUID').val(id);
  $('#modalDeleteRecord').modal({
    'keyboard': true
  });
}

$('[data-toggle="tooltip"]').tooltip();

$('#startDate').datetimepicker({
  locale: 'ru',
  format: 'L'
}).on('dp.change', function (e) {
  var data = $('#filters').val();
  try {
    var filters = JSON.parse(data);
    filters.period.start = moment(e.date).format('YYYY-MM-DD HH:mm');
    $('#filters').val(JSON.stringify(filters));
  } catch (e) {
    console.log(e.message);
  }
});

$('#endDate').datetimepicker({
  locale: 'ru',
  format: 'L'
}).on('dp.change', function (e) {
  var data = $('#filters').val();
  try {
    var filters = JSON.parse(data);
    filters.period.end = moment(e.date).format('YYYY-MM-DD HH:mm');
    $('#filters').val(JSON.stringify(filters));
  } catch (e) {
    console.log(e.message);
  }
});

$('#onlyMaintenanceService').on('click', function (e) {
  var data = $('#filters').val();
  try {
    var filters = JSON.parse(data);
    filters.onlyMaintenanceService = e.currentTarget.checked;
    $('#filters').val(JSON.stringify(filters));
  } catch (e) {
    console.log(e.message);
  }
});

function clearOrder() {
  $('#findOrder').val('');
}

function clearProlongedOrder() {
  $('#findProlongedOrder').val('');
}

function clearCity() {
  $('#findCity').val('');
}

function clearStreet() {
  $('#findStreet').val('');
}

function clearHouse() {
  $('#findHouse').val('');
}

function clearPorch() {
  $('#findPorch').val('');
}

// Typeaheads

$('#findOrder').typeahead({
  items: 15,
  source: function (query, process) {
    var results = [];
    map = {};

    axios.post('/orders/find_order', {
      orderNumber: query,
      limit: 15
    }).then(function (response) {
      var data = response.data;
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
    clearProlongedOrder();
    var data = $('#filters').val();
    try {
      var filters = JSON.parse(data);
      filters.number.order = +element;
      filters.number.prolongedOrder = 0;
      $('#filters').val(JSON.stringify(filters));
    } catch (e) {
      console.log(e.message);
    }
    return element;
  }
});

$('#findCity').typeahead({
  items: 15,
  source: function (query, process) {
    var results = [];
    map = {};

    axios.post('/orders/find_city', {
      cityName: query,
      core: 1,
      limit: 15
    }).then(function (response) {
      var data = response.data;
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
    var data = $('#filters').val();
    try {
      var filters = JSON.parse(data);
      filters.city.id = map[element].id;
      filters.city.name = map[element].value;
      $('#filters').val(JSON.stringify(filters));
      $('#findStreet').focus();
    } catch (e) {
      console.log(e.message);
    }
    return element;
  }
});

$('#findStreet').typeahead({
  items: 15,
  source: function (query, process) {
    var results = [];
    map = {};
    var cityId = 0;
    var data = $('#filters').val();
    try {
      var filters = JSON.parse(data);
      cityId = filters.city.id;
    } catch (e) {
      console.log(e.message);
    }

    axios.post('/orders/find_street', {
      streetName: query,
      cityId: cityId,
      limit: 15
    }).then(function (response) {
      var data = response.data;
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
    var data = $('#filters').val();
    try {
      var filters = JSON.parse(data);
      filters.street.id = map[element].id;
      filters.street.name = map[element].value;
      filters.street.cityId = map[element].cityId;
      $('#filters').val(JSON.stringify(filters));
      $('#findHouse').focus();
    } catch (e) {
      console.log(e.message);
    }
    return element;
  }
});

$('#findHouse').typeahead({
  items: 15,
  source: function (query, process) {
    var results = [];
    map = {};
    var streetId = 0;
    var data = $('#filters').val();
    try {
      var filters = JSON.parse(data);
      streetId = filters.street.id;
    } catch (e) {
      console.log(e.message);
    }

    axios.post('/orders/find_house', {
      houseNumber: query,
      streetId: streetId,
      limit: 15
    }).then(function (response) {
      var data = response.data;
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
    var data = $('#filters').val();
    try {
      var filters = JSON.parse(data);
      filters.house.id = map[element].id;
      filters.house.number = map[element].value;
      filters.house.streetId = map[element].streetId;
      $('#filters').val(JSON.stringify(filters));
      $('#findPorch').focus();
    } catch (e) {
      console.log(e.message);
    }
    return element;
  }
});

$('#findPorch').typeahead({
  items: 15,
  source: function (query, process) {
    var results = [];
    map = {};
    var houseId = 0;
    var data = $('#filters').val();
    try {
      var filters = JSON.parse(data);
      houseId = filters.house.id;
    } catch (e) {
      console.log(e.message);
    }

    axios.post('/orders/find_porch', {
      porch: query,
      houseId: houseId,
      limit: 15
    }).then(function (response) {
      var data = response.data;
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
    var data = $('#filters').val();
    try {
      var filters = JSON.parse(data);
      filters.porch.number = +element;
      filters.porch.houseId = filters.house.id;
      $('#filters').val(JSON.stringify(filters));
    } catch (e) {
      console.log(e.message);
    }
    return element;
  }
});

$('#findProlongedOrder').typeahead({
  items: 15,
  source: function (query, process) {
    var results = [];
    map = {};

    axios.post('/orders/find_prolonged_order', {
      orderNumber: query,
      limit: 15
    }).then(function (response) {
      var data = response.data;
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
    clearOrder();
    var data = $('#filters').val();
    try {
      var filters = JSON.parse(data);
      filters.number.prolongedOrder = +element;
      filters.number.order = 0;
      $('#filters').val(JSON.stringify(filters));
    } catch (e) {
      console.log(e.message);
    }
    return element;
  }
});

// Clear values
$('#clearCity').click(function () {
  var data = $('#filters').val();
  try {
    var filters = JSON.parse(data);
    filters.city.id = 0;
    filters.city.name = '';

    filters.street.id = 0;
    filters.street.name = '';
    filters.street.cityId = 0;

    filters.house.id = 0;
    filters.house.number = '';
    filters.house.streetId = 0;

    filters.porch.number = 0;

    $('#filters').val(JSON.stringify(filters));

    clearCity();
    clearStreet();
    clearHouse();
    clearPorch()
    $('#findCity').focus();
  } catch (e) {
    console.log(e.message);
  }
});

$('#clearStreet').click(function () {
  var data = $('#filters').val();
  try {
    var filters = JSON.parse(data);
    filters.street.id = 0;
    filters.street.name = '';
    filters.street.cityId = 0;

    filters.house.id = 0;
    filters.house.number = '';
    filters.house.streetId = 0;

    filters.porch.number = 0;

    $('#filters').val(JSON.stringify(filters));

    clearStreet();
    clearHouse();
    clearPorch();
    $('#findStreet').focus();
  } catch (e) {
    console.log(e.message);
  }
});

$('#clearHouse').click(function () {
  var data = $('#filters').val();
  try {
    var filters = JSON.parse(data);
    filters.house.id = 0;
    filters.house.number = '';
    filters.house.streetId = 0;

    filters.porch.number = 0;

    $('#filters').val(JSON.stringify(filters));

    clearHouse();
    clearPorch();
    $('#findHouse').focus();
  } catch (e) {
    console.log(e.message);
  }
});

$('#clearPorch').click(function () {
  var data = $('#filters').val();
  try {
    var filters = JSON.parse(data);
    filters.porch.number = 0;

    $('#filters').val(JSON.stringify(filters));

    clearPorch();
    $('#findPerformer').focus();
  } catch (e) {
    console.log(e.message);
  }
});

$('#clearOrder').click(function () {
  var data = $('#filters').val();
  try {
    var filters = JSON.parse(data);
    filters.number.order = 0;

    $('#filters').val(JSON.stringify(filters));

    clearOrder();
    $('#findOrder').focus();
  } catch (e) {
    console.log(e.message);
  }
});

$('#clearProlongedOrder').click(function () {
  var data = $('#filters').val();
  try {
    var filters = JSON.parse(data);
    filters.number.prolongedOrder = 0;

    $('#filters').val(JSON.stringify(filters));

    clearProlongedOrder();
    $('#findProlongedOrder').focus();
  } catch (e) {
    console.log(e.message);
  }
});

$('#deleteRecord').click(function () {
  $('#modalDeleteRecord').modal('hide');
  $.ajax({
    type: 'POST',
    url: '/payments/delete',
    dataType: 'json',
    async: true,
    data: {
      id: $('#deletedUID').val()
    },
    success: function (data) {
      var path = window.location.origin + '/orders';
      window.location.href = path;
      return;
    },
    error: function (data) {
      alert(data);
    }
  });

});