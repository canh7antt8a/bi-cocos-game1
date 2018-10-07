var Utils = require('Utils'),
    EventDispatcher = require('EventDispatcher'),
    _SFS_DATA_TYPE,
    _dataComposer,
    base,
    misc,
    type;

base = {

    init: function (configData) {
        this.configData = configData;
        this.extensionDispatcher = EventDispatcher.create();
    },

    connect: function (onConnection, onConnectionLost) {
        if (!this.isConnected()) {
            JsbBackend.SmartFox.onConnection(onConnection);
            JsbBackend.SmartFox.onConnectionLost(onConnectionLost);

            JsbBackend.SmartFox.connect(this.configData.host, this.configData.port);
        }
    },

    disconnect: function () {
        if (this.isConnected()) {
            JsbBackend.SmartFox.disconnect();
        }
    },

    isConnected: function () {
        return JsbBackend.SmartFox.isConnected();
    },

    isJoinedInRoom: function (roomId) {
        return JsbBackend.SmartFox.isJoinedInRoom(roomId);
    },

    login: function (username, accessToken, zone, onLogin, onLoginError, onLogout) {
        if (this.isConnected()) {
            JsbBackend.SmartFox.onLogin(onLogin);
            JsbBackend.SmartFox.onLoginError(onLoginError);
            JsbBackend.SmartFox.onLogout(onLogout);

            JsbBackend.SmartFox.onExtensionResponse(function (event) {
                this.extensionDispatcher.dispatchEvent(event.cmd, event);
            }.bind(this));

            zone = zone || this.configData.zone;
            JsbBackend.SmartFox.login(username, accessToken, zone);
        }
    },

    connectAndLogin: function (username, accessToken, zone, onConnection,
        onConnectionLost, onLogin, onLoginError, onLogout) {
        JsbBackend.SmartFox.onConnection(function (event) {
            if (event.success) {
                this.login(username, accessToken, zone, onLogin, onLoginError, onLogout);
            }
        }.bind(this));
        this.connect(onConnection, onConnectionLost);
    },

    logout: function () {
        if (this.isConnected()) {
            JsbBackend.SmartFox.logout();
        }
    },

    sendExtensionRequest: function (extCmd, params, roomId) {
        if (this.isConnected()) {
            JsbBackend.SmartFox.sendExtensionRequest(extCmd, params, roomId);
        }
    },

    addExtensionHandler: function (extName, handler) {
        this.extensionDispatcher.addEventListener(extName, handler);
    },

    removeExtensionHandler: function (extName, handler) {
        this.extensionDispatcher.removeEventListener(extName, handler);
    },

    onJoinRoom: function (onRoomJoinSuccess, onRoomJoinError) {
        JsbBackend.SmartFox.onRoomJoin(onRoomJoinSuccess);
        JsbBackend.SmartFox.onRoomJoinError(onRoomJoinError);
    },

    offJoinRoom: function (onRoomJoinSuccess, onRoomJoinError) {
        JsbBackend.SmartFox.offRoomJoin(onRoomJoinSuccess);
        JsbBackend.SmartFox.offRoomJoinError(onRoomJoinError);
    },

    onLeaveRoom: function (onLeaveRoomSuccess) {
        JsbBackend.SmartFox.onUserExitRoom(onLeaveRoomSuccess);
    },

    offLeaveRoom: function (onLeaveRoomSuccess) {
        JsbBackend.SmartFox.offUserExitRoom(onLeaveRoomSuccess);
    },

    onPublicMessage: function (onPublicMessage) {
        JsbBackend.SmartFox.onPublicMessage(onPublicMessage);
    },

    offPublicMessage: function (onPublicMessage) {
        JsbBackend.SmartFox.offPublicMessage(onPublicMessage);
    },

    joinRoom: function (roomId, password) {
        if (this.isConnected()) {
            JsbBackend.SmartFox.joinRoom(roomId, password);
        }
    },

    leaveRoom: function (roomId) {
        if (this.isConnected()) {
            JsbBackend.SmartFox.leaveRoom(roomId);
        }
    },

    sendPublicMessageRequest: function (message, roomId) {
        if (this.isConnected()) {
            JsbBackend.SmartFox.sendPublicMessageRequest(message, roomId);
        }
    },

    getJoinedRooms: function () {
        if (this.isConnected()) {
            return JsbBackend.SmartFox.getJoinedRooms();
        }
        return [];
    },

    internalCleanResources: function () {
        this.extensionDispatcher.clear();
        JsbBackend.SmartFox.destroy();
    },

};

