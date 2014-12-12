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

Store.CHANGE_EVENT = 'CHANGE';
Store.DELETE_EVENT = 'DELETE';
Store.RELOAD_EVENT = 'RELOAD';

merge(Store.prototype, EventEmitter.prototype, {
  add: function(namespace, object) {
    var bucket = this._bucket(namespace);

    bucket[object.id] = this._vivify(namespace, object);

    return this;
  },

  find: function(namespace, id, options) {
    var bucket  = this._bucket(namespace);
    var model   = bucket[id];
    var adapter = this.mapping.adapter;

    // if (!model) {
    //   model = this._vivify(namespace, { id: id });

    //   adapter.sync('read', model).then(function(response) {
    //     this.parse(response);
    //   }.bind(this));
    // }

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

  // TODO: This is not yet asynchronous.
  delete: function(namespace, model) {
    var bucket = this._bucket(namespace);
    var found  = bucket[model.id];

    delete bucket[found.id];

    return this.adapter.delete(found).then(function() {
      this.emit(Store.DELETE_EVENT, found);
    }.bind(this));
  },

  reload: function(namespace, object) {
    var bucket = this._bucket(namespace);
    var found  = bucket[object.id];

    return this.adapter.read(found).then(function(model) {
      this.emit(Store.RELOAD_EVENT, found);
    }.bind(this));
  },

  save: function(_namespace, object) {
    var method = object.id ? 'update' : 'create';

    return this.adapter[method](object).then(function(model) {
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
