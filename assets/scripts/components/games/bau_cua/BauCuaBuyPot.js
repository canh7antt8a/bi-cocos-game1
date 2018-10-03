var BaseMainGameplay = require('BaseMainGameplay');

cc.Class({
    extends: cc.Component,

    properties: {
        itemSprite: cc.Sprite,
        moneyBuy: cc.Label,
        sceneScript: BaseMainGameplay,
    },

    // use this for initialization
    onLoad: function () {
        this.pot = 0;
    },

    setDataPot: function (sprFrame, money, pot) {
        this.itemSprite.spriteFrame = sprFrame;
        this.moneyBuy.string = money;
        this.pot = pot;
    },

    onClickBuyPot: function () {
        //this.sceneScript.gameManager.sendBuyPot(this.pot);
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
