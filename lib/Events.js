module.exports = {
  on: function(name, callback, context) {
    var events = this._getEvents(name) || [];

    this._events[name] = events.concat({
      callback: callback,
      context: context || this
    });

    return this;
  },

  off: function(name, callback, context) {
    if (callback) {
      var events = this._getEvents(name);

      this._events[name] = events.filter(function(event) {
        return callback !== event.callback || context !== event.context;
      });
    } else {
      this._events = Object.keys(this._events).reduce(function(memo, key) {
        if (name !== key) {
          memo[key] = this._events[key];
        }

        return memo;
      }, {});
    }

    return this;
  },

  emit: function(name) {
    var args   = [].slice.call(arguments, 1);
    var events = this._getEvents(name);

    if (events) {
      events.forEach(function(event) {
        event.callback.apply(event.context, args);
      });
    }

    return this;
  },

  _getEvents: function(name) {
    this._events = this._events || {};

    return this._events[name];
  }
};
