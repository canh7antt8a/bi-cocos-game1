var GameItem = require('GameItem'),
    GameManager = require('GameManager'),
    GameConstant = require('GameConstant'),
    Utils = require('Utils'),
    AudioManager = require('AudioManager'),
    PlatformImplement = require('PlatformImplement'),
    EventDispatcher = require('EventDispatcher'),
    EventDispatcherConstant = require('EventDispatcherConstant');

cc.Class({
    extends: cc.Component,

    properties: {
        gameItemPrefab: cc.Prefab,
        gameSlotItemPrefab: cc.Prefab,
        listGameScrollView: cc.ScrollView,
        listGameSlotScrollView: cc.ScrollView,
        showGameListNode: cc.Node,
        showGameSlotListPrefabNode: cc.Node,
        switchGameButton: cc.Button,

        onlyShowGameSlotId: -1,
        floatShowGameSlotButton: 0,
        gametypeIconFrames:[cc.SpriteFrame],
    },

    // use this for initialization
    onLoad: function () {
        // back key event
        Utils.EventManager.onKeyReleased(cc.KEY.back, this.node, function () {
            PlatformImplement.openLogoutConfirmationModal();
        });
        this.hasGameSlot = (this.onlyShowGameSlotId !== -1 && this.showGameSlotListPrefabNode) || (this.gameSlotItemPrefab && this.listGameScrollView && this.showGameSlotListPrefabNode && this.listGameSlotScrollView);

        this.updateGameList();

        EventDispatcher.addEventListener(EventDispatcherConstant.GAME.UPDATE_LIST, this.updateGameList, this);
    },

    onDestroy: function () {
        EventDispatcher.removeEventListener(EventDispatcherConstant.GAME.UPDATE_LIST, this.updateGameList, this);
    },

    updateGameList: function () {
        var gameGroup, game,
            gameGroups = [],
            gameSlotGroups = [],
            i,
            gamePriorities = GameConstant.getGamePriorities(),
            showGameSlotListNode;

        for (i = 0; i < GameManager.GAME_GROUP_LIST.length; i += 1) {
            gameGroup = GameManager.GAME_GROUP_LIST[i];
            if (gameGroup && gameGroup.length > 0) {
                game = gameGroup[0];
                if (game && game.CONFIG && game.CONFIG.IS_MINIGAME && GameManager.isSmartFoxGame(game)) {
                    continue;
                }
                if (game && game.CONFIG && game.CONFIG.IS_SLOT) {
                    gameSlotGroups.push(gameGroup);
                }
                else {
                    gameGroups.push(gameGroup);
                }
            }
        }

        if (this.hasGameSlot && gameSlotGroups.length > 0) {
            if (!this.floatShowGameSlotButton) {
                showGameSlotListNode = cc.instantiate(this.showGameSlotListPrefabNode);
                showGameSlotListNode.active = true;
            }

            // Init event click for game slot item
            if (this.onlyShowGameSlotId !== -1) {
                for (i in gameSlotGroups) {
                    if (gameSlotGroups[i][0] && gameSlotGroups[i][0].gameId === this.onlyShowGameSlotId) {
                        showGameSlotListNode.getComponent(GameItem).init(gameSlotGroups[i]);
                    }
                }
            }
        }
        this._updateGameList(gamePriorities, gameGroups, this.listGameScrollView, this.gameItemPrefab, showGameSlotListNode);
        this._updateGameList(gamePriorities, gameSlotGroups, this.listGameSlotScrollView, this.gameSlotItemPrefab);

        if (gameSlotGroups.length > 0 && this.constructor.DISPLAY_SLOT_GAMES) {
            this.switchGameList();
        }
    },

    _updateGameList: function (gamePriorities, gameGroups, listGameScrollView, gameItemPrefab, extraGameItemNode) {
        if (!listGameScrollView || !gameItemPrefab) {
            cc.log('Cancel _updateGameList.');
            return;
        }
        var gameItem, i;
        gameGroups.sort(function (g1, g2) {
            return gamePriorities[g1[0].gameId] - gamePriorities[g2[0].gameId];
        });
        listGameScrollView.content.removeAllChildren();
        if (extraGameItemNode && gameGroups.length > 0) {
            listGameScrollView.content.addChild(extraGameItemNode);
        }
        for (i = 0; i < gameGroups.length; i += 1) {
            gameItem = cc.instantiate(gameItemPrefab);
            gameItem.getComponent(GameItem).init(gameGroups[i]);
            listGameScrollView.content.addChild(gameItem);
        }
        listGameScrollView.scrollToTopLeft();
    },

    switchGameList: function () {
        if (!this.hasGameSlot || this.onlyShowGameSlotId !== -1) {
            return;
        }
        this.listGameScrollView.node.active = !this.listGameScrollView.node.active;
        this.listGameSlotScrollView.node.active = !this.listGameSlotScrollView.node.active;
        this.showGameListNode.active = !this.showGameListNode.active;
        AudioManager.instance.playButtonClick();
        if(this.listGameScrollView.node.active){
            this.switchGameButton.node.getComponent(cc.Sprite).spriteFrame =this.gametypeIconFrames[1];
        } else{
            this.switchGameButton.node.getComponent(cc.Sprite).spriteFrame =this.gametypeIconFrames[0];
        }
    }
});
