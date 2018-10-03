var BaseGameManager = require('BaseGameManager'),
    NetworkManager = require('NetworkManager'),
    SmartFoxConstant = require('SmartFoxConstant'),
    TLMNConstant = require('TLMNConstant'),
    Utils = require('Utils'),
    TLMNGameManager;

TLMNGameManager = Utils.Class({
    $$extends: BaseGameManager,

    $$constructor: function (game, roomId) {
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
        this.eventDispatchers.playCmd.addEventListener(TLMNConstant.Action.CHAT_HANG, this.onChatHang, this);
    },

    // ============================================================
    // Receive API
    // ============================================================
    onUpdateGame: function (params) {
        this.onRefreshGame(params);
    },

    onFinishGame: function (params) {
        this.gameState = TLMNConstant.GameStateTLMN.FINISH;
        this.eventDispatchers.local.dispatchEvent(TLMNConstant.Event.FINISH_GAME, params);
    },

    onUpdateHand: function (params) {
        this.eventDispatchers.local.dispatchEvent(TLMNConstant.Event.UPDATE_HAND, params);
    },

    onWaitingForPlayer: function () {
        this.eventDispatchers.local.dispatchEvent(TLMNConstant.Event.WAITING_FOR_PLAYER);
    },

    onWaitingDealCard: function (params) {
        this.gameState = TLMNConstant.GameStateTLMN.WAITING_FOR_NEW_GAME;
        this.eventDispatchers.local.dispatchEvent(TLMNConstant.Event.WAITING_DEAL_CARD, params);
    },

    onTurn: function (params) {
        this.gameState = TLMNConstant.GameStateTLMN.PLAYING;
        if (params.lastPlayer) {
            if (params.cards) {
                this.eventDispatchers.local.dispatchEvent(TLMNConstant.Event.DISCARD, { cards: params.cards, userName: params.lastPlayer.userName });
            }
            if (params.toPlayer) {
                this.eventDispatchers.local.dispatchEvent(TLMNConstant.Event.TURN, { userName: params.toPlayer.userName, wait: 1, newTurn: params.newTurn, timeTurn: params.time });
            }
        } else {
            if (params.toPlayer) {
                this.eventDispatchers.local.dispatchEvent(TLMNConstant.Event.TURN, { userName: params.toPlayer.userName, wait: 0, newTurn: params.newTurn, timeTurn: params.time });
            }
        }
    },

    onRefreshGame: function (params) {
        this.gameState = params.allData.gameState;
        switch (params.allData.gameState) {
            case TLMNConstant.GameStateTLMN.WAITING_FOR_PLAYER:
                this.onWaitingForPlayer();
                break;
            case TLMNConstant.GameStateTLMN.WAITING_FOR_NEW_GAME:
                this.onWaitingDealCard(params);
                break;
            case TLMNConstant.GameStateTLMN.PLAYING:
                this.onTurn(params);
                this.onUpdateHand(params);
                if (params.data.trash) {
                    this.eventDispatchers.local.dispatchEvent(TLMNConstant.Event.REFRESH_GAME, params);
                }
                break;
            case TLMNConstant.GameStateTLMN.FINALIZING:

                break;
            case TLMNConstant.GameStateTLMN.FINISH:

                break;
        }
    },

    onChatHang: function (params) {
        if (params.data.action === TLMNConstant.Action.CHAT_HANG) {
            this.eventDispatchers.local.dispatchEvent(TLMNConstant.Event.CHAT_HANG, params);
        }
    },
    // ============================================================
    // Request API
    // ============================================================
    sendRequestStartGame: function () {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.DEAL_CARD.ID)
        });
    },

    sendRequestDiscard: function (cards) {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(TLMNConstant.Action.DISCARD),
            cards: NetworkManager.SmartFox.type.byteArray(cards)
        });
    },
});

module.exports = TLMNGameManager;
