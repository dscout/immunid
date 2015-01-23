var inflector    = require('./utils/inflector');
var merge        = require('./utils/merge');
var EventEmitter = require('events').EventEmitter;
var Model        = require('./Model');
var Prom         = require('es6-promise').Promise;
var NullAdapter  = require('./NullAdapter');

var Store = function(adapter, mapping) {
  this.adapter = adapter || new NullAdapter();
  this.mapping = mapping || {};
  this.buckets = {};
};

merge(Store, {
  ADD_EVENT:    'ADD',
  CHANGE_EVENT: 'CHANGE',
  DELETE_EVENT: 'DELETE',
  RELOAD_EVENT: 'RELOAD'
});

merge(Store.prototype, EventEmitter.prototype, {
  add: function(namespace, object) {
    var bucket = this._bucket(namespace);
    var model  = this._vivify(namespace, object);

    bucket[object.id] = model
    this.emit(Store.ADD_EVENT, model);

    return this;
  },

  find: function(namespace, id, options) {
    var bucket = this._bucket(namespace);
    var model  = bucket[id];

    if (!model) {
      model = this._vivify(namespace, { id: id });

      return this.adapter.read(model).then(function(response) {
        this.parse(response.body);
        return bucket[id]; // Dirty, not what we want
      }.bind(this));
    }

    return this._syncify(model, options);
  },

  all: function(namespace, options) {
    var bucket  = this._bucket(namespace);
    var objects = Object.keys(bucket).map(function(key) {
      return bucket[key];
    });

    return this._syncify(objects, options);
  },

  some: function(namespace, ids, options) {
    var bucket  = this._bucket(namespace);
    var objects = ids.map(function(id) {
      return bucket[id];
    });

    return this._syncify(objects, options);
  },

  where: function(namespace, props, options) {
    var bucket  = this._bucket(namespace);
    var objects = Object.keys(bucket).filter(function(key) {
      var model = bucket[key];
      var match  = true;

      for (var prop in props) {
        match = match && model.get(prop) === props[prop];
      }

      return match;
    });

    return this._syncify(objects, options);
  },

  count: function(namespace, options) {
    var bucket = this._bucket(namespace);
    var count  = Object.keys(bucket).length;

    return this._syncify(count, options);
  },

  parse: function(payload) {
    var namespace, values;

    for (var key in payload) {
      values    = payload[key];
      namespace = key;

      if (!Array.isArray(values)) {
        values    = [values];
        namespace = inflector.pluralize(key);
      }

      values.forEach(this.add.bind(this, namespace));
    }

    return this;
  },

  delete: function(model) {
    var namespace = model.namespace;
    var bucket    = this._bucket(namespace);

    delete bucket[model.id];

    return this.adapter.delete(model).then(function() {
      this.emit(Store.DELETE_EVENT, model);
    }.bind(this));
  },

  reload: function(model) {
    return this.adapter.read(model).then(function() {
      this.emit(Store.RELOAD_EVENT, model);
    }.bind(this));
  },

  save: function(model) {
    var method = model.id ? 'update' : 'create';

    return this.adapter[method](model).then(function() {
      this.emit(Store.CHANGE_EVENT, model);
    }.bind(this));
  },

  _bucket: function(namespace) {
    var bucket = this.buckets[namespace] || {};
    this.buckets[namespace] = bucket;

    return bucket;
  },

  _syncify: function(resolution, options) {
    if (options && options.sync) {
      return resolution;
    } else {
      return new Prom(function(resolve, reject) {
        resolve(resolution);
      });
    }
  },

  _vivify: function(namespace, object) {
    var key   = inflector.capitalize(inflector.singularize(namespace));
    var Cons  = this.mapping[key] || Model;
    var model = new Cons(object, { namespace: namespace, store: this });

    return model;
  }
});

module.exports = Store;
