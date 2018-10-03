var PlatformImplement = require('PlatformImplement');

cc.Class({
    extends: cc.Component,

    properties: {
        facebookNode: cc.Node
    },

    chuyenPi: function () {
        // not implement
    },

    // use this for initialization
    onLoad: function () {
        this.node.on(cc.Node.EventType.TOUCH_END, this.chuyenPi);
    },

    updateData: function (daiLyData) {
        if (daiLyData.fb_url) {
            this.facebookNode.on(cc.Node.EventType.TOUCH_END, function () {
                PlatformImplement.openWebUrl(daiLyData.fb_url);
            });
        }
        else {
            this.facebookNode.removeFromParent();
        }
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
