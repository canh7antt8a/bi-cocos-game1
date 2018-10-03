var EventDispatcher = require('EventDispatcher'),
    CommonConstant = require('CommonConstant'),
    AuthUser = require('AuthUser'),
    SysConfig = require('SysConfig'),
    AudioManager = require('AudioManager'),
    UiManager;

UiManager = {
    _CONFIRM_MODALS: {},

    openModal: function(message, settings) {
        if (message) {
            cc.loader.loadRes('Modal', function(err, prefab) {
                var newNode = cc.instantiate(prefab);
                newNode.zIndex = CommonConstant.ZINDEX.MODAL;
                var comp = newNode.getComponent('Modal');
                comp.content.string = message;
                cc.game.addPersistRootNode(newNode);
                settings = settings || {};
                if (settings.close_fn) {
                    comp.closeCallback = settings.close_fn;
                }
            });
        }
    },

    openConfirmModal: function(message, settings) {
        if (message) {
            settings = settings || {};
            var node = this._CONFIRM_MODALS && this._CONFIRM_MODALS[message],
                self = this;
            if (node && node.isValid) {
                return;
            }
            self._CONFIRM_MODALS[message] = {
                isValid: true
            };
            cc.loader.loadRes('ConfirmModal', function(err, prefab) {
                var newNode = cc.instantiate(prefab);
                newNode.zIndex = CommonConstant.ZINDEX.MODAL;
                var modalComp = newNode.getComponent('Modal'),
                    comp = newNode.getComponent('ConfirmModal');
                modalComp.content.string = message;
                if (settings.oke_fn) {
                    comp.okeCallback = settings.oke_fn;
                }
                if (settings.cancel_fn) {
                    comp.cancelCallback = settings.cancel_fn;
                }
                if (settings.isPersistent) {
                    cc.game.addPersistRootNode(newNode);
                }
                else {
                    cc.director.getScene().addChild(newNode);
                }

                self._CONFIRM_MODALS[message] = newNode;
            });
        }
    },

    openModalByName: function(modalName, callback, options) {
        var that = this,
            key = this._generateModalName(modalName),
            node = this[key];
        if (node && node.isValid) {
            // not open if exists
            if (callback) {
                try {
                    callback(node);
                }
                catch (e) {}
            }
            return;
        }
        this[key] = {
            isValid: true
        };
        cc.loader.loadRes(modalName, function(err, prefab) {
            var newNode = cc.instantiate(prefab);
            options = options || {};
            if (options.isPersistent) {
                cc.game.addPersistRootNode(newNode);
            }
            else {
                cc.director.getScene().addChild(newNode);
            }
            that[key] = newNode;
            if (callback) {
                try {
                    callback(newNode);
                }
                catch (e) {}
            }
        });
    },

    destroyModalByName: function(modalName) {
        var key = this._generateModalName(modalName),
            node = this[key];
        if (node) {
            node.destroy();
        }
        delete this[key];
    },

    openWebView: function(url, title, callback) {
        this.openModalByName('WebView', function(newNode) {
            var params = 'username=' + AuthUser.username + '&accesstoken=' + AuthUser.accesstoken + '&cp=' + SysConfig.CP;
            url += (url.indexOf('?') > 0 ? '&' : '?') + params;
            newNode.getComponentInChildren(cc.WebView).url = url;
            newNode.getComponentInChildren(cc.Label).string = title || 'WebView';
            if (callback) {
                try {
                    callback();
                }
                catch (e) {}
            }
        });
    },

    openPopupHotUpdate: function(downloadUrl, closeCallback) {
        this.openModalByName('HotUpdate', function (newNode) {
            if (closeCallback) {
                var hotUpdateComp = newNode.getComponent('HotUpdate');
                newNode.getComponent('Modal').closeCallback = closeCallback;
                hotUpdateComp.updateDownloadUrl(downloadUrl);
                hotUpdateComp.hotUpdate();
            }
        });
    },

    openNapXienModal: function() {
        this.openModalByName('NapXien');
    },

    openProfileModal: function() {
        this.openModalByName('Profile');
    },

    openTopUsersModal: function() {
        this.openModalByName('TopUsers');
    },

    openPopupMessageBox: function() {
        this.openModalByName('MessageBox');
    },

    openPopupDoiThuong: function() {
        this.openModalByName('DoiThuong');
    },

    openPopupEvent: function(eventId) {
        this.openModalByName('Event', function(newNode) {
            newNode.getComponent('Event').openEventId = eventId;
        });
    },

    openPopupHotEvent: function() {
        this.openModalByName('HotEvent', {
            isPersistent: true
        });
    },

    openPopupDaiLy: function() {
        this.openModalByName('DaiLy');
    },

    openPopupKiemXu: function() {
        this.openModalByName('KiemXu');
    },

    openPopupSettings: function() {
        this.openModalByName('Settings');
    },

    openHelpModal: function(message, options) {
        if (message) {
            options = options || {};
            cc.loader.loadRes('HelpModal', function(err, prefab) {
                var newNode = cc.instantiate(prefab);
                setTimeout(function() {
                    var modalComp = newNode.getComponent('Modal'),
                        scrollViewComp = newNode.getComponentInChildren(cc.ScrollView);
                    if (scrollViewComp) {
                        scrollViewComp.scrollToTop();
                    }
                    modalComp.content.string = message;
                }, options.delay || 0);
                cc.director.getScene().addChild(newNode);
            });
        }
    },

    openWarningMessage: (function() {
        var eventListened = false,
            prefabNode;

        function open(message, duration, useBackdrop) {
            if (!eventListened) {
                eventListened = true;
                // clear warning message
                cc.director.on(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function() {
                    if (prefabNode) {
                        var comp = prefabNode.getComponent('WarningMessage');
                        comp.closeImmediately();
                    }
                });
            }

            if (prefabNode) {
                var comp = prefabNode.getComponent('WarningMessage'),
                    scene = cc.director.getScene();
                comp.open(message, duration, useBackdrop);
                if (!prefabNode.isChildOf(scene)) {
                    scene.addChild(prefabNode);
                }
                AudioManager.instance.playError();
            }
        }

        return function(message, duration, useBackdrop) {
            if (message) {
                if (!prefabNode) {
                    cc.loader.loadRes('WarningMessage', function(err, prefab) {
                        if (!prefabNode) {
                            prefabNode = cc.instantiate(prefab);
                            cc.game.addPersistRootNode(prefabNode);
                        }
                        open(message, duration, useBackdrop);
                    });
                }
                else {
                    open(message, duration, useBackdrop);
                }
            }
        };
    }()),

    _generateModalName: function(modalName) {
        return '$_modal_' + modalName;
    }
};

// open popup message
EventDispatcher.addEventListener(CommonConstant.PushMessageType.POPUP.EVENT, function(params) {
    UiManager.openModal(params && params.content);
});

module.exports = UiManager;
