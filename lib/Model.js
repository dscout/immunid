var extend       = require('./utils/extend');
var merge        = require('./utils/merge');
var mixin        = require('./utils/mixin');
var EventEmitter = require('events').EventEmitter;

var Model = function(attributes, options) {
  mixin(this);

  options = options || {};

  this.attributes = {};
  this.namespace  = options.namespace;
  this.store      = options.store;

  this.set(attributes || {});
  this.initialize.apply(this, arguments);
};

Model.extend = extend;

merge(Model.prototype, EventEmitter.prototype, {
  mixins: [],

  initialize: function() {
  },

  isNew: function() {
    return !this.id;
  },

  get: function(key) {
    return this.attributes[key];
  },

  has: function(key) {
    var value = this.get(key);

    return value !== null && value !== undefined;
  },

  dump: function() {
    return merge({}, this.attributes);
  },

  toJSON: function() {
    this.dump.apply(this, arguments);
  },

  set: function(key, value) {
    var attributes = {};
    var anyChanges = false;
    var currentVal;

    if (key === null) return this;

    if (key === Object(key)) {
      attributes = key;
    } else {
      attributes[key] = value;
    }

    for (var prop in attributes) {
      currentVal = this.attributes[prop];

      if (currentVal !== attributes[prop]) {
        anyChanges = true;

        this.attributes[prop] = attributes[prop];
        this.emit('change:' + prop, this);
      }
    }

    if (attributes.id) {
      this.id = attributes.id;
    }

    if (anyChanges) {
      this.emit('change', this);
    }

    return this;
  },

  unset: function(key, options) {
    if (this.has(key)) {
      delete this.attributes[key];

      this.emit('change:' + key, this);
      this.emit('change', this);
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
  }
});

module.exports = Model;
