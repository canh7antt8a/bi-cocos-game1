var BaseGameManager = require('BaseGameManager'),
    SmartFoxConstant = require('SmartFoxConstant'),
    LiengConstant = require('LiengConstant'),
    NetworkManager = require('NetworkManager'),
    Utils = require('Utils'),
    LiengGameManager;

LiengGameManager = Utils.Class({
    $$extends: BaseGameManager,

    $$constructor: function (game, roomId) {
        this.$super.constructor.call(this, game, roomId);

        this._setGameState(LiengConstant.GameState.NONE);

        // command từ smartfox server
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.UPDATE_GAME.ID, this.onUpdateGame, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.FINISH_GAME.ID, this.onFinishGame, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.WAITING_DEAL_CARD.ID, this.onWaittingDealCard, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.NEW_MATCH.ID, this.restartGame, this);

        // các action của game play
        this.eventDispatchers.playCmd.addEventListener(LiengConstant.Action.BET, this.onPlayerBetting, this);
        this.eventDispatchers.playCmd.addEventListener(LiengConstant.Action.ALL_IN, this.onPlayerBetting, this);
        this.eventDispatchers.playCmd.addEventListener(LiengConstant.Action.CALL, this.onPlayerBetting, this);
        this.eventDispatchers.playCmd.addEventListener(LiengConstant.Action.CHECK, this.onPlayerBetting, this);
        this.eventDispatchers.playCmd.addEventListener(LiengConstant.Action.FOLD, this.onPlayerBetting, this);
        this.eventDispatchers.playCmd.addEventListener(LiengConstant.Action.RAISE, this.onPlayerBetting, this);
        this.eventDispatchers.playCmd.addEventListener(LiengConstant.Action.CHANGE_STATE, this.onChangeStateGame, this);
        this.eventDispatchers.playCmd.addEventListener(LiengConstant.Action.CHANGE_TURN, this.onChangeTurn, this);
    },

    // ============================================================
    // Send API
    // ============================================================
    bet: function (betting, moneyBetting) {
        if (moneyBetting) {
            this.send({
                command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
                action: NetworkManager.SmartFox.type.byte(betting),
                money: NetworkManager.SmartFox.type.long(moneyBetting)
            });
        } else {
            this.send({
                command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
                action: NetworkManager.SmartFox.type.byte(betting)
            });
        }
    },

    // ============================================================
    // Receive API
    // ============================================================
    onUpdateGame: function (params) {
        this.currency = params.data.currency;
        this.roomBetting = params.data.betting;
        this._setGameState(params.data.gameState);

        this.eventDispatchers.local.dispatchEvent(LiengConstant.Event.UPDATE_GAME, params);
        this.onUpdateHand();
    },

    onUpdateHand: function () {
        this.eventDispatchers.local.dispatchEvent(LiengConstant.Event.DRAW_CARD);
    },

    onPlayerBetting: function (params) {
        this._setGameState(params.allData.gameState);
        this.eventDispatchers.local.dispatchEvent(LiengConstant.Event.USER_BET, params);
    },

    onWaittingDealCard: function (params) {
        this._setGameState(params.allData.gameState);
        var dt = 0;
        if (params.__execInfo__) {
            dt = params.__execInfo__.dt;
        }
        this.eventDispatchers.local.dispatchEvent(LiengConstant.Event.START_TIME, params.data.time - dt);
    },

    onChangeStateGame: function (params) {
        this.currentRound = params.allData.currentRound;
        this._setGameState(params.allData.gameState);
        this.eventDispatchers.local.dispatchEvent(LiengConstant.Event.CHANGE_STATE, params);
        this.onUpdateHand();
    },

    onChangeTurn: function (params) {
        this._setGameState(params.allData.gameState);
        this.eventDispatchers.local.dispatchEvent(LiengConstant.Event.CHANGE_TURN, params);
    },

    onFinishGame: function (params) {
        this._setGameState(params.allData.gameState);
        this.eventDispatchers.local.dispatchEvent(LiengConstant.Event.FINISH_GAME, params);
    },

    restartGame: function () {
        this.eventDispatchers.local.dispatchEvent(LiengConstant.Event.REFRESH_GAME);
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

module.exports = LiengGameManager;
