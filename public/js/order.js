const ACTION_ADD_APARTMENT = 0;
const ACTION_EDIT_APARTMENT = 1;

const ACTION_DIALOG_BUILD_APARTMENTS = 2;
const ACTION_DIALOG_PROLONG_ORDER = 3;
const ACTION_DIALOG_DELETE_APARTMENT = 4;

var Application = function () {
  this.deletedApartment = {
    uid: 0,
    rowIndex: 0
  },
    this.editApartment = {
      uid: 0,
      rowIndex: 0
    },
    this.completeRowIndex = 1,
    this.actionWithApartment = ACTION_ADD_APARTMENT,
    this.actionWithDialog = ACTION_DIALOG_BUILD_APARTMENTS
}

var application = new Application();

$('#tableApartments').floatThead();

$('[data-toggle="tooltip"]').tooltip();

$('#dtCreateDate').datetimepicker({
  locale: 'ru',
  format: 'L'
});

$('#dtEndContract').datetimepicker({
  locale: 'ru',
  format: 'L'
});

$('#dtCreditTo').datetimepicker({
  locale: 'ru',
  format: 'L'
});

$('#dtStartService').datetimepicker({
  locale: 'ru',
  format: 'L'
});

$('#dtEndService').datetimepicker({
  locale: 'ru',
  format: 'L'
});

$('#dtReceiptPrinting').datetimepicker({
  locale: 'ru',
  format: 'L'
});

function showHistory(ev) {
  // var id = ev.currentTarget.getAttribute('data-uid');
  var id = ev.currentTarget.parentElement.parentElement.getAttribute('data-uid');
  ev.stopPropagation();

  axios.post('/orders/payments_history', {
    id: id,
    limit: 15
  }
  ).then(function (response) {
    var data = response.data;
    var body = {
      payments: '',
      fines: '',
      prices: ''
    };

    if ((data.payments) && (Array.isArray(data.payments)) && (data.payments.length > 0)) {
      data.payments.forEach(function (element) {
        body.payments += '<tr>';
        body.payments += '<td class="text-center align-middle">' + moment(element.createDate).format('DD.MM.YYYY') + '</td>';
        body.payments += '<td class="text-center align-middle">' + moment(element.payDate).format('DD.MM.YYYY') + '</td>';
        body.payments += '<td class="text-center align-middle">' + element.uid + '</td>';
        body.payments += '<td class="text-center align-middle">' + element.payMonth + '</td>';
        body.payments += '<td class="text-center align-middle">' + element.payYear + '</td>';
        body.payments += '<td class="text-right align-middle">' + element.amount.toFixed(2) + '</td>';
        body.payments += '<td class="text-center align-middle">' + element.organizationName + '</td>';
        body.payments += '</tr>';
      });
    }
    if (body.payments != '') {
      var bodyPaymentsRef = document.getElementById('tablePayments').getElementsByTagName('tbody')[0];
      bodyPaymentsRef.innerHTML = body.payments;
    }

    if ((data.fines) && (Array.isArray(data.fines)) && (data.fines.length > 0)) {
      data.fines.forEach(function (element) {
        body.fines += '<tr>';
        body.fines += '<td class="text-center align-middle">' + moment(element.createDate).format('DD.MM.YYYY') + '</td>';
        body.fines += '<td class="text-center align-middle">' + element.uid + '</td>';
        body.fines += '<td class="text-right align-middle">' + element.amount.toFixed(2) + '</td>';
        body.fines += '<td class="text-center align-middle"><input type="checkbox" class="styled"' + (Number(element.paid) === 1 ? ' checked' : '') + '></td>';
        body.fines += '</tr>';
      });
    }
    if (body.fines != '') {
      var bodyFinesRef = document.getElementById('tableFines').getElementsByTagName('tbody')[0];
      bodyFinesRef.innerHTML = body.fines;
    }

    if ((data.prices) && (Array.isArray(data.prices)) && (data.prices.length > 0)) {
      data.prices.forEach(function (element) {
        body.prices += '<tr>';
        body.prices += '<td class="text-center align-middle">' + moment(element.startService).format('DD.MM.YYYY') + '</td>';
        body.prices += '<td class="text-center align-middle">' + moment(element.endService).format('DD.MM.YYYY') + '</td>';
        body.prices += '<td class="text-right align-middle">' + element.normalPayment.toFixed(2) + '</td>';
        body.prices += '<td class="text-right align-middle">' + element.privilegePayment.toFixed(2) + '</td>';
        body.prices += '<td class="text-center align-middle">' + moment(element.receiptPrinting).format('DD.MM.YYYY') + '</td>';
        body.prices += '</tr>';
      });
    }
    if (body.prices != '') {
      var bodyPricesRef = document.getElementById('tablePrices').getElementsByTagName('tbody')[0];
      bodyPricesRef.innerHTML = body.prices;
    }

    $('#historyDialog').modal();

  }).catch(function (error) {
    console.log(error);
  });
}

