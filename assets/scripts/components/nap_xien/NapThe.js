var NetworkManager = require('NetworkManager'),
    CommonConstant = require('CommonConstant'),
    UiManager = require('UiManager'),
    AuthUser = require('AuthUser'),
    Url = require('Url');

cc.Class({
    extends: cc.Component,

    properties: {
        tcaoScrollView: cc.ScrollView,
        tcaoItemPrefab: cc.Prefab,
        tcaoHintLabel: cc.Label,
        pinEditBox: cc.EditBox,
        serialEditBox: cc.EditBox,
    },

    onEnable: function () {
        this.fetchTheCaoInfo();
    },

    fetchTheCaoInfo: function () {
        var that = this;
        NetworkManager.Http.fetch('GET', Url.Http.THE_CAO_TYPES, {
                username: AuthUser.username
            }, {
                cache: 900,
                delay: 500,
            })
            .success(function (tcaoResp) {
                var tcaoItemNode, icaoComponent,
                    tcaoItems = tcaoResp.data;
                that.tcaoHintLabel.string = CommonConstant.CurrencyType.normalize(tcaoResp.data_hint);

                that.tcaoScrollView.content.removeAllChildren();
                for (var i = 0; i < tcaoItems.length; i += 1) {
                    tcaoItemNode = cc.instantiate(that.tcaoItemPrefab);
                    tcaoItemNode.cardType = tcaoItems[i].name;
                    icaoComponent = tcaoItemNode.getComponent('ItemThe');
                    icaoComponent.updateData(tcaoItems[i]);
                    that.tcaoScrollView.content.addChild(tcaoItemNode);
                }
                that.tcaoScrollView.scrollToLeft();
            });
    },

    napTheCao: function (event) {
        var cardType,
            selectComp = this.tcaoScrollView.content.getComponent('MultiSelect');
        if (selectComp.selectedItems.length < 1) {
            return UiManager.openModal('Xin vui lòng chọn loại thẻ cào.');
        }
        if (this.pinEditBox.string.length < 1) {
            return UiManager.openModal('Xin vui lòng nhập mã pin.');
        }
        else {
            cardType = selectComp.selectedItems[0].cardType;
            NetworkManager.Http.fetch('POST', Url.Http.NAP_THE_CAO, {
                    username: AuthUser.username,
                    accesstoken: AuthUser.accesstoken,
                    card_type: cardType,
                    pin: this.pinEditBox.string,
                    serial: this.serialEditBox.string
                })
                .success(function () {
                    UiManager.openModal('Xin chúc mừng, bạn đã nạp thẻ thành công.');
                })
                .setWaitingButton(event.target);
        }
    },

    selectCard: function (selectedCards) {
        if (selectedCards.length > 0) {
            var selectedCard = selectedCards[0];
            if (selectedCard.cardType === 'IP') {
                this.serialEditBox.node.active = false;
            }
            else {
                this.serialEditBox.node.active = true;
            }
        }
    },

    // use this for initialization
    onLoad: function () {},


});
