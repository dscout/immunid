[![Build Status](https://travis-ci.org/dscout/osteo.js.svg?branch=master)](https://travis-ci.org/dscout/osteo.js)
[![Code Climate](https://codeclimate.com/github/dscout/osteo.js.png)](https://codeclimate.com/github/dscout/osteo.js)

# Osteo.js — Opinionated Data Storage

* Robust relational data handling
* Absolutely no view layer
* Leverage an existing event system (EventEmitter)
* Modularize via CommonJS
* No reliance on jquery for ajax
* No reliance on underscore or lodash for functions
* Promises, not callbacks
* Emphasis on mixins

## Installation

Osteo is distributed with [npm](npm).

```bash
bower install osteo.js
```

## Retrieving Data

All models must be created or retreived through the store. The store is what
allows relational behavior, caching, and identity mapping. It is strictly
possible to create a new instance of a model directly, but it will not be able
to retrieve any associations.

```javascript
// Performs a GET to `/posts/1`
store.find('post', 1).then(function(post) {
});
```

All data returned from the `GET` request to `/posts/1` will be parsed into the
appropriate location within the store and wrapped in a corresponding model
object. This allows the post to synchronously retrieve associated data. This
mechanism relies on embedded ids within the parent record, which is the `post`
in this example:

```javascript
post.get('comment_ids'); // [1, 2, 3]
post.comments(); // No request, returns an array of comments
```

In some situations it isn't feasible to pass down all of the associated records
along with the parent. When that happens and you need to retrieve the associated
data you can specify that a request should be made, along with some optional
parameters:

```javascript
post.comments({ fetch: true, page: 1 }); // GET /post/1/comments?page=1
```

The path used for a particular model or relation can be customized within the
model itself.

```javascript
var Comment = Model.extend({
  // Defines properties on the Comment object directly
  statics: {
    // Class method used for class actions
    path: function(post) {
      return '/post/' + post.id + '/comments';
    }
  },

  // Instance method used for instance actions. If the only modification is to
  // append `this.id` then you can safely ommit the override, this is the
  // default behavior.
  path: function() {
    return '/post/' + this.post_id + '/comments/' this.id;
  }
});
```

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

## License

Released under the MIT license. See [LICENSE](LICENSE) for details.

[npm]: http://npmjs.org/osteo
