var EventDispatcher = require('EventDispatcher'),
    CommonConstant = require('CommonConstant'),
    EventDispatcherConstant = require('EventDispatcherConstant');

var AuthUser = {
    updateInfo: function (userInfo) {
        cc.js.mixin(this, userInfo);
    },
};

EventDispatcher.addEventListener(EventDispatcherConstant.PROFILE.UPDATE_MONEY, function (params) {
    if (params && params.username === AuthUser.username) {
        AuthUser.currencies[params.currency].balance = params.money;
    }
});

EventDispatcher.addEventListener(EventDispatcherConstant.PROFILE.UPDATE_EXP, function (params) {
    if (params && params.username === AuthUser.username) {
        AuthUser.experience = AuthUser.experience || 0;
        AuthUser.experience += params.exp;
    }
});

EventDispatcher.addEventListener(CommonConstant.PushMessageType.UPDATE_USER_INFO.EVENT, function (params) {
    if (params && params.content) {
        AuthUser.updateInfo(JSON.parse(params.content));
        EventDispatcher.dispatchEvent(EventDispatcherConstant.PROFILE.UPDATE_UNREAD_MESS_COUNT);
    }
});

module.exports = AuthUser;
