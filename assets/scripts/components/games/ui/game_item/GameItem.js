var UrlImage = require('UrlImage'),
    UiManager = require('UiManager'),
    GameManager = require('GameManager'),
    GameConstant = require('GameConstant'),
    GameItemDataWrapper = require('GameItemDataWrapper'),
    EventDispatcher = require('EventDispatcher'),
    GameManagerConstant = require('GameManagerConstant');

cc.Class({
    extends: GameItemDataWrapper,

    properties: {
        loadingNode: cc.Node
    },

    // use this for initialization
    onLoad: function () {
        var animation = this.node.getComponent(cc.Animation),
            self = this;

        this.loadingAction = cc.sequence(
            cc.callFunc(function () {
                self.loadingNode.active = true;
            }),
            cc.delayTime(GameManager.JOIN_GAME_TIMEOUT / 1000),
            cc.callFunc(function () {
                self.loadingNode.active = false;
            })
        );

        function startAnimation() {
            if (animation) {
                animation.play();
            }
        }

        function stopAnimation() {
            if (animation) {
                animation.stop();
            }
        }
        this.node.on(cc.Node.EventType.MOUSE_ENTER, startAnimation);
        this.node.on(cc.Node.EventType.TOUCH_START, startAnimation);

        this.node.on(cc.Node.EventType.MOUSE_LEAVE, stopAnimation);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, stopAnimation);
        this.node.on(cc.Node.EventType.TOUCH_END, stopAnimation);

        EventDispatcher.addEventListener(GameManagerConstant.Event.JOIN_GAME, this.onJoinGame, this);
        EventDispatcher.addEventListener(GameManagerConstant.Event.JOIN_GAME_LOBBY, this.onJoinGame, this);
    },

    onDestroy: function () {
        EventDispatcher.removeEventListener(GameManagerConstant.Event.JOIN_GAME, this.onJoinGame, this);
        EventDispatcher.removeEventListener(GameManagerConstant.Event.JOIN_GAME_LOBBY, this.onJoinGame, this);
    },

    init: function (gameGroup) {
        GameItemDataWrapper.prototype.init.call(this, gameGroup);

        var game = this.normalGame || this.soloGame,
            gameNameLabel = this.node.getComponentInChildren(cc.Label),
            gameIcon = this.node.getComponentInChildren(UrlImage),
            gameIconSprite = this.node.getComponentInChildren(cc.Sprite),
            gameIconSpriteFrame, gameIconServer;

        if (gameNameLabel) {
            gameNameLabel.string = game.name;
        }

        gameIconServer = GameConstant.getIconServer(game.gameId);
        if (gameIconServer && gameIcon) {
            gameIcon.loadImage(gameIconServer);
        }
        else if (game.CONFIG && game.CONFIG.ICON && gameIconSprite) {
            gameIconSpriteFrame = GameConstant.getIconSpriteFrame(game.CONFIG.ICON);
            gameIconSprite.spriteFrame = gameIconSpriteFrame;
        }
        else if (gameIcon) {
            gameIcon.loadImage(game.logo);
        }

        // Init Game Item Slot
        var gameItemSlot = this.node.getComponent('GameItemSlot');
        if (gameItemSlot) {
            gameItemSlot.init(game.gameId);
        }
    },

    click: function () {
        var self = this;
        if (self.normalGame || self.soloGame) {
            if (self.normalGame && self.normalGame.webview_url) {
                this._startLoading();
                UiManager.openWebView(self.normalGame.webview_url, self.normalGame.name, function () {
                    self._stopLoading();
                });
            }
            else if (self.normalGame && self.normalGame.id < 0) {
                this._startLoading();
                UiManager.openModalByName(self.normalGame.CONFIG.MINIGAME_PREFAB, function () {
                    self._stopLoading();
                });
            }
            else if (!self.normalGame || !self.soloGame) {
                GameManager.playGame(self.normalGame || self.soloGame);
            }
            else if (self.normalGame && GameManager.isAvailableGame(self.normalGame.gameId) &&
                self.soloGame && GameManager.isAvailableGame(self.soloGame.gameId)) {
                UiManager.openModalByName('games/ui/play_type/PlayTypeOptionModal', function (newNode) {
                    newNode.getComponent(GameItemDataWrapper).init(self.gameGroup);
                });
            }
        }
    },

    onJoinGame: function (params) {
        var game = this.normalGame || this.soloGame;
        if (game && params && params.gameCmd === game.CONFIG.CMD) {
            if (params.isJoining) {
                this._startLoading();
            }
            else {
                this._stopLoading();
            }
        }
    },

    _startLoading: function () {
        this.node.runAction(this.loadingAction);
    },

    _stopLoading: function () {
        try {
            this.node.stopAction(this.loadingAction);
        }
        catch (e) {}
        this.loadingNode.active = false;
    }
});
