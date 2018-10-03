var PokerConstant = require('PokerConstant'),
    Utils = require('Utils'),
    Card = require('Card'),
    CardUI = require('CardUI'),
    Slider = require('Slider'),
    // AuthUser = require('AuthUser'),
    UiManager = require('UiManager'),
    GameConstant = require('GameConstant'),
    GameplayLieng = require('GameplayLieng');

cc.Class({
    extends: GameplayLieng,

    properties: {
        buyChipSlider: Slider,
        autoBuyCheckBox: cc.Node,
        buyChipPanel: cc.Node,
        buyChipButton: cc.Node,
        currentMoney: cc.Label,
        communityCardsHold: {
            default: [],
            type: CardUI
        },
        gameCmd: {
            'default': GameConstant.POKER.CMD,
            visible: false,
            override: true,
        },
        autoBuy: false
    },

    // use this for initialization
    $onLoad: function () {
        GameplayLieng.prototype.$onLoad.call(this);
        this.gameManager.eventDispatchers.local.addEventListener(PokerConstant.Event.SHOW_BUY_CHIP, this.showBuyChipPanel, this);
        this.gameManager.eventDispatchers.local.addEventListener(PokerConstant.Event.HIDE_BUY_CHIP_BUTTON, this.hideBuyChipButton, this);
        this.gameManager.eventDispatchers.local.addEventListener(PokerConstant.Event.CUT_OFF_MONEY_POKER, this.showCutOffMoney, this);
    },

    // ============================================================
    // Xử lý Button được click
    // ============================================================
    buyChip: function () {
        this.gameManager.buyMoneyJoinTable(this.buyChipSlider.currentValue);
        this.buyChipPanel.active = false;
        this.autoBuyMoney = this.buyChipSlider.currentValue;
        this.audioManager.playButtonClick();
    },

    openBuyChipPanel: function () {
        this.buyChipPanel.active = true;
        this.audioManager.playButtonClick();
    },

    closeBuyChipPanel: function () {
        this.buyChipPanel.active = false;
        this.audioManager.playButtonClick();
    },

    setAutoBuyMoney: function () {
        this.autoBuyCheckBox.active = !this.autoBuyCheckBox.active;
        this.autoBuy = this.autoBuyCheckBox.active;
        this.audioManager.playButtonClick();
    },
    // ============================================================
    // Xử lý các event từ GameManager
    // ============================================================
    onChangeStateGame: function (params) {
        for (var i = 0; i < this.playerNodeList.length; i += 1) {
            if (this.playerNodeList[i].player) {
                if (this.playerNodeList[i].player.data.state !== PokerConstant.PlayerState.FOLDED &&
                    this.playerNodeList[i].player.data.state !== PokerConstant.PlayerState.ALL_IN &&
                    this.playerNodeList[i].player.data.state !== PokerConstant.PlayerState.NONE &&
                    this.playerNodeList[i].player.data.state !== PokerConstant.PlayerState.OFF_MONEY) {
                    this.playerNodeList[i].clearEffects();
                }
                if (PokerConstant.GameStatePoker.PREFLOP !== params.allData.gameState) {
                    this.setCallMoneyPlayer(this.playerNodeList[i], false, 0);
                }
            }
        }
        this.bettingSlider.node.active = false;
        if (params.allData.communityCards) {
            this.showCommunityCards(params.allData.communityCards);
        }
        this.showStateGame(params.allData.gameState);
    },

    onChangeTurn: function (params) {
        GameplayLieng.prototype.onChangeTurn.call(this, params);
        var communityCards = params && params.allData && params.allData.communityCards;
        if (communityCards) {
            this.showCommunityCards(communityCards);
        }
        this.recheckPlayersType();
    },

    recheckPlayersType: function () {
        var gameState = this.gameManager && this.gameManager.gameState;
        switch (gameState) {
        case PokerConstant.GameStatePoker.PREFLOP:
        case PokerConstant.GameStatePoker.FLOP:
        case PokerConstant.GameStatePoker.TURN:
        case PokerConstant.GameStatePoker.RIVER:
            this.showPlayersType();
            break;

        default:
            this.hidePlayersType();
            break;
        }
    },

    showPlayersType: function () {
        for (var i = 0; i < this.playerNodeList.length; i += 1) {
            var playerElement = this.playerNodeList[i];
            if (playerElement && playerElement.player) {
                var playerType = playerElement.player.data && playerElement.player.data.type,
                    playerTypeButton = playerElement.node.getComponentInChildren('PokerPlayerTypeButton');
                if (Utils.Type.isNumber(playerType) && playerTypeButton) {
                    playerTypeButton.setType(playerType);
                }
            }
        }
    },

    hidePlayersType: function () {
        for (var i = 0; i < this.playerNodeList.length; i += 1) {
            var playerElement = this.playerNodeList[i];
            if (playerElement && playerElement.player) {
                var playerTypeButton = playerElement.node.getComponentInChildren('PokerPlayerTypeButton');
                if (playerTypeButton) {
                    playerTypeButton.hide();
                }
            }
        }
    },

    onFinishGame: function (params) {
        GameplayLieng.prototype.onFinishGame.call(this, params);
        this.recheckPlayersType();
    },

    // update info game
    updateInfoGame: function (params) {
        GameplayLieng.prototype.updateInfoGame.call(this, params);
        for (var j = 0; j < this.communityCardsHold.length; j += 1) {
            var cardUI = this.communityCardsHold[j];
            cardUI.fold();
            cardUI.node.active = false;
        }
        //update community cards
        var self = this;
        this.addTimeout(PokerConstant.TimeoutId.SHOW_COMMUNITY_CARDS, setTimeout(function () {
            self.showCommunityCards(params.allData.communityCards);
        }, 2000));


        var totalbetting = 0,
            k;
        if (params.allData.pots) {
            for (k = 0; k < params.allData.pots.length; k += 1) {
                totalbetting += params.allData.pots[k].money;
            }
            this.totalMoneyCallLabel.string = Utils.Number.format(totalbetting);
            this.calculateNumberChipType(totalbetting, this.chipContainer);
        }

        this.showStateGame(params.allData.gameState);
        this.recheckPlayersType();
    },

    showBuyChipPanel: function (params) {
        if (!this.autoBuy) {
            this.buyChipSlider.setDefaultValue(params[0], params[1], 0.5, this.gameManager.bettingInfo.betting);
            this.buyChipPanel.active = true;
            this.buyChipButton.active = true;
            this.currentMoney.string = Utils.Number.format(params[2]);
        }
        else {
            this.gameManager.buyMoneyJoinTable(this.buyChipSlider.currentValue > params[1] ? params[1] : this.buyChipSlider.currentValue);
        }
    },

    hideBuyChipButton: function () {
        this.buyChipButton.active = false;
    },

    // onDrawCard: function () {
    //     var self = this,
    //         card,
    //         count = 0,
    //         time = 0.2,
    //         timeDelay = 0.2,
    //         rotation = 0,
    //         indexZ = 130,
    //         i = 0,
    //         j = 0;
    //     this.hideStartTime();

    //     for (i = 0; i < this.playerNodeList.length; i += 1) {
    //         if (this.playerNodeList[i].player && this.playerNodeList[i].player.data.handSize > 0 && this.playerNodeList[i].player.data.state !== PokerConstant.PlayerState.OFF_MONEY) {
    //             var playerUIXiTo = this.playerNodeList[i].node.getComponent('PlayerUIXiTo');
    //             var player = this.playerNodeList[i].player.data;
    //             count = 0;
    //             for (j = playerUIXiTo.getNumberActiveChildren(); j < player.handSize; j += 1) {
    //                 this.playerNodeList[i].node.zIndex = indexZ;
    //                 card = cc.instantiate(this.cardPrefab);
    //                 card.setScale(0.5, 0.5);
    //                 card.zIndex = indexZ;
    //                 card.parent = this.dealer;
    //                 this.dealer.zIndex = 30;
    //                 indexZ -= 1;
    //                 count += 1;
    //                 var cardId;
    //                 if (i === 0 && this.playerNodeList[i].player.data.state !== PokerConstant.PlayerState.FOLD) {
    //                     cardId = player.cards[j];
    //                 } else {
    //                     if (this.gameCmd === GameConstant.XITO.CMD && player.handSize < this.gameManager.gameType) {
    //                         cardId = player.publicCards[j - (player.handSize - player.publicCards.length)];
    //                     } else {
    //                         cardId = null;
    //                     }
    //                 }
    //                 this.drawCardEffect(card, this.playerNodeList[i], time, timeDelay * count, rotation, cardId, j);
    //             }
    //         }
    //     }
    //     this.node.runAction(cc.sequence(
    //         cc.delayTime(time + timeDelay),
    //         cc.callFunc(function () {
    //             var playerUIXiTo = self.playerNodeList[0].node.getComponent('PlayerUIXiTo');
    //             var scale = playerUIXiTo.cardsHold[0].node.parent.getScale();
    //             playerUIXiTo.cardsHold[0].node.parent.setScale(-scale, scale);

    //             var xuatHienCardTrenTayAction = cc.sequence(
    //                 cc.delayTime(0.3),
    //                 cc.scaleTo(0.3, scale)
    //             );
    //             playerUIXiTo.cardsHold[0].node.parent.runAction(xuatHienCardTrenTayAction);
    //         })
    //     ));
    // },


    // drawCardEffect: function (card, player, time, timeDelay, rotation, cardId, index) {
    //     // this.audioManager.playBaiChia();
    //     var playerUIXiTo = player.node.getComponent('PlayerUIXiTo');
    //     var pos = playerUIXiTo.holdNode.convertToWorldSpaceAR(playerUIXiTo.cardsHold[index].node.position);
    //     var position = this.dealer.convertToNodeSpaceAR(pos);
    //     var chiaBaiAction = cc.sequence(
    //         cc.delayTime(timeDelay),
    //         cc.spawn(
    //             cc.moveTo(time, cc.p(position.x, position.y - 17)),
    //             cc.rotateTo(time, rotation)
    //         ),
    //         cc.callFunc(function () {
    //             if (player.player && playerUIXiTo.getNumberActiveChildren() < player.player.data.handSize) {
    //                 if (player.player.data.username === AuthUser.username) {
    //                     var foundCard = playerUIXiTo.findCard(cardId);
    //                     if (foundCard) {
    //                         foundCard.node.position = cc.p(0, 0);
    //                         card.destroy();
    //                         return;
    //                     }
    //                 }
    //                 var cardPlayer = playerUIXiTo.cardsHold[index];
    //                 if (cardPlayer) {
    //                     card.zIndex = cardPlayer.node.zIndex;
    //                     card.rotation = cardPlayer.node.rotation;
    //                     card.position = cardPlayer.node.position;
    //                     card.parent = cardPlayer.node.parent;
    //                     card.setSiblingIndex(cardPlayer.node.getSiblingIndex());

    //                     if (card) {
    //                         var cardUI = card.getComponent('CardUI');
    //                         playerUIXiTo.cardsHold[index] = cardUI;
    //                         cardPlayer.node.destroy();
    //                         cardUI.node.active = true;
    //                         cardUI.node.setScale(1, 1);
    //                         cardUI.node.runAction(cc.sequence(cc.delayTime(0.6 - timeDelay),
    //                             cc.callFunc(function () {
    //                                 if (card) {
    //                                     var cardUI = card.getComponent('CardUI');
    //                                     if (player.player.data.cards) {
    //                                         cardId = player.player.data.cards[index];
    //                                     }
    //                                     if (Utils.Type.isNumber(cardId) && cardId >= 0) {
    //                                         cardUI.setCard(Card.fromId(cardId));
    //                                         cardUI.showTransparentBlackNode(false);
    //                                     }
    //                                 }
    //                             })
    //                         ));
    //                     }
    //                 }
    //             } else {
    //                 card.destroy();
    //             }

    //         }, this)

    //     );
    //     chiaBaiAction.easing(cc.easeCubicActionOut());
    //     card.stopAllActions();
    //     card.runAction(chiaBaiAction);
    // },

    // ============================================================
    // Other
    // ============================================================
    showCutOffMoney: function (params) {
        var message = params.data.userName + ' ' + params.data.msg + ' ' + Utils.Number.format(params.data.money);
        UiManager.openWarningMessage(message, 2);
    },

    onShowBetting: function (params, playerUI) {
        var totalbetting = 0,
            k;
        if (params.allData.pots) {
            for (k = 0; k < params.allData.pots.length; k += 1) {
                totalbetting += params.allData.pots[k].money;
            }
            this.totalMoneyCallLabel.string = Utils.Number.format(totalbetting);
        }
        if (params.data.money > 0) {
            this.chipEffect(params.data.money, totalbetting, playerUI);
            this.setCallMoneyPlayer(playerUI, true, params.data.currentBetting);
            this.audioManager.playCoinDrop();
        }
    },

    showStateGame: function (gameState) {
        switch (gameState) {
        case PokerConstant.GameStatePoker.PREFLOP:
            this.gameStateLabel.string = 'Vòng 1';
            this.isPlaying = true;
            break;
        case PokerConstant.GameStatePoker.FLOP:
            this.gameStateLabel.string = 'Vòng 2';
            this.isPlaying = true;
            break;
        case PokerConstant.GameStatePoker.TURN:
            this.gameStateLabel.string = 'Vòng 3';
            this.isPlaying = true;
            break;
        case PokerConstant.GameStatePoker.RIVER:
            this.gameStateLabel.string = 'Vòng Cuối';
            this.isPlaying = true;
            break;
        }
        this.gameStateLabel.node.active = true;
    },

    finishDrawCard: function (cardUI, player) {
        var x = cardUI.node.x;
        var y = cardUI.node.y;
        var nodeCardRotation = cardUI.node.rotation;
        if (player === this.playerNodeList[0]) {
            cardUI.node.scaleX = 0;
        }
        if (player.node.x <= 0) {
            cardUI.node.x = x - 155;

        }
        else {
            cardUI.node.x = x + 155;
        }
        cardUI.node.rotation = 0;
        cardUI.node.active = true;
        cardUI.node.stopAllActions();
        var xuatHienCardTrenTayAction = cc.sequence(
            cc.spawn(
                cc.moveTo(0.3, cc.p(x, y)),
                cc.scaleTo(0.3, 1),
                cc.rotateTo(0.3, nodeCardRotation)
            )
        );
        cardUI.node.runAction(xuatHienCardTrenTayAction);
    },

    showCommunityCards: function (communityCards) {
        if (communityCards && (this.isPlaying || this.gameManager.gameState === PokerConstant.GameState.DEALING)) {
            for (var j = 0; j < this.communityCardsHold.length; j += 1) {
                var cardUI = this.communityCardsHold[j];
                if (!cardUI.node.active) {
                    cardUI.node.active = true;
                    cardUI.node.stopAllActions();
                    cardUI.node.runAction(cc.scaleTo(0.3, 1));
                }
                if (j < communityCards.length && cardUI.card === null) {
                    cardUI.setCard(Card.fromId(communityCards[j]));
                    cardUI.node.setScale(0, 0.7);
                    cardUI.node.stopAllActions();
                    cardUI.node.runAction(cc.scaleTo(0.3, 1));
                }

            }
        }
    },

    restartGame: function () {
        GameplayLieng.prototype.restartGame.call(this);
        for (var j = 0; j < this.communityCardsHold.length; j += 1) {
            var cardUI = this.communityCardsHold[j];
            cardUI.fold();
            cardUI.node.active = false;
        }
    },

});
