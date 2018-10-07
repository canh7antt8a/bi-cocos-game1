var Utils = require('Utils'),
    CommonConstant = require('CommonConstant');

cc.Class({
    extends: cc.Component,

    properties: {
        contentLabel: cc.RichText,
        duration: 3
    },

    start: function () {
        this.node.zIndex = CommonConstant.ZINDEX.WARNING_MESSAGE;
    },

    // use this for initialization
    onLoad: function () {

    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    open: function (message, duration, useBackdrop) {
        this.closeImmediately();

        if (!Utils.Type.isNumber(duration) || duration <= 0) {
            duration = Math.max(this.duration, 1);
        }
        this._closeTimeoutId = setTimeout(this.close.bind(this), duration * 1000);

        var node = this.node;
        if (node && node.isValid) {
            this.contentLabel.string = '<b>' + message + '</b>';
            this.node.getComponent('Modal').backdrop.active = !!useBackdrop;
            node.stopAllActions();
            node.active = true;
            node.scale = 0.3;
            node.runAction(cc.spawn([cc.scaleTo(0.1, 1), cc.fadeIn(0.1)]));
        }
    },

    close: function () {
        var node = this.node,
            animation = cc.spawn([cc.scaleTo(0.1, 0.3), cc.fadeOut(0.1)]);

        if (node && node.isValid) {
            node.stopAllActions();
            node.runAction(cc.sequence([animation, cc.callFunc(this._hide.bind(this))]));
        }
    },

    closeImmediately: function () {
        if (this._closeTimeoutId) {
            clearTimeout(this._closeTimeoutId);
            this._closeTimeoutId = null;
        }
        this._hide();
    },

    _show: function () {
        if (this.node && this.node.isValid) {
            this.node.active = true;
        }
    },

    _hide: function () {
        if (this.node && this.node.isValid) {
            this.node.active = false;
        }
    },
});
