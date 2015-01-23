var chai      = require('chai');
var sinon     = require('sinon');
var sinonChai = require('sinon-chai');
var Adapter   = require('../lib/Adapter');
var Model     = require('../lib/Model');
var Store     = require('../lib/Store');

chai.use(sinonChai);

describe('Store Integration', function() {
  var server;

  beforeEach(function() {
    server = sinon.fakeServer.create();
  });

  afterEach(function() {
    server.restore();
  });

  it('falls back to fetching a remote object', function() {
    var Tag = Model.extend({
      path: function() {
        return '/tags/' + this.id;
      }
    });

    var adapter = new Adapter();
    var store   = new Store(adapter, { Tag: Tag });

    server.respondWith(
      'GET',
      '/tags/101',
      [200, {}, JSON.stringify({ tag: { id: 101 }})]
    )

    var promise = store.find('tags', 101).then(function(tag) {
      expect(tag).to.exist;
      expect(tag.id).to.eq(101);
    });

    server.respond();

    return promise;
  });
});
