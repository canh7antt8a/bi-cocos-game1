var Url = require('Url'),
    Utils = require('Utils'),
    AuthUser = require('AuthUser'),
    UrlImage = require('UrlImage'),
    UiManager = require('UiManager'),
    NetworkManager = require('NetworkManager'),
    CommonConstant = require('CommonConstant'),
    EventDispatcher = require('EventDispatcher'),
    PlatformImplement = require('PlatformImplement'),
    EventDispatcherConstant = require('EventDispatcherConstant');

cc.Class({
    extends: cc.Component,

    properties: {
        xuLabel: cc.Label,
        piLabel: cc.Label,
        vipLabel: cc.Label,
        emailLabel: cc.Label,
        levelLabel: cc.Label,
        userAvatar: UrlImage,
        numPhoneLabel: cc.Label,
        displayNameLabel: cc.Label,
        levelPercentSprite: cc.Sprite,
    },

    // use this for initialization
    onLoad: function () {
        var self = this;

        EventDispatcher.addEventListener(EventDispatcherConstant.PROFILE.UPDATE_INFO, this.onCompleteChangeInfo, this);
        EventDispatcher.addEventListener(EventDispatcherConstant.PROFILE.UPDATE_AVATAR, this.onCompleteUpdateAvatar, this);

        this.xuLabel.string = AuthUser.currencies[CommonConstant.CurrencyType.Xu.NAME].balance;
        this.xuLabel.string = Utils.Number.format(this.xuLabel.string);
        this.piLabel.string = AuthUser.currencies[CommonConstant.CurrencyType.Ip.NAME].balance;
        this.piLabel.string = Utils.Number.format(this.piLabel.string);

        this.levelLabel.string = 'LV: ' + AuthUser.level;
        this.vipLabel.string = AuthUser.vip_level || '0';
        this.levelPercentSprite.fillRange = AuthUser.level_percent;

        this.numPhoneLabel.string = AuthUser.mobile || 'Chưa có';
        this.displayNameLabel.string = AuthUser.display_name;
        this.emailLabel.string = AuthUser.email;
        this.userAvatar.loadImage(AuthUser.avatar);

        // back key event
        Utils.EventManager.onKeyReleased(cc.KEY.back, this.node, function () {
            self.onButtonBack();
        });
    },

    uploadAvatar: function (event) {
        var self = this;
        PlatformImplement.uploadFile({
                accept: 'image/*'
            },
            function (fileData) {
                var loadingComponent = self.node.getComponentInChildren('Loading'),
                    loadingNode = loadingComponent && loadingComponent.node;
                if (loadingNode) {
                    loadingNode.active = true;
                }
                NetworkManager.Http.fetch('POST', Url.Http.USER_UPDATE_AVATAR, {
                        username: AuthUser.username,
                        accesstoken: AuthUser.accesstoken,
                        avatar: fileData
                    })
                    .success(function (rspDone) {
                        if (loadingNode) {
                            loadingNode.active = false;
                        }
                        AuthUser.avatar = rspDone.data;
                        EventDispatcher.dispatchEvent(EventDispatcherConstant.PROFILE.UPDATE_AVATAR);
                        UiManager.openModal('Xin chúc mừng, bạn đã cập nhật avatar thành công.');
                    })
                    .error(function () {
                        if (loadingNode) {
                            loadingNode.active = false;
                        }
                    })
                    .setWaitingButton(event.target);
            }
        );
    },

    onCompleteChangeInfo: function () {
        this.displayNameLabel.string = AuthUser.display_name;
        this.emailLabel.string = AuthUser.email;
    },

    onCompleteUpdateAvatar: function () {
        this.userAvatar.loadImage(AuthUser.avatar);
    },

    onDestroy: function () {
        EventDispatcher.removeEventListener(EventDispatcherConstant.PROFILE.UPDATE_INFO, this.onCompleteChangeInfo, this);
        EventDispatcher.removeEventListener(EventDispatcherConstant.PROFILE.UPDATE_AVATAR, this.onCompleteUpdateAvatar, this);
    },

});
