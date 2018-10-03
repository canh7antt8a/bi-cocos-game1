var BaseGameManager = require('BaseGameManager'),
    SmartFoxConstant = require('SmartFoxConstant'),
    BauCuaConstant = require('BauCuaConstant'),
    NetworkManager = require('NetworkManager'),
    BauCuaGameManager = require('BauCuaGameManager'),
    Utils = require('Utils'),
    AuthUser = require('AuthUser'),
    BauCuaGameManager;

BauCuaGameManager = Utils.Class({
    $$extends: BaseGameManager,
    $$constructor: function (game, roomId) {
        this.$super.constructor.call(this, game, roomId);

        this.currentBet = [0, 0, 0, 0, 0, 0];
        this.history = [];
        this.isMaster = false;
        this.bettingList = [];

        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.UPDATE_GAME.ID, this.onUpdateGame, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.REFRESH_GAME.ID, this.onUpdateGame, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.FINISH_GAME.ID, this.onFinishGame, this);

        this.eventDispatchers.playCmd.addEventListener(BauCuaConstant.Action.BETTING, this.onBettingSuccess, this);
        this.eventDispatchers.playCmd.addEventListener(BauCuaConstant.Action.CHANGE_STATE, this.onChangeState, this);
        this.eventDispatchers.playCmd.addEventListener(BauCuaConstant.Action.CANCEL_BET, this.onCancelBetting, this);
        this.eventDispatchers.playCmd.addEventListener(BauCuaConstant.Action.MASTER_SELL_POT, this.bankerBuyPot, this);

    },

    // Send API
    //
    //
    sellBetCancelBet: function (pot) {
        if (this.isMaster) {
            this.send({
                command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
                action: NetworkManager.SmartFox.type.byte(BauCuaConstant.Action.MASTER_SELL_POT),
                pot: NetworkManager.SmartFox.type.byte(pot),
            });
        }
    },

    sendBuyPot: function (pot) {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(BauCuaConstant.Action.BUY_POT),
            pot: NetworkManager.SmartFox.type.byte(pot),
        });
    },

    sendBet: function (pot, moneyBet) {
        if (!this.isMaster && moneyBet > 0) {
            this.send({
                command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
                action: NetworkManager.SmartFox.type.byte(BauCuaConstant.Action.BETTING),
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
                action: NetworkManager.SmartFox.type.byte(BauCuaConstant.Action.CANCEL_BET),
                userName: NetworkManager.SmartFox.type.utfString(AuthUser.username),
                pot: NetworkManager.SmartFox.type.byte(i),
            });
        }

    },

    // End Send API
    //

    bankerBuyPot: function (params) {
        // {money: 200, action: 10, command: 20, pot: 0}
        if (!this.isMaster) {
            this.eventDispatchers.local.dispatchEvent(BauCuaConstant.Event.MASTER_SELL_POT, params);
        }
    },

    countDowTime: function (params) {
        return this._formatTime(((params - Date.now()) / 1000));
    },

    onFinishGame: function (params) {
        //{time: 5000, players: Array[2], command: 30, dices: Array[4], potWin: Array[1]…}
        this._setGameState(BauCuaConstant.GameState.FINALIZING);
        this.eventDispatchers.local.dispatchEvent(BauCuaConstant.Event.FINISH, params);
        // if (this.currentBet.length > 0) {
        this.history = this.currentBet;
        this.currentBet = [0, 0, 0, 0, 0, 0];
        // }
    },

    onUpdateGame: function (params) {
        this.bettingList = params.bettingValues;
        this._updateListBetting(params.bettingValues);
        this._updateRatio(params.potInfo);
        this.onChangeState(params);
        if (this.gameState !== BauCuaConstant.GameState.FINISH) {
            this._bettingUpdateGame(params.pots);
        }
    },

    _bettingUpdateGame: function (params) {
        for (var i = 0; i < params.length; i += 1) {
            this.eventDispatchers.local.dispatchEvent(BauCuaConstant.Event.BETTING_UPDATEGAME, params[i]);

        }
    },
    onBettingSuccess: function (params) {
        //{money: 15000, action: 1, command: 20, pot: 5, username: "ngohoangtrung85044"}
        this.eventDispatchers.local.dispatchEvent(BauCuaConstant.Event.BETTING_SUCCESS, params);
        if (this.isCurrentPlayer(params.username)) {
            this.currentBet[params.pot] = this.currentBet[params.pot] + params.money;
            // this.currentBet.push(params.pot, params.money);
        }
    },

    onCancelBetting: function (params) {
        //{action: 2, command: 20, pot: 4, username: "test6"}
        this.eventDispatchers.local.dispatchEvent(BauCuaConstant.Event.CANCEL_BET, params);
        if (this.isCurrentPlayer(params.username)) {
            this.currentBet = [0, 0, 0, 0, 0, 0];
        }
    },
    onChangeState: function (params) {
        this.warn('State ' + params.gameState);
        this._setGameState(params.gameState);
        switch (params.gameState) {
            case BauCuaConstant.GameState.EFFECT:
                this.onEfectShake(params);
                break;
            case BauCuaConstant.GameState.PLAYER_BETTING:
                this.onPlayerBetting(params);
                break;
            case BauCuaConstant.GameState.MASTER_CANEL_BET:
                this.eventDispatchers.local.dispatchEvent(BauCuaConstant.Event.MASTER_CANEL_BET, params);
                break;
            default:
                break;
        }
    },

    _setGameState: function (newGameState) {
        if (this.gameState !== newGameState) {
            this.gameState = newGameState;
            this.eventDispatchers.local.dispatchEvent(BauCuaConstant.Event.CHANGE_STATE);
        }
    },

    onPlayerBetting: function (params) {
        this.eventDispatchers.local.dispatchEvent(BauCuaConstant.Event.PLAYER_BETTING_STATE, params);
    },
    onEfectShake: function (params) {
        this.eventDispatchers.local.dispatchEvent(BauCuaConstant.Event.SHAKE_BOW_DICE, params);
    },
    _updateRatio: function (params) {
        this.eventDispatchers.local.dispatchEvent(BauCuaConstant.Event.SET_RATIO, params);
    },
    _updateListBetting: function (params) {
        this.eventDispatchers.local.dispatchEvent(BauCuaConstant.Event.ADD_LIST_BETTING, params);
    },

    _formatTime: function (elapsedTime) {
        if (elapsedTime >= 0) {
            elapsedTime = Math.floor(elapsedTime);
            var mins = Math.floor(elapsedTime / 60),
                seconds = elapsedTime % 60;
            return Utils.Number.fillZero(mins, 2) + ':' + Utils.Number.fillZero(seconds, 2);
        }
        return '00:00';
    },
});

module.exports = BauCuaGameManager;
