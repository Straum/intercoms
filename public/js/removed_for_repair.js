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