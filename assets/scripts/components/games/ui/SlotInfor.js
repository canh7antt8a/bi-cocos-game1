var BaseMainGameplay = require('BaseMainGameplay'),
    AuthUser = require('AuthUser'),
    Utils = require('Utils'),
    BauCuaConstant = require('BauCuaConstant'),
    XocDiaConstant = require('XocDiaConstant');

cc.Class({
    extends: cc.Component,

    properties: {
        myMoneyLabel: cc.Label,
        totallMoneyLabel: cc.Label,
        ratioLabel: cc.Label,
        hieuUngThangSprite: cc.Sprite,
        sceneScript: BaseMainGameplay,
        pot: 0,
        btnCancelBet: cc.Sprite,
    },

    // use this for initialization
    onLoad: function () {
        var self = this;
        this.caculateChip = Utils.Scheduler.debounce(function () {
            self._caculateChip();
        }, 30, 200);

        this._poolChip = new cc.NodePool('Chip');
        if (!this.chipFackeList) {
            this.init();
        }
    },

    init: function () {
        if (!this.chipFackeList) {
            this.potX0 = this.potX1 = this.potX2 = this.potX3 = 0;
            this.playerBetList = {};
            this.chipFackeList = [];
            this.tmpCountChipList = [];
            this.countChipList = [];
            this.isWin = false;
            this.totallMoneyLong = 0;
            this.myMoneyLong = 0;
            var self = this;
            this.node.on(cc.Node.EventType.TOUCH_START, function () {
                if (this.sceneScript.gameManager.gameState === BauCuaConstant.GameState.PLAYER_BETTING || this.sceneScript.gameManager.gameState === XocDiaConstant.GameState.PLAYER_BETTING) {
                    self.bet();
                }
                else if (this.sceneScript.gameManager.gameState === BauCuaConstant.GameState.MASTER_CANEL_BET || this.sceneScript.gameManager.gameState === XocDiaConstant.GameState.MASTER_CANEL_BET) {
                    this.sellBetCancelBet();
                }
            }, this);
            this.setMoneyPot(0, 0);
        }
    },

    activeCancelPotXocDia: function (isCancel) {
        if (this.btnCancelBet) {
            this.btnCancelBet.node.active = isCancel;
        }
    },

    activeSellPotBauCua: function (isSell) {
        if (isSell) {
            this.myMoneyLabel.node.color = new cc.color('#FFEB00');
            this.myMoneyLabel.string = 'BÁN';
        }
        else {
            this.myMoneyLabel.node.color = new cc.color('#FFFFFF');
            this.myMoneyLabel.string = Utils.Number.abbreviate(this.myMoneyLong);
        }
    },

    sellBetCancelBet: function () {
        this.sceneScript.gameManager.sellBetCancelBet(this.pot);
    },

    bet: function () {
        this.sceneScript.gameManager.sendBet(this.pot, this.sceneScript.moneyBetSelect);
    },

    setRatioPot: function (ratio) {
        if (this.ratioLabel) {
            this.ratioLabel.string = '(1x' + ratio + ')';
        }
    },

    setMoneyPot: function (myMoney, moneyBet) {
        this.totallMoneyLong += moneyBet;
        this.myMoneyLong += myMoney;
        this.myMoneyLabel.string = Utils.Number.abbreviate(this.myMoneyLong);
        this.totallMoneyLabel.string = Utils.Number.abbreviate(this.totallMoneyLong);
    },

    addPlayerBetToPot: function (player, money) {
        var moneyTemp = this.playerBetList[player];
        if (Utils.Type.isNumber(moneyTemp)) {
            this.playerBetList[player] = (money + moneyTemp);
        }
        else {
            this.playerBetList[player] = money;
        }
    },

    removePlayerBet: function (player) {
        delete this.playerBetList[player];
    },

    removeMoneyPot: function (username) {
        var moneyTemp = this.playerBetList[username];
        if (Utils.Type.isNumber(moneyTemp)) {
            if (this.totallMoneyLong > moneyTemp) {
                this.totallMoneyLong -= moneyTemp;
            }
            else {
                this.totallMoneyLong = 0;
            }
        }
        if (AuthUser.username === username) {
            this.myMoneyLong = 0;
        }

        this.myMoneyLabel.string = Utils.Number.abbreviate(this.myMoneyLong);
        if (this.totallMoneyLong <= 0) {
            this.destroyChipFacke(true);
        }
        else {
            this.caculateChip();
            this.totallMoneyLabel.string = Utils.Number.abbreviate(this.totallMoneyLong);
        }
        this.removePlayerBet(username);
    },

    showEfectWin: function (isShow) {
        this.node.color = new cc.color('#FFFFFF');
        this.hieuUngThangSprite.node.active = isShow;
        if (isShow) {
            var action = cc.repeatForever(cc.sequence(cc.fadeIn(0.8), cc.fadeOut(0.8)));
            this.hieuUngThangSprite.node.runAction(action);
        }
        else {
            this.hieuUngThangSprite.node.stopAllActions();
        }
    },

    disablePotEfect: function () {
        this.node.color = new cc.color('#A07373');
    },

    caculateChip: function () {
        // empty function
    },

    _caculateChip: function () {
        this.destroyChipFacke(false);
        var moneyTemp = this.totallMoneyLong;
        var moneyBetting = this.sceneScript.gameManager.bettingList;
        this.tmpCountChipList = this.countChipList;
        var tempList = [];
        this.countChipList = [];
        for (var i = moneyBetting.length; i > 0; i -= 1) {
            if (moneyTemp >= moneyBetting[i - 1]) {
                var num = Math.floor(moneyTemp / moneyBetting[i - 1]);
                tempList.push(num);
                moneyTemp -= num * moneyBetting[i - 1];
            }
            else {
                tempList.push(0);
            }
        }


        this.countChipList = tempList.reverse();
        this.setFakeChip();

    },
    setFakeChip: function () {
        var self = this;
        var chipList = this.countChipList;
        for (var i = 0; i < chipList.length; i += 1) {
            if (chipList[i] > 0) {
                for (var j = 0; j < chipList[i]; j += 1) {
                    var chip = this._poolChip.get();
                    if (!chip) {
                        chip = cc.instantiate(self.sceneScript.chipPrefab);
                    }
                    var chipComponent = chip.getComponent('Chip');
                    chip.parent = self.node.getChildByName(i.toString());
                    chip.scale = cc.v2(0.5, 0.5);
                    chip.removeComponent('ButtonScaler');
                    chip.removeComponent(cc.Button);
                    switch (i) {
                        case 0:

                            chip.position = cc.v2(0, self.potX0);
                            self.potX0 += 3;
                            break;
                        case 1:
                            chip.position = cc.v2(0, self.potX1);
                            self.potX1 += 3;
                            break;
                        case 2:
                            chip.position = cc.v2(0, self.potX2);
                            self.potX2 += 3;
                            break;
                        case 3:
                            chip.position = cc.v2(0, self.potX3);
                            self.potX3 += 3;
                            break;

                    }

                    chipComponent.activeSelectChip(false);
                    chipComponent.init(self.sceneScript.gameManager.bettingList[i], BauCuaConstant.ChipColor.findById(i).NAME);
                    self.chipFackeList.push(chip);
                }

            }
        }
        this.tmpChipFacke = this.chipFackeList;
    },

    destroyChipFacke: function (isClease) {
        if (this.chipFackeList) {
            for (var i = 0; i < this.chipFackeList.length; i += 1) {
                if (this.chipFackeList[i]) {
                    this._poolChip.put(this.chipFackeList[i]);
                    // this.chipFackeList[i].destroy();
                }
            }
            this.chipFackeList = [];
        }
        this.potX0 = this.potX1 = this.potX2 = this.potX3 = 0;
        if (isClease) {
            this.chipFackeList = [];
            this.myMoneyLabel.string = 0;
            this.totallMoneyLabel.string = 0;
        }
    },
});
