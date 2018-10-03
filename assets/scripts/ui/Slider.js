var Utils = require('Utils'),
    AudioManager = require('AudioManager');


cc.Class({
    extends: cc.Component,

    properties: {
        progressBar: cc.ProgressBar,
        addButton: cc.Button,
        subButton: cc.Button,
        slideNode: cc.Node,
        backdropNode: cc.Node,
        minValueLabel: cc.Label,
        maxValueLabel: cc.Label,
        currentValueLabel: cc.Label,
        rounding: 1,
        rate: 0.01,
        isVertical: true,
        slideEvents: {
            default: [],
            type: cc.Component.EventHandler,
        }
    },

    // use this for initialization
    onLoad: function () {

        var self = this;
        if (this.backdropNode) {
            this.backdropNode.on(cc.Node.EventType.TOUCH_START, function () {
                AudioManager.instance.playButtonClick();
                self.node.active = false;
            });
        }

        this.addButton.node.on(cc.Node.EventType.TOUCH_START, function () {
            AudioManager.instance.playButtonClick();
            var check = 1 - self.progressBar.progress;
            if (check > 0) {
                check = self.rate;
            }
            self.progressBar.progress += check;
            self.slideNode.y += self.progressBar.node.height * check;
            self.setCurrentValue();
        });

        this.subButton.node.on(cc.Node.EventType.TOUCH_START, function () {
            AudioManager.instance.playButtonClick();
            var check = 1 - self.progressBar.progress;
            if (check < 1) {
                check = self.rate;
            }
            else {
                check = self.progressBar.progress;
            }
            self.progressBar.progress -= check;
            self.slideNode.y -= self.progressBar.node.height * check;
            self.setCurrentValue();
        });

        this.slideNode.on(cc.Node.EventType.TOUCH_MOVE, function (event) {
            var check;
            if (self.isVertical) {
                check = event.getDelta().y / self.progressBar.node.height;
            }
            else {
                check = event.getDelta().x / self.progressBar.node.height;
            }
            var preProgressBar = self.progressBar.progress;
            self.progressBar.progress += check;
            if (self.progressBar.progress > 1) {
                self.progressBar.progress = 1;
            }
            else if (self.progressBar.progress < 0) {
                self.progressBar.progress = 0;
            }
            this.y += self.progressBar.node.height * (self.progressBar.progress - preProgressBar);
            self.setCurrentValue();
        });
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    setDefaultValue: function (minValue, maxValue, defaultProgress, betting) {
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.totalValue = maxValue - minValue;

        if (betting) {
            this.rate = this.totalValue ? (betting / this.totalValue) : 0;
            this.rounding = betting;
        }
        if (this.minValueLabel) {
            this.minValueLabel.string = Utils.Number.format(minValue);
        }
        if (this.maxValueLabel) {
            this.maxValueLabel.string = Utils.Number.format(maxValue);
        }
        this.progressBar.progress = defaultProgress;
        this.slideNode.y = this.progressBar.node.y - this.progressBar.node.height / 2 + this.progressBar.node.height * defaultProgress;
        this.setCurrentValue();
    },

    setCurrentValue: function () {
        this.currentValue = Math.floor(this.progressBar.progress * this.totalValue + this.minValue);
        if (this.currentValue > this.rounding) {
            this.currentValue = Math.ceil(this.currentValue / this.rounding) * this.rounding;
        }
        if (this.currentValue > this.maxValue) {
            this.currentValue = this.maxValue;
        } else if (this.currentValue < this.minValue) {
            this.currentValue = this.minValue;
        }
        this.currentValueLabel.string = Utils.Number.format(this.currentValue);
        for (var i = 0; i < this.slideEvents.length; i += 1) {
            this.slideEvents[i].emit([this]);
        }
    }
});
