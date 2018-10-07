var NetworkManager = require('NetworkManager'),
    Url = require('Url');

cc.Class({
    extends: cc.Component,

    properties: {
        itemEventDetailPrefab: cc.Prefab,
        eventContainerNode: cc.Node,
        eventItemPrefab: cc.Prefab,
        openEventId: {
            default: null,
            visible: false,
        },
    },

    // use this for initialization
    onLoad: function () {
        this.fetchEventList();
        this.itemEventDetailNode = cc.instantiate(this.itemEventDetailPrefab);
    },

    fetchEventList: function () {
        var that = this;
        NetworkManager.Http.fetch('GET', Url.Http.EVENT_LIST, {}, {
                cache: 900,
                delay: 500,
            })
            .success(function (tnResp) {
                var eventItems = tnResp.data,
                    openEventId = Number.parseInt(that.openEventId);
                that.eventContainerNode.removeAllChildren();
                for (var i = 0; i < eventItems.length; i += 1) {
                    that._initEventNode(eventItems[i]);
                    if (openEventId === eventItems[i].event_id) {
                        that._openEventItem(eventItems[i]);
                    }
                }
            });
    },

    _initEventNode: function (eventData) {
        var that = this,
            eventItemNode = cc.instantiate(this.eventItemPrefab);
        eventItemNode.getComponent('ItemEvent').updateData(eventData);
        this.eventContainerNode.addChild(eventItemNode);
        eventItemNode.on(cc.Node.EventType.TOUCH_END, function () {
            that._openEventItem(eventData);
        });
    },

    _openEventItem: function (eventData) {
        var that = this;
        that.eventContainerNode.parent.addChild(that.itemEventDetailNode);
        var itemEventComp = that.itemEventDetailNode.getComponent('ItemEvent');
        itemEventComp.updateData(eventData);
        itemEventComp.closeDetailMessage = function () {
            that.itemEventDetailNode.runAction(cc.sequence([cc.fadeOut(0.1),
                cc.callFunc(function () {
                    that.itemEventDetailNode.removeFromParent(false);
                })
            ]));
        };

        that.itemEventDetailNode.runAction(cc.fadeIn(0.1));
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
