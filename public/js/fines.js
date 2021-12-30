$('[data-toggle="tooltip"]').tooltip();

async function listenerDeleteRecord() {
  $('#modalDeleteRecord').modal('hide');
  await fetch('fines/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      { id: document.getElementById('deletedUID').value },
    ),
  });

  const path = `${window.location.origin}/fines`;
  window.location.href = path;
}

document.getElementById('deleteRecord').addEventListener('click', listenerDeleteRecord);

function confirmDelete(id) {
  $('#deletedUID').val(id);
  $('#modalDeleteRecord').modal({ keyboard: true });
}
