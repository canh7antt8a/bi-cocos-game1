cc.Class({
    extends: cc.Component,

    properties: {
        lineList: {
            default: [],
            type: cc.Node
        }
    },

    onLoad: function () {
        for (var i = 0; i < this.lineList.length; i += 1) {
            this.disableLine(i);
        }
    },

    activeLine: function (lineIndex, callback) {
        var node = this.lineList[lineIndex].getChildByName('Active');
        node.active = true;
        node.stopAllActions();
        node.opacity = 255;
        node.runAction(cc.repeatForever(cc.sequence(cc.fadeTo(0.1, 200), cc.fadeTo(0.1, 255))));
        node.runAction(cc.sequence(cc.delayTime(1), cc.callFunc(function () {
            node.stopAllActions();
            node.active = false;
            if (callback !== undefined) {
                callback();
            }
        })));
    },

    activeLineWithDelay: function (lineIndex, delay, callback) {
        this.node.runAction(cc.sequence(cc.delayTime(delay), cc.callFunc(function () {
            this.activeLine(lineIndex, callback);
        }.bind(this))));
    },

    disableLine: function (lineIndex) {
        var node = this.lineList[lineIndex].getChildByName('Active');
        node.stopAllActions();
        node.active = false;
    },

    resetAllLine: function () {
        for (var i = 0; i < this.lineList.length; i += 1) {
            this.disableLine(i);
        }
    },
});
