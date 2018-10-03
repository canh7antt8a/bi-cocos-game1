var Url = require('Url'),
    AuthUser = require('AuthUser'),
    UiManager = require('UiManager'),
    NetworkManager = require('NetworkManager'),
    PlatformImplement = require('PlatformImplement');

cc.Class({
    extends: cc.Component,

    properties: {
        shareFacebookNoteLabel: cc.Label,
        inviteFacebookNoteLabel: cc.Label,
        likeFacebookNode: cc.Node,
    },

    // use this for initialization
    onLoad: function () {
        this.loadFacebookSdk();
    },

    loadFacebookSdk: function () {
        this.getShareFacebookInfo();
    },

    getShareFacebookInfo: function () {
        var that = this;
        if (that.shareFacebookInfo) {
            return;
        }
        NetworkManager.Http.fetch('GET', Url.Http.SHARE_FACEBOOK, {
                username: AuthUser.username,
                accesstoken: AuthUser.accesstoken
            }, {
                delay: 500
            })
            .success(function (respDone) {
                var facebookLikeComp = that.likeFacebookNode.getComponent('FacebookLike');

                that.shareFacebookInfo = respDone.data;
                that.shareFacebookNoteLabel.string = respDone.data.note;
                that.inviteFacebookNoteLabel.string = respDone.data.invite_friend.note;
                facebookLikeComp.initLikeButton(respDone.data.like_link);
                facebookLikeComp.onDisable();
            });
    },

    confirmShareFacebook: function () {
        cc.log('confirmShareFacebook');
        cc.log(this.shareFacebookInfo);
        if (!this.shareFacebookInfo) {
            return;
        }
        cc.log(JSON.stringify(this.shareFacebookInfo));
        PlatformImplement.Facebook.share(this.shareFacebookInfo.title, this.shareFacebookInfo.share_link, this.shareFacebookInfo.image_link, this.shareFacebookInfo.title, this.shareFacebookInfo.comment);
        PlatformImplement.eventDispatcher.addEventListener(PlatformImplement.Event.FACEBOOK_SHARE_SUCCESS, _onFacebookShareSuccess, this);

        function _onFacebookShareSuccess() {
            //cc.log(JSON.stringify(param));
            PlatformImplement.eventDispatcher.removeEventListener(PlatformImplement.Event.FACEBOOK_SHARE_SUCCESS, _onFacebookShareSuccess, this);

            // Callback
            NetworkManager.Http.fetch('POST', Url.Http.SHARE_FACEBOOK, {
                    username: AuthUser.username,
                    accesstoken: AuthUser.accesstoken
                }, {})
                .setWaitingButton(event.target);
        }
    },

    confirmSendInviteFacebook: function () {
        cc.log('confirmSendInviteFacebook');
        cc.log(this.shareFacebookInfo);
        if (!this.shareFacebookInfo) {
            return;
        }
        PlatformImplement.Facebook.invite(this.shareFacebookInfo.invite_friend.msg);
        PlatformImplement.eventDispatcher.addEventListener(PlatformImplement.Event.FACEBOOK_INVITE_SUCCESS, _onFacebookInviteSuccess, this);

        function _onFacebookInviteSuccess(param) {
            //cc.log(JSON.stringify(param));
            PlatformImplement.eventDispatcher.removeEventListener(PlatformImplement.Event.FACEBOOK_INVITE_SUCCESS, _onFacebookInviteSuccess, this);

            // Callback
            NetworkManager.Http.fetch('POST', Url.Http.INVITE_FACEBOOK, {
                    username: AuthUser.username,
                    accesstoken: AuthUser.accesstoken,
                    request_id: param.request_id,
                    recipient_ids: param.recipient_ids.join(',')
                }, {})
                .success(function (resp) {
                    UiManager.openModal(resp.msg);
                })
                .setWaitingButton(event.target);
        }
    }
});
