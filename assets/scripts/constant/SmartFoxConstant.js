var Utils = require('Utils');

module.exports = {
    PING_INTERVAL: 30000, // 30s

    Command: {
        EMPTY: {
            ID: -1,
            NAME: ''
        },
        IPLAY: {
            ID: -1,
            NAME: 'IPLAY'
        },
        GLOBAL_ENDPOINT: {
            ID: -1,
            NAME: 'pluginRequest'
        },
        GET_GAME_LIST: {
            ID: 1,
            NAME: 'GET_GAME_LIST'
        },
        GET_GAME_ROOM_LIST: {
            ID: 2,
            NAME: 'GET_GAME_ROOM_LIST'
        },
        UPDATE_USER_INFO: {
            ID: 6,
            NAME: 'UPDATE_USER_INFO'
        },
        MESSAGE: {
            ID: 7,
            NAME: 'MESSAGE'
        },
        KICK_PLAYER: {
            ID: 14,
            NAME: 'KICK_PLAYER'
        },
        PUSH_MESSAGE: {
            ID: 15,
            NAME: 'PUSH_MESSAGE'
        },
        PING: {
            ID: 16,
            NAME: 'PING'
        },
        GET_BETTING_VALUES: {
            ID: 19,
            NAME: 'GET_BETTING_VALUES'
        },
        UPDATE_PRIVATE_USER_MONEY: {
            ID: 100,
            NAME: 'UPDATE_PRIVATE_USER_MONEY'
        },
        DUPLICATE_LOGIN: {
            ID: 101,
            NAME: 'DUPLICATE_LOGIN'
        },
        GET_USER_IDLE_TIME: {
            ID: 102,
            NAME: 'GET_USER_IDLE_TIME'
        },

        PLAY: {
            ID: 20,
            NAME: 'PLAY'
        },
        CREATE_GAME: {
            ID: 21,
            NAME: 'CREATE_GAME'
        },
        PLAYER_ADDED: {
            ID: 22,
            NAME: 'PLAYER_ADDED'
        },
        PLAYER_REMOVED: {
            ID: 23,
            NAME: 'PLAYER_REMOVED'
        },
        UPDATE_HAND: {
            ID: 24,
            NAME: 'UPDATE_HAND'
        },
        UPDATE_GAME: {
            ID: 25,
            NAME: 'UPDATE_GAME'
        },
        UPDATE_GAME_STATE: {
            ID: 26,
            NAME: 'UPDATE_GAME_STATE'
        },
        UPDATE_ROOM_MASTER: {
            ID: 27,
            NAME: 'UPDATE_ROOM_MASTER'
        },
        DEAL_CARD: {
            ID: 28,
            NAME: 'DEAL_CARD'
        },
        TURN: {
            ID: 29,
            NAME: 'TURN'
        },
        FINISH_GAME: {
            ID: 30,
            NAME: 'FINISH_GAME'
        },
        WAITING_DEAL_CARD: {
            ID: 33,
            NAME: 'WAITING_DEAL_CARD'
        },
        WAITING_PLAYER_ADDED: {
            ID: 34,
            NAME: 'WAITING_PLAYER_ADDED'
        },
        WAITING_PLAYER_REMOVED: {
            ID: 35,
            NAME: 'WAITING_PLAYER_ADDED'
        },
        REFRESH_GAME: {
            ID: 36,
            NAME: 'REFRESH_GAME'
        },
        ENTER_GAME: {
            ID: 37,
            NAME: 'ENTER_GAME'
        },
        REG_QUIT_GAME: {
            ID: 38,
            NAME: 'REG_QUIT_GAME'
        },
        DEREG_QUIT_GAME: {
            ID: 39,
            NAME: 'DEREG_QUIT_GAME'
        },
        NEW_MATCH: {
            ID: 40,
            NAME: 'NEW_MATCH'
        },
        REQUEST_BANKER: {
            ID: 41,
            NAME: 'REQUEST_BANKER'
        },
        BANKER_RESIGN: {
            ID: 42,
            NAME: 'BANKER_RESIGN'
        },
        UPDATE_JAR: {
            ID: 43,
            NAME: 'UPDATE_JAR'
        },

        findById: function (cmdId) {
            return Utils.Object.findObject(this, 'ID', cmdId);
        }
    },

    KickReason: {
        NOT_ENOUGH_MONEY: 1,
        NOT_ENOUGH_MONEY_TOBE_BANKER: 5
    }
};
