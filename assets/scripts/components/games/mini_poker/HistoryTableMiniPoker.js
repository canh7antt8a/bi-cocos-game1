var Utils = require('Utils'),
    Pagination = require('Pagination'),
    CommonConstant = require('CommonConstant'),
    MiniPokerConstant = require('MiniPokerConstant');

cc.Class({
    extends: cc.Component,

    properties: {
        itemPrefab: {
           default: null,
           type: cc.Prefab
        },
        contentItem: cc.Node,
        scrollView: cc.ScrollView,
        pagination: Pagination,
        maxRow: 10
    },

    onLoad: function(){
        this.scrollView.node.active = false;
        this.contentItem.runAction(cc.sequence(cc.delayTime(0.3), cc.callFunc(function(){
            this.scrollView.node.active = true;
        }.bind(this))));
    },

    init: function(historyList){
        if (historyList) {
            this.historyList = historyList;
            var nPage = Math.ceil(historyList.length/this.maxRow),
                pageList = [];
            for (var i=0; i<nPage; i+=1){
                pageList.push(i+1);
            }
            this.selectPage({ page: 1 });
            this.pagination.init({
                pageList: pageList,
                currentPage: 1,
            }, this.selectPage.bind(this));
        }
    },

    selectPage: function (pageInfo) {
        if (this.historyList && pageInfo) {
            var page = pageInfo.page - 1,
                startIndex = page * this.maxRow,
                historyListInPage = this.historyList.slice(startIndex, startIndex + this.maxRow);

            this.contentItem.removeAllChildren();

            for (var i=0; i<historyListInPage.length; i += 1){
                var historyData = historyListInPage[i];
                var currencyName = historyData.currency === CommonConstant.CurrencyType.Ip.NAME ? CommonConstant.CurrencyType.Ip.DISPLAY_NAME : CommonConstant.CurrencyType.Xu.DISPLAY_NAME;
                var itemNode = cc.instantiate(this.itemPrefab);
                itemNode.getChildByName('1').getComponent(cc.Label).string = i+1;
                itemNode.getChildByName('2').getComponent(cc.Label).string = historyData.time;
                itemNode.getChildByName('3').getComponent(cc.Label).string = Utils.Number.format(historyData.moneyBet) + ' ' + currencyName;
                itemNode.getChildByName('4').getComponent(cc.Label).string = historyData.potWin > 0 ? MiniPokerConstant.getPotName(historyData.potWin) : 'Thua';
                itemNode.getChildByName('5').getComponent(cc.Label).string = Utils.Number.format(historyData.moneyExchange) + ' '  + currencyName;
                itemNode.enabled = true;
                this.contentItem.addChild(itemNode);
            }
        }
    }
});