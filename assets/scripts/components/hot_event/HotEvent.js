var Url = require('Url'),
    UrlImage = require('UrlImage'),
    Carousel = require('Carousel'),
    UiManager = require('UiManager'),
    NetworkManager = require('NetworkManager'),
    PlatformImplement = require('PlatformImplement');

cc.Class({
    extends: cc.Component,

    properties: {
        bannerCarousel: Carousel,
    },

    // use this for initialization
    onLoad: function () {
        this.fetchBannerList();
    },

    fetchBannerList: function () {
        var that = this;
        NetworkManager.Http.fetch('GET', Url.Http.BANNER, {}, {
                cache: 3600
            })
            .success(function (tnResp) {
                var bannerItems = tnResp.data,
                    bannerNode;

                that.bannerCarousel.clearAllTimes();
                for (var i = 0; i < bannerItems.length; i += 1) {
                    bannerNode = that._initBannerNode(bannerItems[i]);
                    that.bannerCarousel.addItem(bannerNode, !i);
                }
            });
    },

    openEventItem: function (itemNode) {
        var target_url = itemNode.bannerData.target_url;
        if (target_url[0] === 'h') {
            PlatformImplement.openWebUrl(target_url);
        }
        else {
            target_url = JSON.parse(target_url);
            if (target_url.type === 'event') {
                UiManager.openPopupEvent(target_url.id);
            }
            else if (target_url.type === 'webview') {
                UiManager.openWebView(target_url.url, target_url.title);
            }
        }
    },

    _initBannerNode: function (bannerData) {
        var bannerNode, spriteComponent, urlImageComponent;
        bannerNode = new cc.Node();
        spriteComponent = bannerNode.addComponent(cc.Sprite);
        spriteComponent.type = cc.Sprite.Type.SIMPLE;
        spriteComponent.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        urlImageComponent = bannerNode.addComponent(UrlImage);
        urlImageComponent.url = bannerData.image_url;
        bannerNode.bannerData = bannerData;
        return bannerNode;
    }
});
