function confirmDelete(id) {
  document.getElementById('deletedUID').value = id;
  $('#modalDeleteRecord').modal({ 'keyboard': true });
}

let deleteRecord = function() {
  $('#modalDeleteRecord').modal('hide');

  axios.post('/services/delete', {
    id: document.getElementById('deletedUID').value
  }
  ).then(function (response) {
    var path = window.location.origin + '/services';
    window.location.href = path;
  }).catch(function (error) {
    alert(error);
  });

};

let onClickClear = function (el) {
  if (el.currentTarget.id === 'clearFullName') {
    document.getElementById('findFullName').value = '';
  }

  if (el.currentTarget.id === 'clearShortName') {
    document.getElementById('findShortName').value = '';
  }

  try {
    let filters = JSON.parse(document.getElementById('filters').value);
    filters.fullName = document.getElementById('findFullName').value;
    filters.shortName = document.getElementById('findShortName').value;
    document.getElementById('filters').value = JSON.stringify(filters);
  } catch (error) {
    console.log('onClickClearError: ' + error.message);
  }

}

let onKeyUp = function (el) {
  try {
    let filters = JSON.parse(document.getElementById('filters').value);
    filters.fullName = document.getElementById('findFullName').value;
    filters.shortName = document.getElementById('findShortName').value;
    document.getElementById('filters').value = JSON.stringify(filters);
  } catch (error) {
    console.log('onClickClearError: ' + error.message);
  }
}

document.getElementById('deleteRecord').onclick = deleteRecord;
document.getElementById('clearFullName').onclick = onClickClear;
document.getElementById('clearShortName').onclick = onClickClear;

document.getElementById('findFullName').onkeyup = onKeyUp;
document.getElementById('findShortName').onkeyup = onKeyUp;
