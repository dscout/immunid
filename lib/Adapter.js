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
    return sync(this, 'POST', model);
  },

  destroy: function(model) {
    return sync(this, 'DELETE', model);
  },

  read: function(model) {
    return sync(this, 'GET', model);
  },

  update: function(model) {
    return sync(this, 'PUT', model);
  }
});

function buildRequest(adapter, method, path) {
  var url     = adapter.host + path,
      request = new Request(method, url),
      headers = adapter.headers;

  Object.keys(headers).forEach(function(key) {
    request.set(key, headers[key]);
  });

  return request;
}

function sync(adapter, method, model) {
  var request = buildRequest(adapter, method, model.path());

  if (method === 'POST' || method === 'PUT') {
    request.send(model.toJSON());
  }

  return request.end();
}

module.exports = Adapter;
