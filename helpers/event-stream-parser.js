var stream = require("stream");
var util = require("util");

module.exports = function (options) {
    return new JSONStream(options);
};

util.inherits(JSONStream, stream.Transform);
function JSONStream (options) {
    options = options || {};
    stream.Transform.call(this, options);
    this._writableState.objectMode = false;
    this._readableState.objectMode = true;
    this._async = options.async || false;
    this._objectEndIndex = objectEndIndexMaker(options.terminatingChar || "\n");
};

JSONStream.prototype._transform = function (data, encoding, callback) {
    if (!Buffer.isBuffer(data)) {
        data = new Buffer(data);
    }

    if (this._buffer) {
        data = Buffer.concat([this._buffer, data]);
    }

    for (var start = 0, end = 0; end = this._objectEndIndex(data, end);) {
        try {
            var b = this.push(JSON.parse(data.slice(start, end)));
            start = end;
            if (!b) {
                break;
            }
        } catch (ex) {
            // ignore errors
        }
    }

    this._buffer = start === data.length ? null : data.slice(start);

    if (this._async) {
        setImmediate(callback);
    } else {
        callback();
    }
};

function objectEndIndexMaker (terminatingChar) {
    var code =  terminatingChar.charCodeAt(0);

    return function (data, start) {
        var len = data.length;

        for (var i = start; i < len; i++) {
            if (data[i] === code) {
                return i+1;
            }
        }
        return null;
    };
}
