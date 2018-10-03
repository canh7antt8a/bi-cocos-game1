var Utils = require('Utils'),
    Url = require('Url'),
    AuthUser = require('AuthUser'),
    BaseGameManager = require('BaseGameManager'),
    GameConstant = require('GameConstant'),
    CommonConstant = require('CommonConstant'),
    SmartFoxConstant = require('SmartFoxConstant'),
    NetworkManager = require('NetworkManager'),
    VongQuayConstant = require('VongQuayConstant'),
    VongQuayGameManager;

VongQuayGameManager = Utils.Class({

    $$extends: BaseGameManager,

    $$constructor: function (game, roomId) {
        this.$super.constructor.call(this, game, roomId);

        this.DELAYED_COMMANDS = [
            SmartFoxConstant.Command.MESSAGE.ID,
        ];

        this.gameState = VongQuayConstant.GameState.NONE;
        this.isFreeTurn = false;

        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.UPDATE_GAME.ID, this.onUpdateGame, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.FINISH_GAME.ID, this.onFinishGame, this);
        this.eventDispatchers.globalCmd.addEventListener(SmartFoxConstant.Command.UPDATE_JAR.ID, this.onUpdateGameJar, this);

        this.eventDispatchers.playCmd.addEventListener(VongQuayConstant.Action.CHANGE_STATE, this.onChangeStateGame, this);
        this.eventDispatchers.playCmd.addEventListener(VongQuayConstant.Action.UPDATE_FREE_PLAY, this.onUpdateFreePlay, this);
        this.eventDispatchers.playCmd.addEventListener(VongQuayConstant.Action.UPDATE_WINNER, this.onUpdateWinner, this);
        this.eventDispatchers.playCmd.addEventListener(VongQuayConstant.Action.GET_CAPTCHA, this.onGetCapcha, this);
        this.eventDispatchers.playCmd.addEventListener(VongQuayConstant.Action.RENEW_CAPTCHA, this.onRenewCapcha, this);
        this.eventDispatchers.playCmd.addEventListener(VongQuayConstant.Action.RESOLVE_CAPTCHA, this.onResolveCapcha, this);

        // History Data
        this.historyDataKey = 'data_history_vongquay_user_' + AuthUser.username;
        this.historyList = [];
        var his = cc.sys.localStorage.getItem(this.historyDataKey);
        if (his !== undefined && his !== null) {
            this.historyList = JSON.parse(his);
        }
        // cc.log(JSON.stringify(this.historyList));
    },

    onUpdateGameJar: function (params) {
        this.eventDispatchers.local.dispatchEvent(VongQuayConstant.Event.UPDATE_JAR, params);
    },

    onResolveCapcha: function (params) {
        this.eventDispatchers.local.dispatchEvent(VongQuayConstant.Event.TURN_GET_CAPCHA, params);
    },

    onRenewCapcha: function () {},

    onGetCapcha: function (params) {
        this.eventDispatchers.local.dispatchEvent(VongQuayConstant.Event.TURN_GET_CAPCHA, params);
    },

    onUpdateWinner: function () {},

    onUpdateFreePlay: function (params) {
        // cc.log(params);
        this.eventDispatchers.local.dispatchEvent(VongQuayConstant.Event.TURN_PREPARE, params);
    },

    onChangeStateGame: function (params) {
        this.gameState = params.data.gameState;
        if (this.gameState === VongQuayConstant.GameState.ROTATE) {
            this.eventDispatchers.local.dispatchEvent(VongQuayConstant.Event.TURN_START, params);
        }
        else if (this.gameState === VongQuayConstant.GameState.NONE) {
            this.eventDispatchers.local.dispatchEvent(VongQuayConstant.Event.TURN_PREPARE, params);
        }
        if (params.action === VongQuayConstant.Action.CHANGE_STATE) {
            this.onUpdateGame(params);
        }
    },

    onUpdateGame: function (params) {
        this.eventDispatchers.local.dispatchEvent(VongQuayConstant.Event.TURN_UPDATE, params);
    },

    onFinishGame: function (params) {
        this.eventDispatchers.local.dispatchEvent(VongQuayConstant.Event.TURN_FINISH, params);
        var results = params.data.result;
        var historyData = {
            time: Utils.Date.currentTime(),
            vong1: results[0][0],
            vong2: results[1][0],
            vong3: results[2][0],
            betting: (this.isFreeTurn ? 'Q.Miễn phí' : (Utils.Number.format(params.allData.betting) + ' ' + CommonConstant.CurrencyType.Ip.CHIP_NAME)),
        };
        this.historyList.unshift(historyData);
        if (this.historyList.length > 60) {
            this.historyList.splice(this.historyList.length - 1, 1);
        }
        this.isFreeTurn = false;
    },

    saveHistory: function () {
        cc.sys.localStorage.setItem(this.historyDataKey, JSON.stringify(this.historyList));
    },

    sendCapcha: function (capcha) {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(VongQuayConstant.Action.RESOLVE_CAPTCHA),
            answer: NetworkManager.SmartFox.type.utfString(capcha),
        });
    },

    sendStartGame: function () {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(VongQuayConstant.Action.ROTATE),
        });
    },

    sendGetNewFree: function () {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(VongQuayConstant.Action.GET_CAPTCHA),
        });
    },

    destroy: function () {
        this.$super.destroy.call(this);
    },

    getJar: function () {
        var self = this;
        NetworkManager.Http.fetch('GET', Url.Http.GET_JAR, {
            game_id: GameConstant.VONG_QUAY.ID
        }, {
            cache: 900
        }).success(function (results) {
            self.eventDispatchers.local.dispatchEvent(VongQuayConstant.Event.GET_JAR_SUCCESS, results);
        });
    },

});

module.exports = VongQuayGameManager;
