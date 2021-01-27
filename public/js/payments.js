$('[data-toggle="tooltip"]').tooltip();

$('#deleteRecord').click(function () {
  $('#modalDeleteRecord').modal('hide');
  $.ajax({
    type: 'POST',
    url: '/payments/delete',
    dataType: 'json',
    async: true,
    data: {
      'id': $('#deletedUID').val()
    },
    success: function (data) {
      var path = window.location.origin + '/payments';
      window.location.href = path;
      return;
    },
    error: function (data) {
      alert(data);
    }
  });

});

// document.getElementById('outerPayments').addEventListener('click', function (e) {
//   alert('outerPayments');
//   // axios.post(
//   //   '/payments/load'
//   // ).then(function (response) {
//   //   var data = response.data;
//   //   console.log(data);
//   // }).catch(function (error) {
//   //   console.log(error);
//   // });
// });

function confirmDelete(id) {
  $('#deletedUID').val(id);
  $('#modalDeleteRecord').modal({ 'keyboard': true });
}

var listenerOuterPayments = function (e) {
  document.getElementById('progress').hidden = false;
}

window.onload = function () {
  document.getElementById('outerPayments').addEventListener('click', listenerOuterPayments);
}

window.onunload = function () {
  document.getElementById('outerPayments').removeEventListener('click', listenerOuterPayments);
}

outerPayments