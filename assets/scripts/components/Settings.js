var Url = require('Url'),
    AudioManager = require('AudioManager'),
    NetworkManager = require('NetworkManager'),
    PlatformImplement = require('PlatformImplement'),
    ToggleButton = require('ToggleButton');

cc.Class({
    extends: cc.Component,

    properties: {
        hotlineLabel: cc.Label,

        backgroundMusicToggleButton: ToggleButton,
        soundEffectToggleButton: ToggleButton,
    },

    // use this for initialization
    onLoad: function () {
        this.fetchContactInfo();

        this.backgroundMusicToggleButton.isEnable = (AudioManager.instance.getMusicVolume() === 1);
        this.soundEffectToggleButton.isEnable = (AudioManager.instance.getEffectsVolume() === 1);
    },

    toggleBackgroundMusic: function (toggleButton) {
        var volume = toggleButton.isEnable ? 1 : 0;
        AudioManager.instance.setMusicVolume(volume);
    },

    toggleSoundEffect: function (toggleButton) {
        var volume = toggleButton.isEnable ? 1 : 0;
        AudioManager.instance.setEffectsVolume(volume);
    },

    updateMusicVolume: function (slideComponent) {
        cc.audioEngine.setMusicVolume(slideComponent.currentValue / 100);
    },

    fetchContactInfo: function () {
        var that = this;
        NetworkManager.Http.fetch('GET', Url.Http.CONTACT_INFO, {}, {
                cache: 1800
            })
            .success(function (respContact) {
                that.contactInfo = respContact.data;
                that.hotlineLabel.string = respContact.data.mobile;
            });
    },

    callHotline: function () {
        if (this.contactInfo) {
            PlatformImplement.callNumberPhone(this.contactInfo.mobile);
        }
    },

    logout: function () {
        PlatformImplement.openLogoutConfirmationModal();
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
