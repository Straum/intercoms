const ACTION_ADD_APARTMENT = 0;
const ACTION_EDIT_APARTMENT = 1;

const ACTION_DIALOG_BUILD_APARTMENTS = 2;
const ACTION_DIALOG_PROLONG_ORDER = 3;
const ACTION_DIALOG_DELETE_APARTMENT = 4;
const ACTION_DIALOG_DELETE_PAYMENT = 5;
const ACTION_DIALOG_DELETE_PAYMENT_FROM_REGISTER = 6;

const ACTION_CLIENT = 7;

class Application {
  constructor() {
    this.deletedApartment = {
      uid: 0,
      rowIndex: 0,
    };

    this.editApartment = {
      uid: 0,
      rowIndex: 0,
    };

    this.deletedPayment = {
      uid: 0,
      rowIndex: 0,
    };

    this.deletedPaymentFromRegister = {
      uid: 0,
      rowIndex: 0,
    };

    this.completeRowIndex = 1;
    this.actionWithApartment = ACTION_ADD_APARTMENT;
    this.actionWithDialog = ACTION_DIALOG_BUILD_APARTMENTS;

    this.apartmentId = 0;

    this.hostIP = '';
    this.hostPort = 0;

    this.address = {
      area: {
        id: 0,
        value: '',
      },
      city: {
        id: 0,
        value: '',
      },
      street: {
        id: 0,
        value: '',
        cityId: 0,
      },
      house: {
        id: 0,
        value: '',
        streetId: 0,
      },
      isCity: 0,
      noStreets: 0,
      noHouses: 0,
    };

    this.doubleAddress = {
      ...this.address,
    };

    this.clientChannel = ACTION_CLIENT;

    this.paymentOptions = [];

    this.deleted = [];
  }
}

const application = new Application();

application.hostIP = document.getElementById('hostIP').value;
application.hostPort = document.getElementById('hostPort').value;

function saveInBlackbox() {
  const fullAddress = document.getElementById('fullAddress');

  const client = document.getElementById('clientName');
  const { dataset: { clientId } } = client;

  const address = {
    area: {
      id: fullAddress.dataset.areaId,
      name: fullAddress.dataset.areaName,
    },
    city: {
      id: fullAddress.dataset.cityId,
      name: fullAddress.dataset.cityName,
    },
    street: {
      id: fullAddress.dataset.streetId,
      name: fullAddress.dataset.streetName,
    },
    house: {
      id: fullAddress.dataset.houseId,
      number: fullAddress.dataset.houseNumber,
    },
    noStreets: fullAddress.dataset.noStreets,
    noHouses: fullAddress.dataset.noHouses,
  };

  const table = document.getElementById('tableApartments');
  const apartments = {
    stat: {
      paid: 0,
      exempt: 0,
      locked: 0,
    },
    grid: [],
    deleted: [...application.deleted],
    isRebuilt: table.dataset.isRebuilt,
  };

  const rowCount = table.rows.length;
  if (rowCount > 2) {
    for (let ind = 2; ind < rowCount; ind += 1) {
      apartments.grid.push({
        uid: +table.rows.item(ind).getAttribute('data-apartment-uid'),
        number: +table.rows.item(ind).getAttribute('data-apartment-number'),
        letter: +table.rows.item(ind).getAttribute('data-apartment-letter'),
        halfPaid: +table.rows.item(ind).getAttribute('data-apartment-half-paid'),
        paid: table.rows.item(ind).children[2].firstElementChild.checked ? 1 : 0,
        exempt: table.rows.item(ind).children[3].firstElementChild.checked ? 1 : 0,
        locked: table.rows.item(ind).children[4].firstElementChild.checked ? 1 : 0,
      });
      if (table.rows.item(ind).children[2].firstElementChild.checked) {
        apartments.stat.paid += 1;
      }
      if (table.rows.item(ind).children[3].firstElementChild.checked) {
        apartments.stat.exempt += 1;
      }
      if (table.rows.item(ind).children[4].firstElementChild.checked) {
        apartments.stat.locked += 1;
      }
    }
  }

  document.getElementById('blackbox').value = JSON.stringify({
    address, clientId, apartments,
  });
}

saveInBlackbox();

function showHistory(ev) {
  const id = ev.currentTarget.parentElement.parentElement.getAttribute('data-apartment-uid');
  const apartmentInfo = ev.currentTarget.parentElement.parentElement.cells[1].innerText;
  ev.stopPropagation();

  application.apartmentId = id;
  axios.post('/orders/payments_history', {
    id,
    limit: 15,
  }).then((response) => {
    const { data } = response;
    const body = {
      personalAccount: '',
      payments: '',
      fines: '',
      prices: '',
      paymentOptions: [],
    };

    if (('personalAccount' in data) && (typeof data.personalAccount === 'string')) {
      const arrAccount = data.personalAccount.split('_');
      if (Array.isArray(arrAccount) && (arrAccount.length === 2)) {
        document.getElementById('personalAccount').innerHTML = `<mark>${arrAccount[0]}</mark>-<mark>${arrAccount[1]}</mark>`;
      }
    }

    if ((data.payments) && (Array.isArray(data.payments)) && (data.payments.length > 0)) {
      data.payments.forEach((element) => {
        body.payments += `<tr data-uid="${element.uid}">
          <td class="text-center align-middle">${moment(element.createDate).format('DD.MM.YYYY')}</td>
          <td class="text-center align-middle">${moment(element.payDate).format('DD.MM.YYYY')}</td>
          <td class="text-center align-middle">${element.uid}</td>
          <td class="text-center align-middle">${element.payMonth}</td>
          <td class="text-center align-middle">${element.payYear}</td>
          <td class="text-right align-middle">${element.amount.toFixed(2)}</td>
          <td class="text-center align-middle">${element.organizationName}</td>
          <td class="text-center align-middle">
            <button type="button" class="btn btn-danger btn-xs" onclick="removePayment(event)">
              <span class="glyphicon glyphicon-minus" aria-hidden="true">
              </span>
            </button></td>
          </tr>`;
      });
    }
    const bodyPaymentsRef = document.getElementById('tablePayments').getElementsByTagName('tbody')[0];
    bodyPaymentsRef.innerHTML = body.payments;

    if ((data.fines) && (Array.isArray(data.fines)) && (data.fines.length > 0)) {
      data.fines.forEach((element) => {
        body.fines += `<tr data-uid="${element.uid}">
          <td class="text-center align-middle">${moment(element.createDate).format('DD.MM.YYYY')}</td>
          <td class="text-center align-middle">${element.uid}</td>
          <td class="text-right align-middle">${element.amount.toFixed(2)}</td>
          <td class="text-center align-middle">
          <button type="button" class="btn btn-danger btn-xs" onclick="removePaymentFromRegister(event)">
            <span class="glyphicon glyphicon-minus" aria-hidden="true">
            </span>
          </button></td>
        </tr>`;
      });
    }
    const bodyFinesRef = document.getElementById('tableRegisters').getElementsByTagName('tbody')[0];
    bodyFinesRef.innerHTML = body.fines;

    if ((data.prices) && (Array.isArray(data.prices)) && (data.prices.length > 0)) {
      data.prices.forEach((element) => {
        body.prices += `<tr>
          <td class="text-center align-middle">${moment(element.startService).format('DD.MM.YYYY')}</td>
          <td class="text-center align-middle">${moment(element.endService).format('DD.MM.YYYY')}</td>
          <td class="text-right align-middle">${element.normalPayment.toFixed(2)}</td>
          <td class="text-center align-middle">${element.receiptPrinting != null ? moment(element.receiptPrinting).format('DD.MM.YYYY') : ''}</td>
          </tr>`;
      });
    }
    const bodyPricesRef = document.getElementById('tablePrices').getElementsByTagName('tbody')[0];
    bodyPricesRef.innerHTML = body.prices;

    application.paymentOptions = [];
    if ((data.paymentOptions)
      && (Array.isArray(data.paymentOptions)) && (data.paymentOptions.length > 0)) {
      application.paymentOptions = [...data.paymentOptions];
    }

    document.getElementById('historyDialogCapton').textContent = `История по квартире № ${apartmentInfo}`;
    document.getElementById('printReceiptForApartment').setAttribute('href', `/orders/print_receipt_for_apartment/${id}`);
    $('#historyDialog').modal();
  }).catch((error) => {
    // eslint-disable-next-line no-console
    console.log(error);
  });
}

