var chai      = require('chai');
var sinon     = require('sinon');
var sinonChai = require('sinon-chai');
var Adapter   = require('../lib/Adapter');
var Model     = require('../lib/Model');
var Store     = require('../lib/Store');

chai.use(sinonChai);

describe('Store Integration', function() {
  var adapter, server;

  var Tag = Model.extend({
    path: function() {
      var base = this.constructor.path();

      return this.id ? base + '/' + this.id : base;
    }
  });

  Tag.path = function() {
    return '/tags';
  };

  beforeEach(function() {
    adapter = new Adapter();
    server  = sinon.fakeServer.create();
  });

  afterEach(function() {
    server.restore();
  });

  it ('fetches multiple remote objects', function() {
    var store = new Store(adapter, { Tag: Tag });
    var payload = { tags: [{ id: 100 }, { id: 101 }] };

    server.respondWith('GET', '/tags', [
      200, {}, JSON.stringify(payload)
    ]);

    var promise = store.find('tags').then(function(tags) {
      expect(tags).to.have.length(2);
      expect(tags.map(t => t.id)).to.eql([100, 101]);
    });

    server.respond();

    return promise;
  });

  it('fetches a single remote object', function() {
    var store = new Store(adapter, { Tag: Tag });
    var payload = { tag: { id: 101 } };

    server.respondWith('GET', '/tags/101', [
      200, {}, JSON.stringify(payload)
    ]);

    var promise = store.find('tags', 101).then(function(tag) {
      expect(tag).to.exist;
      expect(tag.id).to.eq(101);
    });

    server.respond();

    return promise;
  });

  it('inserts a created model into the store on save', function() {
    var store   = new Store(adapter, { Tag: Tag });
    var payload = { tag: { id: 101, name: 'alpha' } };
    var model   = store.build('tags', { name: 'alpha' });

    server.respondWith('POST', '/tags', [
      201, {}, JSON.stringify(payload)
    ]);

    var promise = model.save().then(function(tag) {
      expect(tag).to.exist;
      expect(tag.id).to.eq(101);
      expect(tag.get('name')).to.eq('alpha');
      expect(store.count('tags')).to.eq(1);
      expect(store.get('tags', 101)).to.eql(tag);
    });

    server.respond();

    return promise;
  });
});
