var Utils = require('Utils');

module.exports = {
    Action: {
        BETTING: 1,
        CANCEL_BET: 2,
        TURN_MASTER: 3,
        MASTER_SELL_POT: 4,
        CHANGE_STATE: 5,
        UPDATE_POTS: 9,
    },
    GameState: {
        NONE: 0,
        EFFECT: 1,
        PLAYER_BETTING: 2,
        MASTER_CANEL_BET: 3,
        FINISH: 4,
        FINALIZING: 5,
        ROTATE_VONG_QUAY: 6
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
        TURN_START: 'in_game.roulette.turn_start',
        BETTING_SUCCESS: 'in_game.roulette.betting_success',
        ROTATE_VONG_QUAY: 'in_game.roulette.rotate_vong_quay',
        FINISH_GAME: 'in_game.roulette.finish_game',
        CHANGE_STATE: 'in_game.roulette.change_state',
        CANCEL_BET: 'in_game.roulette.cancel_bet',
        BETTING_UPDATEGAME: 'in_game.roulette.betting_updategame',
        ADD_LIST_BETTING: 'in_game.roulette.add_list_betting',
    }
};
