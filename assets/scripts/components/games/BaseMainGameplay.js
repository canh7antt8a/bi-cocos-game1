var PlayerUI = require('PlayerUI'),
    Utils = require('Utils'),
    SysConfig = require('SysConfig'),
    GameConstant = require('GameConstant'),
    BaseGameplay = require('BaseGameplay'),
    GameManagerConstant = require('GameManagerConstant'),
    TopPanelInGame = require('TopPanelInGame');

cc.Class({
    extends: BaseGameplay,

    properties: {
        playerNodeList: {
            'default': [],
            type: PlayerUI
        },
        playerSoloNodeList: {
            'default': [],
            type: PlayerUI
        },
        scaleNativeNodeList: {
            'default': [],
            type: cc.Node
        },
        fixedMainUserPosition: false,
        reservedLastPosition: false
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    $onLoadScene: function () {
        var game = this.gameRuntimeConfigs.game,
            self = this,
            compareResult,
            i;

        // solo game
        if (game && game.isSolo && this.playerSoloNodeList.length === 2) {
            // keep only two slots
            compareResult = Utils.Set.compare(this.playerNodeList, this.playerSoloNodeList);
            for (i = 0; i < compareResult.diff12.length; i += 1) {
                compareResult.diff12[i].node.active = false;
            }
            this.playerNodeList = this.playerSoloNodeList;
        }

        for (i = 0; i < this.playerNodeList.length; i += 1) {
            this.playerNodeList[i].removePlayer();
        }

        // For mobile
        cc.director.getScene().autoReleaseAssets = !cc.sys.isBrowser;
        var isNative = SysConfig.PLATFORM !== 'WEB';
        var scaleIncrease = this.playerNodeList.length <= 4 ? 0.2 : 0.1;
        if (game.gameId === GameConstant.PHOM.ID) {
            scaleIncrease = 0.05;
        }
        for (i = 0; i < this.playerNodeList.length; i += 1) {
            var node = this.playerNodeList[i].node;
            if (isNative) {
                node.scale = node.scale + scaleIncrease;
            }
            var widgetComp = node.getComponent(cc.Widget);
            if (widgetComp) {
                widgetComp.enabled = isNative;
            }
        }
        if (isNative) {
            for (i = 0; i < this.scaleNativeNodeList.length; i += 1) {
                this.scaleNativeNodeList[i].scale = this.scaleNativeNodeList[i].scale + 0.2;
            }
        }

        this.mainUserPositionIndex = -1;
        this._mainUserPositionIndex = -1;

        this.gameManager.eventDispatchers.local.addEventListener(GameManagerConstant.Event.PLAYER_ADDED, this._onPlayerAdded, this);
        this.gameManager.eventDispatchers.local.addEventListener(GameManagerConstant.Event.PLAYER_REMOVED, this._onPlayerRemoved, this);

        this.topPanelInGameData = {};
        this.$onLoad();

        // top panel ingame
        this.topPanelInGame = this.node.getComponentInChildren(TopPanelInGame);
        if (this.topPanelInGame) {
            this.topPanelInGame.init(this);
        }
        else {
            var configs = game && game.CONFIG && game.CONFIG.TOP_PANEL_IN_GAME;
            if (configs && configs.ENABLE) {
                cc.loader.loadRes('games/ui/TopPanelInGame', function (err, prefab) {
                    var newNode = cc.instantiate(prefab);
                    self.node.addChild(newNode);
                    self.topPanelInGame = newNode.getComponent(TopPanelInGame);
                    self.topPanelInGame.init(self);
                });
            }
        }

        // running message
        cc.loader.loadRes('games/ui/RunningMessageInGame', function (err, prefab) {
            var newNode = cc.instantiate(prefab);
            self.node.addChild(newNode);
            newNode.setSiblingIndex(0);
        });

        // back key event
        Utils.EventManager.onKeyReleased(cc.KEY.back, this.node, function () {
            if (self.topPanelInGame) {
                self.topPanelInGame.openLeaveRoomConfirmModal();
            }
        });
    },

    $onLoad: function () {

    },

    findPlayerNodeByName: function (username) {
        var playerNode, player, i;
        for (i = 0; i < this.playerNodeList.length; i += 1) {
            playerNode = this.playerNodeList[i];
            player = playerNode.player;
            if (username && username === (player && player.data && player.data.username)) {
                return playerNode;
            }
        }
        return null;
    },

    findPlayerNodeByIndex: function (index) {
        // fixed position
        if (this.fixedMainUserPosition && this.mainUserPositionIndex >= 0) {
            // not in reserved mode or not reserved position
            if (!this.reservedLastPosition || index !== this.playerNodeList.length - 1) {
                // transition
                if (this.reservedLastPosition && this._mainUserPositionIndex >= 0) {
                    index -= this._mainUserPositionIndex;
                }
                else {
                    index -= this.mainUserPositionIndex;
                }

                if (index < 0) {
                    index += this.playerNodeList.length;
                    // not count reserved position
                    if (this.reservedLastPosition) {
                        index -= 1;
                    }
                }
            }
        }
        return this.playerNodeList[index];
    },

    _onPlayerAdded: function (player) {
        if (player && player.data) {
            if (this.fixedMainUserPosition) {
                if (player.isMe()) {
                    this.mainUserPositionIndex = player.data.slot;
                    if (this._mainUserPositionIndex < 0) {
                        this._mainUserPositionIndex = this.mainUserPositionIndex;
                    }
                }
                else if (this.mainUserPositionIndex < 0) {
                    throw 'Must set position for main user first';
                }
            }

            this.audioManager.playPlayerJoinRoom();
            var playerNode = this.findPlayerNodeByIndex(player.data.slot);
            if (playerNode && playerNode.player !== player) {
                this._executeMethod('onPrePlayerAdded', playerNode, player);
                playerNode.setPlayer(player);
                this._executeMethod('onPostPlayerAdded', playerNode);
            }

        }
    },

    _onPlayerRemoved: function (player) {
        if (player && player.data) {
            var playerNode = this.findPlayerNodeByName(player.data.username);
            if (playerNode && playerNode.player === player) {
                this.audioManager.playPlayerLeaveRoom();
                this._executeMethod('onPrePlayerRemoved', playerNode);
                playerNode.removePlayer();
                this._executeMethod('onPostPlayerRemoved', playerNode, player);
            }
        }
    },

    _executeMethod: function (methodName) {
        var method = this[methodName],
            params;
        if (Utils.Type.isFunction(method)) {
            params = Array.prototype.slice.call(arguments);
            params.shift();
            try {
                method.apply(this, params);
            }
            catch (e) {
                cc.error(e);
            }
        }
    }
});
