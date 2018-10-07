cc.Class({
    extends: cc.Component,

    properties: {
        enableSprite: cc.SpriteFrame,
        disableSprite: cc.SpriteFrame,
        isEnable: false,
        toggleEvents: {
            default: [],
            type: cc.Component.EventHandler,
        }
    },

    // use this for initialization
    onLoad: function () {
        this.toogleNode = this.node.getChildByName('ToogleNode');
        this.node.on(cc.Node.EventType.TOUCH_START, this.toggleState, this);
        this.updateState();
    },

    setEnable: function () {
        var that = this,
            x = (this.node.width - this.toogleNode.width) / 2;
        this.isEnable = true;
        this.toogleNode.runAction(cc.moveTo(0.1, cc.p(x, 0)));
        this.node.getComponent(cc.Sprite).spriteFrame = this.enableSprite;
        that.toggleEvents.forEach(function (toggleEvent) {
            toggleEvent.emit([that]);
        });
    },

    setDisable: function () {
        var that = this,
            x = (this.toogleNode.width - this.node.width) / 2;
        this.isEnable = false;
        this.toogleNode.runAction(cc.moveTo(0.1, cc.p(x, 0)));
        this.node.getComponent(cc.Sprite).spriteFrame = this.disableSprite;
        that.toggleEvents.forEach(function (toggleEvent) {
            toggleEvent.emit([that]);
        });
    },

    updateState: function () {
        if (this.isEnable) {
            this.setEnable();
        }
        else {
            this.setDisable();
        }
    },

    toggleState: function () {
        if (this.isEnable) {
            this.setDisable();
        }
        else {
            this.setEnable();
        }
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
