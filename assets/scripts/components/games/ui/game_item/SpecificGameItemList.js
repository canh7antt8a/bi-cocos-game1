var GameManager = require('GameManager'),
    GameItem = require('GameItem'),
    GameItemNode = cc.Class({
        name: 'GameItemNode',
        properties: {
            node: {
                default: null,
                type: GameItem,
            },
            id: {
                default: '',
            }
        }
    });

cc.Class({
    extends: cc.Component,

    properties: {
        gameItemNodes: {
            'default': [],
            type: GameItemNode
        }
    },

    // use this for initialization
    onLoad: function () {
        this._initGames();
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    _initGames: function () {
        var self = this;
        this.gameItemNodes.forEach(function (gameItemNode) {
            self._initGame(gameItemNode.node, parseInt(gameItemNode.id));
        });
    },

    _initGame: function (gameItem, gameId) {
        var gameGroup, game, i;
        for (i = 0; i < GameManager.GAME_GROUP_LIST.length; i += 1) {
            gameGroup = GameManager.GAME_GROUP_LIST[i];
            if (gameGroup && gameGroup.length > 0) {
                game = gameGroup[0];
                if (game && game.CONFIG && game.CONFIG.ID === gameId) {
                    gameItem.init(gameGroup);
                    break;
                }
            }
        }
    },
});
