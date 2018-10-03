var Utils = require('Utils'),
    UrlImage = require('UrlImage'),
    AuthUser = require('AuthUser'),
    UiManager = require('UiManager'),
    GameManager = require('GameManager'),
    AudioManager = require('AudioManager'),
    CommonConstant = require('CommonConstant'),
    EventDispatcher = require('EventDispatcher'),
    EventDispatcherConstant = require('EventDispatcherConstant');

cc.Class({
    extends: cc.Component,

    properties: {
        usernameLabel: cc.Label,
        ipLabelList: {
            'default': [],
            type: cc.Label
        },
        xuLabelList: {
            'default': [],
            type: cc.Label
        },
        expLabel: cc.Label,
        vipLabel: cc.Label,
        userAvatar: UrlImage,
        eventCountNode: cc.Node,
        messageCountNode: cc.Node,
        effectAvatar: cc.Prefab,
    },

    // use this for initialization
    onLoad: function () {
        this.usernameLabel.string = AuthUser.username;
        this.userAvatar.loadImage(AuthUser.avatar);
        this.updateUserMoney();
        this.updateUserExp();
        this.updateUserVip();
        this.updateEventCount();
        this.updateMessageCount();

        // Effect Avatar
        if (this.effectAvatar) {
            var effectNode = cc.instantiate(this.effectAvatar);
            effectNode.position = cc.v2(0, 0);
            this.userAvatar.node.parent.parent.addChild(effectNode);
        }

        // Event
        EventDispatcher.addEventListener(EventDispatcherConstant.PROFILE.UPDATE_MONEY, this.updateUserMoney, this);
        EventDispatcher.addEventListener(EventDispatcherConstant.PROFILE.UPDATE_EXP, this.updateUserExp, this);
        EventDispatcher.addEventListener(EventDispatcherConstant.PROFILE.UPDATE_UNREAD_MESS_COUNT, this.updateMessageCount, this);
    },

    onDestroy: function () {
        EventDispatcher.removeEventListener(EventDispatcherConstant.PROFILE.UPDATE_MONEY, this.updateUserMoney, this);
        EventDispatcher.removeEventListener(EventDispatcherConstant.PROFILE.UPDATE_EXP, this.updateUserExp, this);
        EventDispatcher.removeEventListener(EventDispatcherConstant.PROFILE.UPDATE_UNREAD_MESS_COUNT, this.updateMessageCount, this);
    },

    openProfile: function () {
        // suspend lobby
        var gameConfigs = GameManager.getLobbyGameRuntimeConfigs();
        if (gameConfigs) {
            gameConfigs.isSuspending = true;
        }
        UiManager.openProfileModal();
        AudioManager.instance.playButtonClick();
    },

    openMessageBox: function () {
        UiManager.openPopupMessageBox();
        AudioManager.instance.playButtonClick();
    },

    openEvent: function () {
        UiManager.openPopupEvent();
        AuthUser.event_count = 0;
        this.updateEventCount();
        AudioManager.instance.playButtonClick();
    },

    openNapXien: function () {
        UiManager.openNapXienModal();
        AudioManager.instance.playButtonClick();
    },

    updateEventCount: function () {
        var labelComp = this.eventCountNode.getComponentInChildren(cc.Label);
        if (AuthUser.event_count > 0) {
            this.eventCountNode.active = true;
            labelComp.string = AuthUser.event_count;
        }
        else {
            this.eventCountNode.active = false;
            labelComp.string = '';
        }
    },

    updateMessageCount: function () {
        var labelComp = this.messageCountNode.getComponentInChildren(cc.Label);
        if (AuthUser.unread_mess_count > 0) {
            this.messageCountNode.active = true;
            labelComp.string = AuthUser.unread_mess_count;
        }
        else {
            this.messageCountNode.active = false;
            labelComp.string = '';
        }
    },

    updateUserMoney: function () {
        this.xuLabelList.forEach(function (label) {
            label.string = AuthUser.currencies[CommonConstant.CurrencyType.Xu.NAME].balance;
            label.string = Utils.Number.format(label.string);
        });
        this.ipLabelList.forEach(function (label) {
            label.string = AuthUser.currencies[CommonConstant.CurrencyType.Ip.NAME].balance;
            label.string = Utils.Number.format(label.string);
        });
    },

    updateUserExp: function () {
        this.expLabel.string = AuthUser.experience;
        this.expLabel.string = Utils.Number.format(this.expLabel.string);
    },

    updateUserVip: function () {
        this.vipLabel.string = AuthUser.vip_level || 0;
        this.vipLabel.string = Utils.Number.format(this.vipLabel.string);
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
