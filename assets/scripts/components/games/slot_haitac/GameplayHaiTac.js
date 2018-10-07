var GameplayMyNhan = require('GameplayMyNhan'),
    MyNhanConstant = require('MyNhanConstant'),
    GameConstant = require('GameConstant');


cc.Class({
    extends: GameplayMyNhan,

    properties: {
        gameCmd: {
            'default': GameConstant.HAI_TAC.CMD,
            override: true
        },
    },

    $onLoad: function () {
        GameplayMyNhan.prototype.$onLoad.call(this);
    },

    onUpdateAwardType: function (params) {
        if (params.itemsInfo) {
            this.bangThuongNode.getComponent('TableBangThuongHaiTac').setData(params.itemsInfo, MyNhanConstant.GameType.type);
        }
        this.bangThuongNode.active = true;
    },

});
