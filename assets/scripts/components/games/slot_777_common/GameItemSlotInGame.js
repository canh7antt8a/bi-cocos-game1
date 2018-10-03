var GameManager = require('GameManager'),
    Utils = require('Utils'),
    NetworkManager = require('NetworkManager'),
    MyNhanConstant = require('MyNhanConstant'),
    Slot777Constant = require('Slot777Constant'),
    BaseGameOptionModal = require('BaseGameOptionModal'),
    AudioManager = require('AudioManager'),
    UiManager = require('UiManager');

cc.Class({
    extends: cc.Component,

    properties: {
        txtBetting: cc.Label,
        button: cc.Button,
    },

    onLoad: function () {
        Slot777Constant.GameJoining = false;
    },

    setData: function (config, betting, index) {
        var self = this;
        self.activeCurrency = null;
        MyNhanConstant.BettingList.push(betting.value);
        this.txtBetting.string = Utils.Number.format(betting.value);
        (function (betting, type) {
            self.button.node.on(cc.Node.EventType.TOUCH_END, function () {
                if (!Slot777Constant.GameJoining) {
                    MyNhanConstant.GameType.type = type;
                    Slot777Constant.GameJoining = true;
                    AudioManager.instance.playButtonClick();
                    if (config) {
                        var gameOptionModalPrefabLink = config.CONFIG.GAME_OPTION_MODAL_PREFAB,
                            gameId = config.gameId,
                            gameConfigs = {
                                currency: NetworkManager.SmartFox.type.utfString(self.activeCurrency),
                                isSolo: NetworkManager.SmartFox.type.bool(config.isSolo),
                                betting: NetworkManager.SmartFox.type.long(betting.value)
                            };
                        // open game option modal then enter game later
                        if (gameOptionModalPrefabLink) {
                            UiManager.openModalByName(gameOptionModalPrefabLink, function (modal) {
                                modal.getComponent(BaseGameOptionModal).init(gameId, gameConfigs, function () {});
                            });
                            Slot777Constant.GameJoining = false;
                        }
                        // enter game directly
                        else {
                            GameManager.enterGame(gameId, gameConfigs, function () {
                                Slot777Constant.GameJoining = false;
                            });
                        }
                    }
                }
                else {
                    // cc.log('game joining...');
                }
            }, self);
        }(betting, index));
    },
});