$('[data-toggle="tooltip"]').tooltip();

$('.only-date').datetimepicker({
  locale: 'ru',
  format: 'L',
});

$('.only-datetime').datetimepicker({
  locale: 'ru',
});

$('.date-only-mouse').datetimepicker({
  locale: 'ru',
  ignoreReadonly: true,
  format: 'L',
});

$('#dtStartService').on('dp.change', () => {
  const start = document.getElementById('startService').value;
  document.getElementById('endService').value = moment(start, 'DD.MM.YYYY').add(1, 'years').format('DD.MM.YYYY');
});

const getPaids = (apartments) => {
  document.getElementById('statPaid').innerHTML = apartments.table.filter((item) => Number(item.paid) === 1).length;
};

const getExemps = (apartments) => {
  document.getElementById('statExempt').innerHTML = apartments.table.filter((item) => Number(item.exempt) === 1).length;
};

const getLockeds = (apartments) => {
  document.getElementById('statLocked').innerHTML = apartments.table.filter((item) => Number(item.locked) === 1).length;
};

function checkApartment(ev, index) {
  document.getElementById('tableApartments').dataset.isRebuilt = true;
  saveInBlackbox();
  const data = document.getElementById('blackbox').value;
  const obj = JSON.parse(data);

  document.getElementById('statPaid').innerHTML = obj.apartments.stat.paid;
  document.getElementById('statExempt').innerHTML = obj.apartments.stat.exempt;
  document.getElementById('statLocked').innerHTML = obj.apartments.stat.locked;
}

document.getElementById('addApartment').addEventListener('click', () => {
  application.actionWithApartment = ACTION_ADD_APARTMENT;
  document.getElementById('apartmentNumber').value = '';
  document.getElementById('apartmentLetter').selectedIndex = 0;
  $('#changeApartmentDialog').modal();
});

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
  const id = ev.currentTarget.parentElement.parentElement.getAttribute('data-apartment-uid');
  const { rowIndex } = ev.currentTarget.parentElement.parentElement;

  application.editApartment.uid = id;
  application.editApartment.rowIndex = rowIndex;
  application.actionWithApartment = ACTION_EDIT_APARTMENT;

  ev.stopPropagation();

  try {
    const apartments = JSON.parse(document.getElementById('blackbox').value).apartments.table;
    if ((rowIndex - 2) < apartments.length) {
      document.getElementById('apartmentNumber').value = apartments[rowIndex - 2].number;
      document.getElementById('apartmentLetter').selectedIndex = apartments[rowIndex - 2].letter;
      $('#changeApartmentDialog').modal();
    }
  } catch (error) {
    console.log('editApartment Error: ' + error.message);
  }
}

function showAlert2(hidden, htmlText) {
  document.getElementById('alertApartment').hidden = hidden;
  document.getElementById('alertApartment').innerHTML = htmlText;
}

const apartmentNumberNotEmpty = (data) => data.trim().length > 0;

const apartmentNumberIsNotNumber = (data) => {
  const result = Number(data);
  if (Number.isNaN(result)) return false;
  return typeof result === 'number';
};

const checkNumberingOfApartments = (lowNumber, highNumber) => lowNumber < highNumber;

function generateNewRowBasedTemplate(uid, fullNumber, apartmentNumber, apartmentLetter) {
  const output = `<tr
    data-apartment-uid="${uid}"
    data-apartment-number="${apartmentNumber}"
    data-apartment-letter="${apartmentLetter}"
    data-apartment-half-paid="0"
    >
    <td class="text-center align-middle">
      <button type="button" class="btn btn-default btn-xs" onclick="showHistory(event)">
        <span class="glyphicon glyphicon-rub" aria-hidden="true"></span>
      </button>
    </td>
    <td class="text-center align-middle">
      ${fullNumber}
    </td>
    <td class="text-center align-middle">
      <input type="checkbox" class="styled" onclick="checkApartment(event, 0)"
    </td>
    <td class="text-center align-middle">
      <input type="checkbox" class="styled" onclick="checkApartment(event, 2)"
    </td>
    <td class="text-center align-middle">
      <input type="checkbox" class="styled" onclick="checkApartment(event, 3)"
    </td>
    <td class="text-center align-middle">
      \u00A0
    </td>
    <td class="text-center align-middle">
      <button type="button" class="btn btn-info btn-xs" onclick="editApartment(event)"
        data-apartment-uid="${uid}">
        <span class="glyphicon glyphicon-pencil" aria-hidden="true"></span>
      </button>
      <button type="button" class="btn btn-danger btn-xs" onclick="removeApartment(event)"
        data-apartment-uid="${uid}">
        <span class="glyphicon glyphicon-minus" aria-hidden="true"></span>
      </button>
    </td>
  </tr>`;
  return output;
}

function sortApartments() {
  // let rows;
  // let shouldSwitch;
  // const table = document.getElementById('tableApartments');
  // let switching = true;
  // const dir = 'asc';
  // let switchcount = 0;

  // while (switching) {
  //   switching = false;
  //   rows = table.rows;
  //   for (let ind = 1; ind < (rows.length - 1); ind += 1) {
  //     shouldSwitch = false;
  //     const x = rows[ind].getElementsByTagName('td')[1];
  //     const y = rows[ind + 1].getElementsByTagName('td')[1];
  //     if (dir === 'asc') {
  //       if (parseInt(x.innerHTML, 10) > parseInt(y.innerHTML, 10)) {
  //         shouldSwitch = true;
  //         break;
  //       }
  //     } else if (dir === 'desc') {
  //       if (parseInt(x.innerHTML, 10) < parseInt(y.innerHTML, 10)) {
  //         shouldSwitch = true;
  //         break;
  //       }
  //     }
  //   }

  //   if (shouldSwitch) {
  //     rows[ind].parentNode.insertBefore(rows[ind + 1], rows[ind]);
  //     switching = true;
  //     switchcount++;
  //   }
  // }
}

function getApartmentsCount(apartments) {
  document.getElementById('statApartments').innerHTML = apartments.table.length;
}

