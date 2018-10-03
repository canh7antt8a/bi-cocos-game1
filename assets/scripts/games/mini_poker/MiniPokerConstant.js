module.exports = {
    Action:{
        ROTATE: 0,
        CHANGE_STATE: 5,
        UPDATE_MINI_POKER_JAR: 6,
    },

    GameState: {
        NONE: 0,
        ROTATE: 1,
        FINALIZING: 2,
        FINISH: 3
    },

    PotType: {
        NONE: 0,
        DOI_J: 1,
        THU: 2,
        SAM: 3,
        SANH: 4,
        THUNG: 5,
        CU_LU: 6,
        TU_QUY: 7,
        THUNG_PHA_SANH: 8,
        THUNG_PHA_SANH_A: 9
    },

    Event: {
        TURN_PREPARE: 'in_game.mini_poker.prepare',
        TURN_START: 'in_game.mini_poker.start',
        TURN_UPDATE: 'in_game.mini_poker.update',
        TURN_FINISH: 'in_game.mini_poker.finish',
        GET_JAR_SUCCESS: 'in_game.mini_poker.get_jar',
        UPDATE_JAR: 'in_game.mini_poker.update_jar',
    },

    getPotName: function (potType) {
        var result = '';
        switch (potType){
            case this.PotType.NONE:
                break;
            case this.PotType.DOI_J:
                result = 'Đôi J+';
                break;
            case this.PotType.THU:
                result = 'Thú';
                break;
            case this.PotType.SAM:
                result = 'Sám';
                break;
            case this.PotType.SANH:
                result = 'Sảnh';
                break;
            case this.PotType.THUNG:
                result = 'Thùng';
                break;
            case this.PotType.CU_LU:
                result = 'Cù Lũ';
                break;
            case this.PotType.TU_QUY:
                result = 'Tứ Quý';
                break;
            case this.PotType.THUNG_PHA_SANH:
                result = 'Thùng Phá Sảnh';
                break;
            case this.PotType.THUNG_PHA_SANH_A:
                result = 'Thùng Phá Sảnh A';
                break;
        }
        return result;
    },
};