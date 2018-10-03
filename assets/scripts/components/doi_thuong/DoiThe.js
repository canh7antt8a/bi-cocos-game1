var Url = require('Url'),
    Utils = require('Utils'),
    TabView = require('TabView'),
    AuthUser = require('AuthUser'),
    DropDown = require('DropDown'),
    UiManager = require('UiManager'),
    CommonConstant = require('CommonConstant'),
    NetworkManager = require('NetworkManager');

cc.Class({
    extends: cc.Component,

    properties: {
        itemMenhGiaPrefab: cc.Prefab,
        contentMenhGiaNode: cc.Node,

        doiTheTabView: TabView,
        lichSuDoiTabView: TabView,

        loaiTheDropDown: DropDown,
        menhGiaDropDown: DropDown,
        giaBanLabel: cc.Label,
    },

    // use this for initialization
    onLoad: function () {
        this.getCardsInfo();
    },

    getCardsInfo: function () {
        var that = this;
        NetworkManager.Http.fetch('GET', Url.Http.DOI_THUONG_GET_CARD_INFO, {}, {
                cache: 1800,
                delay: 500,
            })
            .success(function (respDone) {
                that.cards = respDone.data;
                that.loaiTheDropDown.clearAllItems();
                for (var i = 0; i < that.cards.length; i += 1) {
                    that.loaiTheDropDown.addItem(that.cards[i].name, (i > 0 ? false : true));
                }
                that.updateMenhGia();
            });
    },

    updateMenhGia: function () {
        var currentCardName = this.loaiTheDropDown.getSelectedItem(),
            menhGiaItemNode, card, i, j, amountVnd, amountInGame;
        if (!this.cards) {
            return;
        }
        for (i = 0; i < this.cards.length; i += 1) {
            card = this.cards[i];
            if (card.name === currentCardName) {
                this.currentCard = card;
                this.menhGiaDropDown.clearAllItems();
                this.contentMenhGiaNode.removeAllChildren();
                for (j = 0; j < card.amounts.length; j += 1) {
                    amountVnd = card.amounts[j];
                    amountInGame = this.getGiaThe(amountVnd, card);
                    amountVnd = Utils.Number.format(amountVnd) + ' VND';
                    this.menhGiaDropDown.addItem(card.amounts[j], (j > 0 ? false : true));
                    menhGiaItemNode = cc.instantiate(this.itemMenhGiaPrefab);
                    menhGiaItemNode.getComponent('RowTable').updateData(amountVnd, amountInGame);
                    this.contentMenhGiaNode.addChild(menhGiaItemNode);
                }
                this.updateGiaDoiThe();
            }
        }
    },

    updateGiaDoiThe: function () {
        if (this.currentCard) {
            this.giaBanLabel.string = 'Giá bán: ' +
                this.getGiaThe(this.menhGiaDropDown.getSelectedItem(), this.currentCard);
        }
    },

    getGiaThe: function (amountVnd, cardInfo) {
        var amount = amountVnd * cardInfo.exchange_rate;
        return Utils.Number.format(amount) + ' ' +
            CommonConstant.CurrencyType.findByName(this.currentCard.currency).DISPLAY_NAME;
    },

    confirmGetCard: function (event) {
        var that = this;
        if (!this.currentCard) {
            return UiManager.openModal('Xin vui lòng chọn loại thẻ cào để đổi thưởng.');
        }
        NetworkManager.Http.fetch('POST', Url.Http.DOI_THUONG_GET_CARD, {
                username: AuthUser.username,
                accesstoken: AuthUser.accesstoken,
                card_type: this.currentCard.name,
                amount: this.menhGiaDropDown.getSelectedItem()
            })
            .success(function (respDone) {
                var data = respDone.data;
                UiManager.openModal('Xin chúc mừng, bạn đã rút thành công thẻ ' +
                    data.card_type + ' mệnh giá ' + data.card_amount +
                    '\nPin: ' + data.card_pin + '\nSerial: ' + data.card_serial);
                that.doiTheTabView.activeByName('LichSu');
                that.lichSuDoiTabView.activeByName('LsDoiThe');
            })
            .setWaitingButton(event.target);
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
