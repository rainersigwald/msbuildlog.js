var assert = require('assert');
var fs = require('fs');
var chai = require('chai');
var MSBuildLog = require('../lib/msbuildlog.js');
    
chai.should();

describe('MSBuildLog', function() {
  var bufferFromDisk = fs.readFileSync('test/data/trivial.binlog', {flag: 'r'});

  describe('constructor', function() {
    it('accepts a Node Buffer', function(){
      var log = new MSBuildLog(bufferFromDisk);
    });

    it('reads correct FileFormatVersion', function(){
      var log = new MSBuildLog(bufferFromDisk);

      log.fileFormatVersion.should.equal(6);
    });
  });
});
