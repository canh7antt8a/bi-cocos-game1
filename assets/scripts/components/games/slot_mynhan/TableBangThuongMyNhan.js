var ItemMyNhan = require('ItemMyNhan');

cc.Class({
    extends: cc.Component,

    properties: {
        greenLayoutText: {
            default: [],
            type: cc.Node
        },
        whiteLayoutText: {
            default: [],
            type: cc.Node
        },
        itemMyNhanList: {
            default: [],
            type: ItemMyNhan
        }
    },

    onExitClick: function () {
        this.node.active = false;
    },

    setData: function (awards, gameType) {
        for (var i = 0; i < awards.length; i += 1) {
            var award = awards[i].awards;
            for (var j = 0; j < award.length; j += 1) {
                var nodeGreen = this.greenLayoutText[i].getChildByName('' + (j + 1));
                var nodeWhite = this.whiteLayoutText[i].getChildByName('' + (j + 1));
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
        for (i = 0; i < this.itemMyNhanList.length; i += 1) {
            this.itemMyNhanList[i].setType(gameType, i);
        }
    },
});
