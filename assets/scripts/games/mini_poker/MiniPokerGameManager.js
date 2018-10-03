var Utils = require('Utils'),
    Url = require('Url'),
    AuthUser = require('AuthUser'),
    BaseGameManager = require('BaseGameManager'),
    SmartFoxConstant = require('SmartFoxConstant'),
    NetworkManager = require('NetworkManager'),
    MiniPokerConstant = require('MiniPokerConstant'),
    MiniPokerGameManager;

MiniPokerGameManager = Utils.Class({

    $$extends: BaseGameManager,

    $$constructor: function (game, roomId) {
        this.$super.constructor.call(this, game, roomId);

        this.DELAYED_COMMANDS = [
            SmartFoxConstant.Command.MESSAGE.ID,
        ];

        this.gameState = MiniPokerConstant.GameState.NONE;
        this.historyList = [];
        this.lastMoneyBet = 0;
        this.lastPotWin = 0;
        this.lastCurrency = '';

        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.UPDATE_GAME.ID, this.onUpdateGame, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.FINISH_GAME.ID, this.onFinishGame, this);

        this.eventDispatchers.playCmd.addEventListener(MiniPokerConstant.Action.CHANGE_STATE, this.onChangeStateGame, this);
        this.eventDispatchers.playCmd.addEventListener(MiniPokerConstant.Action.ROTATE, this.onStartGame, this);

        this.eventDispatchers.globalCmd.addEventListener(SmartFoxConstant.Command.UPDATE_GAME.ID, this.onUpdateGameJar, this);

        //  Get Money Quy
        this._getMoneyQuy();

        // Get History
        this.historyDataKey = 'data_history_' + game.CONFIG.CMD + '_user_' + AuthUser.username;
        var his = cc.sys.localStorage.getItem(this.historyDataKey);
        if (his !== undefined && his !== null) {
            this.historyList = JSON.parse(his);
        }
    },

    saveHistory: function () {
        cc.sys.localStorage.setItem(this.historyDataKey, JSON.stringify(this.historyList));
    },

    onUpdateGameJar: function (params) {
        this.eventDispatchers.local.dispatchEvent(MiniPokerConstant.Event.UPDATE_JAR, params);
    },

    sendStartGame: function (currency, money) {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(MiniPokerConstant.Action.ROTATE),
            betting: NetworkManager.SmartFox.type.long(money),
            currency: NetworkManager.SmartFox.type.utfString(currency),
        });
        this.lastMoneyBet = money;
        this.lastCurrency = currency;
        // cc.log("SEND sendStartGame  currency " + currency + " money " + money);
    },

    onChangeStateGame: function (params) {
        this.gameState = params.gameState;
        if (params.gameState === MiniPokerConstant.GameState.ROTATE) {
            this.eventDispatchers.local.dispatchEvent(MiniPokerConstant.Event.TURN_START, params);
            this.lastPotWin = params.potWin;
        }
        else if (params.gameState === MiniPokerConstant.GameState.NONE) {
            this.eventDispatchers.local.dispatchEvent(MiniPokerConstant.Event.TURN_PREPARE, params);
        }
    },

    onUpdateGame: function (params) {
        this.eventDispatchers.local.dispatchEvent(MiniPokerConstant.Event.TURN_UPDATE, params);
    },

    onFinishGame: function (params) {
        this.eventDispatchers.local.dispatchEvent(MiniPokerConstant.Event.TURN_FINISH, params);
        var historyData = {
            time: Utils.Date.currentTime(),
            potWin: this.lastPotWin,
            moneyBet: this.lastMoneyBet,
            moneyExchange: params.player.moneyExchange,
            currency: this.lastCurrency
        };
        this.historyList.unshift(historyData);
        if (this.historyList.length > 60) {
            this.historyList.splice(this.historyList.length - 1, 1);
        }
    },

    _getMoneyQuy: function () {
        var self = this;
        NetworkManager.Http.fetch('GET', Url.Http.MINI_POKER_GET_JAR, {}).success(function (results) {
            self.eventDispatchers.local.dispatchEvent(MiniPokerConstant.Event.GET_JAR_SUCCESS, results);
        }, {
            cache: 900
        });
    },

    destroy: function () {
        this.$super.destroy.call(this);
    },

});

module.exports = MiniPokerGameManager;
