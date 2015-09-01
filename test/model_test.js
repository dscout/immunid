var chai      = require('chai');
var sinon     = require('sinon');
var sinonChai = require('sinon-chai');
var expect    = chai.expect;
var Model     = require('../lib/Model');
var Store     = require('../lib/Store');

chai.use(sinonChai);

describe('Model', function() {
  var Tag   = Model.extend({}),
      store = new Store(null, { Tag: Tag });

  describe('.path', function() {
    it('defines abstract path functions', function() {
      expect(function() {
        Tag.path()
      }).to.throw(Error);
    });
  });

  describe('#path', function() {
    it('defaults to the constructor path without an id', function() {
      Tag.path = function() { return '/tags' };

      expect(new Tag().path()).to.eq('/tags');
    });

    it('includes the model id when present', function() {
      Tag.path = function() { return '/tags' };

      var tag = new Tag({ id: 100 });

      expect(tag.path()).to.eq('/tags/100');
    });
  });

  describe('#initialize', function() {
    it('calls initialize immediately after construction', function() {
      sinon.spy(Tag.prototype, 'initialize');

      var attr = { id: 100 };
      var opts = { opt: true };
      var tag  = new Tag(attr, opts);

      expect(tag.initialize.calledOnce).to.be.true;
      expect(tag.initialize.calledWith(attr, opts)).to.be.true;
    });
  });

  describe('#isNew', function() {
    it('is the boolean presence of an id attribute', function() {
      var tag1 = new Tag();
      var tag2 = new Tag({ id: 100 });

      expect(tag1.isNew()).to.be.true;
      expect(tag2.isNew()).to.be.false;
    });
  });

  describe('#mixins', function() {
    it('merges any mixins during construction', function() {
      var SomeMixin = {
        tag: function() {
          return 'tagtastic';
        }
      };

      var Mixinified = Model.extend({
        mixins: [SomeMixin]
      });

      var instance = new Mixinified();

      expect(instance.tag()).to.eq('tagtastic');
    });
  });

  describe('#dump', function() {
    it('provides a clone of the attributes', function() {
      var tag = new Tag({ id: 100, name: 'alpha' });

      expect(tag.dump()).to.eql({
        id: 100,
        name: 'alpha'
      });
    });

    it('provides a rooted object', function() {
      var tag = new Tag({ id: 100, name: 'alpha' }, { namespace: 'tags' });

      expect(tag.dump({ rooted: true })).to.eql({
        tag: { id: 100, name: 'alpha' }
      });
    });
  });

  describe('#toJSON', function() {
    it('provides a rooted dump', function() {
      var tag = new Tag({ id: 100, name: 'alpha' }, { namespace: 'tags' });

      expect(tag.toJSON()).to.eql({
        tag: { id: 100, name: 'alpha' }
      });
    });
  });

  describe('#get', function() {
    it('fetches set properties', function() {
      var tag = new Tag({ name: 'alpha' });

      expect(tag.get('name')).to.eq('alpha');
    });
  });

  describe('#has', function() {
    it('is the boolean presence of an attribute', function() {
      var tag = new Tag({
        name:    'alpha',
        bool:    false,
        blank:   '',
        empty:   null,
        missing: undefined
      });

      expect(tag.has('name')).to.be.true;
      expect(tag.has('bool')).to.be.true;
      expect(tag.has('blank')).to.be.true;
      expect(tag.has('empty')).to.be.false;
      expect(tag.has('missing')).to.be.false;
    });
  });

  describe('#set', function() {
    it('sets properites in key, value form', function() {
      var tag = store.build('tags', {});

      tag.set('name', 'alpha');

      expect(tag.get('name')).to.eq('alpha');
    });

    it('sets properties from an object', function() {
      var tag = store.build('tags', {});

      tag.set({ name: 'alpha' });

      expect(tag.get('name')).to.eq('alpha');
    });

    it('triggers a change event through the store', function() {
      var store   = new Store(null, { Tag: Tag }),
          tag     = store.build('tags', { name: 'alpha', page: 'index' }),
          emitSpy = sinon.spy(store, 'emit');

      tag.set({ name: 'beta', page: 'title' });

      expect(emitSpy).to.be.calledWith('tags:change', tag);
    });

    it('does not trigger events when nothing changes', function() {
      var store   = new Store(null, { Tag: Tag }),
          tag     = store.build('tags', { name: 'alpha' }),
          emitSpy = sinon.spy(store, 'emit');

      tag.set({ name: 'alpha' });

      expect(emitSpy).not.to.be.called;
    });
  });

  describe('#unset', function() {
    it('removes an attribute from the model', function() {
      var store   = new Store(null, { Tag: Tag }),
          tag     = store.build('tags', { name: 'alpha' });
          emitSpy = sinon.spy(store, 'emit');

      tag.unset('name');

      expect(tag.has('name')).to.be.false;
      expect(emitSpy).to.be.calledWith('tags:change', tag);
    });
  });

  describe('#clear', function() {
    it('clears all attributes on the model', function() {
      var store   = new Store(null, { Tag: Tag }),
          tag     = store.build('tags', { id: 1, name: 'alpha' }),
          emitSpy = sinon.spy(store, 'emit');

      tag.clear();

      expect(tag.get('id')).to.be.undefined;
      expect(tag.get('name')).to.be.undefined;

      expect(emitSpy).to.be.calledWith('tags:change', tag);
    });
  });

  describe('#reload', function() {
    it('delegates a reload to the store', function() {
      var reload = sinon.spy();
      var store  = { reload: reload };
      var tag    = new Tag({ id: 1 }, { store: store });

      tag.reload();

      expect(reload).to.be.calledWith(tag);
    });
  });

  describe('#destroy', function() {
    it('deletes the model remotely', function() {
      var destroy = sinon.spy();
      var store   = { destroy: destroy };
      var tag     = new Tag({ id: 1 }, { store: store });

      tag.destroy();

      expect(destroy).to.be.calledWith(tag);
    });
  });

  describe('#save', function() {
    it('updates the model and persists the changes', function() {
      var save  = sinon.spy();
      var store = { save: save };
      var tag   = new Tag({ id: 1 }, { store: store });

      tag.save();

      expect(save).to.be.calledWith(tag);
    });
  });
});
