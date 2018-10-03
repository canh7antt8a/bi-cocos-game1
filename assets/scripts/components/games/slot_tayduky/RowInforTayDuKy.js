cc.Class({
    extends: cc.Component,

    properties: {
        itemPrefab: cc.Prefab,
        itemSprite: {
            default: [],
            type: cc.SpriteFrame
        },
        count: 30,
    },

    // use this for initialization
    onLoad: function () {
        this.initDefaultItem();
        this.itemTemp = [];
        this.itemHeight = this.node.children[0].height;
        this.spacingY = this.node.getComponent(cc.Layout).spacingY;
    },

    initDefaultItem: function () {
        var index = 0;
        for (var i = 0; i < this.count; i += 1) {
            if (index === 7) {
                index = 0;
            }
            var item = cc.instantiate(this.itemPrefab);
            item.getComponent(cc.Sprite).spriteFrame = this.itemSprite[index];
            this.node.addChild(item);
            index += 1;
        }
    },

    initItemFinish: function (chips, index) {
        var i = 0,
            k = 0,
            j = this.node.children.length - 1;
        if (this.itemTemp.length > 0) {
            for (i = 0; i < chips.length; i += 1) {
                switch (i) {
                    case 0:
                    case 3:
                    case 6:
                        if (index === 2) {
                            this.node.children[j].getComponent(cc.Sprite).spriteFrame = this.itemTemp[k].getComponent(cc.Sprite).spriteFrame;
                            this.itemTemp[k].getComponent(cc.Sprite).spriteFrame = this.itemSprite[chips[i] - 1];
                            k += 1;
                            j -= 1;
                        }
                        break;
                    case 1:
                    case 4:
                    case 7:
                        if (index === 1) {
                            this.node.children[j].getComponent(cc.Sprite).spriteFrame = this.itemTemp[k].getComponent(cc.Sprite).spriteFrame;
                            this.itemTemp[k].getComponent(cc.Sprite).spriteFrame = this.itemSprite[chips[i] - 1];
                            k += 1;
                            j -= 1;
                        }
                        break;
                    case 2:
                    case 5:
                    case 8:
                        if (index === 0) {
                            this.node.children[j].getComponent(cc.Sprite).spriteFrame = this.itemTemp[k].getComponent(cc.Sprite).spriteFrame;
                            this.itemTemp[k].getComponent(cc.Sprite).spriteFrame = this.itemSprite[chips[i] - 1];
                            k += 1;
                            j -= 1;
                        }
                        break;
                }

            }
        }
        else {
            for (i = 0; i < chips.length; i += 1) {
                switch (i) {
                    case 0:
                    case 3:
                    case 6:
                        if (index === 2) {
                            this.initItem(chips[i] - 1);
                        }
                        break;
                    case 1:
                    case 4:
                    case 7:
                        if (index === 1) {
                            this.initItem(chips[i] - 1);
                        }
                        break;
                    case 2:
                    case 5:
                    case 8:
                        if (index === 0) {
                            this.initItem(chips[i] - 1);
                        }
                        break;
                }
            }

        }
    },

    initItem: function (itemIndex) {
        var item = cc.instantiate(this.itemPrefab);
        item.getComponent(cc.Sprite).spriteFrame = this.itemSprite[itemIndex];
        this.node.addChild(item);
        item.setSiblingIndex(0);
        this.itemTemp.push(item);

    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
