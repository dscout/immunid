## v1.0.1 (2016-10-04)

* Fix: `Events.off` no longer requires a `context` argument. This changes the
  API of `off`, but does so to fix a bug with both `off/1` and `off/2`.

## v1.0.0 (2016-06-08)

* Add: `Store#remove` method to remove a model from the store without persistence
* Add: Export the events module for external use.
* Change: Rename project from osteo.js to immunid.
* Change: Favor replacing `attributes` and `buckets` with new objects over mutating
  them.
* Breaking Change: `Store.where` returns array of matching models instead of
  array of model ids.
* Change: `Store#add` updates existing models instead of overwriting them
* Remove: `Model` events in favor of emitting events from the `Store`.
* Fix: `Store#clear` properly removes a namespace from the store (useful for testing)
* Fix: Clean up the public API exported by `Adapter`, `Model`, `Relation`, and
  `Store`.

## v0.8.0 (2014-06-09)

* Exporting with AMD, CommonJS, browser globals. This is not a breaking change,
  but significant enough to warrant a minor version bump.

## v0.7.1 (2014-06-07)

* Ensure looked up models belong to the collection. The `lookup` method will
  create a new model if it fails to find a match. Previously it didn't always
  add the newly created model to the parent collection.
* Preserve associated models when setting without association data.
* Create model relations during construction. This ensures that an empty
  associated collection is present even before additional data is fetched.
* Preserve previous created associated collections. Fetching associated models
  multiple times would clobber the currently loaded data.

## v0.7.0 (2014-04-21)

* Remove all view and presenter related constructs. This is entirely backward
  incompatible! Osteo is purely focused on providing a data interface between
  backbone and modern APIs.
* Remove reliance on `Osteo.TRANSLATIONS` global.
* Throw a translation error for missing key fragments.

## v0.6.1 (2014-03-13)

* Collection#lookup method for simple identity map behavior.
* Association sideloading behaves identically between collections and models,
  even after fetching.

## v0.6.0 (2014-01-17)

* Route loading and unloading uses promises.
* Override `toJSON` for collection serialization.
* Fallback to response when parsing without root.
* Pass navigation options through `visit`.
* Transplant collection root onto models during `set`.
* FormView for convenient form handling and serialization.
* Accept a template passed to the view in options.
* Fix: Set root within the collection constructor.
* Fix: Default collection set operations to parse.

## v0.5.3 (2014-01-08)

* Stop parsing undefined responses (i.e. from a 204 No Content).
* Wrap model toJSON in root when present. Fixes persisting models when the
  server expects a root object.
* Convenience method on `Router` for starting `Backbone.history` idempotently.
* Implement route reset functionality to clear singleton instances.
* Fix: prototype inheritance issues for `Route`, `Presenter`, `Cache`.
* Fix: only call bound render if rendered.

## v0.5.2 (2014-01-06)

* Prevent overwriting root on collection prototype
* Default collection model to Osteo.Model

## v0.5.1 (2014-01-06)

* Simplify view option handling. Fixes initializing with undefined options.

## v0.5.0 (2013-12-31)

* Handle model associations within `set` rather than the constructor.
* Pass collection root settings through to model.
* Consistent, generic handling of view context.
* Simplify bound rendering for non-model objects.
* Rename `renderContext` to simply `context`.
* Generalize modal class naming.
* Simplify modal `cancel` event handlers.
* Defer afterRender hook until call stack clears.
* Remove collection reset from render call.
* Sideload improvements for single root and single associations.

## v0.4.0 (2013-12-18)

* Provide a `beforeRender` hook during view rendering.
* Batched collection reset rendering for performance.
* Routing `pathFor` and `visit` methods. Makes navigation much more convenient.
* Fix: View options didn't default to `{}`.
* Factor model relation loading out of the constructor.
* Allow object or function route handlers.
* Automatic route unloading.
* All routes are treated as singletons.

## v0.3.0 (2013-12-12)

* Support for automatically sideloading relations when instantiating models and
  parsing a collection.
* Package using a single IIFE.
* Add a router class with automatic route handling.

## v0.2.0 (2013-12-11)

* Include a minified version, osteo.min.js.
* Configure for bower usage.
* Remove LoDash specific functions (anything not in Underscore).
* Raise an exception for missing templates.
* Add an i18n helper for translation lookup. Handlebars helper compatible.

## v0.1.0 (2013-12-09)

* Initial release with ported base classes.
