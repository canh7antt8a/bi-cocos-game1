var GameManager = require('GameManager'),
    Utils = require('Utils'),
    TopPanelSlot = require('TopPanelSlot'),
    AuthUser = require('AuthUser'),
    MyNhanConstant = require('MyNhanConstant'),
    EventDispatcherConstant = require('EventDispatcherConstant'),
    CommonConstant = require('CommonConstant'),
    Slot777Constant = require('Slot777Constant'),
    EventDispatcher = require('EventDispatcher'),
    GameItemSlotInGame = require('GameItemSlotInGame'),
    Hall = require('Hall');

cc.Class({
    extends: cc.Component,

    properties: {
        gameItemList: {
            default: [],
            type: GameItemSlotInGame
        },
        txtMoney: cc.Label,
        topPanel: TopPanelSlot
    },

    onLoad: function () {
        Hall.DISPLAY_SLOT_GAMES = true;

        cc.director.getScene().autoReleaseAssets = !cc.sys.isBrowser;
        this.txtMoney.string = Utils.Number.format(AuthUser.currencies[CommonConstant.CurrencyType.Ip.NAME].balance);
        this.topPanel.getButtonHistory().active = false;

        // Game Config
        var gameConfigs = GameManager.getLobbyGameRuntimeConfigs();
        if (!gameConfigs) {
            return;
        }

        gameConfigs.isSuspending = false;
        this.game = gameConfigs.game;
        this.room = gameConfigs.room;
        this.topPanel.room = this.room;
        this.topPanel.setGamePlay(this.game);

        Slot777Constant.GameJoining = false;
        GameManager.getBettingValues(this.game.gameId, function (response) {
            if (!this.isValid) {
                return;
            }
            var bettingValuesByCurrencies = response.bettingValues,
                bettingList,
                bettingFreeList,
                i;
            if (bettingValuesByCurrencies) {
                for (i = 0; i < bettingValuesByCurrencies.length; i += 1) {
                    if (bettingValuesByCurrencies[i].currency === CommonConstant.CurrencyType.Ip.NAME) {
                        bettingList = bettingValuesByCurrencies[i].bettingValues;
                    }
                    else if (bettingValuesByCurrencies[i].currency === CommonConstant.CurrencyType.Xu.NAME) {
                        bettingFreeList = bettingValuesByCurrencies[i].bettingValues;
                    }
                }
                MyNhanConstant.BettingList = [];
                MyNhanConstant.BettingFreeList = [];
                for (i = 0; i < this.gameItemList.length; i += 1) {
                    var gameItem = this.gameItemList[i];
                    var betting = bettingList[i];
                    gameItem.setData(this.game, betting, i);
                }
                for (i = 0; i < bettingFreeList.length; i += 1) {
                    MyNhanConstant.BettingFreeList.push(bettingFreeList[i].value);
                }
            }
        }.bind(this));

        EventDispatcher.addEventListener(EventDispatcherConstant.PROFILE.UPDATE_MONEY, this.updateUserMoney, this);
    },

    updateUserMoney: function (params) {
        var money = params.money;
        if (this.txtMoney && money && params.currency === CommonConstant.CurrencyType.Ip.NAME) {
            this.txtMoney.string = Utils.Number.format(money);
        }
    },

});
