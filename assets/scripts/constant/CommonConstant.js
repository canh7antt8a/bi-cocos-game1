var Utils = require('Utils');

module.exports = {
    Scene: {
        HALL: 'Hall',
        LOBBY: 'Lobby',
        SPLASH: 'Splash',
        PROFILE: 'Profile',
        LOGIN: 'Login',
    },

    CurrencyType: {
        Ip: {
            ID: 0,
            NAME: 'IP',
            DISPLAY_NAME: 'Vgold',
            CHIP_NAME: 'V',
            CHIP_COLOR: new cc.Color(255, 241, 0),
            REGEX: /\b(pi|ip)\b/gi
        },
        Xu: {
            ID: 1,
            NAME: 'XU',
            DISPLAY_NAME: 'Xu',
            CHIP_NAME: 'Xu',
            CHIP_COLOR: new cc.Color(238, 238, 238),
            REGEX: /\bxu\b/gi
        },

        findById: function (currencyId) {
            return Utils.Object.findObject(this, 'ID', currencyId);
        },

        findByName: function (currencyName) {
            return Utils.Object.findObject(this, 'NAME', currencyName);
        },

        normalize: function (str, caseType) {
            caseType = caseType || Utils.String.CaseType.NONE;
            [this.Ip, this.Xu].forEach(function (currencyType) {
                var replace_str = Utils.String.changeCase(currencyType.DISPLAY_NAME, caseType);
                str = str.replace(currencyType.REGEX, replace_str);
            });
            return str;
        }
    },

    PushMessageType: {
        MESSAGE: {
            ID: 0,
            EVENT: 'push_message.temporary_message'
        },
        POPUP: {
            ID: 1,
            EVENT: 'push_message.popup'
        },
        RUNNING: {
            ID: 2,
            EVENT: 'push_message.running'
        },
        TAT_TN: {
            ID: 3,
            EVENT: 'push_message.tat_tn'
        },
        UPDATE_USER_INFO: {
            ID: 4,
            EVENT: 'push_message.update_user_info'
        },

        findById: function (messageTypeId) {
            return Utils.Object.findObject(this, 'ID', messageTypeId);
        },
    },

    ZINDEX: {
        MINIGAME_QUICK_ICON: 1000003,
        MINIGAME_POPUP: 1000003,
        MINIGAME_PREFAB: 1000000,
        WARNING_MESSAGE: 1000002,
        MODAL: 1000001,
    }
};
