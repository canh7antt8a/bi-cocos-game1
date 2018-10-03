var BaseGameManager = require('BaseGameManager'),
    SmartFoxConstant = require('SmartFoxConstant'),
    NetworkManager = require('NetworkManager'),
    Utils = require('Utils'),
    AuthUser = require('AuthUser'),
    RouletteConstant = require('RouletteConstant'),
    // Url = require('Url'),
    RoulteGameManager;

var RoulteGameManager = Utils.Class({
    $$extends: BaseGameManager,

    $$constructor: function (gameCmd, roomId, logEnabled) {
        this.$super.constructor.call(this, gameCmd, roomId, logEnabled, true);

        this.currentBet = [];
        this.history = [];
        this.isMaster = false;
        this.lstRatio = [];
        this.time = 0;
        this.bettingList = [];
        this._clearCurrentBet();

        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.UPDATE_GAME.ID, this.onUpdateGame, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.REFRESH_GAME.ID, this.onUpdateGame, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.FINISH_GAME.ID, this.onFinishGame, this);

        this.eventDispatchers.playCmd.addEventListener(RouletteConstant.Action.BETTING, this.onBettingSuccess, this);
        this.eventDispatchers.playCmd.addEventListener(RouletteConstant.Action.CHANGE_STATE, this.onChangeState, this);
        this.eventDispatchers.playCmd.addEventListener(RouletteConstant.Action.CANCEL_BET, this.onCancelBetting, this);
    },

    // Send API
    //
    sellBetCancelBet: function (pot) {
        if (this.isMaster) {
            this.send({
                command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
                action: NetworkManager.SmartFox.type.byte(RouletteConstant.Action.MASTER_SELL_POT),
                pot: NetworkManager.SmartFox.type.byte(pot),
            });
        }
    },

    sendBet: function (pot, moneyBet) {
        if (!this.isMaster && moneyBet > 0) {
            this.send({
                command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
                action: NetworkManager.SmartFox.type.byte(RouletteConstant.Action.BETTING),
                userName: NetworkManager.SmartFox.type.utfString(AuthUser.username),
                pot: NetworkManager.SmartFox.type.byte(pot),
                money: NetworkManager.SmartFox.type.long(moneyBet),
            });
        }
    },

    sendReBet: function () {
        for (var i = 0; i < this.history.length; i += 1) {
            this.sendBet(i, this.history[i]);
        }
    },

    sendDoubleBet: function () {
        for (var i = 0; i < this.currentBet.length; i += 1) {
            if (this.currentBet[i] > 0) {
                this.sendBet(i, this.currentBet[i]);
            }
        }
    },

    sendCancelBet: function () {
        for (var i = 0; i < this.currentBet.length; i += 1) {
            this.send({
                command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
                action: NetworkManager.SmartFox.type.byte(RouletteConstant.Action.CANCEL_BET),
                userName: NetworkManager.SmartFox.type.utfString(AuthUser.username),
                pot: NetworkManager.SmartFox.type.byte(i),
            });
        }

    },

    // End Send API
    //
    //
    //
    //
    //
    _clearCurrentBet: function () {
        this.currentBet = [];
        for (var i = 0; i < 49; i += 1) {
            this.currentBet.push(0);
        }
    },
    onFinishGame: function (params) {
        // {time: 5000, players: Array[3], command: 30, potWin: Array[6], banker: Object}
        this._setGameState(5);
        this.eventDispatchers.local.dispatchEvent(RouletteConstant.Event.FINISH_GAME, params);
        this.history = this.currentBet;
        this._clearCurrentBet();
    },

    onCancelBetting: function (params) {
        //{action: 2, command: 20, pot: 4, username: "test6"}
        this.eventDispatchers.local.dispatchEvent(RouletteConstant.Event.CANCEL_BET, params);
        if (this.isCurrentPlayer(params.username)) {
            this._clearCurrentBet();
        }
    },

    onBettingSuccess: function (params) {
        //{money: 15000, action: 1, command: 20, pot: 5, username: "ngohoangtrung85044"}
        this.eventDispatchers.local.dispatchEvent(RouletteConstant.Event.BETTING_SUCCESS, params);
        if (this.isCurrentPlayer(params.username)) {
            this.currentBet[params.pot] = this.currentBet[params.pot] + params.money;
        }
    },
    onUpdateGame: function (params) {
        this.bettingList = params.bettingValues;
        this._updateListBetting(params.bettingValues);
        this._updateRatio(params.potInfo);
        this.onChangeState(params);
        // if (this.gameState !== RouletteConstant.GameState.FINISH) {
        this._bettingUpdateGame(params.pots);
        // }
    },
    _updateRatio: function (params) {
        this.lstRatio = [];
        for (var i = 0; i < params.length; i += 1) {
            this.lstRatio.push(params[params[i].id].ratio);
        }
    },
    _bettingUpdateGame: function (params) {
        for (var i = 0; i < params.length; i += 1) {
            this.eventDispatchers.local.dispatchEvent(RouletteConstant.Event.BETTING_UPDATEGAME, params[i]);
        }
    },

    _updateListBetting: function (params) {
        this.eventDispatchers.local.dispatchEvent(RouletteConstant.Event.ADD_LIST_BETTING, params);
    },

    onChangeState: function (params) {
        this._setGameState(params.gameState);
        switch (params.gameState) {
            case RouletteConstant.GameState.EFFECT:
                this._rotate(params);
                break;
            case RouletteConstant.GameState.PLAYER_BETTING:
                this.time = Date.now() + params.time;
                // this.onPlayerBetting(params);
                break;
            case RouletteConstant.GameState.MASTER_CANEL_BET:
                this.eventDispatchers.local.dispatchEvent(RouletteConstant.Event.MASTER_CANEL_BET, params);
                break;
            default:
                break;
        }
    },
    _setGameState: function (newGameState) {
        if (this.gameState !== newGameState) {
            this.gameState = newGameState;
            this.eventDispatchers.local.dispatchEvent(RouletteConstant.Event.CHANGE_STATE);
        }
    },
    _rotate: function (params) {
        this.eventDispatchers.local.dispatchEvent(RouletteConstant.Event.ROTATE_VONG_QUAY, params);
    },
});


module.exports = RoulteGameManager;
