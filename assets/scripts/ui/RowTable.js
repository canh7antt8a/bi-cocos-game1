cc.Class({
    extends: cc.Component,

    properties: {
        columnLabels: {
            default: [],
            type: cc.Label
        }
    },

    // use this for initialization
    onLoad: function () {},

    updateData: function () {
        for (var i = 0; i < this.columnLabels.length; i += 1) {
            this.columnLabels[i].string = arguments[i];
        }
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
