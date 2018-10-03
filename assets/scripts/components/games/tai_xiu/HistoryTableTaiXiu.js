var Pagination = require('Pagination'),
    CommonConstant = require('CommonConstant'),
    TaiXiuConstant = require('TaiXiuConstant');

cc.Class({
    extends: cc.Component,

    properties: {
        pagination: Pagination,
        historyItemTemplateNode: cc.Node,
        historyListNode: cc.Node,
        historyListScrollView: cc.ScrollView,
        maxRows: 10
    },

    onLoad: function () {
        this.historyListScrollView.node.active = false;
        this.historyListNode.runAction(cc.sequence(cc.delayTime(0.3), cc.callFunc(function(){
            this.historyListScrollView.node.active = true;
        }.bind(this))));
    },

    init: function (historyList) {
        if (historyList) {
            var nPages = Math.ceil(historyList.length / 10),
                pageList = [],
                i;

            this.historyList = historyList;

            for (i = 1; i <= nPages; i += 1) {
                pageList.push(i);
            }

            this.selectPage({
                page: 1
            });
            this.pagination.init({
                pageList: pageList,
                currentPage: 1
            }, this.selectPage.bind(this));
        }
    },

    selectPage: function (pageInfo) {
        if (this.historyList && pageInfo) {
            var page = pageInfo.page - 1,
                startIndex = page * this.maxRows,
                historyLength = this.historyList.length,
                historyListInPage = this.historyList.slice(startIndex, startIndex + this.maxRows),
                labelListNode,
                currencyType,
                potBettingMap,
                item,
                node,
                pot,
                s1,
                s2,
                i;

            this.historyListNode.removeAllChildren();

            for (i = 0; i < historyListInPage.length; i += 1) {
                node = cc.instantiate(this.historyItemTemplateNode);
                node.active = true;

                item = historyListInPage[i];
                currencyType = CommonConstant.CurrencyType.findByName(item.currency);
                potBettingMap = item.potBettingMap;
                s1 = '';
                s2 = '';
                for (pot in potBettingMap) {
                    s1 += TaiXiuConstant.Pot.findById(pot).NAME + '\n';
                    s2 += potBettingMap[pot] + ' ' + currencyType.DISPLAY_NAME + '\n';
                }
                s1 = s1.trim();
                s2 = s2.trim();

                labelListNode = node.getComponentsInChildren(cc.Label);
                labelListNode[0].string = i + 1;
                labelListNode[1].string = item.time;
                labelListNode[2].string = s1;
                labelListNode[3].string = s2;
                labelListNode[4].string = TaiXiuConstant.Pot.findById(item.potWin).NAME;
                labelListNode[5].string = item.moneyExchange + ' ' + currencyType.DISPLAY_NAME;
                this.historyListNode.addChild(node);
            }
        }
    }
});
