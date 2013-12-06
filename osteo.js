(function() {
  window.Osteo = {
    TEMPLATE: {}
  };
})();

(function() {
  var Cache = Osteo.Cache = function() {
    this.cidCache = {};
  };

  Cache.prototype.add = function(object) {
    if (object.model !== undefined) {
      this.cidCache[object.model.cid] = object;
    }

    this.cidCache[object.cid] = object;
  };

  Cache.prototype.get = function(cid) {
    return this.cidCache[cid];
  };

  Cache.prototype.remove = function(object) {
    if (object.model !== undefined) {
      delete(this.cidCache[object.model.cid]);
    }

    delete(this.cidCache[object.cid]);
  };
})();

(function() {
  Osteo.Collection = Backbone.Collection.extend({
    toPresenters: function(presenter) {
      if (presenter === undefined) {
        presenter = Osteo.Presenter;
      }

      return this.map(function(model) {
        return new presenter(model);
      });
    }
  });
})();

(function() {
  Osteo.Model = Backbone.Model.extend({
    defaultAutoSaveDelay: 500,

    initialize: function() {
      this.autoSaveDelay = this.defaultAutoSaveDelay;
    },

    autoSave: function() {
      if (!this.debouncedSave) {
        this.debouncedSave = _.debounce(this.save, this.autoSaveDelay);
      }

      this.debouncedSave();

      return true;
    }
  });
})(this);

(function() {
  Osteo.Presenter = function(model) {
    this.model = model;
    this.model.on("change", this.replicateChanged, this);

    this.duplicateAttributes();

  };

  Osteo.Presenter.prototype = {
    get: function(key) {
      return this.model.get(key);
    },

    duplicateAttributes: function() {
      var self = this;

      _.forOwn(this.model.attributes, function(value, key) {
        if (self[key] === undefined) {
          self[key] = value;
        }
      });
    },

    // for key of model.changed
    //   @[key] = model.get(key) unless _.isFunction(@[key])
    replicateChanged: function(model) {
      var self = this;

      _.forOwn(model.changed, function(_value, key) {
        if (!_.isFunction(self[key])) {
          self[key] = model.get(key);
        }
      });
    }
  };
})();

(function() {
  Osteo.View = Backbone.View.extend({
    lazyRenderDelay: 50,

    initialize: function(options) {
      this.options = options || {};
      this.lazyRenderDelay = options.lazyRenderDelay || this.lazyRenderDelay;

      if (options.presenter) {
        this.presenter = options.presenter;
      }

      if (options.template) {
        this.template = options.template;
      }
    },

    isRendered: function() {
      return !!this._rendered;
    },

    afterRender: function() {
    },

    bindEvents: function() {
      return this;
    },

    unbindEvents: function() {
      this.undelegateEvents();

      return this;
    },

    render: function() {
      this._rendered = true;

      if (this.template) {
        this.$el.html(this.renderTemplate(this.template, this.renderContext()));
      }

      this.afterRender.call(this);

      return this;
    },

    lazyRender: function() {
      if (!this.debouncedRender) {
        this.debouncedRender = _.debounce(this.render, this.lazyRenderDelay);
      }

      this.debouncedRender();

      return this;
    },

    renderTemplate: function(template, context) {
      return this._lookupTemplate(template)(context);
    },

    renderContext: function() {
      if (this.presenter) {
        if (_.isFunction(this.presenter)) {
          return this.presenter.apply(this, this.model);
        } else {
          return this.presenter;
        }
      } else if (this.model) {
        return this.model.attributes;
      } else {
        return {};
      }
    },

    show: function() {
      if (!this.isRendered()) {
        this.render();
      }

      this.$el.show();

      return this;
    },

    hide: function() {
      if (this.isRendered()) {
        this.$el.hide();
      }

      return this;
    },

    destroy: function(options) {
      this.hide();
      this.unbindEvents();
      this.remove();

      if (options && options.complete) {
        this.model.destroy();
      }

      return this;
    },

    _lookupTemplate: function(template) {
      return Osteo.TEMPLATES[template];
    }
  });
})();
