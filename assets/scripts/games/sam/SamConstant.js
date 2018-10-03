module.exports = {

    Action: {
        DISCARD: 0,
        IGNORE: 1,
        ORDER_HANDS: 2,
        CHAT_HANG: 3,
        BAO_SAM: 4,
        WAITING_BAO_SAM: 5,
        BAO: 6,
        HUY_BAO_SAM: 7,
        DEN_LANG: 17
    },

    GameState: {
        NONE: 0,
        WAITING_FOR_PLAYER: 1,
        WAITING_FOR_NEW_GAME: 2,
        DEALING: 3,
        BAO_SAM: 4,
        PLAYING: 5,
        FINALIZING: 6,
        FINISH: 7
    },

    GameStateTLMN: {
        NONE: 0,
        WAITING_FOR_PLAYER: 'waitingForPlayer',
        WAITING_FOR_NEW_GAME: 'waitingDealing',
        PLAYING: 'playing',
        FINALIZING: 'finalizing',
        FINISH: 'finish'
    },

    PlayerState: {
        WAITING: 0,
        READY: 1,
        IN_TURN: 2,
        OUT_TURN: 3,
        WAITING_FOR_TURN: 4,
        FINISH: 5
    },

    ActionFinishType: {
        THANG_TRANG: 0,
        THUA_DEM_LA: 13,
        SAM_THANH_CONG: 16,
        SAM_THAT_BAI: 17,
        DEN_LANG_THOI_HAI: 18
    },

    Event: {
        FINISH_GAME: 'in_game.sam.finish_game',
        UPDATE_GAME: 'in_game.sam.update_game',
        UPDATE_HAND: 'in_game.sam.update_hand',
        WAITING_DEAL_CARD: 'in_game.sam.waiting_deal_card',
        WAITING_FOR_PLAYER: 'in_game.sam.waiting_for_player',
        TURN: 'in_game.sam.turn',
        DISCARD: 'in_game.sam.discard',
        REFRESH_GAME: 'in_game.sam.refresh_game',
        CHAT_HANG: 'in_game.sam.chag_hang',
        WAITING_BAO_SAM: 'in_game.sam.bao_sam',
        PLAYER_BAO_SAM: 'in_game.sam.player_bao_sam',
        PLAYER_BAO_MOT: 'in_game.sam.player_bao_mot',
        PLAYER_HUY_BAO_SAM: 'in_game.sam.huy_bao_sam',
    },

    TimeoutId: {
        DISCARD_MUSIC: 'TIMEOUT_DISCARD_MUSIC',
        BOLUOT_ANIMATION: 'TIMEOUT_BOLUOT_ANIMATION',
        CHANGE_TURN: 'TIMEOUT_CHANGE_TURN',
    },

    Effect: {
        THUA_CONG: 0,
        THANG_TRANG: 1,
        CHAN_SAM: 2,
        BAO_SAM: 3,
        BAO: 4,
        DEN_LANG: 5,
        DEN_TRANG: 6,
        HUY_BAO_SAM: 7,
        SAM_THAT_BAI: 8,
        SAM_THANH_CONG: 9,
        DANG_DOI: 10,
        HET_LUOT: 11
    }
};
