cc.Class({
    extends: cc.Component,

    properties: {
        hopMoSprite: cc.Sprite,
        efectSprite: cc.Sprite,
        textPhanThuong: cc.Label,
    },

    // use this for initialization
    onLoad: function () {

    },

    init: function (id) {
        this.id = id;
    },

    openHopQua: function (value) {
        // cc.warn(value + ' value ' + this.id);
        this.node.getComponent(cc.Sprite).enabled = false;
        this.hopMoSprite.node.active = true;
        this.efectSprite.node.active = true;
        this.textPhanThuong.node.active = true;
        this.textPhanThuong.string = value;
    },
});
