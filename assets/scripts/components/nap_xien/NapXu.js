var EventDispatcherConstant = require('EventDispatcherConstant'),
    EventDispatcher = require('EventDispatcher'),
    NetworkManager = require('NetworkManager'),
    CommonConstant = require('CommonConstant'),
    UiManager = require('UiManager'),
    AuthUser = require('AuthUser'),
    Slider = require('Slider'),
    Utils = require('Utils'),
    Url = require('Url');

cc.Class({
    extends: cc.Component,

    properties: {
        ipAmountLabel: cc.Label,
        ipLabel: cc.Label,
        ipSlider: Slider,

        xuAmountLabel: cc.Label,
        infoLabel: cc.Label,
        xuLabel: cc.Label,
    },

    // use this for initialization
    onLoad: function () {
        this.ipLabel.string = 'Số dư ' + CommonConstant.CurrencyType.Ip.DISPLAY_NAME;
        this.xuLabel.string = 'Số ' + CommonConstant.CurrencyType.Xu.DISPLAY_NAME + ' nhận được';
        this.ipSlider.setDefaultValue(0, 0, 0);
        this.updateUserMoney();
        EventDispatcher.addEventListener(EventDispatcherConstant.PROFILE.UPDATE_MONEY, this.updateUserMoney, this);
    },

    onEnable: function () {
        this.fetchNapInfo();
    },

    onDestroy: function () {
        EventDispatcher.removeEventListener(EventDispatcherConstant.PROFILE.UPDATE_MONEY, this.updateUserMoney, this);
    },

    updateUserMoney: function () {
        var ipBalance = AuthUser.currencies[CommonConstant.CurrencyType.Ip.NAME].balance;
        this.ipAmountLabel.string = Utils.Number.format(ipBalance);
        this.xuAmountLabel.string = '';
        this.ipAmount = 0;
        if (this.napInfo) {
            if (this.napInfo.min_ip > ipBalance) {
                this.ipSlider.node.active = false;
                this.infoLabel.node.active = true;
                this.infoLabel.string = 'Để chuyển được sang ' +
                    CommonConstant.CurrencyType.Xu.DISPLAY_NAME + ' thì số dư ' +
                    CommonConstant.CurrencyType.Ip.DISPLAY_NAME + ' tối thiểu là ' +
                    Utils.Number.format(this.napInfo.min_ip);
            }
            else {
                this.ipSlider.node.active = true;
                this.infoLabel.node.active = false;
                this.ipSlider.setDefaultValue(this.napInfo.min_ip, ipBalance, 0);
            }
        }
    },

    fetchNapInfo: function () {
        var that = this;
        NetworkManager.Http.fetch('GET', Url.Http.MONEY_EX, {}, {
                cache: 1800
            })
            .success(function (resp) {
                that.napInfo = resp.data;
                that.updateUserMoney();
            });
    },

    // call when user slide ip slider
    updateIPAmount: function (slideComponent) {
        if (this.napInfo) {
            this.ipAmount = slideComponent.currentValue;
            this.xuAmountLabel.string = Utils.Number.format(
                Math.floor(this.ipAmount * this.napInfo.ip_to_xu));
        }
    },

    confirmNapXu: function (event) {
        if (this.ipAmount > 0) {
            NetworkManager.Http.fetch('POST', Url.Http.MONEY_EX, {
                    username: AuthUser.username,
                    accesstoken: AuthUser.accesstoken,
                    amount: this.ipAmount,
                    currency_from: CommonConstant.CurrencyType.Ip.NAME,
                    currency_to: CommonConstant.CurrencyType.Xu.NAME
                })
                .success(function () {
                    UiManager.openModal('Xin chúc mừng, bạn đã chuyển thành công.');
                })
                .setWaitingButton(event.target);
        }
    }
});
