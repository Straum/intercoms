$('[data-toggle="tooltip"]').tooltip();

$('.date').datetimepicker({
  locale: 'ru',
  format: 'L'
});

$('#deleteRecord').click(function () {
  $('#modalDeleteRecord').modal('hide');
  $.ajax({
    type: 'POST',
    url: '/removed_for_repair/delete',
    dataType: 'json',
    async: true,
    data: {
      'id': $('#deletedUID').val()
    },
    success: function (data) {
      var path = window.location.origin + '/removed_for_repair';
      window.location.href = path;
      return;
    },
    error: function (data) {
      alert(data);
    }
  });

});

function confirmDelete(id) {
  $('#deletedUID').val(id);
  $('#modalDeleteRecord').modal({ 'keyboard': true });
}

// document.querySelector('[data-apply-filter]').addEventListener('click', (e) => {
//   e.preventDefault();

//   // axios.get('/removed_for_repair/filter', {
//   axios.post('/removed_for_repair/filter', {
//     period: {
//       start: document.querySelector('input[name="startDate"]').value,
//       end: document.querySelector('input[name="endDate"]').value,
//     },
//     status: document.querySelector('[data-status]').getAttribute('data-status'),
//   // });

//   }).then(function (response) {
//     console.log(response);
//   }).catch(function (error) {
//     console.log(error);
//   });
// });