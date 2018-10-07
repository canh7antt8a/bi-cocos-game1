cc.Class({
    extends: cc.Component,

    properties: {
        topPanelOutGamePlaceHolder: cc.Node
    },

    // use this for initialization
    onLoad: function () {
        var self = this;
        cc.loader.loadRes('TopPanelOutGame', function (err, prefab) {
            var newNode = cc.instantiate(prefab);
            self.node.addChild(newNode);
            if (self.topPanelOutGamePlaceHolder) {
                newNode.setSiblingIndex(self.topPanelOutGamePlaceHolder.getSiblingIndex());
            }
        });
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
