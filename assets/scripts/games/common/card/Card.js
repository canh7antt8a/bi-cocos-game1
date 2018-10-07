var Utils = require('Utils'),
    CardRank = require('CardRank'),
    CardSuit = require('CardSuit');

module.exports = Utils.Class({

    $$constructor: function (rank, suit) {
        this.rank = rank;
        this.suit = suit;
    },

    $$static: {
        fromId: function (cardId) {
            var rankId = Math.floor(cardId / 4),
                suitId = cardId % 4,
                rank = CardRank.findById(rankId),
                suit = CardSuit.findById(suitId);
            return new this(rank, suit);
        }
    },

    getId: function () {
        return 4 * this.rank.ID + this.suit.ID;
    },

    toString: function () {
        return this.rank.NAME + this.suit.NAME;
    }

});
