var Utils = require('Utils');

module.exports = Utils.Class({

    $$static: Utils.Object.toConstant({
        SPADE: {
            ID: 0,
            NAME: '♠'
        },
        CLUB: {
            ID: 1,
            NAME: '♣'
        },
        DIAMOND: {
            ID: 2,
            NAME: '♦'
        },
        HEART: {
            ID: 3,
            NAME: '♥'
        },

        findById: function (rankId) {
            return Utils.Object.findObject(this, 'ID', rankId);
        },
    })

});
