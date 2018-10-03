// var CardUI = require('CardUI'),
//     Card = require('Card'),
//     CardRank = require('CardRank'),
//     CardSuit = require('CardSuit');

cc.Class({
    extends: cc.Component,

    properties: {
        index: 0,
        itemPrefab: {
            default: null,
            type: cc.Prefab
        },
        itemFinish: {
            default: [],
            type: cc.Node
        },
        itemSprite: {
            default: [],
            type: cc.SpriteFrame
        },
    },

    onLoad: function () {
        this.isReady = false;
        this.count = 30;
        this.itemTemp = [];
        this.itemFirst = 0;
        this.node.y = -165;
        this.isUpdateItemFinish = false;
        this._initFirstItem();
    },

    start: function () {
        this._initDefaultItem();
    },

    _initFirstItem: function () {
        this.node.removeAllChildren();
        var rd1 = this.randomFromTo(0, 6);
        this._insertItem(rd1, false, false);
    },

    _initDefaultItem: function () {
        this.node.runAction(cc.sequence(cc.delayTime(0.5), cc.callFunc(function () {
            for (var i = 0; i < this.count; i += 1) {
                var rd1 = this.randomFromTo(0, 6);
                if (i === this.count - 1) {
                    rd1 = this.index * 2;
                }
                this._insertItem(rd1, i === this.count - 1, i === 0);
            }
            this.isReady = true;
        }.bind(this))));
    },

    _insertItem: function (index, isFinishItem, isFirst) {
        var node = cc.instantiate(this.itemPrefab);
        // node.scale = 0.73;
        //node.setContentSize(cc.v2(94, 123));
        node.position = cc.v2(0, 0);
        var sprite = node.getComponent(cc.Sprite);
        sprite.spriteFrame = this.itemSprite[index];
        this.node.addChild(node);
        if (isFinishItem) {
            // node.setSiblingIndex(0);
            this.itemFinish.push(node);
        }
        if (isFirst) {
            this.itemFirst = node;
        }
    },

    // updateItemFirst: function () {
    //     // if (this.itemFirst && this.itemFinish.length > 0 && this.isUpdateItemFinish) {
    //     //     var cardUI = this.itemFinish[this.itemFinish.length - 1].getComponent(CardUI);
    //     //     this.itemFirst.getComponent(CardUI).setCard(cardUI.card);
    //     // }
    // },

    // updateItemFinish: function (card) {
    //     // for (var i = 0; i < this.itemFinish.length; i += 1) {
    //     //     var cardUI = this.itemFinish[i].getComponent(CardUI);
    //     //     cardUI.setCard(card);
    //     //     // cc.log(card.toString());
    //     // }
    //     // this.isUpdateItemFinish = true;

    // },

    randomFromTo: function (from, to) {
        return Math.floor(Math.random() * (to - from + 1));
    }
});
