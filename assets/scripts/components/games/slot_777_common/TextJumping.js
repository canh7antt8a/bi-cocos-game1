var Utils = require('Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        maxScale: 1.5
    },

    onLoad: function () {
        this._initOnce();
    },

    updateText: function (max) {
        this._initOnce();
        var str = this.label.string.replace(/\./g, '');
        this.current = parseInt(str);
        this.max = Math.floor(max);
        var sub = this.max - this.current;
        this.step = sub / 50.0;
        if (sub < 100 && sub > 0) {
            this.step = 2;
        }
        else if (sub > -100 && sub < 0) {
            this.step = -2;
        }
        if (sub !== 0) {
            this.node.stopAllActions();
            this.node.runAction(cc.sequence(cc.scaleTo(0.25, this.maxScale), cc.scaleTo(0.15, 1)));
        }
        else {
            this.node.scale = 1;
        }

    },

    update: function () {
        var hasChange = this.max !== this.current && this.step !== 0;
        if (hasChange) {
            this.current += this.step;
            if (this.step > 0) {
                if (this.current > this.max) {
                    this.current = this.max;
                    this.step = 0;
                }
            }
            else if (this.step < 0) {
                if (this.current < this.max) {
                    this.current = this.max;
                    this.step = 0;
                }
            }
            this.label.string = Utils.Number.format(Math.floor(this.current));
        }
    },

    _initOnce: function () {
        if (this.label === undefined) {
            this.label = this.node.getComponent(cc.Label);
            this.step = 0;
            this.max = 0;
        }
    },

    replaceAll: function (str, find, replace) {
        return str.replace(new RegExp(find, 'g'), replace);
    }
});
