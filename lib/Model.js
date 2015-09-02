/* @flow weak */

var extend    = require('./utils/extend');
var compact   = require('./utils/compact');
var merge     = require('./utils/merge');
var mixin     = require('./utils/mixin');
var inflector = require('./utils/inflector');
var without   = require('./utils/without');

var Model = function(attributes, options) {
  mixin(this);

  initOptions(this, options || {});
  setAttributes(this, attributes || {});

  this.initialize.apply(this, arguments);
};

Model.extend = extend;

Model.path = function() {
  throw new Error('Path must be overridden');
};

merge(Model.prototype, {
  mixins: [],

  initialize: function() {},

  isNew: function() {
    return !this.has('id');
  },

  path: function() {
    return compact([this.constructor.path(), this.id]).join('/');
  },

  get: function(key) {
    return this.attributes[key];
  },

  has: function(key) {
    var value = this.get(key);

    return value !== null && value !== undefined;
  },

  dump: function(options) {
    var dumped = merge({}, this.attributes),
        payload, root;

    if (options && options.rooted) {
      payload = {};
      root    = inflector.singularize(this.namespace);

      payload[root] = dumped;
    } else {
      payload = dumped;
    }

    return payload;
  },

  toJSON: function() {
    return this.dump({ rooted: true });
  },

  set: function(key, value) {
    var newAttrs = {};

    if (key === null || key === undefined) {
      return this;
    } else if (key === new Object(key)) {
      newAttrs = key;
    } else {
      newAttrs[key] = value;
    }

    updateAttributes(this, newAttrs);

    return this;
  },

  unset: function(key) {
    removeAttribute(this, key);

    return this;
  },

  clear: function() {
    unsetAttributes(this);

    return this;
  },

  destroy: function() {
    return this.store.destroy(this);
  },

  reload: function() {
    return this.store.reload(this);
  },

  save: function() {
    return this.store.save(this);
  }
});

function initOptions(model, options) {
  model.namespace = options.namespace;
  model.store     = options.store;
}

function setAttributes(model, attributes) {
  if (attributes.id) {
    model.id = attributes.id;
  }

  model.attributes = attributes;
}

function changeAttributes(model, attributes) {
  setAttributes(model, attributes);

  model.store.emit(model.namespace + ':change', model);
}

function updateAttributes(model, attributes) {
  var changed = false,
      current = model.attributes;

  changed = Object.keys(attributes).some(function(prop) {
    return current[prop] !== attributes[prop];
  });

  if (changed) {
    var next = merge({}, current, attributes);
    changeAttributes(model, next);
  }
}

function removeAttribute(model, prop) {
  if (model.has(prop)) {
    var removed = without(model.attributes, prop);

    changeAttributes(model, removed);
  }
}

function unsetAttributes(model) {
  var keys = Object.keys(model.attributes),
      overwritten;

  overwritten = keys.reduce(function(memo, key) {
    memo[key] = undefined;

    return memo;
  }, {});

  changeAttributes(model, overwritten);
}

module.exports = Model;
