module.exports = {
    GameState: {
        NONE: 0,
        WAITING_FOR_PLAYER: 1,
        WAITING_DEALING: 2,
        DEALING: 3,
        ORDER_CARDS: 4,
        PLAYING: 5,
        FINALIZING: 6,
        FINISH: 7,
        COMPARE_1: 8,
        COMPARE_2: 9,
        COMPARE_3: 10,
    },

    Action: {
        ORDER_HANDS: 2,
        ORDER_CARDS: 4,
        WAITING_ORDER_CARDS: 5,
        COMPARE_CHI_MOT: 6,
        COMPARE_CHI_HAI: 7,
        COMPARE_CHI_BA: 8,
        NOTIFY_THANG_TRANG: 9,
        NOTIFY_BINH_LUNG: 10,
        FINISH_ORDER_CARDS: 11,
    },

    PlayerState: {
        WAITING: 0,
        READY: 1,
        IN_TURN: 2,
        OUT_TURN: 3,
        ORDER_CARDS: 4,
        WAITING_FOR_TURN: 5,
        FINISH: 6,
    },

    Event: {
        GAME_PREPARE: 'in_game.mau_binh.prepare',
        GAME_UPDATE_HAND: 'in_game.mau_binh.update_hand',
        GAME_WATING_PLAYER: 'in_game.mau_binh.wating_player',
        GAME_PLAYER_REMOVE: 'in_game.mau_binh.player_remove',
        GAME_PLAYER_ADD: 'in_game.mau_binh.player_add',
        GAME_USER_FINISH_ORDER: 'in_game.mau_binh.finish_order',
        GAME_ORDER_CARD: 'in_game.mau_binh.start',
        GAME_COMPARE_CHI: 'in_game.mau_binh.compare_chi',
        GAME_UPDATE: 'in_game.mau_binh.game_update',
        GAME_FINISH: 'in_game.mau_binh.finish',
        GAME_NOTIFY_THANG_TRANG: 'in_game.mau_binh.thang_trang',
        GAME_NOTIFY_BINH_LUNG: 'in_game.mau_binh.binh_lung',
    },

    Chi: {
        NONE: {
            ID: -1,
            NAME: 'None'
        },
        MAU_THAU: {
            ID: 0,
            NAME: 'Mậu Thầu'
        },
        DOI: {
            ID: 1,
            NAME: 'Đôi'
        },
        THU: {
            ID: 2,
            NAME: 'Thú'
        },
        SAM: {
            ID: 3,
            NAME: 'Sám cô'
        },
        SANH: {
            ID: 4,
            NAME: 'Sảnh'
        },
        THUNG: {
            ID: 5,
            NAME: 'Thùng'
        },
        CU_LU: {
            ID: 6,
            NAME: 'Cù Lũ'
        },
        TU_QUY: {
            ID: 7,
            NAME: 'Tứ Quý'
        },
        THUNG_PHA_SANH: {
            ID: 8,
            NAME: 'Thùng Phá Sảnh'
        },
        LUC_PHE_BON: {
            ID: 9,
            NAME: 'Lục Phé Bôn'
        },
        BA_CAI_SANH: {
            ID: 10,
            NAME: 'Ba Sảnh'
        },
        BA_CAI_THUNG: {
            ID: 1,
            NAME: 'Ba Thùng'
        },
        SANH_RONG: {
            ID: 12,
            NAME: 'Sảnh Rồng'
        },
        BINH_LUNG: {
            ID: 13,
            NAME: 'Binh Lủng'
        },
    },
};
