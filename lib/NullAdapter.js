/* @flow weak */

var merge = require('./utils/merge');
var Prom  = require('es6-promise').Promise;

var NullAdapter = function() {
};

merge(NullAdapter.prototype, {
  create:  function(model) { return this._resolve(model); },
  destroy: function(model) { return this._resolve(model); },
  read:    function(model) { return this._resolve(model); },
  update:  function(model) { return this._resolve(model); },

  _resolve: function(model) {
    return new Prom(function(resolve, reject) {
      resolve(model);
    });
  }
});

module.exports = NullAdapter;
