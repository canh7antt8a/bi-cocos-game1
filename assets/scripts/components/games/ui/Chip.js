var Utils = require('Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        money: 0,
        moneyLabel: cc.Label,
        activeSprite: cc.Sprite,
        redChipSpriteFrame: cc.SpriteFrame,
        greenChipSpriteFrame: cc.SpriteFrame,
        blueChipSpriteFrame: cc.SpriteFrame,
        purpleChipSpriteFrame: cc.SpriteFrame
    },

    // use this for initialization
    onLoad: function () {},

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    init: function (money, color) {
        this.money = money;
        this.moneyLabel.string = Utils.Number.abbreviate(money);

        color = color || 'blue';
        var sprite = this.node.getComponent(cc.Sprite);
        sprite.spriteFrame = this[color + 'ChipSpriteFrame'];
    },

    activeSelectChip: function (isActive) {
        this.activeSprite.node.active = isActive;
        if (isActive) {
            var action = cc.rotateBy(10, 360);
            this.activeSprite.node.runAction(cc.repeatForever(action));
        }
    }
});
