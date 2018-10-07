var GameConstant = require('GameConstant'),
    XiToConstant = require('XiToConstant'),
    Card = require('Card'),
    GameplayLieng = require('GameplayLieng'),
    Utils = require('Utils');

cc.Class({
    extends: GameplayLieng,

    properties: {
        moneyCallLabel: cc.Label,
        choseCardNoticeLabel: cc.Label,
        bettingPanel: cc.Node,
        moneyToLabel: cc.Label,
        moneyToTatCaLabel: cc.Label,
        moneyTo12Label: cc.Label,
        moneyTo14Label: cc.Label,
        moneyToX2Label: cc.Label,
        gameCmd: {
            'default': GameConstant.XITO.CMD,
            visible: false,
            override: true
        },
    },

    // use this for initialization
    $onLoad: function () {
        GameplayLieng.prototype.$onLoad.call(this);
        this.canClickToCard = false;
    },

    // ============================================================
    // Xử lý Button được click
    // ============================================================
    bettingCall: function () {
        this.gameManager.bet(XiToConstant.Action.CALL);
        this.audioManager.playButtonClick();
    },
    bettingCheck: function () {
        this.gameManager.bet(XiToConstant.Action.CHECK);
        this.audioManager.playButtonClick();
    },
    bettingFold: function () {
        this.gameManager.bet(XiToConstant.Action.FOLD);
        this.audioManager.playButtonClick();
    },
    bettingAll: function () {
        this.gameManager.bet(XiToConstant.Action.ALL_IN);
        this.bettingPanel.active = false;
        this.audioManager.playButtonClick();
    },
    betting12: function () {
        this.gameManager.bet(XiToConstant.Action.BET_1_2);
        this.bettingPanel.active = false;
        this.audioManager.playButtonClick();
    },
    betting14: function () {
        this.gameManager.bet(XiToConstant.Action.BET_1_4);
        this.bettingPanel.active = false;
        this.audioManager.playButtonClick();
    },
    bettingX2: function () {
        this.gameManager.bet(XiToConstant.Action.BET_X2);
        this.bettingPanel.active = false;
        this.audioManager.playButtonClick();
    },
    bettingNormal: function () {
        this.gameManager.bet(XiToConstant.Action.BET);
        this.bettingPanel.active = false;
        this.audioManager.playButtonClick();
    },
    showBettingPanel: function () {
        this.bettingPanel.active = !this.bettingPanel.active;
        this.audioManager.playButtonClick();
    },

    // ============================================================
    // Xử lý các event từ GameManager
    // ============================================================
    onChangeStateGame: function () {
        for (var i = 0; i < this.playerNodeList.length; i += 1) {
            if (this.playerNodeList[i].player) {
                if (this.playerNodeList[i].player.data.state !== XiToConstant.PlayerState.FOLDED && this.playerNodeList[i].player.data.state !== XiToConstant.PlayerState.ALL_IN && this.playerNodeList[i].player.data.state !== XiToConstant.PlayerState.NONE) {
                    this.playerNodeList[i].clearEffects();
                }
            }
        }
        this.bettingPanel.active = false;
        this.moneyCallLabel.string = 0;
    },

    onChangeTurn: function (params) {
        GameplayLieng.prototype.onChangeTurn.call(this, params);
        this.bettingPanel.active = false;
    },

    // drawcard
    onDrawCard: function (timeChooseOpenCard) {
        this.choseCardNoticeLabel.node.active = false;
        if (!this.layoutPlayerXiTo) {
            var cardsHoldCurrentPlayer = this.playerNodeList[0].node.getChildByName('Cards');
            this.layoutPlayerXiTo = cardsHoldCurrentPlayer.getComponent(cc.Layout);
        }

        if (this.gameManager.currentRound !== 1) {
            this.layoutPlayerXiTo.spacingX = -55;
        } else {
            this.layoutPlayerXiTo.spacingX = 45;
            this.choseCardNoticeLabel.node.active = true;
            if (timeChooseOpenCard) {
                this.playerNodeList[0].setCountDown(timeChooseOpenCard);
            }
        }
        GameplayLieng.prototype.onDrawCard.call(this);

    },

    // update info game
    updateInfoGame: function (params) {
        var optionLabel = 'Luật: ' + this.gameManager.gameType + ' cây';
        this.topPanelInGameData.optionLabel = optionLabel;
        if (this.topPanelInGame) {
            this.topPanelInGame.setOptionLabel(optionLabel);
        }

        this.moneyCallLabel.string = Utils.Number.format(params.allData.callBetting);
        GameplayLieng.prototype.updateInfoGame.call(this, params);
    },
    // ============================================================
    // Other
    // ============================================================

    initAllBettingButtons: function () {
        this.allButtonBettings = {};
        this.allButtonBettings[XiToConstant.Action.BET] = this.bettingButtonsList[0];
        this.allButtonBettings[XiToConstant.Action.ALL_IN] = this.bettingButtonsList[1];
        this.allButtonBettings[XiToConstant.Action.CALL] = this.bettingButtonsList[2];
        this.allButtonBettings[XiToConstant.Action.CHECK] = this.bettingButtonsList[3];
        this.allButtonBettings[XiToConstant.Action.FOLD] = this.bettingButtonsList[4];
        this.allButtonBettings[XiToConstant.Action.BET_1_2] = this.bettingButtonsList[5];
        this.allButtonBettings[XiToConstant.Action.BET_1_4] = this.bettingButtonsList[6];
        this.allButtonBettings[XiToConstant.Action.BET_X2] = this.bettingButtonsList[7];

        this.disableBettingButtons(true);
    },

    choosePublicCard: function (params) {
        if (this.gameManager.currentRound === 1) {
            var cardUI = params.target.getComponent('CardUI');
            this.gameManager.choosePublicCard(cardUI.card.getId());
            this.layoutPlayerXiTo.spacingX = -55;
            var cardId = cardUI.card.getId();
            var playerUIXiTo = this.playerNodeList[0].node.getComponent('PlayerUIXiTo');
            if (this.gameManager.gameType === 7) {
                if (playerUIXiTo.cardsHold[2].node !== params.target.node) {
                    var card3rd = playerUIXiTo.cardsHold[2].getComponent('CardUI');
                    cardUI.setCard(Card.fromId(card3rd.card.getId()));
                    card3rd.setCard(Card.fromId(cardId));
                }
                playerUIXiTo.cardsHold[0].showTransparentBlackNode(true);
                playerUIXiTo.cardsHold[1].showTransparentBlackNode(true);
            } else {
                if (playerUIXiTo.cardsHold[1].node !== params.target.node) {
                    var card2nd = playerUIXiTo.cardsHold[1].getComponent('CardUI');
                    cardUI.setCard(Card.fromId(card2nd.card.getId()));
                    card2nd.setCard(Card.fromId(cardId));
                }
                playerUIXiTo.cardsHold[0].showTransparentBlackNode(true);
            }
        }
    },

    showOpenCardCurrentPlayer: function (playerXiTo, player) {
        for (var i = 0; i < playerXiTo.cardsHold.length; i += 1) {
            if (playerXiTo.cardsHold[i].node.active) {
                if (player.publicCards.length > 0) {
                    playerXiTo.cardsHold[i].showTransparentBlackNode(true);
                }
                for (var j = 0; j < player.publicCards.length; j += 1) {
                    if (playerXiTo.cardsHold[i].getComponent('CardUI').card && player.publicCards[j] === playerXiTo.cardsHold[i].getComponent('CardUI').card.getId()) {
                        playerXiTo.cardsHold[i].showTransparentBlackNode(false);
                        break;
                    }
                }
            }
        }
    },

    setCurrentPlayerInTurn: function (allowedActionsList, actionMoneyList) {
        var j = 0;
        if (allowedActionsList) {
            this.disableBettingButtons(true);
            for (j = 0; j < allowedActionsList.length; j += 1) {
                this.allButtonBettings[allowedActionsList[j]].interactable = true;
            }
            this.bettingButtonsList[this.bettingButtonsList.length - 1].interactable = true;
        } else {
            // this.disableBettingButtons(false);
        }
        if (actionMoneyList) {
            this.moneyToLabel.string = '';
            this.moneyToX2Label.string = '';
            this.moneyTo14Label.string = '';
            this.moneyTo12Label.string = '';
            this.moneyToTatCaLabel.string = '';
            for (j = 0; j < actionMoneyList.length; j += 1) {
                switch (actionMoneyList[j].action) {
                    case XiToConstant.Action.BET:
                        this.moneyToLabel.string = Utils.Number.format(actionMoneyList[j].money);
                        break;
                    case XiToConstant.Action.BET_X2:
                        this.moneyToX2Label.string = Utils.Number.format(actionMoneyList[j].money);
                        break;
                    case XiToConstant.Action.BET_1_4:
                        this.moneyTo14Label.string = Utils.Number.format(actionMoneyList[j].money);
                        break;
                    case XiToConstant.Action.BET_1_2:
                        this.moneyTo12Label.string = Utils.Number.format(actionMoneyList[j].money);
                        break;
                    case XiToConstant.Action.ALL_IN:
                        this.moneyToTatCaLabel.string = Utils.Number.format(actionMoneyList[j].money);
                        break;
                }
            }
        }
    },

    initClickEventToCards: function () {
        var gameManager = this.gameManager,
            that = this;

        var cardsHold = this.playerNodeList[0].node.getComponent('PlayerUIXiTo').cardsHold;
        for (var i = 0; i < cardsHold.length; i += 1) {
            cardsHold[i].addComponent(cc.Button);
            cardsHold[i].on(cc.Node.EventType.TOUCH_START, function () {
                var cardScript = this.getComponent('CardUI');
                gameManager.choosePublicCard(cardScript.card.getId());
                that.canClickToCard = false;
            });
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
                }
            }
            if (player.publicCards) {
                this.showOpenCardCurrentPlayer(playerXiTo, player);
            }
        } else {
            for (k = 0; k < player.handSize; k += 1) {
                cardUI = playerXiTo.cardsHold[k].getComponent('CardUI');
                if (player.cards[k] >= 0) {
                    cardUI.setCard(Card.fromId(player.cards[k]));
                }
            }
        }
        if (player.state === XiToConstant.PlayerState.FOLDED) {
            if (index !== 0) {
                playerXiTo.fold();
            } else {
                playerXiTo.currentPlayerFold();
            }
        }


    },

    onShowBetting: function (params, playerUI) {
        GameplayLieng.prototype.onShowBetting.call(this, params, playerUI);
        this.moneyCallLabel.string = Utils.Number.format(params.allData.callBetting);
    },

    convertTypeBetting: function (typeBetting) {
        switch (typeBetting) {
            case XiToConstant.Action.BET:
                return XiToConstant.Effect.TO;
            case XiToConstant.Action.ALL_IN:
                return XiToConstant.Effect.TO_TAT_CA;
            case XiToConstant.Action.CALL:
                return XiToConstant.Effect.THEO;
            case XiToConstant.Action.CHECK:
                return XiToConstant.Effect.NHUONG_TO;
            case XiToConstant.Action.FOLD:
                return XiToConstant.Effect.UP_BO;
            case XiToConstant.Action.BET_1_2:
                return XiToConstant.Effect.TO_12;
            case XiToConstant.Action.BET_1_4:
                return XiToConstant.Effect.TO_14;
            case XiToConstant.Action.BET_X2:
                return XiToConstant.Effect.TO_X2;
            case XiToConstant.Action.ALL_HAND:
                return XiToConstant.Effect.CHOI_TAT_TAY;
        }
    },

    restartGame: function () {
        this.moneyCallLabel.string = '0';
        GameplayLieng.prototype.restartGame.call(this);
    },

    // $onFocus: function () {
    //     if (this.gameManager.gameState === XiToConstant.GameState.ROUND) {
    //         this.onReDrawCard();
    //     }
    // },

});
