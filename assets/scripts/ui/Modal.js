var Utils = require('Utils'),
    AudioManager = require('AudioManager'),
    CommonConstant = require('CommonConstant');

cc.Class({
    extends: cc.Component,

    properties: {
        backdrop: cc.Node,
        content: cc.Label
    },

    start: function () {
        this.node.zIndex = CommonConstant.ZINDEX.MODAL;
    },

    // use this for initialization
    onLoad: function () {

    },

    onEnable: function () {
        this.stopPropagationOnBackdrop = Utils.Node.stopPropagation(this.backdrop);
        this.node.stopAllActions();
        this.node.setScale(0.3);
        this.node.runAction(cc.spawn([cc.scaleTo(0.3, 1).easing(cc.easeBackOut()), cc.fadeIn(0.3)]));
    },

    onDisable: function () {
        if (this.stopPropagationOnBackdrop) {
            this.stopPropagationOnBackdrop();
            this.stopPropagationOnBackdrop = null;
        }
    },

    closeCallback: function () {
        // not implement
    },

    close: function () {
        AudioManager.instance.playButtonClick();
        var node = this.node;
        // animation = cc.spawn([cc.scaleTo(0.2, 0.3).easing(cc.easeBackIn()), cc.fadeOut(0.2)]);
        node.stopAllActions();

        function destroy() {
            node.destroy();
        }
        node.runAction(cc.sequence([cc.fadeOut(0.2), cc.callFunc(destroy)]));
        this.closeCallback();
    }
});
