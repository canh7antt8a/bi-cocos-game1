var Url = require('Url'),
    AuthUser = require('AuthUser'),
    NetworkManager = require('NetworkManager');

cc.Class({
    extends: cc.Component,

    properties: {
        itemLichSuPrefab: cc.Prefab,
        lichSuTheContainerNode: cc.Node
    },

    // use this for initialization
    onLoad: function () {

    },

    getLichSuThe: function () {
        var that = this;
        NetworkManager.Http.fetch('GET', Url.Http.DOI_THUONG_CARDS_HISTORY, {
                username: AuthUser.username,
                accesstoken: AuthUser.accesstoken
            })
            .success(function (respDone) {
                var lichSuTheNode, i, col1, col2, col3, col4,
                    cards = respDone.data;
                that.lichSuTheContainerNode.removeAllChildren();
                for (i = 0; i < cards.length; i += 1) {
                    lichSuTheNode = cc.instantiate(that.itemLichSuPrefab);
                    col1 = cards[i].created_time.replace(' ', '\n');
                    col2 = cards[i].card_serial;
                    col3 = cards[i].card_pin;
                    col4 = cards[i].card_type + '\n' + cards[i].card_amount;
                    lichSuTheNode.getComponent('RowTable').updateData(col1, col2, col3, col4);
                    that.lichSuTheContainerNode.addChild(lichSuTheNode);
                }
            });
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
