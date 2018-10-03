var PlatformImplement = require('PlatformImplement'),
    NetworkManager = require('NetworkManager'),
    AuthUser = require('AuthUser'),
    DropDown = require('DropDown'),
    Url = require('Url');

cc.Class({
    extends: cc.Component,

    properties: {
        tongDaiDropDown: DropDown,
        tnItemPrefab: cc.Prefab,
        tnScrollView: cc.ScrollView
    },

    // use this for initialization
    onLoad: function () {},

    onEnable: function () {
        this.fetchTinNhanTypes();
    },

    fetchTinNhanTypes: function () {
        var that = this,
            nhaMang = PlatformImplement.getNhaMang(),
            selectedTelco = this.tongDaiDropDown.getSelectedItem();
        NetworkManager.Http.fetch('GET', Url.Http.TIN_NHAN_TYPES, {
                username: AuthUser.username,
                telco: selectedTelco || nhaMang
            }, {
                cache: 900,
                delay: 500,
            })
            .success(function (tnResp) {
                var tnItemNode, i,
                    telco = tnResp.telco,
                    tnItems = tnResp.data;
                that.tnScrollView.content.removeAllChildren();
                for (i = 0; i < tnItems.length; i += 1) {
                    tnItemNode = cc.instantiate(that.tnItemPrefab);
                    tnItemNode.getComponent('ItemTinNhan').updateData(tnItems[i]);
                    that.tnScrollView.content.addChild(tnItemNode);
                }
                if (!selectedTelco) {
                    that.tongDaiDropDown.clearAllItems();
                    for (i = 0; i < telco.length; i += 1) {
                        that.tongDaiDropDown.addItem(telco[i], telco[i] === tnResp.mtelco);
                    }
                }

                that.tnScrollView.scrollToPercentHorizontal(0.5);
            });
    },

});
