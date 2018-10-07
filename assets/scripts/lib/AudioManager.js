var Utils = require('Utils'),
    EventDispatcher = require('EventDispatcher'),
    AUDIO_PREFIX = 'res/raw-assets/audio/',
    AUDIO_URLS = {
        BACKGROUND_MUSIC: AUDIO_PREFIX + 'BackgroundMusic.mp3',
        BAI_CHON: AUDIO_PREFIX + 'BaiChon.mp3',
        BAI_BAY: AUDIO_PREFIX + 'BaiBay.mp3',
        BAI_CHIA: AUDIO_PREFIX + 'BaiChia.mp3',
        BALL_RUN: AUDIO_PREFIX + 'BallRun.mp3',
        CHICKEN_WIN: AUDIO_PREFIX + 'ChickenWin.mp3',
        CHIP_BAY: AUDIO_PREFIX + 'ChipBay.mp3',
        COIN_DROP: AUDIO_PREFIX + 'CoinDrop.mp3',
        DANH_BAI: AUDIO_PREFIX + 'DanhBai.mp3',
        LOST: AUDIO_PREFIX + 'Lost.mp3',
        MINIPOKER: AUDIO_PREFIX + 'MiniPoker.mp3',
        CHICKEN_ROW: AUDIO_PREFIX + 'ChickenRow.mp3',
        PHOM_PICK_CARD: AUDIO_PREFIX + 'PhomPickCard.mp3',
        PHOM_TAI_LUOT: AUDIO_PREFIX + 'PhomTaiLuot.mp3',
        PLAYER_JOIN_ROOM: AUDIO_PREFIX + 'PlayerJoinRoom.mp3',
        PLAYER_LEAVE_ROOM: AUDIO_PREFIX + 'PlayerLeaveRoom.mp3',
        READY: AUDIO_PREFIX + 'Ready.mp3',
        THANG_TRANG: AUDIO_PREFIX + 'ThangTrang.mp3',
        TURN_START: AUDIO_PREFIX + 'TurnStart.mp3',
        VONG_QUAY: AUDIO_PREFIX + 'VongQuay.mp3',
        WIN: AUDIO_PREFIX + 'Win.mp3',
        LOSE: AUDIO_PREFIX + 'Lose.mp3',
        XOC: AUDIO_PREFIX + 'Xoc.mp3',
        BALL_DROP: AUDIO_PREFIX + 'BallDrop.mp3',
        BUTTON_CLICK: AUDIO_PREFIX + 'ButtonClick.mp3',
        ERROR: AUDIO_PREFIX + 'Error.mp3',
    },
    BG_MUSIC_VOLUME_KEY = '__bg_music_volume__',
    SOUND_EFFECT_VOLUME_KEY = '__effect_volume__',
    MAX_AUDIO_ITEMS = 20,
    MAX_AUDIO_IDENTITY_ITEMS = 3,
    data = {
        eventDispatcher: EventDispatcher.create(),
        isMusicPlaying: false,
        backgroundMusicId: null,
        effectsVolume: 1,
        musicVolume: 1
    },
    EVENTS = {
        CHANGE_EFFECTS_VOLUME: 'change_effects_volume'
    },
    AudioManager;

cc.audioEngine.setMaxAudioInstance(MAX_AUDIO_IDENTITY_ITEMS);

function playEffectFactoryFn(clip) {
    return function (loop) {
        Utils.Array.trimLeft(this.audioIdList, MAX_AUDIO_ITEMS);

        var audioId = this.playEffect(clip, loop);
        if (audioId) {
            this.audioIdList.push(audioId);
        }
        return audioId;
    };
}

