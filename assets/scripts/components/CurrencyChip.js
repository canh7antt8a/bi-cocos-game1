var CommonConstant = require('CommonConstant');

cc.Class({
    extends: cc.Component,

    properties: {
        currency: {
            type: cc.Enum({
                IP: CommonConstant.CurrencyType.Ip.ID,
                XU: CommonConstant.CurrencyType.Xu.ID
            }),
            default: CommonConstant.CurrencyType.Ip.ID
        }
    },

    // use this for initialization
    onLoad: function () {
        var labelComponent = this.node.getComponent(cc.Label),
            currency = CommonConstant.CurrencyType.findById(this.currency);
        labelComponent.string = currency.CHIP_NAME;
        this.node.color = currency.CHIP_COLOR;
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
