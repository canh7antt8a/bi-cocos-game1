var LiengConstant = require('LiengConstant'),
    Utils = require('Utils'),
    AuthUser = require('AuthUser'),
    Card = require('Card'),
    Slider = require('Slider'),
    GameConstant = require('GameConstant'),
    LiengConstant = require('LiengConstant'),
    BaseMainGameplay = require('BaseMainGameplay'),
    EventDispatcher = require('EventDispatcher'),
    EventDispatcherConstant = require('EventDispatcherConstant');

cc.Class({
    extends: BaseMainGameplay,

    properties: {
        cardPrefab: cc.Prefab,
        chipPrefab: cc.Prefab,
        dealer: cc.Node,
        totalMoneyCallLabel: cc.Label,
        countDownTimeLabel: cc.Label,
        gameStateLabel: cc.Label,
        bettingSlider: Slider,
        chipContainer: cc.Node,
        currencyPiImage: {
            default: [],
            type: cc.Node,
        },
        bettingButtonsList: {
            default: [],
            type: cc.Button
        },
        chipTemplateList: {
            default: [],
            type: cc.Node
        },
        gameCmd: {
            'default': GameConstant.LIENG.CMD,
            visible: false
        },
    },

    // use this for initialization
    $onLoad: function () {
        var self = this;
        this.gameManager.eventDispatchers.local.addEventListener(LiengConstant.Event.START_TIME, this.onShowStartTime, this);
        this.gameManager.eventDispatchers.local.addEventListener(LiengConstant.Event.USER_BET, this.onBettingSuccess, this);
        this.gameManager.eventDispatchers.local.addEventListener(LiengConstant.Event.CHANGE_STATE, this.onChangeStateGame, this);
        this.gameManager.eventDispatchers.local.addEventListener(LiengConstant.Event.CHANGE_TURN, this.onChangeTurn, this);
        this.gameManager.eventDispatchers.local.addEventListener(LiengConstant.Event.DRAW_CARD, function () {
            self.addTimeout(LiengConstant.TimeoutId.DRAW_CARD, setTimeout(function () {
                self.onDrawCard();
            }, 30));
        }, this);
        this.gameManager.eventDispatchers.local.addEventListener(LiengConstant.Event.FINISH_GAME, this.onFinishGame, this);
        this.gameManager.eventDispatchers.local.addEventListener(LiengConstant.Event.UPDATE_GAME, this.updateInfoGame, this);
        this.gameManager.eventDispatchers.local.addEventListener(LiengConstant.Event.REFRESH_GAME, this.restartGameWhenNewMatch, this);

        EventDispatcher.addEventListener(EventDispatcherConstant.PROFILE.UPDATE_INFO, this.onUpdateUserInfo, this);
        this.playerNodeList[0].node.parent.zIndex = 1;
    },

    // called every frame, uncomment this function to activate update callback
    $onUpdate: function () {
        if (this.gameManager) {
            if (this.gameManager.gameState === LiengConstant.GameState.WAITING_FOR_NEW_GAME || this.gameManager.gameState === LiengConstant.GameState.FINISH || this.gameManager.gameState === LiengConstant.GameState.FINALIZING) {
                var count = Math.floor((this.countDownTime - Date.now()) / 1000);
                count = count >= 0 ? count : 0;
                this.countDownTimeLabel.string = count;
                if (count === 0) {
                    this.countDownTimeLabel.node.active = false;
                    this.gameStateLabel.node.active = false;
                    if (this.gameManager.gameState === LiengConstant.GameState.FINISH || this.gameManager.gameState === LiengConstant.GameState.FINALIZING) {
                        this.restartGame();
                        this.gameStateLabel.string = 'Ván mới sẽ được bắt đầu trong giây lát.';
                        this.gameStateLabel.node.active = true;
                        this.gameManager.gameState = LiengConstant.GameState.NONE;
                    }
                }
            }
        }
    },

    // ============================================================
    // Xử lý Button được click
    // ============================================================
    bettingCall: function () {
        this.gameManager.bet(LiengConstant.Action.CALL);
        this.bettingSlider.node.active = false;
        this.audioManager.playButtonClick();
    },
    bettingCheck: function () {
        this.gameManager.bet(LiengConstant.Action.CHECK);
        this.bettingSlider.node.active = false;
        this.audioManager.playButtonClick();
    },
    bettingFold: function () {
        this.gameManager.bet(LiengConstant.Action.FOLD);
        this.bettingSlider.node.active = false;
        this.audioManager.playButtonClick();
    },
    bettingNormal: function () {
        if (this.bettingSlider.node.active) {
            this.gameManager.bet(LiengConstant.Action.BET, this.bettingSlider.currentValue);
            this.bettingSlider.node.active = false;
        }
        else {
            this.bettingSlider.node.active = true;
        }
        this.audioManager.playButtonClick();
    },
    // ============================================================
    // Xử lý các event từ GameManager
    // ============================================================
    onShowStartTime: function (time) {
        this.restartGame();
        this.gameStateLabel.string = 'Chuẩn bị ván mới';
        this.gameStateLabel.node.active = true;
        this.countDownTime = Date.now() + time;
        this.countDownTimeLabel.string = Math.floor(time / 1000);
        this.countDownTimeLabel.node.active = true;
    },

    onBettingSuccess: function (params) {
        var playerUI = this.findPlayerNodeByName(params.data.userName);
        if (playerUI && playerUI.player) {
            playerUI.clearCountDown();
            if (playerUI.player.data.money === 0) {
                playerUI.setEffect(this.convertTypeBetting(LiengConstant.Action.ALL_HAND));
            }
            else {
                playerUI.setEffect(this.convertTypeBetting(params.action));
            }
            if (params.action === LiengConstant.Action.FOLD) {
                if (AuthUser.username === params.data.userName) {
                    playerUI.getComponent('PlayerUIXiTo').currentPlayerFold();
                }
                else {
                    playerUI.getComponent('PlayerUIXiTo').fold();
                }
            }
            this.onShowBetting(params, playerUI);
        }
    },

    onChangeTurn: function (params) {
        var i = 0;
        var player;
        if (this.bettingSlider) {
            this.bettingSlider.node.active = false;
        }
        this.audioManager.playTurnStart();
        //update state player
        for (i = 0; i < this.playerNodeList.length; i += 1) {
            var playerUI = this.playerNodeList[i];
            player = playerUI.player;
            if (player) {
                if (player.data.username === params.data.userName) {
                    var dt = 0;
                    if (params.__execInfo__) {
                        dt = params.__execInfo__.dt;
                    }
                    playerUI.setCountDown(params.data.time - dt);
                    playerUI.clearEffects();

                    if (this.playerNodeList[0].player.data.username === params.data.userName) {
                        this.setCurrentPlayerInTurn(params.data.allowedActions, params.data.minBetting, params.data.maxBetting);
                    }
                    else {
                        this.disableBettingButtons(true);
                    }
                }
                else {
                    if (player.data.state === LiengConstant.PlayerState.ALL_IN) {
                        playerUI.setEffect(this.convertTypeBetting(LiengConstant.Action.ALL_HAND));
                    }

                    if (player.data.state === LiengConstant.PlayerState.FOLDED) {
                        if (AuthUser.username === player.data.username) {
                            playerUI.getComponent('PlayerUIXiTo').currentPlayerFold();
                        }
                        else {
                            playerUI.getComponent('PlayerUIXiTo').fold();
                        }
                    }
                }

            }
        }
        this.onReDrawCard();
    },

    onDrawCard: function () {
        var card,
            count = 0,
            time = 0.3,
            timeDelay = 0.06,
            rotation = 0,
            indexZ = 20,
            i = 0,
            j = 0;
        this.hideStartTime();

        for (i = 0; i < this.playerNodeList.length; i += 1) {
            if (this.playerNodeList[i].player && this.playerNodeList[i].player.data.handSize > 0 && this.playerNodeList[i].player.data.state !== LiengConstant.PlayerState.OFF_MONEY) {
                var playerUIXiTo = this.playerNodeList[i].node.getComponent('PlayerUIXiTo');
                var player = this.playerNodeList[i].player.data;

                for (j = playerUIXiTo.getNumberActiveChildren(); j < player.handSize; j += 1) {
                    this.playerNodeList[i].node.zIndex = indexZ;
                    card = cc.instantiate(this.cardPrefab);
                    card.setScale(0.5, 0.5);
                    card.zIndex = indexZ;
                    card.parent = this.dealer;

                    indexZ -= 1;
                    count += 1;
                    var cardId;
                    if (i === 0 && this.playerNodeList[i].player.data.state !== LiengConstant.PlayerState.FOLD) {
                        cardId = player.cards[j];
                    }
                    else {
                        if (this.gameCmd === GameConstant.XITO.CMD && player.handSize < this.gameManager.gameType) {
                            cardId = player.publicCards[j - (player.handSize - player.publicCards.length)];
                        }
                        else {
                            cardId = null;
                        }
                    }
                    this.drawCardEffect(card, this.playerNodeList[i], time, timeDelay * count, rotation, cardId);
                }
            }
        }

    },

    onFinishGame: function (params) {
        var dt = 0;
        if (params.__execInfo__) {
            dt = params.__execInfo__.dt;
        }
        this.onShowFinishTime(params.data.time - dt);
        this.disableBettingButtons(true);
        if (this.gameCmd === GameConstant.XITO.CMD) {
            this.bettingPanel.active = false;
        }
        else {
            this.bettingSlider.node.active = false;
        }
        for (var i = 0; i < params.data.players.length; i += 1) {
            var playerUI = this.findPlayerNodeByName(params.data.players[i].userName);
            if (playerUI) {
                this.setCallMoneyPlayer(playerUI, false, 0);
                if (params.data.players[i].cards) {
                    if (this.gameCmd === GameConstant.XITO.CMD) {
                        playerUI.node.getComponent('PlayerUIXiTo').showAllCards(params.data.players[i].cards, params.data.players[i].bestCards, params.data.players[i].bestCardsType, this.gameCmd, params.data.time / 1000);
                    }
                    else {
                        var bestCardsType = '';
                        if ('Điểm' === params.data.players[i].typeCards) {
                            bestCardsType = params.data.players[i].point + ' ' + params.data.players[i].typeCards;
                        }
                        else {
                            bestCardsType = params.data.players[i].typeCards;
                        }
                        playerUI.node.getComponent('PlayerUIXiTo').showAllCards(params.data.players[i].cards, params.data.players[i].cards, bestCardsType, this.gameCmd, params.data.time / 1000);
                    }
                }

                if (playerUI.player.data.state !== LiengConstant.PlayerState.FOLD) {
                    playerUI.setFinishEffect(params.data.players[i].moneyExchange);
                    if (params.data.players[i].moneyExchange > 0) {
                        Utils.Node.destroyAllChildrenInNode(this.chipContainer);
                        // this.chipContainer.removeAllChildren();
                        var container = this.calculateNumberChipType(params.data.players[i].moneyExchange, this.chipContainer);
                        var pos2InWorld = container.parent.convertToWorldSpace(container.position);
                        container.parent = playerUI.node;
                        if (playerUI.player.data.username !== AuthUser.username) {
                            container.setScale(0.7);
                        }
                        var p = playerUI.node.convertToNodeSpace(pos2InWorld);
                        container.position = p;
                        var containerAction = cc.sequence(
                            cc.delayTime(1.5),
                            cc.moveTo(0.3, cc.p(0, 0)),
                            cc.removeSelf());
                        containerAction.easing(cc.easeQuadraticActionOut());
                        container.runAction(containerAction);
                        this.audioManager.playChipBay();
                    }
                    if (params.data.players[i].userName === AuthUser.username) {
                        if (params.data.players[i].moneyExchange > 0) {
                            this.audioManager.playWin();
                        }
                        else {
                            this.audioManager.playLose();
                        }
                    }
                }
            }
        }
        // this.dealer.removeAllChildren();
        // Utils.Node.destroyAllChildrenInNode(this.dealer);
    },

    // update info game
    updateInfoGame: function (params) {
        this.coutUpdateGame = 1;
        var i = 0;
        if (params.allData.totalBetting) {
            this.calculateNumberChipType(params.allData.totalBetting, this.chipContainer);
            this.totalMoneyCallLabel.string = Utils.Number.format(params.allData.totalBetting);
        }
        if (this.gameManager.currency === 'XU') {
            for (i = 0; i < this.currencyPiImage.length; i += 1) {
                this.currencyPiImage[i].active = false;
            }
        }
        //update state player
        this.initAllBettingButtons();
        var player, dt;
        if (params.data.gameState === LiengConstant.GameState.FINISH || params.data.gameState === LiengConstant.GameState.FINALIZING) {
            dt = 0;
            if (params.__execInfo__) {
                dt = params.__execInfo__.dt;
            }
            this.onShowFinishTime(params.data.time - dt);
        }
        for (i = 0; i < this.playerNodeList.length; i += 1) {
            var playerUI = this.playerNodeList[i];
            player = playerUI.player;
            if (player) {
                if (params.data.gameState >= LiengConstant.GameState.ROUND) {
                    switch (player.data.state) {
                    case LiengConstant.PlayerState.FOLDED:
                        playerUI.setEffect(this.convertTypeBetting(LiengConstant.Action.FOLD));
                        if (AuthUser.username === player.data.username) {
                            playerUI.getComponent('PlayerUIXiTo').currentPlayerFold();
                        }
                        else {
                            playerUI.getComponent('PlayerUIXiTo').fold();
                        }
                        break;
                    case LiengConstant.PlayerState.IN_TURN:
                        dt = 0;
                        if (params.__execInfo__) {
                            dt = params.__execInfo__.dt;
                        }
                        playerUI.setCountDown(params.data.time - dt);
                        break;
                    case LiengConstant.PlayerState.ALL_IN:
                        playerUI.setEffect(this.convertTypeBetting(LiengConstant.Action.ALL_HAND));
                        break;
                    }
                }
                if (i === 0) {
                    if (this.gameCmd === GameConstant.XITO.CMD) {
                        this.setCurrentPlayerInTurn(player.data.allowedActions, player.data.actionMoneyList);
                    }
                    else {
                        this.setCurrentPlayerInTurn(player.data.allowedActions, player.data.minBetting, player.data.maxBetting);
                    }
                }
            }
        }
    },
    // ============================================================
    // Other
    // ============================================================

    initAllBettingButtons: function () {
        this.allButtonBettings = {};
        this.allButtonBettings[LiengConstant.Action.BET] = this.bettingButtonsList[0];
        this.allButtonBettings[LiengConstant.Action.RAISE] = this.bettingButtonsList[0];
        // this.allButtonBettings[LiengConstant.Action.ALL_IN] = this.bettingButtonsList[0];
        this.allButtonBettings[LiengConstant.Action.CALL] = this.bettingButtonsList[1];
        this.allButtonBettings[LiengConstant.Action.CHECK] = this.bettingButtonsList[2];
        this.allButtonBettings[LiengConstant.Action.FOLD] = this.bettingButtonsList[3];

        this.disableBettingButtons(true);
    },

    disableBettingButtons: function (interactable) {
        for (var i = 0; i < this.bettingButtonsList.length; i += 1) {
            this.bettingButtonsList[i].interactable = !interactable;
            this.bettingButtonsList[i].node.setScale(1);
        }
    },

    onShowBetting: function (params, playerUI) {
        if (params.data.money > 0) {
            this.chipEffect(params.data.money, params.allData.totalBetting, playerUI);
            this.setCallMoneyPlayer(playerUI, true, params.data.currentBetting);
            this.audioManager.playCoinDrop();
        }

        this.totalMoneyCallLabel.string = Utils.Number.format(params.allData.totalBetting);
    },

    chipEffect: function (money, totalBetting, playerUI) {
        this.audioManager.playChipBay();
        var self = this;
        var container = this.calculateNumberChipType(money, playerUI.node);
        var pos2InWorld = container.parent.convertToWorldSpace(container.position);
        container.parent = self.chipContainer;
        self.chipContainer.zIndex = 2;
        var p = self.chipContainer.convertToNodeSpace(pos2InWorld);
        container.position = p;
        var containerAction = cc.sequence(
            cc.delayTime(0.5),
            cc.moveTo(0.3, cc.p(0, 0)),
            cc.removeSelf(),
            cc.callFunc(function () {
                Utils.Node.destroyAllChildrenInNode(self.chipContainer);
                // self.chipContainer.removeAllChildren();
                self.calculateNumberChipType(totalBetting, self.chipContainer);
                self.chipContainer.zIndex = 0;
            }));
        containerAction.easing(cc.easeOut(3));
        container.runAction(containerAction);
    },

    onShowFinishTime: function (time) {
        this.countDownTime = Date.now() + time;
        this.countDownTimeLabel.string = Math.floor(time / 1000);
        this.countDownTimeLabel.node.active = true;
    },

    hideStartTime: function () {
        this.gameStateLabel.node.active = false;
        this.countDownTimeLabel.node.active = false;
    },

    setCurrentPlayerInTurn: function (allowedActionsList, minBetting, maxBetting) {
        var j = 0;
        if (allowedActionsList) {
            this.disableBettingButtons(true);
            for (j = 0; j < allowedActionsList.length; j += 1) {
                if (this.allButtonBettings[allowedActionsList[j]]) {
                    this.allButtonBettings[allowedActionsList[j]].interactable = true;
                }
            }
            // if (this.bettingButtonsList[0].interactable) {
            //     this.bettingSlider.node.active = true;
            // }

        }

        if (minBetting) {
            this.minBetting = minBetting;
            this.maxBetting = maxBetting;
            this.bettingSlider.setDefaultValue(minBetting, maxBetting, 0, this.gameManager.bettingInfo.betting);
        }
    },

    drawCardEffect: function (card, player, time, timeDelay, rotation, cardId) {
        // this.audioManager.playBaiChia();
        var playerUIXiTo = player.node.getComponent('PlayerUIXiTo');

        var chiaBaiAction = cc.sequence(
            cc.delayTime(timeDelay),
            cc.spawn(
                cc.moveTo(time, cc.p(player.node.x, player.node.y + 20)),
                cc.rotateTo(time, rotation)
            ),
            cc.callFunc(function () {
                if (player.player && playerUIXiTo.getNumberActiveChildren() < player.player.data.handSize) {
                    if (player.player.data.username === AuthUser.username) {
                        var foundCard = playerUIXiTo.findCard(cardId);
                        if (foundCard) {
                            foundCard.node.position = cc.p(0, 0);
                            card.destroy();
                            return;
                        }
                    }
                    var index = playerUIXiTo.getNumberActiveChildren();
                    var cardPlayer = playerUIXiTo.cardsHold[index];
                    if (cardPlayer) {
                        card.zIndex = cardPlayer.node.zIndex;
                        card.rotation = cardPlayer.node.rotation;
                        card.position = cardPlayer.node.position;
                        card.parent = cardPlayer.node.parent;
                        card.setSiblingIndex(cardPlayer.node.getSiblingIndex());
                        if (this.gameCmd === GameConstant.XITO.CMD) {
                            var button = cardPlayer.getComponent(cc.Button);
                            if (button) {
                                var b1 = card.addComponent(cc.Button);
                                b1.clickEvents = button.clickEvents;
                            }
                        }
                        if (card) {
                            var cardUI = card.getComponent('CardUI');
                            playerUIXiTo.cardsHold[index] = cardUI;
                            cardPlayer.node.destroy();
                            cardUI.node.active = true;
                            if (player.player.data.cards) {
                                cardId = player.player.data.cards[index];
                            }
                            // cardUI.fold();
                            if (Utils.Type.isNumber(cardId) && cardId >= 0) {
                                cardUI.setCard(Card.fromId(cardId));
                                cardUI.showTransparentBlackNode(false);
                            }
                            this.finishDrawCard(cardUI, player);
                        }
                    }
                }
                else {
                    card.destroy();
                }
            }, this)
        );
        chiaBaiAction.easing(cc.easeQuadraticActionOut());
        card.runAction(chiaBaiAction);
    },

    finishDrawCard: function (cardUI, player) {
        cardUI.node.setScale(0.5, 0.5);
        cardUI.node.runAction(cc.scaleTo(0.3, 1));
        if (player) {
            this.onReDrawCard();
        }
    },

    onReDrawCard: function () {
        for (var i = 0; i < this.playerNodeList.length; i += 1) {
            if (this.playerNodeList[i].player) {
                var playerUIXiTo = this.playerNodeList[i].node.getComponent('PlayerUIXiTo');
                var player = this.playerNodeList[i].player.data;
                this.reDrawCard(player, playerUIXiTo, i);
                // var func = cc.callFunc(this.reDrawCard(player, playerUIXiTo, i), this);
                // this.playerNodeList[i].node.runAction(cc.sequence(cc.delayTime(0), func));

            }
        }
    },

    reDrawCard: function (player, playerXiTo, index) {
        var k = 0,
            cardUI;

        if (index === 0) {
            for (k = 0; k < player.handSize; k += 1) {
                cardUI = playerXiTo.cardsHold[k].getComponent('CardUI');
                if (cardUI.card && cardUI.card.getId() !== player.cards[k]) {
                    cardUI.setCard(Card.fromId(player.cards[k]));
                    cardUI.showTransparentBlackNode(false);
                }
            }
        }
        else {
            for (k = 0; k < player.handSize; k += 1) {
                cardUI = playerXiTo.cardsHold[k].getComponent('CardUI');
                // cardUI.node.active = true;
                cardUI.fold();
                if (player.cards && player.cards[k] > 0) {
                    cardUI.setCard(Card.fromId(player.cards[k]));
                }
            }
        }
        if (player.state === LiengConstant.PlayerState.FOLDED) {
            if (index !== 0) {
                playerXiTo.fold();
            }
            else {
                playerXiTo.currentPlayerFold();
            }
        }
    },

    setCallMoneyPlayer: function (playerUI, active, money) {
        var playerUIXiTo = playerUI.getComponent('PlayerUIXiTo');
        if (playerUIXiTo && playerUIXiTo.callMoneyNode && playerUIXiTo.callMoneyLabel) {
            playerUIXiTo.callMoneyNode.active = active;
            playerUIXiTo.callMoneyLabel.string = Utils.Number.format(money);
        }
    },

    convertTypeBetting: function (typeBetting) {
        switch (typeBetting) {
        case LiengConstant.Action.BET:
        case LiengConstant.Action.RAISE:
            return LiengConstant.Effect.TO;
        case LiengConstant.Action.CALL:
            return LiengConstant.Effect.THEO;
        case LiengConstant.Action.CHECK:
            return LiengConstant.Effect.NHUONG_TO;
        case LiengConstant.Action.FOLD:
            return LiengConstant.Effect.UP_BO;
        case LiengConstant.Action.ALL_HAND:
            return LiengConstant.Effect.CHOI_TAT_TAY;

            //xito
        case LiengConstant.Action.BET_1_2:
            return LiengConstant.Effect.TO_12;
        case LiengConstant.Action.BET_1_4:
            return LiengConstant.Effect.TO_14;
        case LiengConstant.Action.BET_X2:
            return LiengConstant.Effect.TO_X2;
        case LiengConstant.Action.ALL_IN:
            return LiengConstant.Effect.TO_TAT_CA;
        }
    },

    restartGameWhenNewMatch: function () {
        if (this.coutUpdateGame === 1) {
            this.coutUpdateGame -= 1;
            return;
        }
        Utils.Node.destroyAllChildrenInNode(this.dealer);
        this.dealer.removeAllChildren();
        this.restartGame();
    },

    restartGame: function () {
        Utils.Node.destroyAllChildrenInNode(this.chipContainer);
        // this.chipContainer.removeAllChildren();
        this.totalMoneyCallLabel.string = '0';

        for (var i = 0; i < this.playerNodeList.length; i += 1) {
            this.playerNodeList[i].node.getComponent('PlayerUIXiTo').deactiveAllCards();
            this.playerNodeList[i].clearEffects();
            this.setCallMoneyPlayer(this.playerNodeList[i], false, 0);
        }
        this.hideStartTime();
    },

    onPrePlayerRemoved: function (playerNode) {
        playerNode.node.getComponent('PlayerUIXiTo').deactiveAllCards();
        playerNode.clearEffects();
        this.setCallMoneyPlayer(playerNode, false, 0);
    },

    onPostPlayerAdded: function (playerNode) {
        if (playerNode.player) {
            if (playerNode.player.data.state === LiengConstant.PlayerState.NONE || playerNode.player.data.state === LiengConstant.PlayerState.OFF_MONEY) {
                playerNode.addEffect(LiengConstant.Effect.DANG_DOI);
            }
        }
    },

    calculateNumberChipType: function (money, sourceNode) {
        var check = money.toString().split('').reverse().join('');
        var container = new cc.Node();
        var count = 0,
            x = 0,
            y = 0,
            index = 50;
        container.parent = sourceNode;
        container.setScale(0.6);
        container.position = cc.p(0, 0);
        container.zIndex = 15;

        for (var i = 0; i < check.length; i += 1) {
            var number = parseInt(check[i]);
            if (number > 0) {
                var chip;
                for (var j = 0; j < number; j += 1) {
                    chip = cc.instantiate(this.chipTemplateList[i]);
                    chip.parent = container;
                    chip.position = cc.p(x + count * chip.width * 0.4, (y + count * chip.height * 0.8) + 10 * j);
                    chip.zIndex = index;
                    chip.rotaion = Math.random() * 360;
                    var chipAction = cc.rotateBy(0.1, -350);
                    chipAction.easing(cc.easeQuadraticActionOut());
                    chip.runAction(chipAction);

                }
                count += 1;
                index -= 1;
                if (count % 2 === 0) {
                    y -= chip.height * 0.4;
                    x += chip.width * 0.8;
                    count = 0;
                    index = 50;
                }
            }
        }
        return container;

    }
});