misc = {
    parseClientDisconnectionReason: function (event) {
        var result = {
            isManual: event.reason === 'manual',
            isKick: event.reason === 'kick',
            isBan: event.reason === 'ban',
            isIdle: event.reason === 'idle',
            isUnknown: event.reason === 'unknown'
        };
        return result;
    }
};

_SFS_DATA_TYPE = {
    NULL: 0,
    BOOL: 1,
    BYTE: 2,
    SHORT: 3,
    INT: 4,
    LONG: 5,
    FLOAT: 6,
    DOUBLE: 7,
    UTF_STRING: 8,
    BOOL_ARRAY: 9,
    BYTE_ARRAY: 10,
    SHORT_ARRAY: 11,
    INT_ARRAY: 12,
    LONG_ARRAY: 13,
    FLOAT_ARRAY: 14,
    DOUBLE_ARRAY: 15,
    UTF_STRING_ARRAY: 16,
    SFS_ARRAY: 17,
    SFS_OBJECT: 18,
};

_dataComposer = {
    composeDataByType: function (type, value) {
        return {
            t: type,
            v: value
        };
    },

    composeDataByTypeFactory: function (type) {
        return function (value) {
            return _dataComposer.composeDataByType(type, value);
        };
    }
};

type = {
    bool: _dataComposer.composeDataByTypeFactory(_SFS_DATA_TYPE.BOOL),
    boolArray: _dataComposer.composeDataByTypeFactory(_SFS_DATA_TYPE.BOOL_ARRAY),

    byte: _dataComposer.composeDataByTypeFactory(_SFS_DATA_TYPE.BYTE),
    byteArray: _dataComposer.composeDataByTypeFactory(_SFS_DATA_TYPE.BYTE_ARRAY),

    short: _dataComposer.composeDataByTypeFactory(_SFS_DATA_TYPE.SHORT),
    shortArray: _dataComposer.composeDataByTypeFactory(_SFS_DATA_TYPE.SHORT_ARRAY),

    int: _dataComposer.composeDataByTypeFactory(_SFS_DATA_TYPE.INT),
    intArray: _dataComposer.composeDataByTypeFactory(_SFS_DATA_TYPE.INT_ARRAY),

    long: _dataComposer.composeDataByTypeFactory(_SFS_DATA_TYPE.LONG),
    longArray: _dataComposer.composeDataByTypeFactory(_SFS_DATA_TYPE.LONG_ARRAY),

    float: _dataComposer.composeDataByTypeFactory(_SFS_DATA_TYPE.FLOAT),
    floatArray: _dataComposer.composeDataByTypeFactory(_SFS_DATA_TYPE.FLOAT_ARRAY),

    double: _dataComposer.composeDataByTypeFactory(_SFS_DATA_TYPE.DOUBLE),
    doubleArray: _dataComposer.composeDataByTypeFactory(_SFS_DATA_TYPE.DOUBLE_ARRAY),

    utfString: _dataComposer.composeDataByTypeFactory(_SFS_DATA_TYPE.UTF_STRING),
    utfStringArray: _dataComposer.composeDataByTypeFactory(_SFS_DATA_TYPE.UTF_STRING_ARRAY),

    sfsObject: _dataComposer.composeDataByTypeFactory(_SFS_DATA_TYPE.SFS_OBJECT),
    sfsArray: _dataComposer.composeDataByTypeFactory(_SFS_DATA_TYPE.SFS_ARRAY),

    getValue: function (value) {
        if (Utils.Type.isObject(value) && Utils.Type.isDefined(value.t) && Utils.Type.isDefined(value.v)) {
            return value.v;
        }
        return value;
    }
};

module.exports = {
    base: base,
    misc: misc,
    type: type
};
