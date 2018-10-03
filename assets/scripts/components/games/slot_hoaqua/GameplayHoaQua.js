var GameplayMyNhan = require('GameplayMyNhan'),
    MyNhanConstant = require('MyNhanConstant'),
    GameConstant = require('GameConstant');


cc.Class({
    extends: GameplayMyNhan,

    properties: {
        gameCmd: {
            'default': GameConstant.HOA_QUA.CMD,
            override: true,
        },
    },

    $onLoad: function () {
        GameplayMyNhan.prototype.$onLoad.call(this);
    },

    onUpdateAwardType: function (params) {
        if (params.itemsInfo) {
            this.bangThuongNode.getComponent('TableBangThuongHoaQua').setData(params.itemsInfo, MyNhanConstant.GameType.type);
        }
        this.bangThuongNode.active = true;
    },

});
