var Utils = require('Utils'),
    Url = require('Url'),
    CommonConstant = require('CommonConstant'),
    ToggleCurrency = require('ToggleCurrency'),
    NetworkManager = require('NetworkManager');

cc.Class({
    extends: cc.Component,

    properties: {
        itemPrefab: {
            default: null,
            type: cc.Prefab
        },
        contentItemPi: {
            default: null,
            type: cc.Node
        },
        contentItemXu: {
            default: null,
            type: cc.Node
        },
        scrollView: cc.ScrollView,
        btnCurrency: cc.Node,
        gameid: 0,
    },

    onLoad: function () {
        // Get Top User
        // this.getWinJarLog(GameConstant.TAY_DU_KY.ID, CommonConstant.CurrencyType.Ip.NAME, this.contentItemPi, this.historyDataPi);
    },

    getWinJarLog: function (id, curr, contentItem, historyData) {
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
                contentItem.removeAllChildren();
                for (var i = 0; i < results.data.length; i += 1) {
                    historyData = results.data[i];
                    var itemNode = cc.instantiate(self.itemPrefab);
                    itemNode.getChildByName('1').getComponent(cc.Label).string = historyData.created_time;
                    itemNode.getChildByName('2').getComponent(cc.Label).string = historyData.username;
                    itemNode.getChildByName('3').getComponent(cc.Label).string = Utils.Number.abbreviate(historyData.extra_params.betting, 3);
                    itemNode.getChildByName('4').getComponent(cc.Label).string = Utils.Number.format(historyData.amount);
                    itemNode.getChildByName('5').getComponent(cc.Label).string = historyData.type + ' ' + (historyData.percent * 100) + '%';
                    itemNode.enabled = true;
                    contentItem.addChild(itemNode);
                }
            }
        });
    },

    onCurrencyClick: function () {
        this.btnCurrency.getComponent('ToggleCurrency').click();
        this.currencyIndex = this.btnCurrency.getComponent(ToggleCurrency).index;
        if (this.currencyIndex === 0) {
            this.contentItemPi.active = true;
            this.contentItemXu.active = false;
            if (!this.historyDataPi) {
                this.getWinJarLog(this.gameid, CommonConstant.CurrencyType.Ip.NAME, this.contentItemPi, this.historyDataPi);
            }
            this.scrollView.content = this.contentItemPi;
        } else {
            this.contentItemPi.active = false;
            this.contentItemXu.active = true;
            if (!this.historyDataXu) {
                this.getWinJarLog(this.gameid, CommonConstant.CurrencyType.Xu.NAME, this.contentItemXu, this.historyDataXu);
            }
            this.scrollView.content = this.contentItemXu;
        }
    },

});
