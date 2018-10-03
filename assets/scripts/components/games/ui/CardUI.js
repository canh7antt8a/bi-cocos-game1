var CardRank = require('CardRank'),
    CardSuit = require('CardSuit');

cc.Class({
    extends: cc.Component,

    properties: {
        foldNode: cc.Node,
        unfoldNode: cc.Node,
        transparentBlackNode: cc.Node,
        // anchors
        rankLabel: cc.Label,
        smallSuitImageSprite: cc.Sprite,
        bigSuitImageSprite: cc.Sprite,
        bigFaceImageSprite: cc.Sprite,

        redColor: cc.Color,
        blackColor: cc.Color,
        smallSuiteSpriteFrames: {
            'default': [],
            type: cc.SpriteFrame
        },
        bigSuiteSpriteFrames: {
            'default': [],
            type: cc.SpriteFrame
        },
        redFaceSpriteFrames: {
            'default': [],
            type: cc.SpriteFrame
        },
        blackFaceSpriteFrames: {
            'default': [],
            type: cc.SpriteFrame
        },
    },

    // use this for initialization
    onLoad: function () {

    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    setCard: function (card) {
        this.card = card;
        if (card) {
            var rank = card.rank,
                suit = card.suit,
                isRedCard = this._isRedCard(card);

            this.foldNode.active = false;
            this.unfoldNode.active = true;

            this.rankLabel.string = rank.NAME;
            this.rankLabel.node.color = isRedCard ? this.redColor : this.blackColor;

            // var rankLabelOutline = this.rankLabel.node.addComponent(cc.LabelOutline);
            // rankLabelOutline.color = isRedCard ? this.redColor : this.blackColor;

            this.smallSuitImageSprite.spriteFrame = this.smallSuiteSpriteFrames[suit.ID];
            if (this._isFaceCard(card)) {
                this.bigSuitImageSprite.node.active = false;
                this.bigFaceImageSprite.node.active = true;
                this.bigFaceImageSprite.spriteFrame =
                    (isRedCard ? this.redFaceSpriteFrames : this.blackFaceSpriteFrames)[rank.ID - CardRank.JACK.ID];
            } else {
                this.bigFaceImageSprite.node.active = false;
                this.bigSuitImageSprite.node.active = true;
                this.bigSuitImageSprite.spriteFrame = this.bigSuiteSpriteFrames[suit.ID];
            }
        } else {
            this.fold();
        }
    },

    fold: function () {
        this.card = null;
        this.foldNode.active = true;
        this.unfoldNode.active = false;
    },

    showTransparentBlackNode: function (isShow) {
        if (this.transparentBlackNode) {
            this.transparentBlackNode.active = isShow;
        }
    },

    _isFaceCard: function (card) {
        var rank = card.rank;
        return rank === CardRank.JACK || rank === CardRank.QUEEN || rank === CardRank.KING;
    },

    _isRedCard: function (card) {
        var suit = card.suit;
        return suit === CardSuit.DIAMOND || suit === CardSuit.HEART;
    },

    getCard: function () {
        return this.card;
    },

    getCardId: function () {

        return this.card ? this.card.getId() : -1;
    }

});
