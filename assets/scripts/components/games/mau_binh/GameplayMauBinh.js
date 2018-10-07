var GameConstant = require('GameConstant'),
    BaseMainGameplay = require('BaseMainGameplay'),
    MauBinhConstant = require('MauBinhConstant'),
    SortCardLayoutMauBinh = require('SortCardLayoutMauBinh'),
    AuthUser = require('AuthUser');

cc.Class({
    extends: BaseMainGameplay,

    properties: {
        effectCardNode: cc.Node,
        lblThongBao: cc.Label,
        lblKetQua: cc.Label,
        txtThoigian: cc.Label,
        btnXepXong: cc.Button,
        btnSwapChi: cc.Button,
        btnStartGame: cc.Button,
        bottomPanel: cc.Node,
        bgHelp: cc.Node,
        cardPrefab: cc.Prefab,
        sortCardLayout: SortCardLayoutMauBinh,
        gameCmd: {
            'default': GameConstant.MAU_BINH.CMD,
            visible: false
        },
    },

    $onLoad: function () {
        // Data
        this.time = 0;
        this.startTime = (new Date()).getTime();
        this.btnXepXong.node.active = false;
        this.btnSwapChi.node.active = false;
        this.btnStartGame.node.active = false;
        this.lblKetQua.node.active = false;
        this.lblThongBao.node.active = false;
        this.sortCardLayout.setGameParam(this, this.gameManager);
        this.cardEffectList = [];
        this.cardEffectMainPlayerList = [];

        // Event
        this.gameManager.eventDispatchers.local.addEventListener(MauBinhConstant.Event.GAME_UPDATE_HAND, this.onUpdateHand, this);
        this.gameManager.eventDispatchers.local.addEventListener(MauBinhConstant.Event.GAME_WATING_PLAYER, this.onGameWatingPlayer, this);
        this.gameManager.eventDispatchers.local.addEventListener(MauBinhConstant.Event.GAME_PREPARE, this.onGamePrepare, this);
        this.gameManager.eventDispatchers.local.addEventListener(MauBinhConstant.Event.GAME_ORDER_CARD, this.onGameOrderCard, this);
        this.gameManager.eventDispatchers.local.addEventListener(MauBinhConstant.Event.GAME_UPDATE, this.onGameUpdate, this);
        this.gameManager.eventDispatchers.local.addEventListener(MauBinhConstant.Event.GAME_FINISH, this.onGameFinish, this);
        this.gameManager.eventDispatchers.local.addEventListener(MauBinhConstant.Event.GAME_COMPARE_CHI, this.onCompareChi, this);
        this.gameManager.eventDispatchers.local.addEventListener(MauBinhConstant.Event.GAME_USER_FINISH_ORDER, this.onUserFinishOrder, this);
        this.gameManager.eventDispatchers.local.addEventListener(MauBinhConstant.Event.GAME_NOTIFY_THANG_TRANG, this.onNotifyThangTrang, this);
        this.gameManager.eventDispatchers.local.addEventListener(MauBinhConstant.Event.GAME_NOTIFY_BINH_LUNG, this.onNotifyBinhLung, this);
        this.gameManager.eventDispatchers.local.addEventListener(MauBinhConstant.Event.GAME_PLAYER_REMOVE, this.onPlayerRemove, this);
        this.gameManager.eventDispatchers.local.addEventListener(MauBinhConstant.Event.GAME_PLAYER_ADD, this.onPlayerAdd, this);
    },

    $onFocus: function () {
        if (!this.gameManager) {
            return;
        }
        switch (this.gameManager.gameState) {
        case MauBinhConstant.GameState.DEALING:
            break;
        case MauBinhConstant.GameState.ORDER_CARDS:
            break;
        case MauBinhConstant.GameState.FINISH:
            break;
        case MauBinhConstant.GameState.COMPARE_1:
            break;
        case MauBinhConstant.GameState.COMPARE_2:
            break;
        case MauBinhConstant.GameState.COMPARE_3:
            break;
        }
    },

    $onLostFocus: function () {},

    onPostPlayerAdded: function (playerUI) {
        if (!playerUI) {
            return;
        }
        if (playerUI.player.data.username === AuthUser.username) {
            playerUI.node.getComponent('PlayerUIMauBinh').setGamePlay(this);
        }
    },

    reset: function () {
        this.bottomPanel.zIndex = 0;
        this.lblThongBao.string = '';
        this.lblKetQua.string = '';
        this.txtThoigian.string = '';
        this.btnXepXong.node.active = false;
        this.btnSwapChi.node.active = false;
        this.btnStartGame.node.active = false;
        this.lblKetQua.node.active = false;
        this.bgHelp.active = false;
        this.cardEffectList = [];
        this.effectCardNode.removeAllChildren();
        this.sortCardLayout.reset();

        // Reset Player
        for (var i = 0; i < this.playerNodeList.length; i += 1) {
            this.playerNodeList[i].node.getComponent('PlayerUIMauBinh').reset();
        }
    },

    onGameWatingPlayer: function () {
        this.lblThongBao.string = 'Đang đợi người chơi khác:';
        this.txtThoigian.string = '';
        this.lblThongBao.node.active = true;
    },

    onGamePrepare: function (params) {
        // cc.log('onGamePrepare');
        // cc.log(params);
        var i,
            dt = 0;
        if (params.__execInfo__) {
            dt = params.__execInfo__.dt;
        }
        this.reset();
        this.time = params.allData.time - dt;
        if (this.time <= 0) {
            return;
        }
        this.startTime = (new Date()).getTime();
        this.lblThongBao.node.active = true;
        this.lblThongBao.string = 'Ván bài mới sẽ bắt đầu sau:';

        // Show Button Start Game
        var players = params.allData.players;
        for (i = 0; i < players.length; i += 1) {
            if (players[i].username === AuthUser.username && players[i].isMaster) {
                // this.btnStartGame.node.active = true;
                break;
            }
        }
    },

    onUpdateHand: function (params) {
        // cc.log('onUpdateHand');
        this.mainPlayerCards = params.hand;
        this.lblThongBao.node.active = false;
        var players = params.players;

        // Effect Chia Bai
        this.createEffectChiaBai(players);

        // Hide BtnStart
        this.btnStartGame.node.active = false;
    },

    onGameOrderCard: function (params) {
        // cc.log('onGameOrderCard');
        this.lblThongBao.node.active = true;
        this.txtThoigian.string = '';
        this.lblThongBao.string = 'Trận đấu đang diễn ra.';
        this.btnStartGame.node.active = false;
        var players = params.allData.players;
        var i,
            playerUiMaubinh,
            isSortCardActive = false,
            player;
        for (i = 0; i < players.length; i += 1) {
            player = this.getPlayerByUserName(players[i].username);
            if (player) {
                playerUiMaubinh = player.getComponent('PlayerUIMauBinh');
                if (playerUiMaubinh && players[i].isActive) {
                    var dt = 0;
                    if (params.__execInfo__) {
                        dt = params.__execInfo__.dt;
                    }
                    var time = params.allData.time - dt;
                    if (time <= 0) {
                        return;
                    }
                    playerUiMaubinh.setState(MauBinhConstant.PlayerState.IN_TURN, time, players[i].isFinish);
                    if (players[i].username === AuthUser.username) {
                        this.lblThongBao.node.active = false;
                        this.btnSwapChi.node.active = true;
                        this.btnXepXong.node.active = true;
                        if (!this.sortCardLayout.node.active) {
                            this.sortCardLayout.node.active = true;
                            this.sortCardLayout.setCards(players[i].cards);
                        }
                        if (playerUiMaubinh.isThangTrang || players[i].isFinish) {
                            this.onClickFinishOrder();
                        }
                    }
                    isSortCardActive = this.sortCardLayout.node.active;
                }
                else if (!players[i].isActive) {
                    playerUiMaubinh.setState(MauBinhConstant.PlayerState.WAITING, 0);
                }
            }
        }
        for (i = 0; i < players.length; i += 1) {
            player = this.getPlayerByUserName(players[i].username);
            if (player) {
                playerUiMaubinh = player.getComponent('PlayerUIMauBinh');
                if (playerUiMaubinh && players[i].isActive && AuthUser.username !== players[i].username) {
                    playerUiMaubinh.showCardLayout(players[i].isActive, isSortCardActive);
                }
            }
        }

        // Remove Card Effect
        this._removeCardEffect();
    },

    onCompareChi: function (params, isInForcus) {
        // cc.log('onCompareChi');
        // Check Main User In Turn
        this.lblThongBao.node.active = false;
        this.btnStartGame.node.active = false;
        var players = params.allData.players,
            isUserInTurn = false;
        for (var j = 0; j < players.length; j += 1) {
            if (players[j].username === AuthUser.username && players[j].isActive) {
                isUserInTurn = true;
                break;
            }
        }

        // Notify Show Chi
        this.lblKetQua.node.active = true;
        this.lblKetQua.node.scale = 0;
        this.lblKetQua.node.stopAllActions();
        this.lblKetQua.node.runAction(cc.scaleTo(0.5, 1));
        this.txtThoigian.string = '';
        this.lblThongBao.node.active = false;
        if (params.action === MauBinhConstant.Action.COMPARE_CHI_MOT) {
            // Hide Sort Card
            if (isUserInTurn) {
                this.btnSwapChi.node.active = false;
                if (this.btnXepXong.node.active) {
                    this.btnXepXong.node.active = false;
                    this.hideSortCardLayout();
                }
            }
            this.lblKetQua.string = 'Chi 1';
        }
        else if (params.action === MauBinhConstant.Action.COMPARE_CHI_HAI) {
            this.lblKetQua.string = 'Chi 2';
        }
        else if (params.action === MauBinhConstant.Action.COMPARE_CHI_BA) {
            this.lblKetQua.string = 'Chi 3';
        }

        // Show Thong Bao Cho
        if (!isUserInTurn) {
            this.lblThongBao.string = 'Trận đấu đang diễn ra.';
        }

        // Compare Card
        for (var i = 0; i < players.length; i += 1) {
            var playerNode = this.getPlayerByUserName(players[i].username);
            if (players[i].isActive && playerNode) {
                playerNode.getComponent('PlayerUIMauBinh').compareChi(params.action, params.gameState, players[i], params.actions, isInForcus);
            }
        }
    },

    onGameFinish: function (params) {
        // cc.log('onGameFinish');
        // cc.log(params);
        this.lblKetQua.node.active = true;
        this.lblKetQua.string = 'Kết quả';
        this.lblKetQua.node.scale = 0;
        this.lblKetQua.node.stopAllActions();
        this.lblKetQua.node.runAction(cc.scaleTo(0.5, 1));
        this.lblThongBao.node.active = false;
        this.txtThoigian.string = '';
        this.lblThongBao.string = '';
        this.btnStartGame.node.active = false;
        var players = params.allData.players;
        for (var i = 0; i < players.length; i += 1) {
            // Find Money Exchange In Result
            var moneyExchange = 0;
            var summary = params.result.summary;
            for (var j = 0; j < summary.length; j += 1) {
                if (players[i].username === summary[j].userName) {
                    moneyExchange = summary[j].moneyExchange;
                    break;
                }
            }

            // Set Result
            var playerNode = this.getPlayerByUserName(players[i].username);
            if (playerNode) {
                playerNode.getComponent('PlayerUIMauBinh').setResult(players[i], moneyExchange);
            }
        }

        // Hide Sortcard
        this.btnSwapChi.node.active = false;
        this.btnXepXong.node.active = false;
        this.hideSortCardLayout();
    },

    onPlayerRemove: function () {
        // cc.log('onPlayerRemove');
        for (var i = 0; i < this.playerNodeList.length; i += 1) {
            if (!this.playerNodeList[i].player) {
                this.playerNodeList[i].node.getComponent('PlayerUIMauBinh').reset();
            }
        }
    },

    onPlayerAdd: function (params) {
        // cc.log('onPlayerAdd');
        // cc.log(params);
        if (this.gameManager.gameState !== MauBinhConstant.GameState.WAITING_DEALING) {
            var playerNode = this.getPlayerByUserName(params.player.username);
            var playerUiMaubinh = playerNode.getComponent('PlayerUIMauBinh');
            if (playerUiMaubinh && !params.player.isActive) {
                playerUiMaubinh.setState(MauBinhConstant.PlayerState.WAITING);
            }
        }
    },

    onUserFinishOrder: function (params) {
        // cc.log('onUserFinishOrder');
        // cc.log(params);
        var playerNode = this.getPlayerByUserName(params.username);
        if (playerNode) {
            playerNode.getComponent('PlayerUIMauBinh').setState(MauBinhConstant.PlayerState.FINISH);
        }
    },

    onNotifyThangTrang: function (params) {
        // cc.log('################onNotifyThangTrang ');
        // cc.log(params);
        var playerNode = this.getPlayerByUserName(params.username);
        if (playerNode) {
            playerNode.getComponent('PlayerUIMauBinh').setThangTrang(params);
            playerNode.getComponent('PlayerUIMauBinh').setState(MauBinhConstant.PlayerState.FINISH);
            this.audioManager.playThangTrang();
        }
    },

    onNotifyBinhLung: function () {},

    getPlayerByUserName: function (username) {
        for (var i = 0; i < this.playerNodeList.length; i += 1) {
            if (!this.playerNodeList[i].player) {
                continue;
            }
            if (this.playerNodeList[i].player.data.username === username) {
                return this.playerNodeList[i].node;
            }
        }
        return null;
    },

    $onUpdate: function () {
        var currentTime = (new Date()).getTime();
        var remainTime = Math.floor((this.time - (currentTime - this.startTime)) / 1000);
        if (remainTime < 0) {
            remainTime = 0;
        }
        if (this.gameManager.gameState === MauBinhConstant.GameState.WAITING_DEALING) {
            this.txtThoigian.string = Math.floor(remainTime + 1) + ' giây';
        }
    },

    hideSortCardLayout: function () {
        this.sortCardLayout.setFinishOrder();
        for (var i = 0; i < this.playerNodeList.length; i += 1) {
            if (this.playerNodeList[i].player) {
                var userName = this.playerNodeList[i].player.data.username;
                var playerUiMaubinh = this.getPlayerByUserName(userName).getComponent('PlayerUIMauBinh');
                if (playerUiMaubinh.isActive) {
                    playerUiMaubinh.showCardLayout(true, false);
                    if (userName === AuthUser.username) {
                        playerUiMaubinh.setOpenAllCards(this.sortCardLayout.getCards());
                    }
                }
            }
        }
    },

    createEffectChiaBai: function (players) {
        this.audioManager.playBaiChia();
        this.countCardEffectFinish = 0;
        this.cardEffectMainPlayerList = [];
        var length = players.length,
            index = 0,
            index2 = 12,
            cardLength = length * 13,
            pos = [],
            playerUiMaubinhList = [];
        for (i = 0; i < length; i += 1) {
            var playerNode = this.getPlayerByUserName(players[i].userName);
            if (players[i].isActive && playerNode) {
                pos.push(playerNode.getComponent('PlayerUIMauBinh').cardLayout.getCardPositionList());
            }
            playerUiMaubinhList.push(playerNode.getComponent('PlayerUIMauBinh'));
        }
        for (var i = 0; i < cardLength; i += 1) {
            // Add
            var position = pos[index][index2];
            position = this.effectCardNode.convertToNodeSpaceAR(position);
            var cardNode = cc.instantiate(this.cardPrefab);
            cardNode.scale = 0.4;
            cardNode.x = 0;
            cardNode.y = 0;
            this.effectCardNode.addChild(cardNode);
            this.cardEffectList.push(cardNode);

            // Push Effect Main Player
            if (index === 0) {
                this.cardEffectMainPlayerList.push(cardNode);
            }

            // Action
            cardNode.runAction(cc.sequence(cc.delayTime((cardLength - i) * 0.03), cc.moveTo(0.2, position).easing(cc.easeCubicActionIn()), cc.callFunc(function () {
                this.countCardEffectFinish += 1;
                var playerUiMaubinh, isMainUserInTurn = false;
                if (this.countCardEffectFinish >= cardLength) {
                    for (i = 0; i < players.length; i += 1) {
                        var playerNode = this.getPlayerByUserName(players[i].userName);
                        if (players[i].isActive && players[i].userName === AuthUser.username && playerNode) {
                            playerUiMaubinh = playerNode.getComponent('PlayerUIMauBinh');
                            this.sortCardLayout.setCards(this.mainPlayerCards);
                            this.sortCardLayout.node.active = true;
                            playerUiMaubinh.showCardLayout(false, true);
                            isMainUserInTurn = true;
                        }
                    }
                    for (i = 0; i < players.length; i += 1) {
                        var playerNode1 = this.getPlayerByUserName(players[i].userName);
                        if (players[i].isActive && players[i].userName !== AuthUser.username && playerNode1) {
                            playerUiMaubinh = playerNode1.getComponent('PlayerUIMauBinh');
                            playerUiMaubinh.showCardLayout(true, isMainUserInTurn);
                        }
                    }
                    this._removeCardEffect();
                }
            }.bind(this))));

            // Increase Index
            index += 1;
            if (index >= pos.length) {
                index = 0;
                index2 -= 1;
            }
        }
    },

    onClickFinishOrder: function () {
        this.audioManager.playButtonClick();
        // cc.log('onClickFinishOrder');
        if (this.gameManager.gameState === MauBinhConstant.GameState.ORDER_CARDS) {
            this.gameManager.sendRequestOrderCard(this.sortCardLayout.getCards(), true);
            this.btnSwapChi.node.active = false;
            this.btnXepXong.node.active = false;
            this.hideSortCardLayout();

            // Send State Finish User
            var player = this.getPlayerByUserName(AuthUser.username);
            if (player) {
                player.getComponent('PlayerUIMauBinh').setState(MauBinhConstant.PlayerState.FINISH);
            }
        }
    },

    onClickStartGame: function () {
        this.audioManager.playButtonClick();
        this.btnStartGame.node.active = false;
        if (this.gameManager.gameState === MauBinhConstant.GameState.WAITING_DEALING) {
            this.gameManager.sendRequestStartGame();
        }
    },

    onClickHelp: function () {
        this.audioManager.playButtonClick();
        this.bgHelp.active = !this.bgHelp.active;
        this.bottomPanel.zIndex = this.bgHelp.active ? 10 : 0;
        this.topPanelInGame.node.zIndex = this.bgHelp.active ? 0 : 10;
    },

    onCloseHelp: function () {
        this.audioManager.playButtonClick();
        this.bgHelp.active = false;
        this.bottomPanel.zIndex = 0;
        this.topPanelInGame.node.zIndex = 10;
    },

    onSwapChiClick: function () {
        this.audioManager.playButtonClick();
        this.sortCardLayout.swapChi();
    },

    _removeCardEffect: function () {
        for (var i = 0; i < this.cardEffectList.length; i += 1) {
            this.cardEffectList[i].destroy();
        }
        this.cardEffectList = [];
        this.cardEffectMainPlayerList = [];
    }
});