function checkApartment(ev, index) {
  try {
    var apartments = JSON.parse(document.getElementById('apartments').value);
    if (Array.isArray(apartments.table) && (apartments.table.length > 0)) {
      var uid = ev.currentTarget.parentElement.parentElement.getAttribute('data-uid');
      ev.stopPropagation();
      for (var apartment of apartments.table) {
        if (Number(apartment.uid) === Number(uid)) {
          switch (index) {
            case 0:
              apartment.paid = ev.currentTarget.checked ? 1 : 0;
              break;
            case 1:
              apartment.privilege = ev.currentTarget.checked ? 1 : 0;
              break;
            case 2:
              apartment.exempt = ev.currentTarget.checked ? 1 : 0;
              break;
            case 3:
              apartment.locked = ev.currentTarget.checked ? 1 : 0;
              break;
            default:
              break;
          }
          break;
        }
      }

      var stat = {
        paid: 0,
        privilege: 0,
        exempt: 0,
        locked: 0
      };

      getPaids(apartments);
      getPrivileges(apartments);
      getExemps(apartments);
      getLockeds(apartments);

      document.getElementById('apartments').value = JSON.stringify(apartments);
    }
  }
  catch (error) {
    console.log('checkApartment Error: ' + error.message);
  }
}

document.getElementById('addApartment').addEventListener('click', function (e) {
  application.actionWithApartment = ACTION_ADD_APARTMENT;
  document.getElementById('apartmentNumber').value = '';
  document.getElementById('apartmentLetter').selectedIndex = 0;
  $('#changeApartmentDialog').modal();
})

document.getElementById('buildApartments').addEventListener('click', function (e) {
  application.actionWithDialog = ACTION_DIALOG_BUILD_APARTMENTS;
  document.getElementById('replace-me').innerHTML = "Существующие данные будут перезаписаны. Продолжить построение списка?";
  $('#modalYesNo').modal();
})

document.getElementById('prolongOrder').addEventListener('click', function (e) {
  application.actionWithDialog = ACTION_DIALOG_PROLONG_ORDER;
  document.getElementById('replace-me').innerHTML = "Пролонгировать договор?";
  $('#modalYesNo').modal();
})



$('#modalYesNo').on('shown.bs.modal', function () {
  document.getElementById('additionalAlert').hidden = true;
})

$('#changeApartmentDialog').on('shown.bs.modal', function () {
  document.getElementById('alertApartment').hidden = true;
  document.getElementById('apartmentNumber').focus();
})

function editApartment(ev) {
  var id = ev.currentTarget.parentElement.parentElement.getAttribute('data-uid');
  var rowIndex = ev.currentTarget.parentElement.parentElement.rowIndex;

  application.editApartment.uid = id;
  application.editApartment.rowIndex = rowIndex;
  application.actionWithApartment = ACTION_EDIT_APARTMENT;

  ev.stopPropagation();

  try {
    var apartments = JSON.parse(document.getElementById('apartments').value).table;
    if ((rowIndex - 2) < apartments.length) {
      document.getElementById('apartmentNumber').value = apartments[rowIndex - 2].number;
      document.getElementById('apartmentLetter').selectedIndex = apartments[rowIndex - 2].letter;
      $('#changeApartmentDialog').modal();
    }
  } catch (error) {
    console.log('editApartment Error: ' + error.message)
  }
}

