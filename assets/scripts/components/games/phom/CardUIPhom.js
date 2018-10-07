var CardUI = require('CardUI');

cc.Class({
    extends: CardUI,

    properties: {
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        hoverAnNode: cc.Node,
    },

    // use this for initialization
    onLoad: function () {
        var self = this;
        this.isTouched = false;
        this.posYFirst = self.node.y;
        this.hoverAnNode.active = false;

        this.DELTA_Y_TOUCHED = 70;
        this.TIME_MOVE_TOUCHED = 0.1;
        self.index = self.node.getSiblingIndex();
        this.node.on(cc.Node.EventType.TOUCH_START, function () {
            this.time = Date.now();
        });

        this.interactable = false;
        this.canMove = false;
        this.node.on(cc.Node.EventType.TOUCH_MOVE, function (event) {
            // cc.log(self.canMove);
            if (this.time - Date.now() < -100 && self.interactable && self.canMove) {
                self.isMoved = true;
                self.node.setSiblingIndex(self.node.parent.childrenCount + 1);
                var pos = self.node.parent.convertToNodeSpace(event.getLocation());
                self.node.x = (pos).x;
                self.node.parent.getComponent(cc.Layout).enabled = false;
            }
        });

        this.node.on(cc.Node.EventType.TOUCH_END, function () {
            if (self.interactable && !self.isMoved) {
                self.onButtonTouch();
            }
            self.onEndOrCancelTouch();
        });

        this.node.on(cc.Node.EventType.TOUCH_CANCEL, function () {
            self.onEndOrCancelTouch();
        });

        this.node.on('check_chosen_card', function () {});
    },

    onEndOrCancelTouch: function () {
        if (this.interactable && this.isMoved) {
            this.node.parent.getComponent(cc.Layout).enabled = true;
            this.index = Math.round(this.node.x / (this.node.parent.width / this.node.parent.childrenCount));
            this.index = this.index >= 0 ? this.index : 0;
            this.node.setSiblingIndex(this.index);
            this.isMoved = false;
            this.time = Date.now();
        }
    },

    onButtonTouch: function (notEffect) {
        var sequenceAction;
        var self = this;
        var timeEffect = 0;
        if (notEffect) {
            timeEffect = 0;
        }
        else {
            timeEffect = self.TIME_MOVE_TOUCHED;
        }
        self.node.stopAllActions();
        if (this.isTouched) {
            sequenceAction = cc.sequence(
                cc.callFunc(function () {
                    self.isTouched = true;
                    self.interactable = false;
                    self.node.setPosition(self.node.x, self.posYFirst + self.DELTA_Y_TOUCHED);
                }),
                cc.moveTo(timeEffect, 0, self.posYFirst),
                cc.callFunc(function () {
                    self.isTouched = false;
                    self.interactable = true;
                    self.node.parent.emit('check_chosen_card');
                })
            );
        }
        else {
            sequenceAction = cc.sequence(
                cc.callFunc(function () {
                    self.isTouched = false;
                    self.node.setPosition(self.node.x, self.posYFirst);
                    self.interactable = false;
                }),
                cc.moveTo(timeEffect, 0, self.posYFirst + self.DELTA_Y_TOUCHED),
                cc.callFunc(function () {
                    self.isTouched = true;
                    self.interactable = true;
                    self.node.parent.emit('check_chosen_card');
                })
            );
        }
        self.node.runAction(sequenceAction);

    },

    setMoveCardUpDown: function (isUp) {
        var self = this;
        self.node.stopAllActions();
        if (isUp) {
            self.node.setPosition(self.node.x, self.posYFirst);
            self.node.runAction(cc.moveTo(self.TIME_MOVE_TOUCHED, 0, self.posYFirst + self.DELTA_Y_TOUCHED));
        }
        else {
            self.node.setPosition(self.node.x, self.posYFirst + self.DELTA_Y_TOUCHED);
            self.node.runAction(cc.moveTo(self.TIME_MOVE_TOUCHED, 0, self.posYFirst));
        }
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
