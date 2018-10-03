var GameManager = require('GameManager'),
    Utils = require('Utils');

cc.Class({
    extends: cc.Component,

    properties: {},

    // use this for initialization
    onLoad: function () {

    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    init: function (gameId, gameConfigs, delayEnterGameFn) {
        this.gameId = gameId;
        this.gameConfigs = gameConfigs;

        // function (gameConfigs, enterGameFn) {}
        this.delayEnterGameFn = delayEnterGameFn;
    },

    enterGame: function () {
        var self = this;
        if (self.gameId && self.gameConfigs) {
            if (Utils.Type.isFunction(self.delayEnterGameFn)) {
                self.delayEnterGameFn(self.gameConfigs, (function (gameId, gameConfigs) {
                    return function enterGameFn() {
                        GameManager.enterGame(gameId, gameConfigs);
                    };
                }(self.gameId, self.gameConfigs)));
            }
            else {
                GameManager.enterGame(self.gameId, self.gameConfigs);
            }
        }
        self.node.destroy();
    },
});
