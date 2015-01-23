/* @flow weak */

module.exports = function(object) {
  object.mixins.forEach(function(mixin) {
    for (var prop in mixin) {
      object[prop] = mixin[prop];
    }
  }, object);
};
