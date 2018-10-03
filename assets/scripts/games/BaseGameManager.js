var NetworkManager = require('NetworkManager'),
    EventDispatcher = require('EventDispatcher'),
    SmartFoxConstant = require('SmartFoxConstant'),
    UiManager = require('UiManager'),
    Utils = require('Utils'),
    AuthUser = require('AuthUser'),
    EventDispatcherConstant = require('EventDispatcherConstant'),
    GameManagerConstant = require('GameManagerConstant'),
    TinhNangManager = require('TinhNangManager'),
    Player = require('Player'),
    LOCAL_EVENT = {
        UPDATE_USER_MONEY: 'game_manager.private.profile.update_money',
        UPDATE_USER_EXP: 'game_manager.private.profile.update_exp',
    },
    BaseGameManager;

/**
 * Base class to manage game logic.
 *
 * Dispatcher types:
 *     - Event:  ~command (such as 'play')
 *     - Action: ~action  (such as 'bet', 'withdraw')
 *
 * Currency types:
 *     - Support single/multiple currencies.
 *
 * Player (sitting and standing):
 *     - username
 *     - avatar
 *     - displayName
 *     - money
 *     - currency
 *
 *     // optional
 *     - slot
 *     - handSize
 *     - isMaster
 *     - isRegisteredToQuitGame
 *     - ...
 *
 *
 * @param {Object} game            game object
 * @param {Number} roomId          id of room which game manager belongs to
 */
