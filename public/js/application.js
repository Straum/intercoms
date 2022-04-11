// var dataTable = [];
function applicationData() {

  this.currentFocus = $(":focus");
  this.generateUID = 0;

  this.address = {
    cityId: 0,
    cityName: '',
    streetId: 0,
    streetName: '',
    houseId: 0,
    houseNumber: ''
  }

  this.clearHouse = function () {
    this.address.houseId = 0;
    this.address.houseNumber = '';
    $('#houseId').val(0);
  }

  this.clearStreet = function () {
    this.address.streetId = 0;
    this.address.streetName = '';
    this.clearHouse();
    $('#streetId').val(0);
    $('#houseId').val(0);
  }

  this.clearCity = function () {
    this.cityId = 0;
    this.cityName = '';
    this.clearStreet();
    $('#cityId').val(0);
  }

  this.setCityId = function (cityId) {
    $('#cityId').val(cityId);
  }

  this.setStreetId = function (streetId) {
    $('#streetId').val(streetId);
  }

  this.setHouseId = function (houseId) {
    $('#houseId').val(houseId);
  }

  this.clearPerformer = function () {
    $('#performerId').val('0');
    $('#performer').val('');
  }
};

var appData = new applicationData();

$('[data-toggle="tooltip"]').tooltip();

$('#datetimepicker_create_date').datetimepicker({
  locale: 'ru'
});

$('#datetimepicker_completion_date').datetimepicker({
  locale: 'ru',
  format: 'L'
});

$('#datetimepicker_close_date').datetimepicker({
  locale: 'ru'
});

$('#datetimepicker_completion').datetimepicker({
  locale: 'ru',
  format: 'L'
});

// autocomplete city + street + house
$('#address').typeahead({
  items: 15,
  source: function (query, process) {
    var results = [];
    map = {};
    $.ajax({
      'url': '/applications/address_autocomplete',
      'type': 'POST',
      'contentType': 'application/json',
      'data': JSON.stringify({
        'suggestion': query,
        'limit': 15
      }),
      success: function (datas) {
        if ((typeof datas == 'object') && ('items' in datas) && ('level' in datas)) {
          var level = datas.level;
          var data = datas.items;
          var text;
          if (Array.isArray(data)) {
            data.forEach(function (item, index) {
              item.level = level;
              switch (level) {
                case 0:
                  text = item.cityName;
                  map[text] = item;
                  results.push(text);
                  break;
                case 1:
                  text = item.cityName + ', ' + item.streetName;
                  if (item.streetName.trim() !== '') {
                    map[text] = item;
                    results.push(text);
                  }
                  break;
                case 2:
                  text = item.cityName + ', ' + item.streetName + ', ' + item.houseNumber;
                  if (item.houseNumber.trim() !== '') {
                    map[text] = item;
                    results.push(text);
                  }
                  break;
                default:
              }
            });
          }
        }
        process(results);
      }
    });
  },
  updater: function (element) {
    var selectedElement = map[element];
    switch (selectedElement.level) {
      case 0:
        appData.address.cityId = selectedElement.cityId;
        appData.address.cityName = selectedElement.cityName;
        appData.setCityId(selectedElement.cityId);
        appData.clearStreet();
        return selectedElement.cityName + ', ';
      case 1:
        appData.address.cityId = selectedElement.cityId;
        appData.address.cityName = selectedElement.cityName;
        appData.address.streetId = selectedElement.streetId;
        appData.address.streetName = selectedElement.streetName;
        appData.setCityId(selectedElement.cityId);
        appData.setStreetId(selectedElement.streetId);
        appData.clearHouse();
        return selectedElement.cityName + ', ' + selectedElement.streetName + ', ';
      case 2:
        appData.address.cityId = selectedElement.cityId;
        appData.address.cityName = selectedElement.cityName;
        appData.address.streetId = selectedElement.streetId;
        appData.address.streetName = selectedElement.streetName;
        appData.address.houseId = selectedElement.houseId;
        appData.address.houseNumber = selectedElement.houseNumber;
        appData.setCityId(selectedElement.cityId);
        appData.setStreetId(selectedElement.streetId);
        appData.setHouseId(selectedElement.houseId);
        document.getElementById('porch').focus();
        return selectedElement.cityName + ', ' + selectedElement.streetName + ', ' + selectedElement.houseNumber;
      default:
        return selectedElement.cityName;
    }
  }
});

$('#performer').typeahead({
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
    $('#performerId').val(map[element].id);
    return element;
  }
});

$('#dlgWorker').typeahead({
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
    $('#dlgWorkerId').val(map[element].id);
    return element;
  }
});

$('#fault').on('keyup keypress', function (e) {
  var keyCode = e.keyCode || e.which;
  if (keyCode === 13) {
    addFault($('#fault').val());
    e.preventDefault();
    return false;
  }
});

