var UrlImage = require('UrlImage'),
    Utils = require('Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        avatarImage: UrlImage,
        usernameLabel: cc.Label,
        scoreLabel: cc.Label
    },

    // use this for initialization
    onLoad: function () {},

    updateData: function (itemData) {
        var matches = itemData.username.match(/^([^\(]+)\s*(?:\((.*)\)\s*)?$/),
            username = (matches[1] || '').trim(),
            MAX_USERNAME_LENGTH = 13,
            USERNAME_SUFFIX = '...';

        if (username.length > MAX_USERNAME_LENGTH) {
            username = username.substr(0, MAX_USERNAME_LENGTH - USERNAME_SUFFIX.length) + USERNAME_SUFFIX;
        }

        this.avatarImage.loadImage(itemData.avatar);

        this.shortName = username;
        this.longName = itemData.username;

        this.shortScore = Utils.Number.abbreviate(itemData.score);
        this.longScore = Utils.Number.format(itemData.score);

        this.scoreLabelFontSize = this.scoreLabel.fontSize;

        this.useShortInfo();
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    useShortInfo: function () {
        this.usernameLabel.string = this.shortName;

        this.scoreLabel.fontSize = this.scoreLabelFontSize * 0.9;
        this.scoreLabel.string = this.shortScore;
    },

    useLongInfo: function () {
        this.usernameLabel.string = this.longName;

        this.scoreLabel.fontSize = this.scoreLabelFontSize;
        this.scoreLabel.string = this.longScore;
    },
});
