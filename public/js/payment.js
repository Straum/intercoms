function parseBarcode(value) {
  axios.post('/payments/parse_barcode', {
    barcode: value
  }
  ).then(function (response) {
    var data = response.data;
    document.getElementById('cardId').value = data.id;
    document.getElementById('contract').value = data.contractNumber;
    document.getElementById('extendedContract').value = data.prolongedContractNumber;
    document.getElementById('duplicate').value = data.isDuplicate;
    document.getElementById('receiptPrint').value = data.receiptPrint;
    document.getElementById('startService').value = data.startService ? moment(data.startService).format('DD.MM.YYYY') : '';
    document.getElementById('endService').value = data.endService ? moment(data.endService).format('DD.MM.YYYY') : '';
    document.getElementById('fullAddress').value = data.cityName + ', ' + data.streetName + ', ' + data.houseNumber;
    document.getElementById('apartment').value = data.apartment;
    document.getElementById('letter').value = data.letter;
    document.getElementById('amount').value = data.amount.toFixed(2);
    document.getElementById('dateOfPayment').value = moment(new Date()).format('DD.MM.YYYY');
  }).catch(function (error) {
    console.log('Error parseBarCode: ' + error.message);
  });
}

var listenerBarcode = function (e) {
  if (e.currentTarget.textLength === 32) {
    parseBarcode(e.currentTarget.value);
  }
}

var listenerBarcodeKeyDown = function (e) {
  if (e.keyCode === 13) {
    e.preventDefault();
  }
}

$('.date-picker').datetimepicker({
  locale: 'ru',
  format: 'L'
});

$.ajax({
  type: 'GET',
  url: '/payments/table',
  dataType: 'json',
  async: true,
  data: {
    'id': $('#apartment_id').val()
  },
  success: function (data) {
    var dataTable = [];
    if ((data.table) && (data.table instanceof Array)) {
      dataTable = data.table;
      var paymentsTable = document.getElementById('paymentsTable');
      // Очистить строки у таблицы заранее
      var innerString = paymentsTable.innerHTML;
      var s = '';
      for (var ind = 0, max = dataTable.length; ind < max; ind++) {
        s += '<tr' + (ind % 2 ? ' class="warning">' : '>') +
          '<td class="text-center">' + dataTable[ind].create_date + '</td>' +
          '<td class="text-center">' + dataTable[ind].pay_date + '</td>' +
          '<td class="text-center">' + dataTable[ind].m_contract_number + '</td>' +
          '<td class="text-center">' + dataTable[ind].pay_month + '</td>' +
          '<td class="text-center">' + dataTable[ind].pay_year + '</td>' +
          '<td class="text-center">' + dataTable[ind].amount.toFixed(2) + '</td>' +
          '<td class="text-center">' + dataTable[ind].org_name + '</td>' +
          '</tr>'
      }
      paymentsTable.innerHTML = innerString + s;
    }
  },
  error: function (data) {
    alert(data);
  }
});

document.getElementById('paymentType').addEventListener('change', function (e) {

  if (Number(e.currentTarget.value) === 2) {
    document.getElementById('barcode').value = '';
  }
  document.getElementById('barcode').readOnly = (Number(e.currentTarget.value) === 2);

});

$('#extendedContract').typeahead({
  items: 15,
  source: function (query, process) {
    var results = [];
    map = {};

    axios.post('/payments/find_prolonged_order', {
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
    document.getElementById('cardId').value = map[element].id;
    document.getElementById('contract').value = map[element].contractNumber;
    document.getElementById('duplicate').value = map[element].isDuplicate;
    document.getElementById('receiptPrint').value = map[element].receiptPrint;
    document.getElementById('startService').value = map[element].startService ? moment(map[element].startService).format('DD.MM.YYYY') : '';
    document.getElementById('endService').value = map[element].endService ? moment(map[element].endService).format('DD.MM.YYYY') : '';
    document.getElementById('fullAddress').value = map[element].cityName + ', ' + map[element].streetName + ', ' + map[element].houseNumber;

    return element;
  }
});

window.onload = function () {
  document.getElementById('barcode').addEventListener('input', listenerBarcode);
  document.getElementById('barcode').addEventListener('keydown', listenerBarcodeKeyDown);
}

window.onunload = function () {
  document.getElementById('barcode').removeEventListener('input', listenerBarcode);
  document.getElementById('barcode').removeEventListener('keydown', listenerBarcodeKeyDown);
}
