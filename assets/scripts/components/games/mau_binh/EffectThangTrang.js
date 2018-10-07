var Utils = require('Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        imgLeft: cc.Node,
        imgRight: cc.Node,
        scaleEffect: 1.75,
        timeDelayEffect: 0.3,
        imgEffect: {
            type: cc.Node,
            default: []
        },
    },

    onLoad: function () {
        this.time = 0;
        this.direction = false;
        if (this.imgLeft && this.imgRight) {
            this.size = this.node.getContentSize();
            var size2 = this.imgRight.getContentSize();
            var targetPoint = this.size.width / 2 - size2.width / 2;
            this.imgLeft.x = -this.size.width / 2;
            this.imgRight.x = this.size.width / 2;
            this.imgLeft.opacity = 0;
            this.imgLeft.runAction(cc.fadeIn(0.1));
            var repeat1 = cc.repeatForever(cc.sequence(cc.moveTo(4, cc.v2(targetPoint, this.imgLeft.y)), cc.callFunc(function () {
                this.imgLeft.x = -targetPoint;
                this.imgLeft.opacity = 0;
                this.imgLeft.runAction(cc.fadeIn(0.1));
                this.imgLeft.runAction(cc.sequence(cc.delayTime(3), cc.fadeOut(0.8)));
            }.bind(this))));
            this.imgRight.opacity = 0;
            this.imgRight.runAction(cc.fadeIn(0.1));
            var repeat2 = cc.repeatForever(cc.sequence(cc.moveTo(4, cc.v2(-targetPoint, this.imgRight.y)), cc.callFunc(function () {
                this.imgRight.x = targetPoint;
                this.imgRight.opacity = 0;
                this.imgRight.runAction(cc.fadeIn(0.1));
                this.imgRight.runAction(cc.sequence(cc.delayTime(3), cc.fadeOut(0.8)));
            }.bind(this))));
            this.imgLeft.runAction(repeat1);
            this.imgLeft.runAction(cc.sequence(cc.delayTime(3), cc.fadeOut(0.8)));
            this.imgRight.runAction(repeat2);
            this.imgRight.runAction(cc.sequence(cc.delayTime(3), cc.fadeOut(0.8)));

            if (this.imgEffect.length > 0) {
                for (var i = 0; i < this.imgEffect.length; i += 1) {
                    this.imgEffect[i].active = false;
                }
            }
        }

        // Label
        var label = this.node.getComponentInChildren(cc.Label);
        if (label) {
            label.node.runAction(cc.repeatForever(cc.sequence(cc.scaleTo(this.timeDelayEffect / 2, 1.03), cc.scaleTo(this.timeDelayEffect / 2, 1))));
        }
    },

    update: function (dt) {
        this.time += dt;
        if (this.imgEffect.length > 0 && this.time > this.timeDelayEffect) {
            this.time = 0;
            this.direction = !this.direction;
            this.spawnEffect(true);
            this.spawnEffect(false);
        }
    },

    spawnEffect: function (direction) {
        var randomRotateDirection = Utils.Number.random(0, 1) === 0 ? 1 : -1;
        var randomId = Utils.Number.random(0, this.imgEffect.length - 1);
        var randomNode = this.imgEffect[randomId];
        var node1 = cc.instantiate(randomNode);
        node1.active = true;
        node1.scale = this.scaleEffect;
        node1.position = cc.v2(0, 0);
        node1.runAction(cc.sequence(cc.moveTo(1.8, cc.v2(direction ? -this.size.width / 2 : this.size.width / 2, 0)).easing(cc.easeCircleActionOut()), cc.callFunc(function () {
            node1.destroy();
        }.bind(this))));
        node1.opacity = 0;
        node1.runAction(cc.sequence(cc.fadeTo(0.3, 200), cc.fadeOut(1)));
        node1.runAction(cc.rotateBy(3, randomRotateDirection * 360));
        this.node.addChild(node1);

    }
});
