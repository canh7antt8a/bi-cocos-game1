var CommonConstant = require('CommonConstant'),
    BaseGameplay = require('BaseGameplay');

cc.Class({
    extends: BaseGameplay,

    properties: {},

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    start: function () {
        this.node.zIndex = CommonConstant.ZINDEX.MINIGAME_PREFAB;
    },

    $onLoadScene: function () {
        this.$onLoad();
    },

    $onLoad: function () {

    },
});
