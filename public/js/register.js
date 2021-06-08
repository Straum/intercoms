// Basic foundation
// http://carlofontanos.com/nodejs-ajax-pagination-with-mongodb-search-sort-filter/

// var app = {
//   Register: function () {
//     this.init = function () {
//       this.getAllPagination();
//     };

//     this.getAllPagination = function () {
//       _this = this;

//       if ($('#settings').val()) {
//         data = JSON.parse($('form.post-list input').val());
//         _this.ajaxGetAllItemsPagination(data.page, data.search);
//       } else {
//         _this.ajaxGetAllItemsPagination(1, $('find_contract_number').val());
//       }

//       $("#find_contract_number").keyup(function (e) {
//         if (e.keyCode == 13) {
//           _this.ajaxGetAllItemsPagination(1, $('#find_contract_number').val());
//         }
//       });

//       $('body').on('click', '#erase_contract', function () {
//         $('#find_contract_number').val('');
//         $('#find_contract_number').focus();
//       });

//       $('body').on('click', '#search', function () {
//         _this.ajaxGetAllItemsPagination(1, $('#find_contract_number').val());
//       });

//       $('body').on('click', '.pagination .page-link', function () {
//         var page = $(this).text();
//         switch ((typeof page == 'string') && (page.charCodeAt())) {
//           case 171:
//             page = 1;
//             break;
//           case 187:
//             page = +($('#pages_count').val());
//             break;
//         }
//         _this.ajaxGetAllItemsPagination(page, $('#find_contract_number').val());
//       });

//       _this.ajaxGetAllItemsPagination(1, $('#find_contract_number').val());
//     }

//     this.ajaxGetAllItemsPagination = function (page) {

//       // $('#pagination').html('<div class="col align-self-center loader"></div>');

//       var post_data = {
//         'id': $('#id').val(),
//         'page': page,
//         'search': $('#find_contract_number').val(),
//         'prolonged': $('#prolonged:checkbox:checked').val() === 'on'
//       };

//       $('#settings').val(JSON.stringify(post_data));

//       var data = {
//         action: 'get-register',
//         data: JSON.parse($('#settings').val())
//       };

//       $.ajax({
//         url: '/registers/edit',
//         type: 'POST',
//         contentType: 'application/json',
//         data: JSON.stringify(data),
//         success: function (response) {
//           // alert('success!');
//           $('#tbody').html(response.bodyTable);
//           $('#pagination').html(response.pageContent);
//           $("#pages_count").val(response.pagesCount);
//         },
//         error: function (description) {
//           console.log('error!');
//         }
//       })
//     }
//   }
// }

// var register = new app.Register();
// register.init();

// $('#tableContracts').floatThead();

$('[data-toggle="tooltip"]').tooltip();

$('.dtp-date').datetimepicker({
  format: 'L',
  locale: 'ru'
});

$('.dtp-date-time').datetimepicker({
  locale: 'ru'
});

function buildRegister() {

}

function unloadRegister() {

}

