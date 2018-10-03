cc.Class({
    extends: cc.Component,

    properties: {
        nameLabel: cc.Label,
        ratioLabel: cc.Label,
    },

    // use this for initialization
    onLoad: function () {},

    updateData: function (item) {
        this.nameLabel.string = item.name;
        this.ratioLabel.string = item.ratio;
    }
});
