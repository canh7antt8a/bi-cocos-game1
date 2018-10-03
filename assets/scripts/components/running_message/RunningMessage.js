var RunningMessageStore = require('RunningMessageStore'),
    PlatformImplement = require('PlatformImplement'),
    EventDispatcher = require('EventDispatcher'),
    TinhNangManager = require('TinhNangManager'),
    EventDispatcherConstant = require('EventDispatcherConstant'),
    UiManager = require('UiManager'),
    Utils = require('Utils'),
    MSG_MOVE_STEP_X = 3,
    MSG_UPDATE_POSITION_INTERVAL = 33,
    MIN_DISTANCE = 100,
    X_MOVE_TIME = (MSG_UPDATE_POSITION_INTERVAL / MSG_MOVE_STEP_X) / 1000,
    NUMBER_RELATED_COLOR = '#02bbff',
    LINK_COLOR = '#ffed6b';

cc.Class({
    extends: cc.Component,

    properties: {
        maskNode: cc.Node,
        runningMessageTemplateNode: cc.Node
    },

    // use this for initialization
    onLoad: function () {
        this.activeNodes = [];

        EventDispatcher.addEventListener(EventDispatcherConstant.TINH_NANG.NEW, this.onTinhNangNew, this);
        EventDispatcher.addEventListener(EventDispatcherConstant.RUNNING_MESSAGE.NEW_MESSAGE, this.onNewMessage, this);
    },

    onDestroy: function () {
        EventDispatcher.removeEventListener(EventDispatcherConstant.TINH_NANG.NEW, this.onTinhNangNew, this);
        EventDispatcher.removeEventListener(EventDispatcherConstant.RUNNING_MESSAGE.NEW_MESSAGE, this.onNewMessage, this);
    },

    // called every frame, uncomment this function to activate update callback
    // update: function () {
    //     if (this.activeNodes.length === 0 || this.activeNodes[0].shouldShowMore) {
    //         var msgObj = RunningMessageStore.pop();
    //         if (msgObj && (Date.now() - msgObj.at <= VALID_TIME_THRESHOLD)) {
    //             this.displayMessage(msgObj);
    //         }
    //     }
    // },

    onNewMessage: function () {
        if (this.activeNodes.length === 0 || this.activeNodes[0].shouldShowMore) {
            var msgObj = RunningMessageStore.pop();
            if (msgObj && (msgObj.expireAt > Date.now())) {
                this.displayMessage(msgObj);
            }
        }
    },

    onTinhNangNew: function () {
        this.node.active = TinhNangManager.choPhep('nc');
    },

    displayMessage: function (msgObj) {
        var runningMessageLabelNode = cc.instantiate(this.runningMessageTemplateNode),
            maskNodePositionWS = this.maskNode.convertToWorldSpace(cc.v2(0, 0)),
            maskNodePositionNSToLabelNode, fromX, deltaX, deltaXToShowMore, deltaXToDone,
            timeToShowMore, timeToDone,
            self = this,
            isLink = false;

        runningMessageLabelNode.parent = this.maskNode;
        runningMessageLabelNode.active = true;
        runningMessageLabelNode.position = cc.v2(0, 0);
        maskNodePositionNSToLabelNode = runningMessageLabelNode.convertToNodeSpace(maskNodePositionWS);
        fromX = maskNodePositionNSToLabelNode.x + this.maskNode.width;
        this.activeNodes.unshift(runningMessageLabelNode);

        switch (msgObj.target) {
        case 'open_web':
            isLink = true;
            runningMessageLabelNode.on(cc.Node.EventType.TOUCH_START, function () {
                PlatformImplement.openWebUrl(msgObj.targetId);
            });
            break;

        case 'event':
            isLink = true;
            runningMessageLabelNode.on(cc.Node.EventType.TOUCH_START, function () {
                UiManager.openPopupEvent(msgObj.targetId);
            });
            break;

        case 'webview':
            isLink = true;
            runningMessageLabelNode.on(cc.Node.EventType.TOUCH_START, function () {
                try {
                    var data = msgObj.targetId.split('\n');
                    UiManager.openWebView(data[0], data[1]);
                }
                catch (e) {}
            });
            break;
        }

        runningMessageLabelNode.getComponent(cc.RichText).string = this._decorateMsg(msgObj.content, isLink);
        runningMessageLabelNode.x = fromX;
        deltaX = this.maskNode.width + runningMessageLabelNode.width;
        deltaXToShowMore = runningMessageLabelNode.width + MIN_DISTANCE;
        timeToShowMore = deltaXToShowMore * X_MOVE_TIME;
        deltaXToDone = Math.max(deltaX - deltaXToShowMore, 0);
        timeToDone = deltaXToDone * X_MOVE_TIME;
        runningMessageLabelNode.runAction(cc.sequence([
            cc.moveBy(timeToShowMore, cc.v2(-deltaXToShowMore, 0)),
            cc.callFunc(function () {
                runningMessageLabelNode.shouldShowMore = true;
                self.onNewMessage();
            }),
            cc.moveBy(timeToDone, cc.v2(-deltaXToDone, 0)),
            cc.callFunc(function () {
                Utils.Array.removeRef(self.activeNodes, runningMessageLabelNode);
                runningMessageLabelNode.destroy();
                runningMessageLabelNode.shouldShowMore = true;
                // if (self.bgNode && self.activeNodes.length < 1) {
                //     self.bgNode.runAction(cc.fadeOut(0.3).easing(cc.easeQuinticActionIn()));
                // }
            })
        ]));

        msgObj.times -= 1;
        if (msgObj.times > 0) {
            RunningMessageStore.pushTop(msgObj);
        }
    },

    _decorateMsg: function (msg, isLink) {
        if (Utils.Type.isString(msg)) {
            msg = msg.replace(/(\b|\-)[\w\-.,:]+\b/g, function (match) {
                if (match && /\d/.test(match)) {
                    match = '<color=' + NUMBER_RELATED_COLOR + '><b>' + match + '</b></color>';
                }
                return match;
            });
            msg = '<i>' + msg + '</i>';
            if (isLink) {
                msg = '<color=' + LINK_COLOR + '>' + msg + '</color>';
            }
        }
        return msg;
    }
});
