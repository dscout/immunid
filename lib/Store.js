/* @flow weak */

var inflector   = require('./utils/inflector');
var merge       = require('./utils/merge');
var without     = require('./utils/without');
var Events      = require('./Events');
var Model       = require('./Model');
var Promise     = require('es6-promise').Promise;
var NullAdapter = require('./NullAdapter');

var ACTIONS = {
  create:  'create',
  destroy: 'destroy',
  fetch:   'fetch',
  reload:  'reload',
  update:  'update'
};

var Store = function(adapter, mapping) {
  this.adapter = adapter || new NullAdapter();
  this.mapping = mapping || {};
  this.buckets = {};
};

merge(Store.prototype, Events, {
  build: function(namespace, object) {
    var model = vivify(this, namespace, object);

    return model;
  },

  add: function(namespace, object) {
    var bucket = getBucket(this, namespace),
        model  = this.get(namespace, object.id);

    if (!!model) {
      model.set(object);
    } else {
      model = vivify(this, namespace, object)
      bucket[object.id] = model;
    }

    return model;
  },

  find: function(namespace, id) {
    if (id === undefined) {
      return findAll(this, namespace);
    } else {
      return findOne(this, namespace, id);
    }
  },

  get: function(namespace, id) {
    var bucket = getBucket(this, namespace);

    return bucket[id];
  },

  all: function(namespace) {
    var bucket = getBucket(this, namespace);

    return Object.keys(bucket).map(function(key) {
      return bucket[key];
    });
  },

  some: function(namespace, ids) {
    var bucket = getBucket(this, namespace);

    if (ids && ids.length) {
      return ids.map(function(id) {
        return bucket[id];
      });
    } else {
      return [];
    }
  },

  where: function(namespace, props) {
    var bucket = getBucket(this, namespace);

    return collectMatches(bucket, props);
  },

  count: function(namespace) {
    var bucket = getBucket(this, namespace);

    return Object.keys(bucket).length;
  },

  clear: function(namespace) {
    this.buckets = without(this.buckets, namespace);

    return this;
  },

  parse: function(payload, options) {
    parsePayload(this, payload, options);

    return self;
  },

  remove: function(model) {
    var namespace = model.namespace,
        bucket    = getBucket(this, namespace),
        prop      = String(model.id);

    this.buckets[namespace] = without(bucket, prop);

    return this;
  },

  destroy: function(model) {
    var self = this;

    this.remove(model);

    return this.adapter.destroy(model)
      .then(function() {
        emitEvent(self, model.namespace, ACTIONS.destroy, model);
      });
  },

  reload: function(model) {
    var self = this;

    return readModel(self, model).then(function(response) {
      self.parse(response.body, { action: ACTIONS.reload });

      return self.get(model.namespace, model.id);
    });
  },

  save: function(model) {
    var self   = this,
        method = model.id ? ACTIONS.update : ACTIONS.create;

    return self.adapter[method](model).then(function(response) {
      self.parse(response.body, { action: method });

      return self.get(
        model.namespace,
        scrapeId(model.namespace, response.body)
      );
    });
  }
});

function collectMatches(bucket, props) {
  return Object.keys(bucket).reduce(function(memo, key) {
    var match = true,
        model = bucket[key];

    for (var prop in props) {
      match = match && model.get(prop) === props[prop];
    }

    if (match) {
      memo = memo.concat(model);
    }

    return memo;
  }, []);
}

function collectAddedModels(store, namespace, values) {
  return values.reduce(function(memo, value) {
    memo = memo.concat(store.add(namespace, value));

    return memo;
  }, []);
}

function parsePayload(store, payload, options) {
  var models, namespace, values;

  Object.keys(payload).forEach(function(key) {
    namespace = key;
    values    = payload[key];

    if (!Array.isArray(values)) {
      namespace = inflector.pluralize(key);
      values    = [values];
    }

    models = collectAddedModels(store, namespace, values);

    if (options && options.action) {
      emitEvent(store, namespace, options.action, models);
    }
  });
}

function getBucket(store, namespace) {
  var bucket = store.buckets[namespace] = store.buckets[namespace] || {};

  return bucket;
}

function resolve(mapping, namespace) {
  var key = inflector.capitalize(inflector.singularize(namespace));

  return mapping[key] || Model;
}

function vivify(store, namespace, object) {
  var Constructor = resolve(store.mapping, namespace);

  return new Constructor(object, { namespace: namespace, store: store });
}

function findAll(store, namespace) {
  var ModelClass = resolve(store.mapping, namespace);

  return readModel(store, ModelClass).then(function(response) {
    store.parse(response.body, { action: ACTIONS.fetch });

    return store.all(namespace);
  });
}

function findOne(store, namespace, id) {
  var bucket = getBucket(store, namespace),
      model  = bucket[id],
      promise;

  if (model) {
    promise = Promise.resolve(model);
  } else {
    model = vivify(store, namespace, { id: id });

    promise = readModel(store, model).then(function(response) {
      store.parse(response.body, { action: ACTIONS.fetch });

      return bucket[id];
    });
  }

  return promise;
}

function scrapeId(key, object) {
  var namespace = inflector.singularize(key);

  return object[namespace]['id'];
}

function readModel(store, model) {
  return store.adapter.read(model);
}

function emitEvent(emitter, namespace, action, payload) {
  var name = [namespace, inflector.preterite(action)].join(':');

  emitter.emit(name, payload);
}

module.exports = Store;
