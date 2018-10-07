var AuthUser = require('AuthUser'),
    CommonConstant = require('CommonConstant'),
    AudioManager = require('AudioManager');

cc.Class({
    extends: cc.Component,

    properties: {
        txtUserName: cc.Label,
        historyPrefab: cc.Prefab,
        xephangPrefab: cc.Prefab,

        iconSoundOff: cc.Node,
        iconSoundOn: cc.Node,

        iconMusicOff: cc.Node,
        iconMusicOn: cc.Node,

        btnLichSu: cc.Node,
    },

    onLoad: function () {
        this.txtUserName.string = AuthUser.username;
        this.showing = false;
        this.hidding = false;
        this.iconSoundOn.active = (AudioManager.instance.getEffectsVolume() === 1);
        this.iconSoundOff.active = (AudioManager.instance.getEffectsVolume() === 0);
        this.iconMusicOn.active = (AudioManager.instance.getMusicVolume() === 1);
        this.iconMusicOff.active = (AudioManager.instance.getMusicVolume() === 0);
    },

    onHistoryClick: function () {
        this.nodeHistory = cc.instantiate(this.historyPrefab);
        this.node.addChild(this.nodeHistory);
        this.nodeHistory.active = true;
        AudioManager.instance.playButtonClick();
        if (this.gamePlay) {
            this.nodeHistory.getComponent('TableHistorySlot').init(this.gamePlay.gameManager.historyList);
        }
    },

    onNoHuClick: function () {
        this.nodeHistory = cc.instantiate(this.xephangPrefab);
        this.node.addChild(this.nodeHistory);
        this.nodeHistory.active = true;
        AudioManager.instance.playButtonClick();
        if (this.gamePlay) {
            this.nodeHistory.getComponent('TableXepHangSlot').init(this.gamePlay.gameId, CommonConstant.CurrencyType.Ip.NAME);
        }
    },

    onSounClick: function () {
        this.iconSoundOn.active = !this.iconSoundOn.active;
        this.iconSoundOff.active = !this.iconSoundOn.active;
        var volume = this.iconSoundOn.active ? 1 : 0;
        AudioManager.instance.setEffectsVolume(volume);
        AudioManager.instance.playButtonClick();
    },

    onMusicClick: function () {
        this.iconMusicOn.active = !this.iconMusicOn.active;
        this.iconMusicOff.active = !this.iconMusicOff.active;
        var volume = this.iconMusicOn.active ? 1 : 0;
        AudioManager.instance.setMusicVolume(volume);
        AudioManager.instance.playButtonClick();
    },

    show: function () {
        this.node.active = true;
    },

    hide: function () {
        if (this.nodeDoiThuong && this.nodeDoiThuong.active && cc.isValid(this.nodeDoiThuong)) {
            return;
        }
        if (this.nodeNapXien && this.nodeNapXien.active && cc.isValid(this.nodeNapXien)) {
            return;
        }
        if (this.nodeHistory && this.nodeHistory.active && cc.isValid(this.nodeHistory)) {
            return;
        }
        if (this.hidding) {
            return;
        }
        this.node.active = false;
    },
});
