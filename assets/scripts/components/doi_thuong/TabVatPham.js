var NetworkManager = require('NetworkManager'),
    Url = require('Url');

cc.Class({
    extends: cc.Component,

    properties: {
        itemVatPhamPrefab: cc.Prefab,
        contentNode: cc.Node,
    },

    // use this for initialization
    onLoad: function () {},

    onEnable: function () {
        this.loadDataItems();
    },

    loadDataItems: function () {
        var self = this;
        self.contentNode.removeAllChildren();
        NetworkManager.Http.fetch('GET', Url.Http.DOI_THUONG_GET_ITEMS_INFO, {}, {
                cache: 1800
            })
            .success(function (respDone) {
                var itemVatPham;
                for (var i = 0; i < respDone.data.length; i += 1) {
                    itemVatPham = cc.instantiate(self.itemVatPhamPrefab);
                    itemVatPham.getComponent('ItemVatPham').updateData(respDone.data[i]);
                    self.contentNode.addChild(itemVatPham);
                }
            });
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
