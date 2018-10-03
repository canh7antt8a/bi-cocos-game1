var Utils = require('Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        itemMyNhanPrefab: cc.Prefab
    },

    onLoad: function () {
        if (this.type === undefined || this.type === -1) {
            this.type = 0;
        }
        this.itemList = [];
        this.node.removeAllChildren();
        for (var i = 0; i < 25; i += 1) {
            var item = cc.instantiate(this.itemMyNhanPrefab);
            var id = Utils.Number.random(0, 6);
            item.getComponent('ItemMyNhan').setType(this.type, id);
            this.node.addChild(item);
            this.itemList.push(item.getComponent('ItemMyNhan'));
        }
    },
});
