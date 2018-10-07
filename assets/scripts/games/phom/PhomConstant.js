module.exports = {
    Action: {
        DISCARD: 0,
        TAKE_CARD: 1,
        ORDER_HAND: 2,
        PICK_CARD: 3,
        SENT_CARD: 4,
        SHOW_OFF: 5,
        AUTO_SHOW_OFF: 6,
        CHANGE_TURN: 7,
        U_PHOM: 8,
    },
    GameState: {
        NONE: 0,
        WAITING_FOR_PLAYER: 1,
        WAITING_FOR_NEW_GAME: 2,
        DEALING: 3,
        PLAYING: 5,
        FINALIZING: 6,
        FINISH: 7,
    },
    Finish: {
        U: 0,
        THUA_TINH_DIEM: 1,
        VE_NHI: 2,
        VE_BA: 3,
        VE_BET: 4,
        MOM: 5,
        AN_1_CAY: 6,
        AN_2_CAY: 7,
        AN_3_CAY: 8,
        AN_CHOT: 9,
        VE_NHAT: 10
    },
    PlayerState: {
        WAITING: 0,
        READY: 1,
        IN_TURN: 2,
        OUT_TURN: 3,
        WAITING_FOR_TURN: 4,
        FINISH: 5,
    },
    InTurnState: {
        PICK_OR_TAKE_CARD: 0,
        DISCARD: 1,
        SHOW_OFF: 2,
        SEND: 3,
    },
    Event: {
        START_GAME: 'in_game.phom.start_game',
        ADD_PLAYER: 'in_game.phom.add_player',
        REMOVE_PLAYER: 'in_game.phom.remove_player',
        UPDATE_PLAYER: 'in_game.phom.update_player',
        UPDATE_GAME: 'in_game.phom.update_game',
        UPDATE_MASTER: 'in_game.phom.update_master',
        UPDATE_HAND: 'in_game.phom.update_hand',
        DRAW_CARD: 'in_game.phom.draw_card',
        TIME_START: 'in_game.phom.time_start',
        CHANGE_TURN: 'in_game.phom.change_turn',
        DISCARD: 'in_game.phom.discard_response',
        PICK_CARD: 'in_game.phom.pick_card',
        TAKE_CARD: 'in_game.phom.take_card',
        SHOW_OFF: 'in_game.phom.show_off',
        AUTO_SHOW_OFF: 'in_game.phom.auto_show_off',
        SENT_CARD: 'in_game.phom.sent_card',
        SUBMIT_FAILT: 'in_game.phom.sumbit_fail',
        REFRESH_GAME: 'in_game.phom.refresh_game',
        WAITING_DEAL_CARD: 'in_game.phom.waiting_deal_card',
        FINISH_GAME: 'in_game.phom.finish_game',
    },

    Effect: {
        DANG_DANH: 0,
        DANG_HA: 1,
        DANG_BOC: 2,
        DANG_GUI: 3,
        MOM: 4,
        U: 5,
        NHAT: 6,
        NHI: 7,
        BA: 8,
        BET: 9,
        DEN_U: 10,
        TAI_LUOT: 11,
        U_KHONG_CA: 12,
        U_TRON: 13,
        DANG_DOI: 14
    },

    GetTypeAction: function(action) {
        switch (action) {
            case 0:
                return 'discard';
            case 1:
                return 'takecard';
            case 2:
                return 'orderhand';
            case 3:
                return 'pickcard';
            case 4:
                return 'sentcard';
            case 5:
                return 'showoff';
            case 6:
                return 'autoshowoff';
            case 7:
                return 'changeturn';
            default:
                return action;
        }
    },

};