document.getElementById('saveApartment').addEventListener('click', function (e) {
  var selectedIndex = document.getElementById('apartmentLetter').selectedIndex;
  var validNumber = document.getElementById('apartmentNumber').value;
  var validLetter = document.getElementById('apartmentLetter').options[selectedIndex].value;

  try {
    var apartments = JSON.parse(document.getElementById('apartments').value);

    switch (application.actionWithApartment) {
      case ACTION_ADD_APARTMENT:

        if (!apartmentNumberNotEmpty(validNumber)) {
          showAlert2(false, '<strong>Внимание!</strong>&nbsp;Квартира не имеет номера!');
          return;
        }

        if (!apartmentNumberIsNotNumber(validNumber)) {
          showAlert2(false, '<strong>Внимание!</strong>&nbsp;Номер квартиры не является числом!');
          return;
        }

        var apartmentIsExists = apartments.table.filter(function(item) {
          return (Number(item.number) === Number(validNumber)) && (Number(item.letter) === Number(validLetter));
        })

        if ((Array.isArray(apartmentIsExists)) && (apartmentIsExists.length > 0)) {
          showAlert2(false, '<strong>Внимание!</strong>&nbsp;Такая квартира уже существует!');
          return;
        }
        // TODO: Добавить проверку квартиру - не пустая и только число + не должно быть дублей

        showAlert2(true, '&nbsp;');

        var newApartment = {};
        newApartment.uid = 0;
        newApartment.number = validNumber;
        newApartment.letter = Number(validLetter);
        newApartment.fullNumber = newApartment.number.trim() + (selectedIndex > 0 ? document.getElementById('apartmentLetter').options[selectedIndex].text : '');
        newApartment.paid = 0;
        newApartment.privilege = 0;
        newApartment.exempt = 0;
        newApartment.locked = 0;
        newApartment.halfPaid = 0;
        newApartment.paidDT = null;

        apartments.table.push(newApartment);
        document.getElementById('apartments').value = JSON.stringify(apartments);

        var newRow = generateNewRowBasedTemplate(newApartment.uid, newApartment.fullNumber);
        $('#tableApartments tr:last').after(newRow);
        sortApartments();

        getApartmentsCount(apartments)
        break;
      case ACTION_EDIT_APARTMENT:
        for (var apartment of apartments.table) {
          if (Number(apartment.uid) === Number(application.editApartment.uid)) {
            apartment.number = validNumber;
            apartment.letter = Number(validLetter);
            apartment.fullNumber = apartment.number.trim() + (selectedIndex > 0 ? document.getElementById('apartmentLetter').options[selectedIndex].text : '');

            var rows = document.getElementById('tableApartments').rows;
            rows[application.editApartment.rowIndex].getElementsByTagName('td')[1].innerHTML = apartment.fullNumber;
            document.getElementById('apartments').value = JSON.stringify(apartments);
            break;
          }
        }
        break;
      default:
        break;
    }


    $('#changeApartmentDialog').modal('hide');
  }
  catch (error) {
    console.log('saveApartment Click Error: ' + error.message)
  }
});

function removeApartment(ev) {
  var id = ev.currentTarget.parentElement.parentElement.getAttribute('data-uid');
  var rowIndex = ev.currentTarget.parentElement.parentElement.rowIndex;
  ev.stopPropagation();

  application.actionWithDialog = ACTION_DIALOG_DELETE_APARTMENT;
  application.deletedApartment.uid = id;
  application.deletedApartment.rowIndex = rowIndex;

  document.getElementById('replace-me').innerHTML = "Удалить квартиру?";
  $('#modalYesNo').modal();
}

