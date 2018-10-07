module.exports = {
    GameType: {
        type: 0,
    },
    BettingList: [],
    BettingFreeList: [],
    Action: {
        ROTATE: 0,
        OPEN_COFFER: 2,
        CHANGE_STATE: 5,
        UPDATE_AWARD_TYPE: 9
    },

    GameState: {
        NONE: 0,
        ROTATE: 1,
        FINALIZING: 2,
        FINISH: 3,
        OPEN_COFFER: 4,
    },

    Event: {
        GET_JAR_SUCCESS: 'in_game.my_nhan.getjarsuccess',
        OPEN_COFFER: 'in_game.my_nhan.opencoffer',
        UPDATE_JAR: 'in_game.my_nhan.updatejar',
        UPDATE_USER_INFO: 'in_game.my_nhan.updateuserinfo',
        UPDATE_AWARD_TYPE: 'in_game.my_nhan.updateAwardType',
        TURN_PREPARE: 'in_game.my_nhan.prepare',
        TURN_START: 'in_game.my_nhan.start',
        TURN_UPDATE: 'in_game.my_nhan.update',
        TURN_FINISH: 'in_game.my_nhan.finish',
    },
};
