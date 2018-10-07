/*jslint bitwise: true */

var Utils = require('Utils'),
    Base64 = require('Base64'),
    FetchHandler;

FetchHandler = Utils.Class({

    setWaitingButton: function (buttonNode) {
        this._buttonComponent = buttonNode.getComponent(cc.Button);
        this._buttonComponent.interactable = false;
        return this;
    },

    error: function (callback) {
        if (callback) {
            this._error_callback = callback;
        }
        return this;
    },

    onError: function (xhr) {
        if (this._buttonComponent) {
            this._buttonComponent.interactable = true;
        }
        if (this._error_callback) {
            try {
                this._error_callback(xhr);
            }
            catch (e) {}
        }
    },

    success: function (callback) {
        if (callback) {
            this._success_callback = callback;
        }
        return this;
    },

    onSuccess: function (successData) {
        if (this._buttonComponent) {
            this._buttonComponent.interactable = true;
        }
        if (this._success_callback) {
            try {
                this._success_callback(successData);
            }
            catch (e) {}
        }
    }

});

if (!XMLHttpRequest.prototype.sendAsBinary) {
    XMLHttpRequest.prototype.sendAsBinary = function (sData) {
        var nBytes = sData.length,
            ui8Data = new Uint8Array(nBytes);
        for (var nIdx = 0; nIdx < nBytes; nIdx += 1) {
            ui8Data[nIdx] = sData.charCodeAt(nIdx) & 0xff;
        }
        this.send(ui8Data);
    };
}

module.exports = {
    init: function (host, port, protocol, auth_user, auth_pass) {
        protocol = protocol || 'http';
        this.base_url = protocol + '://' + host + ':' + port;
        this._cache = {};
        if (auth_user && auth_pass) {
            this.auth_header = 'Basic ' + Base64.encode(auth_user + ':' + auth_pass);
        }
    },

    updateBaseUrl: function (base_url) {
        this.base_url = base_url;
    },

    addInterceptor: function (interceptor) {
        if (!this.interceptors) {
            this.interceptors = [];
        }
        this.interceptors.push(interceptor);
    },

    _generateBoundary: function () {
        return 'AJAX-----------------------' + (new Date()).getTime();
    },

    _hasFileUpload: function (params) {
        for (var name in params) {
            if (Utils.Type.isObject(params[name])) {
                return true;
            }
        }
        return false;
    },

    _buildMessage: function (params, boundary) {
        var CRLF = '\r\n';
        var parts = [],
            param;

        for (var name in params) {
            param = params[name];
            var part = '';

            if (Utils.Type.isObject(param)) {
                /*
                 * Content-Disposition header contains name of the field used
                 * to upload the file and also the name of the file as it was
                 * on the user's computer.
                 */
                part += 'Content-Disposition: form-data; ';
                part += 'name="' + name + '"; ';
                part += 'filename="' + param.fileName + '"' + CRLF;

                /*
                 * Content-Type header contains the mime-type of the file to
                 * send. Although we could build a map of mime-types that match
                 * certain file extensions, we'll take the easy approach and
                 * send a general binary header: application/octet-stream.
                 */
                part += 'Content-Type: application/octet-stream' + CRLF + CRLF;

                /*
                 * File contents read as binary data, obviously
                 */
                part += param.value + CRLF;
            }
            else {
                /*
                 * In case of non-files fields, Content-Disposition contains
                 * only the name of the field holding the data.
                 */
                part += 'Content-Disposition: form-data; ';
                part += 'name="' + name + '"' + CRLF + CRLF;

                /*
                 * Field value
                 */
                part += param + CRLF;
            }

            parts.push(part);
        }

        var request = '--' + boundary + CRLF;
        request += parts.join('--' + boundary + CRLF);
        request += '--' + boundary + '--' + CRLF;

        return request;
    },

    _getKeyCache: function (method, path, params) {
        var keyCache = method + path;
        Object.keys(params).sort().forEach(function (key) {
            keyCache += '&' + key + '=' + params[key];
        });
        return keyCache;
    },

    resetCache: function () {
        this._cache = {};
    },

    fetch: function (method, path, params, options) {
        var boundary, i, xhr,
            that = this,
            now = new Date().getTime(),
            fetchHandler = new FetchHandler(),
            keyCache = this._getKeyCache(method, path, params),
            url = this.base_url + path;

        options = options || {};
        if (options.cache > 0) {
            if (keyCache in this._cache && this._cache[keyCache].expire > now) {
                setTimeout(function () {
                    fetchHandler.onSuccess(that._cache[keyCache].data);
                }, options.delay || 0);
                return fetchHandler;
            }
        }

        xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                var contentType = xhr.getResponseHeader('content-type');
                try {
                    if (contentType && contentType.indexOf('application/json') > -1) {
                        xhr.responseJson = JSON.parse(xhr.responseText);
                    }
                    for (i in that.interceptors) {
                        that.interceptors[i].response(xhr);
                    }
                    if (xhr.status >= 200 && xhr.status < 400) {
                        if (xhr.responseJson) {
                            if (xhr.responseJson.status === 1) {
                                fetchHandler.onSuccess(xhr.responseJson);

                                // cache data in seconds
                                if (options.cache > 0) {
                                    that._cache[keyCache] = {
                                        data: xhr.responseJson,
                                        expire: now + options.cache * 1000
                                    };
                                }
                            }
                            else {
                                fetchHandler.onError(xhr);
                            }
                        }
                        else {
                            cc.log('Http [response error]: no response');
                        }
                    }
                    else {
                        fetchHandler.onError(xhr);
                    }
                }
                catch (err) {
                    cc.log('Http [response error]: ' + xhr.responseText);
                    cc.log(err);
                }
            }
        };
        for (i in that.interceptors) {
            that.interceptors[i].request.apply(null, arguments);
        }

        function send() {
            if (method === 'GET') {
                xhr.open(method, url + '?' + Utils.String.param(params), true, that.auth_user, that.auth_pass);
                xhr.setRequestHeader('Authorization', that.auth_header);
                xhr.send();
            }
            else if (method === 'POST') {
                xhr.open(method, url, true, that.auth_user, that.auth_pass);
                xhr.setRequestHeader('Authorization', that.auth_header);

                if (that._hasFileUpload(params)) {
                    boundary = that._generateBoundary();
                    xhr.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + boundary);
                    xhr.sendAsBinary(that._buildMessage(params, boundary));
                }
                else {
                    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                    xhr.send(Utils.String.param(params));
                }
            }
            else {
                xhr.open(method, url, true);
                xhr.send();
            }
        }
        if (options.delay > 0) {
            setTimeout(send, options.delay);
        }
        else {
            send();
        }
        return fetchHandler;
    }
};
