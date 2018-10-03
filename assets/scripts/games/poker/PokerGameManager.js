var BaseGameManager = require('BaseGameManager'),
    SmartFoxConstant = require('SmartFoxConstant'),
    PokerConstant = require('PokerConstant'),
    NetworkManager = require('NetworkManager'),
    Utils = require('Utils'),
    PokerGameManager;

PokerGameManager = Utils.Class({
    $$extends: BaseGameManager,

    $$constructor: function (game, roomId) {
        this.$super.constructor.call(this, game, roomId);

        this._setGameState(PokerConstant.GameState.NONE);

        // command từ smartfox server
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.NEW_MATCH.ID, this.restartGame, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.UPDATE_GAME.ID, this.onUpdateGame, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.FINISH_GAME.ID, this.onFinishGame, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.WAITING_DEAL_CARD.ID, this.onWaittingDealCard, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.UPDATE_HAND.ID, this.onUpdateHand, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.UPDATE_PRIVATE_USER_MONEY.ID, this.onUpdatePrivateUserMoney, this);

        // các action của game play
        this.eventDispatchers.playCmd.addEventListener(PokerConstant.Action.BET, this.onPlayerBetting, this);
        this.eventDispatchers.playCmd.addEventListener(PokerConstant.Action.ALL_IN, this.onPlayerBetting, this);
        this.eventDispatchers.playCmd.addEventListener(PokerConstant.Action.CALL, this.onPlayerBetting, this);
        this.eventDispatchers.playCmd.addEventListener(PokerConstant.Action.CHECK, this.onPlayerBetting, this);
        this.eventDispatchers.playCmd.addEventListener(PokerConstant.Action.FOLD, this.onPlayerBetting, this);
        this.eventDispatchers.playCmd.addEventListener(PokerConstant.Action.RAISE, this.onPlayerBetting, this);
        this.eventDispatchers.playCmd.addEventListener(PokerConstant.Action.CHANGE_STATE, this.onChangeStateGame, this);
        this.eventDispatchers.playCmd.addEventListener(PokerConstant.Action.CHANGE_TURN, this.onChangeTurn, this);
        this.eventDispatchers.playCmd.addEventListener(PokerConstant.Action.BUY_PRIVATE_MONEY_REQUIRED, this.onBuyPrivateMoneyRequired, this);
        this.eventDispatchers.playCmd.addEventListener(PokerConstant.Action.CUT_OFF_MONEY_POKER, this.onCutOffMoney, this);
    },

    fetchInitialGameData: function () {
        this.$super.fetchInitialGameData.call(this);
        this.getBuyMoneyInfo();
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
        }
        else {
            this.send({
                command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
                action: NetworkManager.SmartFox.type.byte(betting)
            });
        }
    },

    buyMoneyJoinTable: function (money) {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(PokerConstant.Action.BUY_PRIVATE_MONEY),
            money: NetworkManager.SmartFox.type.long(money)
        });
    },

    getBuyMoneyInfo: function () {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(PokerConstant.Action.GET_BUY_PRIVATE_MONEY_INFO)
        });
    },

    // ============================================================
    // Receive API
    // ============================================================
    onUpdateGame: function (params) {
        this.currency = params.data.currency;
        this.roomBetting = params.data.betting;
        this._setGameState(params.data.gameState, params);
        this.onUpdateHand();
        this.eventDispatchers.local.dispatchEvent(PokerConstant.Event.UPDATE_GAME, params);
    },

    onUpdateHand: function () {
        this.eventDispatchers.local.dispatchEvent(PokerConstant.Event.DRAW_CARD);
    },

    onPlayerBetting: function (params) {
        this._setGameState(params.allData.gameState, params);
        this.eventDispatchers.local.dispatchEvent(PokerConstant.Event.USER_BET, params);
    },

    onWaittingDealCard: function (params) {
        this._setGameState(params.allData.gameState, params);
        this.eventDispatchers.local.dispatchEvent(PokerConstant.Event.START_TIME, params.data.time);
    },

    onChangeStateGame: function (params) {
        this.currentRound = params.allData.currentRound;
        this._setGameState(params.allData.gameState, params);
    },

    onChangeTurn: function (params) {
        this._setGameState(params.allData.gameState, params);
        this.eventDispatchers.local.dispatchEvent(PokerConstant.Event.CHANGE_TURN, params);
    },

    onFinishGame: function (params) {
        this._setGameState(params.allData.gameState);
        this.eventDispatchers.local.dispatchEvent(PokerConstant.Event.FINISH_GAME, params);
    },

    onCutOffMoney: function (params) {
        this.eventDispatchers.local.dispatchEvent(PokerConstant.Event.CUT_OFF_MONEY_POKER, params);
    },

    restartGame: function () {
        this.eventDispatchers.local.dispatchEvent(PokerConstant.Event.REFRESH_GAME);
    },

    _setGameState: function (newGameState, params) {
        if (this.gameState !== newGameState) {
            this.gameState = newGameState;
            if (params) {
                this.eventDispatchers.local.dispatchEvent(PokerConstant.Event.CHANGE_STATE, params);
            }
        }
    },

    onBuyPrivateMoneyRequired: function (params) {
        if (this.current && this.current.player && this.current.player.data &&
            this.current.player.data.username === params.data.userName) {
            this.eventDispatchers.local.dispatchEvent(PokerConstant.Event.SHOW_BUY_CHIP, [params.data.minMoney, params.data.maxMoney, params.data.totalMoney]);
        }
    },

    onUpdatePrivateUserMoney: function (params) {
        if (this.current && this.current.player && this.current.player.data &&
            this.current.player.data.username === params.username) {
            this.eventDispatchers.local.dispatchEvent(PokerConstant.Event.HIDE_BUY_CHIP_BUTTON);
        }
    },

    // ============================================================
    // Action API
    // ============================================================

});

module.exports = PokerGameManager;
