'use strict';

var Int64 = require('node-int64')
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

    Read7BitEncodedInt() {
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

    ReadInt8() {
        return this.Read7BitEncodedInt();
    }

    ReadInt32() {
        return this.Read7BitEncodedInt();
    }

    ReadInt32Raw() {
        var val = this.buffer.slice(this.bytesRead, this.bytesRead + 4).readInt32LE(0);
        this.bytesRead = this.bytesRead + 4;

        return val;
    }

    ReadInt64() {
        var slice = this.buffer.slice(this.bytesRead, this.bytesRead + 8);
        
        var val = new Int64(slice);
        this.bytesRead = this.bytesRead + 8;

        return val;
    }

    ReadString() {
        var lengthInBytes = this.ReadInt8();
        
        var val = this.buffer.slice(this.bytesRead, this.bytesRead + lengthInBytes).toString();
        this.bytesRead = this.bytesRead + lengthInBytes;

        return val;
    }
}

class BuildEventArgsFields {

}

module.exports = class MSBuildLog {
    constructor(compressed) {
        this.uncompressed = new AdvancingBuffer(pako.inflate(compressed));

        this.fileFormatVersion = this.uncompressed.ReadInt32Raw();

        if (this.fileFormatVersion > 7){
            throw "File format too new";
        }

        var firstRecordKind = this.uncompressed.ReadInt8();

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
        var environment = this.ReadStringDictionary();
    
        // var e = new BuildStartedEventArgs(
        //     fields.Message,
        //     fields.HelpKeyword,
        //     environment);
        // SetCommonFields(e, fields);
        // return e;
    }
    
    ReadBuildEventArgsFields() {
        var flags = this.uncompressed.ReadInt32();
        var result = new BuildEventArgsFields();

        if ((flags & BuildEventArgsFieldFlags.Message) != 0)
        {
            result.Message = this.uncompressed.ReadString();
        }
        
        if ((flags & BuildEventArgsFieldFlags.BuildEventContext) != 0)
        {
            result.BuildEventContext = this.ReadBuildEventContext();
        }

        if ((flags & BuildEventArgsFieldFlags.ThreadId) != 0)
        {
            result.ThreadId = this.uncompressed.ReadInt32();
        }

        if ((flags & BuildEventArgsFieldFlags.HelpHeyword) != 0)
        {
            result.HelpKeyword = this.uncompressed.ReadString();
        }

        if ((flags & BuildEventArgsFieldFlags.SenderName) != 0)
        {
            result.SenderName = this.uncompressed.ReadString();
        }

        if ((flags & BuildEventArgsFieldFlags.Timestamp) != 0)
        {
            result.Timestamp = this.ReadDateTime();
        }

        if ((flags & BuildEventArgsFieldFlags.Subcategory) != 0)
        {
            result.Subcategory = this.uncompressed.ReadString();
        }

        if ((flags & BuildEventArgsFieldFlags.Code) != 0)
        {
            result.Code = this.uncompressed.ReadString();
        }

        if ((flags & BuildEventArgsFieldFlags.File) != 0)
        {
            result.File = this.uncompressed.ReadString();
        }

        if ((flags & BuildEventArgsFieldFlags.ProjectFile) != 0)
        {
            result.ProjectFile = this.uncompressed.ReadString();
        }

        if ((flags & BuildEventArgsFieldFlags.LineNumber) != 0)
        {
            result.LineNumber = this.uncompressed.ReadInt32();
        }

        if ((flags & BuildEventArgsFieldFlags.ColumnNumber) != 0)
        {
            result.ColumnNumber = this.uncompressed.ReadInt32();
        }

        if ((flags & BuildEventArgsFieldFlags.EndLineNumber) != 0)
        {
            result.EndLineNumber = this.uncompressed.ReadInt32();
        }

        if ((flags & BuildEventArgsFieldFlags.EndColumnNumber) != 0)
        {
            result.EndColumnNumber = this.uncompressed.ReadInt32();
        }

        return result;
    }

    ReadDateTime() {
        var ticks = this.uncompressed.ReadInt64();
        var kind = this.uncompressed.ReadInt32();
    }

    ReadStringDictionary() {
        var count = this.uncompressed.ReadInt32();

        var result = {};

        for (let i = 0; i < count; i++) {
            var key = this.uncompressed.ReadString();
            var value = this.uncompressed.ReadString();

            result[key] = value;
        }

        return result;
    }
};