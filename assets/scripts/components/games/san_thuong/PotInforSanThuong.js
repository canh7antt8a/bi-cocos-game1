cc.Class({
    extends: cc.Component,

    properties: {
        activePotSprite: cc.Sprite,
    },

    // use this for initialization
    onLoad: function () {
        this.isActive = true;

    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
    // 
    clickPot: function () {
        if (this.isActive) {
            this.isActive = false;
        }
        else {
            this.isActive = true;
        }
        this.activePotSprite.node.active = this.isActive;
    },

    activePot: function (isActive) {
        this.isActive = isActive;
        this.activePotSprite.node.active = isActive;
    },

});
