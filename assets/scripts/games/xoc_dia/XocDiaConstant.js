var Utils = require('Utils');

module.exports = {
    Action: {
        BETTING: 1,
        CANCEL_BET: 2,
        TURN_MASTER: 3,
        MASTER_SELL_POT: 4,
        CHANGE_STATE: 5,
        UPDATE_POTS: 9,
        PING: 10
    },
    GameState: {
        NONE: 0,
        EFFECT: 1,
        PLAYER_BETTING: 2,
        MASTER_CANEL_BET: 3,
        FINISH: 4,
        FINALIZING: 5
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
        CHANGE_STATE: 'in_game.tai_xiu.change_state',
        EFFECT_STATE: 'in_game.tai_xiu.change_state.effect',
        PLAYER_BETTING_STATE: 'in_game.xoc_dia.change_state.player_betting',
        UPDATE_POTS: 'in_game.tai_xiu.update_pots',
        BETTING_SUCCESS: 'in_game.xoc_dia.betting_success',
        SHAKE_BOW_DICE: 'in_game.xoc_dia.shake',
        CANCEL_BET: 'in_game.xoc_dia.cancel_bet',
        FINISH: 'in_game.xoc_dia.finish',
        SELECT_CHIP: 'in_game.xoc_dia.select_chip',
        ADD_LIST_BETTING: 'in_game.xoc_dia.add_list_betting',
        ADD_BANKER: 'in_game.xoc_dia.add_banker',
        SET_RATIO: 'in_game.xoc_dia.set_ratio',
        BETTING_UPDATEGAME: 'in_game.xoc_dia.betting_updategame',
        MASTER_CANEL_BET: 'in_game.xoc_dia.master_cancel_bet',
        MASTER_CANEL_BET_RECEIVE: 'in_game.xoc_dia.master_cancel_bet_receive',
    }
};
