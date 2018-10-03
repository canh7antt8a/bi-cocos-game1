var EventDispatcher = require('EventDispatcher'),
    CommonConstant = require('CommonConstant'),
    LoginCache = require('LoginCache'),
    UiManager = require('UiManager'),
    Base64 = require('Base64'),
    Utils = require('Utils'),
    NetworkManager;

var PlatformImplement = {
    eventDispatcher: EventDispatcher.create(),

    Event: {
        GOOGLE_LOGIN_SUCCESS: 'PlatformImplement.event.GOOGLE_LOGIN_SUCCESS',
        GOOGLE_LOGIN_FAIL: 'PlatformImplement.event.GOOGLE_LOGIN_FAIL',

        FACEBOOK_LOGIN_SUCCESS: 'PlatformImplement.event.FACEBOOK_LOGIN_SUCCESS',
        FACEBOOK_LOGIN_FAIL: 'PlatformImplement.event.FACEBOOK_LOGIN_FAIL',
        FACEBOOK_SHARE_SUCCESS: 'PlatformImplement.event.FACEBOOK_SHARE_SUCCESS',
        FACEBOOK_INVITE_SUCCESS: 'PlatformImplement.event.FACEBOOK_INVITE_SUCCESS',

        AVATAR_GET_DATA_SUCCESS: 'PlatformImplement.event.AVATAR_GET_DATA_SUCCESS',

        IAP_PURCHASE_SUCCESS: 'PlatformImplement.event.IAP_PURCHASE_SUCCESS',
        IAP_PURCHASE_FAIL: 'PlatformImplement.event.IAP_PURCHASE_FAIL',
    },

    Utils: {
        log: function (message) {
            if (cc.sys.os === cc.sys.OS_ANDROID) {
                jsb.reflection.callStaticMethod('org/cocos2dx/javascript/AppActivity', 'NativeLog', '(Ljava/lang/String;)V', '\'' + message + '\'');
            }
            else {
                cc.log(message);
            }
        },
    },

    Avatar: {
        openPhoto: function () {
            cc.log('openPhoto ');
            if (cc.sys.os === cc.sys.OS_ANDROID) {
                jsb.reflection.callStaticMethod('org/cocos2dx/javascript/AppActivity', 'OpenPhoto', '()V');
            }
        },

        onGetPhotoSuccess: function (param) {
            //  {name: "name.png", data:"Base64", type: "PNG"}
            param.data = Base64.decode(param.data);
            PlatformImplement.eventDispatcher.dispatchEvent(PlatformImplement.Event.AVATAR_GET_DATA_SUCCESS, param);
        },
    },

    Iap: {
        purchaseId: function (id) {
            if (cc.sys.os === cc.sys.OS_ANDROID) {
                jsb.reflection.callStaticMethod('org/cocos2dx/javascript/AppActivity', 'IapPurchaseId', '(Ljava/lang/String;)V', id);
            }
        },

        onPurchaseFail: function () {
            PlatformImplement.eventDispatcher.dispatchEvent(PlatformImplement.Event.IAP_PURCHASE_FAIL);
        },

        onPurchaseSuccess: function (param) {
            PlatformImplement.eventDispatcher.dispatchEvent(PlatformImplement.Event.IAP_PURCHASE_SUCCESS, param);
        },

        addItem: function (item) {
            if (cc.sys.os === cc.sys.OS_ANDROID) {
                jsb.reflection.callStaticMethod('org/cocos2dx/javascript/AppActivity', 'AddIapItem', '(Ljava/lang/String;)V', item);
            }
        },

        clearItem: function () {
            if (cc.sys.os === cc.sys.OS_ANDROID) {
                jsb.reflection.callStaticMethod('org/cocos2dx/javascript/AppActivity', 'ClearIapItem', '()V');
            }
        },
    },

    Google: {
        login: function () {
            cc.log('Google login');
            if (cc.sys.os === cc.sys.OS_ANDROID) {
                jsb.reflection.callStaticMethod('org/cocos2dx/javascript/AppActivity', 'GoogleLogin', '()V');
            }
        },

        logout: function () {
            cc.log('Google logout');
            if (cc.sys.os === cc.sys.OS_ANDROID) {
                jsb.reflection.callStaticMethod('org/cocos2dx/javascript/AppActivity', 'GoogleLogout', '()V');
            }
        },

        onLoginSuccess: function (param) {
            // {id: "108286573310282647944", email:"aaa@gmail.com", name: "DG", token: "..."}
            PlatformImplement.eventDispatcher.dispatchEvent(PlatformImplement.Event.GOOGLE_LOGIN_SUCCESS, param);
        },

        onLoginFail: function () {
            PlatformImplement.eventDispatcher.dispatchEvent(PlatformImplement.Event.GOOGLE_LOGIN_FAIL);
        },

        onLogoutSuccess: function () {
            cc.log('onGoogleLogoutSuccess');
        },

        onLogoutFail: function () {
            cc.log('onGoogleLogoutFail');
        },

    },

    Facebook: {
        login: function () {
            cc.log('facebook login');
            if (cc.sys.os === cc.sys.OS_ANDROID) {
                jsb.reflection.callStaticMethod('org/cocos2dx/javascript/AppActivity', 'FacebookLogin', '()V');
            }
        },

        logout: function () {
            cc.log('facebook logout');
            if (cc.sys.os === cc.sys.OS_ANDROID) {
                jsb.reflection.callStaticMethod('org/cocos2dx/javascript/AppActivity', 'FacebookLogout', '()V');
            }
        },

        onLoginSuccess: function (param) {
            // {id: "1300734483304268", name: "Đinh Giang", token: "..." }
            PlatformImplement.eventDispatcher.dispatchEvent(PlatformImplement.Event.FACEBOOK_LOGIN_SUCCESS, param);
        },

        onLoginFail: function () {
            cc.log('onFacebookLoginFail');
            PlatformImplement.eventDispatcher.dispatchEvent(PlatformImplement.Event.FACEBOOK_LOGIN_FAIL);
        },

        onLogoutSuccess: function () {
            cc.log('onFacebookLogoutSuccess');
        },

        onLogoutFail: function () {},

        share: function (name, link, picture, caption, description) {
            jsb.reflection.callStaticMethod('org/cocos2dx/javascript/AppActivity', 'FacebookShareLink', '(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V', name, link, picture, caption, description);
        },

        invite: function (message) {
            jsb.reflection.callStaticMethod('org/cocos2dx/javascript/AppActivity', 'FacebookInviteFriend', '(Ljava/lang/String;)V', message);
        },

        onShareSuccess: function (param) {
            PlatformImplement.eventDispatcher.dispatchEvent(PlatformImplement.Event.FACEBOOK_SHARE_SUCCESS, param);
        },

        onInviteSuccess: function (param) {
            PlatformImplement.eventDispatcher.dispatchEvent(PlatformImplement.Event.FACEBOOK_INVITE_SUCCESS, param);
        },
    },

    AppEventsLogger: {
        logEvent: function (eventName, valueToSum, paramsJsonString) {
            valueToSum = valueToSum || 0;
            paramsJsonString = paramsJsonString || '';
            try {
                jsb.reflection.callStaticMethod('org/cocos2dx/javascript/AppActivity', 'LogAppEvent', '(Ljava/lang/String;FLjava/lang/String;)V', eventName, valueToSum, paramsJsonString);
            }
            catch (e) {}
        },

        logOpenLoginForm: function () {
            this.logEvent('open_login');
        },

        logLoginSuccess: function () {
            this.logEvent('af_login');
        },

        logOpenFormPayment: function () {
            this.logEvent('open_form_payment');
        },

        logCloseFormPayment: function () {
            this.logEvent('close_form_payment');
        },

        logPurchaseSuccess: function (amount) {
            this.logEvent('af_purchase', amount);
        },
    },


    // =========================================================================
    // api must implement on every platform
    // =========================================================================
    uploadFile: function (options, callback) {
        var self = this;
        PlatformImplement.Avatar.openPhoto();
        PlatformImplement.eventDispatcher.addEventListener(PlatformImplement.Event.AVATAR_GET_DATA_SUCCESS, onGetAvatarSuccess, self);

        function onGetAvatarSuccess(param) {
            callback({
                fileName: param.name,
                fileType: param.type,
                value: param.data
            });
            PlatformImplement.eventDispatcher.removeEventListener(PlatformImplement.Event.AVATAR_GET_DATA_SUCCESS, onGetAvatarSuccess, self);
        }
    },

    openWebUrl: function (url) {
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod('org/cocos2dx/javascript/AppActivity', 'OpenUrl', '(Ljava/lang/String;)V', url);
        }
    },

    getInstallReffer: function () {
        var ref = '';
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            ref = jsb.reflection.callStaticMethod('org/cocos2dx/javascript/AppActivity', 'GetInstallRef', '()Ljava/lang/String;');
        }
        return ref;
    },

    getDeviceId: function () {
        var deviceId = 'device_id_default';
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            deviceId = jsb.reflection.callStaticMethod('org/cocos2dx/javascript/AppActivity', 'GetDeviceId', '()Ljava/lang/String;');
        }
        return deviceId;
    },

    getDevicePushToken: function () {
        var token = '';
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            token = jsb.reflection.callStaticMethod('org/cocos2dx/javascript/AppActivity', 'GetGcmToken', '()Ljava/lang/String;');
        }
        return token;
    },

    getNhaMang: function () {
        var carry = '';
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            carry = jsb.reflection.callStaticMethod('org/cocos2dx/javascript/AppActivity', 'GetCarrier', '()Ljava/lang/String;');
        }
        return carry;
    },

    guiTinNhan: function (number, content) {
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod('org/cocos2dx/javascript/AppActivity', 'SendSMS', '(Ljava/lang/String;Ljava/lang/String;)V', number, content);
        }
    },

    callNumberPhone: function (number) {
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod('org/cocos2dx/javascript/AppActivity', 'CallNumberPhone', '(Ljava/lang/String;)V', number);
        }
    },

    returnLoginPage: function () {
        this._disconnectSmartFox();
        Utils.Director.loadScene(CommonConstant.Scene.LOGIN);
    },

    logoutUser: function () {
        LoginCache.remove();
        PlatformImplement.Google.logout();
        PlatformImplement.Facebook.logout();
    },

    displayLogoutMessage: function (msg) {
        UiManager.openModal(msg);
    },

    openLogoutConfirmationModal: function () {
        var self = this;
        UiManager.openConfirmModal('Bạn có chắc muốn thoát khỏi tài khoản này không?', {
            oke_fn: function () {
                self.logoutUser();
                self._disconnectSmartFox();
            }
        });
    },

    _disconnectSmartFox: function () {
        if (!NetworkManager) {
            NetworkManager = require('NetworkManager');
        }
        NetworkManager.SmartFox.disconnect();
    },

    setCursorToHand: function () {

    },

    setCursorToNormal: function () {

    }
};

module.exports = PlatformImplement;
