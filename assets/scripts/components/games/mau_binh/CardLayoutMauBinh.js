var Utils = require('Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        imgThuaSapHam: cc.Node,
        imgThangTrang: cc.Node,
        lblThangTrang: cc.Label,
        layoutCard: cc.Node,
        cardPrefab: cc.Prefab,
        layoutCardList: {
            default: [],
            type: cc.Node
        },
    },

    onLoad: function () {
        this._initFirstTime();
    },

    createEffectSwapCard: function () {
        var self = this;
        var randomChi1 = Utils.Number.random(0, 2);
        var randomChi2 = Utils.Number.random(0, 2);
        var randomCard1 = Utils.Number.random(0, (randomChi1 === 2 ? 2 : 4));
        var randomCard2 = Utils.Number.random(0, (randomChi2 === 2 ? 2 : 4));
        if (randomChi1 === randomChi2 && randomCard1 === randomCard2) {
            return;
        }
        var cardLayoutChi1 = this.layoutCardList[randomChi1];
        var cardLayoutChi2 = this.layoutCardList[randomChi2];
        cardLayoutChi1.getComponent(cc.Layout).enabled = false;
        cardLayoutChi2.getComponent(cc.Layout).enabled = false;
        cardLayoutChi1.parent.getComponent(cc.Layout).enabled = false;
        var cardNode1 = cardLayoutChi1.children[randomCard1];
        var cardNode2 = cardLayoutChi2.children[randomCard2];
        var pos1 = cardNode1.position;
        var pos2 = cardNode2.position;
        if (cardNode1 && cardNode2) {
            cardNode1.zIndex = 50;
            cardNode2.zIndex = 50;
            var pos1Change = cardNode1.parent.convertToWorldSpace(pos1);
            var pos2Change = cardNode2.parent.convertToWorldSpace(pos2);
            cardNode1.runAction(cc.moveTo(0.4, cardNode1.parent.convertToNodeSpace(pos2Change)));
            cardNode2.runAction(cc.sequence(cc.moveTo(0.4, cardNode2.parent.convertToNodeSpace(pos1Change)), cc.callFunc(function () {
                self.resetPosition();
            })));
        }
        else {
            // cc.log('ERROR');
        }
    },

    resetPosition: function () {
        this._initFirstTime();
        this.layoutCard.getComponent(cc.Layout).enabled = true;
        var index = 0;
        for (var i = 0; i < this.layoutCardList.length; i += 1) {
            var layoutCard = this.layoutCardList[i];
            layoutCard.getComponent(cc.Layout).enabled = true;
            for (var j = 0; j < layoutCard.children.length; j += 1) {
                var nodeCard = layoutCard.children[j];
                nodeCard.stopAllActions();
                nodeCard.position = this.cardPositionList2[index];
                nodeCard.zIndex = j;
                index += 1;
            }
        }
    },

    reset: function () {
        this.showBinhLung(false);
        this.showAllLayout();
        this.resetPosition();
        this.foldAllCard();
        this.layoutCard.active = false;
        this.imgThuaSapHam.active = false;
        this.imgThangTrang.active = false;
    },

    foldAllCard: function () {
        for (var j = 0; j < this.layoutCardList.length; j += 1) {
            var cardUIList = this.layoutCardList[j].getComponentsInChildren('CardUI');
            for (var i = 0; i < cardUIList.length; i += 1) {
                cardUIList[i].node.stopAllActions();
                cardUIList[i].node.scale = 1;
                cardUIList[i].fold();
            }
        }
    },

    showAllLayout: function () {
        this.layoutCard.active = true;
        this.resetPosition();
        for (var i = 0; i < this.layoutCardList.length; i += 1) {
            this.layoutCardList[i].active = true;
        }
    },

    showBinhLung: function (isBinhLung) {
        this._initFirstTime();
        for (var i = 0; i < this.layoutCardList.length; i += 1) {
            var layoutCard = this.layoutCardList[i];
            for (var j = 0; j < layoutCard.children.length; j += 1) {
                var nodeCard = layoutCard.children[j];
                nodeCard.getComponent('CardUI').showTransparentBlackNode(isBinhLung);
            }
        }
    },

    getCardPositionList: function () {
        var i, j;
        var layoutCard;
        this.cardPositionList = [];
        for (i = 0; i < this.layoutCardList.length; i += 1) {
            layoutCard = this.layoutCardList[i];
            for (j = 0; j < layoutCard.children.length; j += 1) {
                var nodeCard = layoutCard.children[j];
                var pos1 = nodeCard.parent.convertToWorldSpaceAR(nodeCard.position);
                this.cardPositionList.push(pos1);
            }
        }
        return this.cardPositionList;
    },

    _initFirstTime: function () {
        // Check
        if (this.isInitFirstTime) {
            return;
        }
        this.isInitFirstTime = true;

        // Reset Position Chi 3
        if (this.node.parent.x > 0) {
            this.layoutCardList[2].x = 90;
            this.node.x = -208;
            this.imgThangTrang.x = 13;
        }
        else {
            this.node.x = 228;
            this.layoutCardList[2].x = 3;
            this.imgThangTrang.x = -51;
        }

        // Get Position Card
        var i, j, index = 0;
        var layoutCard;
        // this.cardPositionList = [];
        this.cardPositionList2 = [];
        for (i = 0; i < this.layoutCardList.length; i += 1) {
            layoutCard = this.layoutCardList[i];
            for (j = 0; j < layoutCard.children.length; j += 1) {
                var nodeCard = layoutCard.children[j];
                this.cardPositionList2.push(nodeCard.position);
            }
        }

        // Remove All Card
        for (i = 0; i < this.layoutCardList.length; i += 1) {
            layoutCard = this.layoutCardList[i];
            layoutCard.removeAllChildren();
        }

        // Re Add Child
        for (i = 0; i < this.layoutCardList.length; i += 1) {
            layoutCard = this.layoutCardList[i];
            var cardCount = i === 2 ? 3 : 5;
            for (j = 0; j < cardCount; j += 1) {
                var cardInstance = cc.instantiate(this.cardPrefab);
                cardInstance.setAnchorPoint(0.5, 0.5);
                cardInstance.position = this.cardPositionList2[i];
                layoutCard.addChild(cardInstance);
                index += 1;
            }
        }

        // Reset
        this.reset();
    }
});
