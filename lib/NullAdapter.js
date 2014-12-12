var merge = require('./utils/merge');

var NullAdapter = function() {
};

merge(NullAdapter.prototype, {
  create: function(model) {},
  delete: function(model) {},
  read:   function(model) {},
  update: function(model) {}
});

module.exports = NullAdapter;
