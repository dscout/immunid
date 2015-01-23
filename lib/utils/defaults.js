/* @flow weak */

module.exports = function(object) {
  [].slice.call(arguments, 1).forEach(function(source) {
    for (var prop in source) {
      if (object[prop] === undefined) object[prop] = source[prop];
    }
  });

  return object;
};
