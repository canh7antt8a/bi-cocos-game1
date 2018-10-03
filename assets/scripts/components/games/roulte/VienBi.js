var BaseMainGameplay = require('BaseMainGameplay');

cc.Class({
    extends: cc.Component,

    properties: {
        sceneScript: BaseMainGameplay,
    },
    onEnable: function () {
        cc.director.getCollisionManager().enabled = true;
        // cc.director.getCollisionManager().enabledDebugDraw = true;
    },

    onDisable: function () {
        cc.director.getCollisionManager().enabled = false;
        cc.director.getCollisionManager().enabledDebugDraw = false;
    },

    onCollisionEnter: function (other, self) {
        // this.node.parent.stopAllActions();
        this.sceneScript.stopVienBi();
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
