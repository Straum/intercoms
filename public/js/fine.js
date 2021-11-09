function beforeSave() {
  const fullAddress = document.getElementById('fullAddress');
  const { dataset: { cityId } } = fullAddress;
  const { dataset: { streetId } } = fullAddress;
  const { dataset: { houseId } } = fullAddress;
  const { dataset: { apartmentId } } = fullAddress;

  document.getElementById('box').value = JSON.stringify({
    cityId, streetId, houseId, apartmentId,
  });
}
