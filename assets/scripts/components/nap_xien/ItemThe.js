var UrlImage = require('UrlImage');

cc.Class({
    extends: cc.Component,

    properties: {
        tcaoImage: UrlImage,
    },

    // use this for initialization
    onLoad: function () {

    },

    updateData: function (data) {
        this.tcaoImage.loadImage(data.img);
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
