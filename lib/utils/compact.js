module.exports = function(array) {
  return array.filter(function(element) {
    return !!element;
  });
}
