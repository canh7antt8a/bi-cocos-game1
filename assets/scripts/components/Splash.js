var PlatformImplement = require('PlatformImplement'),
    NetworkManager = require('NetworkManager'),
    CommonConstant = require('CommonConstant'),
    GameConstant = require('GameConstant'),
    UiManager = require('UiManager'),
    SysConfig = require('SysConfig'),
    Utils = require('Utils'),
    Url = require('Url');

require('Polyfill');

cc.Class({
    extends: cc.Component,
    properties: {},

    // use this for initialization
    onLoad: function () {
        GameConstant.loadIconsAtlas(function () {
            NetworkManager.Http.fetch('GET', Url.Http.CHECK_VER, {
                    version_code: SysConfig.VERSION_CODE,
                    platform: SysConfig.PLATFORM
                })
                .success(function (resp) {
                    var versionData = resp.data;
                    GameConstant.LOGIN.capchaEnable = versionData.to && versionData.to <= 1;

                    function playGame() {
                        GameConstant.updateIconsServer(versionData.game_icons);
                        GameConstant.updateGamePriorities(versionData.game_priorities);
                        Utils.Director.loadScene(CommonConstant.Scene.LOGIN);
                    }

                    function updateGame() {
                        if (versionData.download_link) {
                            if (versionData.download_link[0] === 'a') {
                                UiManager.openPopupHotUpdate(versionData.download_link.slice(1), playGame);
                            }
                            else {
                                PlatformImplement.openWebUrl(versionData.download_link);
                            }
                        }
                    }

                    if (versionData.force_update === 1) {
                        UiManager.openModal('Đã có phiên bản trò chơi mới hơn. Vui lòng cập nhật để chơi tiếp!', {
                            close_fn: updateGame
                        });
                    }
                    else if (versionData.force_update === 2) {
                        UiManager.openConfirmModal('Đã có phiên bản trò chơi mới hơn. Bạn có muốn cập nhật?', {
                            oke_fn: updateGame,
                            cancel_fn: playGame
                        });
                    }
                    else {
                        playGame();
                    }
                });

            // preload
            [GameConstant.MINI_POKER.MINIGAME_PREFAB].forEach(function (res) {
                cc.loader.loadRes(res);
            });
        });

        // back key event
        Utils.EventManager.onKeyReleased(cc.KEY.back, this.node, function () {
            UiManager.openConfirmModal('Bạn có chắc muốn thoát khỏi game không?', {
                oke_fn: function () {
                    cc.game.end();
                }
            });
        });
    },
});
