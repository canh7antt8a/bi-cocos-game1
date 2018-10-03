var Utils = require('Utils');

cc.Class({
    extends: cc.Component,

    properties: {},

    // use this for initialization
    onLoad: function () {

    },

    onEnable: function () {
        this.stopPropagationOnNode = Utils.Node.stopPropagation(this.node);
    },

    onDisable: function () {
        if (this.stopPropagationOnNode) {
            this.stopPropagationOnNode();
            this.stopPropagationOnNode = null;
        }
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
