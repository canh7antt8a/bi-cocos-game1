var Utils = require('Utils');

module.exports = Utils.Class({

    $$static: Utils.Object.toConstant({
        ACE: {
            ID: 0,
            NAME: 'A'
        },
        TWO: {
            ID: 1,
            NAME: '2'
        },
        THREE: {
            ID: 2,
            NAME: '3'
        },
        FOUR: {
            ID: 3,
            NAME: '4'
        },
        FIVE: {
            ID: 4,
            NAME: '5'
        },
        SIX: {
            ID: 5,
            NAME: '6'
        },
        SEVEN: {
            ID: 6,
            NAME: '7'
        },
        EIGHT: {
            ID: 7,
            NAME: '8'
        },
        NINE: {
            ID: 8,
            NAME: '9'
        },
        TEN: {
            ID: 9,
            NAME: '10'
        },
        JACK: {
            ID: 10,
            NAME: 'J'
        },
        QUEEN: {
            ID: 11,
            NAME: 'Q'
        },
        KING: {
            ID: 12,
            NAME: 'K'
        },

        findById: function (rankId) {
            return Utils.Object.findObject(this, 'ID', rankId);
        },
    })

});
