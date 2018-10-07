var UrlImage = require('UrlImage'),
    Utils = require('Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        avatarImage: UrlImage,
        numberLabel: cc.Label,
        usernameRichText: cc.RichText,
        scoreLabel: cc.Label
    },

    // use this for initialization
    onLoad: function () {

    },

    updateData: function (index, itemData) {
        var username_text = itemData.username.split('(');
        this.numberLabel.string = index;
        this.avatarImage.loadImage(itemData.avatar);
        this.usernameRichText.string = '<color=#FFD600>' + username_text[0].trim() + '</color>';
        if (username_text.length > 1) {
            if (username_text[0].length < 26) {
                this.usernameRichText.string += '\n';
            }
            else {
                this.usernameRichText.string += ' ';
            }
            this.usernameRichText.string += '<size=24>' + username_text[1].trim().replace(')', '') + '</size>';
        }
        this.scoreLabel.string = Utils.Number.format(itemData.experience || itemData.score);
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
