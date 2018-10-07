var Utils = require('Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        screenRatios: {
            'default': [],
            type: [Utils.Screen.ScreenRatioEnum]
        },
        scaleX: '',
        scaleY: '',
        widgetActive: false,
        widgetTop: '',
        widgetBottom: '',
        widgetLeft: '',
        widgetRight: ''
    },

    // use this for initialization
    onLoad: function () {
        for (var i = 0; i < this.screenRatios; i += 1) {
            if (Utils.Screen.isType(this.screenRatios[i])) {
                this.applyProps();
                break;
            }
        }
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    applyProps: function () {
        this.applyScaleProps();
        this.applyWidgetProps();
    },

    applyScaleProps: function () {
        var self = this;
        ['X', 'Y'].forEach(function (c) {
            var scale = parseFloat(self['scale' + c]);
            if (scale >= 0) {
                self.node['scale' + c] = scale;
            }
        });
    },

    applyWidgetProps: function () {
        if (this.widgetActive) {
            var widget = this.node.getComponent(cc.Widget),
                isUsed = false,
                self = this;
            if (!widget) {
                widget = this.node.addComponent(cc.Widget);
            }
            ['Top', 'Bottom', 'Left', 'Right'].forEach(function (align) {
                var value = parseFloat(self['widget' + align]),
                    isAlign = (value >= 0);
                widget['isAlign' + align] = isAlign;
                if (isAlign) {
                    isUsed = true;
                    widget[align.toLowerCase()] = value;
                }
            });
            if (isUsed) {
                widget.isActive = true;
            }
        }
    }
});
