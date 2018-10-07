var AuthUser = require('AuthUser'),
    SysConfig = require('SysConfig'),
    TinhNangManager = require('TinhNangManager'),
    EventDispatcher = require('EventDispatcher'),
    EventDispatcherConstant = require('EventDispatcherConstant');

var TinhNangNode = cc.Class({
    name: 'TinhNangNode',
    properties: {
        target: {
            default: null,
            type: cc.Node,
        },
        tinhNang: {
            default: '',
        }
    },

    init: function() {
        this.targetParent = this.target.parent;
        this.targetIndex = this.target.getSiblingIndex();
    },
    remove: function() {
        if (this.target && this.target.parent) {
            this.target.removeFromParent(false);
        }
    },
    add: function() {
        if (this.target && this.targetParent) {
            if (!this.target.parent) {
                this.targetParent.addChild(this.target);
                this.target.setSiblingIndex(this.targetIndex);
            }
        }
    }
});

cc.Class({
    extends: cc.Component,

    properties: {
        tinhNangNodes: {
            default: [],
            type: TinhNangNode
        }
    },

    // use this for initialization
    onLoad: function() {
        this.tinhNangNodes.forEach(function(tinhNangNode) {
            tinhNangNode.init();
        });
        this.kiemTraTinhNang();

        // Hide DoiThuong when user exp < exp can view
        this.tinhNangNodes.forEach(function(tinhNangNode) {
            if (tinhNangNode && tinhNangNode.tinhNang === 'dt') {
                var isAndroidPlatform = SysConfig.PLATFORM === 'ANDROID';
                if (isAndroidPlatform && AuthUser.experience < TinhNangManager.expCanViewGift && tinhNangNode.target) {
                    tinhNangNode.target.active = false;
                }
            }
        });
        EventDispatcher.addEventListener(EventDispatcherConstant.TINH_NANG.NEW, this.kiemTraTinhNang, this);
    },

    onDestroy: function() {
        EventDispatcher.removeEventListener(EventDispatcherConstant.TINH_NANG.NEW, this.kiemTraTinhNang, this);
    },

    kiemTraTinhNang: function() {
        this.tinhNangNodes.forEach(function(tinhNangNode) {
            if (TinhNangManager.choPhep(tinhNangNode.tinhNang)) {
                tinhNangNode.add();
            }
            else {
                tinhNangNode.remove();
            }
        });
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
