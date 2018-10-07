var GameConstant = require('GameConstant'),
    Utils = require('Utils'),
    AuthUser = require('AuthUser'),
    BaseMainGameplay = require('BaseMainGameplay'),
    GameManagerConstant = require('GameManagerConstant'),
    XocDiaConstant = require('XocDiaConstant');

cc.Class({
    extends: BaseMainGameplay,

    properties: {
        slotInfor: {
            'default': [],
            type: cc.Node

        },
        banker: cc.Node,
        chipPrefab: cc.Prefab,
        moveTo: cc.Node,
        moveFrom: cc.Node,
        bowDice: cc.Node,
        parentChipBetting: cc.Node,
        nhiKetQuaList: {
            'default': [],
            type: cc.Sprite,
        },
        spriteFrameKetQua: {
            'default': [],
            type: cc.SpriteFrame,
        },
        timeLabel: cc.Label,
        timeCountDow: cc.Sprite,
        gridResult: cc.Node,
        resultXanh: cc.Prefab,
        resultTrang: cc.Prefab,
        bow: cc.Node,
        stateGameLabel: cc.Label,
        btnX2: cc.Button,
        btnCancelBet: cc.Button,
        btnRebet: cc.Button,
        gameCmd: {
            'default': GameConstant.XOC_DIA.CMD,
            visible: false
        },
    },

    // use this for initialization
    $onLoad: function () {
        this.listChipBetting = [];
        //this.bow = this.bowDice.getChildByName('ImgBat');
        this._poolChip = new cc.NodePool('Chip');
        this.moneyBetSelect = 0;
        this.time = 0;

        this.gameManager.eventDispatchers.local.addEventListener(XocDiaConstant.Event.BETTING_SUCCESS, this.onBettingSuccess, this);
        this.gameManager.eventDispatchers.local.addEventListener(XocDiaConstant.Event.SHAKE_BOW_DICE, this.onShakeBow, this);
        this.gameManager.eventDispatchers.local.addEventListener(XocDiaConstant.Event.ADD_LIST_BETTING, this._addChipBetting, this);
        this.gameManager.eventDispatchers.local.addEventListener(XocDiaConstant.Event.PLAYER_BETTING_STATE, this._playerBettingState, this);
        this.gameManager.eventDispatchers.local.addEventListener(XocDiaConstant.Event.FINISH, this.onFinishGame, this);
        this.gameManager.eventDispatchers.local.addEventListener(XocDiaConstant.Event.CANCEL_BET, this.onCancelBetting, this);
        this.gameManager.eventDispatchers.local.addEventListener(XocDiaConstant.Event.SET_RATIO, this.onSetRatio, this);
        this.gameManager.eventDispatchers.local.addEventListener(XocDiaConstant.Event.BETTING_UPDATEGAME, this.onBettingUpdate, this);
        this.gameManager.eventDispatchers.local.addEventListener(XocDiaConstant.Event.MASTER_CANEL_BET, this.onMasterCencelBet, this);
        this.gameManager.eventDispatchers.local.addEventListener(XocDiaConstant.Event.MASTER_CANEL_BET_RECEIVE, this.onMasterCencelBetReceive, this);
        this.gameManager.eventDispatchers.local.addEventListener(XocDiaConstant.Event.CHANGE_STATE, this.onChangeState, this);

        this.gameManager.eventDispatchers.local.addEventListener(GameManagerConstant.Event.NEW_MATCH_LOST_FOCUS, this.onNewMatchLostFocus, this);
        this._enableNodeWhenLoad(false);
        this._disableAllButton();

    },

    $onUpdate: function () {
        this._checkOnFocus();
        if (this.gameManager.gameState === XocDiaConstant.GameState.PLAYER_BETTING || this.gameManager.gameState === XocDiaConstant.GameState.MASTER_CANEL_BET) {
            var count = Math.floor((this.time - Date.now()) / 1000);
            count = count >= 0 ? count : 0;
            this.timeLabel.string = count;
            if (count <= 0) {
                this.timeLabel.node.active = false;
                this.timeCountDow.node.active = false;
            }
        }
    },

    $onDestroy: function () {
        if (this.xocAudioId) {
            this.audioManager.stopEffect(this.xocAudioId);
        }
    },

    $onFocus: function () {

        if (this.gameManager.gameState !== XocDiaConstant.GameState.FINISH) {
            this.bow.position = cc.v2(0, 0);
            for (var i = 0; i < this.slotInfor.length; i += 1) {
                var potComponent = this.slotInfor[i].getComponent('SlotInfor');
                potComponent.showEfectWin(false);
            }
        }
        if (this.gameManager.gameState !== XocDiaConstant.GameState.EFFECT) {
            var anim = this.bowDice.getComponent(cc.Animation);
            anim.stop('Shake');
            if (this.xocAudioId) {
                this.audioManager.stopEffect(this.xocAudioId);
            }
        }
        if (this.gameManager.gameState === XocDiaConstant.GameState.EFFECT) {
            this.bowDice.position = cc.v2(0, 0);
        }
    },


    onNewMatchLostFocus: function () {},

    onChangeState: function () {
        switch (this.gameManager.gameState) {
            case XocDiaConstant.GameState.EFFECT:
                this.stateGameLabel.string = 'Nhà cái bắt đầu xóc!';
                this._disableAllButton();
                break;
            case XocDiaConstant.GameState.PLAYER_BETTING:
                this.stateGameLabel.string = 'Hãy chọn cửa để đặt!';
                if (this.gameManager.history.length > 0 && !this.gameManager.isMaster) {
                    var activeButton = false;
                    for (var i = 0; i < this.gameManager.history.length; i += 1) {
                        if (this.gameManager.history[i] > 0) {
                            activeButton = true;
                            break;
                        }
                    }
                    this.btnRebet.interactable = activeButton;
                }
                this.audioManager.playTurnStart();
                break;
            case XocDiaConstant.GameState.MASTER_CANEL_BET:
                this.stateGameLabel.string = 'Nhà cái hủy cược!';
                this._disableAllButton();
                break;
            case XocDiaConstant.GameState.FINALIZING:
                this.stateGameLabel.string = 'Kết quả!';
                this._disableAllButton();
                break;
        }
    },
    _disableAllButton: function () {
        this.btnRebet.interactable = false;
        this.btnX2.interactable = false;
        this.btnCancelBet.interactable = false;
    },
    _checkOnFocus: function () {
        if (this.gameManager.gameState !== XocDiaConstant.GameState.FINALIZING) {
            this.bow.position = cc.v2(0, 0);
            for (var i = 0; i < this.slotInfor.length; i += 1) {
                var potComponent = this.slotInfor[i].getComponent('SlotInfor');
                potComponent.showEfectWin(false);
            }
        }
        if (this.gameManager.gameState !== XocDiaConstant.GameState.EFFECT) {
            var anim = this.bowDice.getComponent(cc.Animation);
            anim.stop('Shake');
            if (this.xocAudioId) {
                this.audioManager.stopEffect(this.xocAudioId);
            }
        }
        else {
            this.bowDice.position = cc.v2(0, 0);
        }
    },

    _showTimeState: function (time) {
        var anim = this.bowDice.getComponent(cc.Animation);
        anim.stop('Shake', 5);
        if (this.xocAudioId) {
            this.audioManager.stopEffect(this.xocAudioId);
        }
        this.bowDice.position = cc.v2(0, 0);
        this._enableNodeWhenLoad(true);
        var action = cc.rotateBy(5, 360);
        this.timeCountDow
            .node.runAction(cc.repeatForever(action));
        this.time = Date.now() + time;
    },

    onMasterCencelBetReceive: function (params) {
        var potComponent = this.slotInfor[params].getComponent('SlotInfor');
        for (var username in potComponent.playerBetList) {
            this._moveChipToPlayer(username, this.slotInfor[params]);
            potComponent.removeMoneyPot(username);
        }

    },

    onMasterCencelBet: function (params) {
        this._showTimeState(params.time);
        this._activeSellCancelPot(true);

    },

    _activeSellCancelPot: function (isActive) {
        if (this.gameManager.isMaster && isActive) {
            for (var i = 0; i < this.slotInfor.length; i += 1) {
                var potComponent = this.slotInfor[i].getComponent('SlotInfor');
                potComponent.activeCancelPotXocDia(isActive);
            }
        }
        else {
            for (var j = 0; j < this.slotInfor.length; j += 1) {
                var potComponent1 = this.slotInfor[j].getComponent('SlotInfor');
                potComponent1.activeCancelPotXocDia(false);
            }
        }
    },

    _enableNodeWhenLoad: function (isEnable) {
        this.timeCountDow.node.active = isEnable;
        this.timeLabel.node.active = isEnable;
    },

    onBettingUpdate: function (params) {
        this.audioManager.playChipBay();
        for (var i = 0; i < params.info.length; i += 1) {
            var chip,
                playerParent = this.findPlayerNodeByName(params.info[i].userName),
                chipComponent,
                slotComponent,
                myMoney = 0;
            chip = cc.instantiate(this.chipPrefab);
            if (playerParent) {
                chip.parent = playerParent.node.parent;
                chip.position = playerParent.node;
            }
            chipComponent = chip.getComponent('Chip');
            chipComponent.activeSelectChip(false);
            chipComponent.moneyLabel.node.active = false;
            chip.scale = cc.v2(0.5, 0.5);
            chipComponent.init(params.info[i].money);
            chipComponent = chip.getComponent(cc.Button);
            chipComponent.enabled = false;
            // chipComponent =
            chip.removeComponent('ButtonScaler');
            // chipComponent.removeComponent();
            slotComponent = this.slotInfor[params.id].getComponent('SlotInfor');
            slotComponent.init();
            if (params.info[i].username === AuthUser.username) {
                myMoney = params.info[i].money;
            }
            slotComponent.setMoneyPot(myMoney, params.info[i].money);
            slotComponent.addPlayerBetToPot(params.info[i].userName, params.info[i].money);
            var moveChip = cc.moveTo(0.5, cc.v2(this.slotInfor[params.id].x, this.slotInfor[params.id].y)).easing(cc.easeOut(2.0));
            chip.runAction(cc.sequence(moveChip, cc.callFunc(function () {
                this.destroy();
            }, chip)));
        }
    },

    onCancelBetting: function (params) {
        //{action: 2, command: 20, pot: 4, username: "test6"}
        var potComponent = this.slotInfor[params.pot].getComponent('SlotInfor');
        this._moveChipToPlayer(params.username, this.slotInfor[params.pot]);
        if (params.username === AuthUser.username) {
            this.btnX2.interactable = false;
            this.btnCancelBet.interactable = false;
        }
        potComponent.removeMoneyPot(params.username);
    },

    onSetRatio: function (params) {
        for (var i = 0; i < params.length; i += 1) {
            var potComponent = this.slotInfor[params[i].id].getComponent('SlotInfor');
            potComponent.setRatioPot(params[i].ratio);
        }
    },

    onFinishGame: function (params) {
        var self = this;
        self.timeCountDow.node.active = false;
        var action = cc.sequence(
            cc.callFunc(function () {
                self._setKetQua(params.dices);
            }),
            cc.callFunc(function () {
                self._openBow();
            }),
            cc.delayTime(1),
            cc.callFunc(function () {
                self._showSlostWin(params.potWin);
            }),
            cc.callFunc(function () {
                self._bankerPayChip(params.potWin);
            }),
            cc.delayTime(1),
            cc.callFunc(function () {
                self._payChipToPlayer(params.potWin);
            }),
            cc.delayTime(2),
            cc.callFunc(function () {
                self._showMoneyFinish(params.players);
            }),
            cc.delayTime(2),
            cc.callFunc(function () {
                self._moveChipToBanker();
            }),
            cc.callFunc(function () {
                self._showBankerMoneyFinish(params.banker);
            }),
            cc.callFunc(function () {
                self._addResult(params.dices);
            }),
            cc.callFunc(function () {
                self._clearPlayerInPot();
            }),
            cc.delayTime(2),
            cc.callFunc(function () {
                self._clearEfectFinish();
            }));
        this.node.runAction(action);
    },

    _addResult: function (params) {
        var self = this;
        var result = 0;
        for (var i = 0; i < params.length; i += 1) {
            result += params[i];
        }
        var resultPre;
        var resultInt = (result % 2);

        if (resultInt === 0) {
            resultPre = cc.instantiate(this.resultTrang);
        }
        else {
            resultPre = cc.instantiate(this.resultXanh);
        }
        if (self.gridResult.childrenCount === 32) {
            self.gridResult.removeAllChildren();
        }
        self.gridResult.addChild(resultPre);
    },

    _clearEfectFinish: function () {
        for (var i = 0; i < this.playerNodeList.length; i += 1) {
            this.playerNodeList[i].clearEffects();
        }
    },

    _moveChipToPlayer: function (player, createPosition, money) {
        var chip,
            playerParent,
            chipComponent;
        this.audioManager.playChipBay();
        for (var i = 0; i < 3; i += 1) {

            if (Utils.Type.isString(player)) {
                playerParent = this.findPlayerNodeByName(player);
                if (playerParent) {
                    playerParent = playerParent.node;
                }
            }
            else {
                playerParent = player;
            }
            if (playerParent) {
                chip = cc.instantiate(this.chipPrefab);
                chip.parent = playerParent.parent;
                chip.position = createPosition;
                chipComponent = chip.getComponent('Chip');
                chipComponent.activeSelectChip(false);
                chipComponent.moneyLabel.node.active = false;
                chip.removeComponent('ButtonScaler');
                chip.removeComponent(cc.Button);
                chip.scale = cc.v2(0.5, 0.5);
                chipComponent.init(money);
                var action = cc.moveTo(0.8, cc.v2(playerParent.x, playerParent.y)).easing(cc.easeOut(2.0));
                chip.runAction(cc.sequence(cc.delayTime(i - (i * 0.95)), action, cc.callFunc(function () {
                    this.destroy();
                }, chip)));
            }
        }
    },

    _bankerPayChip: function (pots) {
        for (var i = 0; i < pots.length; i += 1) {
            if (Object.keys(this.slotInfor[pots[i]].getComponent('SlotInfor').playerBetList).length > 0) {
                this._moveChipToPlayer(this.slotInfor[pots[i]], this.banker);
            }
        }
    },

    _payChipToPlayer: function (pots) {
        for (var i = 0; i < pots.length; i += 1) {
            var slot = this.slotInfor[pots[i]].getComponent('SlotInfor');
            this._findPlayerWinInSlost(slot.playerBetList, pots[i]);
        }
    },

    _moveChipToBanker: function () {
        var self = this;
        for (var i = 0; i < self.slotInfor.length; i += 1) {
            var slotComponent = this.slotInfor[i].getComponent('SlotInfor');
            if (!slotComponent.isWin) {
                if (slotComponent.chipFackeList.length > 0) {
                    this._moveChipToPlayer(self.banker, self.slotInfor[i]);
                }
            }
        }
    },

    _findPlayerWinInSlost: function (player, pot) {
        var self = this;
        var slotComponent = self.slotInfor[pot].getComponent('SlotInfor');
        slotComponent.destroyChipFacke();
        var arr = Object.keys(player);
        for (var i = 0; i < arr.length; i += 1) {
            self._moveChipToPlayer(arr[i], self.slotInfor[pot]);
        }

    },

    _setKetQua: function (params) {
        this._activeSellCancelPot(false);
        for (var i = 0; i < params.length; i += 1) {
            this.nhiKetQuaList[i].spriteFrame = this.spriteFrameKetQua[params[i]];
        }
    },

    _showSlostWin: function (params) {
        for (var i = 0; i < params.length; i += 1) {
            var slot = this.slotInfor[params[i]].getComponent('SlotInfor');
            slot.showEfectWin(true);

            slot.isWin = true;
        }
    },

    _disableEfectSlostWin: function () {
        for (var i = 0; i < this.slotInfor.length; i += 1) {
            var slot = this.slotInfor[i].getComponent('SlotInfor');
            slot.showEfectWin(false);
            slot.isWin = false;
        }
    },

    _showMoneyFinish: function (params) {
        for (var i = 0; i < params.length; i += 1) {
            var player = this.findPlayerNodeByName(params[i].userName);
            if (player) {
                player.setFinishEffect(params[i].moneyExchange);
                if (params[i].userName === AuthUser.username) {
                    if (params[i].moneyExchange > 0) {
                        this.audioManager.playWin();
                    }
                    else {
                        this.audioManager.playLose();
                    }
                }
            }
        }
    },

    _showBankerMoneyFinish: function (params) {
        if (params.userName !== undefined) {
            var banker = this.findPlayerNodeByName(params.userName);
            if (banker) {
                //banker = banker.getComponent('PlayerUI');
                banker.setFinishEffect(params.moneyExchange);
            }
        }
    },

    _clearPlayerInPot: function () {
        var self = this;
        for (var i = 0; i < self.slotInfor.length; i += 1) {
            var slotComponent = self.slotInfor[i].getComponent('SlotInfor');
            slotComponent.playerBetList = {};
            slotComponent.totallMoneyLong = 0;
            slotComponent.myMoneyLong = 0;
            slotComponent.potX = 0;
            slotComponent.setMoneyPot(0, 0);
            slotComponent.destroyChipFacke();
        }
    },

    onBettingSuccess: function (params) {
        //{money: 15000, action: 1, command: 20, pot: 3, username: "phamvanthien25554"}
        var self = this;
        var chip = this._poolChip.get();
        var playerParent = this.findPlayerNodeByName(params.username),
            chipComponent,
            slotComponent,
            isInit = false,
            ismove = false,
            myMoney = 0;
        if (!chip) {
            chip = cc.instantiate(this.chipPrefab);
        }
        if (playerParent) {
            chip.parent = playerParent.node.parent;
            chip.position = playerParent.node;
        }
        chipComponent = chip.getComponent('Chip');
        chipComponent.activeSelectChip(false);
        chip.scale = cc.v2(0.5, 0.5);
        for (var i = 0; i < this.gameManager.bettingList.length; i += 1) {
            if (this.gameManager.bettingList[i] === params.money) {
                chipComponent.init(params.money, XocDiaConstant.ChipColor.findById(i).NAME);
                isInit = true;
                break;
            }
        }
        if (!isInit) {
            chipComponent.moneyLabel.node.active = false;
            chipComponent.init(params.money);
        }
        chipComponent = chip.getComponent(cc.Button);
        chipComponent.enabled = false;
        chip.removeComponent('ButtonScaler');
        slotComponent = this.slotInfor[params.pot].getComponent('SlotInfor');
        slotComponent.init();
        if (params.username === AuthUser.username) {
            myMoney = params.money;
            this.btnX2.interactable = true;
            this.btnCancelBet.interactable = true;
        }
        slotComponent.setMoneyPot(myMoney, params.money);
        slotComponent.addPlayerBetToPot(params.username, params.money);
        for (var j = 0; j < this.gameManager.bettingList.length; j += 1) {
            if (this.gameManager.bettingList[j] === params.money) {
                ismove = true;
                var newVec1 = this.slotInfor[params.pot].getChildByName(j.toString()).convertToWorldSpace(cc.v2(0, 0));
                var newVec2 = this.node.convertToNodeSpaceAR(newVec1);
                var moveChip = cc.moveTo(0.3, newVec2).easing(cc.easeOut(2.0));
                chip.runAction(cc.sequence(moveChip, cc.callFunc(function () {
                    self._poolChip.put(chip);

                    // this.destroy();
                    slotComponent.caculateChip();
                }, chip)));
            }
        }
        if (!ismove) {
            ismove = true;
            var newVec11 = this.slotInfor[params.pot].getChildByName('0').convertToWorldSpace(cc.v2(0, 0));
            var newVec21 = this.node.convertToNodeSpaceAR(newVec11);
            var moveChip1 = cc.moveTo(0.3, newVec21).easing(cc.easeOut(2.0));
            chip.runAction(cc.sequence(moveChip1, cc.callFunc(function () {
                self._poolChip.put(chip);
                // this.destroy();
                slotComponent.caculateChip();
            }, chip)));
        }
        this.audioManager.playChipBay();
    },

    onShakeBow: function () {
        this._disableEfectSlostWin();
        var self = this;

        var anim = this.bowDice.getComponent(cc.Animation);
        var action = cc.sequence(cc.callFunc(self._closeBow()),
            cc.delayTime(1.5),
            cc.callFunc(function () {
                if (self.bow.position.x > 0) {
                    self.bow.position = cc.v2(0, 0);
                }
                anim.play('Shake');
                self.xocAudioId = self.audioManager.playXoc(true);
            }, this));
        this.bow.runAction(action);
        for (var i = 0; i < this.slotInfor.length; i += 1) {
            var potComponent = this.slotInfor[i].getComponent('SlotInfor');
            potComponent.showEfectWin(false);
        }
    },

    clickReBet: function () {
        this.gameManager.sendReBet();
    },

    clickDoubleBet: function () {
        this.gameManager.sendDoubleBet();
    },

    clickCancelBet: function () {
        this.gameManager.sendCancelBet();
    },

    clickRequestBanker: function () {
        this.gameManager.sendRequestBanker();
    },

    _openBow: function () {
        var action = cc.moveTo(1, cc.p(-90, 0)).easing(cc.easeOut(2.0));
        this.bow.runAction(action);
        this.timeCountDow.node.active = false;
        this.timeLabel.node.active = false;
    },

    _closeBow: function () {

        var action = cc.moveTo(1, cc.p(0, 0));
        this.bow.runAction(action);
    },

    _playerBettingState: function (params) {
        this._showTimeState(params.time);
    },

    _showTimeCountDow: function (params) {
        this.timeLabel.string = params;
    },

    _addChipBetting: function (params) {
        var chipSelect,
            self = this,
            chipComponent;
        this.audioManager.playChipBay();
        this.parentChipBetting.removeAllChildren();
        for (var i = 0; i < params.length; i += 1) {
            chipSelect = cc.instantiate(this.chipPrefab);
            this.listChipBetting.push(chipSelect);
            chipComponent = chipSelect.getComponent('Chip');
            chipComponent.init(params[i], XocDiaConstant.ChipColor.findById(i).NAME);
            chipSelect.on(cc.Node.EventType.TOUCH_START, function () {
                this.activeSelectChip(true);
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
        this._removeSelectChip();
        var chip = chipSelect.getComponent('Chip');
        chip.activeSelectChip(true);
        this.moneyBetSelect = chip.money;
    },
});
