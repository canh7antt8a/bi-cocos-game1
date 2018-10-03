var GameConstant = require('GameConstant'),
    Utils = require('Utils'),
    AuthUser = require('AuthUser'),
    CommonConstant = require('CommonConstant'),
    BaseMainGameplay = require('BaseMainGameplay'),
    RowInforSanThuong = require('RowInforSanThuong'),
    GameManagerConstant = require('GameManagerConstant'),
    UiManager = require('UiManager'),
    DropDown = require('DropDown'),
    RulePotSanThuong = require('RulePotSanThuong'),
    SanThuongConstant = require('SanThuongConstant');

cc.Class({
    extends: BaseMainGameplay,

    properties: {
        potInfor: {
            'default': [],
            type: cc.Node,
        },

        rowInfor: {
            'default': [],
            type: RowInforSanThuong,
        },
        rulePotSanThuongList: {
            'default': [],
            type: RulePotSanThuong,
        },
        parentChipBetting: cc.Node,
        chipPrefab: cc.Prefab,
        lineResult: {
            'default': [],
            type: cc.Node,
        },
        moneyLableTemp: cc.Label,
        btnXu: cc.Node,
        btnPi: cc.Node,
        moneyResultLabel: cc.Label,
        totalMoneyBetLabel: cc.Label,
        moneyGaLabel: cc.Label,
        btnQuay: cc.Button,
        btnTuQuay: cc.Button,
        parentHop: cc.Node,
        hopPrefab: cc.Prefab,
        panelDapHop: cc.Node,
        countOpenHopQuaLabel: cc.Label,
        itemMaDuThuongPrefab: cc.Prefab,
        contentMaDuThuong: cc.Node,
        panelMaDuThuong: cc.Node,
        countMaDuThuongLabel: cc.Label,
        resultKetQuaXoSoLabel: cc.Label,
        nameShowMaDuThuong: cc.Label,
        dateDropdow: DropDown,
        numberFree: cc.Node,
        historyTablePrefab: cc.Prefab,
        btnHistory: cc.Button,
        gameCmd: {
            'default': GameConstant.SAN_THUONG.CMD,
            visible: false
        },
    },

    // use this for initialization
    $onLoad: function () {
        this.listChipBetting = [];
        this.listHopQua = [];
        this.moneyBetSelect = 0;
        this.currencySelect = CommonConstant.CurrencyType.Ip.NAME;
        this.isDoneFinish = true;
        this.isDoneEfect = true;
        this.autoPlay = false;
        this.countFreePlay = 0;
        this.countOpenHopQua = 0;
        this.countLottery = 0;
        this.listMaDuThuong = [];
        this.currencyMa = CommonConstant.CurrencyType.Ip.NAME;
        this.SanThuongAudioId = 0;

        this.gameManager.eventDispatchers.local.addEventListener(SanThuongConstant.Event.ADD_LIST_BETTING, this._addChipBetting, this);
        this.gameManager.eventDispatchers.local.addEventListener(SanThuongConstant.Event.TURN_START, this.onStartGame, this);
        this.gameManager.eventDispatchers.local.addEventListener(SanThuongConstant.Event.FINISH, this.onFinishGame, this);
        this.gameManager.eventDispatchers.local.addEventListener(SanThuongConstant.Event.CLEAR_FINISH, this.onWaitStartGame, this);
        this.gameManager.eventDispatchers.local.addEventListener(SanThuongConstant.Event.UPDATE_CHICKEN_JAR, this.onUpdateChickenJar, this);
        this.gameManager.eventDispatchers.local.addEventListener(SanThuongConstant.Event.SHOW_PANEL_DAPHOP, this.openPanelDapHop, this);
        this.gameManager.eventDispatchers.local.addEventListener(SanThuongConstant.Event.OPEN_HOP, this.openHop, this);
        this.gameManager.eventDispatchers.local.addEventListener(SanThuongConstant.Event.SET_RULE, this.onSetRule, this);
        this.gameManager.eventDispatchers.local.addEventListener(SanThuongConstant.Event.CHICKEN_CODE, this.onOpenMaDuThuong, this);

        this.gameManager.eventDispatchers.local.addEventListener(GameManagerConstant.Event.UPDATE_USER_MONEY, this._updateMoney, this);

        this.cleaseLineFinish();
        this.btnPi.opacity = 255;
        this.btnXu.opacity = 90;
        this._updateMoney();
        this.gameManager.sendGetChickenJar();
        this.gameManager.sendRegQuickPlay();
        this._setOnClickPot();

    },

    $onFocus: function () {

        if (this.gameManager.gameState !== SanThuongConstant.GameState.NONE) {
            this.panelMaDuThuong.active = false;
            // this.countOpenHopQua = 0;
            // this.bow.position = cc.v2(0, 0);
            // for (var i = 0; i < this.slotInfor.length; i += 1) {
            //     var potComponent = this.slotInfor[i].getComponent('SlotInfor');
            //     potComponent.showEfectWin(false);
            // }
        }
        if (this.gameManager.gameState !== SanThuongConstant.GameState.FINISH) {
            // this.bow.position = cc.v2(0, 0);
            // for (var i = 0; i < this.slotInfor.length; i += 1) {
            //     var potComponent = this.slotInfor[i].getComponent('SlotInfor');
            //     potComponent.showEfectWin(false);
            // }
        }
        if (this.gameManager.gameState !== SanThuongConstant.GameState.OPEN_HOP) {
            this.panelMaDuThuong.active = false;
            // this.onClickQuay();
            // var anim = this.bowDice.getComponent(cc.Animation);
            // anim.stop('shake');
        }
        if (this.gameManager.gameState === SanThuongConstant.GameState.EFFECT) {
            this.isDoneEfect = true;
            // this.bowDice.position = cc.v2(0, 0);
        }
    },

    onOpenMaDuThuong: function (params) {
        var index = 0,
            self = this;
        this.panelMaDuThuong.active = true;
        this.nameShowMaDuThuong.string = AuthUser.username;
        this.listMaDuThuong = params;
        this.dateDropdow.clearAllItems();
        Object.keys(params).sort().reverse().forEach(function (maDuThuong) {
            self.dateDropdow.addItem(maDuThuong, (index > 0 ? false : true));
            index += 1;
        });
        this.updateMaDuThuong();
    },

    updateMaDuThuong: function () {
        var currentMa = this.dateDropdow.getSelectedItem(),
            itemMaDuThuong;
        if (this.listMaDuThuong[currentMa].result) {
            this.resultKetQuaXoSoLabel.string = 'Kết quả sổ xố: ' + this.listMaDuThuong[currentMa].result;
        }
        else {
            this.resultKetQuaXoSoLabel.string = 'Kết quả sổ xố:';
        }
        if (this.listMaDuThuong[currentMa].codes[this.currencyMa]) {
            this.countMaDuThuongLabel.string = 'SỐ LƯỢNG MÃ: ' + this.listMaDuThuong[currentMa].codes[this.currencyMa].length;
        }
        else {
            this.countMaDuThuongLabel.string = 'SỐ LƯỢNG MÃ: 0';
        }
        this.contentMaDuThuong.removeAllChildren();
        for (var i = 0; i < this.listMaDuThuong[currentMa].codes[this.currencyMa].length; i += 1) {
            itemMaDuThuong = cc.instantiate(this.itemMaDuThuongPrefab);
            itemMaDuThuong.getChildByName('LblIndex').getComponent(cc.Label).string = i + 1;
            itemMaDuThuong.getChildByName('LblMa').getComponent(cc.Label).string = this.listMaDuThuong[currentMa].codes[this.currencyMa][i];
            this.contentMaDuThuong.addChild(itemMaDuThuong);
        }
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
        if (this.countFreePlay !== 0) {
            return UiManager.openWarningMessage('Quay miễn phí không thể thay đổi cửa đặt.');
        }
        if (this.isDoneFinish && this.isDoneEfect && this.countFreePlay === 0) {
            var potComponent = pot.getComponent('PotInforSanThuong');
            potComponent.clickPot();
            this._showTotalMoneyBet();
        }
        else {
            UiManager.openWarningMessage('Đang quay không thể thay đổi cửa đặt.');
        }
    },

    onSetRule: function (params) {
        for (var i = 0; i < params.length; i += 1) {
            this.rulePotSanThuongList[params[i].id - 1].setRatio(params[i]);
        }
    },
    _updateMoney: function () {
        this.btnPi.getComponentInChildren(cc.Label).string = Utils.Number.format(AuthUser.currencies[CommonConstant.CurrencyType.Ip.NAME].balance);
        this.btnXu.getComponentInChildren(cc.Label).string = Utils.Number.format(AuthUser.currencies[CommonConstant.CurrencyType.Xu.NAME].balance);

    },

    openHop: function (params) {
        var hopQuaComponent,
            self = this,
            animation;
        for (var i = 0; i < params.results.length; i += 1) {
            hopQuaComponent = this.listHopQua[params.results[i].id].getComponent('HopquaInfor');
            animation = this.listHopQua[params.results[i].id].getComponent(cc.Animation);
            animation.stop('hopQuaEfect');
            this.countOpenHopQua -= 1;
            if (this.countOpenHopQua <= 0) {
                var actions = cc.sequence(cc.delayTime(2), cc.callFunc(function () {
                        self.panelDapHop.active = false;
                    }),
                    cc.delayTime(1),
                    cc.callFunc(function () {
                        self._checkDoneFinish();
                    }));
                self.node.runAction(actions);
            }
            if (this.countOpenHopQua >= 0) {
                this.countOpenHopQuaLabel.string = 'Bạn còn ' + this.countOpenHopQua + ' lần mở hộp quà';
            }
            switch (params.results[i].awardType) {
            case SanThuongConstant.AwardType.NONE:
                hopQuaComponent.openHopQua('Chúc may mắn lần sau');
                break;
            case SanThuongConstant.AwardType.MONEY:
                hopQuaComponent.openHopQua('Bạn nhận được ' + params.results[i].ratio + ' lần tiền cược');
                break;
            case SanThuongConstant.AwardType.FREE_PLAY:
                hopQuaComponent.openHopQua('Bạn nhận được ' + params.results[i].ratio + ' lượt quay miễn phí');
                // self.countFreePlay += params.results[i].ratio;
                break;
            case SanThuongConstant.AwardType.MA_DU_THUONG:
                hopQuaComponent.openHopQua('Bạn nhận được ' + params.results[i].ratio + ' mã dự thưởng');
                break;

            }

        }
    },

    openPanelDapHop: function (count) {
        this.countOpenHopQua = count;
        if (this.countOpenHopQua >= 0) {
            this.panelDapHop.active = true;
            this.countOpenHopQuaLabel.string = 'Bạn còn ' + this.countOpenHopQua + ' lần mở hộp quà';
            this.createHopQua(24);
        }
    },

    createHopQua: function (count) {
        this.parentHop.removeAllChildren();
        this.listHopQua = [];
        var self = this,
            hopQua,
            animation,
            hopQuaComponent;
        for (var i = 0; i < count; i += 1) {
            hopQua = cc.instantiate(this.hopPrefab);
            self.listHopQua.push(hopQua);
            hopQuaComponent = hopQua.getComponent('HopquaInfor');
            animation = hopQua.getComponent(cc.Animation);
            hopQuaComponent.init(i);
            hopQua.on(cc.Node.EventType.TOUCH_START, function () {
                self._selectHopQua(this.node);
            }, hopQuaComponent);
            this.parentHop.addChild(hopQua);
            animation.play('hopQuaEfect');
        }
    },

    _selectHopQua: function (hopQua) {
        var hopQuaComponent = hopQua.getComponent('HopquaInfor');
        this.gameManager.sendOpentHop(hopQuaComponent.id);
    },

    onWaitStartGame: function (freeTurns) {
        this.countFreePlay = freeTurns;
        if (this.countFreePlay > 0) {
            this.numberFree.active = true;
            this.numberFree.getComponentInChildren(cc.Label).string = this.countFreePlay;
        }
        // this.cleaseLineFinish();
        this.isDoneFinish = true;
        if (!Utils.Game.isFocus() && this.autoPlay) {
            this.isDoneEfect = true;
            this.onClickQuay();
        }
        else {
            this._checkDoneFinish();
        }

    },

    _checkDoneFinish: function () {
        while (this.isDoneEfect && this.isDoneFinish) {
            // if (this.isDoneEfect && this.isDoneFinish) {
            if (this.autoPlay) {
                if (this.countOpenHopQua <= 0 && !this.panelDapHop.active) {
                    this.onClickQuay();
                }
            }
            else {
                this._checkActiveButton();
            }
            // }
            break;
        }
    },

    onUpdateChickenJar: function () {
        if (this.currencySelect === CommonConstant.CurrencyType.Ip.NAME) {
            this.moneyGaLabel.string = Utils.Number.format(this.gameManager.moneyChickenPi);
        }
        else {
            this.moneyGaLabel.string = Utils.Number.format(this.gameManager.moneyChickenXu);
        }
        this._showTotalMoneyBet();
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

    onFinishGame: function (params) {
        var self = this;
        var action = [];
        // action.push(cc.delayTime(5));
        action.push(cc.callFunc(function () {
            if (Utils.Game.isFocus()) {
                self._showLineFinish(params.awards);
                self.moneyResultLabel.string = Utils.Number.format(params.player.moneyExchange);
                self._updateMoney();
            }
            self.btnHistory.node.active = true;
        }));
        self.node.runAction(cc.sequence(action));
        // if (Utils.Game.isFocus()) {
        //     this._showLineFinish(params.awards);
        //     this.moneyResultLabel.string = Utils.Number.format(params.player.moneyExchange);
        //     this._updateMoney();
        // }
        // this.btnHistory.node.active = true;
    },
    _showLineFinish: function (params) {
        var self = this;
        this.audioManager.stopEffect(this.SanThuongAudioId);

        function doneFinish() {
            return function () {
                self.isDoneEfect = true;
                self._checkDoneFinish();
            };
        }

        function showPotWrapper(pot, ratio, awardType, isShow) {
            return function () {
                if (isShow) {
                    self.lineResult[pot - 1].active = true;
                    self._calculateTypeAward(ratio, awardType);
                    self._showGemFinishLine(pot);
                    self.audioManager.playChickenRow();
                }
                else {
                    self.lineResult[pot - 1].active = false;
                }
            };
        }

        var actions = [];
        if (params.length > 0) {
            for (var i = 0; i < params.length; i += 1) {
                actions.push(cc.delayTime(1));
                actions.push(cc.callFunc(showPotWrapper(params[i].pot, params[i].ratio, params[i].awardType, true)));
                actions.push(cc.delayTime(1));
                actions.push(cc.callFunc(showPotWrapper(params[i].pot, params[i].ratio, params[i].awardType, false)));
                if (i === params.length - 1) {
                    actions.push(cc.delayTime(2));
                    actions.push(cc.callFunc(doneFinish()));
                }
            }
        }
        else {
            actions.push(cc.callFunc(doneFinish()));
        }
        var action = cc.sequence(actions);
        if (action) {
            self.node.runAction(action);
        }
    },

    _calculateTypeAward: function (ratio, awardType) {
        var self = this;
        switch (awardType) {
            // case SanThuongConstant.AwardType.NONE:
            //     self._showTextAwardType();
            //     break;
        case SanThuongConstant.AwardType.MONEY:
            self._showTextAwardType(self.moneyBetSelect * ratio);
            break;
        case SanThuongConstant.AwardType.FREE_PLAY:
            self._showTextAwardType(ratio + ' lần quay miễn phí');
            // self.countFreePlay += ratio;
            // self.numberFree.active = true;
            // self.numberFree.getComponentInChildren(cc.Label).string = self.countFreePlay;
            break;
        case SanThuongConstant.AwardType.HOPQUA:
            self._showTextAwardType(ratio + ' hộp quà');
            // self.countOpenHopQua += ratio;
            break;
        case SanThuongConstant.AwardType.MA_DU_THUONG:
            self._showTextAwardType(ratio + ' mã dự thưởng');
            self.countLottery += ratio;
            break;

        }
    },

    _showTextAwardType: function (value) {
        var self = this;

        function ShowHideLabelMoney(money, isShow) {
            return function () {
                if (Utils.Type.isNumber(value)) {
                    self.moneyLableTemp.string = Utils.Number.format(value);
                }
                else {
                    self.moneyLableTemp.string = value;
                }
                self.moneyLableTemp.node.active = isShow;
                var animation = self.moneyLableTemp.node.getComponent(cc.Animation);
                if (isShow) {
                    animation.play('MoveMoneyReceive');
                }
                else {
                    animation.stop('MoveMoneyReceive');
                }
            };
        }
        var actions = [];
        actions.push(cc.callFunc(ShowHideLabelMoney(value, true)));
        actions.push(cc.delayTime(1));
        actions.push(cc.callFunc(ShowHideLabelMoney(0, false)));

        var action = cc.sequence(actions);
        self.node.runAction(action);
    },

    _showTotalMoneyBet: function () {
        this.totalMoneyBetLabel.string = Utils.Number.format(this.moneyBetSelect * this._getPotSelect().length);
        if (this._getPotSelect().length > 0) {
            if (this.isDoneFinish && this.isDoneEfect) {
                this.btnQuay.getComponent(cc.Button).interactable = true;
                this.btnTuQuay.getComponent(cc.Button).interactable = true;
            }
        }
        else {
            this.btnQuay.getComponent(cc.Button).interactable = false;
            this.btnTuQuay.getComponent(cc.Button).interactable = false;
        }
    },

    cleaseLineFinish: function () {
        for (var i = 0; i < this.lineResult.length; i += 1) {
            this.lineResult[i].active = false;
        }
        this.moneyResultLabel.string = 0;
    },

    _showGemFinishLine: function (pot) {
        var arrGem = [];
        switch (pot) {
        case 1:
            arrGem = [1, 1, 1, 1, 1];
            break;
        case 2:
            arrGem = [2, 2, 2, 2, 2];
            break;
        case 3:
            arrGem = [0, 0, 0, 0, 0];
            break;
        case 4:
            arrGem = [1, 1, 2, 1, 1];
            break;
        case 5:
            arrGem = [1, 1, 0, 1, 1];
            break;
        case 6:
            arrGem = [2, 2, 1, 2, 2];
            break;
        case 7:
            arrGem = [0, 0, 1, 0, 0];
            break;
        case 8:
            arrGem = [2, 0, 2, 0, 2];
            break;
        case 9:
            arrGem = [0, 2, 0, 2, 0];
            break;
        case 10:
            arrGem = [1, 2, 0, 2, 1];
            break;
        case 11:
            arrGem = [0, 1, 2, 1, 0];
            break;
        case 12:
            arrGem = [2, 1, 0, 1, 2];
            break;
        case 13:
            arrGem = [1, 0, 1, 2, 1];
            break;
        case 14:
            arrGem = [1, 2, 1, 0, 1];
            break;
        case 15:
            arrGem = [0, 1, 1, 1, 0];
            break;
        case 16:
            arrGem = [2, 1, 1, 1, 2];
            break;
        case 17:
            arrGem = [1, 0, 0, 0, 1];
            break;
        case 18:
            arrGem = [1, 2, 2, 2, 1];
            break;
        case 19:
            arrGem = [0, 0, 1, 2, 2];
            break;
        case 20:
            arrGem = [2, 2, 1, 0, 0];
            break;
        }
        this._activeGem(arrGem);
    },

    _activeGem: function (params) {
        var self = this;

        function showScale(gem, isShow) {
            return function () {
                if (gem && gem.name !== '') {
                    var efect = gem.getChildByName('ImgTrung');
                    if (isShow) {
                        if (efect) {
                            efect.active = true;
                            gem.getComponent(cc.Animation).play();
                        }
                    }
                    else {
                        if (efect) {
                            gem.getChildByName('ImgTrung').active = false;
                            gem.getComponent(cc.Animation).stop();
                        }
                    }
                }
            };
        }
        for (var i = 0; i < this.rowInfor
            .length; i += 1) {
            var gem = this.rowInfor[i].gemTemp[params[i]];
            if (gem) {
                var action = cc.sequence(
                    cc.callFunc(
                        showScale(gem, true)
                    ),
                    cc.delayTime(1),
                    cc.callFunc(
                        showScale(gem, false)
                    )

                );
                self.node.runAction(action);
            }
        }
    },

    onStartGame: function (params) {
        if (Utils.Game.isFocus()) {
            var self = this;
            self.node.stopAllActions();
            this.cleaseLineFinish();

            self.isDoneFinish = false;
            self.isDoneEfect = false;
            self._checkActiveButton();
            self.panelDapHop.active = false;
            self.countOpenHopQua = 0;
            self.countFreePlay = Math.max(self.countFreePlay - 1, 0);
            if (self.countFreePlay > 0) {
                self.numberFree.active = true;
                self.numberFree.getComponentInChildren(cc.Label).string = self.countFreePlay;
            }
            else {
                self.numberFree.active = false;
            }
            var action = cc.sequence(
                cc.callFunc(function () {
                    self._removeGemFinish();
                    self._addChipFinish(params);
                    for (var i = 0; i < self.rowInfor.length; i += 1) {
                        self.rowInfor[i].node.y = -160;
                    }
                }),
                cc.delayTime(0.3),
                cc.callFunc(function () {
                    for (var i = 0; i < self.rowInfor.length; i += 1) {
                        // var action = cc.sequence(cc.moveTo((7 - (i * 0.3)), cc.v2(self.rowInfor[i].node.x, -(self.rowInfor[i].node.height - 160)))).easing(cc.easeInOut(2.0));
                        var action = cc.sequence(cc.moveTo(3 - (i * 0.2), cc.v2(self.rowInfor[i].node.x, -(self.rowInfor[i].node.height - 160)))).easing(cc.easeCubicActionIn());
                        self.rowInfor[i].node.runAction(action);
                    }
                })
            );
            action.easing(cc.easeQuadraticActionOut());
            this.node.runAction(action);
            this._updateMoney();
            this.SanThuongAudioId = this.audioManager.playVongQuay();
        }
    },

    _addChipFinish: function (params) {
        var chips = params;
        chips.reverse();
        for (var i = 0; i < chips.length; i += 1) {
            switch (i) {
            case 0:
            case 5:
            case 10:
                this._initGemFinish(4, params[i]);
                break;
            case 1:
            case 6:
            case 11:
                this._initGemFinish(3, params[i]);
                break;
            case 2:
            case 7:
            case 12:
                this._initGemFinish(2, params[i]);
                break;
            case 3:
            case 8:
            case 13:
                this._initGemFinish(1, params[i]);
                break;
            case 4:
            case 9:
            case 14:
                this._initGemFinish(0, params[i]);
                break;

            }
        }
    },

    _initGemFinish: function (rowIndex, value) {
        var row = this.rowInfor[rowIndex].getComponent('RowInforSanThuong');
        row.initGemFinish(value - 1);
    },

    _removeGemFinish: function () {
        for (var i = 0; i < this.rowInfor.length; i += 1) {
            this.rowInfor[i].destroyGemTemp();
        }
    },

    onClickDongLe: function () {
        if (this.countFreePlay !== 0) {
            return UiManager.openWarningMessage('Quay miễn phí không thể thay đổi cửa đặt.');
        }
        if (this.isDoneFinish && this.isDoneEfect && this.countFreePlay === 0) {
            this.onClickHuy();
            for (var i = 0; i < this.potInfor.length; i += 2) {
                var pot = this.potInfor[i].getComponent('PotInforSanThuong');
                pot.activePot(true);
            }
            this._showTotalMoneyBet();
        }
        else {
            UiManager.openWarningMessage('Đang quay không thể thay đổi cửa đặt.');
        }
    },
    onClickDongChan: function () {
        if (this.countFreePlay !== 0) {
            return UiManager.openWarningMessage('Quay miễn phí không thể thay đổi cửa đặt.');
        }
        if (this.isDoneFinish && this.isDoneEfect && this.countFreePlay === 0) {
            this.onClickHuy();
            for (var i = 1; i < this.potInfor.length; i += 2) {
                var pot = this.potInfor[i].getComponent('PotInforSanThuong');
                pot.activePot(true);
            }
            this._showTotalMoneyBet();
        }
        else {
            UiManager.openWarningMessage('Đang quay không thể thay đổi cửa đặt.');
        }
    },
    onClickTatCa: function () {
        if (this.countFreePlay !== 0) {
            return UiManager.openWarningMessage('Quay miễn phí không thể thay đổi cửa đặt.');
        }
        if (this.isDoneFinish && this.isDoneEfect && this.countFreePlay === 0) {
            for (var i = 0; i < this.potInfor.length; i += 1) {
                var pot = this.potInfor[i].getComponent('PotInforSanThuong');
                pot.activePot(true);
            }
            this._showTotalMoneyBet();
        }
        else {
            UiManager.openWarningMessage('Đang quay không thể thay đổi cửa đặt.');
        }
    },
    onClickHuy: function () {
        if (this.countFreePlay !== 0) {
            return UiManager.openWarningMessage('Quay miễn phí không thể thay đổi cửa đặt.');
        }
        if (this.isDoneFinish && this.isDoneEfect && this.countFreePlay === 0) {
            for (var i = 0; i < this.potInfor.length; i += 1) {
                var pot = this.potInfor[i].getComponent('PotInforSanThuong');
                pot.activePot(false);
            }
            this._showTotalMoneyBet();
        }
        else {
            UiManager.openWarningMessage('Đang quay không thể thay đổi cửa đặt.');
        }
    },

    onClickQuay: function () {
        if (this._getPotSelect().length > 0) {
            if (this.isDoneEfect && this.isDoneFinish) {
                this.gameManager.sendStartGame(this.autoPlay, this.moneyBetSelect, this._getPotSelect(), this.currencySelect);
            }
        }
        else {
            UiManager.openWarningMessage('Bạn phải chọn cửa đặt trước khi quay.');
        }
    },

    onClickTuQuay: function () {
        var nameButton = this.btnTuQuay.getComponentInChildren(cc.Label);
        if (!this.autoPlay) {
            nameButton.string = 'HỦY';
            this.autoPlay = true;
            if (this.isDoneEfect && this.isDoneFinish) {
                this.onClickQuay();
            }
        }
        else {
            nameButton.string = 'TỰ QUAY';
            this.autoPlay = false;
        }

    },

    onClickXu: function () {
        if (this.countFreePlay !== 0) {
            return UiManager.openWarningMessage('Quay miễn phí không thể thay đổi loại tiền.');
        }
        if (this.isDoneFinish && this.isDoneEfect && this.countFreePlay === 0) {
            if (this.currencySelect === CommonConstant.CurrencyType.Ip.NAME) {
                this.currencySelect = CommonConstant.CurrencyType.Xu.NAME;
                this._addChipBetting(this.gameManager.lstXuBetting);
                this.btnPi.opacity = 150;
                this.btnXu.opacity = 255;
                this.onUpdateChickenJar();
                var nameButton = this.btnTuQuay.getComponentInChildren(cc.Label);
                nameButton.string = 'TỰ QUAY';
                this.autoPlay = false;
            }
        }
        else {
            UiManager.openWarningMessage('Đang quay không thể thay đổi loại tiền.');
        }
    },

    onClickPi: function () {
        if (this.countFreePlay !== 0) {
            return UiManager.openWarningMessage('Quay miễn phí không thể thay đổi loại tiền.');
        }
        if (this.isDoneFinish && this.isDoneEfect && this.countFreePlay === 0) {
            if (this.currencySelect === CommonConstant.CurrencyType.Xu.NAME) {
                this.currencySelect = CommonConstant.CurrencyType.Ip.NAME;
                this._addChipBetting(this.gameManager.lstPiBetting);
                this.btnPi.opacity = 255;
                this.btnXu.opacity = 150;
                this.onUpdateChickenJar();
                var nameButton = this.btnTuQuay.getComponentInChildren(cc.Label);
                nameButton.string = 'TỰ QUAY';
                this.autoPlay = false;
            }
        }
        else {
            UiManager.openWarningMessage('Đang quay không thể thay đổi loại tiền.');
        }
    },

    onClickSwidthMaDuThuong: function () {
        if (this.currencyMa === CommonConstant.CurrencyType.Ip.NAME) {
            this.currencyMa = CommonConstant.CurrencyType.Xu.NAME;
        }
        else {
            this.currencyMa = CommonConstant.CurrencyType.Ip.NAME;
        }
        this.updateMaDuThuong();
    },

    onClickMaDuThuong: function () {
        this.gameManager.sendOpenPopupMaDuThuong();
        // this.onClickHistory();
    },

    onClickHistory: function () {
        var hisotryTable = cc.instantiate(this.historyTablePrefab);
        hisotryTable.getComponent('HistorySanThuong').init(this.gameManager.lstHistory.slice());
        cc.director.getScene().addChild(hisotryTable);
    },

    CloseMaDuThuong: function () {
        this.panelMaDuThuong.active = false;
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

    _addChipBetting: function (params) {
        var chipSelect,
            indexColor = 0,
            index = 0,
            self = this,
            chipComponent;
        this.listChipBetting = [];
        this.parentChipBetting.removeAllChildren();
        for (var i = 0; i < params.length; i += 1) {
            chipSelect = cc.instantiate(this.chipPrefab);
            this.listChipBetting.push(chipSelect);
            chipComponent = chipSelect.getComponent('Chip');
            if (i < 12) {
                index = i;
            }
            else if (i >= 12 && i < 24) {
                index = index - 12;
            }
            else if (i >= 24 && i < 36) {
                index = index - 24;
            }

            if (index >= 3 && index < 6) {
                indexColor = 1;
            }
            else if (index >= 6 && index < 9) {
                indexColor = 2;
            }
            else if (index >= 9 && index < 12) {
                indexColor = 3;
            }
            chipComponent.init(params[i], SanThuongConstant.ChipColor.findById(indexColor).NAME);
            chipSelect.on(cc.Node.EventType.TOUCH_START, function () {
                self._selectChip(this.node);
            }, chipComponent);
            this.parentChipBetting.addChild(chipSelect);
        }
        this._selectChip(this.listChipBetting[0]);
    },

    _removeSelectChip: function () {
        for (var i = 0; i < this.listChipBetting.length; i += 1) {
            var chip = this.listChipBetting[i].getComponent('Chip');
            chip.activeSelectChip(false);
        }
    },

    _selectChip: function (chipSelect) {
        if (this.countFreePlay !== 0) {
            return UiManager.openWarningMessage('Quay miễn phí không thể thay đổi mức cược.');
        }
        if (this.isDoneFinish && this.isDoneEfect) {
            this._removeSelectChip();
            var chip = chipSelect.getComponent('Chip');
            chip.activeSelectChip(true);
            this.moneyBetSelect = chip.money;
            this._showTotalMoneyBet();
        }
        else {
            return UiManager.openWarningMessage('Đang quay không thể thay đổi mức cược.');
        }
    },
});
