var Utils = require('Utils'),
    AudioManager = require('AudioManager');

cc.Class({
    extends: cc.Component,

    properties: {
        rotateNode: cc.Node,
        txtMoney: cc.Label,
        particle1: cc.ParticleSystem,
        particle2: cc.ParticleSystem,
    },

    onLoad: function () {
        this.rotateNode.runAction(cc.repeatForever(cc.rotateBy(0, 1)));
        // this.txtMoney.node.runAction(cc.repeatForever(cc.sequence(cc.scaleTo(0.2, 1.3), cc.scaleTo(0.2, 1))));
    },

    show: function (money, callback) {
        var timeShow = 2;
        this.particle1.node.active = false;
        this.particle2.node.active = false;
        if (money >= 0) {
            timeShow = 4;
            AudioManager.instance.playWin();
            if (money > 0) {
                AudioManager.instance.playChickenRow();
                this.particle1.node.active = true;
                this.particle2.node.active = true;
                this.particle1.resetSystem();
                this.particle2.resetSystem();
            }
        }
        else {
            AudioManager.instance.playLost();
        }
        this.node.stopAllActions();
        this.node.active = true;
        this.node.runAction(cc.sequence(cc.delayTime(timeShow), cc.callFunc(function () {
            this.node.active = false;
            callback();
        }.bind(this))));
        this.txtMoney.string = (money >= 0 ? '+' : '') + '' + Utils.Number.format(money);
    },
});
