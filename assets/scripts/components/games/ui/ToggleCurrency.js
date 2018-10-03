var Utils = require('Utils'),
    CommonConstant = require('CommonConstant');

cc.Class({
    extends: cc.Component,

    properties: {
        currencySpriteFrames: {
            default: [],
            type: cc.SpriteFrame
        },
        clickable: true
    },

    // use this for initialization
    onLoad: function () {
        this.index = 0;
        this.switchTo(this.index);
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    switchTo: function (indexOrCurrency) {
        var currencyType, index;
        if (Utils.Type.isNumber(indexOrCurrency)) {
            index = indexOrCurrency;
            currencyType = CommonConstant.CurrencyType.findById(indexOrCurrency);
            if (!currencyType) {
                return;
            }
        }
        else if (Utils.Type.isString(indexOrCurrency)) {
            currencyType = CommonConstant.CurrencyType.findByName(indexOrCurrency);
            if (!currencyType) {
                return;
            }
            index = currencyType.ID;
        }
        else if (Utils.Type.isObject(currencyType)) {
            index = indexOrCurrency.ID;
            currencyType = currencyType;
        }
        else {
            return;
        }

        var sprite = this.node.getComponent(cc.Sprite),
            label = this.node.getComponentInChildren(cc.Label);
        if (sprite && this.index >= 0 && this.index < this.currencySpriteFrames.length) {
            this.index = index;
            sprite.spriteFrame = this.currencySpriteFrames[this.index];
            label.string = currencyType.CHIP_NAME;
            label.node.color = currencyType.CHIP_COLOR;
        }
    },

    next: function () {
        this._incrIndex();
        this.switchTo(this.index);
    },

    back: function () {
        this._incrIndex();
        this.switchTo(this.index);
    },

    click: function () {
        if (this.clickable) {
            this.next();
        }
    },

    _incrIndex: function () {
        this.index += 1;
        if (this.index >= this.currencySpriteFrames.length) {
            this.index = 0;
        }
    },

    _decrIndex: function () {
        this.index -= 1;
        if (this.index <= 0) {
            this.index = this.currencySpriteFrames.length - 1;
        }
    }
});
