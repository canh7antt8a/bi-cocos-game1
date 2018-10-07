var GameConstant = require('GameConstant'),
    Utils = require('Utils'),
    AuthUser = require('AuthUser'),
    BaseMainGameplay = require('BaseMainGameplay'),
    RouletteConstant = require('RouletteConstant');

cc.Class({
    extends: BaseMainGameplay,

    properties: {
        resultList: {
            'default': [],
            type: cc.Collider,
        },
        potInfor: {
            'default': [],
            type: cc.Node,

        },
        parentChipBetting: cc.Node,
        chipPrefab: cc.Prefab,
        parentVongQuay: cc.Node,
        vongQuay: cc.Node,
        resultLabel: cc.Label,
        vienBi: cc.Node,
        lblCuaDat: cc.Label,
        lblTyLe: cc.Label,
        lblTongDat: cc.Label,
        lblState: cc.Label,
        banker: cc.Node,
        lblTimer: cc.Label,
        parentVienBi: cc.Node,
        btnX2: cc.Button,
        btnCancelBet: cc.Button,
        btnRebet: cc.Button,
        gameCmd: {
            'default': GameConstant.ROULTE.CMD,
            visible: false
        },
    },

    // use this for initialization
    $onLoad: function () {
        this.listChipBetting = [];
        this.moneyBetSelect = 0;
        this.result = 0;
        this.myTotallMoneyBet = 0;
        this._poolChip = new cc.NodePool('Chip');

        this.gameManager.eventDispatchers.local.addEventListener(RouletteConstant.Event.ADD_LIST_BETTING, this._addChipBetting, this);
        this.gameManager.eventDispatchers.local.addEventListener(RouletteConstant.Event.BETTING_SUCCESS, this.onBettingSuccess, this);
        this.gameManager.eventDispatchers.local.addEventListener(RouletteConstant.Event.ROTATE_VONG_QUAY, this._rotateVongQuay, this);
        this.gameManager.eventDispatchers.local.addEventListener(RouletteConstant.Event.FINISH_GAME, this.onFinishGame, this);
        this.gameManager.eventDispatchers.local.addEventListener(RouletteConstant.Event.CHANGE_STATE, this.onChangeState, this);
        this.gameManager.eventDispatchers.local.addEventListener(RouletteConstant.Event.CANCEL_BET, this.onCancelBetting, this);
        this.gameManager.eventDispatchers.local.addEventListener(RouletteConstant.Event.BETTING_UPDATEGAME, this.onBettingUpdate, this);
        this._setOnClickPot();
        this._disableColiderResult();
        this._disableAllButton();
        this.lblTongDat.string = 0;
    },

    $onUpdate: function () {
        if (this.gameManager.gameState === RouletteConstant.GameState.PLAYER_BETTING) {
            this.lblTimer.node.parent.active = true;
            var count = Math.floor((this.gameManager.time - Date.now()) / 1000);
            count = count >= 0 ? count : 0;
            this.lblTimer.string = count;
            if (count <= 0) {
                this.lblTimer.node.parent.active = false;
            }
        }
    },

    $onFocus: function () {
        if (this.gameManager.gameState === RouletteConstant.GameState.FINALIZING) {
            this.lblTimer.node.parent.active = false;
        }
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
            slotComponent = this.potInfor[params.id].getComponent('RoulettePotInfor');
            slotComponent.init();
            if (params.info[i].username === AuthUser.username) {
                myMoney = params.info[i].money;
            }
            slotComponent.setMoneyPot(myMoney, params.info[i].money);
            slotComponent.addPlayerBetToPot(params.info[i].userName, params.info[i].money);
            var moveChip = cc.moveTo(0.5, cc.v2(this.potInfor[params.id].x, this.potInfor[params.id].y)).easing(cc.easeOut(2.0));
            chip.runAction(cc.sequence(moveChip, cc.callFunc(function () {
                this.destroy();
            }, chip)));
        }
    },


    onCancelBetting: function (params) {
        //{action: 2, command: 20, pot: 4, username: "test6"}

        var potComponent = this.potInfor[params.pot].getComponent('RoulettePotInfor');
        this._moveChipToPlayer(params.username, this.potInfor[params.pot]);
        potComponent.removeMoneyPot(params.username);
        if (params.username === AuthUser.username) {
            this.lblTongDat.string = '0';
            this.btnX2.interactable = false;
            this.btnCancelBet.interactable = false;
        }
    },

    onChangeState: function () {
        switch (this.gameManager.gameState) {
            case RouletteConstant.GameState.PLAYER_BETTING:
                this.myTotallMoneyBet = 0;
                this.lblTongDat.string = Utils.Number.format(this.myTotallMoneyBet);
                this._clearEfectFinish();
                this.lblState.string = 'Hãy chọn cửa để đặt';
                this._showPotWin(0, false);
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
            case RouletteConstant.GameState.FINALIZING:
                this.lblState.string = 'Kết quả';
                this._disableAllButton();
                break;
        }
    },
    _disableAllButton: function () {
        this.btnRebet.interactable = false;
        this.btnX2.interactable = false;
        this.btnCancelBet.interactable = false;
    },
    onFinishGame: function (params) {
        var self = this;
        var action = cc.sequence(
            cc.callFunc(function () {
                self._showPotWin(params.potWin, true);
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
                self._clearPlayerInPot();
            }),
            cc.delayTime(2),
            cc.callFunc(function () {
                self._clearEfectFinish();
            }));
        this.node.runAction(action);
    },
    _clearPlayerInPot: function () {
        var self = this;
        for (var i = 0; i < self.potInfor.length; i += 1) {
            var slotComponent = self.potInfor[i].getComponent('RoulettePotInfor');
            slotComponent.playerBetList = {};
            slotComponent.totallMoneyLong = 0;
            slotComponent.myMoneyLong = 0;
            slotComponent.setMoneyPot(0, 0);
            slotComponent.destroyChipFacke(true);
        }
    },

    _bankerPayChip: function (pots) {
        for (var i = 0; i < pots.length; i += 1) {
            if (this.potInfor[pots[i]]) {
                if (Object.keys(this.potInfor[pots[i]].getComponent('RoulettePotInfor').playerBetList).length > 0) {
                    this._moveChipToPlayer(this.potInfor[pots[i]], this.banker);
                }
            }
        }
    },

    _payChipToPlayer: function (pots) {
        for (var i = 0; i < pots.length; i += 1) {
            if (this.potInfor[pots[i]]) {
                var slot = this.potInfor[pots[i]].getComponent('RoulettePotInfor');
                this._findPlayerWinInSlost(slot.playerBetList, pots[i]);
            }
        }
    },
    _findPlayerWinInSlost: function (player, pot) {
        var self = this;
        if (this.potInfor[pot]) {
            var slotComponent = self.potInfor[pot].getComponent('RoulettePotInfor');
            slotComponent.destroyChipFacke();
            var arr = Object.keys(player);
            for (var i = 0; i < arr.length; i += 1) {
                self._moveChipToPlayer(arr[i], self.potInfor[pot]);
            }
        }

    },

    _moveChipToBanker: function () {
        var self = this;
        for (var i = 0; i < self.potInfor.length; i += 1) {
            if (this.potInfor[i]) {
                var slotComponent = this.potInfor[i].getComponent('RoulettePotInfor');
                if (!slotComponent.isWin) {
                    if (slotComponent.chipFackeList.length > 0) {
                        this._moveChipToPlayer(self.banker, self.potInfor[i]);
                    }
                }
            }
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
                banker.setFinishEffect(params.moneyExchange);
            }
        }
    },

    _clearEfectFinish: function () {
        for (var i = 0; i < this.playerNodeList.length; i += 1) {
            this.playerNodeList[i].clearEffects();
        }
    },

    _showPotWin: function (lstPot, isShow) {
        if (isShow) {
            for (var i = 0; i < lstPot.length; i += 1) {
                var pot = this.potInfor[lstPot[i]].getComponent('RoulettePotInfor');
                pot.activeEfectWin(true);
                pot.isWin = true;
            }
        }
        else {
            for (var j = 0; j < this.potInfor.length; j += 1) {
                var pot1 = this.potInfor[j].getComponent('RoulettePotInfor');
                pot1.activeEfectWin(false);
            }
        }
    },

    stopVienBi: function () {
        this.vienBi.parent.stopAllActions();
        this.vienBi.parent = this.resultList[this.result].node;
        // var action = cc.moveTo(0, cc.v2(0, 0)).easing(cc.easeOut(2.0));
        // this.vienBi.runAction(action);
        // this.vienBi.position = cc.v2(0, 0);
        this.resultLabel.string = this.result;
        this.vienBi.position = cc.p(0, 0);
        this.audioManager.stopEffect(this.ballRunAudioId);
    },

    _rotateVongQuay: function (params) {
        //{result: 20, gameState: 1, action: 5, command: 20, time: 15000}
        // this.resultList[0].active = true;
        this.result = params.result;

        if (this.resultList[params.result].node) {
            this.resultList[params.result].node.active = true;
            this._disableAllButton();
            var tmpTime = Date.now() + params.time;
            var time = Math.floor((tmpTime - Date.now()) / 1000);
            if (time > 6) {
                this._openVongQuay(true, time - 2);
            }
        }
    },

    _disableColiderResult: function () {
        for (var i = 0; i < this.resultList.length; i += 1) {
            if (this.resultList[i].node) {
                this.resultList[i].node.active = false;
            }
        }
    },


    _openVongQuay: function (isOpen, time) {
        var self = this;

        function rotateVongQuay(time) {
            var actionVongQuay = cc.rotateBy(time, -1500).easing(cc.easeOut(3));
            self.vongQuay.runAction(actionVongQuay);
            // var vongQuayAnim = self.vongQuay.getComponent(cc.Animation);
            // vongQuayAnim.play('Rotate');
            var actionVienBi1 = cc.moveBy(5, cc.p(-90, 0));
            self.vienBi.runAction(actionVienBi1);
            var actionVienBi = [];
            actionVienBi.push(cc.rotateBy(10, 4000).easing(cc.easeOut(2.5)));
            var actionRotateVienBi = cc.spawn(actionVienBi);
            self.vienBi.parent.runAction(actionRotateVienBi);
        }

        if (isOpen) {
            self.ballRunAudioId = this.audioManager.playBallRun();
            self.resultLabel.string = '';
            var actions = [];
            actions.push(cc.moveTo(1, cc.p(0, 0)));
            actions.push(cc.callFunc(rotateVongQuay(time)));
            actions.push(cc.delayTime(time));
            actions.push(cc.callFunc(function () {
                self._openVongQuay(false);
            }));
            var action = cc.sequence(actions);
            self.parentVongQuay.runAction(action);
        }
        else {
            var actionClosed = [];
            actionClosed.push(cc.moveTo(1, cc.v2(0, 1000)));
            actionClosed.push(cc.delayTime(2));
            actionClosed.push(cc.callFunc(function () {
                self.vienBi.parent = self.parentVienBi;
                self.vienBi.position = cc.p(215, 0);
            }));
            self._disableColiderResult();
            var actionClose = cc.sequence(actionClosed);
            self.parentVongQuay.runAction(actionClose);
        }
    },

    onBettingSuccess: function (params) {
        //{money: 15000, action: 1, command: 20, pot: 3, username: "phamvanthien25554"}
        var self = this;
        if (params.username === AuthUser.username) {
            this.myTotallMoneyBet += params.money;
            this.lblTongDat.string = Utils.Number.format(this.myTotallMoneyBet);
        }
        var chip = this._poolChip.get();
        var playerParent = this.findPlayerNodeByName(params.username),
            chipComponent,
            potComponent,
            isInit = false,
            myMoney = 0;
        chip = cc.instantiate(this.chipPrefab);
        if (playerParent) {
            chip.parent = playerParent.node.parent;
            chip.position = playerParent.node;
        }
        chipComponent = chip.getComponent('Chip');
        chipComponent.activeSelectChip(false);
        // chipComponent.moneyLabel.node.active = false;
        chip.scale = cc.v2(0.5, 0.5);
        for (var i = 0; i < this.gameManager.bettingList.length; i += 1) {
            if (this.gameManager.bettingList[i] === params.money) {
                chipComponent.init(params.money, RouletteConstant.ChipColor.findById(i).NAME);
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
        potComponent = this.potInfor[params.pot].getComponent('RoulettePotInfor');
        potComponent.init();
        if (params.username === AuthUser.username) {
            myMoney = params.money;
            this.btnX2.interactable = true;
            this.btnCancelBet.interactable = true;
        }
        potComponent.setMoneyPot(myMoney, params.money);
        potComponent.addPlayerBetToPot(params.username, params.money);
        var moveChip = cc.moveTo(0.5, cc.v2(this.potInfor[params.pot].x, this.potInfor[params.pot].y)).easing(cc.easeOut(2.0));
        chip.runAction(cc.sequence(moveChip, cc.callFunc(function () {
            self._poolChip.put(chip);
        }, chip)));

        this.audioManager.playChipBay();
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
        // var potComponent = pot.getComponent('RoulettePotInfor');
        if (this.gameManager.lstRatio[parseInt(pot.name)]) {
            this.gameManager.sendBet(parseInt(pot.name), this.moneyBetSelect);
            this.lblCuaDat.string = pot.name;
            this.lblTyLe.string = this.gameManager.lstRatio[parseInt(pot.name)];
        }
        else {
            this.gameManager.sendBet(parseInt(pot.parent.parent.name), this.moneyBetSelect);
            this.lblCuaDat.string = pot.parent.parent.name;
            this.lblTyLe.string = this.gameManager.lstRatio[parseInt(pot.parent.parent.name)];
        }
    },

    _addChipBetting: function (params) {
        var chipSelect,
            self = this,
            chipComponent;
        this.parentChipBetting.removeAllChildren();
        for (var i = 0; i < params.length; i += 1) {
            chipSelect = cc.instantiate(this.chipPrefab);
            this.listChipBetting.push(chipSelect);
            chipComponent = chipSelect.getComponent('Chip');
            chipComponent.init(params[i], RouletteConstant.ChipColor.findById(i).NAME);
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
});
