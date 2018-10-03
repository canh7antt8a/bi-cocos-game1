var Utils = require('Utils'),
    PlatformImplement = require('PlatformImplement'),
    CommonConstant = require('CommonConstant');

cc.Class({
    extends: cc.Component,

    properties: {
        LblMoney: cc.Label,
        lblReceive: cc.Label,
    },

    onLoad: function () {

    },

    onItemClick: function () {
        PlatformImplement.Utils.log('purchase id ' + this.product_id);
        if (this.product_id) {
            PlatformImplement.Iap.purchaseId(this.product_id);
        }
    },

    setData: function (data) {
        var price = data.price;
        this.product_id = data.product_id;
        var receive_value = data.receive_value;
        this.LblMoney.string = Utils.Number.format(price) + ' VNĐ';
        this.lblReceive.string = Utils.Number.format(receive_value) + ' ' + CommonConstant.CurrencyType.Ip.DISPLAY_NAME;
    },
});
