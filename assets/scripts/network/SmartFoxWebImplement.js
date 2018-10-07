var SFS2X = require('SFS2X'),
    Utils = require('Utils'),
    EventDispatcher = require('EventDispatcher'),
    base,
    misc,
    type;

base = {

    init: function (configData) {
        this.configData = configData;
        this.sfs = null;
        this.extensionDispatcher = EventDispatcher.create();
    },

    connect: function (onConnection, onConnectionLost) {
        if (!this.isConnected()) {
            this.sfs = new SFS2X.SmartFox(this.configData);

            this.addEventListener(SFS2X.SFSEvent.CONNECTION, onConnection);
            this.addEventListener(SFS2X.SFSEvent.CONNECTION_LOST, onConnectionLost);

            this.sfs.connect();
        }
    },

    disconnect: function () {
        if (this.isConnected()) {
            var self = this;
            this.sfs.getJoinedRooms().forEach(function (room) {
                if (room) {
                    self.leaveRoom(room.id);
                }
            });
            this.sfs.disconnect();
        }
    },

    isConnected: function () {
        if (this.sfs === null || !this.sfs.isConnected()) {
            return false;
        }
        return true;
    },

    login: function (username, accessToken, zone, onLogin, onLoginError, onLogout) {
        if (this.isConnected()) {
            var params = {
                accessToken: accessToken
            };

            this.addEventListener(SFS2X.SFSEvent.LOGIN, onLogin);
            this.addEventListener(SFS2X.SFSEvent.LOGIN_ERROR, onLoginError);
            this.addEventListener(SFS2X.SFSEvent.LOGOUT, onLogout);

            this.addEventListener(SFS2X.SFSEvent.EXTENSION_RESPONSE, function (event) {
                this.extensionDispatcher.dispatchEvent(event.cmd, event);
            }.bind(this));

            zone = zone || this.configData.zone;
            this.sfs.send(new SFS2X.Requests.System.LoginRequest(username, '', params, zone));
        }
    },

    connectAndLogin: function (username, accessToken, zone, onConnection,
        onConnectionLost, onLogin, onLoginError, onLogout) {
        this.connect(onConnection, onConnectionLost);
        if (this.sfs) {
            this.addEventListener(SFS2X.SFSEvent.CONNECTION, function (event) {
                if (event.success) {
                    this.login(username, accessToken, zone, onLogin, onLoginError, onLogout);
                }
            }.bind(this));
        }
    },

    sendExtensionRequest: function (extCmd, params, roomId) {
        if (this.isConnected()) {
            var room = this.sfs.getRoomById(roomId);
            this.sfs.send(new SFS2X.Requests.System.ExtensionRequest(extCmd, params, room));
        }
    },

    addExtensionHandler: function (extName, handler) {
        this.extensionDispatcher.addEventListener(extName, handler);
    },

    removeExtensionHandler: function (extName, handler) {
        this.extensionDispatcher.removeEventListener(extName, handler);
    },

    addEventListener: function (evtType, listener) {
        if (this.sfs && Utils.Type.isFunction(listener)) {
            this.sfs.addEventListener(evtType, listener);
        }
    },

    removeEventListener: function (evtType, listener) {
        if (this.sfs && Utils.Type.isFunction(listener)) {
            this.sfs.removeEventListener(evtType, listener);
        }
    },

    onJoinRoom: function (onRoomJoinSuccess, onRoomJoinError) {
        this.addEventListener(SFS2X.SFSEvent.ROOM_JOIN, onRoomJoinSuccess);
        this.addEventListener(SFS2X.SFSEvent.ROOM_JOIN_ERROR, onRoomJoinError);
    },

    offJoinRoom: function (onRoomJoinSuccess, onRoomJoinError) {
        this.removeEventListener(SFS2X.SFSEvent.ROOM_JOIN, onRoomJoinSuccess);
        this.removeEventListener(SFS2X.SFSEvent.ROOM_JOIN_ERROR, onRoomJoinError);
    },

    onLeaveRoom: function (onLeaveRoomSuccess) {
        this.addEventListener(SFS2X.SFSEvent.USER_EXIT_ROOM, onLeaveRoomSuccess);
    },

    offLeaveRoom: function (onLeaveRoomSuccess) {
        this.removeEventListener(SFS2X.SFSEvent.USER_EXIT_ROOM, onLeaveRoomSuccess);
    },

    onPublicMessage: function (onPublicMessage) {
        this.addEventListener(SFS2X.SFSEvent.PUBLIC_MESSAGE, onPublicMessage);
    },

    offPublicMessage: function (onPublicMessage) {
        this.removeEventListener(SFS2X.SFSEvent.PUBLIC_MESSAGE, onPublicMessage);
    },

    joinRoom: function (roomId, password) {
        if (this.isConnected()) {
            this.sfs.send(new SFS2X.Requests.System.JoinRoomRequest(roomId, password, -1));
        }
    },

    leaveRoom: function (roomId) {
        if (this.isConnected()) {
            var room = this.sfs.getRoomById(roomId);
            if (room) {
                this.sfs.send(new SFS2X.Requests.System.LeaveRoomRequest(room));
            }
        }
    },

    sendPublicMessageRequest: function (message, roomId) {
        if (this.isConnected()) {
            var room = this.sfs.getRoomById(roomId);
            if (room) {
                this.sfs.send(new SFS2X.Requests.System.PublicMessageRequest(message, null, room));
            }
        }
    },

    isJoinedInRoom: function (roomId) {
        if (this.isConnected()) {
            var user = this.sfs.mySelf,
                room = this.sfs.getRoomById(roomId);
            if (user && room) {
                return user.isJoinedInRoom(room);
            }
        }
        return false;
    },

    getJoinedRooms: function () {
        if (this.isConnected()) {
            return this.sfs.getJoinedRooms();
        }
        return [];
    },

    internalCleanResources: function () {
        this.sfs = null;
        this.extensionDispatcher.clear();
    },

};

misc = {
    parseClientDisconnectionReason: function (event) {
        var result = {
            isManual: event.reason === SFS2X.Utils.ClientDisconnectionReason.MANUAL,
            isKick: event.reason === SFS2X.Utils.ClientDisconnectionReason.KICK,
            isBan: event.reason === SFS2X.Utils.ClientDisconnectionReason.BAN,
            isIdle: event.reason === SFS2X.Utils.ClientDisconnectionReason.IDLE,
            isUnknown: event.reason === SFS2X.Utils.ClientDisconnectionReason.UNKNOWN
        };
        return result;
    }
};

function identify(value) {
    return value;
}

type = {
    bool: identify,
    boolArray: identify,

    byte: identify,
    byteArray: identify,

    short: identify,
    shortArray: identify,

    int: identify,
    intArray: identify,

    long: identify,
    longArray: identify,

    float: identify,
    floatArray: identify,

    double: identify,
    doubleArray: identify,

    utfString: identify,
    utfStringArray: identify,

    sfsObject: identify,
    sfsArray: identify,

    getValue: identify
};

module.exports = {
    base: base,
    misc: misc,
    type: type
};
