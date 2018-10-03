var Utils = require('Utils'),
    AnimationManager = require('AnimationManager');

cc.Class({
    extends: cc.Component,

    properties: {
        duration: 0.1,
        color: cc.Color.WHITE,
        opacity: 80
    },

    // use this for initialization
    onLoad: function () {
        this.stopFn = null;
        this.isTouching = false;
        this.isAnimating = false;
        this.onFinishAnimationBinding = this.onFinishAnimation.bind(this);
        if (this.node) {
            this.node.on(cc.Node.EventType.TOUCH_START, function (event) {
                this.stopAnimation();

                var button = this.getComponent(cc.Button);
                if (button && button.interactable) {
                    this.isTouching = true;
                    this.isAnimating = true;

                    var touchLocation = event.currentTarget.convertToNodeSpace(event.getLocation());
                    this.stopFn = AnimationManager.fillRadial(this.node, touchLocation, {
                        duration: this.duration,
                        isStopManually: true,
                        finishCallback: this.onFinishAnimationBinding,
                        color: this.color,
                        opacity: this.opacity
                    });
                }
            }, this);

            this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchUp, this);
            this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchUp, this);
        }
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    stopAnimation: function () {
        if (Utils.Type.isFunction(this.stopFn)) {
            this.stopFn();
            this.stopFn = null;
        }
    },

    onFinishAnimation: function () {
        if (!this.isTouching) {
            this.stopAnimation();
        }
        this.isAnimating = true;
    },

    onTouchUp: function () {
        this.isTouching = false;
        if (!this.isAnimating) {
            this.stopAnimation();
        }
    },

});
