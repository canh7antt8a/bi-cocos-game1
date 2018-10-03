var Card = require('Card'),
    Utils = require('Utils'),
    AuthUser = require('AuthUser'),
    PlayerUI = require('PlayerUI');

cc.Class({
    extends: PlayerUI,

    properties: {
        cardHold: cc.Node,
        portCardTrash: cc.Node,
        backCardNode: cc.Node,
        moneyExchangeLabel: cc.Label,
        numberCardLabel: cc.Label,
        cardPrefab: cc.Prefab,
        dealerNode: cc.Node,
        TIME_MOVE_CARD: {
            default: 0.3,
            visible: false
        },
        KHOANG_CACH_QUAN_BAI: {
            default: 55,
            visible: false
        },
        CONSTANT_X: {
            default: 100,
            visible: false
        },
        CONSTANT_Y: {
            default: 50,
            visible: false
        },
        CONSTANT_ROTATION: {
            default: 0,
            visible: false
        },
        Hold: cc.Node
    },

    // onLoad: function() {
    //     PlayerUI.prototype.onLoad.call(this);
    //     var self = this;
    //     cc.eventManager.addListener({
    //         event: cc.EventListener.KEYBOARD,
    //         onKeyPressed: function() {
    //             self.drawOnPortDeal(self.cards, self.handSize, self.canMove);
    //         }
    //     }, this.node);
    // },

    onUpdateHand: function(cards, handSize, canMove) {
        Utils.Node.destroyAllChildrenInNode(this.cardHold);
        // this.cardHold.removeAllChildren();
        if (handSize > 0) {
            this.node.runAction(cc.sequence(cc.delayTime(0.05), cc.callFunc(function() {
                this.drawOnPortDeal(cards, handSize, canMove);
            }.bind(this))));
        }
        // this.cards = cards;
        // this.handSize = handSize;
        // this.canMove = canMove;
    },

    drawOnPortDeal: function(cards, handSize, canMove) {
        var card,
            count = 0,
            time = 0.5,
            timeDelay = 0.06,
            rotation = 0,
            i = 0,
            indexSibling = 1;
        this.numberCard = 0;
        for (i = 0; i < handSize; i += 1) {
            card = cc.instantiate(this.cardPrefab);
            card.setScale(0.4, 0.4);
            // card.zIndex = indexZ;
            card.parent = this.dealerNode;

            count += 1;
            indexSibling += 1;
            var cardId;
            if (cards) {
                cardId = cards[i];
            }
            else {
                cardId = null;
            }

            this.hieuUngChiaBai(card, time, timeDelay * count, rotation, indexSibling, cardId, handSize, canMove);
        }
        if (handSize > 0 && this.backCardNode) {
            this.backCardNode.active = true;
            if (this.numberCardLabel) {
                this.numberCardLabel.string = 0;
            }
        }

    },

    hieuUngChiaBai: function(card, time, timeDelay, rotation, index, cardId, handSize, canMove) {
        var self = this;
        card.stopAllActions();
        var pos = this.Hold.parent.convertToWorldSpaceAR(cc.p(self.Hold.x, self.Hold.y)).sub(cc.p(cc.winSize.width / 2, cc.winSize.height / 2));

        var chiaBaiAction = cc.sequence(
            cc.delayTime(timeDelay),
            cc.spawn(
                cc.moveTo(time, pos),
                cc.rotateTo(time, rotation)
            ),
            cc.callFunc(function() {
                self.numberCard += 1;
                if (self.numberCard > handSize) {
                    self.numberCard = handSize;
                }
                if (self.numberCardLabel) {
                    self.numberCardLabel.string = self.numberCard;
                }
            }, this),
            cc.delayTime(time / 2),
            cc.callFunc(function() {
                if (self.player && this.cardHold.childrenCount >= handSize) {
                    card.destroy();
                    return;
                }
                card.rotation = 0;
                card.position = cc.p(0, 0);
                card.parent = this.cardHold;
                card.setSiblingIndex(index);
                if (card.getComponent('CardUIPhom')) {
                    var cardUIPhom = card.getComponent('CardUIPhom');
                    cardUIPhom.canMove = canMove;
                    cardUIPhom.setCard(Card.fromId(cardId));
                    cardUIPhom.interactable = true;
                }
                if (cardId === null || self.findCard(cardId, self.portCardTrash)) {
                    card.destroy();
                }

            }, this),
            cc.scaleTo(0.1, 1)
        );
        chiaBaiAction.easing(cc.easeQuadraticActionOut());
        card.runAction(chiaBaiAction);
    },

    onDiscard: function(cards) {
        if (cards) {
            this.initEffectCard(cards, this.portCardTrash, this.cardHold, this);
            if (this.backCardNode) {
                if (this.player.data.handSize <= 0) {
                    this.backCardNode.active = false;
                }
                if (this.numberCardLabel) {
                    this.numberCardLabel.string = this.player.data.handSize;
                }
            }
        }
    },

    initEffectCard: function(cards, desNode, sourceNode, sourcePlayer, isTakeCardPhom, playerTakeCardPhom) {
        if (cards) {
            var randomX = Math.random();
            var randomY = Math.random();
            randomX = (randomX < 0.5 ? -randomX : randomX) * this.CONSTANT_X;
            randomY = (randomY < 0.5 ? -randomY : randomY) * this.CONSTANT_Y;
            var randomRotation = Math.random();
            randomRotation *= (randomRotation < 0.5 ? -randomRotation : randomRotation) * this.CONSTANT_ROTATION;
            if (desNode && desNode.getComponent(cc.Layout)) {
                desNode.getComponent(cc.Layout).enabled = false;
                randomY = 0;
                randomRotation = 0;
                var check = desNode.anchorX === 0 ? 1 : -1;
                var number = check === 1 ? desNode.childrenCount : 0;
                var defaultCard = cc.instantiate(this.cardPrefab);
                var width = defaultCard.width;
                defaultCard.destroy();
                randomX = check * (width / 2 + number * (width + desNode.getComponent(cc.Layout).spacingX));
            }
            randomRotation = 0;
            for (var i = 0; i < cards.length; i += 1) {
                var cardNew = null;
                var cardId = cards[i];
                var cardUIPhom = this.findCard(cardId, sourceNode);
                var isMyCard = false;
                if (cardUIPhom) {
                    cardNew = cardUIPhom.node;
                    isMyCard = true;
                }
                if (!cardNew) {
                    cardNew = cc.instantiate(this.cardPrefab);
                    if (sourcePlayer.backCardNode) {
                        cardNew.parent = sourcePlayer.backCardNode;
                        cardNew.position = cc.p(0, 0);
                    }
                    else {
                        cardNew.parent = sourceNode;
                        cardNew.position = cc.p(0, 0);
                    }
                }
                var pos2InWorld;
                pos2InWorld = cardNew.parent.convertToWorldSpaceAR(cardNew.position);
                cardNew.parent = desNode;
                if (desNode) {
                    cardNew.position = desNode.convertToNodeSpaceAR(pos2InWorld);
                    cardNew.setSiblingIndex(desNode.childrenCount);
                    this.effectCard(cardNew, i, randomX, randomY, randomRotation, desNode, isMyCard, cardId, isTakeCardPhom, playerTakeCardPhom);
                }
                cardNew.getComponent('CardUIPhom').interactable = false;
                // cardNew.zIndex = 1;

            }
            if (this.numberCardLabel) {
                this.numberCardLabel.string = this.player.data.handSize;
            }
        }
    },

    effectCard: function(cardNew, index, randomX, randomY, randomRotation, desNode, isMyCard, cardId, isTakeCardPhom, playerTakeCardPhom) {
        var self = this;
        cardNew.stopAllActions();
        var action = cc.sequence(
            cc.spawn(
                cc.moveTo(self.TIME_MOVE_CARD, cc.p(randomX + index * this.KHOANG_CACH_QUAN_BAI, randomY)),
                cc.rotateTo(self.TIME_MOVE_CARD, randomRotation)
            ),
            cc.callFunc(function() {
                // if (!isMyCard) {
                //     cardNew.setScaleX(0, 1);
                // }
                // cardNew.runAction(cc.scaleTo(0.2, 1));
                cardNew.getComponent('CardUIPhom').setCard(Card.fromId(cardId));
                var isPlayerTakeCard = false;
                if (isTakeCardPhom) {
                    cardNew.getComponent('CardUIPhom').hoverAnNode.active = true;
                    if (self.player.data.username === AuthUser.username) {
                        cardNew.getComponent('CardUIPhom').interactable = true;
                        cardNew.getComponent('CardUIPhom').canMove = true;
                    }
                    else {
                        cardNew.getComponent('CardUIPhom').interactable = false;
                    }
                    if (playerTakeCardPhom.player.data.username === AuthUser.username) {
                        isPlayerTakeCard = true;
                    }
                    // self.onXepLaiBai(true);
                }
                if (desNode.getComponent(cc.Layout)) {
                    desNode.getComponent(cc.Layout).enabled = true;
                }
                // self.onRefreshGame(false);
                self.node.emit('refresh_game', {
                    isPlayerTakeCard: isPlayerTakeCard
                });
            })
        );
        action.easing(cc.easeQuadraticActionOut());
        cardNew.runAction(action);
    },

    onRefreshGame: function() {

    },

    findCard: function(cardId, node) {
        if (node) {
            var childs = node.children;
            for (var i = 0; i < childs.length; i += 1) {
                var cardUIPhom = childs[i].getComponent('CardUIPhom');
                if (cardUIPhom) {
                    if (cardUIPhom.card && cardUIPhom.card.getId() === cardId) {
                        return cardUIPhom;
                    }
                }
            }
        }
        return null;
    },

    getCardTouched: function() {
        var childs = this.cardHold.children;
        var cards = [];
        for (var i = 0; i < childs.length; i += 1) {
            var cardUIPhom = childs[i].getComponent('CardUIPhom');
            if (cardUIPhom) {
                if (cardUIPhom.isTouched) {
                    cards.push(cardUIPhom);
                }
            }
        }
        return cards;
    },

    clearAll: function() {
        Utils.Node.destroyAllChildrenInNode(this.cardHold);
        // this.cardHold.removeAllChildren();
        this.clearCountDown();
        if (this.backCardNode) {
            this.backCardNode.active = false;
        }

        this.clearEffects();
    },

    showAllCards: function(cards) {
        Utils.Node.destroyAllChildrenInNode(this.cardHold);
        // this.cardHold.removeAllChildren();
        if (this.portCardAnNode) {
            Utils.Node.destroyAllChildrenInNode(this.portCardAnNode);
            // this.portCardAnNode.removeAllChildren();
        }
        if (this.backCardNode) {
            this.backCardNode.active = false;
        }
        for (var i = 0; i < cards.length; i += 1) {
            var cardNew = cc.instantiate(this.cardPrefab);
            cardNew.parent = this.cardHold;
            cardNew.getComponent('CardUIPhom').setCard(Card.fromId(cards[i]));
            cardNew.getComponent('CardUIPhom').interactable = false;
            cardNew.setScale(0, 1);
            cardNew.runAction(cc.scaleTo(0.3, 1));
        }
    },

    showTrashCard: function(cards) {
        var card;
        var randomX = Math.random();
        var randomY = Math.random();
        randomX = (randomX < 0.5 ? -randomX : randomX) * this.CONSTANT_X;
        randomY = (randomY < 0.5 ? -randomY : randomY) * this.CONSTANT_Y;
        var randomRotation = Math.random();
        randomRotation *= (randomRotation < 0.5 ? -randomRotation : randomRotation) * this.CONSTANT_ROTATION;
        for (var i = 0; i < cards.length; i += 1) {
            card = cc.instantiate(this.cardPrefab);
            card.parent = this.portCardTrash;
            var cardUIPhom = card.getComponent('CardUIPhom');
            cardUIPhom.setCard(Card.fromId(cards[i]));
            cardUIPhom.interactable = false;
            card.position = cc.p(randomX + i * this.KHOANG_CACH_QUAN_BAI, randomY);
            card.rotation = randomRotation;
        }
    },

    showMoneyExchange: function(moneyExchange) {
        this.moneyExchangeLabel.node.y = 30;
        this.moneyExchangeLabel.node.opacity = 255;
        this.moneyExchangeLabel.node.active = true;
        if (moneyExchange > 0) {
            this.moneyExchangeLabel.string = '+' + Utils.Number.abbreviate(moneyExchange);
        }
        else {
            this.moneyExchangeLabel.string = Utils.Number.abbreviate(moneyExchange);
        }
        this.moneyExchangeLabel.node.stopAllActions();
        this.moneyExchangeLabel.node.runAction(this.moneyExchangeAction);
    },

    onRefresh: function() {
        var touchedCards = this.getCardTouched();
        Utils.Node.destroyAllChildrenInNode(this.cardHold);
        // this.cardHold.removeAllChildren();
        this.cardHold.getComponent(cc.Layout).enabled = true;
        if (this.player.data.cards) {
            var cards = this.player.data.cards;
            for (var i = 0, j = 0; i < cards.length; i += 1) {
                var cardNew = cc.instantiate(this.cardPrefab);
                var cardUIPhom = cardNew.getComponent('CardUIPhom');
                cardUIPhom.setCard(Card.fromId(cards[i]));
                cardNew.parent = this.cardHold;
                cardNew.position = cc.p(0, 0);
                cardUIPhom.interactable = true;
                if (touchedCards && touchedCards[j] && touchedCards[j].card.getId() === cards[i]) {
                    // cardUIPhom.onButtonTouch(true);
                    cardUIPhom.isTouched = true;
                    cardUIPhom.node.setPosition(0, cardUIPhom.posYFirst + cardUIPhom.DELTA_Y_TOUCHED);
                    j += 1;
                }
            }
        }
        else {
            if (this.backCardNode && this.player.data.handSize) {
                this.backCardNode.active = true;
                this.numberCardLabel.string = this.player.data.handSize;
            }
        }
    }
});
