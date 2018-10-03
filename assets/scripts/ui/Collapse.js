cc.Class({
    extends: cc.Component,

    properties: {
        isShow: false,
        targetNode: cc.Node,
        toggleOnEvents: {
            'default': [],
            type: cc.Component.EventHandler,
        },
        toggleOffEvents: {
            'default': [],
            type: cc.Component.EventHandler,
        }
    },

    // use this for initialization
    onLoad: function () {
        var that = this;
        this.node.on(cc.Node.EventType.TOUCH_END, function () {
            that.toggle();
        });
    },

    toggle: function () {
        this.isShow = !this.isShow;
        if (this.isShow) {
            this.targetNode.parent.height += this.targetNode.height;
            this.targetNode.runAction(cc.scaleTo(0.2, 1, 1));
        }
        else {
            this.targetNode.parent.height -= this.targetNode.height;
            this.targetNode.runAction(cc.scaleTo(0.2, 1, 0));
        }
        this.dispatchEvents();
    },

    dispatchEvents: function () {
        if (this.isShow) {
            this.toggleOnEvents.forEach(function (event) {
                event.emit();
            });
        }
        else {
            this.toggleOffEvents.forEach(function (event) {
                event.emit();
            });
        }
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
