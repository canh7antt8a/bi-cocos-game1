var Utils = require('Utils'),
    BaseEventDispatcher,
    StackEventDispatcher,
    EventDispatcher;

BaseEventDispatcher = Utils.Class({
    $$constructor: function () {
        this.clear();
    },

    clear: function () {
        this.eventListeners = {};
    },

    addEventListener: function (eventName, listener, scope) {
        if (Utils.Type.isUndefined(eventName)) {
            throw 'Event name must be defined';
        }

        if (Utils.Type.isFunction(listener)) {
            var listenerWrapper = {
                listener: listener,
                scope: scope
            };
            this.eventListeners[eventName] = this.eventListeners[eventName] || [];
            this.eventListeners[eventName].push(listenerWrapper);
            return listenerWrapper;
        }
    },

    removeEventListener: function (eventName, listener, scope) {
        if (Utils.Type.isFunction(listener)) {
            this.eventListeners[eventName] = this.eventListeners[eventName] || [];
            Utils.Array.remove(this.eventListeners[eventName], {
                listener: listener,
                scope: scope
            });
        }
    },

    dispatchEvent: function (eventName, obj) {
        var listeners = this.eventListeners[eventName] || [];
        Utils.Array.forEach(listeners, function (listenerWrapper) {
            try {
                this._execute(listenerWrapper, obj);
            }
            catch (e) {
                cc.error(e);
            }
        }.bind(this));
    },

    _execute: function (listenerWrapper, obj) {
        var listener = listenerWrapper.listener,
            scope = listenerWrapper.scope;
        try {
            if (scope) {
                listener.call(scope, obj);
            }
            else {
                listener(obj);
            }
        }
        catch (e) {
            cc.error(e);
        }
    }
});

StackEventDispatcher = Utils.Class({
    $$extends: BaseEventDispatcher,

    $$constructor: function (limit) {
        this.$super.constructor.call(this);
        this.limit = limit || 0;
    },

    clear: function () {
        this.$super.clear.call(this);
        this.events = [];
    },

    pushEvent: function (eventName, obj) {
        if (this.limit > 0) {
            Utils.Array.trimLeft(this.events, this.limit);
        }
        this.events.push({
            eventName: eventName,
            obj: obj,
            time: Date.now()
        });
    },

    popEvent: function () {
        return this.events.shift();
    },

    dispatchEvents: function (checkFn) {
        var events = this.events.splice(0),
            self = this;
        events.forEach(function (event) {
            if (Utils.Type.isFunction(checkFn) && !checkFn(event)) {
                return;
            }
            self.dispatchEvent(event.eventName, event.obj);
        });
    }
});

/**
 * Register and deregister event system.
 *
 * If 'cache' option is enabled, everywhen dispatching action is ocurred,
 * the event will be stored to allow lately registered handlers to be executed
 * immediately.
 */
EventDispatcher = Utils.Class({
    $$extends: BaseEventDispatcher,

    $$constructor: function (cache) {
        this.$super.constructor.call(this);
        this._setCache(cache);
    },

    clear: function () {
        this.$super.clear.call(this);
        this.clearCache();
    },

    clearCache: function () {
        this.cacheEvents = [];
    },

    disableCache: function () {
        this._setCache(false);
    },

    enableCache: function () {
        this._setCache(true);
    },

    _setCache: function (cache) {
        this.cache = cache;
        this.clearCache();
    },

    addEventListener: function (eventName, listener, scope) {
        var listenerWrapper = this.$super.addEventListener.call(this, eventName, listener, scope);
        if (listenerWrapper) {
            if (this.cache && this.cacheEvents) {
                Utils.Array.forEach(this.cacheEvents, function (event) {
                    if (event && event.eventName === eventName) {
                        this._execute(listenerWrapper, event.obj);
                    }
                }.bind(this));
            }
        }
    },

    dispatchEvent: function (eventName, obj) {
        this.$super.dispatchEvent.call(this, eventName, obj);
        if (this.cache) {
            this.cacheEvents.push({
                eventName: eventName,
                obj: obj
            });
        }
    },

    create: function (cache) {
        return new EventDispatcher(cache);
    },

    createStackEventDispatcher: function (limit) {
        return new StackEventDispatcher(limit);
    }
});

/**
 * Global EventDispatcher.
 *
 * @type {EventDispatcher}
 */
module.exports = new EventDispatcher();
