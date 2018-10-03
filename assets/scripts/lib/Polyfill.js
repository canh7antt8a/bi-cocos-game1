var ccDirectorPreloadScene = cc.director.preloadScene,
    ccDirectorLoadScene = cc.director.loadScene,
    // ccNodeGetChildByNameMethod = cc.Node.prototype.getChildByName,
    ccLoaderLoadRes = cc.loader.loadRes,
    ccAudioEnginePlay = cc.audioEngine.play,
    ccAnimationPlay = cc.Animation.prototype.play,
    ccAnimationStop = cc.Animation.prototype.stop,
    // TabView = require('TabView'),
    // tabViewActiveByName = TabView.prototype.activeByName,
    GameConstant = require('GameConstant'),
    gameConstantGetIconSpriteFrame = GameConstant.getIconSpriteFrame,
    // namesInsideSceneOrPrefab = {},
    scenes = {},
    resources = {},
    audios = {},
    animations = {},
    atlasIconGame = {},
    imageBitsMapping = {},
    isModifiedImage = Object.keys(imageBitsMapping).length > 0,
    isModifiedJson = false;

// cc.Node.prototype.getChildByName = function () {
//     var name = arguments[0],
//         newName = namesInsideSceneOrPrefab[name] || name,
//         args = Array.prototype.slice.call(arguments);
//     args[0] = newName;
//     return ccNodeGetChildByNameMethod.apply(this, args) || (newName !== name ? ccNodeGetChildByNameMethod.apply(this, arguments) : null);
// };

cc.director.preloadScene = function () {
    var name = arguments[0],
        newName = scenes[name] || name,
        args = Array.prototype.slice.call(arguments);
    args[0] = newName;
    return ccDirectorPreloadScene.apply(this, args);
};

cc.director.loadScene = function () {
    var name = arguments[0],
        newName = scenes[name] || name,
        args = Array.prototype.slice.call(arguments);
    args[0] = newName;
    return ccDirectorLoadScene.apply(this, args);
};

cc.loader.loadRes = function () {
    var name = arguments[0],
        newName = resources[name] || name,
        args = Array.prototype.slice.call(arguments);
    args[0] = newName;
    return ccLoaderLoadRes.apply(this, args);
};

cc.audioEngine.play = function () {
    var name = arguments[0],
        newName = audios[name] || name,
        args = Array.prototype.slice.call(arguments);
    args[0] = newName;
    return ccAudioEnginePlay.apply(this, args);
};

cc.Animation.prototype.play = function () {
    var name = arguments[0],
        newName = animations[name] || name,
        args = Array.prototype.slice.call(arguments);
    args[0] = newName;
    return ccAnimationPlay.apply(this, args);
};

cc.Animation.prototype.stop = function () {
    var name = arguments[0],
        newName = animations[name] || name,
        args = Array.prototype.slice.call(arguments);
    args[0] = newName;
    return ccAnimationStop.apply(this, args);
};

// TabView.prototype.activeByName = function (name) {
//     var newName = namesInsideSceneOrPrefab[name] || name,
//         node;
//     if (newName === name) {
//         return tabViewActiveByName.call(this, name);
//     }

//     node = ccNodeGetChildByNameMethod.call(this.node.getChildByName('Tabs'), name);
//     if (node) {
//         return tabViewActiveByName.call(this, name);
//     }
//     return tabViewActiveByName.call(this, newName);
// };

GameConstant.getIconSpriteFrame = function () {
    var name = arguments[0],
        newName = atlasIconGame[name] || name,
        args = Array.prototype.slice.call(arguments);
    args[0] = newName;
    return gameConstantGetIconSpriteFrame.apply(this, args);
};

