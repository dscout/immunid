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

function removeEvent(name, callback, context) {
  var newEvents = getEvents(name).filter(function(event) {
    return callback !== event.callback || context !== event.context;
  });

  setEvents(name, newEvents);
}

function removeEvents(name) {
  events = without(events, name);
}

module.exports = {
  on: function(name, callback, context) {
    addEvent(name, { callback: callback, context: context || this });

    return this;
  },

  off: function(name, callback, context) {
    if (callback) {
      removeEvent(name, callback, context);
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
