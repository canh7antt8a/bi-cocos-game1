var Utils = require('Utils'),
    GameConstant = require('GameConstant'),
    NetworkManager = require('NetworkManager'),
    EventDispatcher = require('EventDispatcher'),
    EventDispatcherConstant = require('EventDispatcherConstant'),
    SmartFoxConstant = require('SmartFoxConstant'),
    GameManagerConstant = require('GameManagerConstant'),
    TinhNangManager = require('TinhNangManager'),
    UiManager = require('UiManager'),
    AudioManager = require('AudioManager'),
    PlatformImplement = require('PlatformImplement'),
    CommonConstant = require('CommonConstant'),
    MINIGAME_QUICK_ICON_PREFAB = 'games/minigame/MinigameQuickIcon',
    GameManager;

GameManager = {
    RAW_GAME_LIST: [],
    GAME_LIST: [],
    GAME_GROUP_LIST: [],
    JOIN_GAME_TIMEOUT: 10000,
    RECHECK_JOINED_ROOMS_INTERVAL: 15000,
    RECHECK_JOINED_ROOMS_INITIAL_INTERVAL: 3000,
    MAX_RECHECK_JOINED_ROOMS_TIMES: 4,

    /**
     * ACTIVE_GAMES: {
     *     MINI_GAMES: {
     *         gameId: {
     *             game: {},
     *             room: {},
     *             gameManager: {},
     *             prefab: {}
     *         }
     *     },
     *     MAIN_GAME: {
     *         game: {},
     *         room: {},
     *         gameManager: {},
     *         isSuspending: false
     *     }
     * }
     */
    ACTIVE_GAMES: {
        MINI_GAMES: {},
        MAIN_GAME: null
    },

    JOINING_GAMES: {
        MINI_GAMES: {},
        MAIN_GAME: null
    },

    _init: function () {
        this.timeouts = [];

        EventDispatcher.addEventListener(EventDispatcherConstant.TINH_NANG.NEW, this.onTinhNangNew, this);
        EventDispatcher.addEventListener(EventDispatcherConstant.AUTH.LOGIN, this.onLogin, this);
        EventDispatcher.addEventListener(EventDispatcherConstant.AUTH.LOGOUT, this.onLogout, this);

        EventDispatcher.addEventListener(GameManagerConstant.Event.JOIN_ROOM, this.onJoinRoom, this);
        EventDispatcher.addEventListener(GameManagerConstant.Event.JOIN_ROOM_ERROR, this.onJoinRoomError, this);
        EventDispatcher.addEventListener(GameManagerConstant.Event.LEAVE_ROOM, this.onLeaveRoom, this);
    },

    onTinhNangNew: function () {
        this.onUpdateGameList();
    },

    onLogin: function () {
        var self = this;
        self.getGameList(function (gameListData) {
            self.RAW_GAME_LIST = (gameListData && gameListData.rooms) || [];
            self.onUpdateGameList();

            var currentScene = cc.director.getScene(),
                canvas = currentScene && currentScene.children && currentScene.children[0],
                gameplay = canvas && canvas.getComponent('BaseGameplay');
            if (!gameplay) {
                // go to Hall if user doesn't play any main game
                Utils.Director.loadScene(CommonConstant.Scene.HALL, function () {
                    self._markJoiningMainGame(true, 1000);
                });
            }
        });

        if (!AudioManager.instance.isMusicPlaying()) {
            AudioManager.instance.playMusic();
        }

        this._scheduleRecheckJoinedRoomsTimeoutId = null;
        this._lastRequestPlayGame = 0;
        this._scheduleRecheckJoinedRooms(true, this.RECHECK_JOINED_ROOMS_INITIAL_INTERVAL);

        require('Hall').DISPLAY_SLOT_GAMES = false;

        PlatformImplement.AppEventsLogger.logLoginSuccess();
    },

    onLogout: function () {
        var gameId, configs, miniGamePrefab;
        for (gameId in this.ACTIVE_GAMES.MINI_GAMES) {
            configs = this.ACTIVE_GAMES.MINI_GAMES[gameId];
            miniGamePrefab = configs && configs.prefab;
            if (miniGamePrefab) {
                if (cc.game.isPersistRootNode(miniGamePrefab)) {
                    miniGamePrefab.destroy();
                    cc.game.removePersistRootNode(miniGamePrefab);
                }
            }
        }
        this.ACTIVE_GAMES = {
            MINI_GAMES: {},
            MAIN_GAME: null
        };
        this.JOINING_GAMES = {
            MINI_GAMES: {},
            MAIN_GAME: null
        };
        this.RAW_GAME_LIST = [];
        this.GAME_LIST = [];
        this.GAME_GROUP_LIST = [];

        this.timeouts.forEach(function (timeoutId) {
            clearTimeout(timeoutId);
        });
        this.timeouts = [];

        UiManager.destroyModalByName(MINIGAME_QUICK_ICON_PREFAB);
        AudioManager.instance.stopMusic();
        this._cancelScheduleRecheckJoinedRooms();

        if (!NetworkManager.SmartFox.isReconnecting) {
            PlatformImplement.returnLoginPage();
        }
    },

    onJoinRoom: function (room, options) {
        var self = this,
            game, scene;

        options = options || {};

        // lobby
        if (this.isLobby(room)) {
            game = this.findGameLobbyByRoomId(room.id);
            if (game) {
                scene = (game.CONFIG && game.CONFIG.LOBBY_SCENE) || CommonConstant.Scene.LOBBY;
                if (scene) {
                    this.ACTIVE_GAMES.MAIN_GAME = this._createGameRuntimeConfigs(game, room);
                    require('Hall').DISPLAY_SLOT_GAMES = false;
                    Utils.Director.loadScene(scene, function () {
                        self._markJoiningMainGame(false);
                        self._dispatchJoinGameLobby(game.gameId, false);
                    }, function () {
                        NetworkManager.SmartFox.leaveRoom(room.id);
                    });
                }
            }
        }
        else {
            var gameId = this._parseGameId(room.groupId);
            game = this.findGameById(gameId);
            game = game || {
                CONFIG: GameConstant.findById(gameId) || {}
            };
            if (game) {
                var gameManagerClass = game.CONFIG && game.CONFIG.GAME_MANAGER && Utils.Module.get(game.CONFIG.GAME_MANAGER),
                    gameManager;
                if (gameManagerClass) {
                    gameManager = new gameManagerClass(game, room.id);
                    if (options.rejoin) {
                        gameManager.fetchInitialGameData();
                    }
                    // main game
                    if (!game.CONFIG.IS_MINIGAME) {
                        scene = game.CONFIG && game.CONFIG.SCENE;
                        if (scene) {
                            this.ACTIVE_GAMES.MAIN_GAME = this._createGameRuntimeConfigs(game, room, gameManager);
                            require('Hall').DISPLAY_SLOT_GAMES = false;
                            Utils.Director.loadScene(scene, function () {
                                self.leaveAllGameLobbies();
                                self._markJoiningGame(gameId, false);
                            }, function () {
                                NetworkManager.SmartFox.leaveRoom(room.id);
                            });
                        }
                    }
                    // minigame
                    else {
                        var oldConfigs = this.ACTIVE_GAMES.MINI_GAMES[gameId],
                            newConfigs = this._createGameRuntimeConfigs(game, room, gameManager),
                            prefab;

                        if (oldConfigs && oldConfigs.autoOpen && !oldConfigs.game) {
                            cc.js.mixin(oldConfigs, newConfigs);
                        }
                        else {
                            this.ACTIVE_GAMES.MINI_GAMES[gameId] = newConfigs;
                        }

                        prefab = game && game.CONFIG && game.CONFIG.MINIGAME_PREFAB;
                        if (prefab) {
                            cc.loader.loadRes(prefab, function (err, prefab) {
                                var configs = self.ACTIVE_GAMES.MINI_GAMES[gameId],
                                    newNode;
                                if (configs && !configs.prefab) {
                                    newNode = cc.instantiate(prefab);
                                    newNode.active = false;
                                    cc.game.addPersistRootNode(newNode);
                                    configs.prefab = newNode;
                                    if (configs.autoOpen) {
                                        newNode.active = true;
                                    }
                                    newNode.position = Utils.Screen.getCenterPosition();
                                    self._markJoiningGame(gameId, false);
                                }
                            });
                        }
                    }
                }
            }
        }
    },

    onJoinRoomError: function () {

    },

    onLeaveRoom: function (room) {
        if (this.isLobby(room)) {
            if (this.ACTIVE_GAMES.MAIN_GAME && this.ACTIVE_GAMES.MAIN_GAME.room &&
                this.ACTIVE_GAMES.MAIN_GAME.room.id === room.id) {
                this.ACTIVE_GAMES.MAIN_GAME = null;
            }
        }
        else {
            var gameId = this._parseGameId(room.groupId),
                game = this.findGameById(gameId);
            if (game) {
                if (!game.CONFIG.IS_MINIGAME) {
                    if (this.ACTIVE_GAMES.MAIN_GAME && this.ACTIVE_GAMES.MAIN_GAME.room &&
                        this.ACTIVE_GAMES.MAIN_GAME.room.id === room.id) {
                        this.ACTIVE_GAMES.MAIN_GAME = null;
                    }

                    if (game.CONFIG && game.CONFIG.HAS_LOBBY) {
                        AudioManager.instance.playPlayerLeaveRoom();
                        this.enterGameLobby(gameId);
                    }
                    else {
                        Utils.Director.loadScene(CommonConstant.Scene.HALL);
                    }
                }
                else {
                    var configs = this.ACTIVE_GAMES.MINI_GAMES[gameId],
                        miniGamePrefab = configs && configs.prefab;
                    if (miniGamePrefab && cc.game.isPersistRootNode(miniGamePrefab)) {
                        miniGamePrefab.destroy();
                        cc.game.removePersistRootNode(miniGamePrefab);
                    }
                    delete this.ACTIVE_GAMES.MINI_GAMES[gameId];
                }
            }
        }
    },

    onUpdateGameList: function () {
        var serverGameList = [];
        this.RAW_GAME_LIST.forEach(function (game) {
            if (game && Utils.Type.isDefined(game.gameId) && TinhNangManager.choPhep(game.gameId)) {
                serverGameList.push(game);
            }
        });
        this.filterGameList(serverGameList);

        this.joinDaemonMiniGames();
        this.joinAutoJoinGames();

        if (TinhNangManager.choPhep('cn')) {
            UiManager.openModalByName(MINIGAME_QUICK_ICON_PREFAB, function (newNode) {
                if (!cc.game.isPersistRootNode(newNode)) {
                    cc.game.addPersistRootNode(newNode);
                }
            });
        }
        else {
            UiManager.destroyModalByName(MINIGAME_QUICK_ICON_PREFAB);
        }

        EventDispatcher.dispatchEvent(EventDispatcherConstant.GAME.UPDATE_LIST);
    },

    _parseGameId: function (gameId) {
        try {
            gameId = parseInt(gameId, 10);
        }
        catch (e) {}
        return gameId;
    },

    _createGameRuntimeConfigs: function (game, room, gameManager) {
        return {
            game: game,
            room: room,
            gameManager: gameManager
        };
    },

    getGameRuntimeConfigs: function (cmd) {
        if (!cmd) {
            return;
        }

        var configs = this.ACTIVE_GAMES.MAIN_GAME,
            miniGameConfigs = this.ACTIVE_GAMES.MINI_GAMES,
            gameId;
        if (this._isCorrectGameRuntimeConfigs(configs, cmd)) {
            return configs;
        }
        for (gameId in miniGameConfigs) {
            configs = miniGameConfigs[gameId];
            if (this._isCorrectGameRuntimeConfigs(configs, cmd)) {
                return configs;
            }
        }
        return null;
    },

    _isCorrectGameRuntimeConfigs: function (configs, cmd) {
        if (configs && configs.game && configs.game.CONFIG && configs.game.CONFIG.CMD === cmd) {
            return true;
        }
        return false;
    },

    getLobbyGameRuntimeConfigs: function () {
        var configs = this.ACTIVE_GAMES.MAIN_GAME;
        if (configs && !configs.gameManager) {
            return configs;
        }
        return null;
    },

    markMiniGameAutoOpen: function (gameId) {
        this.ACTIVE_GAMES.MINI_GAMES[gameId] = {
            autoOpen: true
        };
    },

    filterGameList: function (serverGameList) {
        var groups = {},
            game, gameId, gameConfigs, gameGroup, gameGroupTmp, scene, i;

        this.GAME_LIST = [];
        for (i = 0; i < serverGameList.length; i += 1) {
            game = serverGameList[i];
            gameId = this._parseGameId(game.gameId);
            gameConfigs = GameConstant.findById(gameId) || {};
            game.CONFIG = gameConfigs;
            if (!('isSolo' in game)) {
                game.isSolo = !!game.gameCode && /.+Solo$/.test(game.gameCode);
            }
            gameConfigs.IS_SOLO = game.isSolo;
            gameConfigs.IS_MINIGAME = game.isMiniGame;
            gameConfigs.NAME = game.name;

            // grouping
            groups[game.scene] = groups[game.scene] || [];
            groups[game.scene].push(game);
        }

        for (scene in groups) {
            gameGroupTmp = [];
            gameGroup = groups[scene];
            gameConfigs = null;
            gameGroup.forEach(function (game) {
                if (!gameConfigs && !Utils.Object.isEmpty(game.CONFIG)) {
                    gameConfigs = game.CONFIG;
                }
            });
            gameGroup.forEach(function (game) {
                if (gameConfigs && Utils.Object.isEmpty(game.CONFIG)) {
                    game.CONFIG = gameConfigs;
                }
                if (this.isAvailableGameToDisplay(game)) {
                    gameGroupTmp.push(game);
                    this.GAME_LIST.push(game);
                }
            }.bind(this));
            groups[scene] = gameGroupTmp;
        }

        groups = Utils.Object.values(groups);
        groups.sort(function (g1, g2) {
            return this._findMaxGamePriorityInGroup(g1) - this._findMaxGamePriorityInGroup(g2);
        }.bind(this));
        this.GAME_GROUP_LIST = groups;
    },

    _findMaxGamePriorityInGroup: function (group) {
        var max = -1,
            i;
        for (i = 0; i < group.length; i += 1) {
            max = Math.max(max, group[i].priority);
        }
        return max;
    },

    findGameById: function (gameId) {
        return Utils.Object.findObject(this.GAME_LIST, 'gameId', gameId);
    },

    findGameLobbyByRoomId: function (roomId) {
        return Utils.Object.findObject(this.GAME_LIST, 'id', roomId);
    },

    isLobby: function (room) {
        if (room && room.groupId === GameConstant.LOBBY.NAME) {
            return true;
        }
        return false;
    },

    isAvailableGame: function (gameId) {
        var game = this.findGameById(gameId);
        return game && game.CONFIG && game.CONFIG.CMD &&
            game.CONFIG.GAME_MANAGER && Utils.Module.get(game.CONFIG.GAME_MANAGER) &&
            TinhNangManager.choPhep(gameId);
    },

    isAvailableGameToDisplay: function (game) {
        return this.isSmartFoxGame(game) || this.isPopupOrWebViewGame(game);
    },

    isSmartFoxGame: function (game) {
        return game && game.CONFIG && game.CONFIG.CMD &&
            game.CONFIG.GAME_MANAGER && Utils.Module.get(game.CONFIG.GAME_MANAGER);
    },

    isPopupOrWebViewGame: function (game) {
        return game && ((game.CONFIG && game.CONFIG.ID && !game.CONFIG.CMD) || game.webview_url);
    },

    _isJoiningMainGame: function () {
        var status = this.JOINING_GAMES.MAIN_GAME;
        return status && status.isJoining;
    },

    _isJoiningMiniGame: function (gameId) {
        var status = this.JOINING_GAMES.MINI_GAMES[gameId];
        return status && status.isJoining;
    },

    _isJoiningGame: function (gameId) {
        var game = this.findGameById(gameId);
        if (game && game.CONFIG) {
            if (game.CONFIG.IS_MINIGAME) {
                return this._isJoiningMiniGame(gameId);
            }
            else {
                return this._isJoiningMainGame();
            }
        }
        return false;
    },

    _markJoiningMainGame: function (isJoining, timeoutIfIsJoining) {
        var id = Math.random() + '.' + Date.now(),
            self = this;
        if (isJoining) {
            if (!Utils.Type.isNumber(timeoutIfIsJoining)) {
                timeoutIfIsJoining = self.JOIN_GAME_TIMEOUT;
            }
            self.JOINING_GAMES.MAIN_GAME = {
                isJoining: isJoining,
                id: id
            };
            self.timeouts.push(setTimeout(function () {
                var status = self.JOINING_GAMES.MAIN_GAME;
                if (status && status.id === id) {
                    status.isJoining = false;
                }
            }, timeoutIfIsJoining));
        }
        else {
            self.timeouts.push(setTimeout(function () {
                self.JOINING_GAMES.MAIN_GAME = {
                    isJoining: isJoining,
                    id: id
                };
            }, 300));
        }
    },

    _markJoiningMiniGame: function (gameId, isJoining, timeoutIfIsJoining) {
        var id = Math.random() + '.' + Date.now(),
            self = this;
        if (isJoining) {
            if (!Utils.Type.isNumber(timeoutIfIsJoining)) {
                timeoutIfIsJoining = self.JOIN_GAME_TIMEOUT;
            }
            self.JOINING_GAMES.MINI_GAMES[gameId] = {
                isJoining: isJoining,
                id: id
            };
            self.timeouts.push(setTimeout(function () {
                var status = self.JOINING_GAMES.MINI_GAMES[gameId];
                if (status && status.id === id) {
                    status.isJoining = false;
                }
            }, timeoutIfIsJoining));
        }
        else {
            self.timeouts.push(setTimeout(function () {
                self.JOINING_GAMES.MINI_GAMES[gameId] = {
                    isJoining: isJoining,
                    id: id
                };
            }, 300));
        }
    },

    _markJoiningGame: function (gameId, isJoining, timeoutIfIsJoining) {
        var game = this.findGameById(gameId);
        if (game && game.CONFIG) {
            if (game.CONFIG.IS_MINIGAME) {
                this._markJoiningMiniGame(gameId, isJoining, timeoutIfIsJoining);
            }
            else {
                this._markJoiningMainGame(isJoining, timeoutIfIsJoining);
            }
            this._dispatchJoinGame(gameId, isJoining);
        }
    },

    _dispatchJoinGameLobby: function (gameId, isJoining) {
        var game = this.findGameById(gameId);
        if (game && game.CONFIG) {
            EventDispatcher.dispatchEvent(GameManagerConstant.Event.JOIN_GAME_LOBBY, {
                gameId: gameId,
                gameCmd: game.CONFIG.CMD,
                isJoining: isJoining
            });
        }
    },

    _dispatchJoinGame: function (gameId, isJoining) {
        var game = this.findGameById(gameId);
        if (game && game.CONFIG) {
            EventDispatcher.dispatchEvent(GameManagerConstant.Event.JOIN_GAME, {
                gameId: gameId,
                gameCmd: game.CONFIG.CMD,
                isJoining: isJoining
            });
        }
    },

    _cancelScheduleRecheckJoinedRooms: function () {
        if (this._scheduleRecheckJoinedRoomsTimeoutId) {
            clearTimeout(this._scheduleRecheckJoinedRoomsTimeoutId);
            this._scheduleRecheckJoinedRoomsTimeoutId = null;
        }
    },

    // schedule immediately after delayTime ms
    scheduleRecheckJoinedRooms: function (delayTime) {
        this._cancelScheduleRecheckJoinedRooms();
        this._scheduleRecheckJoinedRooms(false, delayTime);
    },

    // append scheduling
    _scheduleRecheckJoinedRooms: function (tryToPlay, delayTime) {
        var self = this;
        if (this._scheduleRecheckJoinedRoomsTimeoutId) {
            return;
        }

        if (tryToPlay) {
            this._lastRequestPlayGame = Date.now();
        }
        this._scheduleRecheckJoinedRoomsTimeoutId = setTimeout(function () {
            self._recheckJoinedRooms();
        }, delayTime || this.RECHECK_JOINED_ROOMS_INTERVAL);
    },

    _recheckJoinedRooms: function () {
        var currentScene = Utils.Director.getCurrentSceneName(),
            joinedRooms = NetworkManager.SmartFox.getJoinedRooms().slice(),
            playMainGame = false,
            self = this,
            i;

        for (i = 0; i < joinedRooms.length; i += 1) {
            var room = joinedRooms[i],
                configs,
                r;

            // check main game
            configs = self.ACTIVE_GAMES.MAIN_GAME;
            r = configs && configs.room;
            if (r && r.id === room.id) {
                if (!self.isLobby(room)) {
                    playMainGame = true;
                    break;
                }
            }
        }

        joinedRooms.forEach(function (room) {
            var gameId = self._parseGameId(room.groupId),
                configs,
                game,
                r;

            // check main game
            configs = self.ACTIVE_GAMES.MAIN_GAME;
            r = configs && configs.room;
            if (r && r.id === room.id) {
                if (configs.isSuspending) {
                    // is suspending
                    return;
                }
                else if (self.isLobby(room)) {
                    var lobbyScene = (configs.game && configs.game.CONFIG && configs.game.CONFIG.LOBBY_SCENE) || CommonConstant.Scene.LOBBY;
                    if (currentScene === lobbyScene) {
                        // already in lobby
                        return;
                    }
                    else if (playMainGame) {
                        // is playing main game, don't need to enter lobby
                        return;
                    }
                }
                else {
                    game = self.findGameById(gameId);
                    if (game && game.CONFIG && game.CONFIG.SCENE && currentScene === game.CONFIG.SCENE) {
                        // already in game scene
                        return;
                    }
                }
            }

            // check minigame
            configs = self.ACTIVE_GAMES.MINI_GAMES && self.ACTIVE_GAMES.MINI_GAMES[gameId];
            r = configs && configs.room;
            if (r && r.id === room.id) {
                return;
            }

            // rejoin
            self.onJoinRoom(room, {
                rejoin: true
            });
        });

        // last main game was lost
        if (!playMainGame && GameConstant.isGameScene(currentScene)) {
            Utils.Director.loadScene(CommonConstant.Scene.HALL);
        }

        this._scheduleRecheckJoinedRoomsTimeoutId = null;
        if (Date.now() - this._lastRequestPlayGame < this.RECHECK_JOINED_ROOMS_INTERVAL * this.MAX_RECHECK_JOINED_ROOMS_TIMES) {
            this._scheduleRecheckJoinedRooms();
        }
    },

    /**
     * Get game list.
     *
     * @param  {Function} callback    callback when get game list success, with argument is event of extension response
     */
    getGameList: function (callback) {
        NetworkManager.SmartFox.sendGlobalEndpoint({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.GET_GAME_LIST.ID)
        }, callback);
    },

    /**
     * Get betting values by currency of a game.
     *
     * @param  {Number}   gameId      game id
     * @param  {Function} callback    callback when get success, with argument is event of extension response
     */
    getBettingValues: function (gameId, callback) {
        NetworkManager.SmartFox.sendGlobalEndpoint({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.GET_BETTING_VALUES.ID),
            gameId: NetworkManager.SmartFox.type.int(gameId)
        }, callback);
    },

    /**
     * Get all room list of a game. Use this method restrictly.
     *
     * @param  {Number}   gameId      game id
     * @param  {Function} callback    callback when get success, with argument is event of extension response
     */
    getGameRoomList: function (gameId, callback) {
        NetworkManager.SmartFox.sendGlobalEndpoint({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.GET_GAME_ROOM_LIST.ID),
            gameId: NetworkManager.SmartFox.type.int(gameId)
        }, callback);
    },

    /**
     * Create a game.
     *
     * @param  {Number}   gameId      game id
     * @param  {Object}   gameConfigs game configs, common data: currency, isSolo, betting
     * @param  {Function} callback    callback when create game success, with argument is event of extension response
     */
    createGame: function (gameId, gameConfigs, callback) {
        if (!this.isAvailableGame(gameId)) {
            return;
        }

        if (this._isJoiningGame(gameId)) {
            return;
        }

        this._markJoiningGame(gameId, true);
        var self = this,
            handler = function (event) {
                var params = (event && event.params) || {};
                if (params.result === 0) {
                    self._markJoiningGame(gameId, false);
                }
                if (Utils.Type.isFunction(callback)) {
                    callback();
                }
            };

        NetworkManager.SmartFox.sendGlobalEndpoint({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.CREATE_GAME.ID),
            gameId: NetworkManager.SmartFox.type.int(gameId),
            gameConfigs: NetworkManager.SmartFox.type.sfsObject(gameConfigs)
        }, handler);

        this._scheduleRecheckJoinedRooms(true);
    },

    /**
     * Enter a game.
     *
     * @param  {Number}   gameId      game id
     * @param  {Object}   gameConfigs game configs, common data: currency, isSolo, betting
     * @param  {Function} callback    callback when enter game success, with argument is event of extension response
     */
    enterGame: function (gameId, gameConfigs, callback) {
        if (!this.isAvailableGame(gameId)) {
            return;
        }

        if (this._isJoiningGame(gameId)) {
            return;
        }

        this._markJoiningGame(gameId, true);
        var self = this,
            handler = function (event) {
                if (event && event.result === 0) {
                    self._markJoiningGame(gameId, false);
                }
                if (Utils.Type.isFunction(callback)) {
                    callback();
                }
            };

        NetworkManager.SmartFox.sendGlobalEndpoint({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.ENTER_GAME.ID),
            gameId: NetworkManager.SmartFox.type.int(gameId),
            gameConfigs: NetworkManager.SmartFox.type.sfsObject(gameConfigs)
        }, handler);

        this._scheduleRecheckJoinedRooms(true);
    },

    /**
     * Try to play a game with corresponding action based on its config.
     * - Mini game:
     *   + Daemon game: join room
     *   + Normal game: create game
     * - Main game:
     *   + Has lobby: join lobby room
     *   + Has no lobby: create game
     *
     * @param  {Object} game game object
     */
    playGame: function (game) {
        if (game && game.CONFIG) {
            var gameId = game.CONFIG.ID;

            if (this._isJoiningGame(gameId)) {
                return;
            }

            // minigame
            if (game.CONFIG.IS_MINIGAME && game.CONFIG && game.CONFIG.CMD) {
                var miniGameData = this.getGameRuntimeConfigs(game.CONFIG.CMD),
                    prefab = miniGameData && miniGameData.prefab,
                    scene = cc.director.getScene();
                // minigame is created
                if (prefab) {
                    if (!prefab.isChildOf(scene)) {
                        scene.addChild(prefab);
                    }
                    prefab.active = true;
                    prefab.position = Utils.Screen.getCenterPosition();
                }
                else {
                    this.markMiniGameAutoOpen(gameId);

                    // create new one
                    if (!game.isDaemonRoom) {
                        this.createGame(gameId);
                    }
                    // join daemon room
                    else {
                        this.joinDaemonMiniGame(gameId);
                    }
                }
            }
            // main game
            else if (game.CONFIG) {
                // enter lobby
                if (game.CONFIG.HAS_LOBBY) {
                    this.enterGameLobby(gameId);
                }
                // create game directly
                else {
                    this.createGame(gameId);
                }
            }
        }
    },

    joinDaemonMiniGames: function () {
        var game, i;
        for (i = 0; i < this.GAME_LIST.length; i += 1) {
            game = this.GAME_LIST[i];
            this.joinDaemonMiniGame(game.gameId);
        }
    },

    joinDaemonMiniGame: function (gameId) {
        if (!this.isAvailableGame(gameId)) {
            return;
        }

        if (this._isJoiningGame(gameId)) {
            return;
        }

        var game = this.findGameById(gameId),
            self = this;
        if (game.isDaemonRoom && game.id > 0) {
            this.getGameRoomList(game.gameId, function (gameRoomListData) {
                var rooms = gameRoomListData.rooms || [],
                    roomId;
                if (rooms.length > 0) {
                    roomId = rooms[0].id;
                    if (roomId > 0 && !NetworkManager.SmartFox.isJoinedInRoom(roomId)) {
                        self._markJoiningGame(gameId, true);
                        NetworkManager.SmartFox.joinRoom(roomId);
                        self._scheduleRecheckJoinedRooms(true);
                    }
                }
            });
        }
    },

    joinAutoJoinGames: function () {
        var self = this;
        self.GAME_LIST.forEach(function (game) {
            var gameId = game.gameId;

            if (!self.isAvailableGame(gameId)) {
                return;
            }

            if (self._isJoiningGame(gameId)) {
                return;
            }

            if (game.CONFIG && game.CONFIG.AUTO_JOIN) {
                if (game.HAS_LOBBY) {
                    self.enterGameLobby(gameId);
                }
                else {
                    var joinedRooms = NetworkManager.SmartFox.getJoinedRooms().slice(),
                        isJoinedSameGame = false,
                        room,
                        i;
                    for (i = 0; i < joinedRooms.length; i += 1) {
                        room = joinedRooms[i];
                        if (self._parseGameId(room.groupId) === gameId) {
                            isJoinedSameGame = true;
                        }
                    }
                    if (!isJoinedSameGame) {
                        self.playGame(game);
                    }
                }
            }
        });
    },

    enterGameLobby: function (gameId) {
        if (!this.isAvailableGame(gameId)) {
            return;
        }

        if (this._isJoiningMainGame()) {
            return;
        }

        this._markJoiningMainGame(true);
        this._dispatchJoinGameLobby(gameId, true);

        var game = this.findGameById(gameId);
        if (game) {
            NetworkManager.SmartFox.joinRoom(game.id);
            this._scheduleRecheckJoinedRooms(true);
        }
    },

    leaveAllGameLobbies: function () {
        var self = this;
        NetworkManager.SmartFox.getJoinedRooms().forEach(function (room) {
            if (self.isLobby(room)) {
                NetworkManager.SmartFox.leaveRoom(room.id);
            }
        });
    }
};

GameManager._init();

module.exports = GameManager;
