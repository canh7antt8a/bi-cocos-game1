var UrlImage = require('UrlImage'),
    Utils = require('Utils'),
    PlayerConstant = require('PlayerConstant');

cc.Class({
    extends: cc.Component,

    properties: {
        emptyNode: cc.Node,
        nonEmptyNode: cc.Node,

        // effects: [win, draw, lose]
        defaultEffectTemplatesPrefab: cc.Prefab,
        effectTemplateNodeList: {
            'default': [],
            type: cc.Node
        },
        backEffectListNode: cc.Node,
        frontEffectListNode: cc.Node,

        countDownContainerNode: cc.Node,
        countDownSprite: cc.Sprite,

        avatarImage: UrlImage,
        usernameLabel: cc.Label,
        balanceLabel: cc.Label,

        chatCalloutDuration: 5000,

        normalUsernameColor: cc.Color,
        mainUsernameColor: cc.Color,

        normalCountDownColor: new cc.Color(0, 255, 0, 255),
    },

    // use this for initialization
    onLoad: function () {
        // resize some nodes
        this.usernameLabel.node.scale *= 1.12;
        this.balanceLabel.node.scale *= 1.12;

        this.TIME_EFFECT_MONEY_EXCHANGE = 3;
        this.TIME_EFFECT_MONEY_EXCHANGE_FADE_OUT = 0.3;
        this.moneyExchangeAction = cc.spawn(
            cc.moveBy(this.TIME_EFFECT_MONEY_EXCHANGE, cc.p(0, 90)),
            cc.sequence(
                cc.delayTime(this.TIME_EFFECT_MONEY_EXCHANGE - this.TIME_EFFECT_MONEY_EXCHANGE_FADE_OUT),
                cc.fadeTo(this.TIME_EFFECT_MONEY_EXCHANGE_FADE_OUT, 0)
            )
        );
        this.moneyExchangeAction.easing(cc.easeQuadraticActionOut());

        // Chat Node
        this._initChatCallout();
    },

    onDestroy: function () {
        this.clearCountDown();
        this.clearChatMessage();
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    /**
     * Set player.
     *
     * @param {Player} player player object, if null, remove player
     */
    setPlayer: function (player) {
        if (this.player === player) {
            return;
        }

        this.setUpCountdownNode();

        this.player = player;
        if (this.player && this.player.data) {
            this.emptyNode.active = false;
            this.nonEmptyNode.active = true;

            if (this.player.data.avatar) {
                var widget = this.avatarImage.node.getComponent(cc.Widget);
                widget.isAlignOnce = false;
                this.avatarImage.loadImage(this.player.data.avatar);
            }

            this.usernameLabel.node.color = this.player.isMe() ? this.mainUsernameColor : this.normalUsernameColor;
            this.usernameLabel.string = this.player.data.displayName || this.player.data.username;

            this.onUpdateUserMoney();

            this.player.eventDispatcher.addEventListener(PlayerConstant.Event.UPDATE_MONEY, this.onUpdateUserMoney, this);
        }
        else {
            this.removePlayer();
        }
    },

    /**
     * Remove player.
     */
    removePlayer: function () {
        if (this.player) {
            this.player.eventDispatcher.removeEventListener(PlayerConstant.Event.UPDATE_MONEY, this.onUpdateUserMoney, this);
            this.player = null;
        }

        this.emptyNode.active = true;
        this.nonEmptyNode.active = false;
        this.clearEffects();
    },

    /**
     * Remove player.
     */
    setUpCountdownNode: function () {
        this.bgTimeCountDownNode = this.countDownContainerNode.getChildByName('BgTimeCountDown');
        this.countDownSprite.node.width = 163;
        this.countDownSprite.node.height = 163;
        this.starNode = this.countDownContainerNode.getChildByName('ImgLapLanh');
        this.starImage = this.starNode.getChildByName('Img');
        this.starImage.setPositionY(80);
    },


    /**
     * Set effect by index.
     *
     * @param {Number}  effectIndex   effect index
     * @param {Boolean} bringToFront  effect will be over balance label
     */
    setEffect: function (effectIndex, bringToFront) {
        this.clearEffects();
        this.addEffect(effectIndex, bringToFront);
    },

    /**
     * Add effect by index.
     *
     * @param {Number}  effectIndex   effect index
     * @param {Boolean} bringToFront  effect will be over balance label
     */
    addEffect: function (effectIndex, bringToFront) {
        this._addEffect(this.effectTemplateNodeList[effectIndex], bringToFront);
    },

    /**
     * Remove effect by index.
     *
     * @param {Number}  effectIndex effect index
     */
    removeEffect: function (effectIndex) {
        var effectTemplate = this.effectTemplateNodeList[effectIndex],
            uuid = effectTemplate && effectTemplate.uuid;
        if (uuid) {
            this._removeEffect(uuid);
        }
    },

    /**
     * Clear all effects.
     */
    clearEffects: function () {
        this.backEffectListNode.removeAllChildren();
        this.frontEffectListNode.removeAllChildren();
    },

    /**
     * Set time left count down.
     *
     * @param {Number} timeLeft time left amount in ms
     */
    setCountDown: function (timeLeft) {
        if (timeLeft > 0 && this.player) {
            this.clearCountDown();
            this.countDownContainerNode.active = true;
            this.bgTimeCountDownNode.color = this.normalCountDownColor;
            this.countDownSprite.node.color = this.normalCountDownColor;
            this.countDownSprite.fillRange = 1;
            this.starNode.rotation = 0;
            this.starNode.active = true;
            this._stopTimestamp = Date.now() + timeLeft;
            this.countTime = 0;
            var INTERVAL = 25;
            this._countDownIntervalId = setInterval(function () {
                var t = this._stopTimestamp - Date.now();
                var color = this.countDownSprite.node.color;

                if (t >= 0) {
                    if (color.r < 255) {
                        color.r = 2 * (1 - t / timeLeft) * 255;
                        color.r = color.r > 255 ? 255 : color.r;
                        // this.bgTimeCountDownNode.color = color;
                        this.countDownSprite.node.color = color;
                    }
                    else {
                        color.g = (2 * t / timeLeft) * 255;
                        color.g = color.g < 0 ? 0 : color.g;
                        // this.bgTimeCountDownNode.color = color;
                        this.countDownSprite.node.color = color;
                    }
                    this.starImage.setScale(1);
                    this.starNode.rotation = (1 - t / timeLeft) * 360;
                    this.countTime += (1 - t / timeLeft);
                    if (this.countTime >= 2) {
                        this.starImage.runAction(cc.scaleTo(0.1, 0.5));
                        this.countTime = 0;
                    }
                    this.countDownSprite.fillRange = t / timeLeft;
                }
                else {
                    this.clearCountDown();
                }
            }.bind(this), INTERVAL);
        }
    },

    /**
     * Clear count down effect.
     */
    clearCountDown: function () {
        if (this._countDownIntervalId) {
            clearInterval(this._countDownIntervalId);
            this._countDownIntervalId = null;
            this.countDownSprite.fillRange = 0;
            this.countDownContainerNode.active = false;
        }
    },

    /**
     * Set chat callout message.
     *
     * @param {String} msg chat message
     */
    setChatMessage: function (msg) {
        if (this.chatCalloutDuration > 0 && this.player) {
            var maxLength = 82;
            if (msg.length > maxLength) {
                msg = msg.substring(0, maxLength) + '...';
            }
            this._initChatCallout();
            this.clearChatMessage();
            this.chatCalloutNode.active = true;
            this.chatCalloutNode.getComponentInChildren(cc.Label).string = msg;
            // Fix Bug Cocos Creator 1.3.1
            this.chatCalloutNode.getComponent(cc.Layout).resizeMode = cc.Layout.ResizeMode.CONTAINER;



            // Action
            this.chatCalloutNode.scale = 0;
            this.chatCalloutNode.runAction(cc.sequence(cc.scaleTo(0.1, this.chatCalloutNodeScale.x, this.chatCalloutNodeScale.y), cc.callFunc(function () {
                // Check y + height
                this.chatCalloutNode.y = 50;
                var size = cc.winSize;
                var wolrdPos = this.chatCalloutNode.convertToWorldSpaceAR(cc.v2());
                if (wolrdPos.y > size.height - this.chatCalloutNode.height) {
                    this.chatCalloutNode.y = 5;
                }
            }.bind(this))));
            this._chatIntervalId = setTimeout(function () {
                this.clearChatMessage();
            }.bind(this), this.chatCalloutDuration);
        }
    },

    /**
     * Clear chat callout message.
     */
    clearChatMessage: function () {
        if (this._chatIntervalId) {
            clearInterval(this._chatIntervalId);
            this._chatIntervalId = null;
            this.chatCalloutNode.active = false;
        }
    },

    onUpdateUserMoney: function () {
        if (this.player) {
            this.balanceLabel.string = Utils.Number.abbreviate(this.player.data.money);
        }
    },

    // ============================================================
    // Default effects
    // ============================================================

    setFinishEffect: function (money) {
        if (money > 0) {
            this.setWinEffect(money);
        }
        else if (money < 0) {
            this.setLoseEffect(money);
        }
        else {
            this.setDrawEffect();
        }
    },

    setWinEffect: function (money) {
        if (money > 0) {
            this.clearEffects();

            var node = this._addEffect(this._getDefaultEffectTemplateByName('Win'), true),
                winMoneyLabel;
            if (node) {
                winMoneyLabel = node.getComponentInChildren(cc.Label);
                if (winMoneyLabel) {
                    winMoneyLabel.node.zIndex = 10;
                    winMoneyLabel.string = '+' + Utils.Number.abbreviate(money);
                    var x = this.node.x > 0 ? -90 : 90;
                    var y = 30;
                    winMoneyLabel.node.position = new cc.Vec2(x, y);
                    winMoneyLabel.node.stopAllActions();
                    if (this.moneyExchangeAction) {
                        winMoneyLabel.node.runAction(this.moneyExchangeAction);
                    }
                }
            }
        }
    },

    setDrawEffect: function () {
        this.clearEffects();
        this._addEffect(this._getDefaultEffectTemplateByName('Draw'));
    },

    setLoseEffect: function (money) {
        if (money < 0) {
            this.clearEffects();

            var node = this._addEffect(this._getDefaultEffectTemplateByName('Lose')),
                loseMoneyLabel;
            if (node) {
                loseMoneyLabel = node.getComponentInChildren(cc.Label);
                if (loseMoneyLabel) {
                    loseMoneyLabel.node.zIndex = 10;
                    loseMoneyLabel.string = Utils.Number.abbreviate(money);
                    var x = this.node.x > 0 ? -90 : 90;
                    var y = 30;
                    loseMoneyLabel.node.position = new cc.Vec2(x, y);
                    loseMoneyLabel.node.stopAllActions();
                    if (this.moneyExchangeAction) {
                        loseMoneyLabel.node.runAction(this.moneyExchangeAction);
                    }
                }
            }
        }
    },

    removeWinEffect: function () {
        this._removeDefaultEffectByName('Win');
    },

    removeDrawEffect: function () {
        this._removeDefaultEffectByName('Draw');
    },

    removeLoseEffect: function () {
        this._removeDefaultEffectByName('Lose');
    },

    _removeDefaultEffectByName: function (effectName) {
        var effectTemplate = this._getDefaultEffectTemplateByName(effectName),
            uuid = effectTemplate && effectTemplate.uuid;
        if (uuid) {
            this._removeEffect(uuid);
        }
    },

    _getDefaultEffectTemplateByName: function (effectName) {
        if (!this.defaultEffectTemplatesNode) {
            this.defaultEffectTemplatesNode = cc.instantiate(this.defaultEffectTemplatesPrefab);
        }
        return this.defaultEffectTemplatesNode.getChildByName(effectName);
    },

    _addEffect: function (effectTemplate, bringToFront) {
        if (effectTemplate) {
            var node = cc.instantiate(effectTemplate);
            node.active = true;
            node._effectTemplateUUID = effectTemplate.uuid;
            (bringToFront ? this.frontEffectListNode : this.backEffectListNode).addChild(node);
            return node;
        }
        return null;
    },

    _removeEffect: function (effectTemplateUUID) {
        this._removeEffectFrom(this.backEffectListNode, effectTemplateUUID);
        this._removeEffectFrom(this.frontEffectListNode, effectTemplateUUID);
    },

    _removeEffectFrom: function (effectListNode, effectTemplateUUID) {
        var children = effectListNode.getChildren();
        Utils.Array.forEach(children, function (child) {
            if (child._effectTemplateUUID === effectTemplateUUID) {
                effectListNode.removeChild(child);
            }
        }.bind(this));
    },

    _initChatCallout: function () {
        if (!this.chatCalloutNode) {
            cc.loader.loadRes('games/ui/player/PlayerChat', function (err, prefab) {
                this.chatCalloutNode = cc.instantiate(prefab);
                this.node.addChild(this.chatCalloutNode);

                // Reset Position
                if (this.node.x > 0) {
                    this.chatCalloutNode.x = -200;
                    this.chatCalloutNode.scaleX = 1;
                    this.chatCalloutNode.getComponentInChildren(cc.Label).node.scaleX = 1;
                }
                else {
                    this.chatCalloutNode.x = 200;
                    this.chatCalloutNode.scaleX = -1;
                    this.chatCalloutNode.getComponentInChildren(cc.Label).node.scaleX = -1;
                }

                // Get Scale
                this.chatCalloutNodeScale = {
                    x: this.chatCalloutNode.scaleX,
                    y: this.chatCalloutNode.scaleY
                };

                // Scale To 0
                this.chatCalloutNode.scale = 0;
            }.bind(this));
        }
    },

});
