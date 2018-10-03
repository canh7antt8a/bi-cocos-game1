var PlatformImplement = require('PlatformImplement'),
    NetworkManager = require('NetworkManager'),
    GameConstant = require('GameConstant'),
    LoginCache = require('LoginCache'),
    UiManager = require('UiManager'),
    SysConfig = require('SysConfig'),
    AuthUser = require('AuthUser'),
    Utils = require('Utils'),
    Url = require('Url');

var LOGIN_WAIT_TIMEOUT = 10000;

cc.Class({
    extends: cc.Component,

    properties: {
        usernameEditBox: cc.EditBox,
        passwordEditBox: cc.EditBox,
        txtLog: cc.Label,
        loginForm: cc.Node,
        registerForm: cc.Node,
        usernameEditBoxRegister: cc.EditBox,
        passEditBoxRegister: cc.EditBox,
        repassEditBoxRegister: cc.EditBox,
        emailEditBoxRegister: cc.EditBox,
        emailForgotPassword: cc.EditBox,
        forgotPasswordBox: cc.Node,

        loginWaitNode: cc.Node,

        capchaLogin: cc.Label,
        capchaRegister: cc.Label,
        capchaEditBoxLogin: cc.EditBox,
        capchaEditBoxRegister: cc.EditBox,
        capchaRegisterNode: cc.Node,
        capChaLoginNode: cc.Node,
        socialLoginNode: cc.Node,
    },

    // use this for initialization
    onLoad: function () {
        this.canClickButtonLogin = true;
        this.canClickButtonRegister = true;
        var authData = LoginCache.get();
        if (authData.username) {
            this.usernameEditBox.string = authData.username;
            this.passwordEditBox.string = authData.password;
            // this.onLoginClick();
        }

        // back key event
        Utils.EventManager.onKeyReleased(cc.KEY.back, this.node, function () {
            UiManager.openConfirmModal('Bạn có chắc muốn thoát khỏi game không?', {
                oke_fn: function () {
                    cc.game.end();
                }
            });
        });

        // Support capcha
        this.hasCapcha = this.capChaLoginNode && this.capchaRegister && this.capchaEditBoxLogin && this.capchaEditBoxRegister && this.capchaRegisterNode;

        // Native Login Event
        if (this.hasCapcha) {
            this.resetCapcha();
            this.canSocialLoginClick = true;
            PlatformImplement.eventDispatcher.addEventListener(PlatformImplement.Event.GOOGLE_LOGIN_SUCCESS, this._onGoogleLoginSuccess, this);
            PlatformImplement.eventDispatcher.addEventListener(PlatformImplement.Event.FACEBOOK_LOGIN_SUCCESS, this._onFacebookLoginSuccess, this);
            PlatformImplement.eventDispatcher.addEventListener(PlatformImplement.Event.FACEBOOK_LOGIN_FAIL, this._onFacebookLoginFail, this);
            PlatformImplement.eventDispatcher.addEventListener(PlatformImplement.Event.GOOGLE_LOGIN_FAIL, this._onGoogleLoginFail, this);

            // Capcha
            this.isAndroidPlatform = SysConfig.PLATFORM === 'ANDROID';
            var capchaEnable = this.isAndroidPlatform && GameConstant.LOGIN.capchaEnable;
            this.capChaLoginNode.active = capchaEnable;
            this.capchaRegisterNode.active = capchaEnable;
            this.socialLoginNode.active = !capchaEnable;
        }

        PlatformImplement.AppEventsLogger.logOpenLoginForm();
    },

    onDestroy: function () {
        if (this.hasCapcha) {
            this.canSocialLoginClick = true;
            PlatformImplement.eventDispatcher.removeEventListener(PlatformImplement.Event.GOOGLE_LOGIN_SUCCESS, this._onGoogleLoginSuccess, this);
            PlatformImplement.eventDispatcher.removeEventListener(PlatformImplement.Event.FACEBOOK_LOGIN_SUCCESS, this._onFacebookLoginSuccess, this);
            PlatformImplement.eventDispatcher.removeEventListener(PlatformImplement.Event.FACEBOOK_LOGIN_FAIL, this._onFacebookLoginFail, this);
            PlatformImplement.eventDispatcher.removeEventListener(PlatformImplement.Event.GOOGLE_LOGIN_FAIL, this._onGoogleLoginFail, this);
        }
    },

    resetCapcha: function () {
        if (this.hasCapcha) {
            this.capchaLogin.string = this.genCapcha();
            this.capchaRegister.string = this.genCapcha();
        }
    },

    onLoginClick: function (event) {
        var self = this;
        var username = this.usernameEditBox.string,
            password = this.passwordEditBox.string,
            capcha = this.hasCapcha ? this.capchaEditBoxLogin.string : false,
            fetchHandler, that = this;

        if (username && password && this.canClickButtonLogin) {
            // Capcha check
            if (GameConstant.LOGIN.capchaEnable && this.hasCapcha && this.isAndroidPlatform) {
                if (capcha && capcha === this.capchaLogin.string) {}
                else {
                    this.resetCapcha();
                    UiManager.openModal('Xin vui lòng điền chính xác mã xác nhận!');
                    return;
                }
            }
            this.canClickButtonLogin = false;
            fetchHandler = NetworkManager.Http.fetch('POST', Url.Http.USER_LOGIN, {
                    username: username,
                    password: password,
                    game: SysConfig.GAME,
                    platform: SysConfig.PLATFORM,
                    devtoken: PlatformImplement.getDeviceId(),
                })
                .success(function (resp) {
                    LoginCache.set(username, password);
                    that._afterLoginSuccess(resp);
                    self.canClickButtonLogin = true;
                }).error(function () {
                    self.canClickButtonLogin = true;
                });
            if (event) {
                fetchHandler.setWaitingButton(event.target);
            }
        }
        else {
            UiManager.openModal('Xin vui lòng điền tên đăng nhập và mật khẩu!');
        }
    },

    onFacebookLoginClick: function () {
        if (!this.canSocialLoginClick) {
            return;
        }
        this.canSocialLoginClick = false;
        PlatformImplement.Facebook.login();
    },

    onGoogleLoginClick: function () {
        if (!this.canSocialLoginClick) {
            return;
        }
        this.canSocialLoginClick = false;
        PlatformImplement.Google.login();
    },

    onRegisterClick: function (event) {
        var userName = this.usernameEditBoxRegister.string.trim();
        var pass = this.passEditBoxRegister.string;
        var repass = this.repassEditBoxRegister.string,
            capcha = this.hasCapcha ? this.capchaEditBoxRegister.string : false;

        var email = this.emailEditBoxRegister.string.trim();
        if (userName.length === 0 || pass.length === 0 || repass.length === 0 || email.length === 0) {
            UiManager.openModal('Xin vui lòng điền đầy đủ các trường dữ liệu!');
            return;
        }
        if (pass !== repass) {
            UiManager.openModal('Hai mật khẩu bạn điền không giống nhau!');
            return;
        }

        // Request
        var self = this;
        if (this.canClickButtonRegister) {
            // Capcha check
            if (GameConstant.LOGIN.capchaEnable && this.hasCapcha && this.isAndroidPlatform) {
                if (capcha && capcha === this.capchaRegister.string) {}
                else {
                    this.resetCapcha();
                    UiManager.openModal('Xin vui lòng điền chính xác mã xác nhận!');
                    return;
                }
            }

            this.canClickButtonRegister = false;
            var fetchHandler = NetworkManager.Http.fetch('POST', Url.Http.USER_REGISTER, {
                game: SysConfig.GAME,
                devtoken: PlatformImplement.getDeviceId(),
                platform: SysConfig.PLATFORM,
                username: userName,
                password: pass,
                email: email,
                custom: JSON.stringify({
                    'partner_referer': PlatformImplement.getInstallReffer()
                })
            }).
            success(function (resp) {
                self.txtLog.string = 'register success: ';
                LoginCache.set(userName, pass);
                self._afterLoginSuccess(resp);
                self.canClickButtonRegister = true;
            }).
            error(function () {
                self.canClickButtonRegister = true;
            });
            if (event) {
                fetchHandler.setWaitingButton(event.target);
            }
        }
    },

    onForgotPasswordCloseClick: function () {
        this.forgotPasswordBox.active = false;
    },

    onForgotPasswordClick: function () {
        this.forgotPasswordBox.active = true;
    },

    onForgotPasswordConfirmClick: function () {
        if (this.emailForgotPassword.string !== '') {
            cc.log('email ' + this.emailForgotPassword.string.trim());
            NetworkManager.Http.fetch('POST', Url.Http.USER_FORGET_PASSWORD, {
                email: this.emailForgotPassword.string.trim(),
            });
            this.forgotPasswordBox.active = false;
        }
        else {
            UiManager.openWarningMessage('Vui lòng điền email!', 1);
        }
    },

    onBackClick: function () {
        var size = cc.winSize;
        this.registerForm.active = false;
        this.loginForm.y = size.height;
        this.loginForm.active = true;
        this.loginForm.runAction(cc.moveTo(0.5, cc.v2(this.loginForm.x, 0)).easing(cc.easeBackOut()));
    },

    onLoginRegisterClick: function () {
        var size = cc.winSize;
        this.loginForm.active = false;
        this.registerForm.y = size.height;
        this.registerForm.active = true;
        this.registerForm.runAction(cc.moveTo(0.5, cc.v2(this.registerForm.x, 0)).easing(cc.easeBackOut()));
    },

    _onQuickLoginSuccess: function (param, socialname) {
        var that = this;
        NetworkManager.Http.fetch('POST', Url.Http.USER_QUICK_REGISTER, {
            game: SysConfig.GAME,
            devtoken: PlatformImplement.getDeviceId(),
            platform: SysConfig.PLATFORM,
            socialname: socialname,
            socialid: param.id,
            accesstoken: param.token,
            custom: JSON.stringify({
                'partner_referer': PlatformImplement.getInstallReffer()
            })
        }).
        success(function (resp) {
            that.txtLog.string = 'success: ';
            that._afterLoginSuccess(resp);
        });
    },

    _onGoogleLoginSuccess: function (param) {
        // {id: "108286573310282647944", email:"aaa@gmail.com", name: "DG", token: "..."}
        this.canSocialLoginClick = true;
        this.txtLog.string = 'GG Login Success: ' + param.name;
        this._onQuickLoginSuccess(param, 'GOOGLE');
    },

    _onFacebookLoginSuccess: function (param) {
        // {id: "1300734483304268", name: "Đinh Giang", token: "..." }
        this.canSocialLoginClick = true;
        this.txtLog.string = 'FB Login Success: ' + param.name;
        this._onQuickLoginSuccess(param, 'FACEBOOK');
    },

    _onGoogleLoginFail: function () {
        this.canSocialLoginClick = true;
    },

    _onFacebookLoginFail: function () {
        this.canSocialLoginClick = true;
    },

    _displayLoginWait: function () {
        var that = this;
        this.loginWaitNode.active = true;
        this.loginWaitNode.runAction(cc.fadeIn(0.3));
        setTimeout(function () {
            if (that.loginWaitNode) {
                that.loginWaitNode.active = false;
            }
        }, LOGIN_WAIT_TIMEOUT);
    },

    _afterLoginSuccess: function (resp) {
        this.txtLog.string = '_afterLoginSuccess: ';
        this._displayLoginWait();
        AuthUser.updateInfo(resp.data);

        // Register GCM Token
        var pushId = PlatformImplement.getDevicePushToken();
        if (pushId !== null && pushId !== '') {
            NetworkManager.Http.fetch('POST', Url.Http.USER_UPDATE_PUSH_REG_ID, {
                username: AuthUser.username,
                accesstoken: AuthUser.accesstoken,
                devtoken: PlatformImplement.getDeviceId(),
                reg_id: pushId,
                game: SysConfig.GAME
            });
        }

        NetworkManager.Http.fetch('GET', Url.Http.RT_SV_IP, {
                username: AuthUser.username,
                accesstoken: AuthUser.accesstoken,
            })
            .success(function (rtsvipResp) {
                var rtsvipData = rtsvipResp.data,
                    realtimeConfig = rtsvipData.realtime && rtsvipData.realtime[0],
                    host = null,
                    port = null,
                    zone = null,
                    useSSL = false;
                if (realtimeConfig) {
                    zone = realtimeConfig.zone;
                    host = realtimeConfig.ip_address;
                    port = realtimeConfig.port;

                    // for web testing
                    if (cc.sys.isBrowser) {
                        host = realtimeConfig.ws_host;
                        port = realtimeConfig.ws_port;
                    }

                    if (host && port && zone) {
                        NetworkManager.SmartFox.init({
                            host: host,
                            port: port,
                            useSSL: useSSL,
                            zone: zone
                        });
                        NetworkManager.SmartFox.connectAndLogin(resp.data.username, resp.data.accesstoken);
                    }
                }
            });
    },


    randInt: function (min, max) {
        return Math.round(Math.random() * (max - min)) + min;
    },

    randChar: function () {
        var all = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' + '0123456789',
            i = this.randInt(0, all.length);
        var c = all.substring(i, i + 1);
        return c;
    },

    genCapcha: function () {
        var name = '';
        for (var i = 0; i < 4; i += 1) {
            name += this.randChar();
        }
        return name.toUpperCase();
    },
});
