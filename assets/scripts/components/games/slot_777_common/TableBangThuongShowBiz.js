var ItemMyNhan = require('ItemMyNhan');

cc.Class({
    extends: cc.Component,

    properties: {
        textLayoutGreen: cc.Node,
        textLayoutWhite: cc.Node,
        itemNode: cc.Node,
        itemPrefab: cc.Prefab
    },

    onExitClick: function () {
        this.node.active = false;
    },

    setData: function (awards, gameType) {
        for (var i = 0; i < awards.length; i += 1) {
            var award = awards[i].awards;
            for (var j = 0; j < award.length; j += 1) {
                var nodeGreen = this.textLayoutGreen.getChildByName('' + (i + 1)).getChildByName('' + (j + 1));
                var nodeWhite = this.textLayoutWhite.getChildByName('' + (i + 1)).getChildByName('' + (j + 1));
                if (nodeWhite !== undefined && nodeWhite !== undefined) {
                    nodeGreen.getComponent(cc.Label).string = award[j].number;
                    nodeWhite.getComponent(cc.Label).string = ' x ' + award[j].ratio;
                    if (award[j].awardType === 'jar') {
                        nodeWhite.getComponent(cc.Label).string = ' x ' + award[j].ratio + '% Hũ';
                    }
                    if (award[j].awardType === 'lucky_coffer') {
                        nodeWhite.getComponent(cc.Label).string = ' x ' + award[j].ratio + ' Hộp quà';
                    }
                    if (award[j].awardType === 'free_turn') {
                        nodeWhite.getComponent(cc.Label).string = ' x ' + award[j].ratio + ' Lượt quay';
                    }
                }
            }
        }
        for (i = 0; i < awards.length; i += 1) {
            var parentNode = this.itemNode.getChildByName('' + (i + 1));
            var node = cc.instantiate(this.itemPrefab);
            node.getComponent(ItemMyNhan).setType(gameType, awards.length - 1 - i);
            node.x = 0;
            node.y = 0;
            parentNode.addChild(node);
        }
    },
});
