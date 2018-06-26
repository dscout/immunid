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

  describe('any request', function() {
    var request, xhr;

    beforeEach(function() {
      xhr = sinon.useFakeXMLHttpRequest();

      xhr.onCreate = function(anXhr) {
        request = anXhr;
      }
    });

    afterEach(function() {
      request = null;
      xhr.restore();
    });

    it('injects headers into the request', function() {
      var adapter = new Adapter({ headers: {
        'Accept' : 'application/json'
      }});

      adapter.read({ path: function() { return '/comments' } });

      expect(request.requestHeaders.Accept).to.eq('application/json');
    });

    it('prepends the host to the path', function() {
      var adapter = new Adapter({ host: 'https://example.com' });

      adapter.read({ path: function() { return '/comments' } });

      expect(request.url).to.eq('https://example.com/comments');
    });
  });

  it('catches failed requests with provided catcher', function(done) {
    server.respondWith('GET', '/comments/1', [
      401, { 'Content-Type': 'application/json' }, ''
    ]);

    var catcher = sinon.spy();
    var adapter = new Adapter({ catcher });

    adapter
      .read({ path: function() { return '/comments/1' } })
      .catch(function(response) {
        expect(catcher).to.be.calledOnce;

        done();
      });

    server.respond();
  })

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
