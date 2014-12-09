var expect = require('chai').expect;
var Store  = require('../lib/Store');

describe('Store', function() {
  describe('#add', function() {
    it('stores the object within a particular namespace', function() {
      var store  = new Store();
      var result = store.add('tags', { id: 100 });

      expect(result).to.eql(store);
    });

    it('vivifies data into a model wrapper', function() {
      var store = new Store();
      store.add('tags', { id: 100 });

      var tag = store.find('tags', 100, { sync: true });

      expect(tag).to.have.property('get');
    });

    it('injects a reference to the store into models', function() {
      var store = new Store();
      store.add('tags', { id: 100 });

      var tag = store.find('tags', 100, { sync: true });

      expect(tag.store).to.eql(store);
    });

    it('vivifies objects in buckets with matching models', function(done) {
      var Tag = function(attributes) {
        this.id   = attributes.id;
        this.name = attributes.name;
      };

      var store = new Store({ Tag: Tag });
      var result = store.add('tags', { id: 100, name: 'gamma' });

      store.find('tags', 100).then(function(tag) {
        expect(tag).to.be.an.instanceOf(Tag);
        expect(tag.name).to.eq('gamma');
        done();
      });
    });
  });

  describe('#find', function() {
    it('retrieves a stored object', function(done) {
      var store  = new Store();
      var object = { id: 100 };
      store.add('tags', object);

      store.find('tags', 100).then(function(tag) {
        expect(tag.id).to.eq(object.id);
        done();
      });
    });

    it('can perform synchronous retrieval', function() {
      var store = new Store();
      store.add('tags', { id: 100 });
      var tag = store.find('tags', 100, { sync: true });

      expect(tag.id).to.eql(100);
    });
  });

  describe('#all', function() {
    it('retrieves all objects stored within a namespace', function(done) {
      var store = new Store();
      store.add('tags', { id: 100 });

      store.all('tags').then(function(tags) {
        expect(tags).to.have.length(1);
        done();
      });
    });
  });

  describe('#some', function() {
    it('retrieves each from a list of ids', function(done) {
      var store   = new Store();
      var objectA = { id: 100 };
      var objectB = { id: 101 };

      store
        .add('tags', objectA)
        .add('tags', objectB);

      store.some('tags', [100, 101]).then(function(tags) {
        expect(tags).to.have.length(2);
        done();
      });
    });
  });

  describe('#where', function() {
    it('retrieves all objects where a condition is true', function(done) {
      var store = new Store();

      store
        .add('tags', { id: 100, name: 'alpha', group: 'greek' })
        .add('tags', { id: 101, name: 'beta',  group: 'greek' })

      store.where('tags', { name: 'beta' }).then(function(tags) {
        expect(tags).to.have.length(1);
        done();
      });
    });
  });

  describe('#count', function() {
    it('counts the number of objects within a namespace', function(done) {
      var store = new Store();

      store.add('tags', { id: 100 });

      store.count('tags').then(function(count) {
        expect(count).to.eq(1);
        done();
      });
    });
  });

  describe('#parse', function() {
    var payload = {
      thing:    { id: 1 },
      authors:  [{ id: 1 }],
      comments: [{ id: 1 }, { id: 2 }],
      posts:    [{ id: 1 }, { id: 2 }]
    }

    it('extracts a payload of rooted arrays into corresponding buckets', function(done) {
      var store = new Store();

      store.parse(payload);

      var thingsCount   = store.count('things');
      var authorsCount  = store.count('authors');
      var commentsCount = store.count('comments');
      var postsCount    = store.count('posts');

      Promise.all([thingsCount, authorsCount, commentsCount, postsCount]).then(function(counts) {
        expect(counts[0]).to.eq(1);
        expect(counts[1]).to.eq(1);
        expect(counts[2]).to.eq(2);
        expect(counts[3]).to.eq(2);
        done();
      });
    });
  });
});
