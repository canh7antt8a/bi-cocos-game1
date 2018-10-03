var BaseGameManager = require('BaseGameManager'),
    SmartFoxConstant = require('SmartFoxConstant'),
    NetworkManager = require('NetworkManager'),
    Utils = require('Utils'),
    AuthUser = require('AuthUser'),
    SanThuongConstant = require('SanThuongConstant'),
    CommonConstant = require('CommonConstant'),
    Url = require('Url'),
    SanThuongGameManager;

SanThuongGameManager = Utils.Class({
    $$extends: BaseGameManager,

    $$constructor: function (gameCmd, roomId, logEnabled) {
        this.$super.constructor.call(this, gameCmd, roomId, logEnabled, true);

        this.DELAYED_COMMANDS = [
            SmartFoxConstant.Command.MESSAGE.ID,
            SmartFoxConstant.Command.DEAL_CARD.ID,
            SmartFoxConstant.Command.TURN.ID,
            SmartFoxConstant.Command.WAITING_DEAL_CARD.ID,
        ];

        this.lstHistory = [];
        this.countFreePlay = this.countOpenHopQua = this.countMoney = this.countMaDuThuong = this.countLucky = 0;
        this.stringKetQua = '';
        this.itemHistoryTmp = [];
        this.isOpenHop = false;
        this.autoPlay = false;
        this.currency = CommonConstant.CurrencyType.Ip.DISPLAY_NAME;
        this.countFreePlay = 0;

        this.lstPiBetting = [];
        this.lstXuBetting = [];
        this.moneyChickenXu = 0;
        this.moneyChickenPi = 0;
        this.moneyBet = 0;

        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.UPDATE_GAME.ID, this.onUpdateGame, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.REFRESH_GAME.ID, this.onUpdateGame, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.FINISH_GAME.ID, this.onFinishGame, this);

        this.eventDispatchers.playCmd.addEventListener(SanThuongConstant.Action.TURN_START, this.onStartGame, this);
        this.eventDispatchers.playCmd.addEventListener(SanThuongConstant.Action.ONPEN_HOP, this.onOpenHop, this);

        this.eventDispatchers.globalCmd.addEventListener(SmartFoxConstant.Command.UPDATE_GAME.ID, this.onUpdateChickenJar, this);
    },

    sendOpenPopupMaDuThuong: function () {
        var self = this,
            listDate = '',
            currentDate = new Date();
        for (var i = 0; i < 7; i += 1) {

            if (listDate.length > 0) {
                currentDate.setDate(currentDate.getDate() - 1);
                listDate += ',' + Utils.Date.format(currentDate, 'yyyy-mm-dd');
            }
            else {
                currentDate.setDate(currentDate.getDate());
                listDate += Utils.Date.format(currentDate, 'yyyy-mm-dd');
            }
        }
        NetworkManager.Http.fetch('GET', Url.Http.CHICKEN_CODE, {
                username: AuthUser.username,
                date_list: listDate,
            })
            .success(function (tnResp) {
                self.eventDispatchers.local.dispatchEvent(SanThuongConstant.Event.CHICKEN_CODE, tnResp.data);
            });

    },

    sendOpentHop: function (id) {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(SanThuongConstant.Action.ONPEN_HOP),
            id: NetworkManager.SmartFox.type.byte(id),
        });
    },

    sendRegQuickPlay: function () {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(SanThuongConstant.Action.REG_QUICK_PLAY),
        });
    },

    sendGetChickenJar: function () {
        var self = this;
        NetworkManager.Http.fetch('GET', Url.Http.CHICKENJAR, {}, {
                cache: 900
            })
            .success(function (respDone) {
                self.moneyChickenXu = respDone.data.XU;
                self.moneyChickenPi = respDone.data.IP;
                self.onUpdateChickenJar();
            });

    },

    sendStartGame: function (autoPlay, moneyBet, pots, currency) {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(SanThuongConstant.Action.START_GAME),
            betting: NetworkManager.SmartFox.type.long(moneyBet),
            pots: NetworkManager.SmartFox.type.byteArray(pots),
            currency: NetworkManager.SmartFox.type.utfString(currency),
        });
        this.currency = CommonConstant.CurrencyType.findByName(currency).DISPLAY_NAME;
        this.moneyBet = pots.length * moneyBet;
        this.autoPlay = autoPlay;
    },

    _setHistoryOpenHop: function () {
        if (this.isOpenHop) {
            this.itemHistoryTmp.push(Utils.Date.format(Date(), 'hh:MM:ss'));
            this.itemHistoryTmp.push('MỞ HỘP');
            this.itemHistoryTmp.push(' ');
            if (this.countLucky > 0) {
                this.stringKetQua += (this.countLucky + ' chúc may mắn, ');
            }
            if (this.countOpenHopQua > 0) {
                this.stringKetQua += (this.countOpenHopQua + ' hộp quà, ');
            }
            if (this.countMoney > 0) {
                this.stringKetQua += (this.countMoney + ' lần tiền cược, ');
            }
            if (this.countFreePlay > 0) {
                this.stringKetQua += (this.countFreePlay + ' lần quay miễn phí, ');
            }
            if (this.countMaDuThuong > 0) {
                this.stringKetQua += (this.countMaDuThuong + ' mã dự thưởng, ');
            }
            this.itemHistoryTmp.push(' ');
            this.itemHistoryTmp.push(this.stringKetQua.substring(0, this.stringKetQua.length - 2));
            this.stringKetQua = '';
            this.isOpenHop = false;
            this.lstHistory.unshift(this.itemHistoryTmp);
            if (this.lstHistory.length > 100) {
                this.lstHistory.pop();
            }
        }

    },

    onOpenHop: function (params) {
        //{summary: Object, results: Array[1], action: 2, command: 20}
        this.eventDispatchers.local.dispatchEvent(SanThuongConstant.Event.OPEN_HOP, params);
        this.isOpenHop = true;
        for (var i = 0; i < params.results.length; i += 1) {
            switch (params.results[i].awardType) {
            case SanThuongConstant.AwardType.NONE:
                this.countLucky += 1;
                break;
            case SanThuongConstant.AwardType.HOPQUA:
                this.countOpenHopQua += params.results[i].ratio;
                break;
            case SanThuongConstant.AwardType.MONEY:
                this.countMoney += params.results[i].ratio;
                break;
            case SanThuongConstant.AwardType.FREE_PLAY:
                this.countFreePlay += params.results[i].ratio;
                break;
            case SanThuongConstant.AwardType.MA_DU_THUONG:
                this.countMaDuThuong += params.results[i].ratio;
                break;
            }
        }



    },

    onUpdateChickenJar: function (params) {
        //{money: 95551, action: 6, command: 25, currency: "IP"}
        if (params) {
            if (params.currency === 'IP') {
                this.moneyChickenPi = params.money;
            }
            else {
                this.moneyChickenXu = params.money;
            }
        }
        this.eventDispatchers.local.dispatchEvent(SanThuongConstant.Event.UPDATE_CHICKEN_JAR);
    },

    onFinishGame: function (params) {
        var countFreePlay = 0,
            countOpenHopQua = 0,
            countMoney = 0,
            countMaDuThuong = 0,
            stringKetQua = '',
            itemHistoryTmp = [];
        this.eventDispatchers.local.dispatchEvent(SanThuongConstant.Event.FINISH, params);
        itemHistoryTmp.push(Utils.Date.format(Date(), 'hh:MM:ss'));
        if (this.autoPlay) {
            if (this.countFreePlay > 0) {
                itemHistoryTmp.push('QUAY MIỄN PHÍ');
            }
            else {
                itemHistoryTmp.push('TỰ QUAY');
            }

        }
        else {
            if (this.countFreePlay > 0) {
                itemHistoryTmp.push('QUAY MIỄN PHÍ');
            }
            else {
                itemHistoryTmp.push('QUAY');
            }
        }
        if (this.countFreePlay <= 0) {
            itemHistoryTmp.push(Utils.Number.format(this.moneyBet) + ' ' + this.currency);
        }
        else {
            itemHistoryTmp.push(' ');
            this.countFreePlay -= 1;
        }
        for (var i = 0; i < params.awards.length; i += 1) {
            switch (params.awards[i].awardType) {
            case SanThuongConstant.AwardType.NONE:
                break;
            case SanThuongConstant.AwardType.HOPQUA:
                countOpenHopQua += params.awards[i].ratio;
                break;
            case SanThuongConstant.AwardType.MONEY:
                countMoney += params.awards[i].ratio;
                break;
            case SanThuongConstant.AwardType.FREE_PLAY:
                countFreePlay += params.awards[i].ratio;
                break;
            case SanThuongConstant.AwardType.MA_DU_THUONG:
                countMaDuThuong += params.awards[i].ratio;
                break;
            }
        }

        if (countOpenHopQua > 0) {
            stringKetQua += (countOpenHopQua + ' hộp quà, ');
        }
        if (countMoney > 0) {
            stringKetQua += (countMoney + ' lần tiền cược, ');
        }
        if (countFreePlay > 0) {
            stringKetQua += (countFreePlay + ' lần quay miễn phí, ');
            this.countFreePlay += countFreePlay;
        }
        if (countMaDuThuong > 0) {
            stringKetQua += (countMaDuThuong + ' mã dự thưởng ');
        }
        itemHistoryTmp.push(Utils.Number.format(params.player.moneyExchange) + ' ' + this.currency);
        itemHistoryTmp.push(stringKetQua.substring(0, stringKetQua.length - 2));
        this.lstHistory.unshift(itemHistoryTmp);
        if (this.lstHistory.length > 100) {
            this.lstHistory.pop();
        }
    },

    onStartGame: function (params) {
        this._setGameState(params.gameState);
        switch (params.gameState) {
        case SanThuongConstant.GameState.EFFECT:
            // if (this.countFreePlay > 0) {
            //     this.countFreePlay -= 1;
            // }
            this.countOpenHopQua = this.countMoney = this.countMaDuThuong = this.countLucky = 0;
            this.stringKetQua = '';
            this.itemHistoryTmp = [];
            this.eventDispatchers.local.dispatchEvent(SanThuongConstant.Event.TURN_START, params.result);
            break;
        case SanThuongConstant.GameState.NONE:
            this.eventDispatchers.local.dispatchEvent(SanThuongConstant.Event.CLEAR_FINISH, params.freeTurns);
            this._setHistoryOpenHop();
            break;
        case SanThuongConstant.GameState.OPEN_HOP:
            this.eventDispatchers.local.dispatchEvent(SanThuongConstant.Event.SHOW_PANEL_DAPHOP, params.count);
            break;

        }
    },

    onUpdateGame: function (params) {
        this._updateListBetting(params.bettingValues);
        this._showRulePot(params.itemsInfo);
    },

    _showRulePot: function (params) {
        this.eventDispatchers.local.dispatchEvent(SanThuongConstant.Event.SET_RULE, params);
    },

    _updateListBetting: function (params) {
        this.lstXuBetting = params.XU;
        this.lstPiBetting = params.IP;
        this.eventDispatchers.local.dispatchEvent(SanThuongConstant.Event.ADD_LIST_BETTING, this.lstPiBetting);
    },

    _setGameState: function (newGameState) {

        if (this.gameState !== newGameState) {
            this.gameState = newGameState;
            this.eventDispatchers.local.dispatchEvent(SanThuongConstant.Event.CHANGE_STATE);
        }
    },
});

module.exports = SanThuongGameManager;
