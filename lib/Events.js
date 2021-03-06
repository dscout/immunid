var without = require('./utils/without');

var events = {};

function getEvents(name) {
  events[name] = events[name] || [];

  return events[name];
}

function setEvents(name, newEvents) {
  events[name] = newEvents;
}

function addEvent(name, event) {
  var newEvents = getEvents(name).concat(event);

  setEvents(name, newEvents);
}

function removeEvent(name, callback) {
  var newEvents = getEvents(name).filter(function(event) {
    return callback !== event.callback
  });

  setEvents(name, newEvents);
}

function removeNamespace(name) {
  var keys = Object.keys(events);

  events = keys.reduce(function(memo, key) {
    if (!key.match(name)) {
      memo[key] = events[key];
    }

    return memo;
  }, {});
}

function removeEvents(name) {
  events = without(events, name);
}

function isNamespace(name) {
  return !name.match(/\w+:\w+/);
}

module.exports = {
  on: function(name, callback, context) {
    addEvent(name, { callback: callback, context: context || this });

    return this;
  },

  off: function(name, callback) {
    if (callback) {
      removeEvent(name, callback);
    } else if (isNamespace(name)) {
      removeNamespace(name);
    } else {
      removeEvents(name);
    }

    return this;
  },

  emit: function(name) {
    var args = [].slice.call(arguments, 1);

    getEvents(name).forEach(function(event) {
      event.callback.apply(event.context, args);
    });

    return this;
  }
};
