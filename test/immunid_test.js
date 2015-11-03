var expect  = require('chai').expect;
var Immunid = require('../immunid');

describe('Immunid', function() {
  it('defines all sub-modules on the required object', function() {
    expect(Immunid.Model).to.exist;
    expect(Immunid.Store).to.exist;
    expect(Immunid.Adapter).to.exist;
    expect(Immunid.Relation).to.exist;
    expect(Immunid.Events).to.exist;
  });
});
