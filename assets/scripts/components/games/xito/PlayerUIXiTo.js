var CardUI = require('CardUI'),
    GameConstant = require('GameConstant'),
    Card = require('Card');
cc.Class({
    extends: cc.Component,

    properties: {
        cardsHold: {
            default: [],
            type: CardUI
        },
        callMoneyLabel: cc.Label,
        callMoneyNode: cc.Node,
        cardsResultLabel: cc.Label,
        holdNode: cc.Node
    },

    // use this for initialization
    onLoad: function () {
        this.trashCards = [];
    },

    getNumberActiveChildren: function () {
        var count = 0;
        for (var i = 0; i < this.cardsHold.length; i += 1) {
            if (this.cardsHold[i].node.active) {
                count += 1;
            }
        }
        return count;
    },

    fold: function () {
        for (var i = 0; i < this.cardsHold.length; i += 1) {
            this.cardsHold[i].fold();
            this.cardsHold[i].node.position = cc.p(this.cardsHold[i].node.x, 0);
        }
    },

    currentPlayerFold: function () {
        for (var i = 0; i < this.cardsHold.length; i += 1) {
            if (this.cardsHold[i].node.active) {
                this.cardsHold[i].showTransparentBlackNode(true);
                this.cardsHold[i].node.position = cc.p(this.cardsHold[i].node.x, 0);
            }
        }
    },

    hideAllCards: function (activeOnly) {
        for (var i = 0; i < this.cardsHold.length; i += 1) {
            this.cardsHold[i].showTransparentBlackNode(false);
            this.cardsHold[i].node.position = cc.p(this.cardsHold[i].node.x, 0);
            this.cardsHold[i].node.active = false;
            // this.cardsHold[i].node.stopAllActions();
            // this.cardsHold[i].node.setScale(1);
            if (!activeOnly) {
                this.cardsHold[i].fold();
            }
        }
    },

    deactiveAllCards: function () {
        this.hideAllCards(false);
        this.cardsResultLabel.string = '';
        if (this.trashCards) {
            for (var j = 0; j < this.trashCards.length; j += 1) {
                this.trashCards[j].destroy();
            }
        }
        this.trashCards = [];
    },

    showAllCards: function (cards, bestCards, bestCardsType, gameCmd, delayTime) {
        if (gameCmd !== GameConstant.POKER.CMD) {
            if (cards) {
                for (var i = 0; i < cards.length; i += 1) {
                    var cardScript = this.cardsHold[i].getComponent('CardUI');
                    cardScript.fold();
                    this.cardsHold[i].node.stopAllActions();
                    this.cardsHold[i].node.active = true;
                    this.cardsHold[i].node.setScale(1);
                    this.cardsHold[i].showTransparentBlackNode(true);
                    cardScript.setCard(Card.fromId(cards[i]));
                    if (bestCards) {
                        for (var j = 0; j < bestCards.length; j += 1) {
                            if (cards[i] === bestCards[j]) {
                                this.cardsHold[i].showTransparentBlackNode(false);
                                this.cardsHold[i].node.runAction(cc.moveTo(0.1, cc.p(this.cardsHold[i].node.x, 30)));
                                break;
                            }
                        }
                    }
                }
            }
            if (bestCardsType) {
                this.cardsResultLabel.string = bestCardsType.toUpperCase();
            }
        } else {
            this.showAllCardsPoker(cards, bestCards, bestCardsType, delayTime);
        }
    },

    showAllCardsPoker: function (cards, bestCards, bestCardsType, delayTime) {
        for (var j = 0; j < this.trashCards.length; j += 1) {
            this.trashCards[j].destroy();
        }
        this.trashCards = [];
        if (cards) {
            for (var i = 0; i < cards.length; i += 1) {
                this.cardsHold[i].node.active = false;
                this.cardsHold[i].fold();
                var card = cc.instantiate(this.cardsHold[i].node);
                var cardScript = card.getComponent('CardUI');
                card.parent = this.cardsHold[i].node.parent.parent;
                card.x = i === 0 ? -17 : 17;
                card.y = 10;
                card.rotation = 0;
                card.setScale(0, 0.55);
                cardScript.setCard(Card.fromId(cards[i]));
                card.active = true;
                // card.stopAllActions();
                card.runAction(cc.sequence(
                    cc.scaleTo(0.5, 0.55),
                    cc.delayTime(delayTime),
                    cc.removeSelf()));
                this.trashCards.push(card);
            }
        }
        if (bestCardsType) {
            this.cardsResultLabel.string = bestCardsType.toUpperCase();
        }
    },

    findCard: function (cardId) {
        for (var i = 0; i < this.cardsHold.length; i += 1) {
            var cardScript = this.cardsHold[i].getComponent('CardUI');

            if (cardScript.card && cardScript.card.getId() === cardId) {
                return this.cardsHold[i];
            }
        }
    }
});
