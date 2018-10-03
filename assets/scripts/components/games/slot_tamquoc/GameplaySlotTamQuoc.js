var GameplaySlotTayDuKy = require('GameplaySlotTayDuKy'),
    GameConstant = require('GameConstant');

cc.Class({
    extends: GameplaySlotTayDuKy,

    properties: {
        gameCmd: {
            'default': GameConstant.TAM_QUOC.CMD,
            override: true
        },
    },

    $onLoad: function () {
        // cc.log(this.gameCmd);
        GameplaySlotTayDuKy.prototype.$onLoad.call(this);
    },

});
