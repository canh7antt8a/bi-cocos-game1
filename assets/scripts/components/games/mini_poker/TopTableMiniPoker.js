var Utils = require('Utils'),
    Url = require('Url'),
    NetworkManager = require('NetworkManager');

cc.Class({
    extends: cc.Component,

    properties: {
        itemPrefab: {
            default: null,
            type: cc.Prefab
        },
        contentItem: {
            default: null,
            type: cc.Node
        },
    },

    onLoad: function () {
        // Get Top User
        var self = this;
        NetworkManager.Http.fetch('GET', Url.Http.MINI_POKER_GET_TOP, {}, {
            cache: 900,
            delay: 500
        }).success(function (results) {
            if (results) {
                if (!self.isValid) {
                    return;
                }
                self.contentItem.removeAllChildren();
                for (var i = 0; i < results.data.length; i += 1) {
                    var historyData = results.data[i];
                    var itemNode = cc.instantiate(self.itemPrefab);
                    itemNode.getChildByName('1').getComponent(cc.Label).string = historyData.created_time;
                    itemNode.getChildByName('2').getComponent(cc.Label).string = historyData.username;
                    itemNode.getChildByName('3').getComponent(cc.Label).string = Utils.Number.format(historyData.bet);
                    itemNode.getChildByName('4').getComponent(cc.Label).string = Utils.Number.format(historyData.win_amount);
                    itemNode.getChildByName('5').getComponent(cc.Label).string = historyData.win_type;
                    itemNode.enabled = true;
                    self.contentItem.addChild(itemNode);
                }
            }
        });
    }
});