document.getElementById('decide').addEventListener('click', function (e) {

  var apartments = JSON.parse(document.getElementById('apartments').value);

  switch (application.actionWithDialog) {
    case ACTION_DIALOG_BUILD_APARTMENTS:
      // TODO: Обе квартиры не пустые, только число, start < end
      var start = document.getElementById('startApartment').value;
      var end = document.getElementById('endApartment').value;

      if (!apartmentNumberNotEmpty(start)) {
        showAlert(false, '<strong>Внимание!</strong>&nbsp;Начальная квартира не имеет номера!');
        return;
      }

      if (!apartmentNumberIsNotNumber(start)) {
        showAlert(false, '<strong>Внимание!</strong>&nbsp;Номер начальной квартиры не является числом!');
        return;
      }

      if (!apartmentNumberNotEmpty(end)) {
        showAlert(false, '<strong>Внимание!</strong>&nbsp;Конечная квартира не имеет номера!');
        return;
      }

      if (!apartmentNumberIsNotNumber(start)) {
        showAlert(false, '<strong>Внимание!</strong>&nbsp;Номер конечной квартиры не является числом!');
        return;
      }

      if (!checkNumberingOfApartments(start, end)) {
        showAlert(false, '<strong>Внимание!</strong>&nbsp;Начальный номер квартиры больше конечного номера квартиры!');
        return;
      }

      showAlert(true, '&nbsp;')

      var bodyTable = document.getElementById('tableApartments').getElementsByTagName('tbody')[0];

      bodyTable.innerHTML = '';
      apartments.table.length = 0;

      for (let ind = start; ind <= end; ind++) {
        apartments.table.push({
          uid: 0,
          number: ind,
          letter: 0,
          fullNumber: ind,
          paid: 0,
          privilege: 0,
          exempt: 0,
          locked: 0,
          halfPaid: 0,
          paidDT: null
        });
        let newRow = generateNewRowBasedTemplate(0, ind);
        $('#tableApartments tr:last').after(newRow);
      }
      apartments.isRebuilt = true;
      document.getElementById('apartments').value = JSON.stringify(apartments);

      getPaids(apartments);
      getPrivileges(apartments);
      getExemps(apartments);
      getLockeds(apartments);
      getApartmentsCount(apartments);
      break;
    case ACTION_DIALOG_PROLONG_ORDER:
      var rows = document.getElementById('tableApartments').rows;
      if (rows.length > 0) {
        for (let ind = 2; ind < rows.length; ind++) {
          rows[ind].cells[2].children[0].checked = false;
          rows[ind].cells[3].children[0].checked = false;
          rows[ind].cells[4].children[0].checked = false;
          rows[ind].cells[5].children[0].checked = false;

          rows[ind].className = '';
        }
      }

      apartments.table.forEach (item => {
        item.paid = 0;
        item.privilege = 0;
        item.exempt = 0;
        item.locked = 0;
        item.halfPaid = 0;
      })
      document.getElementById('apartments').value = JSON.stringify(apartments);

      getPaids(apartments);
      getPrivileges(apartments);
      getExemps(apartments);
      getLockeds(apartments);

      var start = document.getElementById('startService').value;
      var end = document.getElementById('endService').value;
      document.getElementById('startService').value = moment(start, 'DD.MM.YYYY').add(1, 'years').format('DD.MM.YYYY');
      document.getElementById('endService').value = moment(end, 'DD.MM.YYYY').add(1, 'years').format('DD.MM.YYYY');
      //
      break;
    case ACTION_DIALOG_DELETE_APARTMENT:
      document.getElementById('tableApartments').deleteRow(application.deletedApartment.rowIndex);
      if ((application.deletedApartment.rowIndex - 2) < apartments.table.length) {
        apartments.table.splice(application.deletedApartment.rowIndex - 2,  1);
      }
      if (application.deletedApartment.uid > 0) {
        apartments.isDeleted.push(application.deletedApartment.uid);
      }
      try {
        document.getElementById('apartments').value = JSON.stringify(apartments);
        document.getElementById('statApartments').innerHTML = apartments.table.length;

        // var newTable = apartments.table.filter(function (item) {
        //   return Number(item.uid) != Number(application.deletedApartment.uid);
        // });
        // apartments.table = newTable;
        // apartments.isDeleted.push(application.deletedApartment.uid)
        // document.getElementById('apartments').value = JSON.stringify(apartments);
        // document.getElementById('statApartments').innerHTML = newTable.length;
      } catch (error) {
        console.log('decide Error: ' + error.message);
      }

      getPaids(apartments);
      getPrivileges(apartments);
      getExemps(apartments);
      getLockeds(apartments);
      getApartmentsCount(apartments)

      break;

    default:
      break;
  }
  $('#modalYesNo').modal('hide');
});

// Original code: https://www.w3schools.com/howto/howto_js_sort_table.asp
// Code modify
function sortApartments() {
  var rows, shouldSwitch;
  var table = document.getElementById('tableApartments');
  var switching = true;
  var dir = "asc";
  var switchcount = 0;
  while (switching) {
    switching = false;
    rows = table.rows;
    for (var ind = 1; ind < (rows.length - 1); ind++) {
      shouldSwitch = false;
      var x = rows[ind].getElementsByTagName('td')[1];
      var y = rows[ind + 1].getElementsByTagName('td')[1];
      if (dir == "asc") {
        if (parseInt(x.innerHTML) > parseInt(y.innerHTML)) {
          // if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
          shouldSwitch = true;
          break;
        }
      }
      else if (dir == "desc") {
        if (parseInt(x.innerHTML) < parseInt(y.innerHTML)) {
          // if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
          shouldSwitch = true;
          break;
        }
      };
    }

    if (shouldSwitch) {
      rows[ind].parentNode.insertBefore(rows[ind + 1], rows[ind]);
      switching = true;
      switchcount++;
    }
  }
}

function sortTable(index) {
  var rows, shouldSwitch;
  var table = document.getElementById('tableApartments');
  var switching = true;
  var dir = "desc";
  var switchcount = 0;
  while (switching) {
    switching = false;
    rows = table.rows;
    for (var ind = 1; ind < (rows.length - 1); ind++) {
      shouldSwitch = false;
      var x = rows[ind].getElementsByTagName('td')[index];
      var y = rows[ind + 1].getElementsByTagName('td')[index];
      if (dir == "asc") {
        if (x.firstElementChild.checked > y.firstElementChild.checked) {
          shouldSwitch = true;
          break;
        }
      } else if (dir == "desc") {
        if (x.firstElementChild.checked < y.firstElementChild.checked) {
          shouldSwitch = true;
          break;
        }
      }
    }

    if (shouldSwitch) {
      rows[ind].parentNode.insertBefore(rows[ind + 1], rows[ind]);
      switching = true;
      switchcount++;
    }
  }
}

