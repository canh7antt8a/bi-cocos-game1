var EventDispatcherConstant = require('EventDispatcherConstant'),
    EventDispatcher = require('EventDispatcher'),
    NetworkManager = require('NetworkManager'),
    CommonConstant = require('CommonConstant'),
    ToggleCurrency = require('ToggleCurrency'),
    UiManager = require('UiManager'),
    AuthUser = require('AuthUser'),
    Utils = require('Utils'),
    Url = require('Url');

cc.Class({
    extends: cc.Component,

    properties: {
        xoSoItemPrefab: cc.Prefab,
        xoSoItemsContainer: cc.Node,

        dateLabel: cc.Label,
        remainTimeLabel: cc.Label,
        xoSoLogRichText: cc.RichText,

        xoSoEditBox: cc.EditBox,
        xoSoTypeInfoLabel: cc.Label,

        mucCuocPrefab: cc.Prefab,
        mucCuocContainer: cc.Node,

        balanceLabel: cc.Label,
        betAmountLabel: cc.Label,
        toggleCurrency: ToggleCurrency,
    },

    start: function () {
        this.node.zIndex = CommonConstant.ZINDEX.MINIGAME_PREFAB;
    },

    // use this for initialization
    onLoad: function () {
        this.fetchXoSoTypes();
        this.fetchXoSoLogs();
        this.resetTienCuoc();

        EventDispatcher.addEventListener(EventDispatcherConstant.PROFILE.UPDATE_MONEY, this.updateUserMoney, this);
    },

    onDestroy: function () {
        EventDispatcher.removeEventListener(EventDispatcherConstant.PROFILE.UPDATE_MONEY, this.updateUserMoney, this);
    },

    fetchXoSoTypes: function () {
        var that = this;
        NetworkManager.Http.fetch('GET', Url.Http.XOSO_TYPES, {}, {
                cache: 1800,
                delay: 500,
            })
            .success(function (xoSoResp) {
                var mucCuocNode, icaoComponent, expireTime,
                    xoSoItems = xoSoResp.data.types;
                that.betValues = xoSoResp.data.bet_values;
                expireTime = Utils.Date.fromString(xoSoResp.data.expire_time);
                that.remainSeconds = (expireTime.getTime() - new Date().getTime()) / 1000;
                that.dateLabel.string = 'Ngày ' + Utils.Date.format(expireTime, 'dd/mm/yyyy');

                that.switchCurrency();
                that.toggleCurrency.switchTo(that.currentCurrency);
                that.xoSoItemsContainer.removeAllChildren();
                for (var i = 0; i < xoSoItems.length; i += 1) {
                    mucCuocNode = cc.instantiate(that.xoSoItemPrefab);
                    icaoComponent = mucCuocNode.getComponent('XoSoItem');
                    icaoComponent.updateData(xoSoItems[i]);
                    mucCuocNode.xoSoType = xoSoItems[i];
                    that.xoSoItemsContainer.addChild(mucCuocNode);

                    if (i === 0) {
                        that.xoSoItemsContainer.getComponent('MultiSelect').selectItem(mucCuocNode);
                    }
                }
            });
    },

    fetchXoSoLogs: function () {
        var that = this;
        NetworkManager.Http.fetch('GET', Url.Http.XOSO_BET_LIST, {}, {
                cache: 300,
                delay: 500,
            })
            .success(function (resp) {
                var logItems = resp.data,
                    logStrings = [],
                    logItem;
                for (var i = 0; i < logItems.length; i += 1) {
                    logItem = logItems[i];
                    logStrings.push(logItem.username + ' <color=#ff5c97>' + Utils.Number.abbreviate(logItem.amount) + ' ' +
                        CommonConstant.CurrencyType.findByName(logItem.currency).DISPLAY_NAME + '</color> <color=#ed9459>' +
                        logItem.bet_name + '</color> <color=#3debf5>' + logItem.numbers.join(' ') + '</color>');
                }
                that.xoSoLogRichText.string = logStrings.join('\n');
            });
    },

    betXoSo: function (event) {
        var that = this;
        if (this.betAmount > 0) {
            NetworkManager.Http.fetch('POST', Url.Http.XOSO_BET, {
                    username: AuthUser.username,
                    accesstoken: AuthUser.accesstoken,
                    amount: this.betAmount,
                    currency: this.currentCurrency,
                    bet_type: this.currentXoSoType,
                    numbers: this.xoSoEditBox.string
                })
                .success(function (resp) {
                    UiManager.openModal(resp.msg);
                    that.resetTienCuoc();
                    AuthUser.currencies[resp.data.currency].balance = resp.data.balance;
                    EventDispatcher.dispatchEvent(EventDispatcherConstant.PROFILE.UPDATE_MONEY);
                })
                .setWaitingButton(event.target);
        }
        else {
            UiManager.openModal('Vui lòng chọn mức tiền cược.');
        }
    },

    selectXoSoType: function (selectedItems) {
        if (selectedItems.length > 0) {
            var xoSoType = selectedItems[0].xoSoType,
                defaultNumber, i, tmpArray = [];
            this.currentXoSoType = xoSoType.id;
            this.xoSoTypeInfoLabel.string = xoSoType.name + ' (Đặt 1 ăn ' + xoSoType.ratio + ')';
            defaultNumber = new Array(xoSoType.number_of_digit + 1).join('0');
            for (i = 0; i < xoSoType.quantity_number; i += 1) {
                tmpArray.push(defaultNumber);
            }
            this.xoSoEditBox.string = tmpArray.join(', ');
        }
    },

    switchCurrency: function () {
        if (this.currentCurrency === CommonConstant.CurrencyType.Ip.NAME) {
            this.currentCurrency = CommonConstant.CurrencyType.Xu.NAME;
        }
        else {
            this.currentCurrency = CommonConstant.CurrencyType.Ip.NAME;
        }
        this.updateUserMoney();
        this.resetTienCuoc();

        var that = this,
            cacMucCuoc = that.betValues[that.currentCurrency],
            mucCuocNode;

        that.mucCuocContainer.removeAllChildren();
        for (var i = 0; i < cacMucCuoc.length; i += 1) {
            mucCuocNode = cc.instantiate(that.mucCuocPrefab);
            mucCuocNode.betAmount = cacMucCuoc[i];
            mucCuocNode.getComponentInChildren(cc.Label).string = Utils.Number.abbreviate(cacMucCuoc[i]);
            that.mucCuocContainer.addChild(mucCuocNode);

            mucCuocNode.on(cc.Node.EventType.TOUCH_START, function (event) {
                that.themTienCuoc(event.target.betAmount);
            }, mucCuocNode);
        }
    },

    updateUserMoney: function () {
        this.balanceLabel.string = Utils.Number.format(AuthUser.currencies[this.currentCurrency].balance);
    },

    themTienCuoc: function (amount) {
        this.betAmount += amount;
        this.betAmountLabel.string = Utils.Number.format(this.betAmount);
    },

    resetTienCuoc: function () {
        this.betAmount = 0;
        this.betAmountLabel.string = Utils.Number.format(this.betAmount);
    },

    openXoSoResult: function () {
        this.openXoSoInfoModal('XoSoResult');
    },

    openXoSoMyBetHistory: function () {
        this.openXoSoInfoModal('LichSu');
    },

    openXoSoHelp: function () {
        this.openXoSoInfoModal('Help');
    },

    openXoSoInfoModal: function (tabName) {
        UiManager.openModalByName('games/xo_so/XoSoInfoModal', function (newNode) {
            newNode.getComponentInChildren('TabView').activeByName(tabName);
        });
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        var remainTimeStr,
            remainHours,
            remainSeconds;
        if (this.remainSeconds > 0) {
            this.remainSeconds -= dt;
            remainSeconds = this.remainSeconds;
            if (remainSeconds > 0) {
                remainHours = Math.floor(remainSeconds / 3600);
                remainTimeStr = Utils.Number.fillZero(remainHours, 2);
                remainTimeStr += ':' + Utils.Number.fillZero(Math.floor(remainSeconds / 60 - remainHours * 60), 2);
                remainTimeStr += ':' + Utils.Number.fillZero(Math.floor(remainSeconds % 60), 2);
                this.remainTimeLabel.string = remainTimeStr;
            }
        }
        else {
            this.remainTimeLabel.string = '00:00:00';
        }
    },
});
