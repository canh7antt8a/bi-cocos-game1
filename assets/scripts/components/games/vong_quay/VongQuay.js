var UrlImage = require('UrlImage'),
    CommonConstant = require('CommonConstant');

cc.Class({
    extends: cc.Component,

    properties: {
        itemLabelList: {
            default: [],
            type: cc.Label
        },
        itemImageList: {
            default: [],
            type: UrlImage
        }
    },

    onLoad: function () {
        this.rotateOld = 0;
        this.rotateDelta = 0;
        for (var i = 0; i < this.itemImageList.length; i += 1) {
            this.itemImageList[i].node.getComponent(cc.Sprite).spriteFrame = null;
        }
    },

    updateData: function (data) {
        if (!this.imageUrlList) {
            this.imageUrlList = [];
        }
        for (var i = 0; i < this.itemLabelList.length; i += 1) {
            var url = data[i].image;
            this.itemLabelList[i].string = CommonConstant.CurrencyType.normalize(data[i].description);
            if (this.itemImageList.length > 0 && url && url.length > 0) {
                if (this.imageUrlList.length < this.itemLabelList.length) {
                    this.imageUrlList.push(url);
                    this.itemImageList[i].loadImage(url);
                }
                else {
                    if (this.imageUrlList[i] !== url) {
                        this.itemImageList[i].loadImage(url);
                    }
                    this.imageUrlList[i] = url;
                }
            }
        }
    },

    update: function () {
        this.rotateDelta = this.node.rotation - this.rotateOld;
        this.rotateOld = this.node.rotation;
    },
});
