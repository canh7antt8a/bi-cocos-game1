var EventDispatcher = require('EventDispatcher'),
    CommonConstant = require('CommonConstant'),
    EventDispatcherConstant = require('EventDispatcherConstant'),
    TinhNangManager = require('TinhNangManager'),
    Utils = require('Utils'),
    VALID_TIME_THRESHOLD = 2 * 60 * 1000, // 2 mins
    MAX_ITEMS = 25,
    RunningMessageStore;

RunningMessageStore = {
    MESSAGES: [],
    INGAME_MESSAGES: [],

    _add: function (msgObj, methodName) {
        if (msgObj) {
            if (msgObj.isIngame) {
                Utils.Array.trimLeft(this.INGAME_MESSAGES, MAX_ITEMS);
                this.INGAME_MESSAGES[methodName](msgObj);
            }
            else {
                Utils.Array.trimLeft(this.MESSAGES, MAX_ITEMS);
                this.MESSAGES[methodName](msgObj);
            }
            EventDispatcher.dispatchEvent(EventDispatcherConstant.RUNNING_MESSAGE.NEW_MESSAGE);
        }
    },

    push: function (msgObj) {
        this._add(msgObj, 'push');
    },

    pushTop: function (msgObj) {
        this._add(msgObj, 'unshift');
    },

    pop: function () {
        var msgObj = this.MESSAGES.shift();
        if (!msgObj) {
            msgObj = this.INGAME_MESSAGES.shift();
        }
        return msgObj;
    },

    clear: function () {
        this.MESSAGES = [];
        this.INGAME_MESSAGES = [];
    }
};

EventDispatcher.addEventListener(CommonConstant.PushMessageType.RUNNING.EVENT, function (params) {
    if (params && params.content && TinhNangManager.choPhep('nc')) {
        RunningMessageStore.push({
            content: params.content,
            target: params.target,
            targetId: params.targetId,
            times: params.times > 0 ? params.times : 1,
            isIngame: params.isIngame,
            expireAt: Date.now() + VALID_TIME_THRESHOLD
        });
    }
});

EventDispatcher.addEventListener(EventDispatcherConstant.TINH_NANG.NEW, function () {
    if (!TinhNangManager.choPhep('nc')) {
        RunningMessageStore.clear();
    }
});

module.exports = RunningMessageStore;
