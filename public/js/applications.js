$('[data-toggle="tooltip"]').tooltip();

$('#startDate').datetimepicker({
  locale: 'ru',
  format: 'L',
  ignoreReadonly: false
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
  format: 'L',
  ignoreReadonly: false
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

$('#allRecords').on('click', function (e) {
  var data = $('#filters').val();
  try {
    var filters = JSON.parse(data);
    filters.period.allRecords = e.currentTarget.checked;
    $('[name="startDate"]').prop("readonly", e.currentTarget.checked);
    $('[name="endDate"]').prop("readonly", e.currentTarget.checked);
    $('#filters').val(JSON.stringify(filters));
  } catch (e) {
    console.log(e.message);
  }
});

function confirmDelete(id) {
  $('#deletedUID').val(id);
  $('#modalDeleteRecord').modal({
    'keyboard': true
  });
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

function clearPerformer() {
  $('#findPerformer').val('');
}

function sortBy() {
  var data = $('#filters').val();
  try {
    var filters = JSON.parse(data);
    var sortBy = filters.period.sortBy;
    filters.period.sortBy = (sortBy == 'ASC' ? 'DESC' : 'ASC');
    $('#filters').val(JSON.stringify(filters));

    document.getElementById("applicationsForm").submit();
  } catch (e) {
    console.log(e.message);
  }
}

document.getElementById('emptyPerformers').addEventListener('click', function (e) {
  var data = $('#filters').val();
  try {
    var filters = JSON.parse(data);
    filters.emptyPerformers = e.currentTarget.checked;
    $('#filters').val(JSON.stringify(filters));
    document.getElementById('findPerformer').disabled = e.currentTarget.checked;
  } catch (e) {
    console.log(e.message);
  }
});

document.getElementById('apartmentDisconnections').addEventListener('click', function (e) {
  var data = $('#filters').val();
  try {
    var filters = JSON.parse(data);
    filters.apartmentDisconnections = e.currentTarget.checked;
    $('#filters').val(JSON.stringify(filters));
  } catch (e) {
    console.log(e.message);
  }
});

$(document).ready(function () {

  $('[data-toggle="tooltip"]').tooltip();

  $('#deleteRecord').click(function () {
    $('#modalDeleteRecord').modal('hide');
    $.ajax({
      type: 'POST',
      url: '/applications/delete',
      dataType: 'json',
      async: true,
      data: {
        'id': $('#deletedUID').val()
      },
      success: function (data) {
        var path = window.location.origin + '/applications';
        window.location.href = path;
        return;
      },
      error: function (data) {
        //
      }
    });

  });

  $('#filterCities').keyup(function (e) {
    if (e.keyCode == 13) {
      //
    }
  });

  // Clear values
  $('#clearCity').click(function () {
    clearCity();
    clearStreet();
    clearHouse();
    var data = $('#filters').val();
    try {
      var filters = JSON.parse(data);
      filters.city.id = 0;
      filters.city.name = '';

      filters.street.id = 0; // street
      filters.street.name = '';
      filters.street.cityId = 0;

      filters.house.id = 0; // house
      filters.house.number = '';
      filters.house.streetId = 0;

      $('#filters').val(JSON.stringify(filters));
      $('#findCity').focus();
    } catch (e) {
      console.log(e.message);
    }
  });

  $('#clearStreet').click(function () {
    clearStreet();
    clearHouse();
    var data = $('#filters').val();
    try {
      var filters = JSON.parse(data);
      filters.street.id = 0; // street
      filters.street.name = '';
      filters.street.cityId = 0;

      filters.house.id = 0; // house
      filters.house.number = '';
      filters.house.streetId = 0;

      $('#filters').val(JSON.stringify(filters));
      $('#findStreet').focus();
    } catch (e) {
      console.log(e.message);
    }
  });

  $('#clearHouse').click(function () {
    clearHouse();
    var data = $('#filters').val();
    try {
      var filters = JSON.parse(data);
      filters.house.id = 0; // house
      filters.house.number = '';
      filters.house.streetId = 0;

      $('#filters').val(JSON.stringify(filters));
      $('#findHouse').focus();
    } catch (e) {
      console.log(e.message);
    }
  });

  $('#clearPerformer').click(function () {
    clearPerformer();
    var data = $('#filters').val();
    try {
      var filters = JSON.parse(data);
      filters.performer.id = 0;
      filters.performer.name = '';

      $('#filters').val(JSON.stringify(filters));
      $('#findPerformer').focus();
    } catch (e) {
      console.log(e.message);
    }
  });


  // Typeaheads

  $('#findCity').typeahead({
    items: 15,
    source: (query, process) => {
      let results = [];
      map = {};

      axios.post('/applications/find_city', {
        cityName: query,
        core: 1,
        limit: 15
      }).then((response) => {
        const data = response.data;
        data.forEach((item) => {
          map[item.value] = item;
          results.push(item.value);
        });
        process(results);
      }).catch(function (error) {
        console.log(error);
      });
    },
    updater: (element) => {
      const data = $('#filters').val();
      try {
        const filters = JSON.parse(data);
        filters.city.id = map[element].id;
        filters.city.name = map[element].value;
        $('#filters').val(JSON.stringify(filters));
        document.getElementById('findStreet').focus();
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

      axios.post('/applications/find_street', {
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
        document.getElementById('findHouse').focus();
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

      axios.post('/applications/find_house', {
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
      } catch (e) {
        console.log(e.message);
      }
      return element;
    }
  });

  $('#findPerformer').typeahead({
    items: 15,
    source: function (query, process) {
      var results = [];
      map = {};

      axios.post('/applications/find_performer', {
        performerName: query,
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
        filters.performer.id = map[element].id;
        filters.performer.name = map[element].value;
        $('#filters').val(JSON.stringify(filters));
      } catch (e) {
        console.log(e.message);
      }
      return element;
    }
  });

});