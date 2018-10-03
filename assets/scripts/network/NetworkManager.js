var Md5 = require('Md5'),
    IplayHttp = require('IplayHttp'),
    SysConfig = require('SysConfig'),
    UiManager = require('UiManager'),
    SmartFox = require('SmartFox'),
    EventDispatcher = require('EventDispatcher'),
    PlatformImplement = require('PlatformImplement'),
    EventDispatcherConstant = require('EventDispatcherConstant');

var httpConfig = SysConfig.IplayHttp;

IplayHttp.init(httpConfig.HOST, httpConfig.PORT, httpConfig.PROTOCOL,
    httpConfig.AUTH_USER, httpConfig.AUTH_PASS);

IplayHttp.addInterceptor({
    request: function (method, path, params) {
        // auto add 'cp' param to every request
        params.cp = SysConfig.CP;
        if (params.devtoken) {
            params.hash_devtoken = 'N:' + Md5(params.devtoken + ':Lksdf$%2ksd@kKd');
        }
    },
    response: function (xhr) {
        if (xhr.status >= 200 && xhr.status < 400) {
            var antidosUrl = xhr.getResponseHeader('AntiDos');
            if (antidosUrl) {
                UiManager.openModal('Bạn vui lòng xác thực để có thể tiếp tục chơi game!', {
                    close_fn: function () {
                        PlatformImplement.openWebUrl(antidosUrl);
                    }
                });
            }
            else if (xhr.responseJson) {
                if (xhr.responseJson.status === 30) {
                    UiManager.openConfirmModal('Phiên đăng nhập của bạn đã hết hạn. Bạn có muốn thoát ra để đăng nhập lại không?', {
                        oke_fn: function () {
                            PlatformImplement.returnLoginPage();
                        }
                    });
                }
                else if (xhr.responseJson.status === 33) {
                    UiManager.openConfirmModal(xhr.responseJson.msg, {
                        oke_fn: function () {
                            PlatformImplement.guiTinNhan(xhr.responseJson.extra_data.number,
                                xhr.responseJson.extra_data.syntax);
                        }
                    });
                }
                else if (xhr.responseJson.status !== 1) {
                    UiManager.openModal(xhr.responseJson.msg);
                }
            }
        }
        else {
            UiManager.openModal('Lỗi ' + xhr.status + ': ' + xhr.statusText);
        }
    }
});

EventDispatcher.addEventListener(EventDispatcherConstant.AUTH.LOGOUT, function () {
    IplayHttp.resetCache();
});

module.exports = {
    Http: IplayHttp,
    SmartFox: SmartFox
};
