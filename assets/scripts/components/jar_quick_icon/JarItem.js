var Utils = require('Utils');
cc.Class({
    extends: cc.Component,

    properties: {
        lblBet: cc.Label,
        lblMoney: cc.Label,
    },

    // use this for initialization
    onLoad: function () {

    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
    //

    _initEffect: function () {
        this.defaultMoney = 1000000;
        if (this._countDownIntervalId) {
            clearInterval(this._countDownIntervalId);
            this._countDownIntervalId = null;
        }

        if (this.money < this.defaultMoney) {
            this.currMoney = this.money * 70 / 100;
        }
        else {
            this.currMoney = this.money - this.defaultMoney / 10;
        }
        this.otherMoney = (this.money - this.currMoney) / 5;
        this.lblMoney.string = Utils.Number.format(Math.floor(this.currMoney));
        this._effectUpdateMoney();
    },

    _effectUpdateMoney: function () {
        var INTERVAL = 50,
            TIME_15_MINUTE = 10000,
            minTimeLeft = 3000,
            maxTimeLeft = 5000,
            timeLeft = Math.floor(Math.random() * (maxTimeLeft - minTimeLeft)) + minTimeLeft,
            minTimeDelay = 500,
            maxTimeDelay = 1500,
            timeDelay = Math.floor(Math.random() * (maxTimeDelay - minTimeDelay)) + minTimeDelay;
        if (this.money > this.defaultMoney / 10) {
            TIME_15_MINUTE = 2000;
        }
        this._stopTimestamp = Date.now() + timeLeft;
        this._countDownIntervalId = setInterval(function () {
            var t = this._stopTimestamp - Date.now();
            if (t >= timeDelay) {
                var random = Math.random();
                var count = (random < 0.5 ? -random : random) * (Math.ceil(this.otherMoney / TIME_15_MINUTE));
                this.currMoney += count;
                if (Utils.Type.isNumber(this.currMoney) && this.lblMoney !== null) {
                    this.lblMoney.string = Utils.Number.format(Math.floor(this.currMoney));
                }
            }
            else if (t <= 0) {
                this.clearEffectUpdateMoneyQuy();
            }
        }.bind(this), INTERVAL);
    },

    clearEffectUpdateMoneyQuy: function () {
        if (this._countDownIntervalId) {
            clearInterval(this._countDownIntervalId);
            this._countDownIntervalId = null;
            this._effectUpdateMoney();
        }
    },

    onDestroy: function () {
        if (this._countDownIntervalId) {
            clearInterval(this._countDownIntervalId);
            this._countDownIntervalId = null;
        }
    },
});