document.getElementById('saveApartment').addEventListener('click', (e) => {
  const table = document.getElementById('tableApartments');
  const { selectedIndex } = document.getElementById('apartmentLetter');
  const validNumber = document.getElementById('apartmentNumber').value;
  const validLetter = document.getElementById('apartmentLetter').options[selectedIndex].value;

  const { apartments } = JSON.parse(document.getElementById('blackbox').value);

  if (application.actionWithApartment === ACTION_ADD_APARTMENT) {
    if (!apartmentNumberNotEmpty(validNumber)) {
      showAlert2(false, '<strong>Внимание!</strong>&nbsp;Квартира не имеет номера!');
      return;
    }

    if (!apartmentNumberIsNotNumber(validNumber)) {
      showAlert2(false, '<strong>Внимание!</strong>&nbsp;Номер квартиры не является числом!');
      return;
    }

    const apartmentIsExists = apartments.table.filter(
      (item) => ((+item.number === +validNumber) && (+item.letter === +validLetter)),
    );

    if ((Array.isArray(apartmentIsExists)) && (apartmentIsExists.length > 0)) {
      showAlert2(false, '<strong>Внимание!</strong>&nbsp;Такая квартира уже существует!');
      return;
    }

    const apartmentNumber = validNumber + (selectedIndex > 0 ? document.getElementById('apartmentLetter').options[selectedIndex].text : '');

    const newRow = generateNewRowBasedTemplate(
      0,
      apartmentNumber,
      validNumber,
      validLetter,
    );
    $('#tableApartments tr:last').after(newRow);
    table.dataset.isRebuilt = true;
    saveInBlackbox();
    sortApartments();
    getApartmentsCount(apartments);
  }

  if (application.actionWithApartment === ACTION_EDIT_APARTMENT) {
    for (let ind = 0; ind < apartments.table.length; ind += 1) {
      if (+apartments.table[ind].uid === +application.editApartment.uid) {
        const newNumber = validNumber
          + (selectedIndex > 0 ? document.getElementById('apartmentLetter').options[selectedIndex].text : '');

        const { rows } = document.getElementById('tableApartments');
        const currentRow = rows[application.editApartment.rowIndex];
        currentRow.dataset.apartmentNumber = validNumber;
        currentRow.dataset.apartmentLetter = validLetter;
        rows[application.editApartment.rowIndex].getElementsByTagName('td')[1].innerHTML = newNumber;
        table.dataset.isRebuilt = true;
        saveInBlackbox();
        sortApartments();
        break;
      }
    }
  }
  $('#changeApartmentDialog').modal('hide');
});

function removeApartment(ev) {
  var id = ev.currentTarget.parentElement.parentElement.getAttribute('data-apartment-uid');
  var rowIndex = ev.currentTarget.parentElement.parentElement.rowIndex;
  ev.stopPropagation();

  application.actionWithDialog = ACTION_DIALOG_DELETE_APARTMENT;
  application.deletedApartment.uid = id;
  application.deletedApartment.rowIndex = rowIndex;

  document.getElementById('replace-me').innerHTML = 'Удалить квартиру?';
  $('#modalYesNo').modal();
}

function removePayment(ev) {
  const id = ev.currentTarget.parentElement.parentElement.getAttribute('data-apartment-uid');
  const rowIndex = ev.currentTarget.parentElement.parentElement.rowIndex;
  ev.stopPropagation();

  application.actionWithDialog = ACTION_DIALOG_DELETE_PAYMENT;
  application.deletedPayment.uid = id;
  application.deletedPayment.rowIndex = rowIndex;

  document.getElementById('replace-me').innerHTML = 'Удалить платеж?';
  $('#modalYesNo').modal();
}

function removePaymentFromRegister(ev) {
  const id = ev.currentTarget.parentElement.parentElement.getAttribute('data-apartment-uid');
  const rowIndex = ev.currentTarget.parentElement.parentElement.rowIndex;
  ev.stopPropagation();

  application.actionWithDialog = ACTION_DIALOG_DELETE_PAYMENT_FROM_REGISTER;
  application.deletedPaymentFromRegister.uid = id;
  application.deletedPaymentFromRegister.rowIndex = rowIndex;

  document.getElementById('replace-me').innerHTML = 'Удалить из реестра?';
  $('#modalYesNo').modal();
}

function showAlert(hidden, htmlText) {
  document.getElementById('additionalAlert').hidden = hidden;
  document.getElementById('additionalAlert').innerHTML = htmlText;
}

document.getElementById('decide').addEventListener('click', (e) => {
  switch (application.actionWithDialog) {
    case ACTION_DIALOG_BUILD_APARTMENTS: {
      const start = document.getElementById('apartmentFrom').value;
      const end = document.getElementById('apartmentTo').value;

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

      const bodyTable = document.getElementById('tableApartments').tBodies[0];
      const tableContent = [];
      for (let ind = parseInt(start, 10); ind <= parseInt(end, 10); ind += 1) {
        const newRow = generateNewRowBasedTemplate(0, ind, ind, 0);
        tableContent.push(newRow);
      }
      bodyTable.innerHTML = tableContent.join('');
      document.getElementById('tableApartments').dataset.isRebuilt = true;
      saveInBlackbox();
      break;
    }

    case ACTION_DIALOG_PROLONG_ORDER: {
      const { rows } = document.getElementById('tableApartments');
      if (rows.length > 0) {
        for (let ind = 2; ind < rows.length; ind += 1) {
          rows[ind].cells[2].children[0].checked = false;
          rows[ind].className = '';
          rows[ind].setAttribute('data-apartment-half-paid', 0);
        }
      }
      const startService = document.getElementById('startService').value;
      const endService = document.getElementById('endService').value;
      document.getElementById('startService').value = moment(startService, 'DD.MM.YYYY').add(1, 'years').format('DD.MM.YYYY');
      document.getElementById('endService').value = moment(endService, 'DD.MM.YYYY').add(1, 'years').format('DD.MM.YYYY');
      document.getElementById('receiptPrinting').value = moment(new Date()).format('DD.MM.YYYY');
      document.getElementById('tableApartments').dataset.isRebuilt = true;
      saveInBlackbox();
      break;
    }

    case ACTION_DIALOG_DELETE_APARTMENT: {
      document.getElementById('tableApartments').deleteRow(application.deletedApartment.rowIndex);
      if (+application.deletedApartment.uid > 0) {
        application.deleted.push(application.deletedApartment.uid);
      }
      document.getElementById('tableApartments').dataset.isRebuilt = true;
      saveInBlackbox();
      break;
    }

    case ACTION_DIALOG_DELETE_PAYMENT: {
      deletePayment();
      break;
    }

    case ACTION_DIALOG_DELETE_PAYMENT_FROM_REGISTER: {
      deletedPaymentFromRegister();
      break;
    }

    default:
      break;
  }
  $('#modalYesNo').modal('hide');
});

