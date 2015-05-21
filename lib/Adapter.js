/* @flow weak */

var merge   = require('./utils/merge');
var Request = require('proquest').Request;

var Adapter = function(options) {
  options = options || {};

  this.headers = options.headers || {};
  this.host    = options.host    || '';
};

merge(Adapter.prototype, {
  create: function(model) {
    return this._sync('POST', model);
  },

  destroy: function(model) {
    return this._sync('DELETE', model);
  },

  read: function(model) {
    return this._sync('GET', model);
  },

  update: function(model) {
    return this._sync('PUT', model);
  },

  _buildRequest: function(method, path) {
    var url     = this.host + path;
    var request = new Request(method, url);

    for (var key in this.headers) {
      request.set(key, this.headers[key]);
    }

    return request;
  },

  _sync: function(method, model) {
    var path    = model.path();
    var request = this._buildRequest(method, path);

    if (method === 'POST' || method === 'PUT') {
      request.send(model.toJSON());
    }

    return request.end();
  }
});

module.exports = Adapter;
