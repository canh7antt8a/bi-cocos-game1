var AuthUser = require('AuthUser');

var MessageBoxCache = {
    _cache: null,

    CACHE_KEY_STORAGE: 'mess_cache',
    USER_KEY: '_user',
    MAX_ITEMS: 100,

    initCache: function (key) {
        if (!this._cache) {
            this._cache = JSON.parse(cc.sys.localStorage.getItem(this.CACHE_KEY_STORAGE)) || {};
        }
        if (this._cache[this.USER_KEY] !== AuthUser.username) {
            this.resetCache();
            this._cache[this.USER_KEY] = AuthUser.username;
        }
        this._cache[key] = this._cache[key] || [];
    },
    saveCache: function () {
        cc.sys.localStorage.setItem(this.CACHE_KEY_STORAGE, JSON.stringify(this._cache));
    },
    resetCache: function () {
        this._cache = {};
        cc.sys.localStorage.removeItem(this.CACHE_KEY_STORAGE);
    },

    addMessages: function (key, messages) {
        var i, j, allowAdd;
        this.initCache(key);
        for (j = 0; j < messages.length; j += 1) {
            allowAdd = true;
            for (i = 0; i < this._cache[key].length; i += 1) {
                if (this._cache[key][i].msgid === messages[j].msgid) {
                    allowAdd = false;
                    break;
                }
            }
            if (allowAdd) {
                this._cache[key].push(messages[j]);
            }
        }
        this._cache[key].sort(function (m1, m2) {
            return m2.created_time.localeCompare(m1.created_time);
        });
        this._cache[key] = this._cache[key].slice(0, this.MAX_ITEMS);
        this.saveCache(key);
    },

    getMessages: function (key) {
        this.initCache(key);
        return this._cache[key];
    },

    updateMessage: function (key, message) {
        this.initCache(key);
        for (var i = 0; i < this._cache[key].length; i += 1) {
            if (this._cache[key][i].msgid === message.msgid) {
                cc.js.mixin(this._cache[key][i], message);
                break;
            }
        }
        this.saveCache(key);
    },

    getIndexMessage: function (key, messageId) {
        for (var i = 0; i < this._cache[key].length; i += 1) {
            if (this._cache[key][i].msgid === messageId) {
                return i;
            }
        }
    },

    removeMessage: function (key, messageId) {
        this.initCache(key);
        for (var i = 0; i < this._cache[key].length; i += 1) {
            if (this._cache[key][i].msgid === messageId) {
                this._cache[key].splice(i, 1);
                break;
            }
        }
        this.saveCache(key);
    },
};

module.exports = MessageBoxCache;
