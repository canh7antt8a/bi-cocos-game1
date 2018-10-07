module.exports = {

    Action: {
        BET: 1,
        RAISE: 2,
        ALL_IN: 3,
        ALL_HAND: 31,
        CALL: 4,
        CHECK: 5,
        FOLD: 6,
        CHANGE_STATE: 7,
        CHANGE_TURN: 8,
        BUY_PRIVATE_MONEY: 9,
        BUY_PRIVATE_MONEY_REQUIRED: 10,
        END_TURN: 11,
        CUT_OFF_MONEY_POKER: 12,
        GET_BUY_PRIVATE_MONEY_INFO: 13
    },

    GameState: {
        NONE: 0,
        WAITING_FOR_PLAYER: 1,
        WAITING_FOR_NEW_GAME: 2,
        DEALING: 3,
        FINALIZING: 6,
        FINISH: 7,
        ROUND: 8
    },

    GameStatePoker: {
        PREFLOP: 8,
        FLOP: 9,
        TURN: 10,
        RIVER: 11
    },

    PlayerState: {
        NONE: 0,
        IN_TURN: 1,
        WAITING_FOR_TURN: 2,
        FOLDED: 3,
        ALL_IN: 4,
        OFF_MONEY: 5
    },

    PlayerType: {
        NORMAL: 0,
        DEALER: 1,
        SMALL_BLIND: 2,
        BIG_BLIND: 3,
    },

    Event: {
        START_TIME: 'in_game.xito.start_time',
        USER_BET: 'in_game.xito.user_bet',
        CHANGE_STATE: 'in_game.xito.change_state',
        CHANGE_TURN: 'in_game.xito.change_turn',
        UPDATE_MONEY: 'in_game.xito.update_money',
        SHOW_CARD_OPEN: 'in_game.xito.show_card_open',
        DRAW_CARD: 'in_game.xito.draw_card',
        FINISH_GAME: 'in_game.xito.finish_game',
        UPDATE_GAME: 'in_game.xito.update_game',
        REFRESH_GAME: 'in_game.xito.refresh_game',
        SHOW_BUY_CHIP: 'in_game.poker.show_buy_chip',
        HIDE_BUY_CHIP_BUTTON: 'in_game.poker.hide_buy_chip_button',
        CUT_OFF_MONEY_POKER: 'in_game.poker.cut_off_money',
    },

    TimeoutId: {
        SHOW_COMMUNITY_CARDS: 'TIMEOUT_SHOW_COMMUNITY_CARDS',
    },

    Effect: {
        TO: 0,
        THEO: 1,
        NHUONG_TO: 2,
        UP_BO: 3,
        CHOI_TAT_TAY: 4,
        DANG_DOI: 9

    },

};