function sortTable(index) {
  var rows, shouldSwitch;
  var table = document.getElementById('tableApartments');
  var switching = true;
  var dir = "desc";
  var switchcount = 0;
  while (switching) {
    switching = false;
    rows = table.rows;
    for (var ind = 2; ind < (rows.length - 1); ind++) {
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

  var data = [];
  try {
    var apartments = JSON.parse(document.getElementById('apartments').value);
    if (Array.isArray(apartments.table) && (apartments.table.length > 0)) {

      data = apartments.table.filter(function (item) {
        switch (index) {
          case 2:
            return item.paid > 0;
            break;
          case 3:
            return item.privilege > 0;
            break;
          case 4:
            return item.exempt > 0;
            break;
          case 5:
            return item.locked > 0;
            break;

          default:
            break;
        }
      });
    }
  } catch (error) {
    //
  }

  var aInfo = [];
  data.forEach(function (item) {
    aInfo.push(item.fullNumber);
  });

  var infoInput = document.getElementById('clipBoard');
  var infoPanel = document.getElementById('clipBoardRow');
  infoPanel.style.display = 'inline';

  infoInput.value = aInfo.join(', ');
  infoInput.select();
  document.execCommand("copy");

  setTimeout(() => {
    infoPanel.style.display = 'none';
  }, 30000);
}

function filterApartment() {
  const filter = document.getElementById('findApartment').value.trim().toLowerCase();
  const rows = document.getElementById('tableApartments').getElementsByTagName('tr');

  if ((rows instanceof HTMLCollection) && (rows.length > 0)) {
    for (let ind = 0; ind < rows.length; ind += 1) {
      const td = rows[ind].getElementsByTagName('td')[1];
      if (td) {
        const value = td.textContent || td.innerText;
        rows[ind].style.display = value.trim().toLowerCase().indexOf(filter, 0) === 0 ? '' : 'none';
      }
    }
  }
}

document.getElementById('clearFullAddress').addEventListener('click', () => {
  application.address.isCity = 0;
  application.address.area.id = 0;
  application.address.area.value = '';
  application.address.city.id = 0;
  application.address.city.value = '';
  application.address.street.id = 0;
  application.address.street.value = '';
  application.address.house.id = 0;
  application.address.house.value = '';
  const field = document.getElementById('fullAddress');
  field.dataset.areaId = 0;
  field.dataset.cityId = 0;
  field.dataset.streetId = 0;
  field.dataset.houseId = 0;
  field.dataset.areaName = '';
  field.dataset.cityName = '';
  field.dataset.streetName = '';
  field.dataset.houseNumber = '';
  field.value = '';
  saveInBlackbox();
});

document.getElementById('clearClient').addEventListener('click', () => {
  document.getElementById('clientPhones').value = '';
  const field = document.getElementById('clientName');
  field.dataset.clientId = 0;
  field.value = '';
  saveInBlackbox();
});

document.getElementById('clearApartment').addEventListener('click', () => {
  document.getElementById('findApartment').value = '';
  document.getElementById('findApartment').focus();
  filterApartment();
});

document.getElementById('findApartment').addEventListener('keyup', () => {
  filterApartment();
});

$('#fullAddress').typeahead({
  items: 15,
  source: (query, process) => {
    const results = [];
    map = {};

    axios.post('/removed_for_repair/full_address', {
      suggestion: query,
      limit: 15,
    },
    ).then((response) => {
      const { data } = response;
      const verifyNames = ((typeof data === 'object') && ('items' in data) && ('level' in data));
      if (!verifyNames) return;

      const { level } = data;
      const { items } = data;

      if (!Array.isArray(items)) return;

      items.forEach((item) => {
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

        map[uniqueIndex] = item;
        results.push(uniqueIndex);
      });
      process(results);
    }).catch((error) => {
      console.log(error);
    });
  },
  updater: (element) => {
    const selectedElement = map[element];
    let caption = '';
    // let address = { ...gAddress };
    switch (selectedElement.level) {
      case 0:
        if (+selectedElement.isCity === 0) {
          application.address.area.id = selectedElement.cityId;
          application.address.area.name = selectedElement.cityName;
        }
        else {
          application.address.city.id = selectedElement.cityId;
          application.address.city.name = selectedElement.cityName;
        }
        application.address.isCity = selectedElement.isCity;

        caption = `${selectedElement.cityName}, `;
        break;
      case 1:
        application.address.city.id = selectedElement.cityId;
        application.address.city.name = selectedElement.cityName;
        application.address.street.id = selectedElement.streetId;
        application.address.street.name = selectedElement.streetName;

        caption = `${selectedElement.cityName}, ${selectedElement.streetName}, `;
        break;
      case 2:
        application.address.city.id = selectedElement.cityId;
        application.address.city.name = selectedElement.cityName;
        application.address.street.id = selectedElement.streetId;
        application.address.street.name = selectedElement.streetName;
        application.address.house.id = selectedElement.houseId;
        application.address.house.number = selectedElement.houseNumber;

        caption = `${selectedElement.cityName}, ${selectedElement.streetName}, ${selectedElement.houseNumber}`;
        break;
      case 3:
        application.address.area.id = selectedElement.areaId;
        application.address.area.name = selectedElement.areaName;
        application.address.city.id = selectedElement.cityId;
        application.address.city.name = selectedElement.cityName;
        application.address.noStreets = selectedElement.noStreets;
        application.address.noHouses = selectedElement.noHouses;

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
        application.address.area.id = selectedElement.areaId;
        application.address.area.name = selectedElement.areaName;
        application.address.city.id = selectedElement.cityId;
        application.address.city.name = selectedElement.cityName;
        application.address.street.id = selectedElement.streetId;
        application.address.street.name = selectedElement.streetName;
        application.address.noStreets = selectedElement.noStreets;
        application.address.noHouses = selectedElement.noHouses;

        if (selectedElement.noStreets) {
          if (selectedElement.noHouses) {
            caption = `${selectedElement.areaName}, ${selectedElement.cityName}`;
          } else {
            application.address.house.id = selectedElement.houseId;
            application.address.house.number = selectedElement.houseNumber;
            caption = `${selectedElement.areaName}, ${selectedElement.cityName}, ${selectedElement.houseNumber}`;
          }
        }
        else {
          caption = `${selectedElement.areaName}, ${selectedElement.cityName}, ${selectedElement.streetName}`;
          if (!selectedElement.noHouses) {
            caption += ', ';
          }
        }
        break;
      case 5:
        application.address.area.id = selectedElement.areaId;
        application.address.area.name = selectedElement.areaName;
        application.address.city.id = selectedElement.cityId;
        application.address.city.name = selectedElement.cityName;
        application.address.street.id = selectedElement.streetId;
        application.address.street.name = selectedElement.streetName;
        application.address.house.id = selectedElement.houseId;
        application.address.house.number = selectedElement.houseNumber;

        caption = `${selectedElement.areaName}, ${selectedElement.cityName}, ${selectedElement.streetName}, ${selectedElement.houseNumber}`;
        break;
      default:
        application.address.area.id = 0;
        application.address.area.name = '';
        application.address.city.id = 0;
        application.address.city.name = '';
        application.address.street.id = 0;
        application.address.street.name = '';
        application.address.house.id = 0;
        application.address.house.number = '';
        break;
    }

    const field = document.getElementById('fullAddress');
    field.dataset.areaId = application.address.area.id;
    field.dataset.cityId = application.address.city.id;
    field.dataset.streetId = application.address.street.id;
    field.dataset.houseId = application.address.house.id;
    field.dataset.areaName = application.address.area.name;
    field.dataset.cityName = application.address.city.name;
    field.dataset.streetName = application.address.street.name;
    field.dataset.houseNumber = application.address.house.number;
    saveInBlackbox();
    return caption;
  },
});

$('#clientName').typeahead({
  items: 15,
  source: function (query, process) {
    var results = [];
    map = {};

    axios.post('/gates/find_client', {
      suggestion: query,
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
    document.getElementById('clientName').dataset.clientId = map[element].id;
    document.getElementById('clientName').value = map[element].value;
    document.getElementById('clientPhones').value = map[element].phones;
    saveInBlackbox();
    return element;
  },
  highlighter: function (element) {
    const selectedElement = map[element];
    var html = [];
    html.push('<div class="typeahead">');
    html.push('<div class="pull-left margin-small">');

    html.push(`<div class="text-left"><strong>${selectedElement.value}</strong></div>`);

    var address = '';
    if (selectedElement.cityId > 0) {
      address = `${selectedElement.cityName}`;
    }
    if (selectedElement.streetId > 0) {
      if (address === '') {
        address = `${selectedElement.streetName}`;
      }
      else {
        address += `, ${selectedElement.streetName}`;
      }
    }
    if (selectedElement.houseId > 0) {
      if (address === '') {
        address = 'Нет данных';
      }
      else {
        address += `, ${selectedElement.houseNumber}`;
        if (selectedElement.roomApartment.trim() != '') {
          address += `,  кв. ${selectedElement.roomApartment}`;
        }
        if (selectedElement.phones.trim() != '') {
          address += `,  тел. ${selectedElement.phones}`;
        }
      }
    }

    html.push(`<div class="text-left"><small>${address}</small></div>`);

    html.push('</div>');
    html.push('<div class="clearfix"></div>');
    html.push('</div>');
    return html.join('');
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

// function getPaids(apartments) {
//   document.getElementById('statPaid').innerHTML = apartments.table.filter(function (item) {
//     return Number(item.paid) === 1;
//   }).length;
// }

// function getExemps(apartments) {
//   document.getElementById('statExempt').innerHTML = apartments.table.filter(function (item) {
//     return Number(item.exempt) === 1;
//   }).length;
// }

// function getLockeds(apartments) {
//   document.getElementById('statLocked').innerHTML = apartments.table.filter(function (item) {
//     return Number(item.locked) === 1;
//   }).length;
// }

function deletePayment() {

  axios.post('/orders/delete_payment', {
    id: application.deletedPayment.uid
  }).then(function (response) {

    document.getElementById('tablePayments').deleteRow(application.deletedPayment.rowIndex);

    const data = response.data;
    let table = document.getElementById('tableApartments');
    if (table) {
      var rowLength = table.rows.length;
      for (let ind = 2; ind < rowLength; ind++) {
        if ((Number(table.rows.item(ind).getAttribute('data-apartment-uid'))) === Number(data.apartmentId)) {
          table.rows.item(ind).classList.remove('info2');
          table.rows.item(ind).classList.remove('warning2');
          table.rows.item(ind).classList.remove('success2');
          table.rows.item(ind).classList.remove('danger2');

          let className = '';
          if ((+data.paid == 1) && (+data.halfPaid == 2)) {
            className = 'info2';
          }

          if ((+data.paid == 1) && (+data.halfPaid == 1)) {
            className = 'warning2';
          }

          if ((+data.paid == 1) && (+data.halfPaid == 0)) {
            className = 'success2';
          }

          if (+data.exempt == 1) {
            className = 'danger2';
          }
          if (className.length > 0) {
            table.rows.item(ind).classList.add(className);
          }

          break;
        }
      }
    }

  }).catch(function (error) {
    console.log(error);
  });
}

function deletedPaymentFromRegister() {

  axios.post('/orders/delete_payment', {
    id: application.deletedPaymentFromRegister.uid
  }).then(function (response) {

    document.getElementById('tableRegisters').deleteRow(application.deletedPaymentFromRegister.rowIndex);

  }).catch(function (error) {
    console.log(error);
  });
}

document.getElementById('addPayment').addEventListener('click', function (e) {
  $('#addPaymentDialog').modal();
});

$('#addPaymentDialog').on('shown.bs.modal', function () {
  document.getElementById('paymentDate').value = moment(new Date()).format('DD.MM.YYYY');
  const paymentsOptions = document.getElementById('paymentOptions');
  while (paymentsOptions.childNodes.length) {
    paymentsOptions.removeChild(paymentsOptions.firstChild);
  }
  if (Array.isArray(application.paymentOptions)) {
    application.paymentOptions.forEach((item) => {
      var opt = document.createElement('option');
      opt.value = item.id;
      opt.innerHTML = item.description;
      paymentsOptions.appendChild(opt);
    })

  }
  document.getElementById('paymentAmount').value = '';
  document.getElementById('paymentAmount').focus();
})

document.getElementById('actionAddPayment').addEventListener('click', function (e) {
  const amount = parseFloat(document.getElementById('paymentAmount').value);
  if (isNaN(amount)) return;

  const selectedIndex = document.getElementById('paymentOptions').options.selectedIndex;
  axios.post('/orders/add_payment', {
    id: application.apartmentId,
    date: document.getElementById('paymentDate').value,
    option: document.getElementById('paymentOptions').options[selectedIndex].value,
    amount: amount
  }).then(function (response) {

    $('#addPaymentDialog').modal('hide');

    const success = response.data;
    const data = success.apartmentInfo;
    const data1 = success.paymentsHistory;

    // part 1
    // function showHistory(ev) {
    // TODO: Убрать и почистить дублирующий код!
    let tablePayments = '';
    if ((data1.payments) && (Array.isArray(data1.payments)) && (data1.payments.length > 0)) {
      data1.payments.forEach(function (element) {
        tablePayments +=
          `<tr data-apartment-uid="${element.uid}">
          <td class="text-center align-middle">${moment(element.createDate).format('DD.MM.YYYY')}</td>
          <td class="text-center align-middle">${moment(element.payDate).format('DD.MM.YYYY')}</td>
          <td class="text-center align-middle">${element.uid}</td>
          <td class="text-center align-middle">${element.payMonth}</td>
          <td class="text-center align-middle">${element.payYear}</td>
          <td class="text-right align-middle">${element.amount.toFixed(2)}</td>
          <td class="text-center align-middle">${element.organizationName}</td>
          <td class="text-center align-middle">
            <button type="button" class="btn btn-danger btn-xs" onclick="removePayment(event)">
              <span class="glyphicon glyphicon-minus" aria-hidden="true">
              </span>
            </button></td>
          </tr>`;
      });
    }
    const bodyPaymentsRef = document.getElementById('tablePayments').getElementsByTagName('tbody')[0];
    bodyPaymentsRef.innerHTML = tablePayments;

    // part 2
    let table = document.getElementById('tableApartments');
    if (table) {
      var rowLength = table.rows.length;
      for (let ind = 2; ind < rowLength; ind++) {
        if ((Number(table.rows.item(ind).getAttribute('data-apartment-uid'))) === Number(data.apartmentId)) {
          table.rows.item(ind).classList.remove('info2');
          table.rows.item(ind).classList.remove('warning2');
          table.rows.item(ind).classList.remove('success2');
          table.rows.item(ind).classList.remove('danger2');

          let className = '';
          if ((+data.paid == 1) && (+data.halfPaid == 2)) {
            className = 'info2';
          }

          if ((+data.paid == 1) && (+data.halfPaid == 1)) {
            className = 'warning2';
          }

          if ((+data.paid == 1) && (+data.halfPaid == 0)) {
            className = 'success2';
          }

          if (+data.exempt == 1) {
            className = 'danger2';
          }
          if (className.length > 0) {
            table.rows.item(ind).classList.add(className);
          }

          break;
        }
      }
    }

  }).catch(function (error) {
    console.log(error);
  });

});

document.getElementById('addPaymentInRegister').addEventListener('click', function (e) {
  $('#addPaymentInRegisterDialog').modal();
});

$('#addPaymentInRegisterDialog').on('shown.bs.modal', function () {

  let isPrivilege = false;
  const table = document.getElementById('tableApartments');

  if (table) {
    var rowLength = table.rows.length;
    for (ind = 2; ind < rowLength; ind++) {
      if ((Number(table.rows.item(ind).getAttribute('data-apartment-uid'))) === Number(application.apartmentId)) {
        isPrivilege = table.rows.item(ind).children[3].firstElementChild.checked;
        break;
      }
    }
  }

  document.getElementById('registerDate').value = moment(new Date()).format('DD.MM.YYYY');
  document.getElementById('amountInRegister').value = isPrivilege ? document.getElementById('privilegePayment').value : document.getElementById('normalPayment').value;
  document.getElementById('amountInRegister').focus();
});

document.getElementById('actionAddPaymentInRegister').addEventListener('click', function (e) {
  let amount = parseFloat(document.getElementById('amountInRegister').value);
  if (isNaN(amount)) return;

  axios.post('/orders/add_payment_in_register', {
    id: application.apartmentId,
    date: document.getElementById('registerDate').value,
    amount: amount
  }).then(function (response) {

    $('#addPaymentInRegisterDialog').modal('hide');

    const success = response.data;
    const data = success.paymentsHistory;

    // function showHistory(ev) {
    // TODO: Убрать и почистить дублирующий код!
    let tableRegisters = '';
    if ((data.fines) && (Array.isArray(data.fines)) && (data.fines.length > 0)) {
      data.fines.forEach(function (element) {
        tableRegisters += `<tr data-apartment-uid="${element.uid}">
        <td class="text-center align-middle">${moment(element.createDate).format('DD.MM.YYYY')}</td>
        <td class="text-center align-middle">${element.uid}</td>
        <td class="text-right align-middle">${element.amount.toFixed(2)}</td>
        <td class="text-center align-middle">
            <button type="button" class="btn btn-danger btn-xs" onclick="removePaymentFromRegister(event)">
              <span class="glyphicon glyphicon-minus" aria-hidden="true">
              </span>
            </button></td>
        </tr>`;
      });
    }
    var bodyFinesRef = document.getElementById('tableRegisters').getElementsByTagName('tbody')[0];
    bodyFinesRef.innerHTML = tableRegisters;

  }).catch(function (error) {
    console.log(error);
  });
});

// function startWebsocket() {
//   const socket = new WebSocket(`ws://${application.hostIP}:${application.hostPort}`);
//
//   socket.onopen = () => {
//     console.log('socket.onopen()');
//   };
//
//   socket.onmessage = (message) => {
//     let obj;
//     try {
//       obj = JSON.parse(message.data);
//     } catch (e) {
//       console.log('');
//       console.log('Ошибка при получении сообщения от сервера');
//       console.log('Тип ошибки: ' + e.name);
//       console.log('Описание ошибки: ' + e.message);
//       console.log('Cообщение: ' + message);
//       console.log('Длина сообщения: ' + message.length);
//       console.log('');
//       return;
//     }
//
//     if ('action' in obj) {
//
//       if (obj.action.localeCompare('errorOpenFile') === 0) {
//         showAlert(new Date(), {
//           out: 'Нет договора' + (obj.index === 1 ? ' на установку.' : ' на обслуживание.'),
//           style: 'alert-warning'
//         })
//       }
//
//     }
//   }
//
//   socket.onerror = (e) => {
//     //
//   }
//
//   socket.onclose = (e) => {
//     socket = null;
//     setTimeout(startWebsocket, 2000);
//   }
// }

function editClient(id) {
  application.clientChannel = ACTION_CLIENT;

  axios.post('/clients/client_info', {
    id,
  }).then((response) => {
    const { data } = response;

    const lastName = document.getElementById('lastName');
    lastName.value = data.lastName;
    lastName.dataset.id = data.id;

    document.getElementById('certificate').selectedIndex = data.certificate.typeId;
    document.getElementById('certificateSeries').value = data.certificate.series;
    document.getElementById('certificateNumber').value = data.certificate.number;
    document.getElementById('issued').value = data.certificate.issued ? moment(data.certificate.issued).format('DD.MM.YYYY') : '';
    document.getElementById('department').value = data.certificate.department;

    const registeredAddress = document.getElementById('registeredAddress');
    registeredAddress.value = data.registeredAddress.fullAddress;
    registeredAddress.dataset.cityKey = data.registeredAddress.city.key;
    registeredAddress.dataset.cityValue = data.registeredAddress.city.value;
    registeredAddress.dataset.streetKey = data.registeredAddress.street.key;
    registeredAddress.dataset.streetValue = data.registeredAddress.street.value;
    registeredAddress.dataset.houseKey = data.registeredAddress.house.key;
    registeredAddress.dataset.houseValue = data.registeredAddress.house.value;
    document.getElementById('registeredApartment').value = data.registeredAddress.apartment;

    const actualAddress = document.getElementById('actualAddress');
    actualAddress.value = data.actualAddress.fullAddress;
    actualAddress.dataset.cityKey = data.actualAddress.city.key;
    actualAddress.dataset.cityValue = data.actualAddress.city.value;
    actualAddress.dataset.streetKey = data.actualAddress.street.key;
    actualAddress.dataset.streetValue = data.actualAddress.street.value;
    actualAddress.dataset.houseKey = data.actualAddress.house.key;
    actualAddress.dataset.houseValue = data.actualAddress.house.value;
    document.getElementById('actualApartment').value = data.actualAddress.apartment;

    document.getElementById('phones').value = data.certificate.phones;

    $('#modalClient').modal('show');
  }).catch((error) => {
    console.log(error);
  });
}

document.getElementById('editClient').addEventListener('click', () => {
  const id = document.getElementById('clientName').dataset.clientId;
  editClient(id);
});

document.getElementById('editAddress').addEventListener('click', (e) => {
  $('#editFullAddressDialog').modal();
});

$('#editFullAddressDialog').on('shown.bs.modal', () => {
  const field = document.getElementById('fullAddress');
  document.getElementById('textCity').value = +field.dataset.areaId > 0 ? `${field.dataset.areaName}, ${field.dataset.cityName}` : field.dataset.cityName;
  document.getElementById('rowStreet').hidden = +field.dataset.noStreets;
  document.getElementById('textStreet').value = field.dataset.streetName;
  document.getElementById('rowHouse').hidden = +field.dataset.noHouses;
  document.getElementById('textHouse').value = field.dataset.houseNumber;
  document.getElementById('textStreet').focus();
})

$('#textStreet').typeahead({
  items: 15,
  source: (query, process) => {
    var results = [];
    map = {};

    axios.post('/orders/find_street', {
      streetName: query,
      cityId: application.address.city.id,
      limit: 15
    }).then((response) => {
      const data = response.data;
      data.forEach((item) => {
        map[item.value] = item;
        results.push(item.value);
      });
      process(results);
    }).catch((error) => {
      console.log(error);
    });
  },
  updater: (element) => {
    application.address.street.key = map[element].id;
    application.address.street.value = map[element].value;
    application.address.street.cityId = map[element].cityId;

    if (application.address.house.streetId != application.address.street.key) {
      application.address.house.key = 0;
      application.address.house.value = '';
      application.address.house.streetId = 0;

      document.getElementById('textHouse').value = '';
      document.getElementById('textHouse').focus();
    }

    return element;
  }
});

$('#textHouse').typeahead({
  items: 15,
  source: (query, process) => {
    var results = [];
    map = {};

    axios.post('/orders/find_house', {
      houseNumber: query,
      streetId: application.address.street.key,
      limit: 15
    }).then((response) => {
      const data = response.data;
      data.forEach((item) => {
        map[item.value] = item;
        results.push(item.value);
      });
      process(results);
    }).catch((error) => {
      console.log(error);
    });
  },
  updater: (element) => {
    application.address.house.key = map[element].id;
    application.address.house.value = map[element].value;
    application.address.house.cityId = map[element].streetId;

    return element;
  }
});

document.getElementById('addStreet').addEventListener('click', (e) => {
  var parentId = application.address.city.id;

  axios.post('/orders/change_address', {
    operation: 'street',
    value: document.getElementById('textStreet').value,
    parentId: parentId
  }).then((response) => {

    const data = response.data;
    if ((Array.isArray(data)) && (data.length === 1)) {
      let row = {...data[0]};

      if (application.address.house.streetId != row.uid) {
        application.address.house.key = 0;
        application.address.house.value = '';
        document.getElementById('textHouse').value = '';
      }
      application.address.street.key = row.uid;
      application.address.street.value = row.caption;

      if (row.isExists === 0) {
        showTemporaryMessage('<strong>Добавлена новая улица!</strong>', 2000);
      }

    }
    document.getElementById('textHouse').focus();

  }).catch((error) => {
    console.log(error);
  });

})

document.getElementById('addHouse').addEventListener('click', (e) => {
  var parentId = application.address.street.key;

  axios.post('/orders/change_address', {
    operation: 'house',
    value: document.getElementById('textHouse').value,
    parentId: parentId
  }).then((response) => {

    const data = response.data;
    if ((Array.isArray(data)) && (data.length === 1)) {
      let row = {...data[0]};

      application.address.house.key = row.uid;
      application.address.house.value = row.caption;

      if (row.isExists === 0) {
        showTemporaryMessage('<strong>Добавлен новый дом!</strong>', 2000);
      }
    }

  }).catch((error) => {
    console.log(error);
  });
})

document.getElementById('changeAddress').addEventListener('click', (e) => {
  const address = application.address;
  document.getElementById('fullAddress').value = `${address.city.value}, ${address.street.value}, ${address.house.value}`;
  document.getElementById('address').value = JSON.stringify(address);
  $('#editFullAddressDialog').modal('hide');
});

function showTemporaryMessage(htmlText, ms) {
  var msg = document.getElementById('temporaryMessage');
  msg.innerHTML = htmlText;
  msg.hidden = false;
  setTimeout(() => msg.hidden = true, ms);
}

document.getElementById('clearRegisteredAddress').addEventListener('click', (e) => {
  let registeredAddress = document.getElementById('registeredAddress');
  registeredAddress.value = '';
  registeredAddress.dataset.cityKey = 0;
  registeredAddress.dataset.cityValue = '';
  registeredAddress.dataset.streetKey = 0
  registeredAddress.dataset.streetValue = '';
  registeredAddress.dataset.houseKey = 0;
  registeredAddress.dataset.houseValue = '';
  registeredAddress.focus();
});

document.getElementById('clearActualAddress').addEventListener('click', (e) => {
  let actualAddress = document.getElementById('actualAddress');
  actualAddress.value = '';
  actualAddress.dataset.cityKey = 0;
  actualAddress.dataset.cityValue = '';
  actualAddress.dataset.streetKey = 0
  actualAddress.dataset.streetValue = '';
  actualAddress.dataset.houseKey = 0;
  actualAddress.dataset.houseValue = '';
  actualAddress.focus();
});

$('#registeredAddress').typeahead({
  items: 15,
  source: (query, process) => {
    var results = [];
    map = {};

    axios.post('/orders/find_full_address', {
        suggestion: query,
        rowsCount: 15,
        core: 1
      })
      .then((response) => {
        var datas = response.data;
        if ((typeof datas == 'object') && ('items' in datas) && ('level' in datas)) {
          const level = datas.level;
          const data = datas.items;
          var text;
          if (Array.isArray(data)) {
            data.forEach((item, index) => {
              item.level = level;
              switch (level) {
                case 0:
                  text = item.cityName;
                  map[text] = item;
                  results.push(text);
                  break;
                case 1:
                  text = `${item.cityName}, ${item.streetName}`;
                  if (item.streetName.trim() !== '') {
                    map[text] = item;
                    results.push(text);
                  }
                  break;
                case 2:
                  text = `${item.cityName}, ${item.streetName}, ${item.houseNumber}`;
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
  updater: (element) => {
    const selectedElement = map[element];

    switch (selectedElement.level) {
      case 0:
        saveClientAddress(selectedElement, 0);
        return `${selectedElement.cityName}, `;
      case 1:
        saveClientAddress(selectedElement, 0);
        return `${selectedElement.cityName}, ${selectedElement.streetName}, `;
      case 2:
        saveClientAddress(selectedElement, 0);
        return `${selectedElement.cityName}, ${selectedElement.streetName}, ${selectedElement.houseNumber}`;
      default:
        saveClientAddress(selectedElement, 0);
        return selectedElement.cityName;
    }
  }
});

$('#actualAddress').typeahead({
  items: 15,
  source: (query, process) => {
    var results = [];
    map = {};

    axios.post('/orders/find_full_address', {
        suggestion: query,
        rowsCount: 15,
        core: 1
      })
      .then((response) => {
        var datas = response.data;
        if ((typeof datas == 'object') && ('items' in datas) && ('level' in datas)) {
          const level = datas.level;
          const data = datas.items;
          var text;
          if (Array.isArray(data)) {
            data.forEach((item, index) => {
              item.level = level;
              switch (level) {
                case 0:
                  text = item.cityName;
                  map[text] = item;
                  results.push(text);
                  break;
                case 1:
                  text = `${item.cityName}, ${item.streetName}`;
                  if (item.streetName.trim() !== '') {
                    map[text] = item;
                    results.push(text);
                  }
                  break;
                case 2:
                  text = `${item.cityName}, ${item.streetName}, ${item.houseNumber}`;
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
  updater: (element) => {
    const selectedElement = map[element];

    switch (selectedElement.level) {
      case 0:
        saveClientAddress(selectedElement, 1);
        return `${selectedElement.cityName}, `;
      case 1:
        saveClientAddress(selectedElement, 1);
        return `${selectedElement.cityName}, ${selectedElement.streetName}, `;
      case 2:
        saveClientAddress(selectedElement, 1);
        return `${selectedElement.cityName}, ${selectedElement.streetName}, ${selectedElement.houseNumber}`;
      default:
        saveClientAddress(selectedElement, 1);
        return selectedElement.cityName;
    }
  }
});

function saveClientAddress(data, index) {
  let address = index === 0 ? document.getElementById('registeredAddress') : document.getElementById('actualAddress');
  switch (data.level) {
    case 0:
      address.dataset.cityKey = data.cityId;
      address.dataset.cityValue = data.cityName;
      address.dataset.streetKey = 0
      address.dataset.streetValue = '';
      address.dataset.houseKey = 0;
      address.dataset.houseValue = '';
      break;
    case 1:
      address.dataset.cityKey = data.cityId;
      address.dataset.cityValue = data.cityName;
      address.dataset.streetKey = data.streetId
      address.dataset.streetValue = data.streetName;
      address.dataset.houseKey = 0;
      address.dataset.houseValue = '';
      break;
    case 2:
      address.dataset.cityKey = data.cityId;
      address.dataset.cityValue = data.cityName;
      address.dataset.streetKey = data.streetId;
      address.dataset.streetValue = data.streetName;
      address.dataset.houseKey = data.houseId;
      address.dataset.houseValue = data.houseNumber;
      break;
    default:
  }
}

document.getElementById('saveClient').addEventListener('click', () => {
  const msg = document.getElementById('alertForClient');
  if (document.getElementById('lastName').value.trim().length === 0) {
    msg.innerHTML = '<strong>Не заполнено ФИО клиента</strong>';
    msg.hidden = false;
    // eslint-disable-next-line no-return-assign
    setTimeout(() => msg.hidden = true, 2000);
  }

  const registeredAddress = document.getElementById('registeredAddress');
  const actualAddress = document.getElementById('actualAddress');

  axios.post('/orders/save_client', {
    id: document.getElementById('lastName').dataset.id,
    lastName: document.getElementById('lastName').value,
    certificateId: document.getElementById('certificate').selectedIndex,
    certificateSeries: document.getElementById('certificateSeries').value,
    certificateNumber: document.getElementById('certificateNumber').value,
    issued: document.getElementById('issued').value,
    department: document.getElementById('department').value,
    phones: document.getElementById('phones').value,
    registeredAddress: {
      cityId: registeredAddress.dataset.cityKey,
      streetId: registeredAddress.dataset.streetKey,
      houseId: registeredAddress.dataset.houseKey,
      apartment: document.getElementById('registeredApartment').value,
    },
    actualAddress: {
      cityId: actualAddress.dataset.cityKey,
      streetId: actualAddress.dataset.streetKey,
      houseId: actualAddress.dataset.houseKey,
      apartment: document.getElementById('actualApartment').value,
    },
  }).then((response) => {
    var datas = response.data;
    var client = JSON.parse(document.getElementById('client').value);

    if (application.clientChannel === ACTION_CLIENT_CONTRACT) {
      try {
        // client.contract.key = document.getElementById('lastName').dataset.id;
        client.contract.key = datas.id;
        client.contract.value = document.getElementById('lastName').value;
        client.contract.phones = document.getElementById('phones').value;

        document.getElementById('clientContractName').value = client.contract.value;
        document.getElementById('clientContractPhones').value = client.contract.phones;

        document.getElementById('client').value = JSON.stringify(client);
      } catch (error) {
        console.log('clearClientContract Error: ' + error.message);
      }
    }

    if (application.clientChannel === ACTION_CLIENT_SERVICE) {
      try {
        // client.service.key = document.getElementById('lastName').dataset.id;
        client.service.key = datas.id;
        client.service.value = document.getElementById('lastName').value;
        client.service.phones = document.getElementById('phones').value;
        document.getElementById('client').value = JSON.stringify(client);

        document.getElementById('clientServiceName').value = client.service.value;
        document.getElementById('clientServicePhones').value = client.service.phones;
      } catch (error) {
        console.log(`clearClientContract Error: ${error.message}`);
      }
    }
    $('#modalClient').modal('hide');
  }).catch((error) => {
    console.log(error);
  });
});

// const buttons = document.querySelectorAll('button.action');
// buttons.forEach((btn) => {
//   btn.addEventListener('click', (e) => {
//     e.preventDefault();
//     const paper = e.target.form;

//     const data = {
//       action: e.target.name,
//       id: paper.getAttribute('data-document-id'),
//       contractNumber: paper.contractNumber.value,
//       created: paper.created.value,
//       address: {
//         area: {
//           id: paper.fullAddress.getAttribute('data-area-id'),
//           name: paper.fullAddress.getAttribute('data-area-name'),
//         },
//         city: {
//           id: paper.fullAddress.getAttribute('data-city-id'),
//           name: paper.fullAddress.getAttribute('data-city-name'),
//         },
//         street: {
//           id: paper.fullAddress.getAttribute('data-street-id'),
//           name: paper.fullAddress.getAttribute('data-street-name'),
//         },
//         house: {
//           id: paper.fullAddress.getAttribute('data-house-id'),
//           number: paper.fullAddress.getAttribute('data-house-number'),
//         },
//         noStreets: paper.fullAddress.getAttribute('data-no-streets'),
//         noHouses: paper.fullAddress.getAttribute('data-no-houses'),
//         full: paper.fullAddress.value,
//       },
//       client: {
//         id: paper.clientName.getAttribute('data-client-id'),
//         name: paper.clientName.value,
//       },
//       startService: paper.startService.value,
//       endService: paper.endService.value,
//       maintenanceContract: paper.maintenanceContract.value,
//       apartmentFrom: paper.apartmentFrom.value,
//       apartmentTo: paper.apartmentTo.value,
//       payment: paper.payment.value,
//       receiptPrinting: paper.receiptPrinting.value,
//       info: paper.info.value,
//       apartments: {
//         stat: {
//           paid: 0,
//           exempt: 0,
//           locked: 0,
//         },
//         grid: [],
//         isRebuilt: 0,
//       },
//     };

//     const table = document.getElementById('tableApartments');
//     data.apartments.isRebuilt = table.dataset.isRebuilt;

//     const rowCount = table.rows.length;
//     if (rowCount > 2) {
//       for (let ind = 2; ind < rowCount; ind += 1) {
//         if (table.rows.item(ind).children[2].firstElementChild.checked) {
//           data.apartments.stat.paid += 1;
//         }
//         if (table.rows.item(ind).children[3].firstElementChild.checked) {
//           data.apartments.stat.exempt += 1;
//         }
//         if (table.rows.item(ind).children[4].firstElementChild.checked) {
//           data.apartments.stat.locked += 1;
//         }

//         data.apartments.grid.push({
//           uid: +table.rows.item(ind).getAttribute('data-apartment-uid'),
//           number: +table.rows.item(ind).getAttribute('data-apartment-number'),
//           letter: +table.rows.item(ind).getAttribute('data-apartment-letter'),
//           halfPaid: +table.rows.item(ind).getAttribute('data-apartment-half-paid'),
//           paid: table.rows.item(ind).children[2].firstElementChild.checked ? 1 : 0,
//           exempt: table.rows.item(ind).children[3].firstElementChild.checked ? 1 : 0,
//           locked: table.rows.item(ind).children[4].firstElementChild.checked ? 1 : 0,
//         });
//       }
//     }

//     const headers = {
//       'Content-Type': 'application/json',
//     };

//     axios.post('/gates/save_and_close', data, headers)
//       .then(() => {
//         document.location.href = '/gates';
//       })
//       .catch((error) => {
//         if (error.response) {
//           // eslint-disable-next-line no-console
//           console.log('Server error');
//         } else if (error.request) {
//           // eslint-disable-next-line no-console
//           console.log('No response');
//         } else {
//           // eslint-disable-next-line no-console
//           console.log('Other error');
//         }
//       });
//   });
// });

// document.getElementById('save_and_close').addEventListener('click', (e) => {
//   e.preventDefault();

//   const paper = e.target.form;

//   const data = {
//     id: paper.getAttribute('data-document-id'),
//     contractNumber: paper.contractNumber.value,
//     created: paper.created.value,
//     address: {
//       area: {
//         id: paper.fullAddress.getAttribute('data-area-id'),
//         name: paper.fullAddress.getAttribute('data-area-name'),
//       },
//       city: {
//         id: paper.fullAddress.getAttribute('data-city-id'),
//         name: paper.fullAddress.getAttribute('data-city-name'),
//       },
//       street: {
//         id: paper.fullAddress.getAttribute('data-street-id'),
//         name: paper.fullAddress.getAttribute('data-street-name'),
//       },
//       house: {
//         id: paper.fullAddress.getAttribute('data-house-id'),
//         number: paper.fullAddress.getAttribute('data-house-number'),
//       },
//       noStreets: paper.fullAddress.getAttribute('data-no-streets'),
//       noHouses: paper.fullAddress.getAttribute('data-no-houses'),
//       full: paper.fullAddress.value,
//     },
//     client: {
//       id: paper.clientName.getAttribute('data-client-id'),
//       name: paper.clientName.value,
//     },
//     startService: paper.startService.value,
//     endService: paper.endService.value,
//     maintenanceContract: paper.maintenanceContract.value,
//     apartmentFrom: paper.apartmentFrom.value,
//     apartmentTo: paper.apartmentTo.value,
//     payment: paper.payment.value,
//     receiptPrinting: paper.receiptPrinting.value,
//     info: paper.info.value,
//     apartments: {
//       stat: {
//         paid: 0,
//         exempt: 0,
//         locked: 0,
//       },
//       grid: [],
//       isRebuilt: 0,
//     },
//   };

//   const table = document.getElementById('tableApartments');
//   data.apartments.isRebuilt = table.dataset.isRebuilt;

//   const rowCount = table.rows.length;
//   if (rowCount > 2) {
//     for (let ind = 2; ind < rowCount; ind += 1) {
//       if (table.rows.item(ind).children[2].firstElementChild.checked) {
//         data.apartments.stat.paid += 1;
//       }
//       if (table.rows.item(ind).children[3].firstElementChild.checked) {
//         data.apartments.stat.exempt += 1;
//       }
//       if (table.rows.item(ind).children[4].firstElementChild.checked) {
//         data.apartments.stat.locked += 1;
//       }

//       data.apartments.grid.push({
//         uid: +table.rows.item(ind).getAttribute('data-apartment-uid'),
//         number: +table.rows.item(ind).getAttribute('data-apartment-number'),
//         letter: +table.rows.item(ind).getAttribute('data-apartment-letter'),
//         halfPaid: +table.rows.item(ind).getAttribute('data-apartment-half-paid'),
//         paid: table.rows.item(ind).children[2].firstElementChild.checked ? 1 : 0,
//         exempt: table.rows.item(ind).children[3].firstElementChild.checked ? 1 : 0,
//         locked: table.rows.item(ind).children[4].firstElementChild.checked ? 1 : 0,
//       });
//     }
//   }

//   const headers = {
//     'Content-Type': 'application/json',
//   };

//   axios.post('/gates/save_and_close', data, headers)
//     .then(() => {
//       document.location.href = '/gates';
//     })
//     .catch((error) => {
//       if (error.response) {
//         // eslint-disable-next-line no-console
//         console.log('Server error');
//       } else if (error.request) {
//         // eslint-disable-next-line no-console
//         console.log('No response');
//       } else {
//         // eslint-disable-next-line no-console
//         console.log('Other error');
//       }
//     });
// });
