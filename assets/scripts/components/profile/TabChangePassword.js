var Url = require('Url'),
    AuthUser = require('AuthUser'),
    UiManager = require('UiManager'),
    NetworkManager = require('NetworkManager');

cc.Class({
    extends: cc.Component,

    properties: {
        oldPassEditBox: cc.EditBox,
        newPassEditBox: cc.EditBox,
        rePassEditBox: cc.EditBox
    },

    // use this for initialization
    onLoad: function () {
        this.clearInput();
    },

    onButtonChangePass: function (event) {
        var self = this;

        if (this.rePassEditBox.string === '' || this.newPassEditBox.string === '') {
            return UiManager.openModal('Bạn cần nhập đầy đủ thông tin để đổi.');
        }
        if (this.rePassEditBox.string !== this.newPassEditBox.string) {
            return UiManager.openModal('Mật khẩu mới nhập không khớp.');
        }
        if (this.oldPassEditBox.string === this.newPassEditBox.string) {
            return UiManager.openModal('Mật khẩu cũ và mới trùng nhau.');
        }

        NetworkManager.Http.fetch('POST', Url.Http.USER_CHANGE_PASSWORD, {
                username: AuthUser.username,
                old_pass: this.oldPassEditBox.string,
                new_pass: this.newPassEditBox.string
            })
            .success(function () {
                self.clearInput();
                UiManager.openModal('Bạn đã thay đổi mật khẩu thành công.');
            })
            .setWaitingButton(event.target);
    },

    clearInput: function () {
        this.oldPassEditBox.string = '';
        this.newPassEditBox.string = '';
        this.rePassEditBox.string = '';
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
