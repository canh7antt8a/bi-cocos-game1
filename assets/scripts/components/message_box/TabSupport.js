var PlatformImplement = require('PlatformImplement'),
    NetworkManager = require('NetworkManager'),
    UiManager = require('UiManager'),
    AuthUser = require('AuthUser'),
    Url = require('Url');

cc.Class({
    extends: cc.Component,

    properties: {
        mobileLabel: cc.Label,
        fbPageLabel: cc.Label,

        titleEditBox: cc.EditBox,
        contentEditBox: cc.EditBox,
    },

    fetchContactInfo: function () {
        var that = this;
        NetworkManager.Http.fetch('GET', Url.Http.CONTACT_INFO, {}, {
                cache: 1800
            })
            .success(function (respContact) {
                that.contactInfo = respContact.data;
                that.mobileLabel.string = respContact.data.mobile;
                that.fbPageLabel.string = respContact.data.fb_page;
            });
    },

    callHotline: function () {
        if (this.contactInfo) {
            PlatformImplement.callNumberPhone(this.contactInfo.mobile);
        }
    },

    openFacebookPage: function () {
        if (this.contactInfo) {
            PlatformImplement.openWebUrl(this.contactInfo.fb_page);
        }
    },

    sendFeedback: function (event) {
        var self = this,
            title = this.titleEditBox.string,
            body = this.contentEditBox.string;
        if (this.titleEditBox.string === '' || this.contentEditBox.string === '') {
            UiManager.openModal('Bạn cần nhập đầy đủ thông tin gửi.');
        }
        else {
            NetworkManager.Http.fetch('POST', Url.Http.FEEDBACK, {
                    accesstoken: AuthUser.accesstoken,
                    username: AuthUser.username,
                    subject: title,
                    content: body
                })
                .success(function () {
                    self.clearInputFeedback();
                    UiManager.openModal('Bạn đã gửi phản hồi thành công.');
                })
                .setWaitingButton(event.target);
        }
    },

    clearInputFeedback: function () {
        this.contentEditBox.string = '';
        this.titleEditBox.string = '';
    },

    // use this for initialization
    onLoad: function () {
        this.clearInputFeedback();
    },

});
