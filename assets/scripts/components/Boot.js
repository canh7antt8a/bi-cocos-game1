var Utils = require('Utils'),
    IplayHttp = require('IplayHttp'),
    SysConfig = require('SysConfig'),
    CommonConstant = require('CommonConstant');

cc.Class({
    extends: cc.Component,

    properties: {
        cpEditBox: cc.EditBox,
        httpHostEditBox: cc.EditBox,
        httpPortEditBox: cc.EditBox,
    },

    // use this for initialization
    onLoad: function () {
        this.cpEditBox.string = SysConfig.CP;
        this.httpHostEditBox.string = SysConfig.IplayHttp.HOST;
        this.httpPortEditBox.string = SysConfig.IplayHttp.PORT;
    },

    startGame: function () {
        var httpConfig = SysConfig.IplayHttp;
        SysConfig.CP = this.cpEditBox.string;
        httpConfig.HOST = this.httpHostEditBox.string;
        httpConfig.PORT = this.httpPortEditBox.string;
        IplayHttp.init(httpConfig.HOST, httpConfig.PORT, httpConfig.PROTOCOL,
            httpConfig.AUTH_USER, httpConfig.AUTH_PASS);

        Utils.Director.loadScene(CommonConstant.Scene.SPLASH);
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
