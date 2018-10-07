var CommonConstant = require('CommonConstant'),
    UrlImage = require('UrlImage'),
    Utils = require('Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        imgVatPham: UrlImage,
        nameLabel: cc.Label,
        moneyLabel: cc.Label,
    },

    // use this for initialization
    onLoad: function () {},

    updateData: function (data) {
        this.nameLabel.string = data.name;
        this.moneyLabel.string = Utils.Number.format(data.amount) + ' ' +
            CommonConstant.CurrencyType.findByName(data.currency).DISPLAY_NAME;
        if (this.imgVatPham) {
            this.imgVatPham.loadImage(data.url);
        }
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
