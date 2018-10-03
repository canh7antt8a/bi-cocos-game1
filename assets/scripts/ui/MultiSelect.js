cc.Class({
    extends: cc.Component,

    properties: {
        maxSelect: 1,
        activeSprite: {
            default: null,
            type: cc.SpriteFrame,
        },
        normalSprite: {
            default: null,
            type: cc.SpriteFrame,
        },
        selectEvents: {
            default: [],
            type: cc.Component.EventHandler,
        }
    },

    // use this for initialization
    onLoad: function () {
        this.selectedItems = [];

        var item, i, that = this;

        function select(event) {
            that.selectItem(event.target);
        }
        for (i = 0; i < this.node.children.length; i += 1) {
            item = this.node.children[i];
            item.on(cc.Node.EventType.TOUCH_END, select, item);
        }
        this.node.on('child-added', function (event) {
            event.detail.on(cc.Node.EventType.TOUCH_END, select, event.detail);
        });
    },

    selectItem: function (item) {
        var removeItem,
            selectedItems = this.selectedItems,
            index = selectedItems.indexOf(item);
        if (item.parent === this.node) {
            if (index < 0) {
                if (selectedItems.length >= this.maxSelect) {
                    removeItem = selectedItems.shift(); // pop first
                    this.onUnselect(removeItem);
                }
                selectedItems.push(item);
                this.onSelect(item);
            }
            else {
                selectedItems.splice(index, 1);
                this.onUnselect(item);
            }
            this.selectEvents.forEach(function (selectEvent) {
                selectEvent.emit([selectedItems]);
            });
        }
    },

    onSelect: function (item) {
        if (this.activeSprite) {
            item.getComponent(cc.Sprite).spriteFrame = this.activeSprite;
        }
        else {
            item.stopAllActions();
            item.runAction(cc.scaleTo(0.1, 1.25));
        }
    },

    onUnselect: function (item) {
        if (this.normalSprite) {
            item.getComponent(cc.Sprite).spriteFrame = this.normalSprite;
        }
        else {
            item.stopAllActions();
            item.runAction(cc.scaleTo(0.1, 1));
        }
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
