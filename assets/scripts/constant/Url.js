/**
    Muddle urls info

    btoa(JSON.stringify({
    Http: {
        RT_SV_IP: '/gamecore/v1/game_rt_server_ip',
        GAME_ACCOUNT: '/gamecore/v1/account',

        ...
    }
}))

    module.exports = JSON.parse(atob('encoded_string'));

 */

module.exports = {
    Http: {
        RT_SV_IP: '/gamecore/v1/game_rt_server_ip',
        CHECK_VER: '/gamecore/v1/check_phienban',
        GAME_ACCOUNT: '/gamecore/v1/account',

        TIN_NHAN_TYPES: '/gamecore/v1/pm/kieu_tn',
        THE_CAO_TYPES: '/gamecore/v1/pm/kieusc',
        NAP_THE_CAO: '/gamecore/v1/pm/scrc',
        IAP_TYPES: '/gamecore/v1/payment/iap/products',
        IAP_VERIFY: '/gamecore/v1/payment/google_billing_verify',

        TOP_TYPES: '/gamecore/v1/top/types',

        USER_LOGIN: '/user/v1/login',
        USER_REGISTER: '/user/v1/register',
        USER_QUICK_REGISTER: '/user/v1/quickreg',
        USER_CHANGE_PASSWORD: '/user/v1/change_pass',
        USER_UPDATE_INFO: '/user/v1/update_info',
        USER_UPDATE_AVATAR: '/user/v1/upload_avatar',
        USER_UPDATE_PUSH_REG_ID: '/device/v1/update_push_reg_id',
        USER_ACTIVE_PHONE: '/user/v1/active_mobile_syntax',
        USER_ACTIVE_EMAIL: '/user/v1/active_email',
        USER_FORGET_PASSWORD: '/user/v1/forget_password',

        BANNER: '/gcore/v1/vb/banner',
        GAME_HELP: '/gcore/v1/vb/help_game',
        FEEDBACK: '/gcore/v1/vb/feedback',
        CONTACT_INFO: '/gcore/v1/vb/contact_info',
        MESSAGE_BOX: '/gamecore/v1/account/msg',
        DETAIL_MESSAGE_BOX: '/gamecore/v1/account/msg/',

        DOI_THUONG_GET_CARD_INFO: '/gamecore/v1/doithe/cards_info',
        DOI_THUONG_GET_CARD: '/gamecore/v1/doithe/get_card',
        DOI_THUONG_GET_ITEMS_INFO: '/gamecore/v1/doithe/items_info',
        DOI_THUONG_CARDS_HISTORY: '/gamecore/v1/doithe/user_bill_list',

        MINI_POKER_GET_JAR: '/gamecore/v1/mini_poker/jar',
        MINI_POKER_GET_TOP: '/gamecore/v1/mini_poker/top',

        GET_JAR: '/gamecore/v1/game_jar',
        GET_GAME_JAR_INFO: '/gamecore/v1/game_jars_info',

        CHICKENJAR: '/gamecore/v1/chicken_fund/jar',
        CHICKEN_CODE: '/gamecore/v1/chicken_fund/codelist',

        TAYDUKY_GET_JAR: '/gamecore/v1/tayduky/jar',
        GET_WIN_JAR_LOG: '/gamecore/v1/win_jar_logs',

        TAI_XIU_GET_DAILY_TOP: '/gamecore/v1/tai_xiu/daily_top',

        TRANSFER: '/gamecore/v1/transfer',
        TRANSFER_LOG: '/gamecore/v1/transfer_log',
        MONEY_EX: '/gamecore/v1/money/exchange',

        EVENT_LIST: '/gamecore/v1/event_list',

        DAILY_LIST: '/gamecore/v1/transfer_partner/list',

        INVITE_CODE: '/gamecore/v1/friend/invitecode',
        GIFT_CODE: '/gamecore/v1/giftcode',
        SHARE_FACEBOOK: '/gamecore/v1/facebook/share',
        INVITE_FACEBOOK: '/gamecore/v1/friend/invitefb',

        XOSO_BET: '/gamecore/v1/xoso/bet',
        XOSO_TYPES: '/gamecore/v1/xoso/types',
        XOSO_RESULT: '/gamecore/v1/xoso/result',
        XOSO_BET_LIST: '/gamecore/v1/xoso/bet_list',
        XOSO_USER_BET_LIST: '/gamecore/v1/xoso/user_bet_list',

        TOP_WIN_GAME: '/gamecore/v1/top/win_game',
    }
};
