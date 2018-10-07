var CommonConstant = require('CommonConstant'),
    NetworkManager = require('NetworkManager'),
    Utils = require('Utils'),
    GameConstant = require('GameConstant'),
    Url = require('Url'),
    JarInfo = require('JarInfo'),
    EventDispatcher = require('EventDispatcher');

cc.Class({
    extends: cc.Component,

    properties: {
        huIcon: cc.Node,
        content: cc.Node,
        huListBackground: cc.Node,
        imgDen1: cc.Node,
        imgDen2: cc.Node,
        jarItemPrefab: cc.Prefab,
        gameJarItem: cc.Prefab
    },

    start: function () {
        if (cc.sys.isBrowser) {
            this.node.zIndex = CommonConstant.ZINDEX.MINIGAME_QUICK_ICON;
        }
    },

    // use this for initialization
    onLoad: function () {
        var self = this;
        this.jarItemList = [];
        this.isLoaded = false;
        this.isMove = false;
        this.huIcon.runAction(cc.repeatForever(
            cc.sequence(
                cc.spawn(cc.fadeTo(0.5, 0), cc.scaleTo(0.5, 1.05)),
                cc.spawn(cc.fadeTo(1, 150), cc.scaleTo(1, 1.15)))
        ));
        this.huIcon.parent.runAction(cc.repeatForever(
            cc.sequence(
                cc.skewTo(0.1, 8, -8),
                cc.skewTo(0.1, -8, 8),
                cc.skewTo(0.1, 15, -15),
                cc.skewTo(0.1, -15, 15),
                cc.skewTo(0.1, 0, 0),
                cc.delayTime(0.5))
        ));

        this.node.on(cc.Node.EventType.TOUCH_START, function () {
            self.time = Date.now();
        });

        this.node.on(cc.Node.EventType.TOUCH_MOVE, function () {
            if (self.time - Date.now() < -100) {
                self.isMove = true;
            }
        });

        this.node.on(cc.Node.EventType.TOUCH_END, function () {
            self.onClick();
        });

        this.node.on(cc.Node.EventType.TOUCH_CANCEL, function () {
            self.onClick();
        });

        this.getGameJarInfo();
        this.initCountDownTimeRequest();
        this.effectLight();
        this.showContent();
        EventDispatcher.addEventListener(JarInfo.eventName, this.setJar, this);
    },

    initCountDownTimeRequest: function () {
        var INTERVAL = 900000;
        this._countDownTimeRequest = setInterval(function () {
            this.getGameJarInfo();
            this.clearCountDownTimeRequest();
        }.bind(this), INTERVAL);

    },

    clearCountDownTimeRequest: function () {
        clearInterval(this._countDownTimeRequest);
        this._countDownTimeRequest = null;
        this.initCountDownTimeRequest();
    },

    setJar: function (game) {
        game.gameid = 0;
        // cc.log(game.gameid + '  ' + game.money);
    },

    getGameJarInfo: function () {
        if (this._countDownTimeRequest) {
            clearInterval(this._countDownTimeRequest);
            this._countDownTimeRequest = null;
        }
        var self = this;
        NetworkManager.Http.fetch('GET', Url.Http.GET_GAME_JAR_INFO, {}, {
            cache: 900,
            delay: 500
        }).success(function (results) {
            if (results) {
                if (!self.isValid) {
                    return;
                }
                self.content.removeAllChildren();
                for (var i = 0; i < results.data.length; i += 1) {
                    var data = results.data[i];
                    JarInfo.data[data.gameid] = data;
                    if (self.isLoaded) {
                        var itemNode = cc.instantiate(self.gameJarItem);
                        var gameJarItem = itemNode.getComponent('GameJarItem');
                        gameJarItem.lblGameName.string = data.name;
                        gameJarItem.logo.spriteFrame = GameConstant.getIconSpriteFrame(GameConstant.findById(data.gameid).ICON);
                        for (var att in data.jars) {
                            var money = data.jars[att];
                            var jarItemNode = cc.instantiate(self.jarItemPrefab);
                            var jarItem = jarItemNode.getComponent('JarItem');
                            jarItem.money = money;
                            jarItem.lblBet.string = !isNaN(att) ? Utils.Number.abbreviate(att) : att;
                            jarItem._initEffect();
                            self.jarItemList.push(jarItem);
                            gameJarItem.listJar.addChild(jarItemNode);
                        }

                        itemNode.enabled = true;
                        self.content.addChild(itemNode);
                    }
                }
            }
        });
    },

    onClick: function () {
        if (this.isMove === false) {
            JarInfo.active = !JarInfo.active;
            this.showContent();
        }
        this.isMove = false;
    },

    showContent: function () {
        this.huListBackground.active = JarInfo.active;
        if (this.huListBackground.active) {
            if (this.isLoaded) {
                this.huListBackground.scaleY = 0;
                this.huListBackground.runAction(cc.scaleTo(0.2, 1, 1));
                for (var i = 0; i < this.jarItemList.length; i += 1) {
                    this.jarItemList[i]._effectUpdateMoney();
                }
            }
            else {
                this.isLoaded = true;
                this.getGameJarInfo();
            }
        }
        else {
            this.huListBackground.scaleY = 1;
            this.huListBackground.runAction(cc.scaleTo(0.2, 1, 0));
            for (var j = 0; j < this.jarItemList.length; j += 1) {
                this.jarItemList[j].clearEffectUpdateMoneyQuy();
            }
        }
    },

    onDestroy: function () {
        JarInfo.active = false;
        // this.node.destroy();
        if (this._countDownTimeRequest) {
            clearInterval(this._countDownTimeRequest);
            this._countDownTimeRequest = null;
        }
        EventDispatcher.removeEventListener(JarInfo.eventName, this.setJar, this);
    },

    effectLight: function () {
        // Den nhap nhay
        this.imgDen1.opacity = 255;
        this.imgDen2.opacity = 0;
        this.imgDen1.stopAllActions();
        this.imgDen2.stopAllActions();
        var action = cc.repeatForever(cc.sequence(cc.fadeIn(0), cc.delayTime(0.2), cc.fadeOut(0), cc.delayTime(0.2)));
        var action1 = cc.repeatForever(cc.sequence(cc.fadeOut(0), cc.delayTime(0.2), cc.fadeIn(0), cc.delayTime(0.2)));
        this.imgDen1.runAction(action1);
        this.imgDen2.runAction(action);
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
