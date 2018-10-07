var Url = require('Url'),
    AuthUser = require('AuthUser'),
    UiManager = require('UiManager'),
    NetworkManager = require('NetworkManager'),
    EventDispatcher = require('EventDispatcher'),
    EventDispatcherConstant = require('EventDispatcherConstant');

cc.Class({
    extends: cc.Component,

    properties: {
        emailEditBox: cc.EditBox,
        userNameLabel: cc.Label,
        fullNameEditBox: cc.EditBox
    },

    // use this for initialization
    onLoad: function () {
        this.userNameLabel.string = AuthUser.username;
        this.emailEditBox.string = AuthUser.email || '';
        this.fullNameEditBox.string = AuthUser.display_name;
    },

    onButtonChangeInfo: function (event) {
        var emailInput = '',
            fullName = '',
            firstName = '',
            lastName = '';

        if (this.emailEditBox.string === '' || this.fullNameEditBox.string === '') {
            UiManager.openModal('Bạn cần nhập đầy đủ thông tin để đổi.');
        }
        else {
            fullName = this.fullNameEditBox.string.split(' ');
            firstName = fullName[0];
            lastName = fullName[1] || '';
            fullName = this.fullNameEditBox.string;
            emailInput = this.emailEditBox.string;

            NetworkManager.Http.fetch('POST', Url.Http.USER_UPDATE_INFO, {
                    username: AuthUser.username,
                    email: emailInput,
                    firstname: firstName,
                    lastname: lastName,
                    accesstoken: AuthUser.accesstoken
                })
                .success(function (accResp) {
                    AuthUser.updateInfo(accResp.data);
                    EventDispatcher.dispatchEvent(EventDispatcherConstant.PROFILE.UPDATE_INFO);
                    UiManager.openModal('Bạn đã thay đổi thông tin thành công.');
                })
                .setWaitingButton(event.target);
        }
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
