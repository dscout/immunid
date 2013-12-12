describe('Osteo.Sideload', function() {
  describe('.idKeys', function() {
    it('converts pluralized keys into id keys', function() {
      var object = { tags: null, comments: null };

      expect(Osteo.Sideload.idKeys(object))
        .to.eql({ tags: 'tag_ids', comments: 'comment_ids' });
    });
  });

  describe('.associate', function() {
    it('re-associates sideloaded objects with the root objects', function() {
      var payload, associated;

      payload = {
        posts: [
          { id: 1, tag_ids: [1, 2], comment_ids: [1] },
          { id: 2, tag_ids: [3], comment_ids: [] }
        ],
        tags:     [{ id: 1 }, { id: 2 }, { id: 3 }],
        comments: [{ id: 1 }]
      };

      associated = Osteo.Sideload.associate(payload, 'posts');

      expect(associated[0].tags).to.eql([{ id: 1 }, { id: 2 }]);
      expect(associated[1].tags).to.eql([{ id: 3 }]);
      expect(associated[0].comments).to.eql([{ id: 1 }]);
      expect(associated[1].comments).to.eql([]);
    });
  });
});
