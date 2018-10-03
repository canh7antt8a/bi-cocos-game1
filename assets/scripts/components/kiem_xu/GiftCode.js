var Url = require('Url'),
    AuthUser = require('AuthUser'),
    UiManager = require('UiManager'),
    NetworkManager = require('NetworkManager');

cc.Class({
    extends: cc.Component,

    properties: {
        infoLabel: cc.Label,

        giftCodeEditBox: cc.EditBox
    },

    // use this for initialization
    onLoad: function () {},

    getGiftCodeInfo: function () {
        var that = this;
        NetworkManager.Http.fetch('GET', Url.Http.GIFT_CODE, {}, {
            cache: 1800
        })
            .success(function (respDone) {
                that.infoLabel.string = respDone.data.note;
            });
    },

    confirmGiftCode: function (event) {
        var invite_code = this.giftCodeEditBox.string;
        if (!invite_code) {
            return UiManager.openModal('Vui lòng nhập mã giftcode');
        }
        NetworkManager.Http.fetch('POST', Url.Http.GIFT_CODE, {
            username: AuthUser.username,
            accesstoken: AuthUser.accesstoken,
            pin: invite_code
        })
            .setWaitingButton(event.target);
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
