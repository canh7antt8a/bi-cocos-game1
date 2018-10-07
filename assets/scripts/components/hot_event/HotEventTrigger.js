var Url = require('Url'),
    Utils = require('Utils'),
    UiManager = require('UiManager'),
    CommonConstant = require('CommonConstant'),
    NetworkManager = require('NetworkManager');

var lastOpen = 0,
    TTL = 3600 * 2 * 1000;

cc.Class({
    extends: cc.Component,

    properties: {},

    // use this for initialization
    onLoad: function () {
        var now = new Date().getTime();
        if (lastOpen + TTL > now) {
            return;
        }
        lastOpen = now;
        NetworkManager.Http.fetch('GET', Url.Http.BANNER, {}, {
                cache: 3600,
                delay: 3000
            })
            .success(function (tnResp) {
                if (tnResp.data && tnResp.data.length > 0 && Utils.Director.getCurrentSceneName() === CommonConstant.Scene.HALL) {
                    UiManager.openPopupHotEvent();
                }
            });
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
