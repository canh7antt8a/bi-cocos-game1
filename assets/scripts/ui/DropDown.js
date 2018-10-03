cc.Class({
    extends: cc.Component,

    properties: {
        itemFontSize: 20,
        itemLineHeight: 60,
        selectEvents: {
            default: [],
            type: cc.Component.EventHandler,
        }
    },

    // use this for initialization
    onLoad: function () {
        var that = this;
        this.itemContainer = this.node.getChildByName('ContentDrop');
        this.itemContainer.active = false;
        // this.itemContainer.removeAllChildren();

        this.node.on(cc.Node.EventType.TOUCH_START, function () {
            that.openDropDown();
        });
    },

    /**
     * Set item to dropdown
     * @param {Object | String}  item     if item is object, must be {value: ..., label: 'string'}
     * @param {Boolean} isDefault
     */
    addItem: function (item, isDefault) {
        var that = this,
            newItem = new cc.Node(),
            labelComponent = newItem.addComponent(cc.Label),
            itemContainer = this.node.getChildByName('ContentDrop'),
            itemLabel = item.label ? item.label : item;

        labelComponent.string = itemLabel;
        labelComponent.fontSize = this.itemFontSize;
        labelComponent.lineHeight = this.itemLineHeight;
        labelComponent.overflow = cc.Label.Overflow.SHRINK;
        labelComponent.verticalAlign = cc.Label.VerticalAlign.CENTER;
        labelComponent.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        newItem.width = itemContainer.width;
        newItem.height = this.itemLineHeight;

        if (isDefault) {
            this.getLabel().string = itemLabel;
            this.currentSelected = item;
        }
        newItem.on(cc.Node.EventType.TOUCH_START, function (event) {
            var label = that.getLabel();
            if (label.string === itemLabel) {
                return;
            }
            that.getLabel().string = itemLabel;
            that.currentSelected = item;
            that.selectEvents.forEach(function (selectEvent) {
                selectEvent.emit([item]);
            });
            event.bubbles = false;
        });
        itemContainer.addChild(newItem);
    },

    clearAllItems: function () {
        this.node.getChildByName('ContentDrop').removeAllChildren();
        this.getLabel().string = '';
    },

    closeDropdown: function () {
        var itemContainer = this.itemContainer;
        if (itemContainer.active) {
            itemContainer.runAction(cc.sequence([cc.scaleTo(0.1, 1, 0),
                cc.callFunc(function () {
                    itemContainer.active = false;
                })
            ]));
        }
    },

    openDropDown: function () {
        var that = this,
            mouseListener,
            itemContainer = this.itemContainer;
        if (!itemContainer.active) {
            itemContainer.active = true;
            itemContainer.runAction(cc.scaleTo(0.1, 1, 1));
            mouseListener = cc.EventListener.create({
                event: cc.EventListener.TOUCH_ONE_BY_ONE,
                onTouchBegan: function () {
                    cc.eventManager.removeListener(mouseListener);
                    that.closeDropdown();
                }
            });
            setTimeout(function () {
                // set timeout to cocos doesn't trigger 'mouseListener' immediately
                cc.eventManager.addListener(mouseListener, -9e9);
            });
        }
    },

    getSelectedItem: function () {
        return this.currentSelected;
    },

    getLabel: function () {
        return this.node.getChildByName('LblDrop').getComponent(cc.Label);
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
