var NetworkManager = require('NetworkManager'),
    CommonConstant = require('CommonConstant'),
    Modal = require('Modal'),
    Url = require('Url');

cc.Class({
    extends: Modal,

    properties: {
        content: {
            'default': null,
            type: cc.RichText,
            override: true
        }
    },

    // use this for initialization
    // onLoad: function () {

    // },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    init: function (gameId) {
        if (gameId >= 0) {
            var self = this;

            NetworkManager.Http.fetch('GET', Url.Http.GAME_HELP, {
                    game_id: gameId
                }, {
                    cache: 3600,
                    delay: 500
                })
                .success(function (resp) {
                    if (!self.isValid) {
                        return;
                    }

                    var scrollViewComp = self.node.getComponentInChildren(cc.ScrollView);
                    if (scrollViewComp) {
                        scrollViewComp.scrollToTop();
                    }

                    var msg = 'Chưa có hướng dẫn.';
                    if (resp.data) {
                        msg = resp.data.content || msg;
                    }
                    if (msg) {
                        msg = CommonConstant.CurrencyType.normalize(msg);
                    }
                    self.content.string = msg;
                });
        }
    },
});
