var BaseMinigameGameplay = require('BaseMinigameGameplay'),
    VongQuayConstant = require('VongQuayConstant'),
    UiManager = require('UiManager'),
    Utils = require('Utils'),
    VongQuay = require('VongQuay'),
    CommonConstant = require('CommonConstant'),
    GameConstant = require('GameConstant');

cc.Class({
    extends: BaseMinigameGameplay,

    properties: {
        vong2: cc.Node,
        vong1: cc.Node,
        vong3: cc.Node,

        autoPlayNode: cc.Node,
        autoOnLabel: cc.Label,
        autoOffLabel: cc.Label,

        txtCurrencyJar: cc.Label,
        txtMoneyJar: cc.Label,

        txtBetting: cc.Label,

        txtFreeCountPlay: cc.Label,

        btnGetFree: cc.Node,
        txtGetFree: cc.Label,

        txtQuestionCapcha: cc.Label,
        inputResultCapcha: cc.EditBox,
        capchaBox: cc.Node,

        denSangNodeList: {
            default: [],
            type: cc.Node
        },

        resultNode: cc.Node,
        awardLabelList: {
            default: [],
            type: cc.Label
        },

        gameCmd: {
            'default': GameConstant.VONG_QUAY.CMD,
            visible: false
        },
    },

    $onLoad: function () {
        // Hide Node
        this.resultNode.active = false;
        for (var i = 0; i < this.denSangNodeList.length; i += 1) {
            this.denSangNodeList[i].opacity = 0;
        }

        // Var
        this.paramsResult = 0;
        this.rotateCount = 0;
        this.autoPlay = false;
        this.lostForcus = false;
        this._showOnOffAutoPlay();
        this.txtCurrencyJar.string = CommonConstant.CurrencyType.Ip.CHIP_NAME;

        // Event
        this.gameManager.eventDispatchers.local.addEventListener(VongQuayConstant.Event.TURN_PREPARE, this.onPrepareGame, this);
        this.gameManager.eventDispatchers.local.addEventListener(VongQuayConstant.Event.TURN_START, this.onStartGame, this);
        this.gameManager.eventDispatchers.local.addEventListener(VongQuayConstant.Event.TURN_UPDATE, this.onUpdateGame, this);
        this.gameManager.eventDispatchers.local.addEventListener(VongQuayConstant.Event.TURN_FINISH, this.onFinishGame, this);
        this.gameManager.eventDispatchers.local.addEventListener(VongQuayConstant.Event.TURN_GET_CAPCHA, this.onGetCapcha, this);
        this.gameManager.eventDispatchers.local.addEventListener(VongQuayConstant.Event.TURN_RESOLVE_CAPCHA, this.onResolveCapcha, this);
        this.gameManager.eventDispatchers.local.addEventListener(VongQuayConstant.Event.GET_JAR_SUCCESS, this.onGetJarSuccess, this);
        this.gameManager.eventDispatchers.local.addEventListener(VongQuayConstant.Event.UPDATE_JAR, this.onUpdateJar, this);
    },

    $onLostFocus: function () {
        if (!this.node.active) {
            return;
        }
        this.lostForcus = true;
        // this._stopGamePlay();
    },

    $onFocus: function () {
        this.lostForcus = false;
        if (!this.node.active) {
            return;
        }
    },

    onDisable: function () {
        this.gameManager.saveHistory();
    },

    onEnable: function () {
        if (this.gameManager.gameState !== VongQuayConstant.GameState.NONE) {
            this._stopGamePlay();
            this._changeFinishState();
        }
        else {
            this.gameManager.requestRefreshGame();
            this.gameManager.getJar();
        }
    },

    $onUpdate: function (dt) {
        if (this.hasCountDownFree) {
            if (this.timeCountDownFree > 0) {
                this.timeCountDownFree -= dt;
                this.txtGetFree.string = '' + Utils.Date.fromSecond(this.timeCountDownFree);
            }
            else {
                this.txtGetFree.string = 'Nhận lượt quay miễn phí';
            }
        }
    },

    onUpdateJar: function (params) {
        if (params.currency === CommonConstant.CurrencyType.Ip.NAME) {
            this.txtMoneyJar.string = Utils.Number.format(params.money);
        }
    },

    onGetJarSuccess: function (params) {
        this.txtMoneyJar.string = Utils.Number.format(params.data.jar.currencies.IP);
    },

    onResolveCapcha: function () {},

    onGetCapcha: function (params) {
        if (params.data.question) {
            this.txtQuestionCapcha.string = params.data.question;
            this.capchaBox.active = true;
            this.inputResultCapcha.string = '';
        }
        if (params.data.isCorrect !== undefined) {
            if (params.data.isCorrect === false) {
                UiManager.openWarningMessage('Sai capcha!', 1);
            }
            else {
                var freePlayInfo = params.allData.freePlayInfo;
                this._updateFreeTurn(freePlayInfo.count, freePlayInfo.captchaRequired, freePlayInfo.time, params.allData);
                this.capchaBox.active = false;
            }
        }
    },

    onUpdateGame: function (params) {
        this._updateVongQuayData(params);
        if (params.allData !== undefined && params.allData.freePlayInfo !== undefined) {
            this._updateFreeTurn(params.allData.freePlayInfo.count, params.allData.freePlayInfo.captchaRequired, params.allData.freePlayInfo.time, params.allData);
        }
        if (params.data !== undefined && params.data.gameState === VongQuayConstant.GameState.NONE) {
            if (!this.node.active || this.lostForcus || !this.resultNode.active) {
                this._autoPlay();
            }
        }
    },

    onPrepareGame: function (params) {
        //cc.log('onPrepareGame');
        if (params.action === VongQuayConstant.Action.UPDATE_FREE_PLAY) {
            this._updateFreeTurn(params.count, params.captchaRequired, params.time, params.allData);
        }
        else if (params.action === VongQuayConstant.Action.CHANGE_STATE) {
            // If has freePlayInfo
            if (params.allData.freePlayInfo) {
                this._updateFreeTurn(params.allData.freePlayInfo.count, params.allData.freePlayInfo.captchaRequired, params.allData.freePlayInfo.time, params.allData);
            }
        }
    },

    onStartGame: function (params) {
        // cc.log('onStartGame');
        this._updateVongQuayData(params);
        this._rotate(params);
    },

    onFinishGame: function (params) {
        this._changeFinishState();
        this.paramsResult = params;
        // cc.log('onFinishGame');
        // cc.log(this.paramsResult);

        // Check if node not active
        if (!this.node.active || this.lostForcus) {
            // cc.log('node not active => kill turn');
            this._stopGamePlay();
            this._setFastResult();
        }
    },

    onHistoryClick: function () {
        var self = this;
        this.audioManager.playButtonClick();
        UiManager.openModalByName('games/vong_quay/HistoryVongQuay', function (historyTable) {
            historyTable.getComponent('HistoryTableVongQuay').init(self.gameManager.historyList);
        });
    },

    onCloseClick: function () {
        this.node.active = false;
        this.node.scale = 0;
    },

    onPlayClick: function () {
        //cc.log('onPlayClick');
        if (this.resultNode.active) {
            return;
        }
        if (this.gameManager.gameState !== VongQuayConstant.GameState.NONE) {
            // cc.log('this.gameManager.gameState ' + this.gameManager.gameState);
            UiManager.openWarningMessage('Xin vui lòng đợi lượt chơi kết thúc!', 1);
            return;
        }
        this.resultNode.active = false;
        this.gameManager.sendStartGame();
    },

    onAutoPlayClick: function () {
        this.autoPlay = !this.autoPlay;
        this._showOnOffAutoPlay();
    },

    onGetFreeClick: function () {
        if (this.autoPlay) {
            UiManager.openWarningMessage('Xin vui lòng tắt chế độ tự quay để nhận lượt quay miễn phí!', 1);
            return;
        }
        if (this.gameManager.gameState !== VongQuayConstant.GameState.NONE) {
            UiManager.openWarningMessage('Xin vui lòng đợi lượt quay kết thúc!', 1);
            return;
        }
        this.gameManager.sendGetNewFree();
    },

    onCapchaSubmitClick: function () {
        if (this.inputResultCapcha.string.length < 1) {
            UiManager.openWarningMessage('Xin vui điền câu trả lời!', 1);
            return;
        }
        this.gameManager.sendCapcha(this.inputResultCapcha.string);
    },

    onCapchaCloseClick: function () {
        this.capchaBox.active = false;
    },

    setResultVong1: function (slotId, isFastRotate) {
        var self = this;
        var angle = (slotId - 1) * 30;
        if (isFastRotate) {
            this.vong1.rotation = 360 * 8 - angle;
        }
        else {
            this.vong1.runAction(cc.sequence(cc.rotateTo(3, 360 * 8 - angle).easing(cc.easeCircleActionOut()), cc.callFunc(function () {
                self._rotateCount();
            })));
        }
    },

    setResultVong2: function (slotId, isFastRotate) {
        var self = this;
        var angle = (slotId - 1) * 45;
        if (isFastRotate) {
            this.vong2.rotation = -360 * 6 - angle;
        }
        else {
            this.vong2.runAction(cc.sequence(cc.rotateTo(3, -360 * 6 - angle).easing(cc.easeCircleActionOut()), cc.callFunc(function () {
                self._rotateCount();
            })));
        }
    },

    setResultVong3: function (slotId, isFastRotate) {
        var self = this;
        var angle = slotId * 45 / 2 + (slotId - 1) * 45 / 2;
        if (isFastRotate) {
            this.vong3.rotation = 360 * 6 - angle;
        }
        else {
            this.vong3.runAction(cc.sequence(cc.rotateTo(3, 360 * 6 - angle).easing(cc.easeCircleActionOut()), cc.callFunc(function () {
                self._rotateCount();
            })));
        }
    },

    _showOnOffAutoPlay: function () {
        this.autoPlayNode.active = this.autoPlay;
        this.autoOnLabel.node.active = this.autoPlay;
        this.autoOffLabel.node.active = !this.autoPlay;
    },

    _updateFreeTurn: function (count, captchaRequired, time, allData) {
        var hasFree = count > 0 && captchaRequired;
        if (hasFree) {
            this.txtGetFree.string = 'Nhận lượt quay miễn phí';
        }
        if (!captchaRequired && count > 0) {
            this.txtGetFree.string = 'Bạn đang quay miễn phí';
        }
        this.txtFreeCountPlay.string = count;
        this.btnGetFree.getComponent(cc.Button).enabled = hasFree;
        this.timeCountDownFree = time;
        this.hasCountDownFree = count <= 0 && captchaRequired;

        // Price Betting
        if (allData !== undefined && this.gameManager.gameState === VongQuayConstant.GameState.NONE) {
            var isFree = allData.isFree;
            var betting = allData.betting;
            if (isFree === true) {
                this.txtBetting.string = '0' + CommonConstant.CurrencyType.Ip.CHIP_NAME;
                this.gameManager.isFreeTurn = true;
            }
            else {
                this.txtBetting.string = betting + CommonConstant.CurrencyType.Ip.CHIP_NAME;
            }
        }
    },

    _removeEndLineString: function (str) {
        return str.replace(/\n+/g, ' ');
    },

    _updateVongQuayData: function (params) {
        if (!params.allData) {
            return;
        }
        var awards = params.allData.awards;
        this.vong1.getComponent(VongQuay).updateData(awards[0]);
        this.vong2.getComponent(VongQuay).updateData(awards[1]);
        this.vong3.getComponent(VongQuay).updateData(awards[2]);

        // Price Betting
        // this.txtBetting.string = params.allData.betting + CommonConstant.CurrencyType.Ip.CHIP_NAME;
    },

    _changeFinishState: function () {
        // cc.log('_changeFinishState');
        this.gameManager.gameState = this.gameManager.gameState === VongQuayConstant.GameState.FINALIZING ? VongQuayConstant.GameState.FINISH : VongQuayConstant.GameState.FINALIZING;
        if (this.gameManager.gameState !== VongQuayConstant.GameState.FINISH) {
            return;
        }
        //cc.log('_changeFinishState ===> ok');
        this._showResult();
    },

    _showResult: function () {
        this._setFastResult();
        if (this.lostForcus || !this.node.active) {
            // cc.log('cancel _showResult');
            self._autoPlay();
            return;
        }
        var self = this,
            i;
        var result = this.paramsResult.data.result;
        if (result) {
            this.resultNode.active = true;
            this.resultNode.opacity = 0;
            var index = 0;
            for (i = 0; i < result.length; i += 1) {
                this.awardLabelList[i].string = '';
            }
            for (i = 0; i < result.length; i += 1) {
                if (result[i][0].amount > 0) {
                    this.awardLabelList[index].string = CommonConstant.CurrencyType.normalize(this._removeEndLineString(result[i][0].description));
                    index += 1;
                }
            }
            this.resultNode.runAction(cc.sequence(cc.fadeIn(0.3), cc.delayTime(3), cc.fadeOut(0.2), cc.callFunc(function () {
                self.resultNode.active = false;
                self.gameManager.gameState = VongQuayConstant.GameState.NONE;
                self._autoPlay();
            })));
            // cc.log('_showResult');
        }
    },

    _autoPlay: function () {
        if (this.autoPlay) {
            // cc.log('==> autoPlay');
            this.onPlayClick();
        }
    },

    _rotateCount: function () {
        this.rotateCount += 1;
        if (this.rotateCount >= 3) {
            this.rotateCount = 0;
            this._changeFinishState();
            this._stopGamePlay();
        }
    },

    _rotate: function (params) {
        this.paramsResult = params;
        this.rotateCount = 0;
        var results = params.data.result;
        var r1 = results[0][0].id + 1;
        var r2 = results[1][0].id + 1;
        var r3 = results[2][0].id + 1;
        var self = this,
            i;
        this._stopGamePlay();
        if (this.lostForcus || !this.node.active) {
            // cc.log('cancel _rotate');
            return;
        }
        this.vong1.runAction(cc.sequence(cc.rotateTo(2, 360 * 7).easing(cc.easeQuadraticActionIn()),
            cc.callFunc(function () {
                self.setResultVong1(r1);
            })));
        this.vong2.runAction(cc.sequence(cc.rotateTo(3, -360 * 7).easing(cc.easeQuadraticActionIn()),
            cc.callFunc(function () {
                self.setResultVong2(r2);
            })));
        this.vong3.runAction(cc.sequence(cc.rotateTo(2.5, 360 * 7).easing(cc.easeQuadraticActionIn()),
            cc.callFunc(function () {
                self.setResultVong3(r3);
            })));
        for (i = 0; i < this.denSangNodeList.length; i += 1) {
            this.denSangNodeList[i].runAction(cc.repeatForever(cc.sequence(cc.fadeIn(0.08), cc.delayTime(0.08), cc.fadeOut(0.08), cc.delayTime(0.08))));
        }
        // cc.log('Rotate');
    },

    _setFastResult: function () {
        var results = this.paramsResult.data.result;
        if (results.length > 0) {
            this.setResultVong1(results[0][0].id + 1, true);
            this.setResultVong2(results[1][0].id + 1, true);
            this.setResultVong3(results[2][0].id + 1, true);
        }
    },

    _stopGamePlay: function () {
        this.vong1.stopAllActions();
        this.vong2.stopAllActions();
        this.vong3.stopAllActions();
        for (var i = 0; i < this.denSangNodeList.length; i += 1) {
            this.denSangNodeList[i].stopAllActions();
        }
    },
});
