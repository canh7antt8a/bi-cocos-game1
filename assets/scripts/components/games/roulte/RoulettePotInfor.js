var BaseMainGameplay = require('BaseMainGameplay'),
    AuthUser = require('AuthUser'),
    RouletteConstant = require('RouletteConstant'),
    Utils = require('Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        // myMoneyLabel: cc.Label,
        // totallMoneyLabel: cc.Label,
        // ratioLabel: cc.Label,
        // hieuUngThangSprite: cc.Sprite,
        sceneScript: BaseMainGameplay,
        // pot: 0,
        // btnCancelBet: cc.Sprite,
    },

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
            this.potX = 0;
            this.playerBetList = {};
            this.chipFackeList = [];
            this.countChipList = [];
            this.isWin = false;
            this.totallMoneyLong = 0;
            this.myMoneyLong = 0;
        }
    },

    activeEfectWin: function (isShow) {
        this.node.getChildByName('EfectWin').active = isShow;
        if (isShow) {
            var action = cc.repeatForever(cc.sequence(cc.fadeIn(0.8, 0), cc.fadeOut(0.8, 0)));
            this.node.getChildByName('EfectWin').runAction(action);
        }
        else {
            this.node.getChildByName('EfectWin').stopAllActions();
        }
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

    setMoneyPot: function (myMoney, totallMoney) {
        this.totallMoneyLong += totallMoney;
        this.myMoneyLong += myMoney;
        if (totallMoney > 0) {
            // this.setFakeChip();
            this.caculateChip();
        }
    },
    caculateChip: function () {
        // this.destroyChipFacke(false);

        // var moneyTemp = this.totallMoneyLong;
        // var moneyBetting = this.sceneScript.gameManager.bettingList;
        // var tempList = [];
        // this.countChipList = [];
        // //[0,5,3,2]
        // for (var i = moneyBetting.length; i > 0; i -= 1) {
        //     if (moneyTemp >= moneyBetting[i - 1]) {
        //         var num = Math.floor(moneyTemp / moneyBetting[i - 1]);
        //         tempList.push(num);
        //         moneyTemp -= num * moneyBetting[i - 1];
        //     } else {
        //         tempList.push(0);
        //     }
        // }
        // this.countChipList = tempList.reverse();
        // this.setFakeChip();

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
                    chip.parent = this.node.getChildByName(i.toString());
                    chip.scale = cc.v2(0.5, 0.5);
                    chip.removeComponent('ButtonScaler');
                    chip.removeComponent(cc.Button);
                    switch (i) {
                        case 0:

                            chip.position = cc.v2(0, this.potX0);
                            this.potX0 += 3;
                            break;
                        case 1:
                            chip.position = cc.v2(0, this.potX1);
                            this.potX1 += 3;
                            break;
                        case 2:
                            chip.position = cc.v2(0, this.potX2);
                            this.potX2 += 3;
                            break;
                        case 3:
                            chip.position = cc.v2(0, this.potX3);
                            this.potX3 += 3;
                            break;

                    }

                    chipComponent.activeSelectChip(false);
                    chipComponent.init(this.sceneScript.gameManager.bettingList[i], RouletteConstant.ChipColor.findById(i).NAME);
                    this.chipFackeList.push(chip);
                }

            }
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
        if (this.totallMoneyLong <= 0) {
            this.destroyChipFacke(true);
        }
        this.removePlayerBet(username);
    },

    destroyChipFacke: function (isClease) {
        if (this.chipFackeList) {
            for (var i = 0; i < this.chipFackeList.length; i += 1) {
                this._poolChip.put(this.chipFackeList[i]);
            }
            this.chipFackeList = [];
        }
        this.potX = 0;
        if (isClease) {
            this.chipFackeList = [];
        }
    },
});
