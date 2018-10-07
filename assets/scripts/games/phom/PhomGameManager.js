var BaseGameManager = require('BaseGameManager'),
    NetworkManager = require('NetworkManager'),
    SmartFoxConstant = require('SmartFoxConstant'),
    PhomConstant = require('PhomConstant'),
    Utils = require('Utils'),
    PhomGameManager;

PhomGameManager = Utils.Class({
    $$extends: BaseGameManager,

    $$constructor: function (game, roomId) {
        this.$super.constructor.call(this, game, roomId);
        // command từ smartfox server
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.UPDATE_GAME.ID, this.onUpdateGame, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.FINISH_GAME.ID, this.onFinishGame, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.UPDATE_HAND.ID, this.onUpdateHand, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.PLAY.ID, this.onPlay, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.WAITING_DEAL_CARD.ID, this.onWaitingDealCard, this);

        // các action của game play
        this.gameType = 1;

    },

    // ============================================================
    // Receive API
    // ============================================================
    onUpdateGame: function (params) {
        this.gameState = params.allData.gameState;
        this.eventDispatchers.local.dispatchEvent(PhomConstant.Event.UPDATE_GAME, params);
    },

    onFinishGame: function (params) {
        this.gameState = PhomConstant.GameState.FINISH;
        this.eventDispatchers.local.dispatchEvent(PhomConstant.Event.FINISH_GAME, params);
    },

    onPlay: function (params) {
        var action = params.action;
        this.gameState = PhomConstant.GameState.PLAYING;
        switch (action) {
        case PhomConstant.Action.DISCARD:
            this.eventDispatchers.local.dispatchEvent(PhomConstant.Event.DISCARD, params);
            break;
        case PhomConstant.Action.TAKE_CARD:
            this.eventDispatchers.local.dispatchEvent(PhomConstant.Event.TAKE_CARD, params);
            break;
        case PhomConstant.Action.PICK_CARD:
            this.eventDispatchers.local.dispatchEvent(PhomConstant.Event.PICK_CARD, params);
            break;
        case PhomConstant.Action.SENT_CARD:
            this.eventDispatchers.local.dispatchEvent(PhomConstant.Event.SENT_CARD, params);
            break;
        case PhomConstant.Action.SHOW_OFF:
            this.eventDispatchers.local.dispatchEvent(PhomConstant.Event.SHOW_OFF, params);
            break;
        case PhomConstant.Action.AUTO_SHOW_OFF:
            this.eventDispatchers.local.dispatchEvent(PhomConstant.Event.AUTO_SHOW_OFF, params);
            break;
        case PhomConstant.Action.CHANGE_TURN:
            this.eventDispatchers.local.dispatchEvent(PhomConstant.Event.CHANGE_TURN, params);
            break;
        }

    },

    onUpdateHand: function (params) {
        this.eventDispatchers.local.dispatchEvent(PhomConstant.Event.UPDATE_HAND, params.allData);
    },

    onWaitingDealCard: function (params) {
        this.gameState = PhomConstant.GameState.WAITING_FOR_NEW_GAME;
        this.eventDispatchers.local.dispatchEvent(PhomConstant.Event.WAITING_DEAL_CARD, params);
    },

    // ============================================================
    // Request API
    // ============================================================

    sendRequestStartGame: function () {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.DEAL_CARD.ID)
        });
    },

    requestSentCard: function (card, cards) {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(PhomConstant.Action.SENT_CARD),
            card: NetworkManager.SmartFox.type.byte(card),
            cards: NetworkManager.SmartFox.type.byteArray(cards)
        });
    },

    requestTakeCard: function () {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(PhomConstant.Action.TAKE_CARD)
        });
    },

    requestShowOff: function (cards) {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(PhomConstant.Action.SHOW_OFF),
            cards: NetworkManager.SmartFox.type.byteArray(cards),
        });
    },

    requestPickCard: function () {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(PhomConstant.Action.PICK_CARD),
        });
    },

    requestDicard: function (card) {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(PhomConstant.Action.DISCARD),
            card: NetworkManager.SmartFox.type.byte(card.getId())
        });
    },

    requestUPhom: function () {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(PhomConstant.Action.U_PHOM),
        });
    },

});

module.exports = PhomGameManager;
