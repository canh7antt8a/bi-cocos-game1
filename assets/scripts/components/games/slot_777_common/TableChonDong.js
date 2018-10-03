var TextJumping = require('TextJumping');

cc.Class({
    extends: cc.Component,

    properties: {
        cuaDatNode: cc.Node,
        txtDong: cc.Label,
        txtDatCuoc: cc.Label,
    },

    onLoad: function () {
        this.pots = this.getPots();
    },

    getPots: function () {
        this._initOnce();
        if (this.pots === undefined) {
            this.pots = [];
            for (var i = 0; i < this.cuadatList.length; i += 1) {
                this.pots.push(i + 1);
            }
        }
        return this.pots;
    },

    updateMoneyBetting: function (betting) {
        this.betting = betting;
        var total = this.getPots().length * betting;
        // this.txtDatCuoc.string = Utils.Number.format(total);
        this.txtDatCuoc.node.getComponent(TextJumping).updateText(total);
    },

    onDatCuaClick: function (params) {
        // cc.log(params.currentTarget.name);
        var index = parseInt(params.currentTarget.name) - 1;
        var sprite = this.cuadatList[index].getComponent(cc.Sprite);
        sprite.enabled = !sprite.enabled;
    },

    onDongChanClick: function () {
        for (var i = 0; i < this.cuadatList.length; i += 1) {
            this.cuadatList[i].getComponent(cc.Sprite).enabled = ((i + 1) % 2 === 0);
        }
    },

    onDongLeClick: function () {
        for (var i = 0; i < this.cuadatList.length; i += 1) {
            this.cuadatList[i].getComponent(cc.Sprite).enabled = ((i) % 2 === 0);
        }
    },

    onBoChonClick: function () {
        for (var i = 0; i < this.cuadatList.length; i += 1) {
            this.cuadatList[i].getComponent(cc.Sprite).enabled = false;
        }
    },

    onTatCaClick: function () {
        for (var i = 0; i < this.cuadatList.length; i += 1) {
            this.cuadatList[i].getComponent(cc.Sprite).enabled = true;
        }
    },

    onExitClick: function () {
        this.node.active = false;
        this.pots = [];
        var count = 0;
        for (var i = 0; i < this.cuadatList.length; i += 1) {
            if (this.cuadatList[i].getComponent(cc.Sprite).enabled) {
                count += 1;
                this.pots.push(i + 1);
            }
        }
        // this.txtDong.string = count;
        this.txtDong.node.getComponent(TextJumping).updateText(count);
        this.updateMoneyBetting(this.betting);
    },

    _initOnce: function () {
        if (this.cuadatList === undefined) {
            this.cuadatList = this.cuaDatNode.children;
            var i;
            for (i = 0; i < this.cuadatList.length; i += 1) {
                var node = this.cuadatList[i];
                node.addComponent(cc.Button);
                var eventHandler = new cc.Component.EventHandler();
                eventHandler.target = this.node;
                eventHandler.component = 'TableChonDong';
                eventHandler.handler = 'onDatCuaClick';
                node.getComponent(cc.Button).clickEvents.push(eventHandler);
            }
            for (i = 0; i < this.cuadatList.length; i += 1) {
                this.cuadatList[i].getComponent(cc.Sprite).enabled = true;
            }
        }
    },
});
