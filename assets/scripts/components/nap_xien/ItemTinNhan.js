var PlatformImplement = require('PlatformImplement'),
    CommonConstant = require('CommonConstant'),
    AuthUser = require('AuthUser'),
    Utils = require('Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        vndLabel: cc.Label,
        ipLabel: cc.Label,
        sampleLabel: cc.Label
    },

    // use this for initialization
    onLoad: function () {

    },

    onItemClick: function () {
        if (this.data) {
            var content = this.data.template.replace('{0}', AuthUser.username || 'ten_dang_nhap');
            PlatformImplement.guiTinNhan(this.data.code, content);
        }
    },

    updateData: function (data) {
        this.data = data;
        this.vndLabel.string = Utils.Number.format(data.fee) + ' VND';
        this.ipLabel.string = Utils.Number.format(data.gold_value) + ' ' +
            CommonConstant.CurrencyType.Ip.DISPLAY_NAME;
        this.sampleLabel.string = data.sms_sample;
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
