var CommonConstant = require('CommonConstant');

cc.Class({
    extends: cc.Component,

    properties: {
        titleLabel: cc.Label,
        contentLabel: cc.Label,
        timeLabel: cc.Label,
        eventTypeNode: cc.Node,
        fromToLabel: cc.Label,
    },

    // use this for initialization
    onLoad: function () {

    },

    closeDetailMessage: function () {
        // not implement, let other hook
    },

    updateData: function (item) {
        this.item = item;
        this.titleLabel.string = CommonConstant.CurrencyType.normalize(item.subject);
        this.eventTypeNode.active = item.event_type === 'NEW' ? true : false;
        if (this.contentLabel) {
            this.contentLabel.string = CommonConstant.CurrencyType.normalize(item.content);
        }
        if (this.timeLabel) {
            this.timeLabel.string = item.created_time.replace(' ', '\n');
        }
        if (this.fromToLabel) {
            this.fromToLabel.string = 'Từ ngày ' + item.from_time + ' đến ngày ' + item.to_time;
        }
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
