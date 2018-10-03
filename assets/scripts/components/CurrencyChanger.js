var CommonConstant = require('CommonConstant'),
    Utils = require('Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        case: {
            default: Utils.String.CaseType.NONE,
            type: Utils.String.CaseType
        }
    },

    // use this for initialization
    onLoad: function () {
        this.formatStr();
    },

    formatStr: function () {
        var str,
            labelComponent = this.node.getComponent(cc.Label);
        if (labelComponent.string) {
            str = CommonConstant.CurrencyType.normalize(labelComponent.string, this.case);
            labelComponent.string = str;
            return true;
        }
        return false;
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
