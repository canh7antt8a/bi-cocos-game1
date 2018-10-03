var TextJumping = require('TextJumping'),
    Utils = require('Utils'),
    AuthUser = require('AuthUser'),
    AudioManager = require('AudioManager'),
    GameConstant = require('GameConstant'),
    MyNhanConstant = require('MyNhanConstant'),
    UiManager = require('UiManager'),
    GameManager = require('GameManager'),
    AuthUser = require('AuthUser'),
    CommonConstant = require('CommonConstant'),
    NetworkManager = require('NetworkManager'),
    BaseGameOptionModal = require('BaseGameOptionModal');

cc.Class({
    extends: cc.Component,

    properties: {
        txtMoneyHoaHau: cc.Label,
        txtMoneyHotgirl: cc.Label,
        txtMoneyRauSach: cc.Label,
        txtUserName: cc.Label,

        menuNode: cc.Node,
    },

    onLoad: function () {
        if (this.txtUserName) {
            this.txtUserName.string = AuthUser.username;
        }
    },

    onMenuClick: function () {
        // this.menuNode.active = !this.menuNode.active;
        this.menuNode.getComponent('MenuSlot').show();
        if (this.gamePlay && this.gamePlay.audioManager) {
            this.gamePlay.audioManager.playButtonClick();
        }
    },

    onCloseClick: function () {
        this.menuNode.active = false;
        if (this.gamePlay && this.gamePlay.audioManager) {
            this.gamePlay.audioManager.playButtonClick();
        }
        if (this.gamePlay.gameManager.gameState === MyNhanConstant.GameState.ROTATE) {
            this.openConfirmModal('Khi thoát khỏi phòng, bạn sẽ bị tính như thua cuộc và bị trừ tiền. Bạn có chắc vẫn muốn thoát không?', {
                oke_fn: function () {
                    this.gamePlay.gameManager.leaveRoom();
                }.bind(this)
            });
        }
        else {
            this.gamePlay.gameManager.leaveRoom();
        }
    },

    openConfirmModal: function (message, settings) {
        if (message) {
            var modalName = 'ConfirmModalSlot2';
            var gameCmd = this.gamePlay.gameCmd;
            if (gameCmd === GameConstant.MY_NHAN.CMD) {
                modalName = 'ConfirmModalSlot';
            }
            settings = settings || {};
            cc.loader.loadRes(modalName, function (err, prefab) {
                var newNode = cc.instantiate(prefab);
                newNode.zIndex = CommonConstant.ZINDEX.MODAL;
                var modalComp = newNode.getComponent('Modal'),
                    comp = newNode.getComponent('ConfirmModal');
                modalComp.content.string = message;
                if (settings.oke_fn) {
                    comp.okeCallback = settings.oke_fn;
                }
                if (settings.cancel_fn) {
                    comp.cancelCallback = settings.cancel_fn;
                }
                if (settings.isPersistent) {
                    cc.game.addPersistRootNode(newNode);
                }
                else {
                    cc.director.getScene().addChild(newNode);
                }
            });
        }
    },


    onBackClick: function () {
        NetworkManager.SmartFox.leaveRoom(this.room.id);
        Utils.Director.loadScene(CommonConstant.Scene.HALL);
    },

    onTryPlayClick: function () {
        MyNhanConstant.GameType.type = -1;
        AudioManager.instance.playButtonClick();
        var config = GameManager.getLobbyGameRuntimeConfigs();
        if (!config) {
            return;
        }

        config.isSuspending = false;
        this.game = config.game;
        if (this.game) {
            var gameOptionModalPrefabLink = this.game.CONFIG.GAME_OPTION_MODAL_PREFAB,
                gameId = this.game.gameId,
                gameConfigs = {
                    currency: NetworkManager.SmartFox.type.utfString(CommonConstant.CurrencyType.Xu.NAME),
                    isSolo: NetworkManager.SmartFox.type.bool(this.game.isSolo),
                    betting: NetworkManager.SmartFox.type.long(MyNhanConstant.BettingFreeList[0])
                };
            // open game option modal then enter game later
            if (gameOptionModalPrefabLink) {
                UiManager.openModalByName(gameOptionModalPrefabLink, function (modal) {
                    modal.getComponent(BaseGameOptionModal).init(gameId, gameConfigs, function () {});
                });
            }
            // enter game directly
            else {
                GameManager.enterGame(gameId, gameConfigs);
            }
        }
    },

    getButtonHistory: function () {
        return this.menuNode.getComponent('MenuSlot').btnLichSu;
    },

    setGamePlay: function (gamePlay) {
        this.gamePlay = gamePlay;
        this.menuNode.getComponent('MenuSlot').gamePlay = gamePlay;
    },

    setMoney: function (index, money) {
        switch (index) {
        case 0:
            // this.txtMoneyRauSach.string = Utils.Number.format(money);
            this.txtMoneyRauSach.node.getComponent(TextJumping).updateText(money);
            break;
        case 1:
            // this.txtMoneyHotgirl.string = Utils.Number.format(money);
            this.txtMoneyHotgirl.node.getComponent(TextJumping).updateText(money);
            break;
        case 2:
            // this.txtMoneyHoaHau.string = Utils.Number.format(money);
            this.txtMoneyHoaHau.node.getComponent(TextJumping).updateText(money);
            break;
        }
    },
});