$('#clearAddress').on('click', function () {
  $('#cityId').val('0');
  $('#streetId').val('0');
  $('#houseId').val('0');
  $('#address').val('');
  $('#address').focus();
});

$('#clearPerformer').on('click', function () {
  appData.clearPerformer();
});

$('body').on('click', '.deleteRow', function () {
  var dataTable = JSON.parse($('#faults').val());
  var tr = $(this).closest('tr');
  var rowIndex = tr.index();
  tr.remove();
  dataTable.splice(rowIndex, 1);
  $('#faults').val(JSON.stringify(dataTable));
});

$('body').on('click', '.editRow', function () {
  var dataTable = JSON.parse($('#faults').val());
  var tr = $(this).closest('tr');
  var rowIndex = tr.index();

  $('#dlgFaultName').val(dataTable[rowIndex].faultName.replace(/\\\"/g, '\"'));
  $('#dlgDecision').val(dataTable[rowIndex].decision);
  $('#dlgWorkerId').val(dataTable[rowIndex].workerId);
  $('#dlgWorker').val(dataTable[rowIndex].workerId > 0 ? dataTable[rowIndex].workerName : '');
  // $('#dlgCompletionDT').val(moment(new Date(dataTable[rowIndex].completionDT)).format( 'DD.MM.YYYY' ));
  $('#dlgIsDone').prop('checked', dataTable[rowIndex].isDone > 0);

  $('#idTable').val(rowIndex);

  appData.currentFocus = document.activeElement;
  $('#application_dialog').modal();
  $('#dlgFaultName').focus();

});

var grid = document.getElementById('tableFaults');
grid.onclick = function (e) {
  if (e.target.tagName != 'TH') return;
  // var classList = e.target.className.split(' ');

  // bySort = false;
  // for (var i = 0; i < classList.length; i++) {
  //     if (classList[i] === 'sort') {
  //         bySort = true;
  //         break;
  //     }
  // }

  // if (bySort) {
  //     // DOM sort
  //     sortGrid(e.target.cellIndex);
  //     // Array sort
  //     var arr = JSON.parse($('#faults').val());
  //     if ((Array.isArray(arr)) && (arr.length > 0)) {
  //       var newArr = arr.sort(function(a, b) {
  //         if (a.value > b.value) return 1;
  //         if (a.value < b.value) return -1;
  //         return 0;
  //       })
  //       $('#faults').val(JSON.stringify(newArr));
  //     }
  // }
};

function sortGrid(colNum, type) {
  var tbody = grid.getElementsByTagName('tbody')[0];
  var rowsArray = [].slice.call(tbody.rows);

  var compare = function (rowA, rowB) {
    return rowA.cells[colNum].innerHTML > rowB.cells[colNum].innerHTML;
  };

  // сортировать
  rowsArray.sort(compare);

  // Убрать tbody из большого DOM документа для лучшей производительности
  grid.removeChild(tbody);

  // добавить результат в нужном порядке в TBODY
  // они автоматически будут убраны со старых мест и вставлены в правильном порядке
  for (var i = 0; i < rowsArray.length; i++) {
    tbody.appendChild(rowsArray[i]);
  }
  grid.appendChild(tbody);
}

function addFault(item) {

  var dataTable = [];
  var data = $('#faults').val();
  try {
    dataTable = JSON.parse(data);
  } catch (e) {

  }

  if (typeof dataTable == 'string') {
    dataTable = [];
  }
  var uid = --appData.generateUID;

  if ((typeof item === 'string') && (item.trim().length > 0)) {

    var test = item.replace(/\"/g, '\\\"');

    var obj = {
      id: uid,
      faultName: test, // item,
      decision: '',
      workerId: 0,
      isDone: 0,
      completionDT: '', //new Date(),
      workerName: ''
    };
    dataTable.push(obj);

    var firstRow = $('#tableFaults > tbody > tr:first');
    try {
      if ((typeof (firstRow) == 'object') && ('length' in firstRow) && (firstRow.length == 1)) {
        if (firstRow[0].cells[0].colSpan == 6) {
          firstRow.parent().remove();
        }
      }
    } catch (e) {
      //
    }

    $('#tableFaults').last().append(
      '<tr class="warning">' +
      '<td>' + item + '</td>' +
      '<td></td>' +
      '<td></td>' +
      // '<td class="text-center">' + moment(new Date(obj.completionDT)).format('DD.MM.YYYY') + '</td>' +
      '<td class="text-center">' + obj.completionDT + '</td>' +
      '<td class="text-center"></td>' +
      '<td class="warning text-center">' +
      '<button type="button" class="btn btn-info btn-xs editRow">' +
      '<span class="glyphicon glyphicon-pencil" aria-hidden="true"></span>' +
      '</button>&nbsp;' +
      '<button type="button" class="btn btn-danger btn-xs deleteRow">' +
      '<span class="glyphicon glyphicon-minus" aria-hidden="true"></span>' +
      '</button>' +
      '</tr>'
    );
    $('#fault').focus().val('');

    $('#faults').val(JSON.stringify(dataTable));
  }
}

$('#application_dialog').on('show.bs.modal', function (e) {
  //
});

$('#application_dialog').on('hidden.bs.modal', function (e) {
  //
});

$("#saveButton").click(function () {
  $('#application_dialog').modal('hide');

  var uid = $('#idTable').val();
  var dataTable = JSON.parse($('#faults').val());

  dataTable[uid].faultName = $('#dlgFaultName').val().replace(/\"/g, '\\\"');
  dataTable[uid].decision = $('#dlgDecision').val();
  dataTable[uid].workerId = $('#dlgWorkerId').val();
  dataTable[uid].workerName = ((+dataTable[uid].workerId) > 0) ? $('#dlgWorker').val() : '';
  dataTable[uid].completionDT = $('#dlgIsDone:checked').val() === 'on' ? moment(new Date()).format('DD.MM.YYYY HH:mm') : null;
  dataTable[uid].isDone = $('#dlgIsDone:checked').val() === 'on' ? 1 : 0;

  $('#faults').val(JSON.stringify(dataTable));

  var row = document.getElementById("tableFaults").rows[+uid + 2];
  row.cells[0].innerText = dataTable[uid].faultName;
  row.cells[1].innerText = dataTable[uid].decision;
  row.cells[2].innerText = dataTable[uid].workerName;
  row.cells[3].innerText = dataTable[uid].completionDT;
  row.cells[4].innerHTML = +dataTable[uid].isDone == 1 ? '<button type="button" class="btn btn-default btn-xs"><span class="glyphicon glyphicon-ok">' : '';

  if (($('#performerId').val() == undefined) || (+$('#performerId').val() === 0) && (+$('#dlgWorkerId').val() > 0)) {
    $('#performerId').val($('#dlgWorkerId').val());
    $('#performer').val($('#dlgWorker').val());
  }
});

$("#orderInformation").click(function (e) {
  e.preventDefault();

  const houseId = parseInt($('#houseId').val());
  const porch = parseInt($('#porch').val());
  const kind = parseInt($('#kind').val());
  //
  axios.post('/applications/order_info', {
    houseId: houseId,
    porch: porch,
    kind: kind
  }).then(function (response) {

    var data = response.data;
    if (data) {
      $('#cardId').val(data.cardId);
      const link = '/orders/edit/' + data.cardId;
      const info = data.contractNumber + (data.maintenanceContract >= 1 ? ' (' + data.mContractNumber + ')' : '');
      const isShowBrick = (data.maintenanceContract != 1) && (data.isYoungAge != 1);

      $('#linkToOrder').attr('href', link).text(info);
      if ($('#linkToOrder').hasClass('invisible')) {
        $('#linkToOrder').removeClass('invisible');
        $('#linkToOrder').addClass('visible');
      }
      if (document.getElementById("brick")) {
        document.getElementById("brick").style.visibility = (isShowBrick ? "visible" : "hidden");
      }
    } else {
      $('#linkToOrder').attr('href', '').text('#');
      if ($('#linkToOrder').hasClass('visible')) {
        $('#linkToOrder').removeClass('visible');
        $('#linkToOrder').addClass('invisible');
      }
      $('#cardId').val('');
      if (document.getElementById("brick")) {
        if ((houseId > 0) && (porch > 0)) {
          document.getElementById("brick").style.visibility = "visible";
        } else {
          document.getElementById("brick").style.visibility = "hidden";
        }
      }
    }
  }).catch(function (error) {
    console.log(error);
  });
});

$('.select-all').on('focus', function (e) {
  $(this)
    .one('mouseup', function () {
      $(this).select();
      return false;
    })
    .select();
});

document.getElementById('isTimeRange').addEventListener('click', function (e) {
  document.getElementById('timeRangePanel').hidden = !e.currentTarget.checked;
});

document.getElementById('isDisablingApartments').addEventListener('click', (e) => {
  if (e.currentTarget.checked) {
    let connectionApartments = document.getElementById('isConnectionApartments');
    if ((connectionApartments) && (isConnectionApartments.checked)) {
      isConnectionApartments.checked = false;
    }
  }
})

document.getElementById('isConnectionApartments').addEventListener('click', (e) => {
  if (e.currentTarget.checked) {
    let disablingApartments = document.getElementById('isDisablingApartments');
    if ((disablingApartments) && (disablingApartments.checked)) {
      disablingApartments.checked = false;
    }
    if ((parseInt(document.getElementById('kind').value) === 1) && (document.getElementById('porch').value.trim().length > 0)) {
      addFault(`Подключить кв. ${document.getElementById('porch').value.trim()}`);
    }
  }
})