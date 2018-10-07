var Url = require('Url'),
    TabView = require('TabView'),
    AuthUser = require('AuthUser'),
    UiManager = require('UiManager'),
    NetworkManager = require('NetworkManager'),
    MessageBoxCache = require('MessageBoxCache'),
    EventDispatcher = require('EventDispatcher'),
    EventDispatcherConstant = require('EventDispatcherConstant');

cc.Class({
    extends: cc.Component,

    properties: {
        itemMessageDetailPrefab: cc.Prefab,
        messageTabView: TabView,

        itemInboxPrefab: cc.Prefab,
        ongoingContainerNode: cc.Node,

        itemSentPrefab: cc.Prefab,
        outgoingContainerNode: cc.Node,

        userToEditBox: cc.EditBox,
        contentEditBox: cc.EditBox,
        titleEditBox: cc.EditBox,
    },

    // use this for initialization
    onLoad: function () {
        this.clearMessageEditor();
        this.itemMessageDetailNode = cc.instantiate(this.itemMessageDetailPrefab);
    },

    fetchMessages: function (typeMessage, itemPrefab, containerNode) {
        var that = this;
        // type: 'ongoing', 'outgoing'
        NetworkManager.Http.fetch('GET', Url.Http.MESSAGE_BOX, {
                username: AuthUser.username,
                accesstoken: AuthUser.accesstoken,
                type: typeMessage
            }, {
                delay: 500
            })
            .success(function (respDone) {
                var i, messages,
                    keyStorage = 'mess_' + typeMessage;
                MessageBoxCache.addMessages(keyStorage, respDone.data);
                messages = MessageBoxCache.getMessages(keyStorage);
                containerNode.removeAllChildren();
                for (i = 0; i < messages.length; i += 1) {
                    that._initMessageNode(itemPrefab, containerNode, messages[i], keyStorage);
                }
                if (typeMessage === 'ongoing') {
                    AuthUser.unread_mess_count = 0;
                    EventDispatcher.dispatchEvent(EventDispatcherConstant.PROFILE.UPDATE_UNREAD_MESS_COUNT);
                }
            });
    },

    _initMessageNode: function (itemPrefab, containerNode, msgData, keyStorage) {
        var that = this,
            itemInbox = cc.instantiate(itemPrefab);
        containerNode.addChild(itemInbox);
        itemInbox.getComponent('ItemMessage').updateData(msgData, keyStorage);
        itemInbox.on(cc.Node.EventType.TOUCH_END, function () {
            if (that.itemMessageDetailNode.parent) {
                that.itemMessageDetailNode.removeFromParent(false);
            }
            containerNode.parent.addChild(that.itemMessageDetailNode);
            var itemMessageComp = that.itemMessageDetailNode.getComponent('ItemMessage');
            if (!msgData.body) {
                NetworkManager.Http.fetch('GET', Url.Http.DETAIL_MESSAGE_BOX, {
                    username: AuthUser.username,
                    message_id: msgData.msgid,
                    accesstoken: AuthUser.accesstoken,
                }).success(function (respDone) {
                    itemMessageComp.updateData(respDone.data, keyStorage);
                    MessageBoxCache.updateMessage(keyStorage, respDone.data);
                });
            }
            else {
                itemMessageComp.updateData(msgData, keyStorage);
            }
            itemMessageComp.deleteMessage = function () {
                UiManager.openConfirmModal('Bạn có chắc muốn xóa tin nhắn này không?', {
                    oke_fn: function () {
                        MessageBoxCache.removeMessage(keyStorage, msgData.msgid);
                        itemInbox.removeFromParent();
                        itemMessageComp.closeDetailMessage();
                    }
                });
            };
            itemMessageComp.replyToUser = function () {
                that.userToEditBox.string = this.userLabel.string;
                that.messageTabView.activeByName('MessEditor');
                this.closeDetailMessage();
            };
            itemMessageComp.closeDetailMessage = function () {
                that.itemMessageDetailNode.runAction(cc.sequence([cc.fadeOut(0.1),
                    cc.callFunc(function () {
                        that.itemMessageDetailNode.removeFromParent(false);
                    })
                ]));
            };
            that.itemMessageDetailNode.runAction(cc.fadeIn(0.1));
        }, itemInbox);
    },

    fetchOnGoingMessages: function () {
        this.fetchMessages('ongoing', this.itemInboxPrefab, this.ongoingContainerNode);
    },

    fetchOutGoingMessages: function () {
        this.fetchMessages('outgoing', this.itemSentPrefab, this.outgoingContainerNode);
    },

    sendMessage: function (event) {
        if (this.titleEditBox.string === '' || this.contentEditBox.string === '' || this.userToEditBox.string === '') {
            UiManager.openModal('Bạn cần nhập đầy đủ thông tin gửi.');
        }
        else {
            if (this.userToEditBox.string === AuthUser.username) {
                UiManager.openModal('Tên người nhận không hợp lệ.');
                return;
            }
            var that = this;
            var toUser = this.userToEditBox.string,
                subjectInput = this.titleEditBox.string,
                bodyInput = this.contentEditBox.string;
            NetworkManager.Http.fetch('POST', Url.Http.MESSAGE_BOX, {
                    from_user: AuthUser.username,
                    to_user: toUser,
                    subject: subjectInput,
                    body: bodyInput,
                    accesstoken: AuthUser.accesstoken
                })
                .success(function () {
                    that.clearMessageEditor();
                    that.messageTabView.activeByName('Sent');
                    // UiManager.openModal('Bạn đã gửi tin nhắn thành công.');
                })
                .setWaitingButton(event.target);
        }
    },

    clearMessageEditor: function () {
        this.titleEditBox.string = '';
        this.userToEditBox.string = '';
        this.contentEditBox.string = '';
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
