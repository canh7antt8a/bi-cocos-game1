cc.Class({
    extends: cc.Component,

    properties: {
        pressedScale: 1.1,
        transDuration: 0.1
    },

    // use this for initialization
    onLoad: function () {
        var self = this;
        self.initScale = this.node.scale;
        self.button = self.getComponent(cc.Button);
        self.scaleDownAction = cc.scaleTo(self.transDuration, self.pressedScale);
        if (self.pressedScale < 1) {
            // add animation to fix bug not trigger button handler
            self.scaleDownAction = cc.sequence([cc.scaleTo(0.02, 1.1), self.scaleDownAction]);
        }
        self.scaleUpAction = cc.scaleTo(self.transDuration, self.initScale);

        function onTouchDown() {
            var button = this.getComponent(cc.Button);
            if (button && button.interactable && self.scaleDownAction) {
                this.stopAllActions();
                this.runAction(self.scaleDownAction);
            }
        }

        function onTouchUp() {
            var button = this.getComponent(cc.Button);
            if (button && button.interactable && self.scaleDownAction) {
                this.stopAllActions();
                this.runAction(self.scaleUpAction);
            }
        }
        this.node.on(cc.Node.EventType.TOUCH_START, onTouchDown, this.node);
        this.node.on(cc.Node.EventType.TOUCH_END, onTouchUp, this.node);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, onTouchUp, this.node);
    }
});
