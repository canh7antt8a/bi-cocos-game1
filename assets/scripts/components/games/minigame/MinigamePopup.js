var GameManager = require('GameManager'),
    GameConstant = require('GameConstant'),
    AudioManager = require('AudioManager'),
    CommonConstant = require('CommonConstant'),
    Utils = require('Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        popupNode: cc.Node,
        taixiuTimeLeftLabel: cc.Label
    },

    start: function () {
        this.node.zIndex = CommonConstant.ZINDEX.MINIGAME_POPUP;
    },

    // use this for initialization
    onLoad: function () {
        this.popupNode.on(cc.Node.EventType.TOUCH_END, this.hide, this);
    },

    onDestroy: function () {},

    onEnable: function () {
        this.node.on(cc.Node.EventType.TOUCH_END, this.hide, this);
        this.stopPropagationOnPopupNode = Utils.Node.stopPropagation(this.popupNode);
    },

    onDisable: function () {
        if (this.stopPropagationOnPopupNode) {
            this.stopPropagationOnPopupNode();
            this.stopPropagationOnPopupNode = null;
        }
        this.node.off(cc.Node.EventType.TOUCH_END, this.hide, this);
    },

    // called every frame, uncomment this function to activate update callback
    update: function () {
        this._updateTaiXiu();
    },

    init: function (minigameQuickIcon) {
        this.minigameQuickIcon = minigameQuickIcon;
        this.minigameQuickIconSize = {
            width: minigameQuickIcon.node.width,
            height: minigameQuickIcon.node.height
        };
        this.show();
    },

    show: function () {
        AudioManager.instance.playButtonClick();
        this._correctPositionToShow();

        var currentPosition = cc.v2(0, 0),
            animationTime = 0.2,
            afterAnimationTime = 0.15,
            animation = cc.sequence(
                cc.spawn([
                    cc.scaleTo(animationTime, 1),
                    cc.rotateBy(animationTime, -720),
                    cc.moveTo(animationTime, currentPosition),
                    cc.fadeIn(animationTime)
                ]),
                cc.spawn([
                    cc.scaleTo(afterAnimationTime, 0.8, 1.2),
                    cc.moveBy(afterAnimationTime, 0, 120),
                ]),
                cc.spawn([
                    cc.scaleTo(afterAnimationTime, 1.5, 0.6),
                    cc.moveBy(afterAnimationTime / 2, 0, -120),
                ]),
                cc.scaleTo(animationTime, 1)
            );
        this.popupNode.runAction(animation);
    },

    hide: function () {
        AudioManager.instance.playButtonClick();
        this._correctPositionToHide();

        var targetPosition = this._getMinigameQuickIconPosition(),
            self = this,
            animationTime = 0.2,
            animation = cc.sequence(
                cc.spawn([
                    cc.scaleTo(animationTime, 0),
                    cc.rotateBy(animationTime, 720),
                    cc.moveTo(animationTime, targetPosition),
                    cc.fadeIn(animationTime),
                    cc.callFunc(function () {
                        if (self.minigameQuickIcon) {
                            self.minigameQuickIcon.show();
                        }
                    })
                ]),
                cc.callFunc(function () {
                    self.node.destroy();
                })
            );

        this.popupNode.runAction(animation);
    },

    _correctPositionToShow: function () {
        this.popupNode.stopAllActions();
        this.popupNode.scale = 0;
        this.popupNode.rotation = 0;
        this.popupNode.opacity = 0;
        this.popupNode.position = this._getMinigameQuickIconPosition();
        this.node.active = true;
    },

    _correctPositionToHide: function () {
        this.popupNode.stopAllActions();
        this.popupNode.scale = 1;
        this.popupNode.rotation = 0;
        this.popupNode.opacity = 255;
        this.popupNode.position = cc.v2(0, 0);
        this.node.active = true;
    },

    _getMinigameQuickIconPosition: function () {
        var oldScale = this.popupNode.scale,
            oldPosition = this.popupNode.position,
            targetPosition;

        this.popupNode.active = false;
        this.popupNode.scale = 1;
        this.popupNode.position = cc.v2(0, 0);

        targetPosition = this.popupNode.convertToNodeSpace(this.minigameQuickIcon.node.convertToWorldSpace(cc.v2(0, 0)));
        targetPosition.x = targetPosition.x + this.minigameQuickIconSize.width / 2 - this.popupNode.width / 2;
        targetPosition.y = targetPosition.y + this.minigameQuickIconSize.height / 2 - this.popupNode.height / 2;

        this.popupNode.scale = oldScale;
        this.popupNode.position = oldPosition;
        this.popupNode.active = true;

        return targetPosition;
    },

    _updateTaiXiu: function () {
        this._updateTaiXiuTimeLeft();
    },

    _updateTaiXiuTimeLeft: function () {
        var gameRuntimeConfigs = GameManager.getGameRuntimeConfigs(GameConstant.TAI_XIU.CMD),
            gameManager = gameRuntimeConfigs && gameRuntimeConfigs.gameManager;
        if (gameManager) {
            this.taixiuTimeLeftLabel.string = gameManager.getFormattedCurrentTimeLeft();
        }
    },
});
