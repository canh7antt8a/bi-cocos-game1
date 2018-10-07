cc.Class({
    extends: cc.Component,

    properties: {
        url: null,
    },

    // use this for initialization
    onLoad: function () {
        if (this.url) {
            this.loadImage(this.url);
        }
    },

    loadImage: function (url) {
        var self = this;

        cc.loader.load(url, function (err, texture) {
            if (err) {
                cc.error(err);
            }
            else if (self.node) {
                var sprite = self.node.getComponent(cc.Sprite);
                sprite.spriteFrame = new cc.SpriteFrame(texture);
                self.node.runAction(cc.fadeIn(0.5));
            }
        });
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