if (cc.sys.isNative) {
    var loadImage = function (item, callback) {
        var url = item.url;
        var cachedTex = cc.textureCache.getTextureForKey(url);
        if (cachedTex) {
            if (callback) {
                callback(null, cachedTex);
            }
        }
        else if (url.match(jsb.urlRegExp)) {
            jsb.loadRemoteImg(url, function (succeed, tex) {
                if (succeed) {
                    if (callback) {
                        callback(null, tex);
                    }
                }
                else {
                    if (callback) {
                        callback(new Error('Load image failed: ' + url));
                    }
                }
            });
        }
        else {
            if (isModifiedImage && url.indexOf('res/raw-assets/') === 0) {
                JsbBackend.Utils.loadLocalImage(url, function (succeed, tex) {
                    if (succeed) {
                        if (callback) {
                            callback(null, tex);
                        }
                    }
                    else {
                        if (callback) {
                            callback(new Error('Load image failed: ' + url));
                        }
                    }
                });
            }
            else {
                var addImageCallback = function (tex) {
                    if (tex instanceof cc.Texture2D) {
                        if (callback) {
                            callback(null, tex);
                        }
                    }
                    else {
                        if (callback) {
                            callback(new Error('Load image failed: ' + url));
                        }
                    }
                    jsb.unregisterNativeRef(cc.textureCache, addImageCallback);
                };
                cc.textureCache._addImageAsync(url, addImageCallback);
            }
        }
    };

    cc.loader.addLoadHandlers({
        'png': loadImage
    });

    var downloadText = function (item, callback) {
        var url = item.url,
            result;

        if (isModifiedJson && url.indexOf('res/import/') === 0) {
            result = JsbBackend.Utils.loadJson(url);
        }
        else {
            result = jsb.fileUtils.getStringFromFile(url);
        }

        if (typeof result === 'string' && result) {
            callback(null, result);
        }
        else {
            callback(new Error('Download text failed: ' + url));
        }
    };

    cc.loader.addDownloadHandlers({
        'json': downloadText
    });
}
else {
    // var getBuffer = function (url, callback) {
    //     var req = new XMLHttpRequest();
    //     req.onload = function () {
    //         var buffer = new Uint8Array(req.response),
    //             n = buffer[buffer.byteLength - 1] + 1,
    //             newSize = buffer.byteLength - n,
    //             newBuffer = new Uint8Array(newSize),
    //             b, i;
    //         for (i = 0; i < newSize; i += 1) {
    //             b = buffer[i];
    //             if (i >= 8) {
    //                 b = imageBitsMapping[b];
    //             }
    //             newBuffer[i] = b;
    //         }
    //         if (callback) {
    //             callback(newBuffer);
    //         }
    //     };
    //     req.open('GET', url);
    //     req.responseType = 'arraybuffer';
    //     req.send();
    // };

    // var downloadImage = function (item, callback, isCrossOrigin) {
    //     if (isCrossOrigin === undefined) {
    //         isCrossOrigin = true;
    //     }

    //     var url = item.url + (item.url.indexOf('?') === -1 ? '?' : '&') + '_=' + Date.now(),
    //         img = new Image(),
    //         loadCallback = function () {
    //             img.removeEventListener('load', loadCallback);
    //             img.removeEventListener('error', errorCallback);

    //             if (callback) {
    //                 callback(null, img);
    //             }
    //         },
    //         errorCallback = function () {
    //             img.removeEventListener('load', loadCallback);
    //             img.removeEventListener('error', errorCallback);

    //             if (img.crossOrigin && img.crossOrigin.toLowerCase() === 'anonymous') {
    //                 downloadImage(item, callback, false);
    //             }
    //             else {
    //                 callback('Load image (' + url + ') failed');
    //             }
    //         };

    //     if (isModifiedImage && (url.indexOf('res/raw-assets/') >= 0 || url.indexOf('/assets/') >= 0)) {
    //         getBuffer(url, function (buffer) {
    //             var imgDataSrc = '',
    //                 i;
    //             for (i = 0; i < buffer.byteLength; i += 1) {
    //                 imgDataSrc += String.fromCharCode(buffer[i]);
    //             }
    //             imgDataSrc = 'data:image/png;base64,' + btoa(imgDataSrc);

    //             if (isCrossOrigin && window.location.origin !== 'file://') {
    //                 img.crossOrigin = 'anonymous';
    //             }

    //             if (img.complete && img.naturalWidth > 0) {
    //                 callback(null, img);
    //             }
    //             else {
    //                 img.addEventListener('load', loadCallback);
    //                 img.addEventListener('error', errorCallback);
    //             }
    //             img.src = imgDataSrc;
    //         });
    //     }
    //     else {
    //         if (isCrossOrigin && window.location.origin !== 'file://') {
    //             img.crossOrigin = 'anonymous';
    //         }

    //         if (img.complete && img.naturalWidth > 0) {
    //             callback(null, img);
    //         }
    //         else {
    //             img.addEventListener('load', loadCallback);
    //             img.addEventListener('error', errorCallback);
    //         }
    //         img.src = url;
    //     }
    // };

    // cc.loader.addDownloadHandlers({
    //     'png': downloadImage
    // });
}

module.exports = {};
