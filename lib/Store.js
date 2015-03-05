/* @flow weak */

var inflector   = require('./utils/inflector');
var merge       = require('./utils/merge');
var Model       = require('./Model');
var Prom        = require('es6-promise').Promise;
var NullAdapter = require('./NullAdapter');

var Store = function(adapter, mapping) {
  this.adapter = adapter || new NullAdapter();
  this.mapping = mapping || {};
  this.buckets = {};
};

merge(Store.prototype, {
  build: function(namespace, object) {
    var model = this._vivify(namespace, object);

    return model;
  },

  add: function(namespace, object) {
    var bucket = this._bucket(namespace);
    var model  = this._vivify(namespace, object);

    bucket[object.id] = model;

    return model;
  },

  find: function(namespace, id) {
    if (id === undefined) {
      return this._findAll(namespace);
    } else {
      return this._findOne(namespace, id);
    }
  },

  get: function(namespace, id) {
    var bucket = this._bucket(namespace);

    return bucket[id];
  },

  all: function(namespace) {
    var bucket = this._bucket(namespace);

    return Object.keys(bucket).map(function(key) {
      return bucket[key];
    });
  },

  some: function(namespace, ids) {
    var bucket = this._bucket(namespace);

    if (ids && ids.length) {
      return ids.map(function(id) {
        return bucket[id];
      });
    } else {
      return [];
    }
  },

  where: function(namespace, props) {
    var bucket = this._bucket(namespace);

    return Object.keys(bucket).filter(function(key) {
      var model = bucket[key];
      var match  = true;

      for (var prop in props) {
        match = match && model.get(prop) === props[prop];
      }

      return match;
    });
  },

  count: function(namespace) {
    var bucket = this._bucket(namespace);

    return Object.keys(bucket).length;
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

    return this.adapter.delete(model);
  },

  reload: function(model) {
    return this.adapter.read(model).then(function(response) {
      this.parse(response.body);

      return this.get(model.namespace, model.id);
    }.bind(this));
  },

  save: function(model) {
    var method = model.id ? 'update' : 'create';

    return this.adapter[method](model).then(function(response) {
      this.parse(response.body);

      return this.get(model.namespace, this._scrapeId(model.namespace, response.body));
    }.bind(this));
  },

  _bucket: function(namespace) {
    var bucket = this.buckets[namespace] || {};
    this.buckets[namespace] = bucket;

    return bucket;
  },

  _resolve: function(namespace) {
    var key = inflector.capitalize(inflector.singularize(namespace));

    return this.mapping[key] || Model;
  },

  _vivify: function(namespace, object) {
    var Cons  = this._resolve(namespace);
    var model = new Cons(object, { namespace: namespace, store: this });

    return model;
  },

  _findAll: function(namespace) {
    var klass = this._resolve(namespace);

    return this.adapter.read(klass).then(function(response) {
      this.parse(response.body);
      return this.all(namespace);
    }.bind(this));
  },

  _findOne: function(namespace, id) {
    var bucket = this._bucket(namespace);
    var model  = bucket[id];
    var promise;

    if (model !== undefined) {
      promise = new Prom(function(resolve, _reject) {
        resolve(model);
      });
    } else {
      model = this._vivify(namespace, { id: id });

      promise = this.adapter.read(model).then(function(response) {
        this.parse(response.body);
        return bucket[id];
      }.bind(this));
    }

    return promise;
  },

  _scrapeId: function(key, object) {
    namespace = inflector.singularize(key);

    return object[namespace]['id'];
  },
});

module.exports = Store;
