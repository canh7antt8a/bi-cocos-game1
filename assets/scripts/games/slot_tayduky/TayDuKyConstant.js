module.exports = {
    GameState: {
        NONE: 0,
        EFFECT: 1,
        FINALIZING: 5
    },

    Action: {
        START_GAME: 0,
        CHANGE_STATE: 5,
        UPDATE_MINI_POKER_JAR: 6,
        GET_ITEMS_INFO: 9
    },

    AwardType: {
        MONEY: 'money',
        JAR: 'jar'
    },

    Event: {
        TURN_START: 'in_game.tayduky.turn_start',
        CLEAR_FINISH: 'in_game.tayduky.clear_finish',
        FINISH: 'in_game.tayduky.finish',
        GET_JAR_SUCCESS: 'in_game.tayduky.get_jar',
        UPDATE_JAR: 'in_game.tayduky.update_jar',
        SHOW_ITEMS_INFO: 'in_game.tayduky.show_items_info',
        GET_WIN_JAR_LOG: 'in_game.tayduky.get_win_jar_log',
    },
};
