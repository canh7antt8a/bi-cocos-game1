var BaseMainGameplay = require('BaseMainGameplay'),
    PhomConstant = require('PhomConstant'),
    AuthUser = require('AuthUser'),
    UiManager = require('UiManager'),
    GameConstant = require('GameConstant'),
    EventDispatcher = require('EventDispatcher'),
    EventDispatcherConstant = require('EventDispatcherConstant');

cc.Class({
    extends: BaseMainGameplay,

    properties: {
        numNocCardLabel: cc.Label,
        gameStateLabel: cc.Label,
        countDownTimeLabel: cc.Label,
        nocCardNode: cc.Node,
        arrowNocNode: cc.Node,
        anBaiButton: cc.Button,
        bocBaiButton: cc.Button,
        danhBaiButton: cc.Button,
        xepBaiButton: cc.Button,
        haBaiButton: cc.Button,
        guiBaiButton: cc.Button,
        uButton: cc.Button,
        startButton: cc.Button,

        gameCmd: {
            'default': GameConstant.PHOM.CMD,
            visible: false
        },
    },

    // use this for initialization
    $onLoad: function () {
        this.gameManager.eventDispatchers.local.addEventListener(PhomConstant.Event.UPDATE_HAND, this.onUpdateHand, this);
        this.gameManager.eventDispatchers.local.addEventListener(PhomConstant.Event.WAITING_DEAL_CARD, this.onWaitingDealCard, this);
        this.gameManager.eventDispatchers.local.addEventListener(PhomConstant.Event.UPDATE_GAME, this.onUpdateGame, this);
        this.gameManager.eventDispatchers.local.addEventListener(PhomConstant.Event.FINISH_GAME, this.onFinishGame, this);

        this.gameManager.eventDispatchers.local.addEventListener(PhomConstant.Event.CHANGE_TURN, this.onChangeTurn, this);
        this.gameManager.eventDispatchers.local.addEventListener(PhomConstant.Event.DISCARD, this.onDiscardResponse, this);
        this.gameManager.eventDispatchers.local.addEventListener(PhomConstant.Event.PICK_CARD, this.onPickCardResponse, this);
        this.gameManager.eventDispatchers.local.addEventListener(PhomConstant.Event.TAKE_CARD, this.onTakeCardResponse, this);
        this.gameManager.eventDispatchers.local.addEventListener(PhomConstant.Event.SHOW_OFF, this.onShowOffResponse, this);
        this.gameManager.eventDispatchers.local.addEventListener(PhomConstant.Event.AUTO_SHOW_OFF, this.onAutoShowOffResponse, this);
        this.gameManager.eventDispatchers.local.addEventListener(PhomConstant.Event.SENT_CARD, this.onSentCardResponse, this);

        EventDispatcher.addEventListener(EventDispatcherConstant.PROFILE.UPDATE_INFO, this.onUpdateUserInfo, this);
        var self = this;
        self.myCards = [];

        if (!this.updatedGame) {
            this.clearStateGame();
            this.clearBeforeChangeTurn();
        }
        this.isLoaded = true;

        for (var i = 0; i < this.playerNodeList.length; i += 1) {
            this.playerNodeList[i].node.on('refresh_game', this.refreshPlayer, this);
        }
    },

    $onUpdate: function () {
        if (this.gameManager) {
            var count;
            if (this.gameManager.gameState === PhomConstant.GameState.WAITING_FOR_NEW_GAME || this.gameManager.gameState === PhomConstant.GameState.FINISH || this.gameManager.gameState === PhomConstant.GameState.FINALIZING) {
                count = Math.floor((this.countDownTime - Date.now()) / 1000);
                count = count >= 0 ? count : 0;
                this.countDownTimeLabel.string = count;
                if (count === 0) {
                    this.countDownTimeLabel.node.active = false;
                    this.gameStateLabel.node.active = false;
                    if (this.gameManager.gameState === PhomConstant.GameState.FINISH) {
                        this.clearStateGame();
                        this.gameStateLabel.string = 'Ván mới sẽ được bắt đầu trong giây lát.';
                        this.gameStateLabel.node.active = true;
                        this.gameManager.gameState = PhomConstant.GameState.NONE;
                    }
                }
            }
            else {
                this.startButton.node.active = false;
                this.countDownTimeLabel.node.active = false;
                this.gameStateLabel.node.active = false;
            }
        }
    },

    $onFocus: function () {
        this.isLostFocus = true;
    },

    $onLostFocus: function () {
        this.isLostFocus = true;
    },

    // ============================================================
    // Xử lý Button được click
    // ============================================================
    onButtonXepBai: function () {
        this.audioManager.playButtonClick();
        this.curPlayerUI()._isSanhFirst = !this.curPlayerUI()._isSanhFirst;
        this.curPlayerUI().onXepLaiBai(true);
    },

    onButtonBocBai: function () {
        this.audioManager.playButtonClick();
        if (this.curPlayerUI().action === PhomConstant.Action.PICK_CARD) {
            this.gameManager.requestPickCard();
        }
    },

    onButtonDanhBai: function () {
        this.audioManager.playButtonClick();
        if (this.curPlayerUI().action === PhomConstant.Action.DISCARD) {
            var cardDiscard = this.curPlayerUI().getCardTouched();
            if (cardDiscard.length === 1) {
                this.gameManager.requestDicard(cardDiscard[0].card);
            }
            else if (cardDiscard.length === 0) {
                UiManager.openWarningMessage('Bạn cần chọn quân bài để đánh.', 1);
            }
            else {
                UiManager.openWarningMessage('Chỉ được chọn 1 quân bài để đánh.', 1);
            }
        }
    },

    onButtonAnBai: function () {
        this.audioManager.playButtonClick();
        if (this.curPlayerUI().action === PhomConstant.Action.PICK_CARD) {
            this.gameManager.requestTakeCard();
        }
    },

    onButtonHaBai: function () {
        this.audioManager.playButtonClick();
        if (this.curPlayerUI().action === PhomConstant.Action.SHOW_OFF) {
            var cards = this.curPlayerUI().getCardTouched();
            var cardIds = [];
            for (var i = 0; i < cards.length; i += 1) {
                cardIds.push(cards[i].card.getId());
            }
            this.gameManager.requestShowOff(cardIds);
        }
    },

    onButtonGuiBai: function () {
        this.audioManager.playButtonClick();
        if (this.curPlayerUI().action === PhomConstant.Action.SENT_CARD) {
            var curPlayer = this.curPlayerUI();
            var sendablePhomList = curPlayer.player.data.inTurnData.sendablePhomList;
            this.gameManager.requestSentCard(sendablePhomList[0].card, sendablePhomList[0].cards);
        }
    },

    onButtonU: function () {
        this.audioManager.playButtonClick();
        this.gameManager.requestUPhom();
    },

    onButtonStart: function () {
        this.audioManager.playButtonClick();
        this.gameManager.sendRequestStartGame();
        this.startButton.interactable = false;
        this.startButton.node.active = false;
    },
    // ============================================================
    // Xử lý các event từ GameManager
    // ============================================================
    onFinishGame: function (data) {
        this.clearBeforeChangeTurn();
        var dt = 0;
        if (data.__execInfo__) {
            dt = data.__execInfo__.dt;
        }
        this.countDownTime = Date.now() + data.data.time - dt;
        var countMoneyExchange = 0;
        var isU;
        var finishUDen = false;
        var playerWin;
        if (data.data.result.actions) {
            for (var i = 0; i < data.data.result.actions.length; i += 1) {
                var action = data.data.result.actions[i];
                var playerUIPhom = this.findPlayerNodeByName(action.sourcePlayer);
                if (playerUIPhom) {
                    var isUDen = data.data.uDenPlayer && data.data.uDenPlayer === playerUIPhom.player.data.username;
                    if (isUDen) {
                        finishUDen = true;
                    }
                    if (playerUIPhom.player.data.state !== PhomConstant.PlayerState.WAITING) {
                        playerUIPhom.showRankAndMoneyExchange(-action.moneyExchange, action.action, false, isUDen);
                    }
                }
                countMoneyExchange += action.moneyExchange;
                isU = action.action === PhomConstant.Finish.U;
            }
            playerWin = this.findPlayerNodeByName(data.data.result.actions[0].targetPlayer);
            if (playerWin) {
                countMoneyExchange -= Math.floor(countMoneyExchange * this.gameManager.fee);
                playerWin.showRankAndMoneyExchange(countMoneyExchange, PhomConstant.Finish.VE_NHAT, isU, false);
                if (finishUDen) {
                    playerWin.onShowOffCard(playerWin.player.data.phomList);
                }
                if (data.data.uType) {
                    if (data.data.uType.toUpperCase() === 'Ù TRÒN') {
                        playerWin.addEffect(PhomConstant.Effect.U_TRON);
                    }
                    else if (data.data.uType.toUpperCase() === 'Ù KHÔNG CẠ') {
                        playerWin.addEffect(PhomConstant.Effect.U_KHONG_CA);
                    }
                }
            }
            if (playerWin.player.data.username === AuthUser.username) {
                if (isU) {
                    this.audioManager.playThangTrang();
                }
                else {
                    this.audioManager.playWin();
                }
            }
            else {
                this.audioManager.playLose();
            }
        }

        if (data.data.result.summary) {
            for (var j = 0; j < data.data.result.summary.length; j += 1) {
                var summary = data.data.result.summary[j];
                var playerShowCard = this.findPlayerNodeByName(summary.userName);
                if (playerShowCard) {
                    if (finishUDen && playerWin === playerShowCard) {
                        continue;
                    }
                    if (playerShowCard.player.data.state !== PhomConstant.PlayerState.WAITING) {
                        playerShowCard.showAllCards(summary.hand);
                        if (!isU) {
                            playerShowCard.pointLabel.string = summary.point + ' Điểm';
                        }
                        playerShowCard.onRefreshGame(true);
                    }
                }
            }
        }
    },

    onUpdateGame: function (data) {
        this.updatedGame = true;
        this.updateInfoGame(data.data);
        this.clearBeforeChangeTurn();
        if (data.allData.gameState === PhomConstant.GameState.PGS_WAIT_FOR_DEALING) {
            this.onWaitingDealCard({
                time: data.data.time,
                dealer: data.data.dealer
            });
        }
        else if (data.allData.gameState === PhomConstant.GameState.DEALING) {
            this.clearStateGame();
        }
        else if (data.allData.gameState === PhomConstant.GameState.PLAYING) {
            var updateData = data.allData;

            this.setStateNocCard(0);
            if (updateData.nNocCards) {
                this.setStateNocCard(updateData.nNocCards);
            }
            // player
            var childView;
            for (var i = 0; i < updateData.players.length; i += 1) {
                childView = this.getPlayerByUserName(updateData.players[i].username);
                if (childView) {
                    var playerUIPhom = childView.getComponent('PlayerUIPhom');
                    playerUIPhom.onUpdateGame();

                    if (updateData.players[i].state === PhomConstant.PlayerState.IN_TURN) {
                        var dt = 0;
                        if (data.__execInfo__) {
                            dt = data.__execInfo__.dt;
                        }
                        playerUIPhom.setCountDown(updateData.time - dt);
                        playerUIPhom.setStateInTurn(updateData.players[i].inTurnState);
                        if (updateData.players[i].username === AuthUser.username) {
                            this.setCurrentPlayerInTurn();
                        }
                    }
                    else if (updateData.players[i].state === PhomConstant.PlayerState.WAITING) {
                        if (updateData.players[i].username === AuthUser.username) {
                            this.clearBeforeChangeTurn();
                        }
                    }

                }
            }

        }
        else if (data.allData.gameState === PhomConstant.GameState.FINISH) {
            this.clearStateGame();
            this.gameStateLabel.string = 'Ván mới sẽ được bắt đầu trong giây lát.';
            this.gameStateLabel.node.active = true;
        }
        else {

        }
    },

    onUpdateHand: function (data) {
        this.startButton.node.active = false;
        this.countDownTimeLabel.node.active = false;
        this.gameStateLabel.node.active = false;
        this.setStateNocCard(data.nNocCards);
        this.audioManager.playBaiChia();
        var childView;
        for (var i = 0; i < data.players.length; i += 1) {
            childView = this.getPlayerByUserName(data.players[i].username);
            if (childView) {
                var playerUIPhom = childView.getComponent('PlayerUIPhom');

                if (childView === this.playerNodeList[0].node) {
                    playerUIPhom.onUpdateHand(playerUIPhom.player.data.cards, playerUIPhom.player.data.handSize, true);
                }
                else {
                    playerUIPhom.onUpdateHand(null, playerUIPhom.player.data.handSize, false);
                }
            }
        }
    },

    onWaitingDealCard: function (data) {
        this.gameStateLabel.string = 'Chuẩn bị ván mới';
        this.gameStateLabel.node.active = true;
        var dt = 0;
        if (data.__execInfo__) {
            dt = data.__execInfo__.dt;
        }
        this.countDownTime = Date.now() + data.time - dt;
        this.countDownTimeLabel.string = Math.floor(data.time / 1000);
        this.countDownTimeLabel.node.active = true;

        this.nocCardNode.active = false;
        this.arrowNocNode.active = false;
        this.numNocCardLabel.string = 0;

        var childView;
        for (var i = 0; i < this.playerNodeList.length; i += 1) {
            childView = this.playerNodeList[i];
            if (childView) {
                childView.getComponent('PlayerUIPhom').clearAll();
            }
        }
        if (!data) {
            return;
        }
        // if (data.dealer === this.curPlayerUI().player.data.username) {
        //     this.startButton.node.active = true;
        //     this.startButton.interactable = true;
        // } else {
        //     this.startButton.node.active = false;
        //     this.startButton.interactable = false;
        // }
        this.startButton.node.active = false;
        this.startButton.interactable = false;
    },

    onChangeTurn: function (data) {
        this.startButton.node.active = false;
        if (data.allData.nNocCards) {
            this.setStateNocCard(data.allData.nNocCards);
        }
        this.audioManager.playTurnStart();
        var childView;
        if (this.foundDiscard) {
            // this.foundDiscard.hoverAnNode.active = false;
            this.foundDiscard = null;
        }
        for (var i = 0; i < this.playerNodeList.length; i += 1) {
            childView = this.playerNodeList[i].getComponent('PlayerUIPhom');
            if (!childView.player) {
                continue;
            }
            if (childView.player.data.username !== data.data.userName) {
                childView.clearCountDown();
                if (childView.player.data.state !== PhomConstant.PlayerState.WAITING) {
                    childView.clearEffects();
                }
            }
            else {
                var dt = 0;
                if (data.__execInfo__) {
                    dt = data.__execInfo__.dt;
                }
                childView.setCountDown(data.data.time - dt);
                childView.setStateAction(data.data.action);
            }
            childView.hideGuiButtons();
        }

        this.clearBeforeChangeTurn();
        if (this.curPlayerUI().player.data.state !== PhomConstant.PlayerState.WAITING) {
            this.xepBaiButton.interactable = true;
        }
        if (data.data.userName === this.curPlayerUI().player.data.username) {
            this.setCurrentPlayerInTurn();
        }
        // this.onRefreshGame(data);

    },

    onDiscardResponse: function (data) {
        this.audioManager.playDanhBai();
        this.xepBaiButton.interactable = false;
        this.danhBaiButton.interactable = false;
        var playPhomView = this.getPlayerByUserName(data.data.userName);
        if (playPhomView) {
            playPhomView.getComponent('PlayerUIPhom').onDiscard([data.data.card]);
            this.lastPlayer = playPhomView.getComponent('PlayerUIPhom');
        }
    },

    onSentCardResponse: function (data) {
        this.audioManager.playPhomPickCard();
        this.xepBaiButton.interactable = false;
        this.guiBaiButton.interactable = false;
        var sourcePlayer = this.getPlayerByUserName(data.data.userName);
        var sourcePlayerUIPhom;
        if (sourcePlayer) {
            sourcePlayerUIPhom = sourcePlayer.getComponent('PlayerUIPhom');
        }
        var targetPlayer = this.getPlayerByUserName(data.data.targetPlayer);
        if (targetPlayer) {
            targetPlayer.getComponent('PlayerUIPhom').onSentCard(data.data.card, data.data.cards, sourcePlayerUIPhom);
        }
        else {
            if (this.playerQuit) {
                for (var k = 0; k < this.playerQuit.length; k += 1) {
                    if (this.playerQuit[k].username === data.data.targetPlayer) {
                        targetPlayer = this.playerQuit[k].slot;
                        if (targetPlayer) {
                            targetPlayer.getComponent('PlayerUIPhom').onSentCard(data.data.card, data.data.cards, sourcePlayerUIPhom);
                        }
                    }
                }
            }
        }

    },

    onTakeCardResponse: function (data) {
        this.xepBaiButton.interactable = false;
        this.anBaiButton.interactable = false;
        this.bocBaiButton.interactable = false;
        this.audioManager.playPhomPickCard();
        var targetPlayer = this.getPlayerByUserName(data.data.targetPlayer);
        var targetPlayerUIPhom;
        if (targetPlayer) {
            targetPlayerUIPhom = targetPlayer.getComponent('PlayerUIPhom');
            targetPlayerUIPhom.onTakeCard(data.data.card);
            var moneyExchange = data.data.money - Math.floor(data.data.money * this.gameManager.fee);
            targetPlayerUIPhom.showMoneyExchange(moneyExchange);
        }

        var sourcePlayer = this.getPlayerByUserName(data.data.sourcePlayer);
        if (sourcePlayer) {
            var sourcePlayerUIPhom = sourcePlayer.getComponent('PlayerUIPhom');
            sourcePlayerUIPhom.showMoneyExchange(-data.data.money);
            sourcePlayerUIPhom.effectTakenCard(targetPlayerUIPhom, data.data.card);

        }

        if (data.data.isTaiLuot && data.data.taiLuotPlayer !== '') {
            var taiLuotPlayer = this.getPlayerByUserName(data.data.taiLuotPlayer);
            if (taiLuotPlayer) {
                var taiLuotPlayerUIPhom = taiLuotPlayer.getComponent('PlayerUIPhom');
                taiLuotPlayerUIPhom.setEffect(PhomConstant.Effect.TAI_LUOT);
            }
        }
    },

    onPickCardResponse: function (data) {
        this.xepBaiButton.interactable = false;
        this.bocBaiButton.interactable = false;
        this.anBaiButton.interactable = false;
        var playPhomView = this.getPlayerByUserName(data.data.userName);
        if (playPhomView) {
            this.audioManager.playPhomPickCard();
            var playerUIPhom = playPhomView.getComponent('PlayerUIPhom');
            var pickedCard;
            if (playerUIPhom.player.data.pickedCards) {
                pickedCard = playerUIPhom.player.data.pickedCards[playerUIPhom.player.data.pickedCards.length - 1];
            }
            else {
                pickedCard = null;
            }
            playerUIPhom.onPickCard(pickedCard);
        }
    },

    onShowOffResponse: function (data) {
        this.xepBaiButton.interactable = false;
        this.showOff(data);
    },

    onAutoShowOffResponse: function (data) {
        this.xepBaiButton.interactable = false;
        this.showOff(data);
    },
    // ============================================================
    // Other
    // ============================================================

    curPlayerUI: function () {
        return this.playerNodeList[0];
    },

    setCurrentPlayerInTurn: function () {
        var inTurnData = this.curPlayerUI().player.data.inTurnData;
        var inTurnState = this.curPlayerUI().player.data.inTurnState;
        switch (inTurnState) {
        case PhomConstant.InTurnState.DISCARD:
            this.haBaiButton.node.active = false;
            this.guiBaiButton.node.active = false;
            this.anBaiButton.node.active = true;
            this.bocBaiButton.node.active = true;
            this.setStateDisCard();
            this.curPlayerUI().action = PhomConstant.Action.DISCARD;

            break;
        case PhomConstant.InTurnState.PICK_OR_TAKE_CARD:
            this.haBaiButton.node.active = false;
            this.guiBaiButton.node.active = false;
            this.anBaiButton.node.active = true;
            this.bocBaiButton.node.active = true;
            this.setStatePickCard();
            this.curPlayerUI().action = PhomConstant.Action.PICK_CARD;
            if (inTurnData.canTake) {
                this.setStateTakeCard(inTurnData.card);
            }

            break;
        case PhomConstant.InTurnState.SHOW_OFF:
            this.haBaiButton.node.active = true;
            this.guiBaiButton.node.active = true;
            this.anBaiButton.node.active = false;
            this.bocBaiButton.node.active = false;
            this.setStateShowOff(inTurnData.phomList);
            this.curPlayerUI().action = PhomConstant.Action.SHOW_OFF;

            break;
        case PhomConstant.InTurnState.SEND:
            this.haBaiButton.node.active = true;
            this.guiBaiButton.node.active = true;
            this.anBaiButton.node.active = false;
            this.bocBaiButton.node.active = false;
            this.setStateSentCard(inTurnData.sendablePhomList);
            this.curPlayerUI().action = PhomConstant.Action.SENT_CARD;

            break;
        }
        if (inTurnData.canU) {
            this.setStateUPhom();
        }
    },

    onRefreshGame: function (params) {
        // player
        var childView;
        for (var i = 0; i < params.allData.players.length; i += 1) {
            childView = this.getPlayerByUserName(params.allData.players[i].username);
            if (childView) {
                childView.getComponent('PlayerUIPhom').onRefreshGame(false);
            }
        }

    },

    refreshPlayer: function (event) {
        for (var i = 0; i < this.playerNodeList.length; i += 1) {
            if (!this.playerNodeList[i].player) {
                continue;
            }
            this.playerNodeList[i].node.getComponent('PlayerUIPhom').onRefreshGame(false, event.detail);
        }
    },

    getPlayerByUserName: function (username) {
        for (var i = 0; i < this.playerNodeList.length; i += 1) {
            if (!this.playerNodeList[i].player) {
                continue;
            }
            if (this.playerNodeList[i].player.data.username === username) {
                return this.playerNodeList[i].node;
            }
        }
        return null;
    },

    updateInfoGame: function (data) {
        var optionLabel = (data && data.acceptUTron) ? 'Luật: Ù Tròn' : 'Luật: Ù Thường';
        this.topPanelInGameData.optionLabel = optionLabel;
        if (this.topPanelInGame) {
            this.topPanelInGame.setOptionLabel(optionLabel);
        }
    },

    setStateNocCard: function (data) {
        // board
        if (data > 0) {
            this.nocCardNode.active = true;
            this.numNocCardLabel.node.active = true;
            this.numNocCardLabel.string = data;
        }
        else {
            this.nocCardNode.active = false;
            this.numNocCardLabel.node.active = false;
            this.numNocCardLabel.string = '0';
        }

    },

    clearStateGame: function () {
        this.nocCardNode.active = false;
        this.arrowNocNode.active = false;
        this.numNocCardLabel.string = 0;
        this.startButton.node.active = false;
        this.startButton.interactable = false;
        this.playerQuit = [];
        var childView;
        for (var i = 0; i < this.playerNodeList.length; i += 1) {
            childView = this.playerNodeList[i].getComponent('PlayerUIPhom');
            if (childView) {
                childView.clearAll();
            }
        }
    },

    showOff: function (data) {
        var playPhomView = this.getPlayerByUserName(data.data.userName);
        if (playPhomView) {
            this.audioManager.playDanhBai();
            var playerUIPhom = playPhomView.getComponent('PlayerUIPhom');
            playerUIPhom.onShowOffCard(data.data.phomList);
        }
    },

    setStateDisCard: function () {
        this.danhBaiButton.interactable = true;
        this.xepBaiButton.interactable = true;
    },

    setStatePickCard: function () {
        this.arrowNocNode.active = false;
        this.bocBaiButton.interactable = true;
    },

    setStateTakeCard: function (card) {
        this.anBaiButton.interactable = true;
        if (this.lastPlayer) {
            this.foundDiscard = this.lastPlayer.findCard(card, this.lastPlayer.portCardTrash);
            if (this.foundDiscard) {
                this.foundDiscard.hoverAnNode.active = true;
            }
        }
    },

    setStateShowOff: function (data) {
        this.haBaiButton.interactable = true;
        this.curPlayerUI().setStateCardInShowOff(data);
    },

    setStateSentCard: function (sendablePhomList) {
        if (sendablePhomList) {
            this.guiBaiButton.interactable = true;
            var playerUIPhom = this.curPlayerUI();
            var cardId = sendablePhomList[0].card;
            var card = playerUIPhom.findCard(cardId, playerUIPhom.cardHold);
            if (card) {
                card.onButtonTouch();
            }
            var count = 0;
            for (var j = 0; j < sendablePhomList.length; j += 1) {
                if (cardId === sendablePhomList[j].card) {
                    count += 1;
                }
            }
            if (count > 1) {
                // this.guiBaiButton.interactable = false;
                for (var i = 0; i < sendablePhomList.length; i += 1) {
                    var targetPlayer = this.getPlayerByUserName(sendablePhomList[i].userName);
                    if (targetPlayer) {
                        targetPlayer.getComponent('PlayerUIPhom').showGuiButtonInPhoms(cardId, sendablePhomList[i].cards, this.gameManager);
                    }
                    else {
                        if (this.playerQuit) {
                            for (var k = 0; k < this.playerQuit.length; k += 1) {
                                if (this.playerQuit[k].username === sendablePhomList[i].userName) {
                                    targetPlayer = this.playerQuit[k].slot;
                                    if (targetPlayer) {
                                        targetPlayer.getComponent('PlayerUIPhom').showGuiButtonInPhoms(cardId, sendablePhomList[i].cards, this.gameManager);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },

    setStateUPhom: function () {
        this.uButton.interactable = true;
        this.uButton.node.active = true;
    },

    clearBeforeChangeTurn: function () {
        this.arrowNocNode.active = false;
        this.uButton.node.active = false;
        this.setInteractableButtons(false);
    },

    setInteractableButtons: function (value) {
        this.xepBaiButton.interactable = value;
        this.anBaiButton.interactable = value;
        this.danhBaiButton.interactable = value;
        this.bocBaiButton.interactable = value;
        this.uButton.interactable = value;
        this.haBaiButton.interactable = value;
        this.guiBaiButton.interactable = value;

        this.xepBaiButton.node.setScale(1);
        this.anBaiButton.node.setScale(1);
        this.danhBaiButton.node.setScale(1);
        this.bocBaiButton.node.setScale(1);
        this.uButton.node.setScale(1);
        this.haBaiButton.node.setScale(1);
        this.guiBaiButton.node.setScale(1);

    },

    onPrePlayerRemoved: function (playerNode) {
        if (this.playerQuit) {
            this.playerQuit = [];
        }
        var playerUIPhom = playerNode.node.getComponent('PlayerUIPhom');
        if (playerUIPhom.backCardNode) {
            playerUIPhom.backCardNode.active = false;
        }
        if (this.playerQuit) {
            this.playerQuit.push({
                username: playerUIPhom.player.data.username,
                slot: playerNode
            });
        }
    },

    onPostPlayerAdded: function (playerNode) {
        if (playerNode.player) {
            if (playerNode.player.data.state === PhomConstant.PlayerState.WAITING) {
                playerNode.addEffect(PhomConstant.Effect.DANG_DOI);
            }
        }
    },

});
