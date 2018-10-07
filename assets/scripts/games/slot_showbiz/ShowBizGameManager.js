var Utils = require('Utils'),
    Url = require('Url'),
    AuthUser = require('AuthUser'),
    CommonConstant = require('CommonConstant'),
    BaseGameManager = require('BaseGameManager'),
    SmartFoxConstant = require('SmartFoxConstant'),
    NetworkManager = require('NetworkManager'),
    MyNhanConstant = require('MyNhanConstant'),
    ShowBizGameManager;

ShowBizGameManager = Utils.Class({

    $$extends: BaseGameManager,

    $$constructor: function (game, roomId) {
        this.$super.constructor.call(this, game, roomId);

        this.DELAYED_COMMANDS = [
            SmartFoxConstant.Command.MESSAGE.ID,
        ];

        this.gameState = MyNhanConstant.GameState.NONE;
        this.isFreeTurn = false;

        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.UPDATE_GAME.ID, this.onUpdateGame, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.FINISH_GAME.ID, this.onFinishGame, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.UPDATE_USER_INFO.ID, this.onUpdateUser, this);
        this.eventDispatchers.globalCmd.addEventListener(SmartFoxConstant.Command.UPDATE_JAR.ID, this.onUpdateGameJar, this);

        this.eventDispatchers.playCmd.addEventListener(MyNhanConstant.Action.CHANGE_STATE, this.onChangeStateGame, this);
        this.eventDispatchers.playCmd.addEventListener(MyNhanConstant.Action.OPEN_COFFER, this.onOpenCoffer, this);
        this.eventDispatchers.playCmd.addEventListener(MyNhanConstant.Action.UPDATE_AWARD_TYPE, this.onUpdateAwardType, this);

        // History Data
        var gameName = 'show_biz';
        this.historyDataKey = 'data_history_' + gameName + '_user_' + AuthUser.username;
        if (MyNhanConstant.GameType.type === -1) {
            this.historyDataKey = 'data_history_' + gameName + '_free_user_' + AuthUser.username;
        }
        this.historyList = [];
        var his = cc.sys.localStorage.getItem(this.historyDataKey);
        if (his !== undefined && his !== null) {
            this.historyList = JSON.parse(his);
        }
    },

    onUpdateAwardType: function (params) {
        this.eventDispatchers.local.dispatchEvent(MyNhanConstant.Event.UPDATE_AWARD_TYPE, params);
    },

    onUpdateUser: function (params) {
        this.eventDispatchers.local.dispatchEvent(MyNhanConstant.Event.UPDATE_USER_INFO, params);
    },

    onUpdateGameJar: function (params) {
        // cc.log('##### onUpdateGameJar');
        // cc.log(params);
        this.eventDispatchers.local.dispatchEvent(MyNhanConstant.Event.UPDATE_JAR, params);
    },

    onFinishGame: function (params) {
        this.eventDispatchers.local.dispatchEvent(MyNhanConstant.Event.TURN_FINISH, params);
        var type = (this.isFreeTurn ? 'Q.Miễn phí' : (Utils.Number.format(this.betting) + ' ' + (MyNhanConstant.GameType.type === -1 ? CommonConstant.CurrencyType.Xu.CHIP_NAME : CommonConstant.CurrencyType.Ip.CHIP_NAME)));
        var historyData = {
            time: Utils.Date.currentTime(),
            result: params.player.moneyExchange,
            betting: this.betting,
            totalBetting: (this.betting * this.potCount),
            type: type,
        };
        this.historyList.unshift(historyData);
        if (this.historyList.length > 60) {
            this.historyList.splice(this.historyList.length - 1, 1);
        }
        this.isFreeTurn = false;
    },

    saveHistory: function () {
        cc.sys.localStorage.setItem(this.historyDataKey, JSON.stringify(this.historyList));
    },

    onOpenCoffer: function (params) {
        this.eventDispatchers.local.dispatchEvent(MyNhanConstant.Event.OPEN_COFFER, params);
    },

    onChangeStateGame: function (params) {
        // cc.log('##### onChangeStateGame');
        // cc.log(params);
        var gameState = params.gameState;
        if (gameState !== undefined) {
            this.gameState = gameState;
            if (gameState === MyNhanConstant.GameState.ROTATE) {
                this.eventDispatchers.local.dispatchEvent(MyNhanConstant.Event.TURN_START, params);
            }
            else if (gameState === MyNhanConstant.GameState.NONE) {
                this.eventDispatchers.local.dispatchEvent(MyNhanConstant.Event.TURN_PREPARE, params);
            }
        }
    },

    onUpdateGame: function (params) {
        // cc.log('##### onUpdateGame');
        // cc.log(params);
        this.eventDispatchers.local.dispatchEvent(MyNhanConstant.Event.TURN_UPDATE, params);
    },

    sendStartGame: function (betting, pots, currency) {
        this.betting = betting;
        this.potCount = pots.length;
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(MyNhanConstant.Action.ROTATE),
            betting: NetworkManager.SmartFox.type.long(betting),
            pots: NetworkManager.SmartFox.type.byteArray(pots),
            currency: NetworkManager.SmartFox.type.utfString(currency),
        });
    },

    updateAwardType: function () {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(MyNhanConstant.Action.UPDATE_AWARD_TYPE),
        });
    },

    openLuckyCoffer: function (id) {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(MyNhanConstant.Action.OPEN_COFFER),
            id: NetworkManager.SmartFox.type.byte(id),
        });
    },

    destroy: function () {
        this.$super.destroy.call(this);
    },

    getJar: function () {
        var self = this;
        NetworkManager.Http.fetch('GET', Url.Http.GET_JAR, {
            game_id: self.gameId
        }).success(function (results) {
            self.eventDispatchers.local.dispatchEvent(MyNhanConstant.Event.GET_JAR_SUCCESS, results);
        }, {
            cache: 900
        });
    },
});

module.exports = ShowBizGameManager;
