var Url = require('Url'),
    Utils = require('Utils'),
    TabView = require('TabView'),
    AuthUser = require('AuthUser'),
    DropDown = require('DropDown'),
    UiManager = require('UiManager'),
    NetworkManager = require('NetworkManager'),
    CommonConstant = require('CommonConstant');

cc.Class({
    extends: cc.Component,

    properties: {
        userNameEditBox: cc.EditBox,
        amountEditBox: cc.EditBox,
        noteEditBox: cc.EditBox,
        currencyDropDown: DropDown,

        daiLyTabView: TabView,

        itemDaiLyPrefab: cc.Prefab,
        daiLyContainerNode: cc.Node,

        feeLabel: cc.Label,
        soDuLabel: cc.Label,
        infoRichText: cc.RichText,

        itemLichSuPrefab: cc.Prefab,
        lichSuChuyenPiContainerNode: cc.Node,
    },

    // use this for initialization
    onLoad: function () {},

    updateSoDu: function () {
        var item = this.currencyDropDown.getSelectedItem();
        this.soDuLabel.string = Utils.Number.format(
            AuthUser.currencies[item.value].balance) + ' ' + item.label;
    },

    loadContentTransfer: function () {
        var that = this;
        that.infoRichText.string = '';
        that.feeLabel.string = '0%.';
        that.clearChuyenPiForm();

        NetworkManager.Http.fetch('GET', Url.Http.TRANSFER, {
                username: AuthUser.username,
                accesstoken: AuthUser.accesstoken,
            }, {
                cache: 1800
            })
            .success(function (respDone) {
                var data = respDone.data;
                that.feeLabel.string = data.fee * 100 + '%';
                that.infoRichText.string = CommonConstant.CurrencyType.normalize(data.note);

                that.currencyDropDown.clearAllItems();
                for (var i = 0; i < data.currencies.length; i += 1) {
                    that.currencyDropDown.addItem({
                        value: data.currencies[i],
                        label: CommonConstant.CurrencyType.findByName(data.currencies[i]).DISPLAY_NAME
                    }, i === 0 ? true : false);
                }
                that.updateSoDu();
            });
    },

    clearChuyenPiForm: function () {
        this.amountEditBox.string = '';
        this.noteEditBox.string = '';
    },

    chuyenPi: function (event) {
        var that = this,
            amount = parseInt(this.amountEditBox.string),
            currency = this.currencyDropDown.getSelectedItem();
        if (!this.userNameEditBox.string || !this.noteEditBox.string) {
            return UiManager.openModal('Xin vui lòng nhập đầy đủ thông tin.');
        }
        if (!amount) {
            return UiManager.openModal('Xin vui lòng nhập số tiền hợp lệ.');
        }
        if (!currency) {
            return;
        }
        NetworkManager.Http.fetch('POST', Url.Http.TRANSFER, {
                from_user: AuthUser.username,
                accesstoken: AuthUser.accesstoken,
                to_user: this.userNameEditBox.string,
                amount: this.amountEditBox.string,
                note: this.noteEditBox.string,
                currency: currency.value
            })
            .success(function () {
                UiManager.openModal('Xin chúc mừng, bạn đã chuyển tiền thành công.');
                that.daiLyTabView.activeByName('LichSu');
                that.clearChuyenPiForm();
            })
            .setWaitingButton(event.target);
    },

    getLichSuChuyenPi: function () {
        var that = this;
        NetworkManager.Http.fetch('GET', Url.Http.TRANSFER_LOG, {
                username: AuthUser.username,
                accesstoken: AuthUser.accesstoken
            })
            .success(function (respDone) {
                var transferLogNode, i, col1, col2, col3, col4, currency,
                    items = respDone.data.items;
                that.lichSuChuyenPiContainerNode.removeAllChildren();
                for (i = 0; i < items.length; i += 1) {
                    transferLogNode = cc.instantiate(that.itemLichSuPrefab);
                    col1 = items[i].created_time.replace(' ', '\n');
                    currency = CommonConstant.CurrencyType.findByName(items[i].currency).DISPLAY_NAME;
                    col2 = Utils.Number.format(items[i].amount) + ' ' + currency;
                    col4 = items[i].note;
                    transferLogNode.with_acc = col3 = items[i].with_acc;
                    transferLogNode.getComponent('RowTable').updateData(col1, col2, col3, col4);
                    transferLogNode.on(cc.Node.EventType.TOUCH_END, function () {
                        that.daiLyTabView.activeByName('ChuyenPi');
                        that.userNameEditBox.string = this.with_acc;
                    });
                    that.lichSuChuyenPiContainerNode.addChild(transferLogNode);
                }
            });
    },

    getDaiLyInfo: function () {
        var that = this;
        NetworkManager.Http.fetch('GET', Url.Http.DAILY_LIST, {}, {
                cache: 1800,
                delay: 500,
            })
            .success(function (respDone) {
                var partners = respDone.data;
                that.daiLyContainerNode.removeAllChildren();
                for (var i = 0; i < partners.length; i += 1) {
                    that.daiLyContainerNode.addChild(that._initDaiLyNode(partners[i]));
                }
            });
    },

    _initDaiLyNode: function (daiLyData) {
        var that = this,
            componentItemDaily,
            daiLyNode = cc.instantiate(this.itemDaiLyPrefab);
        daiLyNode.getComponent('RowTable').updateData(daiLyData.display_name,
            daiLyData.username, daiLyData.mobile, daiLyData.address);

        componentItemDaily = daiLyNode.getComponent('ItemDaiLy');
        componentItemDaily.updateData(daiLyData);
        componentItemDaily.chuyenPi = function () {
            that.userNameEditBox.string = daiLyData.username;
            that.daiLyTabView.activeByName('ChuyenPi');
        };

        return daiLyNode;
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
