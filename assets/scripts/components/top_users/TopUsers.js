var NetworkManager = require('NetworkManager'),
    TabView = require('TabView'),
    Url = require('Url');

cc.Class({
    extends: cc.Component,

    properties: {
        topTabView: TabView,

        itemTopPrefab: cc.Prefab,

        tabTopPrefab: cc.Prefab,
        contentTopPrefab: cc.Prefab,
        subTabTopPrefab: cc.Prefab,
        subContentTopPrefab: cc.Prefab,
    },

    // use this for initialization
    onLoad: function () {
        var that = this;
        NetworkManager.Http.fetch('GET', Url.Http.TOP_TYPES, {}, {
                cache: 900
            })
            .success(function (topResp) {
                var topItems = topResp.data;
                that.topTabView.removeAllTabs();
                for (var i = 0; i < topItems.length; i += 1) {
                    that._initTopTabView(topItems[i], !i);
                }
            });
    },

    _initTopTabView: function (topType, isEnable) {
        var subTopTabView, that = this,
            eventHandler = new cc.Component.EventHandler(),
            tabNode = cc.instantiate(this.tabTopPrefab),
            contentNode = cc.instantiate(this.contentTopPrefab);
        tabNode.getComponentInChildren(cc.Label).string = topType.name;
        tabNode.getComponentInChildren('UrlImage').loadImage(topType.icon);
        subTopTabView = contentNode.getComponent(TabView);
        topType.sub_types.forEach(function (subTopType) {
            that._initSubTopTabView(subTopTabView, subTopType);
        });

        eventHandler.target = this.node;
        eventHandler.component = 'TopUsers';
        eventHandler.handler = 'getTopUsers';
        subTopTabView.selectEvents.push(eventHandler);

        if (!isEnable) {
            contentNode.active = false;
        }
        this.topTabView.addTab(tabNode, contentNode);
        if (isEnable) {
            this.topTabView.activeByName(tabNode.name);
        }
    },

    _initSubTopTabView: function (subTopTabView, subTopType) {
        var tabNode = cc.instantiate(this.subTabTopPrefab),
            contentNode = cc.instantiate(this.subContentTopPrefab);
        tabNode.getComponentInChildren(cc.Label).string = subTopType.name;
        contentNode.topData = subTopType;
        subTopTabView.addTab(tabNode, contentNode);
    },

    getTopUsers: function (tab, content) {
        var that = this,
            containerNode = content.getComponent(cc.ScrollView).content;
        NetworkManager.Http.fetch('GET', content.topData.url, {}, {
                cache: 900,
                delay: 500
            })
            .success(function (topResp) {
                var topItemNode, topComponent,
                    topItems = topResp.data;
                containerNode.removeAllChildren();
                for (var i = 0; i < topItems.length; i += 1) {
                    topItemNode = cc.instantiate(that.itemTopPrefab);
                    topComponent = topItemNode.getComponent('ItemTopUser');
                    topComponent.updateData(i + 1, topItems[i]);
                    containerNode.addChild(topItemNode);
                }
            });
    }
});
