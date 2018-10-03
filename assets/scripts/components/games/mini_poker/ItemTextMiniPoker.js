cc.Class({
    extends: cc.Component,

    properties: {},

    onLoad: function () {
        this.node.position = cc.v2(0, 0);
    },

    setColor: function (color) {
        this.node.color = color;
    },

    setText: function (text) {
        this.node.getComponent(cc.Label).string = text;
    }
});
