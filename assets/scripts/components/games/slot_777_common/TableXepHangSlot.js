var Url = require('Url'),
    NetworkManager = require('NetworkManager'),
    Utils = require('Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        historyItemTemplateNode: cc.Node,
        historyListNode: cc.Node,
        historyListScrollView: cc.ScrollView,
        images: {
            default: [],
            type: cc.Sprite,
        },
        imageColor: cc.Color,
        maxRows: 10
    },

    onLoad: function () {
        this.historyListScrollView.node.active = false;
        this.historyListNode.runAction(cc.sequence(cc.delayTime(0.3), cc.callFunc(function () {
            this.historyListScrollView.node.active = true;
        }.bind(this))));
    },

    init: function (id, curr) {
        var self = this;
        NetworkManager.Http.fetch('GET', Url.Http.GET_WIN_JAR_LOG, {
            game_id: id,
            currency: curr
        }, {
            cache: 900,
            delay: 500
        }).success(function (results) {
            if (results) {
                if (!self.isValid) {
                    return;
                }
                self.historyListNode.removeAllChildren();
                for (var i = 0; i < results.data.length; i += 1) {
                    var data = results.data[i];
                    var itemNode = cc.instantiate(self.historyItemTemplateNode);
                    itemNode.getChildByName('1').getComponent(cc.Label).string = data.created_time;
                    itemNode.getChildByName('2').getComponent(cc.Label).string = data.username;
                    itemNode.getChildByName('3').getComponent(cc.Label).string = Utils.Number.abbreviate(data.extra_params.betting, 3);
                    itemNode.getChildByName('4').getComponent(cc.Label).string = Utils.Number.format(data.amount);
                    itemNode.getChildByName('5').getComponent(cc.Label).string = data.type + ' ' + (data.percent * 100) + '%';
                    itemNode.active = true;
                    self.historyListNode.addChild(itemNode);
                }
            }
        });
    },
});
