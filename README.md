[![Circle CI](https://circleci.com/gh/dscout/immunid.svg?style=svg&circle-token=1cb347df46f1f0cdad20822c42fc8ccced2e97e4)](https://circleci.com/gh/dscout/immunid)

# Immunid — Opinionated Data Storage

* Robust relational data handling
* Absolutely no view layer
* Modularize via CommonJS
* No reliance on jQuery for ajax
* No reliance on Underscore or lodash for functions
* Promises, not callbacks
* Emphasis on mixins

## Installation

Immunid is distributed with [npm](npm) and can be imported as CommonJS modules.

```bash
npm install immunid --save
```

### Retrieving Data

All models must be created or retrieved through the store. The store is what
allows relational behavior, caching, and identity mapping. It is strictly
possible to create a new instance of a model directly, but it will not be able
to retrieve any associations.

```javascript
// create a model class
var Post = Model.extend({
  path: function() {
    return '/posts';
  }
});

// configure communication with your server
var adapter = new Adapter({
  headers: { 'Content-Type': 'application/json' },
  host: '/api'
});

// create a store with an adapter and a mapping
// the keys of the mapping become namespaces for your model classes
// e.g. 'Post' -> 'posts'
var store = new Store(adapter, {
  'Post': Post
});

// Performs a GET to `/api/posts/1`
store.find('posts', 1).then(function(post) {
  // do something with the post
});
```

All data returned from the `GET` request to `/posts/1` will be parsed into the
appropriate location within the store and wrapped in a corresponding model
object. This allows the `Post` to synchronously retrieve associated data. This
mechanism relies on embedded ids within the parent record:

```javascript
post.get('comment_ids'); // [1, 2, 3]
post.comments().all();   // No request, returns an array of comments
```

The path used for a particular model or relation can be customized within the
model itself. There is no `basePath` or automatic id appending.

```javascript
var Comment = Model.extend({
  path: function(post) {
    return '/post/' + post.id + '/comments';
  }
});
```

### Persisting Records

Records instantiated through the store expose some simple persistence methods.

```javascript
model.save();    // POST or PUT request to model.path()
model.reload();  // GET request to model.path()
model.destroy(); // DELETE request to model.path()
```

Persisting models with associations does not create, update, or destroy any of
the associated models.

### Adding and Removing Records without Persistence

Records can be added to or removed from the store without making a call to
`#find` or `#destroy`:

```javascript
var store = new Store(adapter, {
  'Post': Post
});

// instantiates a Post model with existing attributes
var post = store.add('posts', { id: 42, body: 'Lorem ipsum' });
// removes a Post model that has already been destroyed or should not be used
store.remove(post);
```

Calling `#add` with new attributes for a model that already exists updates the
existing model attributes instead of overwriting them:

```javascript
store.add('posts', { id: 42, body: 'Lorem ipsum' });
store.add('posts', { id: 42, group: 'beta' });

var post = store.get('posts', 42);
post.get('body');  // returns 'Lorem ipsum'
post.get('group'); // return 'beta'
```

### Relating Records

* There is no `belongsTo` relation. Only `hasOne` or `hasMany` currently.
* Relation names are always singular.

```javascript
var Project = Model.extend({
  account:     Relation.hasOne('account'),
  missions:    Relation.hasMany('mission'),
  screeners:   Relation.hasMany('screener'),
  memberships: Relation.hasMany('membership')
});

project.account().get();     // Returns instance of loaded account
project.memberships().all(); // Returns array of loaded memberships
```

### Events

The store emits events under namespaces when model instances are changed.
Event names are always past tense to indicate the model is ready for use:

```javascript
var adapter = new Adapter();
var Tag     = Model.extend({});
var store   = new Store(adapter, { Tag: Tag });

function handleChangeTag(tag) {
  // tag is the model instance that has changed
  // `this` value is implicitly bound to the store
}

var myTag = store.get('tags', 42).then(function(tag) {
  store.on('tags:changed', handleChangeTag); // subscribe
});

myTag.set({ name: 'banana' }); // calls handleChangeTag
myTag.unset('name');           // calls handleChangeTag
myTag.clear();                 // calls handleChangeTag

store.off('tags:changed', handleChangeTag); // unsubscribe
```

Set the event handler's `this` value with the third argument to `on`:

```javascript
var context = { model: null };

store.on('model:changed', handleChange, context);

function handleChange(model) {
  // `this` value is the `context` object
  this.model = model;
}
```

There are a few ways to unsubscribe event handlers:

```javascript
// unsubscribe `handleChange` handler
store.off('tags:changed', handleChange);
// unsubscribe all `tags:changed` handlers
store.off('tags:changed', null, null);
// unsubscribe all handlers from `tags` namespace
store.off('tags', null, null);
```

The store also emits events when parsing a response from the server:

```javascript
store.find('tags');     // store emits 'tags:fetched'
store.find('tags', 42); // store emits 'tags:fetched'

var tag = store.build('tags', { name: 'apple' });
tag.save();                         // store emits 'tags:created'
tag.reload();                       // store emits 'tags:reloaded'
tag.set({ name: 'banana' }).save(); // store emits 'tags:updated'
tag.destroy();                      // store emits 'tags:destroyed'
```

The payload for `fetched`, `created`, `reloaded`, and `updated` events will be
an array of one or more models. The payload for `destroyed` events will be a
single model.

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

## License

Released under the MIT license. See [LICENSE](LICENSE) for details.

[npm]: http://npmjs.org/immunid
