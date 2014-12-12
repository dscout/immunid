var chai      = require('chai');
var sinon     = require('sinon');
var sinonChai = require('sinon-chai');
var expect    = chai.expect;
var Store     = require('../lib/Store');

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

      var store = new Store(null, { Tag: Tag });
      var result = store.add('tags', { id: 100, name: 'gamma' });

      store.find('tags', 100).then(function(tag) {
        expect(tag).to.be.an.instanceOf(Tag);
        expect(tag.name).to.eq('gamma');
        done();
      });
    });

    it('emits an add event', function() {
      var store  = new Store();
      var listen = sinon.spy();

      store.on(Store.ADD_EVENT, listen);
      store.add('tags', { id: 100 });

      expect(listen).to.be.called;
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

  describe('#delete', function() {
    it('removes the model from its bucket', function() {
      var store = new Store();

      store.add('tags', { id: 100 });
      store.delete({ namespace: 'tags', id: 100 });

      expect(store.count('tags', { sync: true })).to.eq(0);
    });

    it('instructs the adapter to persist deletion', function() {
      var store   = new Store(adapter);
      var adapter = store.adapter;

      sinon.spy(adapter, 'delete');

      store.add('tags', { id: 100 });
      store.delete('tags', { id: 100 });

      expect(adapter.delete).to.be.called;
    });

    it('emits a delete event', function(done) {
      var store  = new Store();
      var listen = sinon.spy();

      store.on(Store.DELETE_EVENT, listen);
      store.add('tags', { id: 100 });

      store.delete('tags', { id: 100 }).then(function() {
        expect(listen).to.be.called;
        done();
      });
    });
  });

  describe('#reload', function() {
    it('instructs the adapter to reload the model', function() {
      var store   = new Store();
      var adapter = store.adapter;

      sinon.spy(adapter, 'read');

      store.add('tags', { id: 100 });
      store.reload('tags', { id: 100 });

      expect(adapter.read).to.be.called;
    });

    it('emits a reload event', function(done) {
      var store  = new Store();
      var listen = sinon.spy();

      store.on(Store.RELOAD_EVENT, listen);

      store.reload({ id: 100 }).then(function() {
        expect(listen).to.be.called;
        done();
      });
    });
  });

  describe('#save', function() {
    it('instructs the adapter to update the model', function() {
      var store   = new Store();
      var adapter = store.adapter;

      sinon.spy(adapter, 'update');

      store.save({ id: 100 });

      expect(adapter.update).to.be.called;
    });

    it('emits a change event', function(done) {
      var store  = new Store();
      var listen = sinon.spy();

      store.on(Store.CHANGE_EVENT, listen);

      store.save({ id: 100 }).then(function(model) {
        expect(listen).to.be.called;
        done();
      });
    });
  });
});
