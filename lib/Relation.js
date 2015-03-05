/* @flow weak */

var inflector = require('./utils/inflector');
var merge     = require('./utils/merge');

var Relation = function(parent, relation) {
  this.parent    = parent;
  this.relation  = relation;
  this.namespace = inflector.pluralize(relation);
  this.store     = parent.store;
};

merge(Relation.prototype, {
  all: function() {
    return this.store.some(this.namespace, this._ids(false));
  },

  get: function(id) {
    var id = id ? id : this._ids(true);

    return this.store.get(this.namespace, id);
  },

  _ids: function(singular) {
    var postfix = singular ? '_id' : '_ids';

    return this.parent.get(this.relation + postfix);
  }
});

Relation.hasOne = Relation.hasMany = function(relation) {
  return function() {
    return new Relation(this, relation);
  }
};

module.exports = Relation;