function saveFullAddress(data) {
  try {
    var address = JSON.parse(document.getElementById('address').value);

    switch (data.level) {
      case 0:
        address.city.key = data.cityId;
        address.city.value = data.cityName;
        address.street.key = 0;
        address.street.value = '';
        address.house.key = 0;
        address.house.value = '';
        break;
      case 1:
        address.city.key = data.cityId;
        address.city.value = data.cityName;
        address.street.key = data.streetId;
        address.street.value = data.streetName;
        address.house.key = 0;
        address.house.value = '';
        break;
      case 2:
        address.city.key = data.cityId;
        address.city.value = data.cityName;
        address.street.key = data.streetId;
        address.street.value = data.streetName;
        address.house.key = data.houseId;
        address.house.value = data.houseNumber;
        break;
    }
    document.getElementById('address').value = JSON.stringify(address);
  }
  catch (e) {
    console.log(e.message);
  }
}

function filterApartment() {
  var filter = document.getElementById('findApartment').value.trim().toLowerCase();
  var rows = document.getElementById('tableApartments').getElementsByTagName('tr');

  if ((rows instanceof HTMLCollection) && (rows.length > 0)) {
    for (ind = 0; ind < rows.length; ind++) {
      var td = rows[ind].getElementsByTagName("td")[1];
      if (td) {
        var value = td.textContent || td.innerText;
        if (value.trim().toLowerCase().indexOf(filter, 0) === 0) {
          rows[ind].style.display = "";
        } else {
          rows[ind].style.display = "none";
        }
      }
    }
  }
}

document.getElementById('clearEquipment').addEventListener('click', function (e) {
  try {
    var equipment = JSON.parse(document.getElementById('equipment').value);
    equipment.key = 0;
    equipment.value = '';
    document.getElementById('equipment').value = JSON.stringify(equipment);
    document.getElementById('equipmentName').value = '';
    document.getElementById('endContract').value = '';
  } catch (error) {
    console.log('clearEquipment Error: ' + error.message);
  }
});

document.getElementById('clearFullAddress').addEventListener('click', function (e) {
  try {
    var address = JSON.parse(document.getElementById('address').value);
    address.city.key = 0;
    address.city.value = '';

    address.street.key = 0;
    address.street.value = '';
    address.street.cityId = 0;

    address.house.key = 0;
    address.house.value = '';
    address.house.streetId = 0;

    document.getElementById('address').value = JSON.stringify(address);
  } catch (error) {
    console.log('clearFullAddress Error: ' + error.message);
  }
});

document.getElementById('clearClientContract').addEventListener('click', function (e) {
  try {
    var client = JSON.parse(document.getElementById('client').value);
    client.contract.key = 0;
    client.contract.value = '';
    document.getElementById('client').value = JSON.stringify(client);
    document.getElementById('clientContractName').value = '';
    document.getElementById('clientContractPhones').value = '';

    if (document.getElementById('onePerson').checked) {
      document.getElementById('onePerson').checked = !document.getElementById('onePerson').checked;
    }
  } catch (error) {
    console.log('clearClientContract Error: ' + error.message);
  }
});

document.getElementById('onePerson').addEventListener('click', function (e) {
  if (e.currentTarget.checked) {
    try {
      var client = JSON.parse(document.getElementById('client').value);
      if ((client.contract.key > 0) && (client.service.key != client.contract.key)) {
        client.service = client.contract;
        document.getElementById('client').value = JSON.stringify(client);
        document.getElementById('clientServiceName').value = client.service.value;
        document.getElementById('clientServicePhones').value = document.getElementById('clientContractPhones').value;
      }
    } catch (error) {

    }
  }
});

document.getElementById('clearClientService').addEventListener('click', function (e) {
  try {
    var client = JSON.parse(document.getElementById('client').value);
    client.service.key = 0;
    client.service.value = '';
    document.getElementById('client').value = JSON.stringify(client);
    document.getElementById('clientServiceName').value = '';
    document.getElementById('clientServicePhones').value = '';

    if (document.getElementById('onePerson').checked) {
      document.getElementById('onePerson').checked = !document.getElementById('onePerson').checked;
    }
  } catch (error) {
    console.log('clearClientContract Error: ' + error.message);
  }
});

document.getElementById('clearApartment').addEventListener('click', function (e) {
  document.getElementById('findApartment').value = '';
  document.getElementById('findApartment').focus();
  filterApartment();
});

document.getElementById('findApartment').addEventListener("keyup", function (e) {
  filterApartment();
});

