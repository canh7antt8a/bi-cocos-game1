var Utils = require('Utils');

module.exports = {
    Action: {
        BETTING: 1,
        CHANGE_STATE: 5,
        UPDATE_POTS: 9,
        PING: 10
    },
    GameState: {
        NONE: 0,
        EFFECT: 1,
        PLAYER_BETTING: 2,
        FINISH: 4,
        FINALIZING: 5
    },
    GameStateName: {
        BETTING: 'Người chơi đặt cửa!',
        FINISH: 'Tính tiền!'
    },
    Pot: {
        BIG: {
            ID: 0,
            NAME: 'Tài'
        },
        LITTLE: {
            ID: 1,
            NAME: 'Xỉu'
        },

        findById: function (potId) {
            potId = parseInt(potId, 10);
            return Utils.Object.findObject(this, 'ID', potId);
        }
    },
    Event: {
        CHANGE_STATE: 'in_game.tai_xiu.change_state',
        EFFECT_STATE: 'in_game.tai_xiu.change_state.effect',
        PLAYER_BETTING_STATE: 'in_game.tai_xiu.change_state.player_betting',
        UPDATE_POTS: 'in_game.tai_xiu.update_pots',
        BETTING_SUCCESS: 'in_game.tai_xiu.betting_success',
        UPDATE_TEMP_BETTING: 'in_game.tai_xiu.update_temp_betting',
        FINISH: 'in_game.tai_xiu.finish'
    },
    TimeoutId: {
        SWITCH_CURRENCY: 'SWITCH_CURRENCY',
        ROTATE_DICE: 'ROTATE_DICE',
        SHOW_HISTORY_TRAY: 'SHOW_HISTORY_TRAY'
    }
};
