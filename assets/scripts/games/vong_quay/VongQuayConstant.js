module.exports = {
    Action: {
        ROTATE: 0,
        CHANGE_STATE: 5,
        UPDATE_FREE_PLAY: 9,
        UPDATE_WINNER: 10,
        GET_CAPTCHA: 12,
        RENEW_CAPTCHA: 13,
        RESOLVE_CAPTCHA: 14,
    },

    GameState: {
        NONE: 0,
        ROTATE: 1,
        FINALIZING: 2,
        FINISH: 3
    },

    Event: {
        GET_JAR_SUCCESS: 'in_game.vong_quay.getjarsuccess',
        UPDATE_JAR: 'in_game.vong_quay.updatejar',
        TURN_GET_CAPCHA: 'in_game.vong_quay.getcapcha',
        TURN_RESOLVE_CAPCHA: 'in_game.vong_quay.resolve',
        TURN_PREPARE: 'in_game.vong_quay.prepare',
        TURN_START: 'in_game.vong_quay.start',
        TURN_UPDATE: 'in_game.vong_quay.update',
        TURN_FINISH: 'in_game.vong_quay.finish',
    },
};
