var Card = require('Card'),
    CardUI = require('CardUI'),
    ChiMauBinh = require('ChiMauBinh'),
    MauBinhConstant = require('MauBinhConstant'),
    BaseGameManager = require('BaseGameManager');

cc.Class({
    extends: cc.Component,

    properties: {
        lblChiList: {
            default: [],
            type: cc.Label
        },
        cardNodeList: {
            default: [],
            type: cc.Node
        },
        frameCardNode: cc.Node,
        cardPrefab: cc.Prefab,
        imgTouchingCard: cc.Node,
        imgCollisionCard: cc.Node,
        imgBinhLung: cc.Node,
        imgThangTrang: cc.Node,
        gameManager: BaseGameManager,
    },

    setGameParam: function (gamePlay, gameManager) {
        this.gamePlay = gamePlay;
        this.gameManager = gameManager;
    },

    onLoad: function () {
        // Reset
        this._initFirstTime();

        // Touch Event
        var size = cc.winSize,
            maxX = size.width / 2 + 20,
            maxY = size.height / 2 + 20;

        var i, self = this;
        self.node.on(cc.Node.EventType.TOUCH_START, function (event) {
            if (self.gameManager.gameState !== MauBinhConstant.GameState.ORDER_CARDS || self.isFinish) {
                return;
            }
            self.resetCardPosition();
            var oldCardTouchIndex = self.cardTouchingIndex;
            var target = event.getCurrentTarget().parent;
            var locationInNode = target.convertToNodeSpace(event.getLocation()).sub(cc.v2(size.width / 2, size.height / 2));
            self.cardTouchingIndex = -1;
            for (i = 0; i < self.cardNodeList.length; i += 1) {
                if (self.cardNodeList[i].getBoundingBox().contains(locationInNode)) {
                    self.cardTouchingIndex = i;
                    self.cardTouchingPosition = self.cardPositionList[i];
                    self.deltaPosition = self.cardTouchingPosition.sub(locationInNode);
                    self.cardNodeList[i].zIndex = 1;
                    self.gamePlay.audioManager.playBaiChon();
                    break;
                }
                else {
                    self.cardNodeList[i].zIndex = 0;
                }
            }

            // Swap If Touch Card 2
            if (self.imgTouchingCard.active && self.cardTouchingIndex !== -1 && oldCardTouchIndex !== -1 && oldCardTouchIndex !== self.cardTouchingIndex) {
                var oldCardTouch = self.cardNodeList[oldCardTouchIndex];
                var newCardTouch = self.cardNodeList[self.cardTouchingIndex];
                var delta = oldCardTouch.position.sub(newCardTouch.position);
                var timeMove = self._distanceVec2(delta) / 2300;
                oldCardTouch.runAction(cc.moveTo(timeMove, self.cardPositionList[self.cardTouchingIndex]));
                newCardTouch.runAction(cc.moveTo(timeMove, self.cardPositionList[oldCardTouchIndex]));
                self._swapCard(self.cardTouchingIndex, oldCardTouchIndex);
                self.imgTouchingCard.active = false;
                self.imgTouchingCard.position = self.cardPositionList[self.cardTouchingIndex];
                self.cardTouchingIndex = -1;
                self._onSortCard();
            }
            else if (self.cardTouchingIndex !== -1) {
                // Show Card Touch Effect
                self.imgTouchingCard.active = true;
                self.imgTouchingCard.position = self.cardTouchingPosition;
            }
        });
        self.node.on(cc.Node.EventType.TOUCH_MOVE, function (event) {
            if (self.gameManager.gameState !== MauBinhConstant.GameState.ORDER_CARDS || self.isFinish) {
                return;
            }
            var target = event.getCurrentTarget().parent;
            var locationInNode = target.convertToNodeSpace(event.getLocation()).sub(cc.v2(size.width / 2, size.height / 2));
            if (self.cardTouchingIndex >= 0) {
                // Move Card Touching
                var cardTouchingNode = self.cardNodeList[self.cardTouchingIndex];
                cardTouchingNode.position = self.deltaPosition.add(locationInNode);
                var deltaPosX = Math.abs(cardTouchingNode.x - self.cardTouchingPosition.x);
                var deltaPosY = Math.abs(cardTouchingNode.y - self.cardTouchingPosition.y);
                if (deltaPosX >= 3 || deltaPosY >= 3) {
                    self.imgTouchingCard.active = false;
                }

                // Check Collision
                self.cardCollisionIndex = -1;
                self.imgCollisionCard.active = false;
                for (var i = 0; i < self.cardNodeList.length; i += 1) {
                    if (cardTouchingNode === self.cardNodeList[i]) {
                        continue;
                    }
                    if (self._isCollision(self.cardNodeList[i], cardTouchingNode)) {
                        self.cardCollisionIndex = i;
                        self.imgCollisionCard.active = true;
                        self.imgCollisionCard.position = self.cardNodeList[i].position;
                    }
                }

                // Check Card Move Out Sight
                var cardSizeWidth = cardTouchingNode.width * 0.72;
                var cardSizeHeight = cardTouchingNode.height * 0.72;
                if ((cardTouchingNode.x + cardSizeWidth / 2 >= maxX || cardTouchingNode.x - cardSizeWidth / 2 <= -maxX) ||
                    (cardTouchingNode.y + cardSizeHeight / 2 >= maxY || cardTouchingNode.y - cardSizeHeight / 2 <= -maxY)) {
                    cardTouchingNode.runAction(cc.moveTo(0.2, self.cardTouchingPosition));
                    self.cardTouchingIndex = -1;
                }
            }
        });
        self.node.on(cc.Node.EventType.TOUCH_END, function () {
            if (self.gameManager.gameState !== MauBinhConstant.GameState.ORDER_CARDS || self.isFinish) {
                return;
            }
            if (self.cardTouchingIndex >= 0) {
                // Swap Card
                var delta = self.cardNodeList[self.cardTouchingIndex].position.sub(self.cardTouchingPosition);
                var timeMove = self._distanceVec2(delta) / 3000;
                if (self.cardCollisionIndex >= 0) {
                    // Move
                    self.cardNodeList[self.cardCollisionIndex].zIndex = 1;
                    var collisionPosition = self.cardNodeList[self.cardCollisionIndex].position;
                    self.cardNodeList[self.cardTouchingIndex].runAction(cc.moveTo(0.1, collisionPosition));
                    self.cardNodeList[self.cardCollisionIndex].runAction(cc.moveTo(timeMove, self.cardTouchingPosition));

                    // Swap Card
                    var cardTmp = self.cardNodeList[self.cardTouchingIndex];
                    self.cardNodeList[self.cardTouchingIndex] = self.cardNodeList[self.cardCollisionIndex];
                    self.cardNodeList[self.cardCollisionIndex] = cardTmp;
                    self._onSortCard();
                    self.gamePlay.audioManager.playBaiBay();
                }
                else {
                    self.cardNodeList[self.cardTouchingIndex].runAction(cc.moveTo(timeMove, self.cardTouchingPosition));
                }

                // Reset ZIndex
                self.cardNodeList[self.cardTouchingIndex].zIndex = 0;
                self.imgCollisionCard.active = false;
            }
            for (var j = 0; j < self.cardNodeList.length; j += 1) {
                self.cardNodeList[j].opacity = 255;
            }

            // Reset Collision Card
            self.cardCollisionIndex = -1;

            // Reset Card Touch If Move
            if (!self.imgTouchingCard.active) {
                self.cardTouchingIndex = -1;
            }
        });
    },

    setCards: function (cards) {
        // Reset
        this._initFirstTime();

        for (var i = 0; i < cards.length; i += 1) {
            // Card Info
            this.cardNodeList[i].getComponent(CardUI).setCard(Card.fromId(cards[i]));

            // Effect
            var cardNode = this.cardNodeList[i],
                foldNode = cardNode.getChildByName('Fold'),
                scale = 0.72;
            foldNode.active = true;
            cardNode.runAction(cc.sequence(cc.delayTime(0.02 * i), cc.scaleTo(0.05, 0, scale), cc.callFunc(function () {
                this.getChildByName('Fold').active = false;
            }.bind(cardNode)), cc.scaleTo(0.15, scale, scale)));
        }
        this._calculateChi();
    },

    getCards: function () {
        var cards = [];
        for (var i = 0; i < this.cardNodeList.length; i += 1) {
            cards.push(this.cardNodeList[i].getComponent(CardUI).getCardId());
        }
        return cards;
    },

    reset: function () {
        // Init First Time
        this._initFirstTime();

        // Stop All Action
        for (var i = 0; i < this.cardNodeList.length; i += 1) {
            this.cardNodeList[i].stopAllActions();
        }

        // Reset
        this.isFinish = false;
        this.node.active = false;
        this.imgCollisionCard.active = false;
        this.imgTouchingCard.active = false;
        this.imgBinhLung.active = false;
        this.imgThangTrang.active = false;
        this.resetCardPosition();
    },

    resetCardPosition: function () {
        for (var i = 0; i < this.cardNodeList.length; i += 1) {
            this.cardNodeList[i].opacity = 255;
            this.cardNodeList[i].position = this.cardPositionList[i];
        }
    },

    setFinishOrder: function () {
        // Reset
        this._initFirstTime();

        this.isFinish = true;
        this.node.active = false;
        this.reset();
    },

    swapChi: function () {
        if (this.swapping) {
            return;
        }
        this.swapping = true;
        var i;
        for (i = 0; i < 5; i += 1) {
            this.cardNodeList[i].runAction(cc.moveTo(0.3, this.cardPositionList[i + 5]));
        }
        for (i = 5; i < 10; i += 1) {
            this.cardNodeList[i].runAction(cc.sequence(cc.moveTo(0.3, this.cardPositionList[i - 5]), cc.callFunc(function () {
                this._onSortCard();
                this.swapping = false;
            }.bind(this))));
        }
        for (i = 0; i < 5; i += 1) {
            this._swapCard(i, i + 5);
        }
    },

    _swapCard: function (i, j) {
        var tmp = this.cardNodeList[i];
        this.cardNodeList[i] = this.cardNodeList[j];
        this.cardNodeList[j] = tmp;
    },

    _isCollision: function (cardNode1, cardNode2) {
        var dx = Math.abs(cardNode1.position.x - cardNode2.position.x);
        var dy = Math.abs(cardNode1.position.y - cardNode2.position.y);
        if (cardNode1.getBoundingBox().intersects(cardNode2.getBoundingBox()) && dx <= 60 && dy <= 80) {
            return true;
        }
        else {
            return false;
        }
    },

    _calculateChi: function () {
        var i;
        var chiMauBinh = new ChiMauBinh(this.getCards());
        var result = chiMauBinh.getResult();
        // cc.log(result[0].NAME + ' - ' + result[1].NAME + ' - ' + result[2].NAME);
        this.imgBinhLung.active = chiMauBinh.isBinhLung();
        this.imgThangTrang.active = chiMauBinh.isThangTrang();
        this.imgThangTrang.getComponentInChildren(cc.Label).string = result[0].NAME;
        for (i = 0; i < this.lblChiList.length; i += 1) {
            this.lblChiList[i].string = result[i].NAME;
            this.lblChiList[i].node.active = !chiMauBinh.isThangTrang();
        }

        // Lam Toi Mau Quan Bai Khong Co Ca
        for (i = 0; i < this.cardNodeList.length; i += 1) {
            var isInChi = false;
            var cardId = this.cardNodeList[i].getComponent('CardUI').card.getId();
            isInChi = this._isCardInChi(cardId, chiMauBinh.cardsInChi);

            // Tang Chi At
            if (!isInChi && cardId < 4) {
                cardId += 52;
                isInChi = this._isCardInChi(cardId, chiMauBinh.cardsInChi);
            }
            this.cardNodeList[i].getComponent(CardUI).showTransparentBlackNode(!isInChi);
        }
    },

    _isCardInChi: function (cardId, cardsInChi) {
        for (var j = 0; j < 3; j += 1) {
            for (var k = 0; k < cardsInChi[j].length; k += 1) {
                if (cardId === cardsInChi[j][k]) {
                    return true;
                }
            }
        }
        return false;
    },

    _onSortCard: function () {
        this.gameManager.sendRequestOrderCard(this.getCards(), false);
        this._calculateChi();
    },

    _distanceVec2: function (vec2) {
        return Math.sqrt(vec2.x * vec2.x + vec2.y * vec2.y);
    },

    _initFirstTime: function () {
        if (this.isInitFirstTime) {
            return;
        }
        this.isInitFirstTime = true;
        this.isFinish = false;
        this.deltaPosition = cc.v2();
        this.cardTouchingIndex = -1;
        this.cardCollisionIndex = -1;
        this.cardTouchingPosition = cc.v2();
        this.cardPositionList = [];
        this.imgTouchingCard.active = false;
        this.imgCollisionCard.active = false;
        this.imgBinhLung.active = false;
        this.imgThangTrang.active = false;

        // Get Position Card List
        var i;
        var length = this.cardNodeList.length;
        for (i = 0; i < length; i += 1) {
            this.cardPositionList.push(this.cardNodeList[i].position);
        }

        // Remove All Card
        this.frameCardNode.removeAllChildren();

        // Re Add Child
        for (i = 0; i < length; i += 1) {
            var node = cc.instantiate(this.cardPrefab);
            node.position = this.cardPositionList[i];
            node.scale = 0.72;
            this.frameCardNode.addChild(node);
            var cardUI = node.getComponent(CardUI);
            cardUI.foldNode.active = false;
            cardUI.unfoldNode.active = true;
            this.cardNodeList[i] = node;
        }

    }
});
