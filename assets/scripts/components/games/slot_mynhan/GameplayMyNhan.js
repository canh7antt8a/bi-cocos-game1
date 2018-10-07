var ColumnMyNhan = require('ColumnMyNhan'),
    NoHu = require('NoHu'),
    AuthUser = require('AuthUser'),
    KetQuaSlot = require('KetQuaSlot'),
    TopPanelSlot = require('TopPanelSlot'),
    UiManager = require('UiManager'),
    TextJumping = require('TextJumping'),
    LineCuaAn = require('LineCuaAn'),
    HopQuaSlot = require('HopQuaSlot'),
    GameConstant = require('GameConstant'),
    CommonConstant = require('CommonConstant'),
    MyNhanConstant = require('MyNhanConstant'),
    GameManagerConstant = require('GameManagerConstant'),
    BaseMainGameplay = require('BaseMainGameplay');


cc.Class({
    extends: BaseMainGameplay,

    properties: {
        columnMyNhanList: {
            type: ColumnMyNhan,
            default: []
        },
        noHu: NoHu,
        ketqua: KetQuaSlot,
        freeTurnNode: cc.Node,
        freeTurnText: cc.Label,
        datCuaNode: cc.Node,
        bangThuongNode: cc.Node,
        HopQuaSlot: HopQuaSlot,
        lineCuaAn: LineCuaAn,
        txtBetting: cc.Label,
        txtMoney: cc.Label,
        txtWinStatus: cc.Label,
        txtThang: cc.Label,
        lblTuQuay: cc.Label,
        txtAwardFreeTurn: cc.Label,
        txtAwardLuckyCoffer: cc.Label,

        topPanel: TopPanelSlot,

        gameCmd: {
            'default': GameConstant.MY_NHAN.CMD,
            visible: false
        },
    },

    $onLoad: function () {
        this.setGameType(MyNhanConstant.GameType.type);
        this._initOnce();
        this.gameFinish = true;
        this.countRotate = 0;
        this.countFreeTurn = 0;
        this.countAutoRotateStep = 0;
        this.awards = 0;
        this.moneyExchange = 0;
        this.resetRotatePos = -240;
        this.resetRotateSpacing = 2;
        if (this.gameCmd === GameConstant.HAI_TAC.CMD || this.gameCmd === GameConstant.HOA_QUA.CMD) {
            this.resetRotateSpacing = 0;
        }
        this.clickAutoPlayWhenGameFinishing = false;
        this.isTrialPlay = (MyNhanConstant.GameType.type === -1);

        this.topPanel.setGamePlay(this);
        this.HopQuaSlot.gamePlay = this;

        // Money
        var money = this.isTrialPlay ? AuthUser.currencies[CommonConstant.CurrencyType.Xu.NAME].balance : AuthUser.currencies[CommonConstant.CurrencyType.Ip.NAME].balance;
        this.txtMoney.node.getComponent(TextJumping).updateText(money);

        this.gameManager.eventDispatchers.local.addEventListener(MyNhanConstant.Event.TURN_PREPARE, this.onPrepareGame, this);
        this.gameManager.eventDispatchers.local.addEventListener(MyNhanConstant.Event.TURN_START, this.onStartGame, this);
        this.gameManager.eventDispatchers.local.addEventListener(MyNhanConstant.Event.TURN_UPDATE, this.onUpdateGame, this);
        this.gameManager.eventDispatchers.local.addEventListener(MyNhanConstant.Event.TURN_FINISH, this.onFinishGame, this);
        this.gameManager.eventDispatchers.local.addEventListener(MyNhanConstant.Event.GET_JAR_SUCCESS, this.onGetJarSuccess, this);
        this.gameManager.eventDispatchers.local.addEventListener(MyNhanConstant.Event.UPDATE_JAR, this.onUpdateJar, this);
        this.gameManager.eventDispatchers.local.addEventListener(MyNhanConstant.Event.UPDATE_USER_INFO, this.onUpdateUser, this);
        this.gameManager.eventDispatchers.local.addEventListener(MyNhanConstant.Event.OPEN_COFFER, this.onOpenCoffer, this);
        this.gameManager.eventDispatchers.local.addEventListener(MyNhanConstant.Event.UPDATE_AWARD_TYPE, this.onUpdateAwardType, this);
        this.gameManager.eventDispatchers.local.addEventListener(GameManagerConstant.Event.UPDATE_USER_MONEY, this._updateMoney, this);

        this.gameManager.getJar();

        // Menu
        this.gameId = this.gameManager.gameId;
        this.topPanel.getButtonHistory().active = true;
    },

    $onLostFocus: function () {
        this.lostForcus = true;
    },

    $onFocus: function () {
        this.lostForcus = false;
        this.audioManager.stopEffect(this.audioId);
        // cc.log('# onFocus gameState ' + this.gameManager.gameState);
    },

    onDisable: function () {
        this.gameManager.saveHistory();
    },

    onPrepareGame: function () {
        // cc.log('# onPrepareGame');
        // cc.log(params);
        this._autoPlayCheck();
    },

    onFinishGame: function (params) {
        this.awards = params.awards;
        // cc.log('########### FINISH GAME #############');
        // cc.log(params);
        this.moneyExchange = params.player.moneyExchange;

        // Free Turn
        this.countFreeTurn = params.freeTurnSize;
        this._showFinish();
    },

    onUpdateAwardType: function (params) {
        // cc.log('onUpdateAwardType');
        // cc.log(params);
        if (params.itemsInfo) {
            this.bangThuongNode.getComponent('TableBangThuongMyNhan').setData(params.itemsInfo, MyNhanConstant.GameType.type);
        }
        this.bangThuongNode.active = true;
    },

    onOpenCoffer: function (params) {
        if (params.results) {
            this.hasOpenHopQua = false;
            for (var i = 0; i < params.results.length; i += 1) {
                var id = params.results[i].id;
                this.HopQuaSlot.openCoffer(id, params.results[i]);
            }
        }
    },

    onUpdateUser: function (params) {
        var money = params.value;
        if (money && params.field === 'money') {
            this.txtMoney.node.getComponent(TextJumping).updateText(money);
        }
    },

    onUpdateGame: function (params) {
        // cc.log('onUpdateGame');
        // cc.log(params);
        if (params) {
            this.txtBetting.node.getComponent(TextJumping).updateText(params.betting);
            this.betting = params.betting;
        }
        this.datCuaNode.getComponent('TableChonDong').updateMoneyBetting(this.betting);
    },

    onUpdateJar: function (params) {
        var betting = params.extraParams.betting;
        for (var i = 0; i < MyNhanConstant.BettingList.length; i += 1) {
            if (MyNhanConstant.BettingList[i] === betting) {
                this.topPanel.setMoney(i, params.money);
            }
        }
    },

    onGetJarSuccess: function (params) {
        for (var i = 0; i < MyNhanConstant.BettingList.length; i += 1) {
            var object = params.data['' + MyNhanConstant.BettingList[i] + ''];
            if (object) {
                var jar = object.currencies.IP;
                this.topPanel.setMoney(i, jar);
            }
        }
    },

    onStartGame: function (params) {
        var result = params.result;
        this._rotate(result);
    },

    onPlayClick: function () {
        this._initOnce();
        if (!this.lostForcus) {
            this.audioManager.playButtonClick();
        }
        this.HopQuaSlot.node.active = false;
        var betting = this.betting;
        var pots = this.datCuaNode.getComponent('TableChonDong').getPots();
        if (pots.length < 1) {
            UiManager.openWarningMessage('Xin vui lòng chọn dòng cược trước khi quay!', 1);
            if (this.autoPlay) {
                this.onAutoPlayClick();
            }
            return;
        }
        var currency = this.isTrialPlay ? CommonConstant.CurrencyType.Xu.NAME : CommonConstant.CurrencyType.Ip.NAME;
        if (this.gameManager.gameState === MyNhanConstant.GameState.NONE) {
            this.gameManager.sendStartGame(betting, pots, currency);
            this.clickAutoPlayWhenGameFinishing = false;
        }
        else if (!this.clickAutoPlayWhenGameFinishing) {
            if (this.autoPlay) {
                // cc.log('Bạn đang ở chế độ tự quay : gameState ' + this.gameManager.gameState);
                UiManager.openWarningMessage('Bạn đang ở chế độ tự quay!', 1);
            }
            else {
                // cc.log('Đang quay xin vui lòng chờ lượt quay kết thúc : gameState ' + this.gameManager.gameState);
                UiManager.openWarningMessage('Đang quay xin vui lòng chờ lượt quay kết thúc!', 1);
            }
        }

        // Check User Money
        var money = AuthUser.currencies[CommonConstant.CurrencyType.Ip.NAME].balance;
        if (this.isTrialPlay) {
            money = AuthUser.currencies[CommonConstant.CurrencyType.Xu.NAME].balance;
        }
        var maxBetting = betting * pots.length;
        if (this.autoPlay && money < maxBetting) {
            this.onAutoPlayClick();
            // cc.log('Not enought money => cancel auto play');
            UiManager.openWarningMessage('Tài khoản của bạn không đủ, xin vui lòng nạp thêm tiền!', 1);
        }
    },

    setGameType: function (type) {
        for (var i = 0; i < this.columnMyNhanList.length; i += 1) {
            this.columnMyNhanList[i].type = type;
        }
    },

    onMenuClick: function () {

    },

    onBangThuongClick: function () {
        this.gameManager.updateAwardType();
        this.audioManager.playButtonClick();
    },

    onDongClick: function () {
        if (this.autoPlay || this.gameManager.gameState === MyNhanConstant.GameState.ROTATE) {
            UiManager.openWarningMessage('Đang quay không thể thay đổi mức cược!', 1);
            return;
        }
        this.datCuaNode.active = true;
        this.audioManager.playButtonClick();
    },

    onAutoPlayClick: function () {
        this.autoPlay = !this.autoPlay;
        this.lblTuQuay.string = this.autoPlay ? 'HỦY\nQUAY' : 'TỰ\nQUAY';
        if (this.autoPlay && this.gameManager.gameState === MyNhanConstant.GameState.NONE && this.gameFinish) {
            this.onPlayClick();
        }
        else {
            this.clickAutoPlayWhenGameFinishing = this.autoPlay;
        }
        this.audioManager.playButtonClick();
    },

    _updateMoney: function (params) {
        var money = params.money;
        if (money) {
            if ((params.currency === CommonConstant.CurrencyType.Xu.NAME && MyNhanConstant.GameType.type === -1) ||
                (params.currency === CommonConstant.CurrencyType.Ip.NAME && MyNhanConstant.GameType.type !== -1)) {
                this.txtMoney.node.getComponent(TextJumping).updateText(money);
            }
        }
    },

    _autoPlayCheck: function () {
        this.gameFinish = true;
        if (this.autoPlay) {
            this.countAutoRotateStep += 1;
            // cc.log('_autoPlayCheck ' + this.countAutoRotateStep);
            var autoPlayWhenLostForcus = this.lostForcus && this.gameManager.gameState === MyNhanConstant.GameState.NONE;
            if (this.countAutoRotateStep >= 2 || autoPlayWhenLostForcus || this.clickAutoPlayWhenGameFinishing) {
                if (autoPlayWhenLostForcus) {
                    // cc.log('########## this.lostForcus => autoPlay');
                }
                this.onPlayClick();
                this.countAutoRotateStep = 0;
            }
        }
    },

    _rotate: function (result) {
        // cc.log('## Playing ');
        this.gameFinish = this.lostForcus;
        this.ketqua.node.active = false;
        if (!this.lostForcus) {
            this.audioId = this.audioManager.playVongQuay();
        }
        this.countAutoRotateStep = 0;
        this._resetLine();
        this.txtThang.string = '0';
        this.awards = 0;
        this.countRotate = 0;
        this.moneyExchange = 0;
        this.gameManager.isFreeTurn = this.countFreeTurn > 0;
        var i, columnNode, arrayDelayTime = [],
            type = 0,
            colLength = 0,
            swapIndex = 0,
            self = this;

        // Reset 3 Dong Dau => 3 Dong Cuoi
        colLength = this.columnMyNhanList[0].itemList.length;
        if (this.ingnoreFirstTime !== undefined) {
            for (i = 0; i < this.columnMyNhanList.length; i += 1) {
                for (var j = 0; j < 3; j += 1) {
                    swapIndex = (colLength - 1) + (j - 2);
                    type = this.columnMyNhanList[i].itemList[j].type;
                    var id = this.columnMyNhanList[i].itemList[swapIndex].id;
                    this.columnMyNhanList[i].itemList[j].setType(type, id);
                }
            }
        }

        // Reset Pos
        for (i = 0; i < this.columnMyNhanList.length; i += 1) {
            columnNode = this.columnMyNhanList[i].node;
            columnNode.stopAllActions();
            columnNode.y = this.resetRotatePos;
            arrayDelayTime.push(i * 0.2);
        }

        // Set Ket Qua
        var col = 0,
            row = 0;
        for (i = 0; i < result.length; i += 1) {
            swapIndex = (colLength - 1) - row;
            // cc.log('col ' + col + ' row ' + row + '=> swapIndex ' + swapIndex + ' id ' + result[i]);
            var myNhanItem = this.columnMyNhanList[col].itemList[swapIndex];
            myNhanItem.setType(myNhanItem.type, result[i] - 1);
            col += 1;
            if (col >= 5) {
                row += 1;
                col = 0;
            }
        }

        // rotate
        arrayDelayTime = this.shuffle(arrayDelayTime);
        for (i = 0; i < this.columnMyNhanList.length; i += 1) {
            columnNode = this.columnMyNhanList[i].node;
            var subHeight = columnNode.getContentSize().height - 160 * 3 - 2 * this.resetRotateSpacing;
            if (this.lostForcus) {
                columnNode.y = columnNode.y - subHeight;
                self.countRotate += 1;
                if (self.countRotate >= 5) {
                    self._showFinish();
                }
            }
            else {
                columnNode.runAction(cc.sequence(cc.delayTime(arrayDelayTime[i]), cc.moveTo(4, cc.v2(columnNode.x, columnNode.y - subHeight)).easing(cc.easeQuinticActionOut()), cc.callFunc(function () {
                    self.countRotate += 1;
                    if (self.countRotate >= 5) {
                        self._showFinish();
                        self.audioManager.stopEffect(self.audioId);
                    }
                })));
            }
        }
        this.ingnoreFirstTime = true;
    },

    _stopGamePlay: function () {
        for (var i = 0; i < this.columnMyNhanList.length; i += 1) {
            var columnNode = this.columnMyNhanList[i].node;
            columnNode.stopAllActions();
            columnNode.y = this.resetRotatePos;
        }
    },


    // Thu tu hien thi ket qua
    // Nohu(Text thong bao) -> Ket Qua -> Hop Qua -> Line -> All Line
    _showFinish: function () {
        if (this.awards === 0 || this.countRotate < 5) {
            return;
        }

        var i;
        var pots = [];
        for (i = 0; i < this.awards.length; i += 1) {
            pots.push(this.awards[i].pot);
        }
        this.pots = pots;

        // Tinh Hu + Hop Qua
        var countFreeTurn = 0,
            countLuckyCoffer = 0,
            countJar = 0;
        for (i = 0; i < this.awards.length; i += 1) {
            if (this.awards[i].awardType === 'free_turn') {
                countFreeTurn += this.awards[i].ratio;
            }
            else if (this.awards[i].awardType === 'lucky_coffer') {
                countLuckyCoffer += this.awards[i].ratio;
            }
            else if (this.awards[i].awardType === 'jar') {
                countJar += this.awards[i].ratio;
            }
        }

        // Reset Line
        this._resetLine();

        // Show Free Turn
        this._showFreeTurn(countFreeTurn);

        // Show No Hu
        if (countJar > 0 && !this.lostForcus) {
            this._showNoHu(function () {
                this._showResult(countLuckyCoffer, countFreeTurn);
            }.bind(this));
        }
        // Show Ket Qua
        else {
            // cc.log('1   _showResult');
            this._showResult(countLuckyCoffer, countFreeTurn);
        }
    },

    _showNoHu: function (callback) {
        // cc.log('_showNoHu ');
        this.noHu.show(function () {
            callback();
        }.bind(this));
    },

    _showResult: function (countLuckyCoffer, countFreeTurn) {
        // Show KetQua
        // cc.log('_showResult ');

        if (this.moneyExchange >= 0) {
            this.txtWinStatus.string = 'THẮNG';
            this.audioManager.playChickenRow();
        }
        else {
            this.txtWinStatus.string = 'THUA';
        }
        this.txtThang.string = '0';
        this.txtThang.node.getComponent(TextJumping).updateText(this.moneyExchange);

        // Ket Qua
        if (this.lostForcus) {
            this._autoPlayCheck();
        }
        else {
            this.ketqua.show(this.moneyExchange, function () {
                this._showLuckyCoffer(countLuckyCoffer, countFreeTurn);
            }.bind(this));
        }
    },

    _showLuckyCoffer: function (countLuckyCoffer, countFreeTurn) {
        // cc.log('_showLuckyCoffer countLuckyCoffer: ' + countLuckyCoffer);

        // Show Free Turn
        this._showFreeTurn(countFreeTurn);

        this.hasOpenHopQua = true;
        this.HopQuaSlot.setMaxCoffer(countLuckyCoffer);
        if (countLuckyCoffer > 0 && this.hasOpenHopQua) {
            this.txtAwardLuckyCoffer.node.active = true;
            this.txtAwardLuckyCoffer.string = 'Bạn nhận được ' + countLuckyCoffer + ' hộp quà may mắn';
            this.txtAwardLuckyCoffer.node.runAction(cc.sequence(cc.delayTime(2), cc.callFunc(function () {
                this.txtAwardLuckyCoffer.node.active = false;
                if (this.hasOpenHopQua && !this.lostForcus) {
                    this.HopQuaSlot.show(countLuckyCoffer, function () {
                        this._showLine();
                    }.bind(this));
                }
                else {
                    // cc.log('######## hasOpenHopQua false => ko hien thi');
                    this._showLine();
                }

            }.bind(this))));
        }
        else {
            this._showLine();
        }
    },

    _showFreeTurn: function (countFreeTurn) {
        // cc.log('_showFreeTurn ');
        var hasFreeTurn = this.countFreeTurn > 0;
        this.freeTurnNode.active = hasFreeTurn;
        this.freeTurnText.string = 'BẠN CÒN ' + this.countFreeTurn + ' LƯỢT QUAY MIỄN PHÍ';
        if (hasFreeTurn) {
            this.txtAwardFreeTurn.node.active = true;
            this.txtAwardFreeTurn.string = 'Bạn nhận được ' + countFreeTurn + ' lượt quay miễn phí';
            this.txtAwardFreeTurn.node.runAction(cc.sequence(cc.delayTime(2), cc.callFunc(function () {
                this.txtAwardFreeTurn.node.active = false;
            }.bind(this))));
        }
    },

    _showLine: function () {
        // cc.log('_showLine ');
        var i, self = this,
            pots = this.pots;
        if (pots.length > 0 && !this.lostForcus) {
            for (i = 0; i < pots.length; i += 1) {
                (function (lineIndex, index) {
                    self.node.runAction(cc.sequence(cc.delayTime(1.5 * i), cc.callFunc(function () {
                        self.audioManager.playChickenRow();
                        self.lineCuaAn.activeLine(lineIndex, function () {
                            if (index >= pots.length - 1) {
                                if (pots.length > 1 && !self.lostForcus) {
                                    // Show All Line
                                    self._showAllLine();
                                }
                                else {
                                    self._autoPlayCheck();
                                }
                            }
                        });

                    })));
                }(pots[i] - 1, i));
            }
        }
        else {
            self._autoPlayCheck();
        }
    },

    _showAllLine: function () {
        // cc.log('_showAllLine ');
        this.audioManager.playChickenRow();
        for (var i = 0; i < this.pots.length; i += 1) {
            (function (index) {
                this.lineCuaAn.activeLineWithDelay(this.pots[index] - 1, 1, function () {
                    if (index >= this.pots.length - 1) {
                        this._autoPlayCheck();
                    }
                }.bind(this));
            }.bind(this)(i));
        }
    },

    _resetLine: function () {
        this.node.stopAllActions();
        this.lineCuaAn.resetAllLine();
        this.HopQuaSlot.node.stopAllActions();
        this.txtAwardLuckyCoffer.node.stopAllActions();
        this.txtAwardFreeTurn.node.stopAllActions();
        this.HopQuaSlot.node.active = false;
        this.txtAwardLuckyCoffer.node.active = false;
        this.txtAwardFreeTurn.node.active = false;
    },

    _initOnce: function () {
        if (this.betting === undefined) {
            this.betting = 100;
            this.autoPlay = false;
        }
    },

    shuffle: function (array) {
        var currentIndex = array.length,
            temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }
});
