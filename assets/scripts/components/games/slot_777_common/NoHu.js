var AudioManager = require('AudioManager');

cc.Class({
    extends: cc.Component,

    properties: {
        lightNode: cc.Node,
        noHuNode: cc.Node,
        txtMoney: cc.Label,
        particle: cc.ParticleSystem
    },

    onLoad: function () {
        this.lightNode.runAction(cc.repeatForever(cc.rotateBy(0, 1)));
        this.noHuNode.runAction(cc.repeatForever(cc.sequence(cc.scaleTo(1, 0.92).easing(cc.easeBackOut()), cc.scaleTo(1, 1.0).easing(cc.easeBackIn()))));
    },

    show: function (callback) {
        // this.txtMoney.string = (money >= 0 ? '+' : '-') + Utils.Number.format(money);
        AudioManager.instance.playChickenRow();
        AudioManager.instance.playChickenRow();
        AudioManager.instance.playWin();
        this.node.stopAllActions();
        this.node.active = true;
        this.particle.resetSystem();
        this.node.runAction(cc.sequence(cc.delayTime(4), cc.callFunc(function () {
            this.node.active = false;
            if (callback) {
                callback();
            }
        }.bind(this))));
    },
});
