var Pagination = require('Pagination');

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
        this.historyListNode.runAction(cc.sequence(cc.delayTime(0.3), cc.callFunc(function () {
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
                historyListInPage = this.historyList.slice(startIndex, startIndex + this.maxRows),
                labelListNode,
                item,
                node,
                i;

            this.historyListNode.removeAllChildren();

            for (i = 0; i < historyListInPage.length; i += 1) {
                node = cc.instantiate(this.historyItemTemplateNode);
                node.active = true;

                item = historyListInPage[i];

                labelListNode = node.getComponentsInChildren(cc.Label);
                labelListNode[0].string = item[0] || ' ';
                labelListNode[1].string = item[1] || ' ';
                labelListNode[2].string = item[2] || ' ';
                labelListNode[3].string = item[3] || ' ';
                labelListNode[4].string = item[4] || ' ';
                this.historyListNode.addChild(node);
            }
        }
    }

});
