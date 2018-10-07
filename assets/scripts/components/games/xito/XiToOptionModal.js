var BaseGameOptionModal = require('BaseGameOptionModal'),
    XiToConstant = require('XiToConstant'),
    NetworkManager = require('NetworkManager');

cc.Class({
    extends: BaseGameOptionModal,

    properties: {},

    // use this for initialization
    onLoad: function () {

    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    _playXCardsGameType: function (gameTypeId) {
        this.gameConfigs = this.gameConfigs || {};
        this.gameConfigs.gameType = NetworkManager.SmartFox.type.byte(gameTypeId);
        this.enterGame();
    },

    playFiveCardsGameType: function () {
        this._playXCardsGameType(XiToConstant.GameType.FIVE_CARDS.ID);
    },

    playSevenCardsGameType: function () {
        this._playXCardsGameType(XiToConstant.GameType.SEVEN_CARDS.ID);
    },
});
