'use strict';

var pako = require('pako');
var Stream = require('stream');

var BinaryLogRecordKind = Object.freeze({
    EndOfFile: 0,
    BuildStarted: 1,
    BuildFinished: 2,
    ProjectStarted: 3,
    ProjectFinished: 4,
    TargetStarted: 5,
    TargetFinished: 6,
    TaskStarted: 7,
    TaskFinished: 8,
    Error: 9,
    Warning: 10,
    Message: 11,
    TaskCommandLine: 12,
    CriticalBuildMessage: 13,
    ProjectEvaluationStarted: 14,
    ProjectEvaluationFinished: 15,
    ProjectImported: 16,
    ProjectImportArchive: 17,
    TargetSkipped: 18
});


module.exports = class MSBuildLog {
    constructor(compressed) {
        var myStream = new Stream.Readable();
        myStream.uncompressed = pako.inflate(compressed);
        myStream.bytesRead = 0;

        myStream._read = function(size) {
            var pushed = true;
            var initialIndex = this.bytesRead;

            pushed = this.push(this.uncompressed.slice(initialIndex, initialIndex + size));
            this.bytesRead = initialIndex + size;

            if (this.bytesRead === this.uncompressed.length) {
                this.push(null);
            }
        };

        this.fileFormatVersion = myStream.read(4).readInt32LE(0);

        if (this.fileFormatVersion > 7){
            throw "File format too new";
        }

        var firstRecordKind = myStream.read(1).readInt8(0);

        var result;

        switch (firstRecordKind) {
            case BinaryLogRecordKind.EndOfFile:
                break;
            case BinaryLogRecordKind.BuildStarted:
                result = this.ReadBuildStartedEventArgs();
                break;
        }
    }

    ReadBuildStartedEventArgs() {
        // var fields = ReadBuildEventArgsFields();
        // var environment = ReadStringDictionary();
    
        // var e = new BuildStartedEventArgs(
        //     fields.Message,
        //     fields.HelpKeyword,
        //     environment);
        // SetCommonFields(e, fields);
        // return e;
    }
    
};