var Utils = require('Utils'),
    AuthUser = require('AuthUser'),
    EventDispatcher = require('EventDispatcher'),
    PlayerConstant = require('PlayerConstant'),
    Player;

Player = Utils.Class({
    $$constructor: function (playerData) {
        if (!Utils.Type.isObject(playerData)) {
            throw 'Cannot create a player with non-object data';
        }
        this.data = playerData;
        this.eventDispatcher = EventDispatcher.create();
    },

    $$static: {
        fromAuthUser: function (currency) {
            if (AuthUser.username && currency) {
                var playerData = {
                    username: AuthUser.username,
                    displayName: AuthUser.display_name,
                    avatar: AuthUser.avatar,
                    currency: currency,
                    money: AuthUser.currencies[currency].balance
                };
                return new Player(playerData);
            }

            return null;
        },
    },

    isMe: function (playerData) {
        if (playerData) {
            return this.data.username === playerData.username;
        }

        if (this.data) {
            return this.data.username === AuthUser.username;
        }

        return false;
    },

    update: function (playerData) {
        if (this.isMe(playerData)) {
            this.setMoney(playerData.money);
            cc.js.mixin(this.data, playerData);
        }
    },

    setMoney: function (newMoney) {
        if (this.data.money !== newMoney) {
            this.data.money = newMoney;
            this.eventDispatcher.dispatchEvent(PlayerConstant.Event.UPDATE_MONEY);
        }
    }
});

module.exports = Player;
