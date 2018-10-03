var BaseGameManager = require('BaseGameManager'),
    SmartFoxConstant = require('SmartFoxConstant'),
    XiToConstant = require('XiToConstant'),
    NetworkManager = require('NetworkManager'),
    Utils = require('Utils'),
    XiToGameManager;

XiToGameManager = Utils.Class({
    $$extends: BaseGameManager,

    $$constructor: function (game, roomId) {
        this.$super.constructor.call(this, game, roomId);

        this._setGameState(XiToConstant.GameState.NONE);

        // command từ smartfox server
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.UPDATE_GAME.ID, this.onUpdateGame, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.FINISH_GAME.ID, this.onFinishGame, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.WAITING_DEAL_CARD.ID, this.onWaittingDealCard, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.NEW_MATCH.ID, this.restartGame, this);

        // các action của game play
        this.eventDispatchers.playCmd.addEventListener(XiToConstant.Action.BET, this.onPlayerBetting, this);
        this.eventDispatchers.playCmd.addEventListener(XiToConstant.Action.ALL_IN, this.onPlayerBetting, this);
        this.eventDispatchers.playCmd.addEventListener(XiToConstant.Action.CALL, this.onPlayerBetting, this);
        this.eventDispatchers.playCmd.addEventListener(XiToConstant.Action.CHECK, this.onPlayerBetting, this);
        this.eventDispatchers.playCmd.addEventListener(XiToConstant.Action.FOLD, this.onPlayerBetting, this);
        this.eventDispatchers.playCmd.addEventListener(XiToConstant.Action.BET_1_2, this.onPlayerBetting, this);
        this.eventDispatchers.playCmd.addEventListener(XiToConstant.Action.BET_1_4, this.onPlayerBetting, this);
        this.eventDispatchers.playCmd.addEventListener(XiToConstant.Action.BET_X2, this.onPlayerBetting, this);
        this.eventDispatchers.playCmd.addEventListener(XiToConstant.Action.CHANGE_STATE, this.onChangeStateGame, this);
        this.eventDispatchers.playCmd.addEventListener(XiToConstant.Action.CHANGE_TURN, this.onChangeTurn, this);

        this.gameType = 7;
    },

    // ============================================================
    // Send API
    // ============================================================
    bet: function (betting) {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(betting)
        });
    },

    choosePublicCard: function (cardId) {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(XiToConstant.Action.CHOOSE_PUBLIC_CARD),
            card: NetworkManager.SmartFox.type.byte(cardId)
        });
    },

    // ============================================================
    // Receive API
    // ============================================================
    onUpdateGame: function (params) {
        this.gameType = params.data.gameType === 0 ? 5 : 7;
        this.currency = params.data.currency;
        this.roomBetting = params.data.betting;
        this._setGameState(params.data.gameState);
        // this.onRefreshWaitting(params);

        this.eventDispatchers.local.dispatchEvent(XiToConstant.Event.UPDATE_GAME, params);
        var time = params.data.time;
        if (time) {
            var dt = 0;
            if (params.__execInfo__) {
                dt = params.__execInfo__.dt;
            }
            time -= dt;
        }
        this.onUpdateHand(time);
    },

    onUpdateHand: function (timeChooseOpenCard) {
        this.eventDispatchers.local.dispatchEvent(XiToConstant.Event.DRAW_CARD, timeChooseOpenCard);
    },

    onPlayerBetting: function (params) {
        this._setGameState(params.allData.gameState);
        // this.eventDispatchers.local.dispatchEvent(XiToConstant.Event.USER_BET, [params.data.userName, params.data.money, params.action, params.allData.totalBetting, params.allData.callBetting]);
        this.eventDispatchers.local.dispatchEvent(XiToConstant.Event.USER_BET, params);
    },

    onWaittingDealCard: function (params) {
        this._setGameState(params.allData.gameState);
        this.eventDispatchers.local.dispatchEvent(XiToConstant.Event.START_TIME, params.data.time);
    },

    onChangeStateGame: function (params) {
        this.currentRound = params.allData.currentRound;
        this._setGameState(params.allData.gameState);
        this.eventDispatchers.local.dispatchEvent(XiToConstant.Event.CHANGE_STATE, params);
        var time = params.data.time;
        if (time) {
            var dt = 0;
            if (params.__execInfo__) {
                dt = params.__execInfo__.dt;
            }
            time -= dt;
        }
        this.onUpdateHand(time);
    },

    onChangeTurn: function (params) {
        this._setGameState(params.allData.gameState);
        var newObject = {
            data: {
                userName: params.data.userName,
                time: params.data.time,
                allowedActions: params.data.allowedActions,
                minBetting: params.data.actionMoneyList,
                maxBetting: null
            }
        };
        this.eventDispatchers.local.dispatchEvent(XiToConstant.Event.CHANGE_TURN, newObject);
    },

    onFinishGame: function (params) {
        this._setGameState(params.allData.gameState);
        this.eventDispatchers.local.dispatchEvent(XiToConstant.Event.FINISH_GAME, params);
    },

    restartGame: function () {
        this.eventDispatchers.local.dispatchEvent(XiToConstant.Event.REFRESH_GAME);
    },

    _setGameState: function (newGameState) {
        if (this.gameState !== newGameState) {
            this.gameState = newGameState;
        }
    },
    // ============================================================
    // Action API
    // ============================================================

});

module.exports = XiToGameManager;
