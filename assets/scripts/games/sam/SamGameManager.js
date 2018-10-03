var BaseGameManager = require('BaseGameManager'),
    Utils = require('Utils'),
    SamConstant = require('SamConstant'),
    NetworkManager = require('NetworkManager'),
    SmartFoxConstant = require('SmartFoxConstant'),
    SamGameManager;
SamGameManager = Utils.Class({
    $$extends: BaseGameManager,

    $$constructor: function(game, roomId) {
        this.$super.constructor.call(this, game, roomId);
        // command từ smartfox server
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.UPDATE_GAME.ID, this.onUpdateGame, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.FINISH_GAME.ID, this.onFinishGame, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.UPDATE_HAND.ID, this.onUpdateHand, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.WAITING_DEAL_CARD.ID, this.onWaitingDealCard, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.WAITING_PLAYER_ADDED.ID, this.onWaitingForPlayer, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.TURN.ID, this.onTurn, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.REFRESH_GAME.ID, this.onRefreshGame, this);

        // các action của game play
        this.eventDispatchers.playCmd.addEventListener(SamConstant.Action.WAITING_BAO_SAM, this.onWaitingBaoSam, this);
        this.eventDispatchers.playCmd.addEventListener(SamConstant.Action.CHAT_HANG, this.onChatHang, this);
        this.eventDispatchers.playCmd.addEventListener(SamConstant.Action.BAO_SAM, this.onBaoSam, this);
        this.eventDispatchers.playCmd.addEventListener(SamConstant.Action.BAO, this.onBaoMot, this);
        this.eventDispatchers.playCmd.addEventListener(SamConstant.Action.HUY_BAO_SAM, this.onHuyBaoSam, this);
    },

    // ============================================================
    // Receive API
    // ============================================================
    onUpdateGame: function(params) {
        this.onRefreshGame(params);
    },

    onWaitingBaoSam: function(params) {
        this.gameState = SamConstant.GameState.BAO_SAM;
        this.eventDispatchers.local.dispatchEvent(SamConstant.Event.WAITING_BAO_SAM, params);
    },

    onFinishGame: function(params) {
        this.gameState = SamConstant.GameState.FINISH;
        this.eventDispatchers.local.dispatchEvent(SamConstant.Event.FINISH_GAME, params);
    },

    onUpdateHand: function(params) {
        this.eventDispatchers.local.dispatchEvent(SamConstant.Event.UPDATE_HAND, params);
    },

    onWaitingForPlayer: function() {
        this.eventDispatchers.local.dispatchEvent(SamConstant.Event.WAITING_FOR_PLAYER);
    },

    onWaitingDealCard: function(params) {
        this.gameState = SamConstant.GameState.WAITING_FOR_NEW_GAME;
        this.eventDispatchers.local.dispatchEvent(SamConstant.Event.WAITING_DEAL_CARD, params);
    },

    onTurn: function(params) {
        this.gameState = SamConstant.GameState.PLAYING;
        if (params.lastPlayer) {
            if (params.cards) {
                this.eventDispatchers.local.dispatchEvent(SamConstant.Event.DISCARD, { cards: params.data.cards, userName: params.data.lastPlayer.userName });
            }
            if (params.toPlayer) {
                this.eventDispatchers.local.dispatchEvent(SamConstant.Event.TURN, { userName: params.data.toPlayer.userName, wait: 1, newTurn: params.data.newTurn, timeTurn: params.data.time });
            }
        } else {
            if (params.toPlayer) {
                this.eventDispatchers.local.dispatchEvent(SamConstant.Event.TURN, { userName: params.data.toPlayer.userName, wait: 0, newTurn: params.data.newTurn, timeTurn: params.data.time });
            }
        }
    },

    onChatHang: function(params) {
        this.eventDispatchers.local.dispatchEvent(SamConstant.Event.CHAT_HANG, params);
    },

    onBaoSam: function(params) {
        this.eventDispatchers.local.dispatchEvent(SamConstant.Event.PLAYER_BAO_SAM, params.data.userName);
    },

    onBaoMot: function(params) {
        this.eventDispatchers.local.dispatchEvent(SamConstant.Event.PLAYER_BAO_MOT, params.data.userName);
    },

    onHuyBaoSam: function() {
        this.eventDispatchers.local.dispatchEvent(SamConstant.Event.PLAYER_HUY_BAO_SAM);
    },

    onRefreshGame: function(params) {
        this.gameState = params.allData.gameState;
        switch (params.allData.gameState) {
            case SamConstant.GameState.WAITING_FOR_PLAYER:
                this.onWaitingForPlayer();
                break;
            case SamConstant.GameState.WAITING_FOR_NEW_GAME:
                this.onWaitingDealCard(params);
                break;
            case SamConstant.GameState.BAO_SAM:
                this.onWaitingBaoSam(params);
                this.onUpdateHand(params);
                break;
            case SamConstant.GameState.PLAYING:
                this.onTurn(params);
                this.onUpdateHand(params);
                if (params.data.trash) {
                    this.eventDispatchers.local.dispatchEvent(SamConstant.Event.REFRESH_GAME, params);
                }
                break;
            case SamConstant.GameState.FINALIZING:

                break;
            case SamConstant.GameState.FINISH:

                break;
        }
    },

    // ============================================================
    // Request API
    // ============================================================
    sendRequestStartGame: function() {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.DEAL_CARD.ID)
        });
    },

    sendRequestDiscard: function(cards) {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(SamConstant.Action.DISCARD),
            cards: NetworkManager.SmartFox.type.byteArray(cards)
        });
    },

    sendRequestBaoSam: function() {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(SamConstant.Action.BAO_SAM),
        });
    },

    sendRequestBoQuaBaoSam: function() {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(SamConstant.Action.HUY_BAO_SAM),
        });
    }
});

module.exports = SamGameManager;