BaseGameManager = Utils.Class({

    $$constructor: function (game, roomId) {
        this.DELAYED_COMMANDS = [
            SmartFoxConstant.Command.MESSAGE.ID,
            SmartFoxConstant.Command.PLAY.ID,
            SmartFoxConstant.Command.FINISH_GAME.ID,
            SmartFoxConstant.Command.DEAL_CARD.ID,
            SmartFoxConstant.Command.TURN.ID,
            SmartFoxConstant.Command.WAITING_DEAL_CARD.ID,
        ];

        this.gameCmd = game.CONFIG.CMD;
        this.roomId = roomId;
        this.logEnabled = game.CONFIG.LOG;
        this.gameId = game.CONFIG.ID;
        this.visibleSlots = game.CONFIG.VISIBLE_SLOTS;
        this.warningMessageDuration = game.CONFIG.WARNING_MESSAGE_DURATION;
        this.fee = 0;
        this._saveMatchId(0);
        this.eventDispatchers = {
            globalCmd: EventDispatcher.create(true),
            // anyCmd: EventDispatcher.create(true),
            anyCmd: EventDispatcher.createStackEventDispatcher(game.CONFIG.MAX_COMMANDS_PER_MATCH || 50),
            playCmd: EventDispatcher.create(true),
            local: EventDispatcher.create(true),
            _private: EventDispatcher.create(true)
        };
        this._reinitPlayersInfo();
        this._reinitBettingInfo();

        if (game.CONFIG.ALONE) {
            this._addCurrentUserToPlayers();
        }

        this._onExtensionHandlerBinding = this._onExtensionHandler.bind(this);
        NetworkManager.SmartFox.addExtensionHandler(this.gameCmd, this._onExtensionHandlerBinding);

        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.MESSAGE.ID, this._onMessage, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.KICK_PLAYER.ID, this._onKickPlayer, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.PLAYER_ADDED.ID, this._onPlayerAdded, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.PLAYER_REMOVED.ID, this._onPlayerRemoved, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.WAITING_PLAYER_ADDED.ID, this._onWaitingPlayerAdded, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.WAITING_PLAYER_REMOVED.ID, this._onWaitingPlayerRemoved, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.REG_QUIT_GAME.ID, this._onRegisterQuitGame, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.DEREG_QUIT_GAME.ID, this._onDeregisterQuitGame, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.UPDATE_GAME.ID, this._onUpdateGame, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.REFRESH_GAME.ID, this._onUpdateGame, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.UPDATE_USER_INFO.ID, this._onUpdateUserInfo, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.PLAY.ID, this._onPlay, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.NEW_MATCH.ID, this._onNewMatch, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.REQUEST_BANKER.ID, this._onSetBanker, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.BANKER_RESIGN.ID, this._onRemoveBanker, this);

        if (game.CONFIG.BUY_MONEY) {
            this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.UPDATE_PRIVATE_USER_MONEY.ID, this._onUpdateUserPrivateMoney, this);
        }
        else {
            this.eventDispatchers._private.addEventListener(LOCAL_EVENT.UPDATE_USER_MONEY, this._onUpdateUserMoney, this);
            EventDispatcher.addEventListener(EventDispatcherConstant.PROFILE.UPDATE_MONEY, this._onUpdateUserMoney, this);
        }

        this.log('[BaseGameManager] GameCMD: ' + this.gameCmd + ', RoomID: ' + this.roomId);
    },

    startGame: function () {},

    destroy: function () {
        this._clearEventDispatchers();
        this._reinitPlayersInfo();
        this._reinitBettingInfo();

        NetworkManager.SmartFox.removeExtensionHandler(this.gameCmd, this._onExtensionHandlerBinding);
    },

    isCurrentPlayer: function (playerOrPlayerName) {
        var playerName = null;
        if (Utils.Type.isObject(playerOrPlayerName)) {
            playerName = playerOrPlayerName.username || playerOrPlayerName.userName;
        }
        if (!playerName) {
            playerName = playerOrPlayerName;
        }
        if (playerName && this.current.player && this.current.player.data.username === playerName) {
            return true;
        }
        return false;
    },

    disableEventDispatchersCache: function () {
        this.eventDispatchers.local.disableCache();
        this.eventDispatchers.globalCmd.disableCache();
        // this.eventDispatchers.anyCmd.disableCache();
        this.eventDispatchers.playCmd.disableCache();
        this.eventDispatchers._private.disableCache();
    },

    isNewMatch: function (matchId) {
        matchId = this._parseMatchId(matchId);
        if (matchId >= 0 && this.matchInfo.matchId >= 0 && this.matchInfo.matchId !== matchId) {
            return true;
        }
        return false;
    },

    /**
     * Fake add player message. It's useful in rare case, so use it carefully.
     *
     * @param {Object} playerData playerData
     */
    addPlayerFromData: function (playerData) {
        this._onPlayerAdded({
            player: playerData
        });
    },

    removePlayerByUsername: function (username) {
        if (username) {
            var params = {
                player: {
                    username: username
                }
            };
            if (!this._onPlayerRemoved(params)) {
                this._onWaitingPlayerRemoved(params);
            }
        }
    },

    openHelpModal: function () {
        var self = this;
        UiManager.openModalByName('HelpModal', function (newNode) {
            var modalComp = newNode.getComponent('GameHelpModal'),
                scrollViewComp = newNode.getComponentInChildren(cc.ScrollView);
            if (scrollViewComp) {
                scrollViewComp.scrollToTop();
            }
            modalComp.init(self.gameId);
        });
    },

    /**
     * Call when player want to rejoin a room without leave-then-join actual room.
     */
    fetchInitialGameData: function () {
        this.requestRefreshGame();
    },

    _clearEventDispatchers: function () {
        this.eventDispatchers.local.clear();
        this.eventDispatchers.globalCmd.clear();
        this.eventDispatchers.anyCmd.clear();
        this.eventDispatchers.playCmd.clear();
        this.eventDispatchers._private.clear();
    },

    _reinitPlayersInfo: function () {
        this.current = {};
        this.players = {};
        this.waitingPlayers = {};
    },

    _reinitBettingInfo: function () {
        this.bettingInfo = {};
    },

    _addCurrentUserToPlayers: function () {
        this._onPlayerAdded({
            player: {
                userName: AuthUser.username,
            }
        });
    },

    _parseMatchId: function (matchId) {
        try {
            return parseInt(matchId);
        }
        catch (e) {}
    },

    _saveMatchId: function (matchId) {
        this.matchInfo = {
            matchId: matchId,
            time: Date.now()
        };
    },

    // ============================================================
    // Send API
    // ============================================================

    send: function (params) {
        this.log('[' + this.gameCmd + ', ' + this.roomId + '] [send]', params);
        NetworkManager.SmartFox.sendExtensionRequest(this.gameCmd, params, this.roomId);
    },

    requestRefreshGame: function () {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.REFRESH_GAME.ID)
        });
    },

    sendRequestBanker: function () {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.REQUEST_BANKER.ID)
        });
    },

    registerQuitGame: function () {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.REG_QUIT_GAME.ID)
        });
    },

    deregisterQuitGame: function () {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.DEREG_QUIT_GAME.ID)
        });
    },

    sendChatMessage: function (message) {
        NetworkManager.SmartFox.sendPublicMessageRequest(message, this.roomId);
    },

    leaveRoom: function () {
        NetworkManager.SmartFox.leaveRoom(this.roomId);
    },

    // ============================================================
    // Receive API
    // ============================================================

    _onExtensionHandler: function (event) {
        var sourceRoom = event.sourceRoom,
            params = event.params || {},
            cmd = params.command;
        if (Utils.Type.isDefined(cmd)) {
            if (sourceRoom === this.roomId) {
                if ('timeForAnimation' in params) {
                    Utils.Object.replaceProperty(params, 'timeForAnimation', 'time');
                }
                if ('userName' in params) {
                    Utils.Object.replaceProperty(params, 'userName', 'username');
                }

                var players = params.allData && params.allData.players,
                    waitingPlayers = params.allData && params.allData.waitingPlayers;

                if (players) {
                    this._updatePlayersData(players, this.players);
                }
                if (waitingPlayers) {
                    this._updatePlayersData(waitingPlayers, this.waitingPlayers);
                }

                if (this.DELAYED_COMMANDS.indexOf(cmd) === -1) {
                    this.eventDispatchers.anyCmd.dispatchEvent(cmd, params);
                    this.log('[' + this.gameCmd + ', ' + this.roomId + '] [receive] [exec]', params);
                }
                else {
                    this.eventDispatchers.anyCmd.pushEvent(cmd, params);
                    this.log('[' + this.gameCmd + ', ' + this.roomId + '] [receive] [stack]', params);
                }
            }
            else if (!sourceRoom) {
                this.eventDispatchers.globalCmd.dispatchEvent(cmd, params);
                this.log('[' + this.gameCmd + ', ' + this.roomId + '] [receive] [global]', params);
            }
        }
    },

    _onNewMatch: function (params) {
        var matchId = this._parseMatchId(params && params.matchId);
        if (matchId >= 0) {
            this._saveMatchId(matchId);
            if (!Utils.Game.isFocus()) {
                this.eventDispatchers.local.dispatchEvent(GameManagerConstant.Event.NEW_MATCH_LOST_FOCUS);
            }
        }
    },

    _onPlay: function (params) {
        var action = params.action;
        if (Utils.Type.isDefined(action)) {
            this.eventDispatchers.playCmd.dispatchEvent(action, params);
        }
    },

    _onMessage: function (params) {
        UiManager.openWarningMessage(params && params.content, this.warningMessageDuration);
    },

    _onKickPlayer: function (params) {
        if (this.isCurrentPlayer(params.username)) {
            var reasonId = params.reasonId;
            if ((reasonId === SmartFoxConstant.KickReason.NOT_ENOUGH_MONEY ||
                    reasonId === SmartFoxConstant.KickReason.NOT_ENOUGH_MONEY_TOBE_BANKER) && TinhNangManager.choPhep('nt')) {
                UiManager.openConfirmModal(params.msg, {
                    isPersistent: true,
                    oke_fn: function () {
                        UiManager.openNapXienModal();
                    }
                });
            }
            else {
                UiManager.openModal(params.msg);
            }
        }
    },

    _onPlayerAdded: function (params) {
        var player = this._addPlayerToCollection(params.player, this.players);
        if (player) {
            this.eventDispatchers.local.dispatchEvent(GameManagerConstant.Event.PLAYER_ADDED, player);
            return true;
        }
        return false;
    },

    _onPlayerRemoved: function (params) {
        var player = this._removePlayerFromCollection(params.player, this.players);
        if (player) {
            this.eventDispatchers.local.dispatchEvent(GameManagerConstant.Event.PLAYER_REMOVED, player);
            return true;
        }
        return false;
    },

    _onWaitingPlayerAdded: function (params) {
        var player = this._addPlayerToCollection(params.player, this.waitingPlayers);
        if (player) {
            this.eventDispatchers.local.dispatchEvent(GameManagerConstant.Event.WAITING_PLAYER_ADDED, player);
            return true;
        }
        return false;
    },

    _onWaitingPlayerRemoved: function (params) {
        var player = this._removePlayerFromCollection(params.player, this.waitingPlayers);
        if (player) {
            this.eventDispatchers.local.dispatchEvent(GameManagerConstant.Event.WAITING_PLAYER_REMOVED, player);
            return true;
        }
        return false;
    },

    _addPlayerToCollection: function (playerData, collection) {
        if (collection && playerData) {
            if ('userName' in playerData) {
                Utils.Object.replaceProperty(playerData, 'userName', 'username');
            }
            if ('slotIndex' in playerData) {
                Utils.Object.replaceProperty(playerData, 'slotIndex', 'slot');
            }
            if (cc.sys.isBrowser && location.protocol === 'https:' && playerData.avatar) {
                playerData.avatar = playerData.avatar.replace(/^http:/, 'https:');
            }

            var p = collection[playerData.username];
            if (p) {
                p.update(playerData);
            }
            else {
                p = new Player(playerData);
                if (playerData.username === AuthUser.username) {
                    this.current.player = p;
                }
                collection[playerData.username] = p;
            }
            return p;
        }
        return null;
    },

    _removePlayerFromCollection: function (playerData, collection) {
        if (collection && playerData) {
            if ('userName' in playerData) {
                Utils.Object.replaceProperty(playerData, 'userName', 'username');
            }

            var p = collection[playerData.username];
            delete collection[playerData.username];
            return p;
        }
        return null;
    },

    _onSetBanker: function (params) {
        if (params && params.bankerInfo) {
            if (this.isCurrentPlayer(params.bankerInfo)) {
                this.isMaster = true;
            }
            if (params.bankerInfo) {
                params.bankerInfo.slot = this.visibleSlots;
                this.addPlayerFromData(params.bankerInfo);
            }
        }
    },

    _onRemoveBanker: function (params) {
        this.removePlayerByUsername(params.player);
    },

    _onRegisterQuitGame: function (params) {
        if (this.isCurrentPlayer(params.username)) {
            this.current.player.data.isRegisteredToQuitGame = true;
            this.eventDispatchers.local.dispatchEvent(GameManagerConstant.Event.UPDATE_REGISTER_QUIT_GAME_STATUS);
        }
    },

    _onDeregisterQuitGame: function (params) {
        if (this.isCurrentPlayer(params.username)) {
            this.current.player.data.isRegisteredToQuitGame = false;
            this.eventDispatchers.local.dispatchEvent(GameManagerConstant.Event.UPDATE_REGISTER_QUIT_GAME_STATUS);
        }
    },

    _onUpdateGame: function (params) {
        var players = params.players || (params.allData && params.allData.players),
            waitingPlayers = params.waitingPlayers || (params.allData && params.allData.waitingPlayers),
            bettingValues = params.bettingValues || (params.data && params.data.bettingValues),
            betting,
            currency,
            banker,
            i;
        if (!params.bettingValues || Utils.Type.isArray(bettingValues)) {
            betting = params.betting || (params.data && params.data.betting);
            currency = params.currency || (params.data && params.data.currency);
            // single currency
            this.bettingInfo = {
                betting: betting,
                bettingValues: bettingValues,
                currency: currency
            };
            this.eventDispatchers.local.dispatchEvent(GameManagerConstant.Event.UPDATE_BETTING_VALUES);
        }
        else if (Utils.Type.isObject(bettingValues)) {
            // multiple currencies
            this.bettingInfo = bettingValues;
            this.eventDispatchers.local.dispatchEvent(GameManagerConstant.Event.UPDATE_BETTING_VALUES);
        }

        if (params.banker && params.banker.userName) {
            params.banker.slot = this.visibleSlots;
            if (AuthUser.username === params.banker.userName) {
                this.isMaster = true;
                this.addPlayerFromData(params.banker);
            }
            else {
                banker = params.banker;
            }
        }

        if (players) {
            for (i = 0; i < players.length; i += 1) {
                if (AuthUser.username === (players[i].username || players[i].userName)) {
                    this._onPlayerAdded({
                        player: players[i]
                    });
                    break;
                }
            }
            for (i = 0; i < players.length; i += 1) {
                if (AuthUser.username !== (players[i].username || players[i].userName)) {
                    this._onPlayerAdded({
                        player: players[i]
                    });
                }
            }
        }

        if (waitingPlayers) {
            for (i = 0; i < waitingPlayers.length; i += 1) {
                this._onWaitingPlayerAdded({
                    player: waitingPlayers[i]
                });
            }
        }

        if (banker) {
            this.addPlayerFromData(banker);
        }

        this.fee = params.fee || (params.data && params.data.fee) || 0;
    },

    _onUpdateUserInfo: function (params) {
        if (params) {
            var eventDispatcher, updateMoneyEventName, updateExpEventName;
            if (AuthUser.username === params.username) {
                eventDispatcher = EventDispatcher;
                updateMoneyEventName = EventDispatcherConstant.PROFILE.UPDATE_MONEY;
                updateExpEventName = EventDispatcherConstant.PROFILE.UPDATE_EXP;
            }
            else {
                eventDispatcher = this.eventDispatchers._private;
                updateMoneyEventName = LOCAL_EVENT.UPDATE_USER_MONEY;
                updateExpEventName = LOCAL_EVENT.UPDATE_USER_EXP;
            }

            if (params.field === 'money') {
                eventDispatcher.dispatchEvent(updateMoneyEventName, {
                    username: params.username,
                    currency: params.currency,
                    money: params.value
                });
            }
            else if (params.field === 'expChange') {
                eventDispatcher.dispatchEvent(updateExpEventName, {
                    username: params.username,
                    exp: params.value
                });
            }
        }
    },

    _onUpdateUserMoney: function (params) {
        this._onUpdateUserMoneyByType(params, GameManagerConstant.Event.UPDATE_USER_MONEY);
    },

    _onUpdateUserPrivateMoney: function (params) {
        this._onUpdateUserMoneyByType(params, null);
    },

    _onUpdateUserMoneyByType: function (params, dispatchEventName) {
        if (params) {
            if (!this._updateUserMoneyInCollectionByType(params, this.players, dispatchEventName)) {
                this._updateUserMoneyInCollectionByType(params, this.waitingPlayers, dispatchEventName);
            }
        }
    },

    _updateUserMoneyInCollectionByType: function (params, collection, dispatchEventName) {
        if (collection && params) {
            var player = collection[params.username];
            if (player && player.data && player.data.currency === params.currency) {
                player.setMoney(params.money);
            }
            if (dispatchEventName) {
                this.eventDispatchers.local.dispatchEvent(dispatchEventName, params);
            }
            return true;
        }
        return false;
    },

    _updatePlayersData: function (playersData, collection) {
        var isPlayerList = (collection === this.players),
            addPlayerFn = isPlayerList ? this._onPlayerAdded.bind(this) : this._onWaitingPlayerAdded.bind(this),
            removePlayerFn = isPlayerList ? this._onPlayerRemoved.bind(this) : this._onWaitingPlayerRemoved.bind(this),
            oldPlayerNameList = Object.getOwnPropertyNames(collection),
            newPlayerNameList = [],
            compareResult,
            playerData,
            player,
            i;

        for (i = 0; i < playersData.length; i += 1) {
            playerData = playersData[i];
            if ('userName' in playerData) {
                Utils.Object.replaceProperty(playerData, 'userName', 'username');
            }
            newPlayerNameList.push(playerData.username);
        }

        compareResult = Utils.Set.compare(oldPlayerNameList, newPlayerNameList);

        for (i = 0; i < compareResult.diff12.length; i += 1) {
            removePlayerFn({
                player: Utils.Object.findObject(playersData, 'username', compareResult.diff12[i])
            });
        }

        for (i = 0; i < compareResult.diff21.length; i += 1) {
            if (AuthUser.username === compareResult.diff21[i]) {
                addPlayerFn({
                    player: Utils.Object.findObject(playersData, 'username', compareResult.diff21[i])
                });
            }
        }
        for (i = 0; i < compareResult.diff21.length; i += 1) {
            if (AuthUser.username !== compareResult.diff21[i]) {
                addPlayerFn({
                    player: Utils.Object.findObject(playersData, 'username', compareResult.diff21[i])
                });
            }
        }

        for (i = 0; i < playersData.length; i += 1) {
            playerData = playersData[i];
            if (compareResult.same.indexOf(playerData.username) > -1) {
                player = collection[playerData.username];
                if (player) {
                    player.update(playerData);
                }
            }
        }
    }

});

['info', 'log', 'warn', 'error'].forEach(function (logLevel) {
    BaseGameManager.prototype[logLevel] = (function (logLevel) {
        return function () {
            if (this.logEnabled) {
                cc[logLevel].apply(cc, ['[' + Utils.Date.currentTime() + ']'].concat(Array.prototype.slice.call(arguments)));
            }
        };
    }(logLevel));
});

module.exports = BaseGameManager;
