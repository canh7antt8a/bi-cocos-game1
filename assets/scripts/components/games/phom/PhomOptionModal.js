var BaseGameOptionModal = require('BaseGameOptionModal'),
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

    _playUGameType: function (isUTron) {
        this.gameConfigs = this.gameConfigs || {};
        this.gameConfigs.acceptUTron = NetworkManager.SmartFox.type.bool(isUTron);
        this.enterGame();
    },

    playUTronGameType: function () {
        this._playUGameType(true);
    },

    playUThuongGameType: function () {
        this._playUGameType(false);
    },
});
