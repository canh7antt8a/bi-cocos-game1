var NetworkManager = require('NetworkManager'),
    CommonConstant = require('CommonConstant'),
    GameConstant = require('GameConstant'),
    AuthUser = require('AuthUser'),
    Utils = require('Utils'),
    Url = require('Url');

cc.Class({
    extends: cc.Component,

    properties: {
        dateLabel: cc.Label,
        xoSoResultContainer: cc.Node,

        xoSoBetLogPrefab: cc.Prefab,
        xoSoBetLogsContainer: cc.Node,

        helpLabel: cc.Label,
    },

    // use this for initialization
    onLoad: function () {
        this.currentDate = new Date();
        this.currentAction = this.fetchXoSoResult;
        this.updateDate();
    },

    setNextDay: function () {
        this.currentDate.setDate(this.currentDate.getDate() + 1);
        this.updateDate();
    },

    setPreviousDay: function () {
        this.currentDate.setDate(this.currentDate.getDate() - 1);
        this.updateDate();
    },

    updateDate: function () {
        this.dateLabel.string = 'Ngày ' + Utils.Date.format(this.currentDate, 'dd/mm/yyyy');
        this.currentAction();
    },

    onTabClick: function (tabNode) {
        this.currentAction = this['fetch' + tabNode.name];
        this.currentAction();
    },

    fetchXoSoResult: function () {
        var that = this;
        NetworkManager.Http.fetch('GET', Url.Http.XOSO_RESULT, {
            date: Utils.Date.format(this.currentDate, 'yyyy-mm-dd')
        }, {
            cache: 300
        })
            .success(function (resp) {
                var result = resp.data,
                    resultNodes = that.xoSoResultContainer.children;
                for (var i = 0; i < resultNodes.length; i += 1) {
                    resultNodes[i].getChildByName('lblResult').getComponent(cc.Label).string =
                        (result[i] || []).join(' - ');
                }
            });
    },

    fetchLichSu: function () {
        var that = this;
        NetworkManager.Http.fetch('GET', Url.Http.XOSO_USER_BET_LIST, {
            username: AuthUser.username,
            accesstoken: AuthUser.accesstoken,
            date: Utils.Date.format(this.currentDate, 'yyyy-mm-dd')
        }, {})
            .success(function (resp) {
                var betLogs = resp.data,
                    betLogNode, component, currency, winAmount;
                that.xoSoBetLogsContainer.removeAllChildren();
                for (var i = 0; i < betLogs.length; i += 1) {
                    betLogNode = cc.instantiate(that.xoSoBetLogPrefab);
                    component = betLogNode.getComponent('RowTable');

                    currency = CommonConstant.CurrencyType.findByName(betLogs[i].currency).DISPLAY_NAME;
                    if (betLogs[i].win_amount > 0) {
                        winAmount = Utils.Number.format(betLogs[i].win_amount) + ' ' + currency;
                    }
                    else {
                        winAmount = ' ';
                    }
                    component.updateData(betLogs[i].created_time.replace(' ', '\n'),
                        betLogs[i].bet_name, betLogs[i].numbers.join(' - '),
                        Utils.Number.format(betLogs[i].amount) + ' ' + currency, winAmount);
                    that.xoSoBetLogsContainer.addChild(betLogNode);
                }
            });
    },

    fetchHelp: function () {
        var that = this;
        NetworkManager.Http.fetch('GET', Url.Http.GAME_HELP, {
            game_id: GameConstant.XO_SO.ID
        }, {
            cache: 3000
        })
            .success(function (resp) {
                if (resp.data) {
                    that.helpLabel.string = resp.data.content;
                }
            });
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
