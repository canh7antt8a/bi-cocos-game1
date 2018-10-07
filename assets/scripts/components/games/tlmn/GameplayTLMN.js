var GameConstant = require('GameConstant'),
    TLMNConstant = require('TLMNConstant'),
    AuthUser = require('AuthUser'),
    BaseMainGameplay = require('BaseMainGameplay'),
    UiManager = require('UiManager'),
    Utils = require('Utils'),
    EventDispatcher = require('EventDispatcher'),
    EventDispatcherConstant = require('EventDispatcherConstant');
cc.Class({
    extends: BaseMainGameplay,

    properties: {
        countDownTimeLabel: cc.Label,
        gameStateLabel: cc.Label,
        startButton: cc.Button,
        boChonButton: cc.Button,
        boLuotButton: cc.Button,
        danhButton: cc.Button,
        portCardTrash: cc.Node,
        gameCmd: {
            'default': GameConstant.TLMN.CMD,
            visible: false
        },
    },

    // use this for initialization
    $onLoad: function () {
        this.gameManager.eventDispatchers.local.addEventListener(TLMNConstant.Event.FINISH_GAME, this.onFinishGame, this);
        this.gameManager.eventDispatchers.local.addEventListener(TLMNConstant.Event.UPDATE_GAME, this.onUpdateGame, this);
        this.gameManager.eventDispatchers.local.addEventListener(TLMNConstant.Event.UPDATE_HAND, this.onUpdateHand, this);
        this.gameManager.eventDispatchers.local.addEventListener(TLMNConstant.Event.WAITING_DEAL_CARD, this.onWaitingDealCard, this);
        this.gameManager.eventDispatchers.local.addEventListener(TLMNConstant.Event.WAITING_FOR_PLAYER, this.onWaitingForPlayer, this);
        this.gameManager.eventDispatchers.local.addEventListener(TLMNConstant.Event.TURN, this.onTurn, this);
        this.gameManager.eventDispatchers.local.addEventListener(TLMNConstant.Event.DISCARD, this.onDiscard, this);
        this.gameManager.eventDispatchers.local.addEventListener(TLMNConstant.Event.REFRESH_GAME, this.onRefreshGame, this);
        this.gameManager.eventDispatchers.local.addEventListener(TLMNConstant.Event.CHAT_HANG, this.onChatHang, this);

        EventDispatcher.addEventListener(EventDispatcherConstant.PROFILE.UPDATE_INFO, this.onUpdateUserInfo, this);
        this.count = 0;
        this.MAX_NUMBER_CARDS = 13;
        if (!this.updatedGame) {
            this.setCurrentPlayerInTurn(false);
        }
        // var self = this;
        this.curPlayerUI().cardHold.on('check_chosen_card', this.showButtonBoChon, this);
    },

    // called every frame, uncomment this function to activate update callback
    $onUpdate: function () {
        if (this.gameManager) {
            if (this.gameManager.gameState === TLMNConstant.GameStateTLMN.WAITING_FOR_NEW_GAME || this.gameManager.gameState === TLMNConstant.GameState.BAO_SAM || this.gameManager.gameState === TLMNConstant.GameStateTLMN.FINISH || this.gameManager.gameState === TLMNConstant.GameStateTLMN.FINALIZING) {
                var count = Math.floor((this.countDownTime - Date.now()) / 1000);
                count = count >= 0 ? count : 0;
                this.countDownTimeLabel.string = count;
                if (count === 0) {
                    this.countDownTimeLabel.node.active = false;
                    this.gameStateLabel.node.active = false;
                    if (this.gameManager.gameState === TLMNConstant.GameStateTLMN.FINISH || this.gameManager.gameState === TLMNConstant.GameStateTLMN.FINALIZING) {
                        this.clearStateGame();
                        this.gameStateLabel.string = 'Ván mới sẽ được bắt đầu trong giây lát.';
                        this.gameStateLabel.node.active = true;
                        this.gameManager.gameState = TLMNConstant.GameStateTLMN.NONE;
                    }
                    else {

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

    // ============================================================
    // Xử lý Button được click
    // ============================================================
    onButtonStartClick: function () {
        this.gameManager.sendRequestStartGame();
        this.audioManager.playButtonClick();
    },

    onButtonBoChonClick: function () {
        this.audioManager.playButtonClick();
        var cardDiscard = this.curPlayerUI().getCardTouched();
        for (var i = 0; i < cardDiscard.length; i += 1) {
            cardDiscard[i].onButtonTouch();
        }
    },

    onButtonBoLuotClick: function () {
        var self = this;
        this.audioManager.playButtonClick();
        this.gameManager.sendRequestDiscard([]);
        this.addTimeout(TLMNConstant.TimeoutId.BOLUOT_ANIMATION, setTimeout(function () {
            var cardDiscard = self.curPlayerUI().getCardTouched();
            for (var i = 0; i < cardDiscard.length; i += 1) {
                cardDiscard[i].onButtonTouch();
            }
        }, 200));
    },

    onButtonDanhClick: function () {
        this.audioManager.playButtonClick();
        if (this.curPlayerUI().player.data.state === TLMNConstant.PlayerState.IN_TURN) {
            var cardDiscard = this.curPlayerUI().getCardTouched();
            var cardIds = [];
            for (var i = 0; i < cardDiscard.length; i += 1) {
                cardIds.push(cardDiscard[i].card.getId());
            }
            if (cardIds.length === 0) {
                UiManager.openWarningMessage('Bạn cần chọn quân bài để đánh.', 1);
                return;
            }
            this.gameManager.sendRequestDiscard(cardIds);
        }
    },
    // ============================================================
    // Xử lý các event từ GameManager
    // ============================================================
    onWaitingForPlayer: function () {
        this.gameStateLabel.string = 'Đợi người chơi khác';
    },

    onWaitingDealCard: function (params) {
        var dt = 0;
        if (params.__execInfo__) {
            dt = params.__execInfo__.dt;
        }
        this.count += 1;
        this.gameStateLabel.string = 'Ván bài sẽ bắt đầu sau:';
        this.gameStateLabel.node.active = true;
        this.countDownTime = Date.now() + params.allData.time - dt;
        this.countDownTimeLabel.string = Math.floor(params.allData.time / 1000);
        this.countDownTimeLabel.node.active = true;
        this.clearStateGame();

        if (!params) {
            return;
        }
        // if (this.playerNodeList[0].player && this.playerNodeList[0].player.data.isMaster) {
        //     this.startButton.node.active = true;
        //     this.startButton.interactable = true;
        // } else {
        //     this.startButton.node.active = false;
        //     this.startButton.interactable = false;
        // }
        this.startButton.node.active = false;
        this.startButton.interactable = false;
    },

    onUpdateHand: function (params) {
        this.gameStateLabel.node.active = false;
        this.countDownTimeLabel.node.active = false;
        this.startButton.interactable = false;
        this.startButton.node.active = false;
        this.clearTrashCards();
        this.audioManager.playBaiChia();
        var childView;
        for (var i = 0; i < params.players.length; i += 1) {
            if (params.players[i].username) {
                childView = this.findPlayerNodeByName(params.players[i].username);
            }
            else {
                childView = this.findPlayerNodeByName(params.players[i].userName);
            }
            if (childView) {
                if (childView === this.playerNodeList[0]) {
                    childView.getComponent('PlayerUITLMN').onUpdateHand(params.hand, params.players[i].handSize, false);
                }
                else {
                    childView.getComponent('PlayerUITLMN').onUpdateHand(null, params.players[i].handSize, false);
                }
            }
        }
    },

    onUpdateGame: function (params) {
        if (params.allData.gameState === TLMNConstant.GameStateTLMN.WAITING_FOR_PLAYER) {
            this.gameStateLabel.string = 'Đợi người chơi khác';
        }
    },

    onTurn: function (params) {
        var self = this;
        if (params.newTurn) {
            for (var j = 0; j < this.portCardTrash.childrenCount; j += 1) {
                var card = this.portCardTrash.children[j];
                card.stopAllActions();
                var chiaBaiAction = cc.sequence(
                    cc.spawn(
                        cc.moveTo(0.2, cc.p(-350, 0)),
                        cc.scaleTo(0.2, 0.5, 1)
                    ),
                    cc.callFunc(function () {
                        this.getComponent('CardUIPhom').fold();
                        this.rotation = 0;
                    }, card),
                    cc.scaleTo(0.1, 0.7)
                );
                chiaBaiAction.easing(cc.easeQuadraticActionOut());
                card.runAction(chiaBaiAction);
            }
        }

        var childView;
        for (var i = 0; i < this.playerNodeList.length; i += 1) {
            childView = this.playerNodeList[i].getComponent('PlayerUITLMN');
            if (!childView.player) {
                continue;
            }
            if (childView.player.data.state !== TLMNConstant.PlayerState.WAITING) {
                childView.clearEffects();
            }
            if (childView.player.data.username !== params.userName) {
                childView.clearCountDown();
            }
            else {
                var dt = 0;
                if (params.__execInfo__) {
                    dt = params.__execInfo__.dt;
                }
                childView.setCountDown(params.timeTurn - dt);
            }

            if (childView.player.data.isBaoSam) {
                childView.addEffect(TLMNConstant.Effect.BAO_SAM);
            }

            if (childView.player.data.isBao) {
                childView.addEffect(TLMNConstant.Effect.BAO, true);
            }

            if (childView.player.data.state === TLMNConstant.PlayerState.NONE) {
                childView.addEffect(TLMNConstant.Effect.DANG_DOI);
            }

            if (childView.player.data.state === TLMNConstant.PlayerState.OUT_TURN) {
                childView.addEffect(TLMNConstant.Effect.HET_LUOT);
            }

            childView.onRefresh();
        }

        this.updatedGame = true;
        if (this.curPlayerUI().getComponent('PlayerUITLMN').player.data.state === TLMNConstant.PlayerState.IN_TURN) {
            this.audioManager.playTurnStart();
            this.addTimeout(TLMNConstant.TimeoutId.CHANGE_TURN, setTimeout(function () {
                self.setCurrentPlayerInTurn(true);
            }, 1000));
        }
        else {
            this.setCurrentPlayerInTurn(false);
        }
        // this.curPlayerUI().onRefresh();
    },

    onDiscard: function (params) {
        var childView = this.findPlayerNodeByName(params.userName);

        if (childView) {
            var self = this;
            childView.getComponent('PlayerUITLMN').clearCountDown();
            childView.getComponent('PlayerUITLMN').onDiscard(params.cards);
            if (params.cards && params.cards.length > 0) {
                this.audioManager.playBaiBay();
                this.addTimeout(TLMNConstant.TimeoutId.DISCARD_MUSIC, setTimeout(function () {
                    if (self.audioManager) {
                        self.audioManager.playDanhBai();
                    }
                }, 400));
            }
        }
    },

    onRefreshGame: function (params) {
        if (params.data.trash) {
            this.curPlayerUI().showTrashCard(params.data.trash);
        }
    },

    onFinishGame: function (params) {
        var dt = 0;
        if (params.__execInfo__) {
            dt = params.__execInfo__.dt;
        }
        this.countDownTime = Date.now() + params.data.time - dt;
        if (params.data.lastPlayer) {
            var data = {
                userName: params.data.lastPlayer.userName,
                cards: params.data.cards
            };
            this.onDiscard(data);
        }
        this.setCurrentPlayerInTurn(false);

        this.showPlayerWin(params);

        for (var i = 0; i < params.data.result.summary.length; i += 1) {
            var playerResult = params.data.result.summary[i];
            var childView = this.findPlayerNodeByName(playerResult.userName);
            if (childView) {
                var playerUITLMN = childView.getComponent('PlayerUITLMN');
                if (playerUITLMN.player.data.state !== TLMNConstant.PlayerState.WAITING) {
                    if (playerUITLMN.backCardNode) {
                        playerUITLMN.backCardNode.active = false;
                    }

                    if (playerResult) {
                        if (playerResult.hand) {
                            playerUITLMN.showAllCards(playerResult.hand);
                        }
                    }
                    var checkCurrentPlayerThangTrang = false;
                    if (params.data.finishType === 'Thắng trắng') {
                        if (params.data.winners) {
                            for (var j = 0; j < params.data.winners.length; j += 1) {
                                if (params.data.winners[j] === playerResult.userName) {
                                    this.showPlayerThangTrang(playerUITLMN, params.data.thangTrangType);
                                    if (playerResult.userName === AuthUser.username) {
                                        checkCurrentPlayerThangTrang = true;
                                    }
                                }
                            }
                        }

                        if (params.data.winner) {
                            if (params.data.winner === playerResult.userName) {
                                this.showPlayerThangTrang(playerUITLMN, params.data.thangTrangType);
                                if (playerResult.userName === AuthUser.username) {
                                    checkCurrentPlayerThangTrang = true;
                                }
                            }
                        }

                    }
                    if (checkCurrentPlayerThangTrang) {
                        this.audioManager.playThangTrang();
                    }
                    else {
                        if (playerResult.userName === AuthUser.username) {
                            if (playerResult.moneyExchange > 0) {
                                this.audioManager.playWin();
                            }
                            else {
                                this.audioManager.playLose();
                            }
                        }
                    }
                    this.checkDenLang(params, playerResult, playerUITLMN);
                }
            }
        }

    },

    onChatHang: function (params) {
        var targetPlayer = this.findPlayerNodeByName(params.data.targetPlayer);
        var targetPlayerUITLMN;
        if (targetPlayer) {
            targetPlayerUITLMN = targetPlayer.getComponent('PlayerUITLMN');
            var moneyExchange = params.data.money - Math.floor(params.data.money * this.gameManager.fee);
            targetPlayerUITLMN.showMoneyExchange(moneyExchange);
        }

        var sourcePlayer = this.findPlayerNodeByName(params.data.sourcePlayer);
        if (sourcePlayer) {
            var sourcePlayerUITLMN = sourcePlayer.getComponent('PlayerUITLMN');
            sourcePlayerUITLMN.showMoneyExchange(-params.data.money);
        }
    },
    // ============================================================
    // Other
    // ============================================================
    showPlayerWin: function (params) {
        var countMoneyExchange = 0;
        for (var i = 0; i < params.data.result.actions.length; i += 1) {
            var action = params.data.result.actions[i];
            var playerUI = this.findPlayerNodeByName(action.sourcePlayer);
            if (playerUI) {
                if (playerUI.player.data.state !== TLMNConstant.PlayerState.WAITING) {
                    playerUI.clearEffects();
                    playerUI.setFinishEffect(-action.moneyExchange);
                }
            }
            countMoneyExchange += action.moneyExchange;
        }
        var playerWin = this.findPlayerNodeByName(params.data.result.actions[0].targetPlayer);
        if (playerWin) {
            countMoneyExchange -= Math.floor(countMoneyExchange * this.gameManager.fee);
            playerWin.setFinishEffect(countMoneyExchange);
        }
    },

    showButtonBoChon: function () {
        var cardDiscard = this.curPlayerUI().getCardTouched();
        if (cardDiscard.length > 0) {
            this.boChonButton.interactable = true;
            if (this.curPlayerUI().getComponent('PlayerUITLMN').player.data.state === TLMNConstant.PlayerState.IN_TURN) {
                this.danhButton.interactable = true;
            }
        }
        else {
            this.boChonButton.interactable = false;
            this.danhButton.interactable = false;
        }
    },

    showPlayerThangTrang: function (playerUITLMN, type) {
        var effect = playerUITLMN._addEffect(playerUITLMN.effectTemplateNodeList[TLMNConstant.Effect.THANG_TRANG]);
        var typeToiTrangLabel = effect.getChildByName('LblToiTrang');
        if (typeToiTrangLabel) {
            typeToiTrangLabel.getComponent(cc.Label).string = 'Thắng trắng: ' + type;
        }
    },

    checkDenLang: function (params, playerResult, playerUITLMN) {
        var actions = params.data.result.actions;
        for (var k = 0; k < actions.length; k += 1) {
            if (actions[k].isCong && actions[k].sourcePlayer === playerResult.userName) {
                playerUITLMN.addEffect(TLMNConstant.Effect.THUA_CONG);
            }
        }
    },

    clearTrashCards: function () {
        Utils.Node.destroyAllChildrenInNode(this.portCardTrash);
        // this.portCardTrash.removeAllChildren();
    },

    setCurrentPlayerInTurn: function (value) {
        this.boChonButton.interactable = value;
        this.boLuotButton.interactable = value;
        this.danhButton.interactable = value;

        if (value) {
            var cardDiscard = this.curPlayerUI().getCardTouched();
            if (cardDiscard.length > 0) {
                this.boChonButton.interactable = true;
                this.danhButton.interactable = true;
            }
            else {
                this.boChonButton.interactable = false;
                this.danhButton.interactable = false;
            }
        }
        this.boChonButton.node.setScale(1);
        this.boLuotButton.node.setScale(1);
        this.danhButton.node.setScale(1);
    },

    curPlayerUI: function () {
        return this.playerNodeList[0];
    },

    clearStateGame: function () {
        this.clearTrashCards();

        var childView;
        for (var i = 0; i < this.playerNodeList.length; i += 1) {
            childView = this.playerNodeList[i];
            if (childView) {
                childView.getComponent('PlayerUITLMN').clearAll();
            }
        }
    },

    onPrePlayerRemoved: function (playerNode) {
        playerNode.node.getComponent('PlayerUITLMN').clearAll();
    },

    onPostPlayerAdded: function (playerNode) {
        var playerUITLMN = playerNode.node.getComponent('PlayerUITLMN');
        if (playerUITLMN.player) {
            if (playerUITLMN.player.data.handSize > 0) {
                if (playerUITLMN.backCardNode) {
                    playerUITLMN.backCardNode.active = true;
                    playerUITLMN.numberCardLabel.string = playerUITLMN.player.data.handSize;
                }
            }
        }
        if (playerNode.player) {
            if (playerNode.player.data.state === TLMNConstant.PlayerState.WAITING) {
                playerNode.addEffect(TLMNConstant.Effect.DANG_DOI);
            }
        }
    },

});
