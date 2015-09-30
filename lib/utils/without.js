module.exports = function without(object, prop) {
  var keys = Object.keys(object);

  return keys.reduce(function(memo, key) {
    if (prop !== key) {
      memo[key] = object[key];
    }

    return memo;
  }, {});
};
