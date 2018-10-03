var Url = require('Url'),
    GameConstant = require('GameConstant'),
    NetworkManager = require('NetworkManager');

cc.Class({
    extends: cc.Component,

    properties: {
        lblTextHelp: cc.Label,
        scrollView: cc.ScrollView
    },

    onLoad: function () {
        this.scrollView.node.active = false;
        NetworkManager.Http.fetch('GET', Url.Http.GAME_HELP, {
                game_id: GameConstant.MINI_POKER.ID
            }, {
                cache: 900,
                delay: 500,
            })
            .success(function (results) {
                if (results) {
                    if (!this.isValid) {
                        return;
                    }

                    this.scrollView.node.active = true;
                    this.lblTextHelp.string = results.data.content;
                }
            }.bind(this));
    },
});
