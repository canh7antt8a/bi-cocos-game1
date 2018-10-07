cc.Class({
    extends: cc.Component,

    properties: {
        items: {
            default: [],
            visible: false,
        },
        autoSlideTime: 5,
        selectEvents: {
            default: [],
            type: cc.Component.EventHandler,
        },
    },

    // use this for initialization
    onLoad: function () {
        var that = this;
        this.slideTime = 0;
        this.node.on(cc.Node.EventType.TOUCH_MOVE, function (event) {
            var pos = event.getLocation(),
                prevPos = event.getPreviousLocation();
            event.stopPropagation();
            that._slide(Math.sign(prevPos.x - pos.x));
        });
    },

    addItem: function (itemNode, isDefault) {
        var that = this,
            contentsNode = this.node.getChildByName('Contents');
        this.items.push(itemNode);
        itemNode.width = contentsNode.width;
        itemNode.height = contentsNode.height;
        if (isDefault) {
            this.currentItem = itemNode;
            itemNode.x = itemNode.y = 0;
            contentsNode.addChild(itemNode);
        }
        itemNode.on(cc.Node.EventType.TOUCH_END, function (event) {
            if (that.slideTime > 0.3) {
                that.selectEvents.forEach(function (selectEvent) {
                    selectEvent.emit([event.currentTarget]);
                });
            }
        }, itemNode);
    },

    clearAllTimes: function () {
        this.items = [];
        this.slideTime = 0;
        this.currentItem = null;
    },

    _slide: function (direction) {
        var hidePos,
            that = this,
            animateTime = 0.5,
            currentItem = this.currentItem,
            targetItem = this._getItem(direction),
            contentsNode = this.node.getChildByName('Contents');
        if (this.isSliding) {
            return;
        }
        if (currentItem && targetItem && currentItem !== targetItem) {
            that.slideTime = 0;
            that.isSliding = true;
            currentItem.stopAllActions();
            hidePos = cc.p(-Math.sign(direction) * (contentsNode.width + currentItem.width + 10) / 2, 0);
            currentItem.runAction(cc.sequence([
                cc.moveTo(animateTime, hidePos).easing(cc.easeOut(3.0)),
                cc.callFunc(function () {
                    currentItem.removeFromParent(false);
                })
            ]));
            setTimeout(function () {
                if (cc.isValid(targetItem)) {
                    targetItem.stopAllActions();
                    that.currentItem = targetItem;
                    contentsNode.addChild(targetItem);
                    targetItem.x = Math.sign(direction) * (contentsNode.width + targetItem.width + 10) / 2;
                    targetItem.y = 0;
                    targetItem.runAction(cc.sequence([
                        cc.moveTo(animateTime, cc.p(0, 0)).easing(cc.easeOut(3.0)),
                        cc.callFunc(function () {
                            that.isSliding = false;
                        })]));
                }
            }, animateTime / 2);
        }
    },

    _getItem: function (offset) {
        var currentIndex = this.items.indexOf(this.currentItem);
        if (currentIndex + offset >= this.items.length) {
            return this.items[0];
        }
        else if (currentIndex + offset < 0) {
            return this.items[this.items.length - 1];
        }
        else {
            return this.items[currentIndex + offset];
        }
    },

    nextSlide: function () {
        this._slide(1);
    },

    prevSlide: function () {
        this._slide(-1);
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        if (this.slideTime > this.autoSlideTime) {
            this.slideTime = 0;
            this.nextSlide();
        }
        else {
            this.slideTime += dt;
        }
    },
});
