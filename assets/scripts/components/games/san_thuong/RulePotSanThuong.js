cc.Class({
    extends: cc.Component,

    properties: {
        lblRatio: {
            'default': [],
            type: cc.Label,
        },
    },

    // use this for initialization
    onLoad: function() {

    },

    setRatio: function(object) {
        for (var i = 0; i < object.awards.length; i += 1) {
            if (i <= this.lblRatio.length) {
                this.lblRatio[i].string = object.awards[i].number + ' x ' + object.awards[i].ratio;
            }
        }
    },
});
