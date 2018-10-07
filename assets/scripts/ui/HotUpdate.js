var Utils = require('Utils'),
    E = require('E');

cc.Class({
    extends: cc.Component,

    properties: {
        infoLabel: cc.Label,
        byteProgress: cc.ProgressBar,
        fileProgress: cc.ProgressBar,
        byteLabel: cc.Label,
        fileLabel: cc.Label,
        retryBtn: cc.Button,
        closeBtn: cc.Button,

        _updating: false,
        _canRetry: false,
        _storagePath: '',
        _downloadUrl: null,
    },

    checkCb: function (event) {
        cc.log('Code: ' + event.getEventCode());
        switch (event.getEventCode())
        {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                this.infoLabel.string = 'Không tìm thấy file manifest trong máy, bỏ qua cập nhật.';
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                this.infoLabel.string = 'Lỗi khi tải file manifest, bỏ qua cập nhật.';
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                this.infoLabel.string = 'Đã cập nhật phiên bản mới nhất.';
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND:
                this.infoLabel.string = 'Đã tìm thấy phiên bản mới, vui lòng cập nhật.';
                this.fileProgress.progress = 0;
                this.byteProgress.progress = 0;
                break;
            default:
                return;
        }

        cc.eventManager.removeListener(this._checkListener);
        this._checkListener = null;
        this._updating = false;
    },

    updateCb: function (event) {
        var needRestart = false;
        var failed = false;
        switch (event.getEventCode())
        {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                this.infoLabel.string = 'Không tìm thấy file manifest trong máy, bỏ qua cập nhật.';
                failed = true;
                break;
            case jsb.EventAssetsManager.UPDATE_PROGRESSION:
                this.byteProgress.progress = event.getPercent();
                this.fileProgress.progress = event.getPercentByFile();

                this.fileLabel.string = event.getDownloadedFiles() + ' / ' + event.getTotalFiles();
                this.byteLabel.string = Utils.Number.abbreviate(event.getDownloadedBytes()) +
                    ' / ' + Utils.Number.abbreviate(event.getTotalBytes());

                var msg = event.getMessage();
                if (msg) {
                    this.infoLabel.string = 'Cập nhật file: ' + msg;
                }
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                this.infoLabel.string = 'Lỗi khi tải file manifest, bỏ qua cập nhật.';
                failed = true;
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                this.infoLabel.string = 'Đã cập nhật phiên bản mới nhất.';
                failed = true;
                break;
            case jsb.EventAssetsManager.UPDATE_FINISHED:
                this.infoLabel.string = 'Kết thúc cập nhật. ' + event.getMessage();
                needRestart = true;
                break;
            case jsb.EventAssetsManager.UPDATE_FAILED:
                this.infoLabel.string = 'Cập nhật lỗi. ' + event.getMessage();
                this.retryBtn.node.active = true;
                this.closeBtn.node.active = true;
                this._updating = false;
                this._canRetry = true;
                break;
            case jsb.EventAssetsManager.ERROR_UPDATING:
                this.infoLabel.string = 'Cập nhật lỗi asset: ' + event.getAssetId() + ', ' + event.getMessage();
                break;
            case jsb.EventAssetsManager.ERROR_DECOMPRESS:
                this.infoLabel.string = event.getMessage();
                break;
            default:
                break;
        }

        if (failed) {
            cc.eventManager.removeListener(this._updateListener);
            this.closeBtn.node.active = true;
            this._updateListener = null;
            this._updating = false;
        }

        if (needRestart) {
            cc.eventManager.removeListener(this._updateListener);
            this._updateListener = null;
            // Prepend the manifest's search path
            var searchPaths = jsb.fileUtils.getSearchPaths();
            var newPaths = this._am.getLocalManifest().getSearchPaths();
            Array.prototype.unshift(searchPaths, newPaths);
            // This value will be retrieved and appended to the default search path during game startup,
            // please refer to samples/js-tests/main.js for detailed usage.
            // !!! Re-add the search paths in main.js is very important, otherwise, new scripts won't take effect.
            cc.sys.localStorage.setItem('HotUpdateSearchPaths', JSON.stringify(searchPaths));
            jsb.fileUtils.setSearchPaths(searchPaths);

            cc.audioEngine.stopAll();
            cc.game.restart();
        }
    },

    retry: function () {
        if (!this._updating && this._canRetry) {
            this.retryBtn.interactable = false;
            this._canRetry = false;

            this.infoLabel.string = 'Thử cập nhật lại file lỗi...';
            this._am.downloadFailedAssets();
        }
    },

    checkUpdate: function () {
        if (this._updating) {
            this.infoLabel.string = 'Đang kiểm tra hoặc cập nhật ...';
            return;
        }
        if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
            this._loadLocalManifest();
        }
        if (!this._am.getLocalManifest() || !this._am.getLocalManifest().isLoaded()) {
            this.infoLabel.string = 'Failed to load local manifest ...';
            return;
        }
        this._checkListener = new jsb.EventListenerAssetsManager(this._am, this.checkCb.bind(this));
        cc.eventManager.addListener(this._checkListener, 1);

        this._am.checkUpdate();
        this._updating = true;
    },

    hotUpdate: function () {
        if (this._am && !this._updating) {
            this._updateListener = new jsb.EventListenerAssetsManager(this._am, this.updateCb.bind(this));
            cc.eventManager.addListener(this._updateListener, 1);

            if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
                this._loadLocalManifest();
            }

            this._failCount = 0;
            this._am.update();
            this._updating = true;
        }
    },

    updateDownloadUrl: function(downloadUrl) {
        this._downloadUrl = downloadUrl;
    },

    _loadLocalManifest: function() {
        var manifestObj, manifestStr, manifest;
        if (this._downloadUrl && this._downloadUrl.length > 0) {
            manifestObj = JSON.parse(E.e);
            manifestObj.remoteManifestUrl = this._downloadUrl + manifestObj.remoteManifestUrl;
            manifestObj.remoteVersionUrl = this._downloadUrl + manifestObj.remoteVersionUrl;
            manifestObj.packageUrl = this._downloadUrl;
            manifestStr = JSON.stringify(manifestObj);
        }
        else {
            manifestStr = E.e;
        }
        manifest = new jsb.Manifest(manifestStr, this._storagePath);
        this._am.loadLocalManifest(manifest, this._storagePath);
    },

    // use this for initialization
    onLoad: function () {
        // Hot update is only available in Native build
        if (!cc.sys.isNative) {
            return;
        }
        this._storagePath = ((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'dc-remote-asset');
        cc.log('Storage path for remote asset : ' + this._storagePath);

        // Setup your own version compare handler, versionA and B is versions in string
        // if the return value greater than 0, versionA is greater than B,
        // if the return value equals 0, versionA equals to B,
        // if the return value smaller than 0, versionA is smaller than B.
        var versionCompareHandle = function (versionA, versionB) {
            return parseInt(versionA) - parseInt(versionB);
        };

        // Init with empty manifest url for testing custom manifest
        this._am = new jsb.AssetsManager('', this._storagePath, versionCompareHandle);
        if (!cc.sys.ENABLE_GC_FOR_NATIVE_OBJECTS) {
            this._am.retain();
        }

        var infoLabel = this.infoLabel;
        // Setup the verification callback, but we don't have md5 check function yet, so only print some message
        // Return true if the verification passed, otherwise return false
        this._am.setVerifyCallback(function (path, asset) {
            // When asset is compressed, we don't need to check its md5, because zip file have been deleted.
            var compressed = asset.compressed;
            // Retrieve the correct md5 value.
            var expectedMD5 = asset.md5;
            // asset.path is relative path and path is absolute.
            var relativePath = asset.path;
            // The size of asset file, but this value could be absent.
            // var size = asset.size;
            if (compressed) {
                infoLabel.string = 'Xác minh thành công : ' + relativePath;
                return true;
            }
            else {
                infoLabel.string = 'Xác minh thành công : ' + relativePath + ' (' + expectedMD5 + ')';
                return true;
            }
        });

        infoLabel.string = 'Sẵn sàng cập nhật.';

        if (cc.sys.os === cc.sys.OS_ANDROID) {
            // Some Android device may slow down the download process when concurrent tasks is too much.
            // The value may not be accurate, please do more test and find what's most suitable for your game.
            this._am.setMaxConcurrentTask(2);
        }

        this.fileProgress.progress = 0;
        this.byteProgress.progress = 0;
    },

    onDestroy: function () {
        if (this._updateListener) {
            cc.eventManager.removeListener(this._updateListener);
            this._updateListener = null;
        }
        if (this._am && !cc.sys.ENABLE_GC_FOR_NATIVE_OBJECTS) {
            this._am.release();
        }
    }
});