// $('#equipment_name').typeahead({
//   items: 15,
//   source: function (query, process) {
//     var results = [];
//     map = {};
//     $.ajax({
//       'url': '/orders/search_equipment',
//       'type': 'POST',
//       'contentType': 'application/json',
//       'data': JSON.stringify({
//         'suggestion': query,
//         'limit': 15
//       }),
//       success: function (datas) {
//         $.each(datas, function (i, result) {
//           map[result.value] = result;
//           results.push(result.value);
//         });
//         process(results);
//       }
//     });
//   },
//   updater: function (element) {
//     var equipment = JSON.parse(document.getElementById('equipment').value);
//     try {
//       equipment.key = map[element].id;
//       equipment.value = map[element].value;
//       document.getElementById('equipment').value = JSON.stringify(equipment);
//     } catch (error) {
//       //
//     }

//     return element;
//   }
// });

$('#equipmentName').typeahead({
  items: 15,
  source: function (query, process) {
    var results = [];
    map = {};

    axios.post('/orders/find_equipment', {
      suggestion: query,
      limit: 15
    }
    ).then(function (response) {
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
    try {
      var equipment = JSON.parse(document.getElementById('equipment').value);
      equipment.key = map[element].id;
      equipment.value = map[element].value;
      var createDate = document.getElementById('createDate').value;
      if (createDate.trim() != '') {
        document.getElementById('endContract').value = moment(createDate, 'DD.MM.YYYY').add(map[element].guaranteePeriod, 'years').format('DD.MM.YYYY');
      }

      document.getElementById('equipment').value = JSON.stringify(equipment);
    }
    catch (e) {
      console.log('equipmentName Error: ' + e.message);
    }
    return element;
  }
});

$('#fullAddress').typeahead({
  items: 15,
  source: function (query, process) {
    var results = [];
    map = {};

    axios.post('/orders/find_full_address', {
      suggestion: query,
      rowsCount: 15
    })
      .then(function (response) {
        var datas = response.data;
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
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  updater: function (element) {
    var selectedElement = map[element];

    switch (selectedElement.level) {
      case 0:
        saveFullAddress(selectedElement);
        return selectedElement.cityName + ', ';
      case 1:
        saveFullAddress(selectedElement);
        return selectedElement.cityName + ', ' + selectedElement.streetName + ', ';
      case 2:
        saveFullAddress(selectedElement);
        return selectedElement.cityName + ', ' + selectedElement.streetName + ', ' + selectedElement.houseNumber;
      default:
        saveFullAddress(selectedElement);
        return selectedElement.cityName;
    }
  }
});

$('#clientContractName').typeahead({
  items: 15,
  source: function (query, process) {
    var results = [];
    map = {};

    axios.post('/orders/find_client', {
      suggestion: query,
      limit: 15
    }
    ).then(function (response) {
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
    try {
      var client = JSON.parse(document.getElementById('client').value);
      client.contract.key = map[element].id;
      client.contract.value = map[element].value;
      document.getElementById('clientContractPhones').value = map[element].phones;
      document.getElementById('onePerson').checked = (+client.contract.key === +client.service.key);

      document.getElementById('client').value = JSON.stringify(client);
    }
    catch (e) {
      console.log(e.message);
    }
    return element;
  }
});

$('#clientServiceName').typeahead({
  items: 15,
  source: function (query, process) {
    var results = [];
    map = {};

    axios.post('/orders/find_client', {
      suggestion: query,
      limit: 15
    }
    ).then(function (response) {
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
    try {
      var client = JSON.parse(document.getElementById('client').value);
      client.service.key = map[element].id;
      client.service.value = map[element].value;
      document.getElementById('clientServicePhones').value = map[element].phones;

      document.getElementById('onePerson').checked = (+client.contract.key === +client.service.key);
      document.getElementById('client').value = JSON.stringify(client);
    }
    catch (e) {
      console.log(e.message);
    }
    return element;
  }
});

$('.select-all').on('focus', function (e) {
  $(this)
    .one('mouseup', function () {
      $(this).select();
      return false;
    })
    .select();
});

function calculateComplete(index) {
  var row = document.getElementById("tableComplete").rows[index];
  // row.cells[0].innerText = dataTable[uid].faultName;
  // row.cells[1].innerText = dataTable[uid].decision;
  // row.cells[2].innerText = dataTable[uid].workerName;

  var dataTable = [];
  var data = document.getElementById('complete').value;
  try {
    dataTable = JSON.parse(data);
    switch (index) {
      case 1:
        dataTable.equipment.quantity = parseInt(document.getElementById('completeQuantity').value);
        dataTable.equipment.price = parseFloat(document.getElementById('completePrice').value);
        dataTable.equipment.cost = dataTable.equipment.quantity * dataTable.equipment.price;

        row.cells[1].innerText = dataTable.equipment.quantity;
        row.cells[2].innerText = dataTable.equipment.price.toFixed(2);
        row.cells[3].innerText = dataTable.equipment.cost.toFixed(2);
        break;
      case 2:
        dataTable.mounting.quantity = parseInt(document.getElementById('completeQuantity').value);
        dataTable.mounting.price = parseFloat(document.getElementById('completePrice').value);
        dataTable.mounting.cost = dataTable.mounting.quantity * dataTable.mounting.price;

        row.cells[1].innerText = dataTable.mounting.quantity;
        row.cells[2].innerText = dataTable.mounting.price.toFixed(2);
        row.cells[3].innerText = dataTable.mounting.cost.toFixed(2);
        break;
      case 3:
        dataTable.subscriberUnit.quantity = parseInt(document.getElementById('completeQuantity').value);
        dataTable.subscriberUnit.price = parseFloat(document.getElementById('completePrice').value);
        dataTable.subscriberUnit.cost = dataTable.subscriberUnit.quantity * dataTable.subscriberUnit.price;

        row.cells[1].innerText = dataTable.subscriberUnit.quantity;
        row.cells[2].innerText = dataTable.subscriberUnit.price.toFixed(2);
        row.cells[3].innerText = dataTable.subscriberUnit.cost.toFixed(2);
        break;
      case 4:
        dataTable.key.quantity = parseInt(document.getElementById('completeQuantity').value);
        dataTable.key.price = parseFloat(document.getElementById('completePrice').value);
        dataTable.key.cost = dataTable.key.quantity * dataTable.key.price;

        row.cells[1].innerText = dataTable.key.quantity;
        row.cells[2].innerText = dataTable.key.price.toFixed(2);
        row.cells[3].innerText = dataTable.key.cost.toFixed(2);
        break;
      case 5:
        dataTable.door.quantity = parseInt(document.getElementById('completeQuantity').value);
        dataTable.door.price = parseFloat(document.getElementById('completePrice').value);
        dataTable.door.cost = dataTable.door.quantity * dataTable.door.price;

        row.cells[1].innerText = dataTable.door.quantity;
        row.cells[2].innerText = dataTable.door.price.toFixed(2);
        row.cells[3].innerText = dataTable.door.cost.toFixed(2);
        break;
      case 8:
        dataTable.discountForApartment.cost = parseFloat(document.getElementById('completeCost').value);

        row.cells[3].innerText = dataTable.discountForApartment.cost.toFixed(2);
        break;
    }

    dataTable.subtotal.cost = dataTable.equipment.cost + dataTable.mounting.cost +
      dataTable.subscriberUnit.cost + dataTable.key.cost + dataTable.door.cost;

    dataTable.subtotalForApartment.cost = dataTable.subscriberUnit.quantity > 0 ? dataTable.subtotal.cost / dataTable.subscriberUnit.quantity : 0;

    dataTable.total.cost = dataTable.subtotal.cost - dataTable.discountForApartment.cost;

    var rowTotal = document.getElementById("tableComplete").rows[6];
    rowTotal.cells[3].innerText = dataTable.subtotal.cost.toFixed(2);

    var rowApartment = document.getElementById("tableComplete").rows[7];
    rowApartment.cells[3].innerText = dataTable.subtotalForApartment.cost.toFixed(2)

    var rowTotal = document.getElementById("tableComplete").rows[9];
    rowTotal.cells[3].innerText = (dataTable.subtotal.cost - dataTable.discountForApartment.cost).toFixed(2)

    document.getElementById('complete').value = JSON.stringify(dataTable);
  }
  catch (e) {
    //
  }
};

document.getElementById('tableComplete').addEventListener('click', function (e) {
  var target = e.target;
  if (target.closest('td') == null) return;

  //   alert("row" + target.closest('tr').rowIndex +
  // " -column" + target.closest('td').cellIndex +  ', value: ' + target.parentElement.children[target.closest('td').cellIndex].innerText);
  var rowIndex = target.closest('tr').rowIndex;
  if ((rowIndex == 6) || (rowIndex == 7)) return;
  if (rowIndex > 8) return;

  application.completeRowIndex = rowIndex;
  var show = ((rowIndex >= 1) && (rowIndex <= 5));

  document.getElementById('completeQuantityRow').hidden = !show;
  document.getElementById('completePriceRow').hidden = !show;
  document.getElementById('completeCostRow').hidden = show;

  var dataTable = [];
  var data = $('#complete').val();
  try {
    dataTable = JSON.parse(data);
    switch (rowIndex) {
      case 1:
        document.getElementById('completeQuantity').value = dataTable.equipment.quantity;
        document.getElementById('completePrice').value = dataTable.equipment.price.toFixed(2);
        document.getElementById('completeCost').value = dataTable.equipment.cost.toFixed(2);
        break;
      case 2:
        document.getElementById('completeQuantity').value = dataTable.mounting.quantity;
        document.getElementById('completePrice').value = dataTable.mounting.price.toFixed(2);
        document.getElementById('completeCost').value = dataTable.mounting.cost.toFixed(2);
        break;
      case 3:
        document.getElementById('completeQuantity').value = dataTable.subscriberUnit.quantity;
        document.getElementById('completePrice').value = dataTable.subscriberUnit.price.toFixed(2);
        document.getElementById('completeCost').value = dataTable.subscriberUnit.cost.toFixed(2);
        break;
      case 4:
        document.getElementById('completeQuantity').value = dataTable.key.quantity;
        document.getElementById('completePrice').value = dataTable.key.price.toFixed(2);
        document.getElementById('completeCost').value = dataTable.key.cost.toFixed(2);
        break;
      case 5:
        document.getElementById('completeQuantity').value = dataTable.door.quantity;
        document.getElementById('completePrice').value = dataTable.door.price.toFixed(2);
        document.getElementById('completeCost').value = dataTable.door.cost.toFixed(2);
        break;
      case 8:
        document.getElementById('completeQuantity').value = 1;
        document.getElementById('completePrice').value = 0.00;
        document.getElementById('completeCost').value = dataTable.discountForApartment.cost.toFixed(2);
        break;
    }
  }
  catch (e) {
    //
  }

  $('#completeDialog').modal();
});

$('#completeDialog').on('shown.bs.modal', function () {
  var fieldName = 'completeQuantity';
  if (application.completeRowIndex == 8) {
    fieldName = 'completeCost';
  }
  document.getElementById(fieldName).focus();
})

document.getElementById('saveComplete').addEventListener('click', function (e) {
  calculateComplete(application.completeRowIndex);
  $('#completeDialog').modal('hide');
});

function generateNewRowBasedTemplate(uid, fullNumber) {
  var output =
    `<tr class="" data-uid="${uid}">
    <td class="col-xs-1 text-center align-middle">
      <button type="button" class="btn btn-default btn-xs" onclick="showHistory(event)">
        <span class="glyphicon glyphicon-rub" aria-hidden="true"></span>
      </button>
    </td>
    <td class="col-xs-1 text-center align-middle">
      ${fullNumber}
    </td>
    <td class="col-xs-1 text-center align-middle">
      <input type="checkbox" class="styled" onclick="checkApartment(event, 0)"
    </td>
    <td class="col-xs-1 text-center align-middle">
      <input type="checkbox" class="styled" onclick="checkApartment(event, 1)"
    </td>
    <td class="col-xs-1 text-center align-middle">
      <input type="checkbox" class="styled" onclick="checkApartment(event, 2)"
    </td>
    <td class="col-xs-1 text-center align-middle">
      <input type="checkbox" class="styled" onclick="checkApartment(event, 3)"
    </td>
    <td class="col-xs-2 text-center align-middle">
      \u00A0
    </td>
    <td class="col-xs-1 text-center align-middle">
      <button type="button" class="btn btn-info btn-xs" onclick="editApartment(event)"
        data-uid="${uid}">
        <span class="glyphicon glyphicon-pencil" aria-hidden="true"></span>
      </button>
      <button type="button" class="btn btn-danger btn-xs" onclick="removeApartment(event)"
        data-uid="${uid}">
        <span class="glyphicon glyphicon-minus" aria-hidden="true"></span>
      </button>
    </td>
  </tr>`;
  return output;
}

function getPaids(apartments) {
  document.getElementById('statPaid').innerHTML = apartments.table.filter(function (item) {
    return Number(item.paid) === 1;
  }).length;
}

function getPrivileges(apartments) {
  document.getElementById('statPrivilege').innerHTML = apartments.table.filter(function (item) {
    return Number(item.privilege) === 1;
  }).length;
}

function getExemps(apartments) {
  document.getElementById('statExempt').innerHTML = apartments.table.filter(function (item) {
    return Number(item.exempt) === 1;
  }).length;
}

function getLockeds(apartments) {
  document.getElementById('statLocked').innerHTML = apartments.table.filter(function (item) {
    return Number(item.locked) === 1;
  }).length;
}

function getApartmentsCount(apartments) {
  document.getElementById('statApartments').innerHTML = apartments.table.length;
}

function apartmentNumberNotEmpty(data) {
  return data.trim().length > 0;
}

function apartmentNumberIsNotNumber(data) {
  var result = Number(data);
  if (isNaN(result)) return false;
  return typeof result === 'number';
}

function checkNumberingOfApartments(lowNumber, highNumber) {
  return Number(lowNumber) < Number(highNumber);
}

function showAlert(hidden, htmlText) {
  document.getElementById('additionalAlert').hidden = hidden;
  document.getElementById('additionalAlert').innerHTML = htmlText;
}

function showAlert2(hidden, htmlText) {
  document.getElementById('alertApartment').hidden = hidden;
  document.getElementById('alertApartment').innerHTML = htmlText;
}