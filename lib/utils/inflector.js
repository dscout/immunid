/* @flow weak */

module.exports = {
  capitalize: function(word) {
    return word.replace(/^[a-z]/, function(letter) {
      return letter.toUpperCase();
    });
  },

  singularize: function(word) {
    return word.replace(/s$/, '');
  },

  pluralize: function(word) {
    return word + 's';
  }
};
