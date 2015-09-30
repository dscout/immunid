/* @flow weak */

var Promise = require('es6-promise').Promise;

var NullAdapter = function() {};

NullAdapter.prototype = {
  create:  function(model) { return resolve(model); },
  destroy: function(model) { return resolve(model); },
  read:    function(model) { return resolve(model); },
  update:  function(model) { return resolve(model); }
};

function resolve(model) {
  return Promise.resolve(model);
}

module.exports = NullAdapter;
