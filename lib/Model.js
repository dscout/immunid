/* @flow weak */

var extend       = require('./utils/extend');
var compact      = require('./utils/compact');
var merge        = require('./utils/merge');
var mixin        = require('./utils/mixin');
var inflector    = require('./utils/inflector');

var Model = function(attributes, options) {
  mixin(this);

  options    = options || {};
  attributes = attributes || {};

  setAttributes.call(this, attributes);

  this.namespace  = options.namespace;
  this.store      = options.store;

  this.initialize.apply(this, arguments);
};

function setAttributes(attributes) {
  this.attributes = attributes || {};

  if (attributes.id) {
    this.id = attributes.id;
  }

  return this;
}

Model.extend = extend;

Model.path = function() {
  throw new Error('Path must be overridden');
};

merge(Model.prototype, {
  mixins: [],

  initialize: function() {
  },

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
    var dumped = merge({}, this.attributes);
    var payload, root;

    if (options && options.rooted) {
      root          = inflector.singularize(this.namespace);
      payload       = {};
      payload[root] = dumped;

      return payload;
    } else {
      return dumped;
    }
  },

  toJSON: function() {
    return this.dump({ rooted: true });
  },

  set: function(key, value) {
    var attributes = {};
    var anyChanges = false;
    var currentVal;

    if (key === null) return this;

    if (key === new Object(key)) {
      attributes = key;
    } else {
      attributes[key] = value;
    }

    for (var prop in attributes) {
      currentVal = this.attributes[prop];

      if (currentVal !== attributes[prop]) {
        anyChanges = true;

        this.attributes[prop] = attributes[prop];
      }
    }

    if (anyChanges) {
      this._emitChange();
    }

    return this;
  },

  unset: function(key, options) {
    if (this.has(key)) {
      delete this.attributes[key];

      this._emitChange();
    }

    return this;
  },

  clear: function(options) {
    var overwritten = {};

    for (var key in this.attributes) {
      overwritten[key] = undefined;
    }

    return this.set(overwritten);
  },

  destroy: function() {
    return this.store.destroy(this);
  },

  reload: function() {
    return this.store.reload(this);
  },

  save: function() {
    return this.store.save(this);
  },

  _emitChange: function() {
    this.store.emit(this.namespace + ':change', this);
  }
});

module.exports = Model;
