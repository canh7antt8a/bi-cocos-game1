var GameItem = require('GameItem');

cc.Class({
    extends: cc.Component,

    properties: {
        txtMoneyMyNhanList: {
            default: [],
            type: cc.Label
        },
        txtMoneyHoaQuaList: {
            default: [],
            type: cc.Label
        },
        txtMoneyHaiTacList: {
            default: [],
            type: cc.Label
        },
        gameItemList: {
            default: [],
            type: GameItem
        }
    },

    onLoad: function () {

    },

    onMyNhanClick: function () {

    },

    onHaiTacClick: function () {

    },

    onHoaQuaClick: function () {

    },

    onBackClick: function () {

    },
});
