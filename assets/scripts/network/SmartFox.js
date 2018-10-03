var Utils = require('Utils'),
    UiManager = require('UiManager'),
    AuthUser = require('AuthUser'),
    PlatformImplement = require('PlatformImplement'),
    EventDispatcher = require('EventDispatcher'),
    EventDispatcherConstant = require('EventDispatcherConstant'),
    CommonConstant = require('CommonConstant'),
    GameManagerConstant = require('GameManagerConstant'),
    SmartFoxConstant = require('SmartFoxConstant'),
    WARNING_MESSAGE_DURATION = 5000,
    RECONNECT_DELAY = 2000,
    MAX_RETRIES = 8;

module.exports = {

    // ============================================================
    // Connect - Auth - Event/Extension API
    // ============================================================

    init: function (configData) {
        if (configData && configData.port) {
            configData.port = parseInt(configData.port, 10);
        }

        this.implement = require('SmartFoxNativeImplement');

        // for web testing
        if (cc.sys.isBrowser) {
            this.implement = require('SmartFoxWebImplement');
        }

        this.implement.base.init(configData);
        this.type = this.implement.type;

        this.pingIntervalId = null;
        this.duplicateLogin = false;

        this._cancelScheduleReconnect();
        this.scheduleReconnectTimeoutId = null;
        this.retries = 0;
        this.isReconnecting = false;

        this.defaultEventHandlers = {
            onConnection: function (event) {
                if (!event.success) {
                    if (!this._scheduleReconnect()) {
                        this._cancelScheduleReconnect();
                        if (AuthUser.username) {
                            PlatformImplement.displayLogoutMessage('Mất kết nối với máy chủ');
                        }
                        else {
                            UiManager.openModal('Kết nối với máy chủ thất bại');
                        }
                    }

                    this._cleanResources();
                    EventDispatcher.dispatchEvent(EventDispatcherConstant.AUTH.LOGOUT);
                }
                else {
                    this.addExtensionHandler(SmartFoxConstant.Command.EMPTY.NAME, function (event) {
                        var params = event && event.params,
                            messageType;
                        if (params) {
                            // push message
                            if (params.command === SmartFoxConstant.Command.PUSH_MESSAGE.ID) {
                                if ('displayType' in params) {
                                    Utils.Object.replaceProperty(params, 'displayType', 'messageType');
                                }

                                messageType = CommonConstant.PushMessageType.findById(params.messageType);
                                if (messageType) {
                                    if (messageType === CommonConstant.PushMessageType.POPUP ||
                                        messageType === CommonConstant.PushMessageType.RUNNING) {
                                        if (params.content) {
                                            params.content = CommonConstant.CurrencyType.normalize(params.content);
                                        }
                                    }
                                    EventDispatcher.dispatchEvent(messageType.EVENT, params);
                                }
                            }
                        }
                    });

                    this.addExtensionHandler(SmartFoxConstant.Command.IPLAY.NAME, function (event) {
                        var params = event && event.params;
                        if (params) {
                            // update user money
                            if (params.command === SmartFoxConstant.Command.UPDATE_USER_INFO.ID) {
                                EventDispatcher.dispatchEvent(EventDispatcherConstant.PROFILE.UPDATE_MONEY, {
                                    username: AuthUser.username,
                                    currency: params.currency,
                                    money: params.money
                                });
                            }
                            // duplicate login
                            else if (params.command === SmartFoxConstant.Command.DUPLICATE_LOGIN.ID) {
                                this.duplicateLogin = true;
                            }
                        }
                    }.bind(this));
                }
            }.bind(this),

            onConnectionLost: function (event) {
                var reason = this.implement.misc.parseClientDisconnectionReason(event),
                    username = AuthUser.username;
                if (username && reason.isUnknown) {
                    if (this.duplicateLogin) {
                        PlatformImplement.displayLogoutMessage('Tài khoản "' + username + '" của bạn đã được đăng nhập trên thiết bị khác');
                    }
                    else if (this.retries <= 0) {
                        this.retries = MAX_RETRIES;
                        if (!this._scheduleReconnect()) {
                            this._cancelScheduleReconnect();
                            PlatformImplement.displayLogoutMessage('Mất kết nối với máy chủ');
                        }
                    }
                }
                else if (!reason.isManual) {
                    PlatformImplement.displayLogoutMessage('Mất kết nối với máy chủ');
                }

                this._cleanResources();
                EventDispatcher.dispatchEvent(EventDispatcherConstant.AUTH.LOGOUT);
            }.bind(this),

            onLogin: function () {
                this._cancelScheduleReconnect();
                this._schedulePing();
                this.onJoinRoom(
                    function (event) {
                        EventDispatcher.dispatchEvent(GameManagerConstant.Event.JOIN_ROOM, event.room);
                    },
                    function (event) {
                        UiManager.openModal(event.errorMessage);
                        EventDispatcher.dispatchEvent(GameManagerConstant.Event.JOIN_ROOM_ERROR, event);
                    }
                );
                this.onLeaveRoom(function (event) {
                    var user = event.user;
                    if (user.isItMe) {
                        EventDispatcher.dispatchEvent(GameManagerConstant.Event.LEAVE_ROOM, event.room);
                    }
                });
                EventDispatcher.dispatchEvent(EventDispatcherConstant.AUTH.LOGIN);
            }.bind(this),

            onLoginError: function (event) {
                this._cancelScheduleReconnect();
                this._cleanResources();
                UiManager.openModal(event.errorMessage);
                EventDispatcher.dispatchEvent(EventDispatcherConstant.AUTH.LOGOUT);
            }.bind(this),

            onLogout: function () {
                this._cancelScheduleReconnect();
                this.disconnect();
            }.bind(this)
        };

        this.globalEndpointCmdHandlerRegistered = {};
    },

    connectAndLogin: function (username, accessToken, zone) {
        this.implement.base.connectAndLogin(username, accessToken, zone,
            this.defaultEventHandlers.onConnection,
            this.defaultEventHandlers.onConnectionLost,
            this.defaultEventHandlers.onLogin,
            this.defaultEventHandlers.onLoginError,
            this.defaultEventHandlers.onLogout
        );
    },

    disconnect: function () {
        this.implement.base.disconnect();
    },

    isConnected: function () {
        return this.implement.base.isConnected();
    },

    sendExtensionRequest: function (extCmd, params, roomId) {
        this.implement.base.sendExtensionRequest(extCmd, this.type.sfsObject(params), roomId);
    },

    addExtensionHandler: function (extName, handler) {
        this.implement.base.addExtensionHandler(extName, handler);
    },

    removeExtensionHandler: function (extName, handler) {
        this.implement.base.removeExtensionHandler(extName, handler);
    },

    onJoinRoom: function (onRoomJoinSuccess, onRoomJoinError) {
        this.implement.base.onJoinRoom(onRoomJoinSuccess, onRoomJoinError);
    },

    offJoinRoom: function (onRoomJoinSuccess, onRoomJoinError) {
        this.implement.base.offJoinRoom(onRoomJoinSuccess, onRoomJoinError);
    },

    onLeaveRoom: function (onLeaveRoomSuccess) {
        this.implement.base.onLeaveRoom(onLeaveRoomSuccess);
    },

    offLeaveRoom: function (onLeaveRoomSuccess) {
        this.implement.base.offLeaveRoom(onLeaveRoomSuccess);
    },

    joinRoom: function (roomId, password) {
        this.implement.base.joinRoom(roomId, password);
    },

    leaveRoom: function (roomId) {
        this.implement.base.leaveRoom(roomId);
    },

    sendPublicMessageRequest: function (message, roomId) {
        if (Utils.Type.isString(message)) {
            message = message.trim();
            if (message.length > 0) {
                if (message.length > 80) {
                    message = message.substring(0, 80);
                }
                this.implement.base.sendPublicMessageRequest(message, roomId);
            }
        }
    },

    onPublicMessage: function (onPublicMessage) {
        this.implement.base.onPublicMessage(onPublicMessage);
    },

    offPublicMessage: function (onPublicMessage) {
        this.implement.base.offPublicMessage(onPublicMessage);
    },

    sendGlobalEndpoint: function (params, callback) {
        var cmdId = this.type.getValue(params.command),
            cmd,
            handler;

        if (Utils.Type.isNumber(cmdId)) {
            cmd = SmartFoxConstant.Command.findById(cmdId);
            if (cmd) {
                if (this._markGlobalEndpointCmdHandlerRegistered(cmd.NAME)) {
                    this.addExtensionHandler(cmd.NAME, function (event) {
                        var params = (event && event.params) || {};
                        if (params.result === 0) {
                            UiManager.openModal(params.message);
                        }
                    });
                }

                if (Utils.Type.isFunction(callback)) {
                    handler = function (event) {
                        var params = (event && event.params) || {};
                        this.removeExtensionHandler(cmd.NAME, handler);
                        callback(params);
                    }.bind(this);
                    this.addExtensionHandler(cmd.NAME, handler);
                }
            }
        }

        this.sendExtensionRequest(SmartFoxConstant.Command.GLOBAL_ENDPOINT.NAME, params, null);
    },

    getUserIdleTime: function (callback) {
        this.sendGlobalEndpoint({
            command: this.type.byte(SmartFoxConstant.Command.GET_USER_IDLE_TIME.ID)
        }, callback);
    },

    isJoinedInRoom: function (roomId) {
        return this.implement.base.isJoinedInRoom(roomId);
    },

    getJoinedRooms: function () {
        return this.implement.base.getJoinedRooms();
    },

    _markGlobalEndpointCmdHandlerRegistered: (function () {
        var EXCLUSIVE_COMMANDS = [SmartFoxConstant.Command.PING.NAME];

        return function (cmdName) {
            var success = false;
            if (EXCLUSIVE_COMMANDS.indexOf(cmdName) === -1 && !this.globalEndpointCmdHandlerRegistered[cmdName]) {
                this.globalEndpointCmdHandlerRegistered[cmdName] = true;
                success = true;
            }
            return success;
        };
    }()),

    _schedulePingByInterval: function (interval) {
        this._cancelPing();
        this.pingIntervalId = setInterval(function () {
            if (this.implement.base.isConnected()) {
                this.sendGlobalEndpoint({
                    command: this.type.byte(SmartFoxConstant.Command.PING.ID)
                });
            }
            else {
                this._cancelPing();
            }
        }.bind(this), interval);
    },

    _schedulePing: function () {
        var self = this;
        this.getUserIdleTime(function (params) {
            var time = params && params.time;
            if (time > 0) {
                time *= 1000;
                time /= 2.1;
                self._schedulePingByInterval(time);
            }
        });
    },

    _cancelPing: function () {
        if (this.pingIntervalId) {
            clearInterval(this.pingIntervalId);
            this.pingIntervalId = null;
        }
    },

    _scheduleReconnect: function () {
        var username = AuthUser.username,
            accessToken = AuthUser.accesstoken,
            self = this;

        if (username && accessToken && self.retries > 0) {
            self.retries -= 1;
            self.isReconnecting = true;
            UiManager.openWarningMessage('Mất kết nối với máy chủ, đang kết nối lại...', WARNING_MESSAGE_DURATION / 1000, true);
            this.scheduleReconnectTimeoutId = setTimeout(function () {
                self.connectAndLogin(username, accessToken);
            }, RECONNECT_DELAY);
            return true;
        }

        self.isReconnecting = false;
        return false;
    },

    _cancelScheduleReconnect: function () {
        if (this.scheduleReconnectTimeoutId) {
            clearTimeout(this.scheduleReconnectTimeoutId);
            this.scheduleReconnectTimeoutId = null;
        }
        this.retries = 0;
        this.isReconnecting = false;
    },

    _cleanResources: function () {
        this._cancelPing();
        this.duplicateLogin = false;
        this.implement.base.internalCleanResources();
    }

};
