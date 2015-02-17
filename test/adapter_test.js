var chai    = require('chai').expect;
var Adapter = require('../lib/Adapter');

describe('Adapter', function() {
  var server;

  beforeEach(function() {
    server = sinon.fakeServer.create();
  });

  afterEach(function() {
    server.restore();
  });

  describe('#_buildRequest', function() {
    it('injects headers into the request', function() {
      var adapter = new Adapter({ headers: {
        'Accept' : 'application/json'
      }});

      var request = adapter._buildRequest('GET', '/');

      expect(request.header).to.have.keys('Accept')
    });

    it('prepends the host to the path', function() {
      var adapter = new Adapter({ host: 'https://example.com' });
      var request = adapter._buildRequest('GET', '/stuff');

      expect(request.url).to.eq('https://example.com/stuff');
    });
  });

  describe('#read', function() {
    it('peforms a GET request with object URL', function(done) {
      server.respondWith('GET', '/comments/1', [
        200, { 'Content-Type': 'application/json' },
        '{"id": 12}'
      ]);

      var adapter = new Adapter();
      var model   = { path: function() {
          return '/comments/1'
        }
      };

      adapter.read(model).then(function(response) {
        expect(response.body).to.eql({ id: 12 });
        done();
      });

      server.respond();
    });
  });

  describe('#create', function() {
    it('performs a POST request with model JSON', function(done) {
      server.respondWith('POST', '/comments', [
        200, { 'Content-Type': 'application/json' },
        '{"id": 12,"body":"Yay!"}'
      ]);

      var adapter = new Adapter();
      var model   = {
        path:   function() { return '/comments'; },
        toJSON: function() { return { body: 'Yay!' } }
      };

      adapter.create(model).then(function(response) {
        expect(response.body).to.eql({ id: 12, body: 'Yay!' });
        done();
      });

      server.respond();
    });
  });
});
