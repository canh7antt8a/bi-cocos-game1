var PlayerUIPhom = require('PlayerUIPhom'),
    Card = require('Card'),
    PhomUtils = require('PhomUtils');



cc.Class({
    extends: PlayerUIPhom,

    properties: {

    },

    // use this for initialization
    onLoad: function () {
        PlayerUIPhom.prototype.onLoad.call(this);
    },

    onUpdateHand: function (data) {
        PlayerUIPhom.prototype.onUpdateHand.call(this, data);
    },

    onRefreshGame: function (data) {
        PlayerUIPhom.prototype.onRefreshGame.call(this, data);

    },

    drawOnPortDanh: function (data) {
        PlayerUIPhom.prototype.drawOnPortDanh.call(this, data);

    },

    drawOnPortDeal: function (data) {
        this.portCardDealNode.removeAllChildren();

        var cardNew;
        for (var i = 0; i < data.length; i += 1) {
            cardNew = cc.instantiate(this.cardPrefab);
            cardNew.parent = this.portCardDealNode;

            if (cardNew.getComponent('CardUIPhom')) {
                cardNew = cardNew.getComponent('CardUIPhom');
                cardNew.setCard(Card.fromId(data[i]));
            }
        }
    },

    drawOnPortAn: function (data) {
        if (data.length < 1) {
            return;
        }
        this.portCardAnNode.removeAllChildren();
        var childDeal = this.portCardDealNode.children;
        for (var index = 0; index < data.length; index += 1) {
            for (var i = 0; i < childDeal.length; i += 1) {
                if (childDeal[i].getComponent('CardUIPhom')) {
                    var tmp = childDeal[i].getComponent('CardUIPhom');
                    if (data[index] === tmp.card.getId()) {
                        tmp.hoverAnNode.active = true;
                        break;
                    }
                }
            }
        }

    },

    drawOnPortShow: function (data) {
        PlayerUIPhom.prototype.drawOnPortShow.call(this, data);

    },

    clearStateAction: function () {
        PlayerUIPhom.prototype.clearStateAction.call(this);
    },

    onXepLaiBai: function () {
        this.myCards = this.getMyCards();
        this.myCards = PhomUtils.ArrangeCardsOptimize(this.myCards, true);
        PhomUtils.ArrangePositionCards(this.myCards, this.portCardDealNode);
    },

    getMyCards: function () {
        var result = [];
        var child = this.portCardDealNode.children;
        for (var i = 0; i < child.length; i += 1) {
            if (child[i].getComponent('CardUIPhom')) {
                result.push(child[i].getComponent('CardUIPhom').card);
            }
        }
        return result;
    },

    getCardTouched: function () {
        var child = this.portCardDealNode.children;
        for (var i = 0; i < child.length; i += 1) {
            if (child[i].getComponent('CardUIPhom')) {
                if (child[i].getComponent('CardUIPhom').isTouched) {
                    return child[i].getComponent('CardUIPhom').card;
                }
            }
        }
        return null;
    },

    setStateCardInShowOff: function (data) {
        var listCards = [];
        for (var i = 0; i < data.length; i += 1) {
            for (var j = 0; j < data[i].length; j += 1) {
                listCards.push((data[i])[j]);
            }
        }

        var child = this.portCardDealNode.children;
        for (var index = 0; index < listCards.length; index += 1) {
            for (var k = 0; k < child.length; k += 1) {
                if (child[k].getComponent('CardUIPhom')) {
                    if (child[k].getComponent('CardUIPhom').card.getId() === listCards[index]) {
                        child[k].getComponent('CardUIPhom').setMoveCardUpDown(true);
                        break;
                    }
                }
            }
        }

    },

    onSentCard: function () {

    },

    onShowOffCard: function () {

    },

    onTakeCard: function () {

    },

    onDiscard: function (cardId) {
        var self = this;
        var child = this.portCardDealNode.children;
        var cardNode;
        for (var i = 0; i < child.length; i += 1) {
            if (child[i].getComponent('CardUIPhom')) {
                cardNode = child[i].getComponent('CardUIPhom');
                if (cardNode.card.getId() === cardId) {
                    cardNode = child[i];
                    break;
                }
            }
        }
        if (!cardNode) {
            return;
        }
        cardNode.node.setSiblingIndex(99);

        var sequenceAction = cc.sequence(
            cc.callFunc(function () {
                cc.scaleTo(self.TIME_MOVE_CARD, 0.6);
            }),
            cc.moveTo(self.TIME_MOVE_CARD, self.portCardDanhNode),
            cc.callFunc(function () {
                cardNode.node.parent = self.portCardDanhNode;
                cardNode.buttonOnCard.interactable = false;
                cardNode.node.scale = 1;
            })
        );
        cardNode.node.runAction(sequenceAction);
    },


    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
