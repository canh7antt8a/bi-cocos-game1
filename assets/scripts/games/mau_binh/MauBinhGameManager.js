var Utils = require('Utils'),
    BaseGameManager = require('BaseGameManager'),
    SmartFoxConstant = require('SmartFoxConstant'),
    MauBinhConstant = require('MauBinhConstant'),
    NetworkManager = require('NetworkManager'),
    MauBinhGameManager;

MauBinhGameManager = Utils.Class({

    $$extends: BaseGameManager,

    $$constructor: function (game, roomId) {
        this.$super.constructor.call(this, game, roomId);

        this.DELAYED_COMMANDS = [
            SmartFoxConstant.Command.MESSAGE.ID,
            SmartFoxConstant.Command.PLAY.ID,
            SmartFoxConstant.Command.FINISH_GAME.ID,
            SmartFoxConstant.Command.DEAL_CARD.ID,
            SmartFoxConstant.Command.TURN.ID,
            SmartFoxConstant.Command.WAITING_DEAL_CARD.ID,
        ];

        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.PLAY.ID, this.onPlay, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.REFRESH_GAME.ID, this.onUpdateGame, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.UPDATE_GAME.ID, this.onUpdateGame, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.UPDATE_HAND.ID, this.onUpdateHand, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.FINISH_GAME.ID, this.onFinishGame, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.PLAYER_REMOVED.ID, this.onPlayerRemove, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.PLAYER_ADDED.ID, this.onPlayerAdd, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.WAITING_DEAL_CARD.ID, this.onWattingDealing, this);
    },

    onPlayerRemove: function (params) {
        this.eventDispatchers.local.dispatchEvent(MauBinhConstant.Event.GAME_PLAYER_REMOVE, params);
    },

    onPlayerAdd: function (params) {
        this.eventDispatchers.local.dispatchEvent(MauBinhConstant.Event.GAME_PLAYER_ADD, params);
    },

    onWattingDealing: function (params) {
        // cc.log('## onWattingDealing');
        this.eventDispatchers.local.dispatchEvent(MauBinhConstant.Event.GAME_PREPARE, params);
        this.gameState = MauBinhConstant.GameState.WAITING_DEALING;
    },

    onUpdateHand: function (params) {
        // cc.log('## onUpdateHand');
        this.gameState = MauBinhConstant.GameState.ORDER_CARDS;
        this.eventDispatchers.local.dispatchEvent(MauBinhConstant.Event.GAME_UPDATE_HAND, params);
    },

    onPlay: function (params) {
        // cc.log('## onPlay');
        // cc.log(params);
        switch (params.action) {
        case MauBinhConstant.Action.ORDER_CARDS:
            this.gameState = MauBinhConstant.GameState.ORDER_CARDS;
            this.eventDispatchers.local.dispatchEvent(MauBinhConstant.Event.GAME_ORDER_CARD, params);
            break;
        case MauBinhConstant.Action.FINISH_ORDER_CARDS:
            this.eventDispatchers.local.dispatchEvent(MauBinhConstant.Event.GAME_USER_FINISH_ORDER, params);
            break;
        case MauBinhConstant.Action.COMPARE_CHI_MOT:
            this.gameState = MauBinhConstant.GameState.COMPARE_1;
            this.eventDispatchers.local.dispatchEvent(MauBinhConstant.Event.GAME_COMPARE_CHI, params);
            break;
        case MauBinhConstant.Action.COMPARE_CHI_HAI:
            this.gameState = MauBinhConstant.GameState.COMPARE_2;
            this.eventDispatchers.local.dispatchEvent(MauBinhConstant.Event.GAME_COMPARE_CHI, params);
            break;
        case MauBinhConstant.Action.COMPARE_CHI_BA:
            this.gameState = MauBinhConstant.GameState.COMPARE_3;
            this.eventDispatchers.local.dispatchEvent(MauBinhConstant.Event.GAME_COMPARE_CHI, params);
            break;
        case MauBinhConstant.Action.NOTIFY_THANG_TRANG:
            this.eventDispatchers.local.dispatchEvent(MauBinhConstant.Event.GAME_NOTIFY_THANG_TRANG, params);
            break;
        case MauBinhConstant.Action.NOTIFY_BINH_LUNG:
            this.eventDispatchers.local.dispatchEvent(MauBinhConstant.Event.GAME_NOTIFY_BINH_LUNG, params);
            break;
        case MauBinhConstant.Action.WAITING_ORDER_CARDS:
            // cc.log('WAITING_ORDER_CARDS');
            break;
        }
    },

    onUpdateGame: function (params) {
        // cc.log('## onUpdateGame');
        // cc.log(params);
        this.gameState = params.gameState;
        switch (this.gameState) {
        case MauBinhConstant.GameState.WAITING_FOR_PLAYER:
            this.eventDispatchers.local.dispatchEvent(MauBinhConstant.Event.GAME_WATING_PLAYER, params);
            break;
        case MauBinhConstant.GameState.WAITING_DEALING:
            this.eventDispatchers.local.dispatchEvent(MauBinhConstant.Event.GAME_PREPARE, params);
            break;
        case MauBinhConstant.GameState.COMPARE_1:
        case MauBinhConstant.GameState.COMPARE_2:
        case MauBinhConstant.GameState.COMPARE_3:
            this.eventDispatchers.local.dispatchEvent(MauBinhConstant.Event.GAME_COMPARE_CHI, params);
            break;
        case MauBinhConstant.GameState.DEALING:
        case MauBinhConstant.GameState.PLAYING:
            break;
        case MauBinhConstant.GameState.ORDER_CARDS:
            this.eventDispatchers.local.dispatchEvent(MauBinhConstant.Event.GAME_ORDER_CARD, params);
            break;
        }
    },

    onFinishGame: function (params) {
        this.eventDispatchers.local.dispatchEvent(MauBinhConstant.Event.GAME_FINISH, params);
    },

    sendRequestOrderCard: function (cardsId, isFinish) {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(MauBinhConstant.Action.ORDER_CARDS),
            cards: NetworkManager.SmartFox.type.byteArray(cardsId),
            isFinish: NetworkManager.SmartFox.type.bool(isFinish)
        });
    },

    sendRequestStartGame: function () {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.DEAL_CARD.ID)
        });
    },
});

module.exports = MauBinhGameManager;
