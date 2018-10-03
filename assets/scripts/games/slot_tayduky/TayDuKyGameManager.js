var Utils = require('Utils'),
    Url = require('Url'),
    AuthUser = require('AuthUser'),
    BaseGameManager = require('BaseGameManager'),
    SmartFoxConstant = require('SmartFoxConstant'),
    NetworkManager = require('NetworkManager'),
    TayDuKyConstant = require('TayDuKyConstant'),
    CommonConstant = require('CommonConstant'),
    TayDuKyGameManager;
TayDuKyGameManager = Utils.Class({

    $$extends: BaseGameManager,
    $$constructor: function (game, roomId) {
        this.$super.constructor.call(this, game, roomId);

        this.DELAYED_COMMANDS = [
            SmartFoxConstant.Command.MESSAGE.ID,
        ];

        this.gameState = TayDuKyConstant.GameState.NONE;
        this.itemsInfo = null;
        this.lstHistory = [];
        this.itemHistoryTmp = [];
        this.lastMoneyBet = 0;
        this.lastPotWin = 0;
        this.lastCurrency = '';
        this.autoPlay = false;

        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.FINISH_GAME.ID, this.onFinishGame, this);

        this.eventDispatchers.playCmd.addEventListener(TayDuKyConstant.Action.CHANGE_STATE, this.onChangeStateGame, this);
        this.eventDispatchers.playCmd.addEventListener(TayDuKyConstant.Action.START_GAME, this.onStartGame, this);
        this.eventDispatchers.playCmd.addEventListener(TayDuKyConstant.Action.GET_ITEMS_INFO, this.onShowItemsInfo, this);

        this.eventDispatchers.globalCmd.addEventListener(SmartFoxConstant.Command.UPDATE_JAR.ID, this.onUpdateGameJar, this);
        // History Data
        this.historyDataKey = 'data_history_' + game.CONFIG.CMD + '_user_' + AuthUser.username;
        var his = cc.sys.localStorage.getItem(this.historyDataKey);
        if (his !== undefined && his !== null) {
            this.lstHistory = JSON.parse(his);
        }

    },

    sendStartGame: function (autoPlay, moneyBet, pots, currency) {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(TayDuKyConstant.Action.START_GAME),
            betting: NetworkManager.SmartFox.type.long(moneyBet),
            pots: NetworkManager.SmartFox.type.byteArray(pots),
            currency: NetworkManager.SmartFox.type.utfString(currency),
        });
        this.currency = CommonConstant.CurrencyType.findByName(currency).CHIP_NAME;

        this.autoPlay = autoPlay;
    },

    getItemInfo: function () {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(TayDuKyConstant.Action.GET_ITEMS_INFO),
        });
    },

    getTop: function (currency) {
        var self = this;
        NetworkManager.Http.fetch('GET', Url.Http.GET_WIN_JAR_LOG, {
            game_id: self.gameId,
            currency: currency
        }, {
            cache: 900
        }).success(function (results) {
            self.eventDispatchers.local.dispatchEvent(TayDuKyConstant.Event.GET_WIN_JAR_LOG, results);
        });
    },

    getJar: function () {
        var self = this;
        NetworkManager.Http.fetch('GET', Url.Http.GET_JAR, {
            game_id: self.gameId
        }, {
            cache: 900
        }).success(function (results) {
            self.eventDispatchers.local.dispatchEvent(TayDuKyConstant.Event.GET_JAR_SUCCESS, results);
        });
    },

    onStartGame: function (params) {
        this.moneyBet = params.pots.length * params.betting;
    },

    onChangeStateGame: function (params) {
        this._setGameState(params.gameState);
        switch (params.gameState) {
        case TayDuKyConstant.GameState.EFFECT:
            this.eventDispatchers.local.dispatchEvent(TayDuKyConstant.Event.TURN_START, params.result);
            break;
        case TayDuKyConstant.GameState.NONE:
            this.eventDispatchers.local.dispatchEvent(TayDuKyConstant.Event.CLEAR_FINISH);
            break;
        }
    },

    onFinishGame: function (params) {
        var itemHistoryTmp = [],
            stringKetQua = '',
            countRatio = 0,
            stringNoHu = '';
        itemHistoryTmp.push(Utils.Date.format(Date(), 'hh:MM:ss'));
        if (this.autoPlay) {
            itemHistoryTmp.push('TỰ QUAY');
        }
        else {
            itemHistoryTmp.push('QUAY');
        }

        for (var i = 0; i < params.awards.length; i += 1) {
            switch (params.awards[i].awardType) {
            case TayDuKyConstant.AwardType.MONEY:
                countRatio += params.awards[i].ratio;
                break;
            case TayDuKyConstant.AwardType.JAR:
                stringNoHu = params.awards[i].ratio + '% Hũ';
                break;
            }
        }

        itemHistoryTmp.push(Utils.Number.format(this.moneyBet) + ' ' + this.currency);
        itemHistoryTmp.push(Utils.Number.format(params.player.moneyExchange) + ' ' + this.currency);
        if (stringNoHu !== '') {
            stringKetQua = 'x' + countRatio + ' mức cược + ' + stringNoHu;
        }
        else {
            stringKetQua = 'x' + countRatio + ' mức cược';
        }

        itemHistoryTmp.push(stringKetQua.substring(0, stringKetQua.length));
        this.lstHistory.unshift(itemHistoryTmp);
        if (this.lstHistory.length > 100) {
            this.lstHistory.pop();
        }
        this.eventDispatchers.local.dispatchEvent(TayDuKyConstant.Event.FINISH, params);
    },

    saveHistory: function () {
        cc.sys.localStorage.setItem(this.historyDataKey, JSON.stringify(this.lstHistory));
    },

    onUpdateGameJar: function (params) {
        this.eventDispatchers.local.dispatchEvent(TayDuKyConstant.Event.UPDATE_JAR, params);
    },

    onShowItemsInfo: function (params) {
        // if (this.itemsInfo === null) {
        this.itemsInfo = params.itemsInfo;
        this.eventDispatchers.local.dispatchEvent(TayDuKyConstant.Event.SHOW_ITEMS_INFO, params);
        // }
    },

    _setGameState: function (newGameState) {

        if (this.gameState !== newGameState) {
            this.gameState = newGameState;
        }
    },

    destroy: function () {
        this.$super.destroy.call(this);
    },
});

module.exports = TayDuKyGameManager;
