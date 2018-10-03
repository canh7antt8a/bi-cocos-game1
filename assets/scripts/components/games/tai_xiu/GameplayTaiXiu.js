var BaseMinigameGameplay = require('BaseMinigameGameplay'),
    GameConstant = require('GameConstant'),
    Utils = require('Utils'),
    AuthUser = require('AuthUser'),
    CommonConstant = require('CommonConstant'),
    GameManagerConstant = require('GameManagerConstant'),
    TaiXiuConstant = require('TaiXiuConstant'),
    UiManager = require('UiManager');

cc.Class({
    extends: BaseMinigameGameplay,

    properties: {
        chipPrefab: cc.Prefab,
        chipListNode: cc.Node,
        chipListScrollView: cc.ScrollView,

        diceNode: {
            default: [],
            type: cc.Node
        },
        diceSpriteFrames: {
            default: [],
            type: cc.SpriteFrame
        },

        bigPotResultNode: cc.Node,
        littlePotResultNode: cc.Node,

        bigPotNumberOfPlayersLabel: cc.Label,
        littlePotNumberOfPlayersLabel: cc.Label,

        bigPotTotalBettingLabel: cc.Label,
        littlePotTotalBettingLabel: cc.Label,

        bigPotPlayerBettingLabel: cc.Label,
        littlePotPlayerBettingLabel: cc.Label,

        bigPotTempPlayerBettingLabel: cc.Label,
        littlePotTempPlayerBettingLabel: cc.Label,

        bigPotTempPlayerBettingNode: cc.Node,
        littlePotTempPlayerBettingNode: cc.Node,

        bigPotResultHistoryNode: cc.Node,
        littlePotResultHistoryNode: cc.Node,
        activePotResultHistoryNode: cc.Node,
        historyListNode: cc.Node,
        historyTrayScrollView: cc.ScrollView,

        toggleCurrencyIconNode: cc.Node,
        bottomToggleCurrencyIconNode: cc.Node,

        bottomPanelNode: cc.Node,

        balanceLabel: cc.Label,

        timeLeftLabel: cc.Label,

        gameStateLabel: cc.Label,

        textMoneyPrefab: cc.Prefab,

        denNhapNhayAnimation: cc.Animation,
        denNhapNhaySprite: cc.Sprite,
        denNhapNhaySpriteFrameFirst: cc.SpriteFrame,
        gameCmd: {
            'default': GameConstant.TAI_XIU.CMD,
            visible: false
        },
    },

    onEnable: function () {
        var self = this;
        this.gameManager.enablePing();
        this.node.scale = 1;

        this.historyListNode.active = false;
        this.addTimeout(TaiXiuConstant.TimeoutId.SHOW_HISTORY_TRAY, setTimeout(function () {
            self.historyListNode.opacity = 0;
            self.historyListNode.active = true;
            if (self.historyListNode.width >= self.historyListNode.parent.width) {
                self.historyTrayScrollView.scrollToRight();
            }
            else {
                self.historyTrayScrollView.scrollToLeft();
            }
            self.historyListNode.opacity = 255;
        }, 500));
    },

    onDisable: function () {
        this.gameManager.disablePing();
    },

    // called every frame, uncomment this function to activate update callback
    $onUpdate: function () {
        if (this.gameManager) {
            this.timeLeftLabel.string = this.gameManager.getFormattedCurrentTimeLeft();
            this.gameStateLabel.string = this.gameManager.getStateLabel();
        }
    },

    // use this for initialization
    $onLoad: function () {
        var self = this;

        this.active = {
            pot: -1,
            currency: null
        };

        this.chipListByCurrency = {};
        this._clearPots();
        this._clearTempBetting();
        this._clearWinningPotActive();
        this._setPot(-1);
        this.gameStateLabel.string = TaiXiuConstant.GameStateName.BETTING;

        this._updateTable();

        if (this.gameManager.bettingInfo) {
            this.switchCurrency();
        }

        this.historyTrayScrollView.scrollToLeft();

        this.gameManager.eventDispatchers.local.addEventListener(TaiXiuConstant.Event.UPDATE_POTS, this.onUpdatePots, this);
        this.gameManager.eventDispatchers.local.addEventListener(TaiXiuConstant.Event.UPDATE_TEMP_BETTING, this.onUpdateTempBetting, this);
        this.gameManager.eventDispatchers.local.addEventListener(TaiXiuConstant.Event.BETTING_SUCCESS, this.onBettingSuccess, this);
        this.gameManager.eventDispatchers.local.addEventListener(TaiXiuConstant.Event.EFFECT_STATE, this.onChangeStateToEffect, this);
        this.gameManager.eventDispatchers.local.addEventListener(TaiXiuConstant.Event.PLAYER_BETTING_STATE, this.onChangeStateToPlayerBetting, this);
        this.gameManager.eventDispatchers.local.addEventListener(TaiXiuConstant.Event.FINISH, this.onFinishGame, this);

        this.gameManager.eventDispatchers.local.addEventListener(GameManagerConstant.Event.UPDATE_USER_MONEY, this.onUpdateUserMoney, this);
        this.gameManager.eventDispatchers.local.addEventListener(GameManagerConstant.Event.NEW_MATCH_LOST_FOCUS, this.onNewMatchLostFocus, this);

        self.addTimeout(setTimeout(function () {
            if (self.node.isValid && !self.bottomPanelNode.active) {
                var oldY = self.bottomPanelNode.y;
                self.bottomPanelNode.y = 10000;
                self.bottomPanelNode.active = true;
                self.addTimeout(setTimeout(function () {
                    if (self.node.isValid) {
                        self.chipListScrollView.scrollToPercentHorizontal(0.5);
                        self.bottomPanelNode.active = false;
                        self.bottomPanelNode.y = oldY;
                    }
                }, 100));
            }
        }, 10));
    },

    close: function () {
        this.node.active = false;
        this.node.scale = 0;
    },

    submitTempBetting: function () {
        this.gameManager.acceptTempBetting();
    },

    cancelTempBetting: function () {
        this.gameManager.cancelTempBetting();
    },

    onUpdateTempBetting: function () {
        var tempBettingInfo = this.gameManager.current.tempBettingInfo;
        if (Utils.Object.isEmpty(tempBettingInfo)) {
            this._clearTempBetting();
        }
        else if (this.active.currency === tempBettingInfo.currency && this.active.pot === tempBettingInfo.pot) {
            this._setTempBetting(this.active.pot, tempBettingInfo.betting || 0);
        }
    },

    selectBigPot: function () {
        this._selectPot(TaiXiuConstant.Pot.BIG.ID);
    },

    selectLittlePot: function () {
        this._selectPot(TaiXiuConstant.Pot.LITTLE.ID);
    },

    _selectPot: function (pot) {
        this.audioManager.playButtonClick();
        if (this.gameManager.gameState === TaiXiuConstant.GameState.PLAYER_BETTING) {
            if (this.active.pot !== pot) {
                if (pot === TaiXiuConstant.Pot.BIG.ID) {
                    this._setBettingPotActive(TaiXiuConstant.Pot.BIG.ID, true);
                    this._setBettingPotActive(TaiXiuConstant.Pot.LITTLE.ID, false);
                }
                else if (pot === TaiXiuConstant.Pot.LITTLE.ID) {
                    this._setBettingPotActive(TaiXiuConstant.Pot.BIG.ID, false);
                    this._setBettingPotActive(TaiXiuConstant.Pot.LITTLE.ID, true);
                }
                this._setPot(pot);
                this.cancelTempBetting();
            }
        }
    },

    _setBettingPotActive: function (pot, isActive) {
        if (pot === TaiXiuConstant.Pot.BIG.ID) {
            this.bigPotTempPlayerBettingNode.active = isActive;
        }
        else if (pot === TaiXiuConstant.Pot.LITTLE.ID) {
            this.littlePotTempPlayerBettingNode.active = isActive;
        }
    },

    _setWinningPotActive: function (pot, isActive) {
        if (pot === TaiXiuConstant.Pot.BIG.ID) {
            this.bigPotResultNode.active = isActive;
        }
        else if (pot === TaiXiuConstant.Pot.LITTLE.ID) {
            this.littlePotResultNode.active = isActive;
        }
    },

    switchCurrency: function () {
        var success = false;
        this.audioManager.playButtonClick();
        if (this.active.currency === CommonConstant.CurrencyType.Ip.NAME) {
            this.active.currency = CommonConstant.CurrencyType.Xu.NAME;
            success = true;
        }
        else if (!this.active.currency ||
            this.active.currency === CommonConstant.CurrencyType.Xu.NAME) {
            this.active.currency = CommonConstant.CurrencyType.Ip.NAME;
            success = true;
        }

        if (success) {
            var toggleCurrencyIconComp = this.toggleCurrencyIconNode.getComponent('ToggleCurrency'),
                bottomToggleCurrencyIconComp = this.bottomToggleCurrencyIconNode.getComponent('ToggleCurrency'),
                bettingValues = this.gameManager.bettingInfo[this.active.currency] || [],
                colors = Utils.Array.createCircular(['blue', 'purple', 'green', 'red']),
                self = this,
                chipComponent,
                chip,
                i;

            this.chipListNode.removeAllChildren();
            this.chipListNode.opacity = 0;
            for (i = 0; i < bettingValues.length; i += 1) {
                chip = cc.instantiate(this.chipPrefab);
                chipComponent = chip.getComponent('Chip');
                chipComponent.init(bettingValues[i], colors.next());
                chip.on(cc.Node.EventType.TOUCH_END, function () {
                    if (self.gameManager.gameState === TaiXiuConstant.GameState.PLAYER_BETTING) {
                        self.gameManager.addTempBetting(self.active.pot, this.money, self.active.currency);
                        self.onUpdateTempBetting();
                    }
                    self.audioManager.playButtonClick();
                }, chipComponent);
                this.chipListNode.addChild(chip);
            }
            this.addTimeout(TaiXiuConstant.TimeoutId.SWITCH_CURRENCY, setTimeout(function () {
                if (self.node.isValid) {
                    if (self.chipListNode.width >= self.chipListScrollView.node.width) {
                        self.chipListScrollView.scrollToLeft();
                    }
                    else {
                        self.chipListScrollView.scrollToPercentHorizontal(0.5);
                    }
                    self.chipListNode.opacity = 255;
                }
            }, 10));

            toggleCurrencyIconComp.switchTo(this.active.currency);
            bottomToggleCurrencyIconComp.switchTo(this.active.currency);
            this._updateTable();
            this.cancelTempBetting();
        }
    },

    _updateTable: function () {
        this.onUpdatePots();
        this.onBettingSuccess();
        this.onUpdateTempBetting();
        this.onUpdateUserMoney();
    },

    onUpdatePots: function () {
        var pots = this.gameManager.pots,
            potBettingMap = (pots && pots[this.active.currency]) || {},
            bigPotBettingInfo = potBettingMap[TaiXiuConstant.Pot.BIG.ID] || {},
            littlePotBettingInfo = potBettingMap[TaiXiuConstant.Pot.LITTLE.ID] || {};

        this._setTotalBetting(TaiXiuConstant.Pot.BIG.ID, bigPotBettingInfo.money || 0);
        this._setNumberPlayerBetting(TaiXiuConstant.Pot.BIG.ID, bigPotBettingInfo.size || 0);

        this._setTotalBetting(TaiXiuConstant.Pot.LITTLE.ID, littlePotBettingInfo.money || 0);
        this._setNumberPlayerBetting(TaiXiuConstant.Pot.LITTLE.ID, littlePotBettingInfo.size || 0);

        this._clearWinningPotActive();
    },

    onBettingSuccess: function () {
        var bettingInfo = this.gameManager.current.bettingInfo,
            potBettingMap = bettingInfo[this.active.currency] || {};

        this._setBetting(TaiXiuConstant.Pot.BIG.ID, potBettingMap[TaiXiuConstant.Pot.BIG.ID] || 0);
        this._setBetting(TaiXiuConstant.Pot.LITTLE.ID, potBettingMap[TaiXiuConstant.Pot.LITTLE.ID] || 0);
    },

    onChangeStateToEffect: function (params) {
        var dices = params.dices,
            i;
        if (dices) {
            for (i = 0; i < dices.length; i += 1) {
                this.rotateDice(this.diceNode[i], this.diceSpriteFrames, dices[i], i);
            }
            this.denNhapNhayAnimation.play();
        }
        this._setPot(-1);
    },

    onChangeStateToPlayerBetting: function () {
        this.denNhapNhayAnimation.stop();
        this.denNhapNhaySprite.spriteFrame = this.denNhapNhaySpriteFrameFirst;
        this._clearWinningPotActive();
        this._clearPots();
        this._clearBetting();
        this._updateTable();
    },

    onFinishGame: function (params) {
        var potWin = params && params.potWin && params.potWin[0];
        if (Utils.Type.isNumber(potWin)) {
            this._clearWinningPotActive();
            this._setWinningPotActive(potWin, true);
            this.createNewPotResult(potWin);
        }
        this.gameManager.startGame();

        // Money
        if (this.node.active) {
            var ipExchange = params.player[CommonConstant.CurrencyType.Ip.NAME],
                xuExchange = params.player[CommonConstant.CurrencyType.Xu.NAME],
                moneyIpExchange = 0,
                moneyXuExchange = 0;
            if (ipExchange) {
                moneyIpExchange = ipExchange.moneyExchange;
                if (moneyIpExchange !== 0) {
                    var textFly = cc.instantiate(this.textMoneyPrefab);
                    textFly.getComponent(cc.Label).string = (moneyIpExchange > 0 ? '+' : '') + Utils.Number.format(moneyIpExchange) + ' ' + CommonConstant.CurrencyType.Ip.DISPLAY_NAME;
                    var action = cc.sequence(cc.moveBy(2, cc.v2(0, 200)).easing(cc.easeQuinticActionOut()), cc.delayTime(6), cc.callFunc(function () {
                        textFly.removeFromParent();
                    }));
                    textFly.runAction(action);
                    this.node.addChild(textFly);
                }
            }
            if (xuExchange) {
                moneyXuExchange = xuExchange.moneyExchange;
                if (moneyXuExchange !== 0) {
                    var textFly1 = cc.instantiate(this.textMoneyPrefab);
                    textFly1.getComponent(cc.Label).string = (moneyXuExchange > 0 ? '+' : '') + Utils.Number.format(moneyXuExchange) + ' ' + CommonConstant.CurrencyType.Xu.DISPLAY_NAME;
                    textFly1.getComponent(cc.Label).enabled = false;
                    var action1 = cc.sequence(cc.delayTime(ipExchange ? 1 : 0), cc.callFunc(function () {
                        textFly1.getComponent(cc.Label).enabled = true;
                    }), cc.moveBy(2, cc.v2(0, 150)).easing(cc.easeQuinticActionOut()), cc.delayTime(6.5), cc.callFunc(function () {
                        textFly1.removeFromParent();
                    }));
                    textFly1.runAction(action1);
                    this.node.addChild(textFly1);
                }
            }
        }
    },

    _setTotalBetting: function (pot, betting) {
        if (pot === TaiXiuConstant.Pot.BIG.ID) {
            this.bigPotTotalBettingLabel.string = Utils.Number.format(betting);
        }
        else if (pot === TaiXiuConstant.Pot.LITTLE.ID) {
            this.littlePotTotalBettingLabel.string = Utils.Number.format(betting);
        }
    },

    _setNumberPlayerBetting: function (pot, size) {
        if (pot === TaiXiuConstant.Pot.BIG.ID) {
            this.bigPotNumberOfPlayersLabel.string = '(' + Utils.Number.format(size) + ')';
        }
        else if (pot === TaiXiuConstant.Pot.LITTLE.ID) {
            this.littlePotNumberOfPlayersLabel.string = '(' + Utils.Number.format(size) + ')';
        }
    },

    _setTempBetting: function (pot, betting) {
        if (pot === TaiXiuConstant.Pot.BIG.ID) {
            this.bigPotTempPlayerBettingLabel.string = Utils.Number.format(betting);
        }
        else if (pot === TaiXiuConstant.Pot.LITTLE.ID) {
            this.littlePotTempPlayerBettingLabel.string = Utils.Number.format(betting);
        }
    },

    _setBetting: function (pot, betting) {
        if (pot === TaiXiuConstant.Pot.BIG.ID) {
            this.bigPotPlayerBettingLabel.string = Utils.Number.format(betting);
        }
        else if (pot === TaiXiuConstant.Pot.LITTLE.ID) {
            this.littlePotPlayerBettingLabel.string = Utils.Number.format(betting);
        }
    },

    _clearTempBetting: function () {
        this._setTempBetting(TaiXiuConstant.Pot.BIG.ID, 0);
        this._setTempBetting(TaiXiuConstant.Pot.LITTLE.ID, 0);
    },

    _clearBetting: function () {
        this._setBetting(TaiXiuConstant.Pot.BIG.ID, 0);
        this._setBetting(TaiXiuConstant.Pot.LITTLE.ID, 0);
    },

    _clearPots: function () {
        this._setTotalBetting(TaiXiuConstant.Pot.BIG.ID, 0);
        this._setNumberPlayerBetting(TaiXiuConstant.Pot.BIG.ID, 0);
        this._setBettingPotActive(TaiXiuConstant.Pot.BIG.ID, false);

        this._setTotalBetting(TaiXiuConstant.Pot.LITTLE.ID, 0);
        this._setNumberPlayerBetting(TaiXiuConstant.Pot.LITTLE.ID, 0);
        this._setBettingPotActive(TaiXiuConstant.Pot.LITTLE.ID, false);
    },

    _clearWinningPotActive: function () {
        this._setWinningPotActive(TaiXiuConstant.Pot.BIG.ID, false);
        this._setWinningPotActive(TaiXiuConstant.Pot.LITTLE.ID, false);
    },

    _setPot: function (pot) {
        this.active.pot = pot;
        if (pot >= 0) {
            this.bottomPanelNode.active = true;
        }
        else {
            this.bottomPanelNode.active = false;
        }
    },

    onUpdateUserMoney: function () {
        if (this.active.currency) {
            this.balanceLabel.string = Utils.Number.format(AuthUser.currencies[this.active.currency].balance);
        }
    },

    onNewMatchLostFocus: function () {
        this._clearPots();
        this._clearTempBetting();
        this._clearWinningPotActive();
        this._updateTable();
        this.gameManager.startGame();
    },

    rotateDice: function (diceNode, diceSpriteFrames, result, index) {
        diceNode.active = true;
        diceNode.setScale(1);
        // var randomRotation = Math.random();
        // var rRotation = (randomRotation * 360) || 0;
        var anim = diceNode.getComponent(cc.Animation),
            sprite = diceNode.getComponent(cc.Sprite);
        anim.play('XucXac');
        var duration = anim.currentClip.duration * 1000;
        this.addTimeout(TaiXiuConstant.TimeoutId.ROTATE_DICE + index, setTimeout(function () {
            anim.stop();
            sprite.spriteFrame = diceSpriteFrames[result];
        }, duration));

        // var quayAction = cc.spawn(
        //     cc.sequence(
        //         cc.spawn(
        //             cc.scaleTo(1, 1.5),
        //             cc.sequence(
        //                 cc.callFunc(function () {
        //                     animState.speed = 1.5;
        //                 }),

        //                 cc.delayTime(0.25),
        //                 cc.callFunc(function () {
        //                     animState.speed = 2.5;
        //                 }),
        //                 cc.delayTime(0.25),
        //                 cc.callFunc(function () {
        //                     animState.speed = 3;
        //                 }),
        //                 cc.delayTime(0.1),
        //                 cc.callFunc(function () {
        //                     animState.speed = 2.25;
        //                 }),
        //                 cc.delayTime(0.15),
        //                 cc.callFunc(function () {
        //                     animState.speed = 1.25;
        //                 })
        //             )
        //         ),
        //         cc.delayTime(0.4),
        //         cc.spawn(
        //             cc.scaleTo(0.4, 1),
        //             cc.callFunc(function () {
        //                 animState.speed = 5;
        //             })
        //         ),

        //         cc.delayTime(0.2),
        //         cc.callFunc(function () {
        //             anim.stop();
        //             sprite.spriteFrame = diceSpriteFrames[result];
        //             diceNode.setScale(0.6);
        //         })
        //     ),
        //     cc.rotateTo(0, rRotation)
        // );
        // diceNode.runAction(quayAction);
    },

    createNewPotResult: function (pot) {
        var node = cc.instantiate(pot === TaiXiuConstant.Pot.BIG.ID ? this.bigPotResultHistoryNode : this.littlePotResultHistoryNode);
        node.parent = this.historyListNode;
        node.active = true;
        this.activePotResultHistoryNode.parent = node;
        this.activePotResultHistoryNode.active = true;
        if (this.historyListNode.width + node.width >= this.historyListNode.parent.width) {
            this.historyTrayScrollView.scrollToRight();
        }
    },

    openHistoryTable: function () {
        var self = this;
        this.audioManager.playButtonClick();
        UiManager.openModalByName('games/tai_xiu/HistoryTaiXiu', function (hisotryTable) {
            hisotryTable.getComponent('HistoryTableTaiXiu').init(self.gameManager.history.slice());
        });
    },

    openTopTable: function () {
        var self = this;
        this.audioManager.playButtonClick();
        UiManager.openModalByName('games/tai_xiu/TopTienTri', function (topTable) {
            topTable.getComponent('TopTableTaiXiu').getData(self.active.currency, (new Date()).getTime());
        });
    },

    openHelpTable: function () {
        this.audioManager.playButtonClick();
        this.gameManager.openHelpModal();
    }
});
