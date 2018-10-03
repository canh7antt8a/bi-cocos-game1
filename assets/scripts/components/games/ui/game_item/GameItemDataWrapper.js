var GameManager = require('GameManager');

cc.Class({
    extends: cc.Component,

    properties: {},

    // use this for initialization
    onLoad: function () {

    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    init: function (gameGroup) {
        var game, i;
        for (i = 0; i < gameGroup.length; i += 1) {
            game = gameGroup[i];
            if (game) {
                if (game.isSolo) {
                    this.soloGame = game;
                }
                else {
                    this.normalGame = game;
                }
            }
        }
        this.gameGroup = gameGroup;
    },

    selectSoloGame: function () {
        GameManager.playGame(this.soloGame);
        this.node.destroy();
    },

    selectNormalGame: function () {
        GameManager.playGame(this.normalGame);
        this.node.destroy();
    },
});
