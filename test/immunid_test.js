var expect  = require('chai').expect;
var Immunid = require('../immunid');

describe('Immunid', function() {
  it('defines all sub-modules on the required object', function() {
    expect(Immunid.Model).not.to.be.undefined;
  });
});
