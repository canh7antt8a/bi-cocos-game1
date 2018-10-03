var PokerConstant = require('PokerConstant');

cc.Class({
    extends: cc.Component,

    properties: {},

    // use this for initialization
    onLoad: function () {
        this.hide();
    },

    setType: function (type) {
        var active = true,
            color = new cc.Color(0, 0, 0),
            text = '';

        switch (type) {
        case PokerConstant.PlayerType.NORMAL:
            active = false;
            break;

        case PokerConstant.PlayerType.DEALER:
            text = 'D';
            color = new cc.Color(175, 29, 29);
            break;

        case PokerConstant.PlayerType.SMALL_BLIND:
            text = 'S';
            color = new cc.Color(59, 131, 31);
            break;

        case PokerConstant.PlayerType.BIG_BLIND:
            text = 'B';
            color = new cc.Color(43, 18, 226);
            break;
        }

        this.node.active = active;
        this.node.getComponentInChildren(cc.Label).string = text;
        this.node.getComponentInChildren(cc.Label).node.color = color;
    },

    hide: function () {
        this.setType(PokerConstant.PlayerType.NORMAL);
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
