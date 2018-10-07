var RowInforTayDuKy = require('RowInforTayDuKy'),
    TayDuKyConstant = require('TayDuKyConstant'),
    UiManager = require('UiManager'),
    AuthUser = require('AuthUser'),
    BaseMinigameGameplay = require('BaseMinigameGameplay'),
    GameConstant = require('GameConstant'),
    CommonConstant = require('CommonConstant'),
    ToggleCurrency = require('ToggleCurrency'),
    Utils = require('Utils'),
    JarInfo = require('JarInfo'),
    EventDispatcher = require('EventDispatcher');
cc.Class({
    extends: BaseMinigameGameplay,

    properties: {
        potInfor: {
            'default': [],
            type: cc.Node,
        },
        rowInfor: {
            'default': [],
            type: RowInforTayDuKy,
        },
        btnMucCuocList: {
            default: [],
            type: cc.Node
        },
        lineResult: {
            'default': [],
            type: cc.Node,
        },
        items: {
            'default': [],
            type: cc.Node,
        },
        awards: {
            'default': [],
            type: cc.Label,
        },
        itemPrefab: cc.Prefab,
        itemSprite: {
            default: [],
            type: cc.Prefab
        },
        btnCurrency: cc.Node,
        lblQuy: cc.Label,
        lblNumberPotActive: cc.Label,
        btnQuay: cc.Button,
        btnTuQuay: cc.Button,
        // imgDen1: cc.Node,
        // imgDen2: cc.Node,
        popupChonCua: cc.Node,
        popupHelp: cc.Node,
        effectNode: cc.Node,
        effectNoHuNode: cc.Node,
        lblJarRatio: cc.Label,
        lblMoneyExchange: cc.Label,
        gameCmd: {
            'default': GameConstant.TAY_DU_KY.CMD,
            visible: false
        },

    },

    $onLoad: function () {
        this.quyXuList = [];
        this.quyPiList = [];
        this.isDoneFinish = true;
        this.isDoneEfect = true;
        this.autoPlay = false;
        this.moneyPiBetList = [100, 1000, 10000];
        this.moneyXuBetList = [1000, 10000, 100000];
        this.currentMoneyQuy = 0;
        this.numberItemHelp = 0;
        this.padding = 165;
        this.isFirstOpen = true;

        this.resetButtonMucCuoc();
        this.clearLineFinish();
        this.onClickTatCa();
        this._setOnClickPot();

        this._effectWin();
        this._effectNoHu();
        this.gameManager.getJar();

        this.gameManager.eventDispatchers.local.addEventListener(TayDuKyConstant.Event.TURN_START, this.onStartGame, this);
        this.gameManager.eventDispatchers.local.addEventListener(TayDuKyConstant.Event.CLEAR_FINISH, this.onWaitStartGame, this);
        this.gameManager.eventDispatchers.local.addEventListener(TayDuKyConstant.Event.FINISH, this.onFinishGame, this);
        this.gameManager.eventDispatchers.local.addEventListener(TayDuKyConstant.Event.GET_JAR_SUCCESS, this.onGetJarSuccess, this);
        this.gameManager.eventDispatchers.local.addEventListener(TayDuKyConstant.Event.GET_WIN_JAR_LOG, this.onGetTopSuccess, this);
        this.gameManager.eventDispatchers.local.addEventListener(TayDuKyConstant.Event.UPDATE_JAR, this.onUpdateJar, this);
        this.gameManager.eventDispatchers.local.addEventListener(TayDuKyConstant.Event.SHOW_ITEMS_INFO, this.showItemsInfo, this);
    },

    $onFocus: function () {
        if (this.gameManager.gameState === TayDuKyConstant.GameState.EFFECT) {
            this.isDoneEfect = true;
        }
        this.clearLineFinish();
    },

    onEnable: function () {
        if (this.isFirstOpen) {
            this.isFirstOpen = false;
        }
        else {
            this.reset();

            // Auto Play
            if (this.autoPlay && this.gameManager.gameState === TayDuKyConstant.GameState.NONE) {
                this.onPlayClick();
            }
        }
    },

    reset: function () {
        this.isDoneEfect = true;
        this.isDoneFinish = true;
        if (this.autoPlay) {
            this.btnQuay.getComponent(cc.Button).interactable = false;
        }
        else {
            this.btnQuay.getComponent(cc.Button).interactable = true;
        }
        for (var i = 0; i < this.rowInfor.length; i += 1) {
            var layoutItem = this.rowInfor[i];
            if (layoutItem) {
                layoutItem.node.stopAllActions();
                layoutItem.node.y = -(layoutItem.node.height - this.padding);
            }
        }
    },

    //--------------------------------------------------------------------------
    // Button click
    onPlayClick: function () {
        // if (Utils.Game.isFocus()) {
        this.audioManager.playButtonClick();
        this.effectNode.active = false;
        this.effectNoHuNode.active = false;
        this.lblMoneyExchange.string = 0;
        this.lblMoneyExchange.node.active = false;
        this.isNoHu = false;
        this.ratioJar = 0;
        var isPI = this.currencyIndex === 0 || this.currencyIndex === undefined;
        var currency = isPI ? CommonConstant.CurrencyType.Ip.NAME : CommonConstant.CurrencyType.Xu.NAME;
        var mucCuocIndex = this._getMoneySelectIndex();
        var money = isPI ? this.moneyPiBetList[mucCuocIndex] : this.moneyXuBetList[mucCuocIndex];
        if (AuthUser.currencies[currency].balance < money * this._getPotSelect().length) {
            var nameButton = this.btnTuQuay.getComponentInChildren(cc.Label);
            nameButton.string = 'TỰ QUAY';
            this.btnQuay.getComponent(cc.Button).interactable = true;
            this.autoPlay = false;
        }
        if (this._getPotSelect().length > 0) {
            if (this.isDoneEfect && this.isDoneFinish) {
                this.gameManager.sendStartGame(this.autoPlay, money, this._getPotSelect(), currency);
            }

        }
        else {
            UiManager.openWarningMessage('Bạn phải chọn cửa đặt trước khi quay.');
        }
    },

    onClickTuQuay: function () {
        this.audioManager.playButtonClick();
        var nameButton = this.btnTuQuay.getComponentInChildren(cc.Label);
        if (!this.autoPlay) {
            nameButton.string = 'HỦY';
            this.autoPlay = true;
            this.btnQuay.getComponent(cc.Button).interactable = false;
            if (this.isDoneEfect && this.isDoneFinish) {
                this.onPlayClick();
            }
        }
        else {
            nameButton.string = 'TỰ QUAY';
            this.autoPlay = false;
            if (this.isDoneEfect && this.isDoneFinish) {
                this.btnQuay.getComponent(cc.Button).interactable = true;
            }
        }

    },

    onCurrencyClick: function () {
        this.audioManager.playButtonClick();
        if (this.autoPlay) {
            UiManager.openWarningMessage('Đang quay không thể thay đổi loại cược!', 1);
        }
        else {
            if (this.isDoneFinish && this.isDoneEfect) {
                this.btnCurrency.getComponent('ToggleCurrency').click();
                this.currencyIndex = this.btnCurrency.getComponent(ToggleCurrency).index;
                this.resetButtonMucCuoc();
                this._updateMoneyQuy();
            }
            else {
                UiManager.openWarningMessage('Đang quay không thể thay đổi loại cược!', 1);
            }
        }
    },

    onClickMucCuoc: function (param) {
        this.audioManager.playButtonClick();
        if (this.autoPlay) {
            UiManager.openWarningMessage('Đang quay không thể thay đổi mức cược!', 1);
        }
        else {
            if (this.isDoneFinish && this.isDoneEfect) {
                var sprite = param.target.getComponent(cc.Sprite);
                for (var i = 0; i < this.btnMucCuocList.length; i += 1) {
                    var s = this.btnMucCuocList[i].getComponent(cc.Sprite);
                    s.enabled = s === sprite;
                }
                this._updateMoneyQuy();
            }
            else {
                UiManager.openWarningMessage('Đang quay không thể thay đổi mức cược!', 1);
            }
        }
    },

    onClickDongLe: function () {
        this.audioManager.playButtonClick();
        if (this.autoPlay) {
            UiManager.openWarningMessage('Đang quay không thể thay đổi cửa đặt!', 1);
        }
        else {
            if (this.isDoneFinish && this.isDoneEfect) {
                this.onClickHuy();
                for (var i = 0; i < this.potInfor.length; i += 2) {
                    var pot = this.potInfor[i].getComponent('PotInforSanThuong');
                    pot.activePot(true);
                    pot.node.opacity = 255;
                }
                this._showPot();
            }
            else {
                UiManager.openWarningMessage('Đang quay không thể thay đổi cửa đặt.');
            }
        }
    },

    onClickDongChan: function () {
        this.audioManager.playButtonClick();
        if (this.autoPlay) {
            UiManager.openWarningMessage('Đang quay không thể thay đổi cửa đặt!', 1);
        }
        else {
            if (this.isDoneFinish && this.isDoneEfect) {
                this.onClickHuy();
                for (var i = 1; i < this.potInfor.length; i += 2) {
                    var pot = this.potInfor[i].getComponent('PotInforSanThuong');
                    pot.activePot(true);
                    pot.node.opacity = 255;
                }
                this._showPot();
            }
            else {
                UiManager.openWarningMessage('Đang quay không thể thay đổi cửa đặt.');
            }
        }
    },

    onClickTatCa: function () {
        this.audioManager.playButtonClick();
        if (this.autoPlay) {
            UiManager.openWarningMessage('Đang quay không thể thay đổi cửa đặt!', 1);
        }
        else {
            if (this.isDoneFinish && this.isDoneEfect) {
                for (var i = 0; i < this.potInfor.length; i += 1) {
                    var pot = this.potInfor[i].getComponent('PotInforSanThuong');
                    pot.activePot(true);
                    pot.node.opacity = 255;
                }
                this._showPot();
            }
            else {
                UiManager.openWarningMessage('Đang quay không thể thay đổi cửa đặt.');
            }
        }
    },

    onClickHuy: function () {
        this.audioManager.playButtonClick();
        if (this.autoPlay) {
            UiManager.openWarningMessage('Đang quay không thể thay đổi cửa đặt!', 1);
        }
        else {
            if (this.isDoneFinish && this.isDoneEfect) {
                for (var i = 0; i < this.potInfor.length; i += 1) {
                    var pot = this.potInfor[i].getComponent('PotInforSanThuong');
                    pot.activePot(false);
                    pot.node.opacity = 128;
                }
                this._showPot();
            }
            else {
                UiManager.openWarningMessage('Đang quay không thể thay đổi cửa đặt.');
            }
        }
    },

    onClickHelp: function () {
        this.audioManager.playButtonClick();
        // if (this.gameManager.itemsInfo === null) {
        this.gameManager.getItemInfo();
        // } else {
        // this.showItemsInfo();
        // }
    },

    onClickHistory: function () {
        this.audioManager.playButtonClick();
        var self = this;
        UiManager.openModalByName('games/tay_du_ky/HistoryTayDuKy', function (historyTable) {
            historyTable.getComponent('HistoryTableTayDuKy').init(self.gameManager.lstHistory);
        });
    },

    onClickTop: function () {
        this.audioManager.playButtonClick();
        var self = this;
        UiManager.openModalByName('games/tay_du_ky/TopUserTayDuKy', function (topTable) {
            var topUserTayDu = topTable.getComponent('TopUserTayDuKy');
            topUserTayDu.gameid = self.gameManager.gameId;
            topUserTayDu.getWinJarLog(self.gameManager.gameId, CommonConstant.CurrencyType.Ip.NAME, topUserTayDu.contentItemPi, topUserTayDu.historyDataPi);
        });
    },

    onCloseClick: function () {
        this.audioManager.playButtonClick();
        this.node.active = false;
        this.gameManager.saveHistory();
        this.node.scale = 0;
    },
    //--------------------------------------------------------------------------
    clearAll: function () {
        this.effectNode.active = false;
        this.effectNoHuNode.active = false;
        this.lblMoneyExchange.string = 0;
        this.lblMoneyExchange.node.active = false;
        this.clearLineFinish();
    },

    onWaitStartGame: function () {
        this.clearAll();
        this.isDoneFinish = true;
        if ((!Utils.Game.isFocus() || !this.node.active) && this.autoPlay) {
            this.isDoneEfect = true;
            this.onPlayClick();
        }
        else {
            this._checkDoneFinish();
        }
    },

    onStartGame: function (params) {
        if (Utils.Game.isFocus() && this.node.active) {
            var self = this;
            self.node.stopAllActions();
            if (self.actionFinish && self.actionFinish.target) {
                self.node.stopAction(self.actionFinish);
                self.actionFinish = null;
            }
            this.clearAll();
            this._checkActiveButton();

            self.isDoneFinish = false;
            self.isDoneEfect = false;
            self._checkActiveButton();
            // Den nhap nhay
            // this.imgDen1.opacity = 255;
            // this.imgDen2.opacity = 0;
            // this.imgDen1.stopAllActions();
            // this.imgDen2.stopAllActions();
            // var action = cc.repeatForever(cc.sequence(cc.fadeIn(0), cc.delayTime(0.2), cc.fadeOut(0), cc.delayTime(0.2)));
            // var action1 = cc.repeatForever(cc.sequence(cc.fadeOut(0), cc.delayTime(0.2), cc.fadeIn(0), cc.delayTime(0.2)));
            // this.imgDen1.runAction(action1);
            // this.imgDen2.runAction(action);

            // Quay
            var action2 = cc.sequence(
                cc.callFunc(function () {
                    self._addChipFinish(params);
                    for (var i = 0; i < self.rowInfor.length; i += 1) {
                        self.rowInfor[i].node.stopAllActions();
                        self.rowInfor[i].node.y = -self.padding;
                    }
                }),
                cc.delayTime(0.3),
                cc.callFunc(function () {
                    for (var i = 0; i < self.rowInfor.length; i += 1) {
                        var action = cc.sequence(cc.moveTo((3 - (i * 0.3)), cc.v2(self.rowInfor[i].node.x, -(self.rowInfor[i].node.height - self.padding)))).easing(cc.easeInOut(2.0));
                        self.rowInfor[i].node.runAction(action);
                    }
                })
            );
            action2.easing(cc.easeQuadraticActionOut());
            this.node.runAction(action2);
        }
    },

    onFinishGame: function (params) {
        var self = this;
        var action = [];
        if (Utils.Game.isFocus() && self.node.active) {
            // action.push(cc.delayTime(5));
            action.push(cc.callFunc(function () {
                self._showLineFinish(params.awards);
                self.effectNode.active = true;
                // var moneyExchange = params.player.moneyExchange + self.gameManager.moneyBet;
                self.lblMoneyExchange.string = (params.player.moneyExchange > 0 ? '+' : '') + Utils.Number.format(params.player.moneyExchange);
                self.lblMoneyExchange.node.active = true;
            }));
            self.node.runAction(cc.sequence(action));
            this.actionFinish = action;
        }

    },

    showItemsInfo: function () {
        this.popupHelp.active = true;
        if (this.numberItemHelp === 0 && this.gameManager.itemsInfo) {
            for (var i = 0; i < this.gameManager.itemsInfo.length; i += 1) {
                for (var j = 0; j < this.gameManager.itemsInfo[i].awards.length; j += 1) {
                    var award = this.gameManager.itemsInfo[i].awards[j];
                    this.items[this.numberItemHelp].removeAllChildren();
                    for (var k = 0; k < award.number; k += 1) {
                        var item = cc.instantiate(this.itemSprite[this.gameManager.itemsInfo[i].id - 1]);
                        // item.getComponent(cc.Sprite).spriteFrame = this.itemSprite[this.gameManager.itemsInfo[i].id - 1];
                        this.items[this.numberItemHelp].addChild(item);
                        item.y = 0;
                        item.scale = 0.7;
                    }
                    if (award.awardType === TayDuKyConstant.AwardType.JAR) {
                        this.awards[this.numberItemHelp].string = award.ratio + '% Hũ';
                    }
                    else {
                        this.awards[this.numberItemHelp].string = 'x' + award.ratio + ' lần';
                    }
                    this.numberItemHelp += 1;
                }
            }
        }
        this.numberItemHelp = 0;
    },

    closeHelp: function () {
        this.audioManager.playButtonClick();
        this.popupHelp.active = false;
    },

    _showLineFinish: function (params) {
        var self = this;
        for (var i = 0; i < this.lineResult.length; i += 1) {
            this.lineResult[i].parent.opacity = 120;
        }

        function doneFinish() {
            return function () {
                self.isDoneEfect = true;
                self._checkDoneFinish();
            };
        }

        function showPotWrapper(pot, ratio, awardType, isShow) {
            return function () {
                if (isShow) {
                    self.lineResult[pot - 1].parent.opacity = 255;
                    self.lineResult[pot - 1].active = true;
                }
                else {
                    self.lineResult[pot - 1].active = false;
                }
            };
        }

        var actions = [];
        if (params.length > 0) {
            for (i = 0; i < params.length; i += 1) {
                actions.push(cc.callFunc(showPotWrapper(params[i].pot, params[i].ratio, params[i].awardType, true)));
                if (params[i].awardType === TayDuKyConstant.AwardType.JAR) {
                    this.isNoHu = true;
                    this.ratioJar = params[i].ratio;
                }
            }
            if (this.isNoHu) {
                this.lblJarRatio.string = this.ratioJar + '%';
                this.effectNoHuNode.active = true;
            }
            // actions.push(cc.delayTime(2));
            actions.push(cc.callFunc(doneFinish()));
        }
        else {
            // actions.push(cc.delayTime(2));
            actions.push(cc.callFunc(doneFinish()));
        }
        var action = cc.sequence(actions);
        if (action && self.node.active && Utils.Game.isFocus()) {
            self.node.runAction(action);
        }
    },

    _checkDoneFinish: function () {
        while (this.isDoneEfect && this.isDoneFinish) {
            this.actionFinish = null;
            if (this.autoPlay) {
                this.onPlayClick();
            }
            else {
                this.effectNode.active = false;
                this.effectNoHuNode.active = false;
                this.lblMoneyExchange.string = 0;
                this.lblMoneyExchange.node.active = false;
                this._checkActiveButton();
            }
            break;
        }
    },

    _addChipFinish: function (params) {
        var chips = params;
        chips.reverse();
        for (var i = 0; i < this.rowInfor.length; i += 1) {
            var row = this.rowInfor[i];
            row.initItemFinish(chips, i);
        }
    },

    _initItemFinish: function (rowIndex, value) {
        var row = this.rowInfor[rowIndex];
        row.initItemFinish(value - 1);
    },

    _updateMoneyQuy: function () {
        this.effectNode.active = false;
        this.effectNoHuNode.active = false;
        this.lblMoneyExchange.string = 0;
        this.lblMoneyExchange.node.active = false;
        if (this.currencyIndex === undefined) {
            this.currencyIndex = 0;
        }
        var isPI = this.currencyIndex === 0;
        this.newMoneyQuy = isPI ? this.quyPiList[this._getMoneySelectIndex()] : this.quyXuList[this._getMoneySelectIndex()];
        this.currentMoneyQuy = this.newMoneyQuy;
        this.cacheMoneyQuy = this.newMoneyQuy;
        if (Utils.Type.isNumber(this.newMoneyQuy)) {
            this.lblQuy.string = Utils.Number.format(Math.floor(this.newMoneyQuy));
        }
        this.clearEffectUpdateMoneyQuy();
    },

    _effectUpdateMoneyQuy: function () {
        if (this.node.active) {
            this.cacheMoneyQuy = this.newMoneyQuy;
            var INTERVAL = 100,
                timeLeft = 6000,
                count = (this.newMoneyQuy - this.currentMoneyQuy) / (timeLeft / INTERVAL);

            this._stopTimestamp = Date.now() + timeLeft;
            this._countDownIntervalId = setInterval(function () {
                var t = this._stopTimestamp - Date.now();
                if (t >= 0 && this.lblQuy) {
                    this.currentMoneyQuy += count;
                    if (this.currentMoneyQuy > this.cacheMoneyQuy) {
                        this.currentMoneyQuy = this.cacheMoneyQuy;
                    }
                    if (this.currentMoneyQuy < 0) {
                        this.currentMoneyQuy = 0;
                    }
                    if (Utils.Type.isNumber(this.currentMoneyQuy)) {
                        this.lblQuy.string = Utils.Number.format(Math.floor(this.currentMoneyQuy));
                    }
                }
                else {
                    this.clearEffectUpdateMoneyQuy();
                }
            }.bind(this), INTERVAL);
        }
        else {
            this.lblQuy.string = Utils.Number.format(Math.floor(this.newMoneyQuy));
        }
    },

    _effectWin: function () {
        this.effectNode.runAction(cc.repeatForever(cc.rotateBy(5.0, 360)));
        this.effectNode.active = false;
    },

    _effectNoHu: function () {
        this.effectNoHuNode.runAction(cc.repeat(
            cc.sequence(cc.scaleTo(0.5, 0.7), cc.scaleTo(0.5, 1)), 10));
        this.effectNoHuNode.active = false;
    },

    clearEffectUpdateMoneyQuy: function () {
        if (this._countDownIntervalId) {
            clearInterval(this._countDownIntervalId);
            this._countDownIntervalId = null;
            if (Utils.Type.isNumber(this.cacheMoneyQuy)) {
                this.lblQuy.string = Utils.Number.format(this.cacheMoneyQuy);
            }
            this.currentMoneyQuy = this.cacheMoneyQuy;
            if (this.currentMoneyQuy !== this.newMoneyQuy) {
                this._effectUpdateMoneyQuy();
            }
        }
    },

    _getMoneySelectIndex: function () {
        var index = 0;
        for (var i = 0; i < this.btnMucCuocList.length; i += 1) {
            var s = this.btnMucCuocList[i].getComponent(cc.Sprite);
            if (s.enabled) {
                index = i;
                break;
            }
        }
        return i;
    },

    _getIndexBetting: function (betting, list) {
        for (var i = 0; i < list.length; i += 1) {
            if (list[i] === betting) {
                return i;
            }
        }
        return -1;
    },

    clearLineFinish: function () {
        for (var i = 0; i < this.lineResult.length; i += 1) {
            this.lineResult[i].parent.opacity = 255;
            this.lineResult[i].active = false;
        }
    },

    _checkActiveButton: function () {
        if (this.isDoneFinish && this.isDoneEfect) {
            if (this.autoPlay) {
                this.btnQuay.getComponent(cc.Button).interactable = false;
            }
            else {
                this.btnQuay.getComponent(cc.Button).interactable = true;
            }
        }
        else {
            this.btnQuay.getComponent(cc.Button).interactable = false;
        }
    },

    onShowChonCua: function () {
        this.audioManager.playButtonClick();
        this.popupChonCua.active = true;
    },

    onHideChonCua: function () {
        this.audioManager.playButtonClick();
        this.popupChonCua.active = false;
    },

    onGetJarSuccess: function (params) {
        for (var i = 0; i < this.moneyXuBetList.length; i += 1) {
            var QuyXu = params.data[this.moneyXuBetList[i]].currencies;
            this.quyXuList.push(QuyXu.XU);
        }
        for (i = 0; i < this.moneyPiBetList.length; i += 1) {
            var QuyPi = params.data[this.moneyPiBetList[i]].currencies;
            this.quyPiList.push(QuyPi.IP);
        }
        this._updateMoneyQuy();
    },

    onUpdateJar: function (params) {
        if (params.currency === CommonConstant.CurrencyType.Ip.NAME) {
            // JarInfo.data[this.gameManager.gameId].jars[params.extraParams.betting] = params.money;
            EventDispatcher.dispatchEvent(JarInfo.eventName, {
                gameid: this.gameManager.gameId,
                money: params.money
            });
            this.quyPiList[this._getIndexBetting(params.extraParams.betting, this.moneyPiBetList)] = params.money;
            if (this.currencyIndex === 0 && this.moneyPiBetList[this._getMoneySelectIndex()] === params.extraParams.betting) {
                this.newMoneyQuy = params.money;
                if (!this._countDownIntervalId) {
                    this._effectUpdateMoneyQuy();
                }
            }
        }
        else if (params.currency === CommonConstant.CurrencyType.Xu.NAME) {
            this.quyXuList[this._getIndexBetting(params.extraParams.betting, this.moneyXuBetList)] = params.money;
            if (this.currencyIndex === 1 && this.moneyXuBetList[this._getMoneySelectIndex()] === params.extraParams.betting) {
                this.newMoneyQuy = params.money;
                if (!this._countDownIntervalId) {
                    this._effectUpdateMoneyQuy();
                }
            }
        }
    },

    _showPot: function () {
        var count = this._getPotSelect().length;
        if (count > 0) {
            if (this.isDoneFinish && this.isDoneEfect) {
                this.btnQuay.getComponent(cc.Button).interactable = true;
                this.btnTuQuay.getComponent(cc.Button).interactable = true;
            }
        }
        // else {
        //     this.btnQuay.getComponent(cc.Button).interactable = false;
        //     this.btnTuQuay.getComponent(cc.Button).interactable = false;
        // }

        this.lblNumberPotActive.string = count;
    },

    _getPotSelect: function () {
        var potActive = [];
        for (var i = 0; i < this.potInfor.length; i += 1) {
            var pot = this.potInfor[i].getComponent('PotInforSanThuong');
            if (pot.isActive) {
                potActive.push(i + 1);
            }
        }
        return potActive;
    },

    _setOnClickPot: function () {
        var self = this,
            tmpPot;
        for (var i = 0; i < self.potInfor.length; i += 1) {
            tmpPot = self.potInfor[i];
            tmpPot.on(cc.Node.EventType.TOUCH_START, function (event) {
                self._selectPot(event.target);
            }, tmpPot);
        }
    },

    _selectPot: function (pot) {
        if (!this.popupChonCua.active) {
            return;
        }
        if (this.autoPlay) {
            UiManager.openWarningMessage('Đang quay không thể thay đổi cửa đặt!', 1);
        }
        else {
            if (this.isDoneFinish && this.isDoneEfect) {
                var potComponent = pot.getComponent('PotInforSanThuong');
                this.audioManager.playButtonClick();
                potComponent.clickPot();
                this._showPot();
                if (potComponent.isActive) {
                    pot.opacity = 255;
                }
                else {
                    pot.opacity = 128;
                }
            }
            else {
                UiManager.openWarningMessage('Đang quay không thể thay đổi cửa đặt.');
            }
        }
    },

    resetButtonMucCuoc: function () {
        // Reset Label
        var i;
        for (i = 0; i < this.btnMucCuocList.length; i += 1) {
            var label = this.btnMucCuocList[i].getComponentInChildren(cc.Label);
            var isPI = this.currencyIndex === 0 || this.currencyIndex === undefined;
            label.string = Utils.Number.abbreviate(isPI ? this.moneyPiBetList[i] : this.moneyXuBetList[i], 3);
        }

        // Reset Sprite
        for (i = 0; i < this.btnMucCuocList.length; i += 1) {
            var s = this.btnMucCuocList[i].getComponent(cc.Sprite);
            s.enabled = i === 0;
        }
    },

});
