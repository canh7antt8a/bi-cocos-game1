/*jslint bitwise: true */

var Base64 = require('Base64');

var Cipher = {
    _getRandomInt: function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    encode: function (input) {
        var output = '',
            i,
            key = [],
            keyLength = this._getRandomInt(10, 20);
        for (i = 0; i < keyLength; i += 1) {
            key.push(this._getRandomInt(0, 25));
        }
        for (i = 0; i < input.length; i += 1) {
            output += String.fromCharCode(input.charCodeAt(i) ^ key[i % keyLength]);
        }
        key.unshift(keyLength);
        for (i = 0; i <= keyLength; i += 1) {
            key[i] += 97;
            key[i] = Math.random() > 0.5 ? String.fromCharCode(key[i]).toUpperCase() : String.fromCharCode(key[i]);
        }
        output = Base64.encode(output);
        return key.join('') + output;
    },
    decode: function (input) {
        try {
            var keyLength = input[0].toLowerCase().charCodeAt(0) - 97,
                output = '',
                encryptText, key = [],
                i;
            for (i = 0; i < keyLength; i += 1) {
                key.push(input[i + 1].toLowerCase().charCodeAt(0) - 97);
            }
            encryptText = input.slice(keyLength + 1);
            encryptText = Base64.decode(encryptText);
            for (i = 0; i < encryptText.length; i += 1) {
                output += String.fromCharCode(encryptText.charCodeAt(i) ^ key[i % keyLength]);
            }
            return output;
        }
        catch (e) {
            return;
        }
    }
};

module.exports = {
    key: '_u',
    set: function (username, password) {
        cc.sys.localStorage.setItem(this.key, Cipher.encode(username + ' ' + password));
    },
    get: function () {
        var data = cc.sys.localStorage.getItem(this.key),
            result = {};
        try {
            data = Cipher.decode(data);
            data = data.split(' ');
            result.username = data[0];
            result.password = data[1];
        }
        catch (e) {}
        return result;
    },
    remove: function () {
        var info = this.get();
        // remove saved password only
        this.set(info.username || '', '');
    }
};
