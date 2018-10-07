var UiManager = require('UiManager'),
    GameManager = require('GameManager'),
    GameConstant = require('GameConstant'),
    EventDispatcher = require('EventDispatcher'),
    EventDispatcherConstant = require('EventDispatcherConstant'),
    TinhNangManager = require('TinhNangManager'),
    CommonConstant = require('CommonConstant'),
    Utils = require('Utils'),
    MINIGAME_POPUP_PREFAB = 'games/minigame/MinigamePopup',
    ACTIVE_OPACITY = 255,
    IDLE_OPACITY = 255 * 0.75,
    IDLE_TIMEOUT = 2000,
    SMALL_MOVE_DISTANCE = 50,
    BOUNDARY_PADDING = 10,
    MINIGAME_QUICK_ICON_POSITION_KEY = 'minigame_icon_pos';

cc.Class({
    extends: cc.Component,

    properties: {
        taixiuTimeLeftNode: cc.Node,
        taixiuTimeLeftLabel: cc.Label
    },

    start: function () {
        this.node.zIndex = CommonConstant.ZINDEX.MINIGAME_QUICK_ICON;
    },

    // use this for initialization
    onLoad: function () {
        this.MIN_SCALE = 100 / this.node.width;
        this.MAX_SCALE = 120 / this.node.width;

        this.blinkAnimation = this.node.getComponentInChildren(cc.Animation);

        this.heartBeatAction = cc.sequence(
            cc.scaleTo(1, this.MIN_SCALE),
            cc.scaleTo(1, this.MAX_SCALE)
        ).repeatForever();

        this.touchStartTime = Date.now();
        this.mouseEnter = false;

        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(cc.Node.EventType.MOUSE_ENTER, function () {
            this.mouseEnter = true;
            this._cancelScheduleIdleState();
        }, this);
        this.node.on(cc.Node.EventType.MOUSE_LEAVE, function () {
            if (this.mouseEnter) {
                this._scheduleIdleState();
            }
            this.mouseEnter = false;
        }, this);

        var position = this._loadPosition();
        if (position) {
            this.node.position = position;
        }
        this.node.position = this._correctPosition(this.node.position);
        this._scheduleIdleState();
        this.onTinhNangNew();

        EventDispatcher.addEventListener(EventDispatcherConstant.TINH_NANG.NEW, this.onTinhNangNew, this);
    },

    onDestroy: function () {
        this.node.destroy();
        UiManager.destroyModalByName(MINIGAME_POPUP_PREFAB);
        EventDispatcher.removeEventListener(EventDispatcherConstant.TINH_NANG.NEW, this.onTinhNangNew, this);
    },

    // called every frame, uncomment this function to activate update callback
    update: function () {
        this._updateTaiXiu();
    },

    onTinhNangNew: function () {
        this.taixiuTimeLeftNode.active = TinhNangManager.choPhep(GameConstant.TAI_XIU.ID);
    },

    onTouchStart: function () {
        this.touchStartTime = Date.now();
        this._cancelScheduleIdleState();
    },

    onTouchMove: function (event) {
        var location = event.getLocation();
        this.node.position = location;
    },

    onTouchEnd: function (event) {
        var deltaTime = (Date.now() - this.touchStartTime),
            startLocation = event.getStartLocation(),
            location = event.getLocation(),
            deltaX = location.x - startLocation.x,
            deltaY = location.y - startLocation.y,
            maxDelta = Math.max(Math.abs(deltaX), Math.abs(deltaY)),
            a = maxDelta / deltaTime,
            winSize = cc.winSize,
            xMin = 0,
            xMax = xMin + winSize.width,
            yMin = 0,
            yMax = yMin + winSize.height,
            animationTime = 0.2,
            self = this,
            action;

        if (a > 1.2) {
            switch (maxDelta) {
            case deltaX:
                action = cc.moveTo(animationTime, this._correctPosition(cc.v2(xMax, this.node.y)));
                break;

            case -deltaX:
                action = cc.moveTo(animationTime, this._correctPosition(cc.v2(xMin, this.node.y)));
                break;

            case deltaY:
                action = cc.moveTo(animationTime, this._correctPosition(cc.v2(this.node.x, yMax)));
                break;

            case -deltaY:
                action = cc.moveTo(animationTime, this._correctPosition(cc.v2(this.node.x, yMin)));
                break;
            }
        }
        else {
            var deltaXLeft = location.x - xMin,
                deltaXRight = xMax - location.x,
                deltaYTop = yMax - location.y,
                deltaYBottom = location.y - yMin,
                minDelta = Math.min(deltaXLeft, deltaXRight, deltaYTop, deltaYBottom);

            switch (minDelta) {
            case deltaXLeft:
                action = cc.moveTo(animationTime, this._correctPosition(cc.v2(xMin, this.node.y)));
                break;

            case deltaXRight:
                action = cc.moveTo(animationTime, this._correctPosition(cc.v2(xMax, this.node.y)));
                break;

            case deltaYTop:
                action = cc.moveTo(animationTime, this._correctPosition(cc.v2(this.node.x, yMax)));
                break;

            case deltaYBottom:
                action = cc.moveTo(animationTime, this._correctPosition(cc.v2(this.node.x, yMin)));
                break;
            }
        }

        if (action) {
            action.easing(cc.easeBounceInOut());
            this.node.runAction(cc.sequence(action, cc.callFunc(this._savePosition.bind(this))));
        }

        this._scheduleIdleState();

        if (Math.abs(deltaX) < SMALL_MOVE_DISTANCE && Math.abs(deltaY) < SMALL_MOVE_DISTANCE) {
            UiManager.openModalByName(MINIGAME_POPUP_PREFAB, function (newNode) {
                var comp = newNode.getComponent('MinigamePopup');
                if (comp) {
                    comp.init(self);
                    self.hide();
                }
            }, {
                isPersistent: true
            });
        }

        this.mouseEnter = false;
    },

    show: function () {
        this._correctPositionToShow();

        var animationTime = 0.2,
            animation = cc.spawn([
                cc.scaleTo(animationTime, 1),
                cc.rotateBy(animationTime, -720),
                cc.fadeIn(animationTime)
            ]);
        this.node.runAction(cc.sequence(animation, cc.callFunc(this._scheduleIdleState.bind(this))));
    },

    hide: function () {
        this._correctPositionToHide();

        var animationTime = 0.2,
            animation = cc.spawn([
                cc.scaleTo(animationTime, 0),
                cc.rotateBy(animationTime, 720),
                cc.fadeOut(animationTime)
            ]);
        this.node.runAction(animation);
    },

    _getShortestBoundaryPosition: function (position, size) {
        var winSize = cc.winSize,
            xMin = 0,
            xMax = xMin + winSize.width,
            yMin = 0,
            yMax = yMin + winSize.height,
            width = size ? size.width : this.node.width,
            halfWidth = width / 2,
            height = size ? size.height : this.node.height,
            halfHeight = height / 2,
            deltaXLeft = position.x - xMin,
            deltaXRight = xMax - position.x,
            deltaYTop = yMax - position.y,
            deltaYBottom = position.y - yMin,
            minDelta = Math.min(deltaXLeft, deltaXRight, deltaYTop, deltaYBottom),
            newPos = {
                x: position.x,
                y: position.y
            };

        switch (minDelta) {
        case deltaXLeft:
            newPos.x = xMin + halfWidth;
            break;

        case deltaXRight:
            newPos.x = xMax - halfWidth;
            break;

        case deltaYTop:
            newPos.y = yMax - halfHeight;
            break;

        case deltaYBottom:
            newPos.y = yMin + halfHeight;
            break;
        }

        return newPos;
    },

    _correctPosition: function (position, size) {
        var winSize = cc.winSize,
            xMin = 0,
            xMax = xMin + winSize.width,
            yMin = 0,
            yMax = yMin + winSize.height,
            width = size ? size.width : this.node.width,
            halfWidth = width / 2,
            height = size ? size.height : this.node.height,
            halfHeight = height / 2,
            xLeft = position.x - halfWidth,
            xRight = position.x + halfWidth,
            yTop = position.y + halfHeight,
            yBottom = position.y - halfHeight;

        if (xLeft < xMin) {
            xLeft = xMin + halfWidth;
        }
        else if (xRight > xMax) {
            xLeft = xMax - halfWidth;
        }
        else {
            xLeft = position.x;
        }

        if (yBottom < yMin) {
            yBottom = yMin + halfHeight;
        }
        else if (yTop > yMax) {
            yBottom = yMax - halfHeight;
        }
        else {
            yBottom = position.y;
        }

        return cc.v2(xLeft, yBottom);
    },

    _correctPositionToShow: function () {
        this.node.stopAllActions();
        this.node.scale = 0;
        this.node.rotation = 0;
        this.node.opacity = 0;
    },

    _correctPositionToHide: function () {
        this.node.stopAllActions();
        this.node.scale = 1;
        this.node.rotation = 0;
        this.node.opacity = 255;
    },

    _changeToIdleState: function () {
        this.node.opacity = IDLE_OPACITY;
        if (this.node.scale >= this.MIN_SCALE) {
            var self = this,
                oldWidth = this.node.width,
                oldHeight = this.node.height,
                newWidth = oldWidth * this.MAX_SCALE,
                newHeight = oldHeight * this.MAX_SCALE,
                halfNewWidth = newWidth / 2,
                halfNewHeight = newHeight / 2,
                winSize = cc.winSize,
                xMin = 0,
                xMax = xMin + winSize.width,
                yMin = 0,
                yMax = yMin + winSize.height,
                deltaWidth = oldWidth - newWidth,
                deltaHeight = oldHeight - newHeight,
                xLeft = this.node.x - deltaWidth / 2,
                xRight = this.node.x + deltaWidth / 2,
                yTop = this.node.y + deltaHeight / 2,
                yBottom = this.node.y - deltaHeight / 2,
                newSize = {
                    width: newWidth,
                    height: newHeight
                },
                newPos = this._correctPosition(this.node.position, newSize);

            newPos = this._getShortestBoundaryPosition(newPos, newSize);

            if (Math.abs(xMin - (xLeft - halfNewWidth)) < BOUNDARY_PADDING) {
                newPos.x = xLeft;
            }
            else if (Math.abs(xMax - (xRight + halfNewWidth)) < BOUNDARY_PADDING) {
                newPos.x = xRight;
            }

            if (Math.abs(yMax - (yTop + halfNewHeight)) < BOUNDARY_PADDING) {
                newPos.y = yTop;
            }
            else if (Math.abs(yMin - (yBottom - halfNewHeight)) < BOUNDARY_PADDING) {
                newPos.y = yBottom;
            }

            this.node.scale = this.MAX_SCALE;
            this.node.runAction(cc.sequence(
                cc.moveTo(0.3, newPos),
                cc.callFunc(function () {
                    self.node.runAction(self.heartBeatAction);
                })
            ));
        }

        if (this.blinkAnimation && this.blinkAnimation.isRunning()) {
            this.blinkAnimation.stop();
        }
    },

    _changeToActiveState: function () {
        try {
            this.node.stopAction(this.heartBeatAction);
            if (this.node.scale >= this.MIN_SCALE && this.node.scale <= this.MAX_SCALE) {
                var action = cc.spawn([
                    cc.scaleTo(0.2, 1),
                    cc.moveTo(0.2, this._correctPosition(this.node.position))
                ]);
                this.node.runAction(action);
            }
        }
        catch (e) {}

        this.node.opacity = ACTIVE_OPACITY;
        if (this.blinkAnimation) {
            this.blinkAnimation.play();
        }
    },

    _scheduleIdleState: function () {
        this._cancelScheduleIdleState();
        this._idleTimeoutId = setTimeout(this._changeToIdleState.bind(this), IDLE_TIMEOUT);
    },

    _cancelScheduleIdleState: function () {
        if (this._idleTimeoutId) {
            clearTimeout(this._idleTimeoutId);
            this._idleTimeoutId = null;
        }
        this._changeToActiveState();
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

    _savePosition: function () {
        cc.sys.localStorage.setItem(MINIGAME_QUICK_ICON_POSITION_KEY, JSON.stringify({
            x: this.node.x,
            y: this.node.y
        }));
    },

    _loadPosition: function () {
        try {
            var position = JSON.parse(cc.sys.localStorage.getItem(MINIGAME_QUICK_ICON_POSITION_KEY));
            if (position && Utils.Type.isDefined(position.x) && Utils.Type.isDefined(position.y)) {
                return position;
            }
        }
        catch (e) {
            return null;
        }
    }
});