function findContract(range) {
  var filter = (range === 0 ? document.getElementById('findContract').value.trim().toLowerCase() : document.getElementById('findProlongedContract').value.trim().toLowerCase());
  var rows = document.getElementById('tableContracts').getElementsByTagName('tr');

  if ((rows instanceof HTMLCollection) && (rows.length > 0)) {
    for (ind = 0; ind < rows.length; ind++) {
      var td = (range === 0 ? rows[ind].getElementsByTagName("td")[1] : rows[ind].getElementsByTagName("td")[2]);
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

var listenerFindContract = function (e) {
  document.getElementById('findProlongedContract').value = '';
  findContract(0);
}

var listenerFindProlongedContract = function (e) {
  document.getElementById('findContract').value = '';
  findContract(1);
}

var listenerClearContract = function (e) {
  document.getElementById('findContract').value = '';
  document.getElementById('findContract').focus();
  findContract(0);
}

var listenerClearProlonedContract = function (e) {
  document.getElementById('findProlongedContract').value = '';
  document.getElementById('findProlongedContract').focus();
  findContract(1);
}

// var listenerDropdownMenu = function (e) {
//   var actionName = e.target.parentElement.id;
//   // alert(actionName);
//   axios.post('/registers/action', {
//     name: actionName
//   }
//   ).then(function (response) {
//     var data = response.data;
//     alert(data.action)
//     switch (data.action) {
//       case 'buidRegister':
//         buildRegister()
//         break;

//       case 'unloadRegister':
//         buildRegister()
//         break;

//       default:
//         break;
//     }


//     // data.forEach(function (item) {
//     //   map[item.value] = item;
//     //   results.push(item.value);
//     // });
//     // process(results);
//   }).catch(function (error) {
//     console.log(error);
//   });
// }

var listenerBuildRegister = function (e) {
  document.getElementById('progress').hidden = false;
  axios.post('/registers/build_register', {
      name: 'buildRegister',
      startFrom: document.getElementById('startFrom').value,
      endTo: document.getElementById('endTo').value
    }).then(function (response) {
      var data = response.data;

      var bodyContractsRef = document.getElementById('tableContracts').getElementsByTagName('tbody')[0];
      bodyContractsRef.innerHTML = data.contentContractsTable.join('');

      var bodyPaymentsRef = document.getElementById('tablePayments').getElementsByTagName('tbody')[0];
      bodyPaymentsRef.innerHTML = data.contentPaymentsTable.join('');

      // var badges = document.getElementsByClassName('badge badge-info');
      // if ((badges) && (badges instanceof HTMLCollection)) {
      //   badges[0].textContent = data.contentTable.length;
      // }
      document.getElementById('orders_count').textContent = data.contentContractsTable.length;
      document.getElementById('payments_count').textContent = data.contentPaymentsTable.length; //data.contentTable.length;

      document.getElementById('orders').value = JSON.stringify(data.orders);
      document.getElementById('payments').value = JSON.stringify(data.payments);
      document.getElementById('progress').hidden = true;
    })
    .catch(function (error) {
      document.getElementById('progress').hidden = true;
    });
}

var listenerSaveRegister = function (e) {
  document.getElementById('progress').hidden = false;
}

const listenerNewMethod = (e) => {
  if (e.target.checked) {

    const dt = new Date();
    switch (dt.getDay()) {
      case 5:
        document.getElementById('endTo').value = moment(dt).add(2, 'days').format('DD.MM.YYYY');
        break;
      case 6:
        document.getElementById('endTo').value = moment(dt).add(1, 'days').format('DD.MM.YYYY');
        break;
      default:
        document.getElementById('endTo').value = moment(dt).format('DD.MM.YYYY');
    }
    document.getElementById('startFrom').value = moment(dt).format('DD.MM.YYYY');
  } else {
    document.getElementById('startFrom').value = moment().startOf('month').format('DD.MM.YYYY');
    document.getElementById('endTo').value = moment().endOf('month').format('DD.MM.YYYY');
  }
}

window.onload = function () {
  document.getElementById('findContract').addEventListener('keyup', listenerFindContract);
  document.getElementById('clearContract').addEventListener('click', listenerClearContract);

  document.getElementById('findProlongedContract').addEventListener('keyup', listenerFindProlongedContract);
  document.getElementById('clearProlongedContract').addEventListener('click', listenerClearProlonedContract);

  document.getElementById('buidRegister').addEventListener('click', listenerBuildRegister);
  document.getElementById('save').addEventListener('click', listenerSaveRegister);
  document.getElementById('saveAndClose').addEventListener('click', listenerSaveRegister);

  document.getElementById('newMethod').addEventListener('click', listenerNewMethod);
}

window.onunload = function () {
  document.getElementById('findProlongedContract').removeEventListener('keyup', listenerFindProlongedContract);
  document.getElementById('clearContract').removeEventListener('click', listenerClearContract);

  document.getElementById('findProlongedContract').removeEventListener('keyup', listenerFindProlongedContract);
  document.getElementById('clearProlongedContract').removeEventListener('click', listenerClearProlonedContract);

  document.getElementById('buidRegister').removeEventListener('click', listenerBuildRegister);
  document.getElementById('save').removeEventListener('click', listenerSaveRegister);
  document.getElementById('saveAndClose').removeEventListener('click', listenerSaveRegister);

  document.getElementById('newMethod').removeEventListener('click', listenerNewMethod);
}