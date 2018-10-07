var AudioManager = require('AudioManager');
cc.Class({
    extends: cc.Component,

    properties: {},

    // use this for initialization
    onLoad: function () {

    },

    okeCallback: function () {
        AudioManager.instance.playButtonClick();
        // not implement
    },

    cancelCallback: function () {
        AudioManager.instance.playButtonClick();
        // not implement
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
