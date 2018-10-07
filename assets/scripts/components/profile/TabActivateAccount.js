var Url = require('Url'),
    AuthUser = require('AuthUser'),
    UiManager = require('UiManager'),
    NetworkManager = require('NetworkManager'),
    PlatformImplement = require('PlatformImplement');

cc.Class({
    extends: cc.Component,

    properties: {
        statusEmailLabel: cc.Label,
        statusSmsLabel: cc.Label,
        activeEmailButton: cc.Button,
        activeSmsButton: cc.Button,
        emailLabel: cc.Label,
        SmsLabel: cc.Label
    },
    // use this for initialization
    onLoad: function () {},

    onEnable: function () {
        this.SmsLabel.string = AuthUser.username;
        this.emailLabel.string = AuthUser.email;
        if (AuthUser.email_active) {
            this.statusEmailLabel.string = 'Đã kích hoạt email';
            this.activeEmailButton.interactable = false;
        }
        else {
            this.statusEmailLabel.string = 'Chưa kích hoạt email';
            this.activeEmailButton.interactable = true;
        }
        if (AuthUser.mobile_active_time) {
            this.statusSmsLabel.string = 'Đã kích hoạt SMS';
            this.activeSmsButton.interactable = false;
        }
        else {
            this.statusSmsLabel.string = 'Chưa kích hoạt SMS';
            this.activeSmsButton.interactable = true;
        }
    },

    activeEmail: function (event) {
        NetworkManager.Http.fetch('POST', Url.Http.USER_ACTIVE_EMAIL, {
                username: AuthUser.username,
                accesstoken: AuthUser.accesstoken
            }).success(function () {
                UiManager.openModal('Đã gửi thư kích hoạt đến email của bạn, hãy kiểm tra ở hòm thư!');
            })
            .setWaitingButton(event.target);
    },

    activeSms: function (event) {
        NetworkManager.Http.fetch('GET', Url.Http.USER_ACTIVE_PHONE, {
                username: AuthUser.username,
                accesstoken: AuthUser.accesstoken
            })
            .success(function (respDone) {
                var info = respDone.data;
                UiManager.openConfirmModal(info.note, {
                    oke_fn: function () {
                        PlatformImplement.guiTinNhan(info.number, info.syntax);
                    }
                });
            })
            .setWaitingButton(event.target);
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
