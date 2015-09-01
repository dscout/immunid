var chai      = require('chai');
var sinon     = require('sinon');
var sinonChai = require('sinon-chai');
var expect    = chai.expect;
var Adapter   = require('../lib/Adapter');
var Model     = require('../lib/Model');
var Store     = require('../lib/Store');

describe('Store', function() {
  describe('#build', function() {
    it('vivifies a new model but does not persist it', function() {
      var store = new Store();
      var model = store.build('tags', { name: 'alpha' });

      expect(model.id).not.to.exist;
      expect(model.namespace).to.eq('tags');
      expect(model.store).to.eql(store);
      expect(store.count('tags')).to.eq(0);
    });
  });

  describe('#add', function() {
    it('stores the object within a particular namespace', function() {
      var store  = new Store();
      var result = store.add('tags', { id: 100 });

      expect(store.get('tags', 100)).to.eql(result);
    });

    it('vivifies data into a model wrapper', function() {
      var store = new Store();
      store.add('tags', { id: 100 });

      expect(store.get('tags', 100)).to.be.instanceof(Model);
    });

    it('injects a reference to the store into models', function() {
      var store = new Store();
      store.add('tags', { id: 100 });

      expect(store.get('tags', 100).store).to.eql(store);
    });

    it('vivifies objects in buckets with matching models', function() {
      var Tag = function(attributes) {
        this.id   = attributes.id;
        this.name = attributes.name;
      };

      var store = new Store(null, { Tag: Tag });
      var result = store.add('tags', { id: 100, name: 'gamma' });

      return store.find('tags', 100).then(function(tag) {
        expect(tag).to.be.an.instanceOf(Tag);
        expect(tag.name).to.eq('gamma');
      });
    });
  });

  describe('#find', function() {
    it('retrieves a stored object', function() {
      var store  = new Store();
      var object = { id: 100 };
      store.add('tags', object);

      return store.find('tags', 100).then(function(tag) {
        expect(tag.id).to.eq(object.id);
      });
    });
  });

  describe('#all', function() {
    it('retrieves all objects stored within a namespace', function() {
      var store = new Store();
      store.add('tags', { id: 100 });

      expect(store.all('tags')).to.have.length(1);
    });
  });

  describe('#clear', function() {
    it('removes all models in a namespace', function() {
      var store = new Store();

      store.add('tags', { id: 100 });
      store.add('tags', { id: 101 });
      store.clear('tags');

      expect(store.all('tags')).to.be.empty;
    });
  });

  describe('#some', function() {
    it('retrieves each from a list of ids', function() {
      var store   = new Store();
      var objectA = { id: 100 };
      var objectB = { id: 101 };

      store.add('tags', objectA);
      store.add('tags', objectB);

      expect(store.some('tags', [100, 101])).to.have.length(2);
    });
  });

  describe('#where', function() {
    it('retrieves all objects where a condition is true', function() {
      var store = new Store();

      store.add('tags', { id: 100, name: 'alpha', group: 'greek' });
      store.add('tags', { id: 101, name: 'beta',  group: 'greek' });

      expect(store.where('tags', { name: 'beta' })).to.have.length(1);
    });
  });

  describe('#count', function() {
    it('counts the number of objects within a namespace', function() {
      var store = new Store();

      store.add('tags', { id: 100 });
      store.add('tags', { id: 101 });

      expect(store.count('tags')).to.eq(2);
    });
  });

  describe('#parse', function() {
    var payload = {
      thing:    { id: 1 },
      authors:  [{ id: 1 }],
      comments: [{ id: 1 }, { id: 2 }],
      posts:    [{ id: 1 }, { id: 2 }]
    }

    it('extracts a payload of rooted arrays into corresponding buckets', function() {
      var store = new Store();

      store.parse(payload);

      expect(store.count('things')).to.eq(1);
      expect(store.count('authors')).to.eq(1);
      expect(store.count('comments')).to.eq(2);
      expect(store.count('posts')).to.eq(2);
    });
  });

  describe('#destroy', function() {
    it('removes the model from its bucket', function() {
      var store   = new Store();

      store.add('tags', { id: 100 });
      store.destroy({ namespace: 'tags', id: 100 });

      expect(store.count('tags')).to.eq(0);
    });

    it('instructs the adapter to persist deletion', function() {
      var store   = new Store();
      var adapter = store.adapter;

      sinon.spy(adapter, 'destroy');

      store.add('tags', { id: 100 });
      store.destroy('tags', { id: 100 });

      expect(adapter.destroy).to.be.called;
    });
  });

  describe('#reload', function() {
    var server;
    var TagModel = Model.extend({
      path: function() {
        return '/tags/100'
      }
    });

    beforeEach(function() {
      server = sinon.fakeServer.create();
    });

    afterEach(function() {
      server.restore();
    });

    it('returns the updated model', function() {
      var adapter = new Adapter();
      var store   = new Store(adapter, { 'Tag': TagModel });
      var payload = {
        tag: { id: 100, name: 'beta', comment_ids: [1] },
        comments: [{ id: 1 }]
      };

      server.respondWith('GET', '/tags/100', [200, {}, JSON.stringify(payload)]);

      store.add('tags', { id: 100, name: 'alpha' });

      var model  = store.get('tags', 100);
      var promise = store.reload(model).then(function(result) {
        expect(store.count('comments')).to.eq(1);
        expect(result.id).to.eq(model.id);
      });

      server.respond();

      return promise;
    });

    it('instructs the adapter to reload the model', function() {
      var store   = new Store();
      var adapter = store.adapter;

      sinon.spy(adapter, 'read');

      store.add('tags', { id: 100 });
      store.reload({ id: 100 });

      expect(adapter.read).to.be.called;
    });
  });

  describe('#save', function() {
    it('instructs the adapter to update the model', function() {
      var store   = new Store();
      var adapter = store.adapter;
      var model   = store.build('tags', { id: 100 });

      sinon.spy(adapter, 'update');

      store.save(model);

      expect(adapter.update).to.be.called;
    });
  });

  describe('#events', function() {
    it('registers and listens for events', function() {
      var store     = new Store();
      var callbackA = sinon.spy();
      var callbackB = sinon.spy();
      var callbackC = sinon.spy();

      store.on('foo:change', callbackA, this);
      store.on('foo:change', callbackB, this);
      store.on('bar:change', callbackC, this);

      store.emit('foo:change', 'value');

      expect(callbackA).to.be.calledWith('value');
      expect(callbackB).to.be.calledWith('value');
      expect(callbackC).not.to.be.called;
    });

    it('removes registered event listeners', function() {
      var store     = new Store();
      var callbackA = sinon.spy();
      var callbackB = sinon.spy();

      store.on('foo:change', callbackA, this);
      store.on('foo:change', callbackB, this);
      store.emit('foo:change');

      store.off('foo:change', callbackA, this);
      store.emit('foo:change');

      expect(callbackA).to.be.calledOnce;
      expect(callbackB).to.be.calledTwice;

      store.off('foo:change', null, null);
      store.emit('foo:change');

      expect(callbackB).to.be.calledTwice;
    });
  });
});
