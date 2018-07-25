'use strict';

var pako = require('pako');

module.exports = class MSBuildLog {
    constructor(compressed) {

        var uncompressed = pako.inflate(compressed);

        this.fileFormatVersion = uncompressed[0];
    }
};