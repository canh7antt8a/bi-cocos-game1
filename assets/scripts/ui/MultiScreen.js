cc.Class({
    extends: cc.Component,

    properties: {

    },

    // use this for initialization
    onLoad: function () {
        var size = cc.winSize;
        var ratio_design = cc.Canvas.instance.designResolution.width / cc.Canvas.instance.designResolution.height;
        var ratio_current_screen = size.width / size.height;
        if (ratio_current_screen <= ratio_design) {
            cc.Canvas.instance.fitHeight = false;
            cc.Canvas.instance.fitWidth = true;
        }
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
