var Utils = require('Utils');

var GameConstant = {
    /**
     * GAME: {
     *     ID: <game-id>,
     *     NAME: <game-name>,
     *     CMD: <game-cmd>,
     *     SCENE: <game-scene>,
     *     HAS_LOBBY: <game-lobby-is-used-or-not>,
     *     LOBBY_SCENE: <lobby-scene-name>,
     *     IS_SOLO: <is-solo-game-or-not>,
     *     IS_SLOT: <is-slot-game-or-not>,
     *     IS_MINIGAME: <is-minigame-or-not>,
     *     MINIGAME_PREFAB: <minigame-prefab>,
     *     GAME_MANAGER: <game-manager-class>,
     *     LOG: <game-manager-class-log>,
     *     ALONE: <play-alone-or-dont-see-others>,
     *     BUY_MONEY: <buy-money>,
     *     WARNING_MESSAGE_DURATION: <warning-message-duration>,
     *     GAME_OPTION_MODAL_PREFAB: <game-option-modal-prefab>,
     *     VISIBLE_SLOTS: <visible-slots>,
     *     MAX_COMMANDS_PER_MATCH: <max-commands-per-match>,
     *     TOP_PANEL_IN_GAME: {
     *         ENABLE: <is-enabled-or-not>,
     *         REGISTER_QUIT_GAME: <register-quit-game-is-enabled-or-not>,
     *         CHAT: <is-supported-chatting-or-not>,
     *     },
     *     AUTO_JOIN: <auto-join>
     * }
     */
    LOGIN: {
        capchaEnable: false
    },

    // special
    LOBBY: {
        NAME: 'Hall',
        SCENE: 'Lobby',
    },

    MY_NHAN: {
        ID: 26,
        NAME: 'Mỹ Nhân',
        CMD: 'MyNhan',
        HAS_LOBBY: true,
        IS_SLOT: true,
        LOBBY_SCENE: 'LobbyMyNhan',
        SCENE: 'GameplayMyNhan',
        GAME_MANAGER: 'MyNhanGameManager',
        LOG: false,
        VISIBLE_SLOTS: 1,
        TOP_PANEL_IN_GAME: {
            ENABLE: false,
            REGISTER_QUIT_GAME: true,
            CHAT: true
        },
    },

    SHOW_BIZ: {
        ID: -29,
        NAME: 'Show Biz',
        CMD: 'Showbiz',
        HAS_LOBBY: true,
        IS_SLOT: true,
        LOBBY_SCENE: 'LobbyShowBiz',
        SCENE: 'GameplayShowBiz',
        GAME_MANAGER: 'ShowBizGameManager',
        LOG: false,
        VISIBLE_SLOTS: 1,
        TOP_PANEL_IN_GAME: {
            ENABLE: false,
            REGISTER_QUIT_GAME: true,
            CHAT: true
        },
    },

    HAI_TAC: {
        ID: 27,
        NAME: 'Hải Tặc',
        CMD: 'HaiTac',
        HAS_LOBBY: true,
        IS_SLOT: true,
        LOBBY_SCENE: 'LobbyHaiTac',
        SCENE: 'GameplayHaiTac',
        GAME_MANAGER: 'HaiTacGameManager',
        LOG: false,
        VISIBLE_SLOTS: 1,
        TOP_PANEL_IN_GAME: {
            ENABLE: false,
            REGISTER_QUIT_GAME: true,
            CHAT: true
        },
    },

    HOA_QUA: {
        ID: 28,
        NAME: 'Slot 777',
        CMD: 'HoaQua',
        HAS_LOBBY: true,
        IS_SLOT: true,
        LOBBY_SCENE: 'LobbySlotHoaQua',
        SCENE: 'GameplaySlotHoaQua',
        GAME_MANAGER: 'HoaQuaGameManager',
        LOG: false,
        VISIBLE_SLOTS: 1,
        TOP_PANEL_IN_GAME: {
            ENABLE: false,
            REGISTER_QUIT_GAME: true,
            CHAT: true
        },
    },

    MAU_BINH: {
        ID: 16,
        NAME: 'Mậu Binh',
        CMD: 'MauBinh',
        HAS_LOBBY: true,
        SCENE: 'GameplayMauBinh',
        GAME_MANAGER: 'MauBinhGameManager',
        ICON: 'IconGameMauBinh',
        LOG: false,
        BUY_MONEY: true,
        VISIBLE_SLOTS: 4,
        TOP_PANEL_IN_GAME: {
            ENABLE: true,
            REGISTER_QUIT_GAME: true,
            CHAT: true
        }
    },

    MINI_POKER: {
        ID: 8,
        NAME: 'MiniPoker',
        CMD: 'MiniPoker',
        HAS_LOBBY: false,
        IS_MINIGAME: true,
        MINIGAME_PREFAB: 'games/mini_poker/MiniGameMiniPoker',
        GAME_MANAGER: 'MiniPokerGameManager',
        ICON: 'IconGameMiniPoker',
        LOG: false,
        ALONE: true,
        VISIBLE_SLOTS: 1,
        MAX_COMMANDS_PER_MATCH: 20,
        WARNING_MESSAGE_DURATION: 1
    },

    TAY_DU_KY: {
        ID: 24,
        NAME: 'TayDuKy',
        CMD: 'TayDuKy',
        HAS_LOBBY: false,
        IS_MINIGAME: true,
        MINIGAME_PREFAB: 'games/tay_du_ky/TayDuKySlot',
        GAME_MANAGER: 'TayDuKyGameManager',
        ICON: 'IconGameTayDuKy',
        LOG: false,
        ALONE: true,
        VISIBLE_SLOTS: 1,
        MAX_COMMANDS_PER_MATCH: 20,
        WARNING_MESSAGE_DURATION: 1
    },

    TAM_QUOC: {
        ID: 25,
        NAME: 'TamQuoc',
        CMD: 'TamQuoc',
        HAS_LOBBY: false,
        IS_MINIGAME: true,
        MINIGAME_PREFAB: 'games/tam_quoc/TamQuocSlot',
        GAME_MANAGER: 'TamQuocGameManager',
        ICON: 'IconGameTamQuoc',
        LOG: false,
        ALONE: true,
        VISIBLE_SLOTS: 1,
        MAX_COMMANDS_PER_MATCH: 20,
        WARNING_MESSAGE_DURATION: 1
    },

    VONG_QUAY: {
        ID: 22,
        NAME: 'Vòng quay may mắn',
        CMD: 'TripleWheel',
        HAS_LOBBY: false,
        IS_MINIGAME: true,
        MINIGAME_PREFAB: 'games/vong_quay/MiniGameVongquay',
        GAME_MANAGER: 'VongQuayGameManager',
        ICON: 'IconGameVongQuay',
        LOG: false,
        ALONE: true,
        VISIBLE_SLOTS: 1,
        MAX_COMMANDS_PER_MATCH: 20,
        WARNING_MESSAGE_DURATION: 1,
        AUTO_JOIN: false
    },

    XO_SO: {
        ID: 12,
        NAME: 'Xổ số',
        HAS_LOBBY: false,
        IS_MINIGAME: true,
        MINIGAME_PREFAB: 'games/xo_so/MiniGameXoSo',
        ICON: 'IconGameXoSo',
    },

    TAI_XIU: {
        ID: 7,
        NAME: 'Tài xỉu',
        CMD: 'TaiXiu',
        HAS_LOBBY: false,
        IS_MINIGAME: true,
        MINIGAME_PREFAB: 'games/tai_xiu/MiniGameTaiXiu',
        GAME_MANAGER: 'TaiXiuGameManager',
        ICON: 'IconGameTaiXiu',
        LOG: false,
        ALONE: true,
        MAX_COMMANDS_PER_MATCH: 10,
        WARNING_MESSAGE_DURATION: 1
    },

    XITO: {
        ID: 23,
        NAME: 'Xì tố',
        CMD: 'XiTo',
        HAS_LOBBY: true,
        GAME_OPTION_MODAL_PREFAB: 'games/xito/XiToOptionModal',
        SCENE: 'GameplayXito',
        GAME_MANAGER: 'XiToGameManager',
        ICON: 'IconGameXiTo',
        LOG: false,
        BUY_MONEY: true,
        VISIBLE_SLOTS: 5,
        MAX_COMMANDS_PER_MATCH: 100,
        TOP_PANEL_IN_GAME: {
            ENABLE: true,
            REGISTER_QUIT_GAME: true,
            CHAT: true
        }
    },

    XOC_DIA: {
        ID: 2,
        NAME: 'Xóc đĩa',
        CMD: 'XocDia',
        HAS_LOBBY: true,
        SCENE: 'GameplayXocDia',
        GAME_MANAGER: 'XocDiaGameManager',
        ICON: 'IconGameXocDia',
        LOG: false,
        VISIBLE_SLOTS: 8,
        TOP_PANEL_IN_GAME: {
            ENABLE: true,
            REGISTER_QUIT_GAME: true,
            CHAT: true
        }
    },

    BAU_CUA: {
        ID: 3,
        NAME: 'Bầu cua',
        CMD: 'BauCua',
        HAS_LOBBY: true,
        SCENE: 'GameplayBauCua',
        ICON: 'IconGameBauCua',
        GAME_MANAGER: 'BauCuaGameManager',
        LOG: false,
        VISIBLE_SLOTS: 9,
        TOP_PANEL_IN_GAME: {
            ENABLE: true,
            REGISTER_QUIT_GAME: true,
            CHAT: true
        }
    },

    SAN_THUONG: {
        ID: 6,
        NAME: 'Săn thưởng',
        CMD: 'ChickenFeed',
        HAS_LOBBY: false,
        SCENE: 'GameplaySanThuong',
        GAME_MANAGER: 'SanThuongGameManager',
        ICON: 'IconGameSanThuong',
        LOG: false,
        VISIBLE_SLOTS: 1,
        MAX_COMMANDS_PER_MATCH: 20,
        TOP_PANEL_IN_GAME: {
            ENABLE: true,
            REGISTER_QUIT_GAME: false,
            CHAT: false
        }
    },

    ROULTE: {
        ID: 4,
        NAME: 'Roulette',
        CMD: 'Roulette',
        HAS_LOBBY: true,
        SCENE: 'GameplayRoulette',
        GAME_MANAGER: 'RouletteGameManager',
        ICON: 'IconGameRoulette',
        LOG: false,
        VISIBLE_SLOTS: 8,
        TOP_PANEL_IN_GAME: {
            ENABLE: true,
            REGISTER_QUIT_GAME: true,
            CHAT: true
        }
    },

    PHOM: {
        ID: 19,
        NAME: 'Phỏm',
        CMD: 'Phom',
        HAS_LOBBY: true,
        GAME_OPTION_MODAL_PREFAB: 'games/phom/PhomOptionModal',
        SCENE: 'GameplayPhom',
        ICON: 'IconGamePhom',
        GAME_MANAGER: 'PhomGameManager',
        LOG: false,
        VISIBLE_SLOTS: 4,
        TOP_PANEL_IN_GAME: {
            ENABLE: true,
            REGISTER_QUIT_GAME: true,
            CHAT: true
        }
    },

    LIENG: {
        ID: 21,
        NAME: 'Liêng',
        CMD: 'Lieng',
        HAS_LOBBY: true,
        SCENE: 'GameplayLieng',
        GAME_MANAGER: 'LiengGameManager',
        ICON: 'IconGameLieng',
        LOG: false,
        BUY_MONEY: true,
        VISIBLE_SLOTS: 7,
        MAX_COMMANDS_PER_MATCH: 100,
        TOP_PANEL_IN_GAME: {
            ENABLE: true,
            REGISTER_QUIT_GAME: true,
            CHAT: true
        }
    },

    POKER: {
        ID: 18,
        NAME: 'Poker',
        CMD: 'Poker',
        HAS_LOBBY: true,
        SCENE: 'GameplayPoker',
        GAME_MANAGER: 'PokerGameManager',
        ICON: 'IconGamePoker',
        LOG: false,
        BUY_MONEY: true,
        VISIBLE_SLOTS: 7,
        MAX_COMMANDS_PER_MATCH: 100,
        TOP_PANEL_IN_GAME: {
            ENABLE: true,
            REGISTER_QUIT_GAME: true,
            CHAT: true
        }
    },

    TLMN: {
        ID: 1,
        NAME: 'Tiến lên miền nam',
        CMD: 'TLMN',
        HAS_LOBBY: true,
        SCENE: 'GameplayTLMN',
        ICON: 'IconGameTLMN',
        GAME_MANAGER: 'TLMNGameManager',
        LOG: false,
        VISIBLE_SLOTS: 4,
        TOP_PANEL_IN_GAME: {
            ENABLE: true,
            REGISTER_QUIT_GAME: true,
            CHAT: true
        }
    },

    TLMNSolo: {
        ID: 15,
        NAME: 'Tiến lên miền nam Solo',
        CMD: 'TLMN',
        HAS_LOBBY: true,
        SCENE: 'GameplayTLMN',
        GAME_MANAGER: 'TLMNGameManager',
        LOG: false,
        VISIBLE_SLOTS: 4,
        IS_SOLO: true,
        TOP_PANEL_IN_GAME: {
            ENABLE: true,
            REGISTER_QUIT_GAME: true,
            CHAT: true
        }
    },

    SAM: {
        ID: 13,
        NAME: 'Sâm',
        CMD: 'Sam',
        HAS_LOBBY: true,
        SCENE: 'GameplaySam',
        GAME_MANAGER: 'SamGameManager',
        ICON: 'IconGameSam',
        LOG: false,
        VISIBLE_SLOTS: 4,
        TOP_PANEL_IN_GAME: {
            ENABLE: true,
            REGISTER_QUIT_GAME: true,
            CHAT: true
        }
    },

    SAMSolo: {
        ID: 14,
        NAME: 'Sâm Solo',
        CMD: 'Sam',
        HAS_LOBBY: true,
        SCENE: 'GameplaySam',
        GAME_MANAGER: 'SamGameManager',
        LOG: false,
        VISIBLE_SLOTS: 4,
        IS_SOLO: true,
        TOP_PANEL_IN_GAME: {
            ENABLE: true,
            REGISTER_QUIT_GAME: true,
            CHAT: true
        }
    },

    findById: function (gameId) {
        return Utils.Object.findObject(this, 'ID', gameId);
    },

    findByCmd: function (cmd) {
        return Utils.Object.findObject(this, 'CMD', cmd);
    },

    isGameScene: function (scene) {
        var obj = Utils.Object.findObject(this, 'SCENE', scene);
        if (obj && obj.ID) {
            return true;
        }
        return false;
    },

    loadIconsAtlas: function (callback) {
        cc.loader.loadRes('atlats/AtlasIconGame', cc.SpriteAtlas, function (err, atlas) {
            GameConstant.iconsAtlas = atlas;
            if (callback) {
                callback();
            }
        });
    },

    getIconSpriteFrame: function (iconName) {
        if (this.iconsAtlas) {
            return this.iconsAtlas.getSpriteFrame(iconName);
        }
    },

    updateIconsServer: function (icons) {
        this.iconsServer = icons;
    },

    getIconServer: function (gameId) {
        if (this.iconsServer) {
            return this.iconsServer[gameId];
        }
    },

    updateGamePriorities: function (priorities) {
        this.gamePriorities = priorities;
    },

    getGamePriorities: function () {
        return this.gamePriorities || [];
    }
};

module.exports = GameConstant;
