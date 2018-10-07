var GameManager = require('GameManager'),
    SysConfig = require('SysConfig'),
    AudioManager = require('AudioManager'),
    GameConstant = require('GameConstant'),
    CommonConstant = require('CommonConstant'),
    Utils = require('Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        tableNode: cc.Node
    },

    // use this for initialization
    onLoad: function () {
        var isNative = SysConfig.PLATFORM !== 'WEB';
        if (this.tableNode && isNative) {
            var winSize = cc.winSize,
                ratio = winSize.width / winSize.height;
            if (ratio > 1.5) {
                this.tableNode.scale = 1.1;
            }
        }

        if (!this.gameCmd) {
            throw '"gameCmd" must be specified in "properties"';
        }

        try {
            this.gameRuntimeConfigs = GameManager.getGameRuntimeConfigs(this.gameCmd);
            if (this.gameRuntimeConfigs) {
                this.gameManager = this.gameRuntimeConfigs.gameManager;
                if (!this.gameManager) {
                    throw 'Game manager of game whose gameCmd ' + this.gameCmd + ' could not be found';
                }
            }
            else {
                throw 'Game runtime configs of game whose gameCmd ' + this.gameCmd + ' could not be found';
            }

            this.audioManager = new AudioManager({
                effectPlayableFn: function () {
                    return this.node.active;
                }.bind(this)
            });

            this._timeoutList = [];
            this._timeoutMap = {};
            this._intervalList = [];
            this._intervalMap = {};

            this.$onLoadScene();

            this.gameManager.disableEventDispatchersCache();

            cc.game.on(cc.game.EVENT_SHOW, this.$onFocus, this);
            cc.game.on(cc.game.EVENT_HIDE, this.$onLostFocus, this);
        }
        catch (e) {
            cc.error(e);

            var gameConfigs = GameConstant.findByCmd(this.gameCmd);
            if (gameConfigs && !gameConfigs.IS_MINIGAME) {
                // if something went wrong, back to hall, waiting for new scheduling to rejoin games!
                Utils.Director.loadScene(CommonConstant.Scene.HALL, function () {
                    GameManager.scheduleRecheckJoinedRooms(1000);
                });
            }
        }
    },

    onDestroy: function () {
        var key;

        if (this.gameManager) {
            this.gameManager.destroy();
            this.$onDestroyScene();
        }

        if (this.audioManager) {
            this.audioManager.destroy();
        }

        if (this._timeoutList) {
            this._timeoutList.forEach(function (id) {
                clearTimeout(id);
            });
        }

        if (this._intervalList) {
            this._intervalList.forEach(function (id) {
                clearInterval(id);
            });
        }

        if (this._timeoutMap) {
            for (key in this._timeoutMap) {
                clearTimeout(this._timeoutMap[key]);
            }
        }

        if (this._intervalMap) {
            for (key in this._intervalMap) {
                clearInterval(this._intervalMap[key]);
            }
        }

        cc.game.off(cc.game.EVENT_SHOW, this.$onFocus, this);
        cc.game.off(cc.game.EVENT_HIDE, this.$onLostFocus, this);
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        var now = Date.now(),
            gameManager = this.gameManager,
            lastFrameTime = now - dt * 1000,
            newMatchTime = gameManager && gameManager.matchInfo && gameManager.matchInfo.time;
        if (gameManager) {
            gameManager.eventDispatchers.anyCmd.dispatchEvents(function (event) {
                if (event && event.eventName && event.obj && event.time >= 0) {
                    if (!gameManager.isNewMatch(event.obj.matchId) ||
                        (lastFrameTime >= newMatchTime ? false : (lastFrameTime <= event.time && event.time <= newMatchTime))) {
                        if (Utils.Type.isObject(event.obj)) {
                            event.obj.__execInfo__ = {
                                dt: now - event.time
                            };
                        }
                        return true;
                    }
                    return false;
                }
            });
            this.$onUpdate(dt);
        }
    },

    $onLoadScene: function () {
        this.$onLoad();
    },

    $onLoad: function () {

    },

    $onDestroyScene: function () {
        this.$onDestroy();
    },

    $onDestroy: function () {

    },

    // $onUpdate: function (dt) {}
    $onUpdate: function () {

    },

    $onFocus: function () {

    },

    $onLostFocus: function () {

    },

    addTimeout: function (key, id) {
        if (Utils.Type.isUndefined(id)) {
            this._timeoutList.push(key);
        }
        else if (key) {
            clearTimeout(this._timeoutMap[key]);
            this._timeoutMap[key] = id;
        }
        else {
            throw 'Key must be specified';
        }
    },

    addInterval: function (key, id) {
        if (Utils.Type.isUndefined(id)) {
            this._intervalList.push(key);
        }
        else if (key) {
            clearInterval(this._intervalMap[key]);
            this._intervalMap[key] = id;
        }
        else {
            throw 'Key must be specified';
        }
    }
});
