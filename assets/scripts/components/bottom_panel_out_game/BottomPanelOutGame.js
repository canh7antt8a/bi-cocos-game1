var UiManager = require('UiManager'),
    AuthUser = require('AuthUser'),
    AudioManager = require('AudioManager'),
    TinhNangManager = require('TinhNangManager');

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
    },

    // use this for initialization
    onLoad: function () {

    },

    openNapXien: function () {
        UiManager.openNapXienModal();
        AudioManager.instance.playButtonClick();
    },

    openTopUsers: function () {
        UiManager.openTopUsersModal();
        AudioManager.instance.playButtonClick();
    },

    openDoiThuong: function () {
        if (AuthUser.experience >= TinhNangManager.expCanViewGift) {
            UiManager.openPopupDoiThuong();
            AudioManager.instance.playButtonClick();
        }
    },

    openDaiLy: function () {
        UiManager.openPopupDaiLy();
        AudioManager.instance.playButtonClick();
    },

    openKiemXu: function () {
        UiManager.openPopupKiemXu();
        AudioManager.instance.playButtonClick();
    },

    openSettings: function () {
        UiManager.openPopupSettings();
        AudioManager.instance.playButtonClick();
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
