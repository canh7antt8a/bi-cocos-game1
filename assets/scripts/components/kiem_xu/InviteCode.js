var Url = require('Url'),
    AuthUser = require('AuthUser'),
    UiManager = require('UiManager'),
    NetworkManager = require('NetworkManager');

cc.Class({
    extends: cc.Component,

    properties: {
        infoLabel: cc.Label,
        myInviteCodeLabel: cc.Label,

        inviteCodeEditBox: cc.EditBox
    },

    // use this for initialization
    onLoad: function () {},

    getInviteCodeInfo: function () {
        var that = this;
        NetworkManager.Http.fetch('GET', Url.Http.INVITE_CODE, {
            username: AuthUser.username,
            accesstoken: AuthUser.accesstoken
        }, {
            cache: 1800
        })
            .success(function (respDone) {
                that.infoLabel.string = respDone.info;
                that.myInviteCodeLabel.string = respDone.data;
            });
    },

    confirmInviteCode: function (event) {
        var invite_code = this.inviteCodeEditBox.string;
        if (!invite_code) {
            return UiManager.openModal('Vui lòng nhập mã giới thiệu');
        }
        NetworkManager.Http.fetch('POST', Url.Http.INVITE_CODE, {
            username: AuthUser.username,
            accesstoken: AuthUser.accesstoken,
            invite_code: invite_code
        })
            .setWaitingButton(event.target);
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
