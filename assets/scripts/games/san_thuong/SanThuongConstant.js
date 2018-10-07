var Utils = require('Utils');

module.exports = {
    Action: {
        START_GAME: 0,
        REG_QUICK_PLAY: 1,
        ONPEN_HOP: 2,
        TURN_MASTER: 3,
        MASTER_SELL_POT: 4,
        TURN_START: 5,
        UPDATE_CHICKEN_JAR: 6,
        UPDATE_POTS: 9,
        PING: 10
    },
    GameState: {
        NONE: 0,
        EFFECT: 1,
        OPEN_HOP: 4,
        FINALIZING: 5
    },
    AwardType: {
        NONE: 0,
        MONEY: 1,
        FREE_PLAY: 2,
        HOPQUA: 3,
        MA_DU_THUONG: 4,
    },
    ChipColor: {
        BLUE: {
            ID: 0,
            NAME: 'blue'
        },

        PURPLE: {
            ID: 1,
            NAME: 'purple'
        },

        GREEN: {
            ID: 2,
            NAME: 'green'
        },

        RED: {
            ID: 3,
            NAME: 'red'
        },

        findById: function (potId) {
            potId = parseInt(potId, 10);
            return Utils.Object.findObject(this, 'ID', potId);
        }
    },
    Event: {
        TURN_START: 'in_game.san_thuong.turn_start',
        EFFECT_STATE: 'in_game.san_thuong.change_state.effect',
        PLAYER_BETTING_STATE: 'in_game.san_thuong.change_state.player_betting',
        UPDATE_POTS: 'in_game.san_thuong.update_pots',
        FINISH: 'in_game.san_thuong.finish',
        SELECT_CHIP: 'in_game.san_thuong.select_chip',
        ADD_LIST_BETTING: 'in_game.san_thuong.add_list_betting',
        SET_RATIO: 'in_game.san_thuong.set_ratio',
        BETTING_UPDATEGAME: 'in_game.san_thuong.betting_updategame',
        UPDATE_CHICKEN_JAR: 'in_game.san_thuong.update_chicken_rar',
        CLEAR_FINISH: 'in_game.san_thuong.clear_finish',
        SHOW_PANEL_DAPHOP: 'in_game.san_thuong.show_panel_daphop',
        OPEN_HOP: 'in_game.san_thuong.open_hop',
        SET_RULE: 'in_game.san_thuong.set_rule',
        CHICKEN_CODE: 'in_game.san_thuong.checken_code',
    }
};
