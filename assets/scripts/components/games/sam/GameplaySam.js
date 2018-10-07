var GameConstant = require('GameConstant'),
    SamConstant = require('SamConstant'),
    AuthUser = require('AuthUser'),
    GameplayTLMN = require('GameplayTLMN');
cc.Class({
    extends: GameplayTLMN,

    properties: {
        gameCmd: {
            'default': GameConstant.SAM.CMD,
            visible: false,
            override: true
        },
        baoSamButton: cc.Button,
        boQuaBaoSamButton: cc.Button,
    },

    // use this for initialization
    $onLoad: function () {
        GameplayTLMN.prototype.$onLoad.call(this);
        this.MAX_NUMBER_CARDS = 10;
        this.gameManager.eventDispatchers.local.addEventListener(SamConstant.Event.WAITING_BAO_SAM, this.onWaitBaoSam, this);
        this.gameManager.eventDispatchers.local.addEventListener(SamConstant.Event.PLAYER_BAO_SAM, this.onPlayerBaoSam, this);
        this.gameManager.eventDispatchers.local.addEventListener(SamConstant.Event.PLAYER_BAO_MOT, this.onPlayerBaoMot, this);
        this.gameManager.eventDispatchers.local.addEventListener(SamConstant.Event.PLAYER_HUY_BAO_SAM, this.onPlayerHuyBaoSam, this);
    },

    // ============================================================
    // Xử lý Button được click
    // ============================================================

    onButtonBaoSamClick: function () {
        this.gameManager.sendRequestBaoSam();
        this.audioManager.playButtonClick();
    },

    onButtonBoQuaBaoSamClick: function () {
        this.gameManager.sendRequestBoQuaBaoSam();
        this.audioManager.playButtonClick();
    },

    // ============================================================
    // Xử lý các event từ GameManager
    // ============================================================
    onWaitBaoSam: function (params) {
        this.count += 1;
        this.gameStateLabel.string = 'Thời gian báo Sâm!';
        this.gameStateLabel.node.active = true;
        this.startButton.node.active = false;
        var dt = 0;
        if (params.__execInfo__) {
            dt = params.__execInfo__.dt;
        }
        this.countDownTime = Date.now() + params.allData.time - dt;
        this.countDownTimeLabel.string = Math.floor(params.allData.time / 1000);
        this.countDownTimeLabel.node.active = true;
        if (this.curPlayerUI().getComponent('PlayerUITLMN').player.data.handSize > 0) {
            this.baoSamButton.node.active = true;
            this.boQuaBaoSamButton.node.active = true;
            this.baoSamButton.node.setScale(1);
            this.boQuaBaoSamButton.node.setScale(1);
        }
    },

    onPlayerBaoSam: function (userName) {
        var player = this.findPlayerNodeByName(userName);
        if (player) {
            player.getComponent('PlayerUITLMN').addEffect(SamConstant.Effect.BAO_SAM);
        }
    },

    onPlayerHuyBaoSam: function () {
        for (var i = 0; i < this.playerNodeList.length; i += 1) {
            var child = this.playerNodeList[i].getComponent('PlayerUITLMN');
            if (!child.player) {
                continue;
            }
            if (child.player.data.isHuyBaoSam) {
                child.addEffect(SamConstant.Effect.HUY_BAO_SAM);
                if (i === 0) {
                    this.baoSamButton.node.active = false;
                    this.boQuaBaoSamButton.node.active = false;
                }
            }

        }
    },

    onPlayerBaoMot: function (userName) {
        var player = this.findPlayerNodeByName(userName);
        if (player) {
            player.getComponent('PlayerUITLMN').addEffect(SamConstant.Effect.BAO, true);
        }
    },

    onUpdateGame: function (params) {
        if (params.allData.gameState === SamConstant.GameState.WAITING_FOR_PLAYER) {
            this.gameStateLabel.string = 'Đợi người chơi khác';
        }
    },

    onTurn: function (params) {
        this.gameStateLabel.node.active = false;
        this.countDownTimeLabel.node.active = false;
        this.baoSamButton.node.active = false;
        this.boQuaBaoSamButton.node.active = false;
        GameplayTLMN.prototype.onTurn.call(this, params);
    },

    // ============================================================
    // Other
    // ============================================================
    checkDenLang: function (params, playerResult, playerUITLMN) {
        switch (params.data.finishTypeId) {
            case SamConstant.ActionFinishType.SAM_THAT_BAI:
                if (params.data.loser === playerResult.userName) {
                    playerUITLMN._addEffect(playerUITLMN.effectTemplateNodeList[SamConstant.Effect.SAM_THAT_BAI]);
                }
                break;
            case SamConstant.ActionFinishType.SAM_THANH_CONG:
                if (params.data.winner === playerResult.userName) {
                    playerUITLMN._addEffect(playerUITLMN.effectTemplateNodeList[SamConstant.Effect.SAM_THANH_CONG]);
                    if (playerResult.userName === AuthUser.username) {
                        this.audioManager.playThangTrang();
                    }
                }
                break;
            case SamConstant.ActionFinishType.DEN_LANG_THOI_HAI:
                if (params.data.loser === playerResult.userName) {
                    playerUITLMN._addEffect(playerUITLMN.effectTemplateNodeList[SamConstant.Effect.DEN_LANG]);
                }
                break;
        }
        var actions = params.data.result.actions;
        if (actions) {
            for (var k = 0; k < actions.length; k += 1) {
                if (actions[k].isCong && actions[k].sourcePlayer === playerResult.userName) {
                    playerUITLMN._addEffect(playerUITLMN.effectTemplateNodeList[SamConstant.Effect.THUA_CONG]);
                }
            }
        }
        // kiem tra den bao
        if (params.data.denBaoPlayer) {
            if (params.data.result.summary.length > 2) {
                if (params.data.denBaoPlayer === playerResult.userName) {
                    playerUITLMN._addEffect(playerUITLMN.effectTemplateNodeList[SamConstant.Effect.DEN_TRANG]);
                }
            }
        }

    },

    showPlayerWin: function (params) {
        for (var i = 0; i < params.data.result.summary.length; i += 1) {
            var summary = params.data.result.summary[i];
            var playerUI = this.findPlayerNodeByName(summary.userName);
            if (playerUI) {
                if (playerUI.player.data.state !== SamConstant.PlayerState.WAITING) {
                    playerUI.clearEffects();
                    playerUI.setFinishEffect(summary.moneyExchange);
                }
            }
        }
    },
});
