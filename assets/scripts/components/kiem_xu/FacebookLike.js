var PlatformImplement = require('PlatformImplement');

cc.Class({
    extends: cc.Component,

    properties: {
        btnLike: cc.Node,
        lblInfo: cc.Node,
    },

    // use this for initialization
    onLoad: function () {
        var isNative = cc.sys.os === cc.sys.OS_ANDROID || cc.sys.os === cc.sys.OS_IOS;
        this.btnLike.active = isNative;
        this.lblInfo.active = isNative;
    },

    initLikeButton: function (likeLink) {
        this.likeLink = likeLink;
    },

    onEnable: function () {

    },

    onDisable: function () {

    },

    onLikeClick: function () {
        if (!this.likeLink) {
            cc.log('Khong co likeLink');
            return;
        }
        PlatformImplement.openWebUrl(this.likeLink);
    },
});
