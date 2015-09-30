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
    return this.store.some(this.namespace, ids(this, false));
  },

  get: function(id) {
    var id = id ? id : ids(this, true);

    return this.store.get(this.namespace, id);
  }
});

Relation.hasOne = Relation.hasMany = function(relation) {
  return function() {
    return new Relation(this, relation);
  }
};

function ids(relation, singular) {
  var postfix = singular ? '_id' : '_ids';

  return relation.parent.get(relation.relation + postfix);
}

module.exports = Relation;
