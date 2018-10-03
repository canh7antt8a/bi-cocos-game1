var Card = require('Card'),
    PlayerUITLMN = require('PlayerUITLMN'),
    PhomConstant = require('PhomConstant'),
    AuthUser = require('AuthUser'),
    Utils = require('Utils'),
    PhomUtils = require('PhomUtils');

cc.Class({
    extends: PlayerUITLMN,

    properties: {
        portCardShowNode: {
            default: [],
            type: cc.Node
        },
        portCardAnNode: cc.Node,
        buttonGuiList: {
            default: [],
            type: cc.Button
        },
        pointLabel: cc.Label,
        KHOANG_CACH_QUAN_BAI: {
            default: 55,
            override: true,
            visible: false
        },
        CONSTANT_X: {
            default: 0,
            override: true,
            visible: false
        },
        CONSTANT_Y: {
            default: 0,
            override: true,
            visible: false
        },
        CONSTANT_ROTATION: {
            default: 0,
            override: true,
            visible: false
        },
    },

    // use this for initialization
    onLoad: function() {
        PlayerUITLMN.prototype.onLoad.call(this);
        this.phomList = [];
        this._isSanhFirst = false;

    },

    setStateAction: function(act) {
        this.action = act;
        switch (act) {
        case PhomConstant.Action.DISCARD:
            this.setEffect(PhomConstant.Effect.DANG_DANH);
            break;

        case PhomConstant.Action.PICK_CARD:
            this.setEffect(PhomConstant.Effect.DANG_BOC);
            break;
        case PhomConstant.Action.SHOW_OFF:
            this.setEffect(PhomConstant.Effect.DANG_HA);
            break;
        case PhomConstant.Action.SENT:
            this.setEffect(PhomConstant.Effect.DANG_GUI);
            break;
        }
    },

    setStateInTurn: function(inTurnState) {
        switch (inTurnState) {
        case PhomConstant.InTurnState.DISCARD:
            this.setEffect(PhomConstant.Effect.DANG_DANH);
            this.action = PhomConstant.Action.DISCARD;
            break;
        case PhomConstant.InTurnState.PICK_OR_TAKE_CARD:
            this.setEffect(PhomConstant.Effect.DANG_BOC);
            this.action = PhomConstant.Action.PICK_CARD;
            break;
        case PhomConstant.InTurnState.SHOW_OFF:
            this.setEffect(PhomConstant.Effect.DANG_HA);
            this.action = PhomConstant.Action.SHOW_OFF;
            break;
        case PhomConstant.InTurnState.SEND:
            this.setEffect(PhomConstant.Effect.DANG_GUI);
            this.action = PhomConstant.Action.SENT;
            break;
        }
    },

    onUpdateGame: function() {
        this.onRefreshGame(false);
    },

    onRefreshGame: function(isFinish, detail) {
        if (this.player) {
            if (this.player.data.handSize > 0 && !isFinish) {
                if (this.player.data.username === AuthUser.username) {
                    if (this.player.data.cards) {
                        var child = this.cardHold.children;
                        var check = false;
                        for (var k = 0; k < child.length; k += 1) {
                            var cardUIPhom = child[k].getComponent('CardUIPhom');
                            check = false;
                            if (cardUIPhom && cardUIPhom.card) {
                                for (var j = 0; j < this.player.data.cards.length; j += 1) {
                                    if (cardUIPhom.card.getId() === this.player.data.cards[j]) {
                                        check = true;
                                        break;
                                    }
                                }
                            }
                            if (!check) {
                                break;
                            }
                        }
                        if (!check || child.length !== this.player.data.cards.length) {
                            this.reDrawPort(this.cardHold, this.player.data.cards, true, true, true);
                        }

                        if (detail) {
                            if (detail.isPlayerTakeCard) {
                                this.onXepLaiBai(false);
                            }
                            else if (detail.isPickCardPhom && this.checkRefCard(detail.cardId)) {
                                this.onXepLaiBai(false);
                            }
                        }
                        else {
                            this.onXepLaiBai(false);
                        }
                    }
                }
                else {
                    this.backCardNode.active = true;
                }

            }

            this.reDrawPort(this.portCardTrash, this.player.data.trash, false, false);
            if (!isFinish) {
                if (this.player.data.username !== AuthUser.username) {
                    if (this.player.data.phomList.length > 0) {
                        Utils.Node.destroyAllChildrenInNode(this.portCardAnNode);
                    }
                    else {
                        this.reDrawPort(this.portCardAnNode, this.player.data.takenCards, false, true);
                    }
                }
                else {
                    // this.reDrawPort(this.portCardAnNode, this.player.data.takenCards, false, true, true);
                }
            }

            for (var i = 0; i < this.portCardShowNode.length; i += 1) {
                this.reDrawPort(this.portCardShowNode[i], this.player.data.phomList[i], false, false);
            }
        }


    },

    clearAll: function() {
        Utils.Node.destroyAllChildrenInNode(this.portCardAnNode);
        Utils.Node.destroyAllChildrenInNode(this.portCardTrash);
        Utils.Node.destroyAllChildrenInNode(this.cardHold);
        for (var i = 0; i < this.portCardShowNode.length; i += 1) {
            Utils.Node.destroyAllChildrenInNode(this.portCardShowNode[i]);
        }
        if (this.backCardNode) {
            this.backCardNode.active = false;
        }
        if (this.phomList) {
            this.phomList = [];
        }
        for (var j = 0; j < this.buttonGuiList.length; j += 1) {
            this.buttonGuiList[j].node.active = false;
        }
        this.pointLabel.string = '';
        this.clearEffects();
    },

    hideGuiButtons: function() {
        for (var j = 0; j < this.buttonGuiList.length; j += 1) {
            this.buttonGuiList[j].node.active = false;
        }
    },

    reDrawPort: function(node, array, interactable, isTakenCard, canMove) {
        var i;
        node.getComponent(cc.Layout).enabled = true;
        // if (isTakenCard) {
        //     if (this.player.data.username === AuthUser.username) {
        //         for (i = 0; i < array.length; i += 1) {
        //             var takenCardUIPhom = this.findCard(array[i], node);
        //             if (takenCardUIPhom) {
        //                 takenCardUIPhom.hoverAnNode.active = true;
        //                 takenCardUIPhom.interactable = true;
        //                 takenCardUIPhom.canMove = true;
        //             }
        //         }
        //         return;
        //     }
        // }

        // Utils.Node.destroyAllChildrenInNode(node);
        node.removeAllChildren();
        if (array) {
            for (i = 0; i < array.length; i += 1) {
                var cardNew = cc.instantiate(this.cardPrefab);
                var cardUIPhom = cardNew.getComponent('CardUIPhom');
                cardUIPhom.setCard(Card.fromId(array[i]));
                cardNew.parent = node;
                cardNew.position = cc.p(0, 0);
                cardUIPhom.interactable = interactable;
                cardUIPhom.canMove = canMove;
                if (isTakenCard) {
                    if (this.player.data.username === AuthUser.username) {
                        for (var j = 0; j < this.player.data.takenCards.length; j += 1) {
                            if (array[i] === this.player.data.takenCards[j]) {
                                cardUIPhom.hoverAnNode.active = true;
                                break;
                            }
                        }
                    }
                    else {
                        cardUIPhom.hoverAnNode.active = true;
                    }
                }
            }
        }
    },

    onSentCard: function(cardId, cards, sourcePlayerUIPhom) {
        if (!sourcePlayerUIPhom) {
            return;
        }
        for (var i = 0; i < cards.length; i += 1) {
            for (var j = 0; j < this.phomList.length; j += 1) {
                if (cards[i] === this.phomList[j].cardId) {
                    this.initEffectCard([cardId], this.portCardShowNode[this.phomList[j].index], sourcePlayerUIPhom.cardHold, sourcePlayerUIPhom);
                    return;
                }
            }
        }
        if (this.backCardNode) {
            if (this.player.data.handSize <= 0) {
                this.backCardNode.active = false;
            }
            else {
                if (this.numberCardLabel) {
                    this.numberCardLabel.string = this.player.data.handSize;
                }
            }
        }
    },

    onShowOffCard: function(phomList) {
        // var self = this;
        if (phomList) {
            var index = 0;
            if (this.portCardShowNode[0].children.length > 0) {
                index = 1;
            }
            if (this.portCardShowNode[1].children.length > 0) {
                index = 2;
            }
            for (var j = 0; j < phomList.length; j += 1) {
                var cards = phomList[j];
                if (cards) {
                    var check = false;
                    for (var k = 0; k < this.phomList.length; k += 1) {
                        if (cards[0] === this.phomList[k].cardId) {
                            check = true;
                            break;
                        }
                    }
                    if (check) {
                        continue;
                    }
                    this.initEffectCard(cards, this.portCardShowNode[index], this.cardHold, this);
                    if (this.portCardAnNode !== this.cardHold) {
                        Utils.Node.destroyAllChildrenInNode(this.portCardAnNode);
                        // this.portCardAnNode.removeAllChildren();
                    }
                    this.phomList.push({
                        cardId: cards[0],
                        index: j
                    });
                    index += 1;
                }
            }
            if (this.backCardNode) {
                if (this.player.data.handSize <= 0) {
                    this.backCardNode.active = false;
                }
                else {
                    if (this.numberCardLabel) {
                        this.numberCardLabel.string = this.player.data.handSize;
                    }
                }
            }
        }
    },

    onPickCard: function(cardId) {
        var self = this;
        var data = this.player && this.player.data;
        if (data) {
            var card = cc.instantiate(this.cardPrefab);
            card.setScale(0.5, 0.5);
            card.parent = this.dealerNode;
            card.position = cc.v2(cc.winSize.width / 2, cc.winSize.height / 2);
            var x = this.node.x,
                y = this.node.y + 20,
                pos2InWorld = card.parent.convertToWorldSpaceAR(cc.v2(0, 0));
            if (this.player.data.username === AuthUser.username) {
                this.cardHold.getComponent(cc.Layout).enabled = false;
                card.parent = this.cardHold;
                card.position = this.cardHold.convertToNodeSpace(pos2InWorld);
                card.setScale(0.7);
                var number = this.cardHold.childrenCount;
                var width = card.width;
                y = 0;
                x = number * (width + this.cardHold.getComponent(cc.Layout).spacingX);
            }
            else {
                card.parent = this.backCardNode;
                card.position = this.backCardNode.convertToNodeSpace(pos2InWorld);
                card.zIndex = 2;
                y = 0;
                x = 0;
            }
            var action = cc.sequence(
                cc.spawn(
                    cc.moveTo(0.5, cc.p(x, y)),
                    cc.rotateTo(0.5, 135)
                ),
                cc.callFunc(function() {
                    // card.zIndex = 1;
                    card.rotation = 0;
                    if (this.player.data.username === AuthUser.username) {
                        this.cardHold.getComponent(cc.Layout).enabled = true;
                    }
                    else {
                        card.position = cc.p(0, 0);
                        card.parent = this.cardHold;
                    }
                    // card.zIndex = 1;
                    card.setSiblingIndex(this.cardHold.childrenCount);
                    if (card.getComponent('CardUIPhom')) {
                        var cardUIPhom = card.getComponent('CardUIPhom');
                        cardUIPhom.setCard(Card.fromId(cardId));
                        cardUIPhom.interactable = true;
                        cardUIPhom.canMove = true;
                    }
                    if (cardId === null) {
                        card.destroy();
                    }
                }, this),
                cc.scaleTo(0.1, 1),
                cc.callFunc(function() {
                    var check = false;
                    var foundCard = self.findCard(cardId, self.portCardTrash);
                    if (foundCard) {
                        check = true;
                    }
                    if (data.cards) {

                        for (var i = 0; i < data.cards.length; i += 1) {
                            if (cardId === data.cards[i]) {
                                check = true;
                                break;
                            }
                        }

                        if (!check) {
                            card.destroy();
                        }
                    }
                    self.node.emit('refresh_game', {
                        isPickCardPhom: true,
                        cardId: cardId
                    });
                }, this)
            );
            action.easing(cc.easeQuadraticActionOut());
            card.runAction(action);
        }
    },

    onTakeCard: function(cardId) {
        var foundCard = this.findCard(cardId, this.portCardAnNode);
        if (foundCard) {
            foundCard.setCard(Card.fromId(cardId));
            if (this.player.data.username === AuthUser.username) {
                foundCard.interactable = true;
            }
            else {
                foundCard.interactable = false;
            }
            foundCard.hoverAnNode.active = true;
            return;
        }
    },

    setStateCardInShowOff: function(phomList) {
        if (phomList) {
            for (var j = 0; j < phomList.length; j += 1) {
                var cards = phomList[j];
                if (cards) {
                    for (var i = 0; i < cards.length; i += 1) {
                        var card = this.findCard(cards[i], this.cardHold);
                        if (card) {
                            card.interactable = true;
                            card.onButtonTouch();
                        }
                    }
                }
            }
        }
    },

    showGuiButtonInPhoms: function(cardId, cards, gameManager) {
        var self = this;
        for (var i = 0; i < cards.length; i += 1) {
            for (var j = 0; j < this.phomList.length; j += 1) {
                if (cards[i] === this.phomList[j].cardId) {
                    this.buttonGuiList[j].node.active = true;
                    this.buttonGuiList[j].node.on(cc.Node.EventType.TOUCH_START, function() {
                        self.sendPhom(cardId, cards, gameManager);
                    });
                    return;
                }
            }
        }
    },

    sendPhom: function(cardId, cards, gameManager) {
        gameManager.requestSentCard(cardId, cards);
    },

    // Hiệu ứng bị ăn
    effectTakenCard: function(targetPlayerUIPhom, cardId) {
        this.initEffectCard([cardId], targetPlayerUIPhom.portCardAnNode, this.portCardTrash, this, true, targetPlayerUIPhom);
    },

    showRankAndMoneyExchange: function(moneyExchange, action, isU, isUDen) {
        this.clearCountDown();
        this.clearEffects();

        this.showMoneyExchange(moneyExchange);
        if (isUDen) {
            this.addEffect(PhomConstant.Effect.DEN_U);
        }
        else if (isU) {
            this.setEffect(PhomConstant.Effect.U);
        }
        else {
            switch (action) {
            case PhomConstant.Finish.VE_NHI:
                this.addEffect(PhomConstant.Effect.NHI);
                break;
            case PhomConstant.Finish.VE_BA:
                this.addEffect(PhomConstant.Effect.BA);
                break;
            case PhomConstant.Finish.VE_BET:
                this.addEffect(PhomConstant.Effect.BET);
                break;
            case PhomConstant.Finish.MOM:
                this.addEffect(PhomConstant.Effect.MOM);
                break;
            case PhomConstant.Finish.VE_NHAT:
                this.addEffect(PhomConstant.Effect.NHAT);
                break;
            case PhomConstant.Finish.U:
                this.addEffect(PhomConstant.Effect.BET);
                break;
            }
        }

    },

    findAndDeleteCard: function(cardId, node) {
        if (node) {
            var childs = node.children;
            for (var i = 0; i < childs.length; i += 1) {
                var cardUIPhom = childs[i].getComponent('CardUIPhom');
                if (cardUIPhom) {
                    if (cardUIPhom.card && cardUIPhom.card.getId() === cardId) {
                        cardUIPhom.node.destroy();
                        return true;
                    }
                }
            }
        }
        return false;
    },

    onXepLaiBai: function() {
        var self = this;
        this.cardUIPhomList = [];
        this.myCards = this.getMyCards();
        var orderedCards = PhomUtils.ArrangeCardsOptimize(this.myCards, this._isSanhFirst);

        var layout = this.cardHold.getComponent(cc.Layout);
        layout.enabled = false;
        var spacingX = this.cardHold.getComponent(cc.Layout).spacingX;
        for (var i = 0; i < orderedCards.length; i += 1) {
            for (var j = 0; j < this.cardUIPhomList.length; j += 1) {
                if (orderedCards[i].getId() === this.cardUIPhomList[j].card.getId()) {
                    var width = this.cardUIPhomList[j].node.width;
                    var x = width / 2;
                    this.cardUIPhomList[j].node.runAction(cc.sequence(
                        cc.moveTo(self.TIME_MOVE_CARD, cc.p(x + i * (spacingX + width), self.cardUIPhomList[j].node.y)),
                        cc.callFunc(function() {
                            layout.enabled = true;
                        })));
                    this.cardUIPhomList[j].node.setSiblingIndex(i);
                }
            }
        }
    },

    getMyCards: function() {
        var result = [];
        var child = this.cardHold.children;
        for (var i = 0; i < child.length; i += 1) {
            var cardUIPhom = child[i].getComponent('CardUIPhom');
            var check = false;
            if (cardUIPhom) {
                for (var j = 0; j < this.player.data.cards.length; j += 1) {
                    if (cardUIPhom.card.getId() === this.player.data.cards[j]) {
                        check = true;
                        break;
                    }
                }
                if (check) {
                    result.push(cardUIPhom.card);
                    this.cardUIPhomList.push(cardUIPhom);
                }
                else {
                    cardUIPhom.node.destroy();
                }
            }
        }
        return result;
    },

    checkRefCard: function(cardId) {
        for (var i = 0; i < this.player.data.cards.length; i += 1) {
            if (cardId !== this.player.data.cards[i]) {
                var a1 = Math.floor(cardId / 4),
                    a2 = Math.floor(this.player.data.cards[i] / 4),
                    b1 = cardId % 4,
                    b2 = this.player.data.cards[i] % 4;
                if (a1 === a2 || (b1 === b2 && (Math.abs(a1 - a2) === 1 || Math.abs(a1 - a2) === 2))) {
                    return true;
                }
            }
        }
        return false;
    },

    khoangCach2Diem: function(p1, p2) {
        return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
    }
});
