var CardUI = require('CardUI'),
    Card = require('Card'),
    CardRank = require('CardRank'),
    CardSuit = require('CardSuit');

cc.Class({
    extends: cc.Component,

    properties: {
        index: 0,
        cardPrefab: {
            default: null,
            type: cc.Prefab
        },
        cardFinish: {
            default: [],
            type: cc.Node
        }
    },

    onLoad: function () {
        this.isReady = false;
        this.count = 12;
        this.cardTemp = [];
        this.cardFirst = 0;
        this.node.y = -94;
        this.isUpdateCardFinish = false;
        this._initFirstCard();
    },

    start: function () {
        this._initDefaultCard();
    },

    _initFirstCard: function () {
        this.node.removeAllChildren();
        var rd1 = this.randomFromTo(0, 11);
        var rd2 = this.randomFromTo(0, 3);
        var card = new Card(CardRank.findById(rd1), CardSuit.findById(rd2));
        this._insertCard(card, false, false);
    },

    _initDefaultCard: function () {
        this.node.runAction(cc.sequence(cc.delayTime(0.5), cc.callFunc(function () {
            for (var i = 0; i < this.count; i += 1) {
                var rd1 = this.randomFromTo(0, 11);
                var rd2 = this.randomFromTo(0, 3);
                if (i === this.count - 1) {
                    rd1 = this.index * 2;
                }
                var card = new Card(CardRank.findById(rd1), CardSuit.findById(rd2));
                this._insertCard(card, i === this.count - 1, i === 0);
            }
            this.isReady = true;
        }.bind(this))));
    },

    _insertCard: function (card, isFinishCard, isFirstCard) {
        var node = cc.instantiate(this.cardPrefab);
        node.scale = 0.73;
        //node.setContentSize(cc.v2(94, 123));
        node.position = cc.v2(0, 0);
        var cardUI = node.getComponent(CardUI);
        cardUI.setCard(card);
        this.node.addChild(node);
        if (isFinishCard) {
            // node.setSiblingIndex(0);
            this.cardFinish.push(node);
        }
        if (isFirstCard) {
            this.cardFirst = node;
        }
    },

    updateCardFirst: function () {
        if (this.cardFirst && this.cardFinish.length > 0 && this.isUpdateCardFinish) {
            var cardUI = this.cardFinish[this.cardFinish.length - 1].getComponent(CardUI);
            this.cardFirst.getComponent(CardUI).setCard(cardUI.card);
        }
    },

    updateCardFinish: function (card) {
        for (var i = 0; i < this.cardFinish.length; i += 1) {
            var cardUI = this.cardFinish[i].getComponent(CardUI);
            cardUI.setCard(card);
            // cc.log(card.toString());
        }
        this.isUpdateCardFinish = true;
    },

    randomFromTo: function (from, to) {
        return Math.floor(Math.random() * (to - from + 1));
    }
});