AudioManager = Utils.Class({
    $$constructor: function (configs) {
        configs = configs || {};
        if (Utils.Type.isFunction(configs.effectPlayableFn)) {
            this.effectPlayableFn = configs.effectPlayableFn;
        }
        this.audioIdList = [];

        data.eventDispatcher.addEventListener(EVENTS.CHANGE_EFFECTS_VOLUME, this._onChangeEffectsVolume, this);
    },

    destroy: function () {
        var self = this;
        this.audioIdList.forEach(function (audioId) {
            self.stopEffect(audioId);
        });
        this.audioIdList = [];

        data.eventDispatcher.removeEventListener(EVENTS.CHANGE_EFFECTS_VOLUME, this._onChangeEffectsVolume, this);
    },

    playMusic: function () {
        this.stopMusic();
        data.backgroundMusicId = cc.audioEngine.play(AUDIO_URLS.BACKGROUND_MUSIC, true, data.musicVolume);
        cc.audioEngine.setVolume(data.backgroundMusicId, data.musicVolume);
        data.isMusicPlaying = true;
    },

    pauseMusic: function () {
        cc.audioEngine.pause(data.backgroundMusicId);
        data.isMusicPlaying = false;
    },

    resumeMusic: function () {
        if (data.backgroundMusicId !== null) {
            cc.audioEngine.resume(data.backgroundMusicId);
        }
    },

    stopMusic: function () {
        cc.audioEngine.stop(data.backgroundMusicId);
        data.backgroundMusicId = null;
        data.isMusicPlaying = false;
    },

    isMusicPlaying: function () {
        return data.isMusicPlaying;
    },

    getMusicVolume: function () {
        var volume = parseInt(this._getSetting(BG_MUSIC_VOLUME_KEY));
        if (volume >= 0) {
            return volume;
        }
        return 1;
    },

    setMusicVolume: function (volume) {
        data.musicVolume = volume;
        cc.audioEngine.setVolume(data.backgroundMusicId, data.musicVolume);
        this._saveSetting(BG_MUSIC_VOLUME_KEY, volume);
    },

    getEffectsVolume: function () {
        var volume = parseInt(this._getSetting(SOUND_EFFECT_VOLUME_KEY));
        if (volume >= 0) {
            return volume;
        }
        return 1;
    },

    setEffectsVolume: function (volume) {
        data.effectsVolume = volume;
        data.eventDispatcher.dispatchEvent(EVENTS.CHANGE_EFFECTS_VOLUME);
        this._saveSetting(SOUND_EFFECT_VOLUME_KEY, volume);
    },

    playEffect: function (clip, loop) {
        if (this.effectPlayableFn && !this.effectPlayableFn()) {
            return;
        }
        var audioId = cc.audioEngine.play(clip, loop, data.effectsVolume);
        cc.audioEngine.setVolume(audioId, data.effectsVolume);
        return audioId;
    },

    stopEffect: function (audioId) {
        if (audioId) {
            cc.audioEngine.stop(audioId);
        }
    },

    playBaiBay: playEffectFactoryFn(AUDIO_URLS.BAI_BAY),
    playBaiChon: playEffectFactoryFn(AUDIO_URLS.BAI_CHON),
    playBaiChia: playEffectFactoryFn(AUDIO_URLS.BAI_CHIA),
    playBallDrop: playEffectFactoryFn(AUDIO_URLS.BALL_DROP),
    playChickenWin: playEffectFactoryFn(AUDIO_URLS.CHICKEN_WIN),
    playChipBay: playEffectFactoryFn(AUDIO_URLS.CHIP_BAY),
    playCoinDrop: playEffectFactoryFn(AUDIO_URLS.COIN_DROP),
    playDanhBai: playEffectFactoryFn(AUDIO_URLS.DANH_BAI),
    playLost: playEffectFactoryFn(AUDIO_URLS.LOST),
    playMiniPoker: playEffectFactoryFn(AUDIO_URLS.MINIPOKER),
    playChickenRow: playEffectFactoryFn(AUDIO_URLS.CHICKEN_ROW),
    playPhomPickCard: playEffectFactoryFn(AUDIO_URLS.PHOM_PICK_CARD),
    playPhomTaiLuot: playEffectFactoryFn(AUDIO_URLS.PHOM_TAI_LUOT),
    playPlayerJoinRoom: playEffectFactoryFn(AUDIO_URLS.PLAYER_JOIN_ROOM),
    playPlayerLeaveRoom: playEffectFactoryFn(AUDIO_URLS.PLAYER_LEAVE_ROOM),
    playReady: playEffectFactoryFn(AUDIO_URLS.READY),
    playThangTrang: playEffectFactoryFn(AUDIO_URLS.THANG_TRANG),
    playTurnStart: playEffectFactoryFn(AUDIO_URLS.TURN_START),
    playVongQuay: playEffectFactoryFn(AUDIO_URLS.VONG_QUAY),
    playWin: playEffectFactoryFn(AUDIO_URLS.WIN),
    playXoc: playEffectFactoryFn(AUDIO_URLS.XOC),
    playBallRun: playEffectFactoryFn(AUDIO_URLS.BALL_RUN),
    playLose: playEffectFactoryFn(AUDIO_URLS.LOSE),
    playButtonClick: playEffectFactoryFn(AUDIO_URLS.BUTTON_CLICK),
    playError: playEffectFactoryFn(AUDIO_URLS.ERROR),

    _saveSetting: function (key, value) {
        cc.sys.localStorage.setItem(key, value);
    },

    _getSetting: function (key) {
        return cc.sys.localStorage.getItem(key);
    },

    _onChangeEffectsVolume: function () {
        this.audioIdList.forEach(function (audioId) {
            cc.audioEngine.setVolume(audioId, data.effectsVolume);
        });
    }
});

// global instance
AudioManager.instance = new AudioManager();
AudioManager.instance.setMusicVolume(AudioManager.instance.getMusicVolume());
AudioManager.instance.setEffectsVolume(AudioManager.instance.getEffectsVolume());

cc.game.on(cc.game.EVENT_HIDE, function () {
    cc.audioEngine.pauseAll();
});

cc.game.on(cc.game.EVENT_SHOW, function () {
    cc.audioEngine.resumeAll();
});

module.exports = AudioManager;
