'use strict';

var pako = require('pako');

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

var BuildEventArgsFieldFlags = Object.freeze({
    None: 0,
    BuildEventContext: 1 << 0,
    HelpHeyword: 1 << 1,
    Message: 1 << 2,
    SenderName: 1 << 3,
    ThreadId: 1 << 4,
    Timestamp: 1 << 5,
    Subcategory: 1 << 6,
    Code: 1 << 7,
    File: 1 << 8,
    ProjectFile: 1 << 9,
    LineNumber: 1 << 10,
    ColumnNumber: 1 << 11,
    EndLineNumber: 1 << 12,
    EndColumnNumber: 1 << 13
});

class AdvancingBuffer {
    constructor(buffer){
        this.bytesRead = 0;
        this.buffer = Buffer.from(buffer);
    }

    read7BitEncodedInt() {
        var val = 0;
        var shift = 0;

        var currentByte = 0;

        do {
            currentByte = this.buffer.slice(this.bytesRead, this.bytesRead + 1).readInt8(0);
            this.bytesRead++;

            val = val | ((currentByte & 0x7F) << shift);
            shift += 7;
        } while ((currentByte & 0x80) != 0);

        return val;
    }

    readInt8() {
        return this.read7BitEncodedInt();
    }

    readInt32() {
        return this.read7BitEncodedInt();
    }

    readInt32Raw() {
        var val = this.buffer.slice(this.bytesRead, this.bytesRead + 4).readInt32LE(0);
        this.bytesRead = this.bytesRead + 4;

        return val;
    }

    readString() {
        var lengthInBytes = this.readInt8();
        
        var val = this.buffer.slice(this.bytesRead, this.bytesRead + lengthInBytes).toString();
        this.bytesRead = this.bytesRead + lengthInBytes;

        return val;
    }
}


module.exports = class MSBuildLog {
    constructor(compressed) {
        this.uncompressed = new AdvancingBuffer(pako.inflate(compressed));

        this.fileFormatVersion = this.uncompressed.readInt32Raw();

        if (this.fileFormatVersion > 7){
            throw "File format too new";
        }

        var firstRecordKind = this.uncompressed.readInt8();

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
        var fields = this.ReadBuildEventArgsFields();
        // var environment = ReadStringDictionary();
    
        // var e = new BuildStartedEventArgs(
        //     fields.Message,
        //     fields.HelpKeyword,
        //     environment);
        // SetCommonFields(e, fields);
        // return e;
    }
    
    ReadBuildEventArgsFields() {
        var flags = this.uncompressed.readInt32();
        // var result;

        if ((flags & BuildEventArgsFieldFlags.Message) != 0)
        {
            // result.Message = this.uncompressed.readString();
        }

        return result;
    }
};