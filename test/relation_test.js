var chai     = require('chai').expect;
var merge    = require('../lib/utils/merge');
var Store    = require('../lib/Store');
var Relation = require('../lib/Relation');

describe('Relation', function() {
  var store = new Store();
  var Submission = function(attributes) {
    this.attributes = attributes;
  };

  merge(Submission.prototype, {
    store:  store,
    notes:  Relation.hasMany('note'),
    tags:   Relation.hasMany('tag'),
    author: Relation.hasOne('author'),

    get: function(key) {
      return this.attributes[key];
    }
  });

  var toAttributes = function(models) {
    return models.map(function(model) {
      return model.attributes;
    });
  };

  it('associates multiple existing objects through hasMany', function() {
    store
      .add('tags', { id: 1, name: 'alpha' })
      .add('tags', { id: 2, name: 'beta'  })

    var submission = new Submission({
      tag_ids:  [1, 2],
      note_ids: [1]
    });

    var tags = submission.tags();

    expect(tags).to.exist;
    expect(tags).to.have.length(2);
    expect(toAttributes(tags)).to.eql([
      { id: 1, name: 'alpha' },
      { id: 2, name: 'beta' }
    ]);
  });

  it('returns an empty collection without any ids', function() {
    var submission = new Submission({});

    expect(submission.tags()).to.be.empty;
    expect(submission.author()).not.to.exist;
  });

  it('associates a single object through hasOne', function() {
    store.add('authors', { id: 1, name: 'John Doe' });

    var submission = new Submission({
      author_id: 1
    });

    var author = submission.author()

    expect(author).to.exist;
    expect(author.attributes).to.eql({ id: 1, name: 'John Doe' });
  });
});
