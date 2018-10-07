var Url = require('Url'),
    Utils = require('Utils'),
    CommonConstant = require('CommonConstant'),
    NetworkManager = require('NetworkManager');

cc.Class({
    extends: cc.Component,

    properties: {
        itemPrefab: cc.Prefab,
        contentTopWin: cc.Node,
        contentTopLose: cc.Node,
        topWinScrollview: cc.ScrollView,
        topLostScrollview: cc.ScrollView,
        lblTime: cc.Label
    },

    onLoad: function () {},

    getData: function (currency, time) {
        // Var
        this.currency = currency;
        this.currentTime = time;

        // Remove All Item
        this.reset();

        // Date co data 2016-08-26
        var self = this;
        this.lblTime.string = 'Ngày ' + Utils.Date.format(this.currentTime, 'dd/mm/yyyy');
        var isShowTopPi = currency === CommonConstant.CurrencyType.Ip.NAME;
        NetworkManager.Http.fetch('GET', Url.Http.TAI_XIU_GET_DAILY_TOP, {
            date: Utils.Date.format(this.currentTime, 'yyyy-mm-dd')
        }, {
            cache: 900,
            delay: 500
        }).success(function (results) {
            if (!self.isValid) {
                return;
            }

            // Remove All Item
            self.reset();

            if (results) {
                var topData = results.data[isShowTopPi ? CommonConstant.CurrencyType.Ip.NAME : CommonConstant.CurrencyType.Xu.NAME],
                    i;
                if (!topData) {
                    return;
                }
                var topWin = topData.top_win_users,
                    topLost = topData.top_lost_users,
                    node,
                    labelListNode;
                for (i = 0; i < topWin.length; i += 1) {
                    node = cc.instantiate(self.itemPrefab);
                    labelListNode = node.getComponentsInChildren(cc.Label);
                    labelListNode[0].string = i + 1;
                    labelListNode[1].string = topWin[i].username;
                    labelListNode[2].string = topWin[i].max_consecutive_win;
                    self.contentTopWin.addChild(node);
                }
                for (i = 0; i < topLost.length; i += 1) {
                    node = cc.instantiate(self.itemPrefab);
                    labelListNode = node.getComponentsInChildren(cc.Label);
                    labelListNode[0].string = i + 1;
                    labelListNode[1].string = topLost[i].username;
                    labelListNode[2].string = topLost[i].max_consecutive_lost;
                    self.contentTopLose.addChild(node);
                }
            }
        });
    },

    reset: function () {
        this.contentTopWin.removeAllChildren();
        this.topWinScrollview.scrollToTop();
        this.contentTopLose.removeAllChildren();
        this.topLostScrollview.scrollToTop();
    },

    onClickLeft: function () {
        this.currentTime = this.currentTime - 24 * 60 * 60 * 1000;
        this.getData(this.currency, this.currentTime);
    },

    onClickRight: function () {
        this.currentTime = this.currentTime + 24 * 60 * 60 * 1000;
        this.getData(this.currency, this.currentTime);
    },
});
