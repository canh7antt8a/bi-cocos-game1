var BaseGameManager = require('BaseGameManager'),
    SmartFoxConstant = require('SmartFoxConstant'),
    TaiXiuConstant = require('TaiXiuConstant'),
    NetworkManager = require('NetworkManager'),
    Utils = require('Utils'),
    TaiXiuGameManager;

TaiXiuGameManager = Utils.Class({

    $$extends: BaseGameManager,

    $$constructor: function (game, roomId) {
        this.$super.constructor.call(this, game, roomId);

        this.DELAYED_COMMANDS = [
            SmartFoxConstant.Command.MESSAGE.ID,
        ];

        this.idleTime = -1;
        this.pingIntervalTime = -1;
        this.pingIntervalId = null;
        this.pingEnabled = false;
        this.lastPingTime = -1;
        this.history = [];
        this._setGameState(TaiXiuConstant.GameState.NONE);
        this._reinitDataEachRound();

        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.UPDATE_GAME.ID, this.onUpdateGame, this);
        this.eventDispatchers.anyCmd.addEventListener(SmartFoxConstant.Command.FINISH_GAME.ID, this.onFinishGame, this);

        this.eventDispatchers.playCmd.addEventListener(TaiXiuConstant.Action.BETTING, this.onBettingSuccess, this);
        this.eventDispatchers.playCmd.addEventListener(TaiXiuConstant.Action.UPDATE_POTS, this.onUpdatePots, this);
        this.eventDispatchers.playCmd.addEventListener(TaiXiuConstant.Action.CHANGE_STATE, this.onChangeState, this);
    },

    startGame: function () {
        this._reinitDataEachRound();
    },

    destroy: function () {
        this.$super.destroy.call(this);
        this._cancelPing();
    },

    _reinitDataEachRound: function () {
        this.bettingTimeLeft = 0;
        this.pots = {};
        this.current.bettingInfo = {};
        this.current.tempBettingInfo = {};
    },

    // ============================================================
    // Send API
    // ============================================================

    bet: function (pot, betting, currency) {
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(TaiXiuConstant.Action.BETTING),
            pot: NetworkManager.SmartFox.type.byte(pot),
            money: NetworkManager.SmartFox.type.long(betting),
            currency: NetworkManager.SmartFox.type.utfString(currency)
        });
    },

    enablePing: function () {
        this.pingEnabled = true;
        this._schedulePing();
    },

    disablePing: function () {
        this.pingEnabled = false;
        this._cancelPing();
    },

    _isEagerToPing: function () {
        return this.lastPingTime < 0 || (Date.now() - this.lastPingTime >= this.pingIntervalTime);
    },

    _ping: function () {
        this.lastPingTime = Date.now();
        this.send({
            command: NetworkManager.SmartFox.type.byte(SmartFoxConstant.Command.PLAY.ID),
            action: NetworkManager.SmartFox.type.byte(TaiXiuConstant.Action.PING)
        });
    },

    _schedulePing: function () {
        if (!this.pingIntervalId && this.pingIntervalTime > 0 && this.pingEnabled) {
            this.pingIntervalId = Utils.Scheduler.setInterval(this._ping.bind(this),
                this.pingIntervalTime, this._isEagerToPing());
        }
    },

    _cancelPing: function () {
        if (this.pingIntervalId) {
            clearInterval(this.pingIntervalId);
            this.pingIntervalId = null;
        }
    },

    // ============================================================
    // Receive API
    // ============================================================

    onUpdateGame: function (params) {
        this.idleTime = params.idleTime;
        if (this.idleTime > 0) {
            this.pingIntervalTime = this.idleTime / 2.5;
            this._schedulePing();
        }

        if (params.potsList) {
            this.pots = params.potsList;
        }

        if (params.gameState === TaiXiuConstant.GameState.PLAYER_BETTING && params.time >= 0) {
            this.bettingTimeLeft = Math.max(Date.now() + params.time - ((params.__execInfo__ && params.__execInfo__.dt) || 0), 0);
        }
        else if (params.gameState === TaiXiuConstant.GameState.FINISH && params.time >= 0) {
            this.waitingForNewGameTimeLeft = Math.max(Date.now() + params.time - ((params.__execInfo__ && params.__execInfo__.dt) || 0), 0);
        }
        this._setGameState(params.gameState);
    },

    onBettingSuccess: function (params) {
        if (this.isCurrentPlayer(params.username)) {
            this.current.bettingInfo[params.currency] = this.current.bettingInfo[params.currency] || {};
            this.current.bettingInfo[params.currency][params.pot] = this.current.bettingInfo[params.currency][params.pot] || 0;
            this.current.bettingInfo[params.currency][params.pot] += params.money;
            this.eventDispatchers.local.dispatchEvent(TaiXiuConstant.Event.BETTING_SUCCESS);
        }
    },

    onUpdatePots: function (params) {
        this.bettingTimeLeft = Math.max(Date.now() + params.time - ((params.__execInfo__ && params.__execInfo__.dt) || 0), 0);
        cc.js.mixin(this.pots, params.potsList);
        this.eventDispatchers.local.dispatchEvent(TaiXiuConstant.Event.UPDATE_POTS);
    },

    onChangeState: function (params) {
        cc.js.mixin(this.pots, params.potsList);
        this._setGameState(params.gameState);
        switch (this.gameState) {
        case TaiXiuConstant.GameState.EFFECT:
            this.eventDispatchers.local.dispatchEvent(TaiXiuConstant.Event.EFFECT_STATE, params);
            break;

        case TaiXiuConstant.GameState.PLAYER_BETTING:
            this.bettingTimeLeft = Math.max(Date.now() + params.time - ((params.__execInfo__ && params.__execInfo__.dt) || 0), 0);
            this.eventDispatchers.local.dispatchEvent(TaiXiuConstant.Event.PLAYER_BETTING_STATE);
            break;
        }
    },

    onFinishGame: function (params) {
        this._setGameState(TaiXiuConstant.GameState.FINISH);

        // save history
        if (this.isCurrentPlayer(params.player) && !Utils.Object.isEmpty(this.current.bettingInfo)) {
            var potWin = params.potWin && params.potWin[0],
                currency, potBettingMap, historyItem;
            if (Utils.Type.isNumber(potWin)) {
                for (currency in this.current.bettingInfo) {
                    potBettingMap = this.current.bettingInfo[currency];
                    historyItem = {
                        time: Utils.Date.currentTime(),
                        potWin: potWin,
                        potBettingMap: potBettingMap,
                        currency: currency,
                        moneyExchange: params.player[currency].moneyExchange
                    };
                    this.history.unshift(historyItem);
                }
            }
        }

        this.waitingForNewGameTimeLeft = Math.max(Date.now() + params.time - ((params.__execInfo__ && params.__execInfo__.dt) || 0), 0);

        this.eventDispatchers.local.dispatchEvent(TaiXiuConstant.Event.FINISH, params);
    },

    _setGameState: function (newGameState) {
        if (this.gameState !== newGameState) {
            this.gameState = newGameState;
            this.eventDispatchers.local.dispatchEvent(TaiXiuConstant.Event.CHANGE_STATE);
        }
    },

    // ============================================================
    // Action API
    // ============================================================

    addTempBetting: function (pot, betting, currency) {
        if (this.current.tempBettingInfo.pot !== pot ||
            this.current.tempBettingInfo.currency !== currency) {
            this.current.tempBettingInfo = {
                pot: pot,
                currency: currency,
                betting: 0
            };
        }
        this.current.tempBettingInfo.betting += betting;
        this.eventDispatchers.local.dispatchEvent(TaiXiuConstant.Event.UPDATE_TEMP_BETTING);
    },

    cancelTempBetting: function () {
        this.current.tempBettingInfo = {};
        this.eventDispatchers.local.dispatchEvent(TaiXiuConstant.Event.UPDATE_TEMP_BETTING);
    },

    acceptTempBetting: function () {
        if (this.current.tempBettingInfo.currency &&
            this.current.tempBettingInfo.betting > 0 &&
            this.current.tempBettingInfo.pot >= 0) {
            this.bet(this.current.tempBettingInfo.pot,
                this.current.tempBettingInfo.betting,
                this.current.tempBettingInfo.currency);
        }
        this.current.tempBettingInfo = {};
        this.eventDispatchers.local.dispatchEvent(TaiXiuConstant.Event.UPDATE_TEMP_BETTING);
    },

    getFormattedBettingTimeLeft: function () {
        return this._formatTime(((this.bettingTimeLeft - Date.now()) / 1000));
    },

    getFormattedWaitingForNewGameTimeLeft: function () {
        return this._formatTime(((this.waitingForNewGameTimeLeft - Date.now()) / 1000));
    },

    getFormattedCurrentTimeLeft: function () {
        var time = '00:00';
        if (this.gameState === TaiXiuConstant.GameState.PLAYER_BETTING) {
            time = this.getFormattedBettingTimeLeft();
        }
        else if (this.gameState === TaiXiuConstant.GameState.FINISH) {
            time = this.getFormattedWaitingForNewGameTimeLeft();
        }
        return time;
    },

    _formatTime: function (elapsedTime) {
        if (elapsedTime >= 0) {
            elapsedTime = Math.floor(elapsedTime);
            var mins = Math.floor(elapsedTime / 60),
                seconds = elapsedTime % 60;
            return Utils.Number.fillZero(mins, 2) + ':' + Utils.Number.fillZero(seconds, 2);
        }
        return '00:00';
    },

    getStateLabel: function () {
        var label = '';
        if (this.gameState === TaiXiuConstant.GameState.PLAYER_BETTING) {
            label = TaiXiuConstant.GameStateName.BETTING;
        }
        else if (this.gameState === TaiXiuConstant.GameState.FINISH) {
            label = TaiXiuConstant.GameStateName.FINISH;
        }
        return label;
    }

});

module.exports = TaiXiuGameManager;
