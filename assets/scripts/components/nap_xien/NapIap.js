var Url = require('Url'),
    AuthUser = require('AuthUser'),
    SysConfig = require('SysConfig'),
    NetworkManager = require('NetworkManager'),
    PlatformImplement = require('PlatformImplement');


cc.Class({
    extends: cc.Component,

    properties: {
        iapItemPrefab: cc.Prefab,
        iapScrollView: cc.ScrollView,
    },

    onLoad: function () {
        PlatformImplement.eventDispatcher.addEventListener(PlatformImplement.Event.IAP_PURCHASE_FAIL, this._onIapPurchaseFail, this);
        PlatformImplement.eventDispatcher.addEventListener(PlatformImplement.Event.IAP_PURCHASE_SUCCESS, this._onIapPurchaseSuccess, this);
    },

    onDestroy: function () {
        PlatformImplement.eventDispatcher.removeEventListener(PlatformImplement.Event.IAP_PURCHASE_FAIL, this._onIapPurchaseFail, this);
        PlatformImplement.eventDispatcher.removeEventListener(PlatformImplement.Event.IAP_PURCHASE_SUCCESS, this._onIapPurchaseSuccess, this);
    },

    _onIapPurchaseFail: function () {},

    _onIapPurchaseSuccess: function (param) {
        NetworkManager.Http.fetch('POST', Url.Http.IAP_VERIFY, {
            username: AuthUser.username,
            accesstoken: AuthUser.accesstoken,
            receipt: param.receipt,
            signature: param.signature,
        });
    },

    onEnable: function () {
        this.fetchIapType();
    },

    fetchIapType: function () {
        var that = this;
        PlatformImplement.Iap.clearItem();
        NetworkManager.Http.fetch('GET', Url.Http.IAP_TYPES, {
                username: AuthUser.username,
                provider: SysConfig.IAP_PROVIDER
            }, {
                cache: 900,
                delay: 500,
            })
            .success(function (iapResp) {
                var iapItemNode,
                    iapItems = iapResp.data;
                that.iapScrollView.content.removeAllChildren();
                for (var i = 0; i < iapItems.length; i += 1) {
                    iapItemNode = cc.instantiate(that.iapItemPrefab);
                    that.iapScrollView.content.addChild(iapItemNode);
                    iapItemNode.getComponent('ItemInapp').setData(iapItems[i]);
                    PlatformImplement.Iap.addItem(iapItems[i].product_id);
                }
                that.iapScrollView.scrollToPercentHorizontal(0.5);
            });
    },
});
