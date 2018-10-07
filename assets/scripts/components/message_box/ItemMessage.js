var MessageBoxCache = require('MessageBoxCache'),
    CommonConstant = require('CommonConstant');

cc.Class({
    extends: cc.Component,

    properties: {
        timeLabel: cc.Label,
        indexLabel: cc.Label,
        titleLabel: cc.Label,
        userLabel: cc.Label,
        contentLabel: cc.Label,
        deleteButton: cc.Button,
    },

    // use this for initialization
    onLoad: function () {},

    deleteMessage: function () {
        // not implement, let other hook
    },

    replyToUser: function () {
        // not implement, let other hook
    },

    closeDetailMessage: function () {
        // not implement, let other hook
    },

    updateData: function (message, keyStorage) {
        var user_key = keyStorage.indexOf('ongoing') > 0 ? 'from' : 'to';
        this.keyStorage = keyStorage;
        this.messageId = message.msgid;
        this.titleLabel.string = message.subject;
        this.userLabel.string = message[user_key];

        if (this.deleteButton) {
            this.deleteButton.node.active = user_key === 'to' ? false : true;
        }
        if (this.contentLabel) {
            this.timeLabel.string = message.created_time;
            if (message.body) {
                this.contentLabel.string = CommonConstant.CurrencyType.normalize(message.body);
            }
            else {
                this.contentLabel.string = '';
            }
        }
        else {
            this.timeLabel.string = message.created_time.replace(' ', '\n');
        }
        this.indexLabel.string = MessageBoxCache.getIndexMessage(keyStorage, message.msgid) + 1;
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
