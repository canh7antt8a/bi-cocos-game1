var Card = require('Card'),
    Utils = require('Utils'),
    UiManager = require('UiManager'),
    BaseMinigameGameplay = require('BaseMinigameGameplay'),
    GameConstant = require('GameConstant'),
    CommonConstant = require('CommonConstant'),
    ToggleCurrency = require('ToggleCurrency'),
    ItemTextMiniPoker = require('ItemTextMiniPoker'),
    MiniPokerConstant = require('MiniPokerConstant'),
    ColumnInfoMiniPoker = require('ColumnInfoMiniPoker');

cc.Class({
    extends: BaseMinigameGameplay,

    properties: {
        btnMucCuocList: {
            default: [],
            type: cc.Node
        },
        layoutCardList: {
            default: [],
            type: ColumnInfoMiniPoker
        },
        btnCanGat: cc.Node,
        thanhCanGat: cc.Node,
        btnCurrency: cc.Node,
        lblQuy: cc.Label,
        textFlyPrefab: cc.Prefab,
        btnAutoPlay: cc.Node,
        imgDen1: cc.Node,
        imgDen2: cc.Node,

        gameCmd: {
            'default': GameConstant.MINI_POKER.CMD,
            visible: false
        },
    },

    $onLoad: function () {
        this.isLostFocus = false;
        this.isTextShowing = false;
        this.countEventFinish = 0;
        this.potWin = 0;
        this.autoPlay = false;
        this.autoPlayTmp = false;
        this.currencyIndex = this.btnCurrency.getComponent(ToggleCurrency).index;
        this.moneyBetList = [100, 1000, 10000];
        this.quyXuList = [];
        this.quyPiList = [];
        this.paramsFinish = 0;
        this.firstLoad = true;
        this.resetButtonMucCuoc();

        // Text Fly
        this.textFly1 = cc.instantiate(this.textFlyPrefab);
        this.textFly1.getComponent(ItemTextMiniPoker).setColor(cc.Color.YELLOW);
        this.textFly1.active = false;
        this.node.addChild(this.textFly1);
        this.textFly2 = cc.instantiate(this.textFlyPrefab);
        this.node.addChild(this.textFly2);
        this.textFly2.active = false;
        this.textFly2.getComponent(ItemTextMiniPoker).setColor(cc.Color.GREEN);

        // Event
        this.gameManager.eventDispatchers.local.addEventListener(MiniPokerConstant.Event.TURN_PREPARE, this.onPrepareGame, this);
        this.gameManager.eventDispatchers.local.addEventListener(MiniPokerConstant.Event.TURN_START, this.onStartGame, this);
        this.gameManager.eventDispatchers.local.addEventListener(MiniPokerConstant.Event.TURN_UPDATE, this.onUpdateGame, this);
        this.gameManager.eventDispatchers.local.addEventListener(MiniPokerConstant.Event.TURN_FINISH, this.onFinishGame, this);
        this.gameManager.eventDispatchers.local.addEventListener(MiniPokerConstant.Event.GET_JAR_SUCCESS, this.onGetMoneyJar, this);
        this.gameManager.eventDispatchers.local.addEventListener(MiniPokerConstant.Event.UPDATE_JAR, this.onUpdateMoneyJar, this);
    },

    onEnable: function () {
        this.reset();
        this.firstLoad = false;
    },

    $onFocus: function () {
        this.isLostFocus = false;
        this.countEventFinish = -5;

        // Reset Card
        this.reset();

        // Auto Play
        if (this.autoPlay && this.gameManager.gameState === MiniPokerConstant.GameState.NONE) {
            this.onPlayClick();
        }
    },

    $onLostFocus: function () {
        this.isLostFocus = true;
    },

    resetButtonMucCuoc: function () {
        // Reset Label
        var i;
        for (i = 0; i < this.btnMucCuocList.length; i += 1) {
            var label = this.btnMucCuocList[i].getComponentInChildren(cc.Label);
            label.string = Utils.Number.abbreviate(this.moneyBetList[i], 3);
        }

        // Reset Sprite
        for (i = 0; i < this.btnMucCuocList.length; i += 1) {
            var s = this.btnMucCuocList[i].getComponent(cc.Sprite);
            s.enabled = i === 0;
        }
    },

    onUpdateMoneyJar: function (params) {
        var money = params.money;
        var isPI = params.currency === CommonConstant.CurrencyType.Ip.NAME;
        for (var i = 0; i < this.moneyBetList.length; i += 1) {
            var cur = isPI ? this.moneyBetList[i] : this.moneyBetList[i];
            if (cur === params.betting) {
                if (isPI) {
                    this.quyPiList[i] = money;
                }
                else {
                    this.quyXuList[i] = money;
                }
            }
        }
        this._updateMoneyQuy();
    },

    onGetMoneyJar: function (results) {
        var QuyPi = results.data[CommonConstant.CurrencyType.Ip.NAME];
        var QuyXu = results.data[CommonConstant.CurrencyType.Xu.NAME];
        for (var i = 0; i < this.moneyBetList.length; i += 1) {
            this.quyPiList.push(QuyPi[this.moneyBetList[i]].balance);
            this.quyXuList.push(QuyXu[this.moneyBetList[i]].balance);
            this._updateMoneyQuy();
        }
    },

    onPrepareGame: function () {
        // cc.log('onPrepareGame');
        if (this.autoPlay) {
            this.onPlayClick();
        }
    },

    onStartGame: function (params) {
        // cc.log('onStartGame game state ' + this.gameManager.gameState);
        // Change Card First => Card Finish Old
        if (this.isLostFocus || !this.node.active) {
            // cc.log('Not rotate');
            return;
        }
        this.node.stopAllActions();
        this.audioId = this.audioManager.playVongQuay();
        this.potWin = params.potWin;
        var self = this;
        for (var i = 0; i < self.layoutCardList.length; i += 1) {
            var layoutCard = self.layoutCardList[i];
            layoutCard.updateCardFirst();
        }

        // Action
        var maxTime = 3.6;
        var action = cc.sequence(
            cc.callFunc(function () {
                for (var i = 0; i < self.layoutCardList.length; i += 1) {
                    var layoutCard = self.layoutCardList[i];
                    if (layoutCard) {
                        layoutCard.node.stopAllActions();
                        layoutCard.node.y = -92;
                        var action = cc.moveTo((maxTime - (self.layoutCardList.length - i) * 0.6), cc.v2(layoutCard.node.x, -(layoutCard.node.height - 92)));
                        layoutCard.node.runAction(action);
                    }
                }
            }),
            cc.delayTime(0.3),
            cc.callFunc(function () {
                self._updateCardFinish(params);
            }),
            cc.delayTime(maxTime),
            cc.callFunc(function () {
                self._showTextFinishGame();
            })
        );
        this.node.runAction(action);
        this.node.runAction(cc.sequence(cc.delayTime(maxTime - 0.4), cc.callFunc(function () {
            self.audioManager.stopEffect(self.audioId);
            self.audioId = 0;
        })));
    },

    onUpdateGame: function () {},

    onFinishGame: function (params) {
        // cc.log('onFinishGame');
        this.paramsFinish = params;
        this._showTextFinishGame();
    },

    onClickMucCuoc: function (param) {
        this.audioManager.playButtonClick();
        if (this.gameManager.gameState !== MiniPokerConstant.GameState.ROTATE) {
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
    },

    onPlayClick: function () {
        // Check Ready Init Card Default
        this.isTextShowing = false;
        var initFinish = true;
        // cc.log('onPlayClick');
        if (this.isLostFocus || !this.node.active) {
            this.sendStartGame();
            // cc.log('Cancel action => send to server');
            return;
        }
        for (var i = 0; i < this.layoutCardList.length; i += 1) {
            var layoutCard = this.layoutCardList[i];
            if (!layoutCard.isReady) {
                initFinish = false;
                break;
            }
        }
        if (!initFinish) {
            UiManager.openWarningMessage('Xin vui lòng đợi trong giây lát!', 1);
            return;
        }

        // Start Game
        if (this.gameManager.gameState === MiniPokerConstant.GameState.NONE) {
            // Play
            this.countEventFinish = 0;
            this._resetCanGat();
            var pos = cc.v2(0, 70);
            var pos2 = cc.v2(0, 0);
            this.btnCanGat.runAction(cc.sequence(cc.moveTo(0.4, cc.v2(pos.x, pos.y - 30)).easing(cc.easeCubicActionOut()), cc.delayTime(0.2), cc.moveTo(0.4, pos).easing(cc.easeCubicActionIn())));
            this.thanhCanGat.runAction(cc.sequence(cc.moveTo(0.4, cc.v2(pos2.x, pos2.y - 10)).easing(cc.easeCubicActionOut()), cc.delayTime(0.2), cc.moveTo(0.4, pos2).easing(cc.easeCubicActionIn()), cc.callFunc(function () {
                this._resetCanGat();
            }.bind(this))));

            // Effect Light
            this.imgDen1.opacity = 255;
            this.imgDen2.opacity = 0;
            this.imgDen1.stopAllActions();
            this.imgDen2.stopAllActions();
            var action = cc.repeatForever(cc.sequence(cc.fadeIn(0), cc.delayTime(0.2), cc.fadeOut(0), cc.delayTime(0.2)));
            var action1 = cc.repeatForever(cc.sequence(cc.fadeOut(0), cc.delayTime(0.2), cc.fadeIn(0), cc.delayTime(0.2)));
            this.imgDen1.runAction(action1);
            this.imgDen2.runAction(action);

            // Send
            this.sendStartGame();
        }
        else {
            UiManager.openWarningMessage('Trò chơi đang diễn ra. Xin vui lòng đợi trong giây lát!', 1);
        }
    },

    sendStartGame: function () {
        var mucCuocIndex = this._getMoneySelectIndex();
        var isPI = this.currencyIndex === 0 || this.currencyIndex === undefined;
        var currency = isPI ? CommonConstant.CurrencyType.Ip.NAME : CommonConstant.CurrencyType.Xu.NAME;
        var money = this.moneyBetList[mucCuocIndex];
        this.gameManager.sendStartGame(currency, money);
    },

    onRankClick: function () {
        this.audioManager.playButtonClick();
        UiManager.openModalByName('games/mini_poker/TopUserMiniPoker');
    },

    onHistoryClick: function () {
        var self = this;
        this.audioManager.playButtonClick();
        UiManager.openModalByName('games/mini_poker/HistoryMiniPoker', function (historyTable) {
            historyTable.getComponent('HistoryTableMiniPoker').init(self.gameManager.historyList);
        });
    },

    onHelpClick: function () {
        this.audioManager.playButtonClick();
        UiManager.openModalByName('games/mini_poker/HelpMiniPoker');
    },

    onAutoPlayClick: function (param) {
        this.audioManager.playButtonClick();
        this.autoPlay = !this.autoPlay;
        param.target.getComponentInChildren(cc.Sprite).enabled = this.autoPlay;
    },

    onCurrencyClick: function () {
        this.audioManager.playButtonClick();
        if (this.gameManager.gameState !== MiniPokerConstant.GameState.ROTATE) {
            this.btnCurrency.getComponent('ToggleCurrency').click();
            this.currencyIndex = this.btnCurrency.getComponent(ToggleCurrency).index;
            this.resetButtonMucCuoc();
            this._updateMoneyQuy();
        }
        else {
            UiManager.openWarningMessage('Đang quay không thể thay đổi loại cược!', 1);
        }
    },

    onCloseClick: function () {
        this.audioManager.playButtonClick();
        this.node.active = false;
        this.node.scale = 0;
        if (this.audioId) {
            this.audioManager.stopEffect(this.audioId);
        }
        this.gameManager.saveHistory();
    },

    reset: function () {
        // Reset Card
        if (!this.firstLoad) {
            for (var i = 0; i < this.layoutCardList.length; i += 1) {
                var layoutCard = this.layoutCardList[i];
                if (layoutCard) {
                    layoutCard.node.stopAllActions();
                    layoutCard.node.y = -(layoutCard.node.height - 92);
                }
            }
        }

        // Reset Light
        this.imgDen2.stopAllActions();
        this.imgDen1.stopAllActions();
        this.imgDen1.opacity = 255;
        this.imgDen2.opacity = 0;
        this.textFly1.active = false;
        this.textFly2.active = false;

        // Reset Can Gat
        this._resetCanGat();
    },

    _resetCanGat: function () {
        this.btnCanGat.stopAllActions();
        this.thanhCanGat.stopAllActions();
        this.btnCanGat.position = cc.v2(0, 70);
        this.thanhCanGat.position = cc.v2(0, 0);
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

    _updateMoneyQuy: function () {
        if (this.currencyIndex === undefined) {
            this.currencyIndex = 0;
        }
        var isPI = this.currencyIndex === 0;
        this.lblQuy.string = Utils.Number.format(isPI ? this.quyPiList[this._getMoneySelectIndex()] : this.quyXuList[this._getMoneySelectIndex()]);
    },

    _updateCardFinish: function (params) {
        for (var i = 0; i < params.result.length; i += 1) {
            var card = Card.fromId(params.result[i]);
            this.layoutCardList[i].updateCardFinish(card);
        }
    },

    _showTextFinishGame: function () {
        // Check State
        this.countEventFinish += 1;
        if (this.countEventFinish < 2 || this.isLostFocus || this.isTextShowing || !this.node.active) {
            return;
        }
        // cc.log('######show text  this.node.active: ' + this.node.active);
        this.isTextShowing = true;
        this.countEventFinish = 0;
        // cc.log('_showTextFinishGame game state ' + this.gameManager.gameState);

        // Stop Den
        this.imgDen2.stopAllActions();
        this.imgDen1.stopAllActions();
        this.imgDen1.opacity = 255;
        this.imgDen2.opacity = 0;

        // Pot Win
        var self = this;
        if (self.potWin > 0) {
            self.textFly1.active = true;
            self.textFly1.y = 0;
            self.textFly1.stopAllActions();
            var textFlyComponent = self.textFly1.getComponent(ItemTextMiniPoker);
            textFlyComponent.setText(MiniPokerConstant.getPotName(self.potWin));
            var action = cc.sequence(cc.moveBy(2, cc.v2(0, 180)).easing(cc.easeQuinticActionOut()), cc.delayTime(1), cc.callFunc(function () {
                self.textFly1.active = false;
            }));
            self.textFly1.runAction(action);
            // self.audioManager.playWin();
        }
        else {
            // self.audioManager.playLose();
        }

        // Money Text
        var currencyName = self.gameManager.lastCurrency === CommonConstant.CurrencyType.Ip.NAME ? CommonConstant.CurrencyType.Ip.DISPLAY_NAME : CommonConstant.CurrencyType.Xu.DISPLAY_NAME;
        self.node.runAction(cc.sequence(cc.delayTime(self.potWin > 0 ? 0.4 : 0), cc.callFunc(function () {
            self.textFly2.active = true;
            self.textFly2.y = 0;
            self.textFly2.stopAllActions();
            var player = self.paramsFinish.player;
            var textFlyComponent = self.textFly2.getComponent(ItemTextMiniPoker);
            textFlyComponent.setText((player.moneyExchange > 0 ? '+' : '') + Utils.Number.format(player.moneyExchange) + ' ' + currencyName);
            var action = cc.sequence(cc.moveBy(1.5, cc.v2(0, 140)).easing(cc.easeQuinticActionOut()), cc.delayTime(1), cc.callFunc(function () {
                self.textFly2.active = false;
                self.isTextShowing = false;
            }));
            self.textFly2.runAction(action);
        })));
    },
});
