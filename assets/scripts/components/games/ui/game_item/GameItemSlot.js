var GameConstant = require('GameConstant'),
    Url = require('Url'),
    Utils = require('Utils'),
    CommonConstant = require('CommonConstant'),
    NetworkManager = require('NetworkManager');

cc.Class({
    extends: cc.Component,

    properties: {
        spriteFrameList: {
            default: [],
            type: cc.SpriteFrame
        },
        txtJarList: {
            default: [],
            type: cc.Label
        },
        textColor: cc.Color
    },

    onLoad: function () {
        this.getJar();
    },

    init: function (gameId) {
        this.gameId = gameId;
        if (gameId === GameConstant.MY_NHAN.ID) {
            this.node.getComponent(cc.Sprite).spriteFrame = this.spriteFrameList[0];
        }
        else if (gameId === GameConstant.HAI_TAC.ID) {
            this.node.getComponent(cc.Sprite).spriteFrame = this.spriteFrameList[1];
        }
        else if (gameId === GameConstant.HOA_QUA.ID) {
            this.node.getComponent(cc.Sprite).spriteFrame = this.spriteFrameList[2];
        }
        else if (gameId === GameConstant.SHOW_BIZ.ID) {
            this.node.getComponent(cc.Sprite).spriteFrame = this.spriteFrameList[3];
        }
    },

    getJar: function () {
        var self = this,
            i;
        if (!self.gameId) {
            for (i = 0; i < self.txtJarList.length; i += 1) {
                self.txtJarList[i].string = '0';
            }
        }
        var bettings = ['100', '1000', '10000'];
        NetworkManager.Http.fetch('GET', Url.Http.GET_JAR, {
            game_id: self.gameId
        }).success(function (results) {
            var data = results.data;
            if (data[bettings[0]] !== undefined && data[bettings[1]] !== undefined && data[bettings[2]] !== undefined) {
                for (i = 0; i < self.txtJarList.length; i += 1) {
                    self.txtJarList[i].string = Utils.Number.format(data[bettings[i]].currencies[CommonConstant.CurrencyType.Ip.NAME]);
                }
            }
            else {
                for (i = 0; i < self.txtJarList.length; i += 1) {
                    self.txtJarList[i].string = '0';
                }
            }

        }, {
            cache: 3000
        });
    },
});
