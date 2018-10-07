var VongQuay = require('VongQuay');

cc.Class({
    extends: cc.Component,

    properties: {
        vongQuay: VongQuay
    },

    onLoad: function () {},

    onEnable: function () {
        cc.director.getCollisionManager().enabled = true;
        cc.director.getCollisionManager().enabledDebugDraw = true;
    },

    onDisable: function () {
        cc.director.getCollisionManager().enabled = false;
        cc.director.getCollisionManager().enabledDebugDraw = false;
    },

    onCollisionEnter: function () {
        if (this.vongQuay) {
            var delta = this.vongQuay.rotateDelta;
            if (delta < 1) {
                delta = 1;
            }
            var time = 0.5 / delta;
            this.node.stopAllActions();
            this.node.runAction(cc.sequence(cc.rotateTo(time, -20), cc.rotateTo(0.07, 0)));
        }
    },
});
