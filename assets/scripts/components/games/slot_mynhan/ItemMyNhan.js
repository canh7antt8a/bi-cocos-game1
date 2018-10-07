cc.Class({
    extends: cc.Component,

    properties: {
        hotGirlSpriteFrameList: {
            type: cc.SpriteFrame,
            default: []
        },
        hoaHauSpriteFrameList: {
            type: cc.SpriteFrame,
            default: []
        },
        rauSachSpriteFrameList: {
            type: cc.SpriteFrame,
            default: []
        }
    },

    onLoad: function () {},

    setType: function (type, id) {
        this.type = type;
        this.id = id;
        switch (type) {
        case -1: // Free
        case 0: // Rau Sach
            this.node.getComponentInChildren(cc.Sprite).spriteFrame = this.rauSachSpriteFrameList[id];
            break;
        case 1: // Hot Girl
            this.node.getComponentInChildren(cc.Sprite).spriteFrame = this.hotGirlSpriteFrameList[id];
            break;
        case 2: // Hoa Hau
            this.node.getComponentInChildren(cc.Sprite).spriteFrame = this.hoaHauSpriteFrameList[id];
            break;
        }
    },
});
