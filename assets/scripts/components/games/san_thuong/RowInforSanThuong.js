cc.Class({
    extends: cc.Component,

    properties: {
        gemList: {
            'default': [],
            type: cc.Prefab,
        },
        count: 30,
    },

    // use this for initialization
    onLoad: function () {
        this.initDefaultGem();
        this.gemTemp = [];
        this.gemHeight = this.node.children[0].height;
        this.spacingY = this.node.getComponent(cc.Layout).spacingY;
    },

    initDefaultGem: function () {
        var index = 0;
        // for (var i = 0; i < this.count; i += 1) {
        for (var i = 0; i < 20; i += 1) {
            if (index === 7) {
                index = 0;
            }
            var gem = cc.instantiate(this.gemList[index]);
            this.node.addChild(gem);
            index += 1;
        }
    },

    initGemFinish: function (gemIndex) {
        var gem = cc.instantiate(this.gemList[gemIndex]);
        this.node.addChild(gem);
        gem.setSiblingIndex(0);
        this.gemTemp.push(gem);
    },

    destroyGemTemp: function () {
        if (this.gemTemp.length > 0) {
            var self = this;
            this.node.children.slice(-6).forEach(function (child) {
                child.destroy();
            });
            this.gemTemp.reverse().forEach(function (child) {
                self.node.addChild(cc.instantiate(child));
            });
            this.gemTemp = [];
        }
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
