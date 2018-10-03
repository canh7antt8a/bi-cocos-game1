cc.Class({
    extends: cc.Component,

    properties: {
        txtTitle: cc.Label,
        hopQuaRow: {
            default: [],
            type: cc.Node
        },
    },

    onLoad: function () {
        this._initOnce();
    },

    show: function (maxCoffer, callbackShowFinish) {
        this._initOnce();
        this.callbackShowFinish = callbackShowFinish;
        for (var i = 0; i < this.hopQuaRow.length; i += 1) {
            var row = this.hopQuaRow[i];
            for (var j = 0; j < row.children.length; j += 1) {
                var node = row.children[j];
                node.getChildByName('UnLock').active = false;
                node.getChildByName('Lock').active = true;
            }
        }
        this.node.stopAllActions();
        this.node.active = true;
        this.countCoffer = 0;
        this.hidding = false;
        this.maxCoffer = maxCoffer;
        this.txtTitle.string = 'BẠN CÒN ' + (this.maxCoffer - this.countCoffer) + ' LẦN MỞ HỘP QUÀ ';

        // Them Doan Nay Ko Chuan(De test hoac fix loi ket hop qua)
        this.node.runAction(cc.sequence(cc.delayTime(12), cc.callFunc(function () {
            this.node.active = false;
            if (this.callbackShowFinish) {
                this.callbackShowFinish();
            }
        }.bind(this))));
    },

    setMaxCoffer: function (maxCoffer) {
        this.countCoffer = 0;
        this.maxCoffer = maxCoffer;
    },

    openCoffer: function (id, award) {
        this._initOnce();
        var node = this.itemList[id];
        var nodeUnLock = node.getChildByName('UnLock');
        nodeUnLock.active = true;
        node.getChildByName('Lock').active = false;
        if (award.awardType === 'none') {
            nodeUnLock.getComponentInChildren(cc.Label).string = 'Chúc bạn may mắn\nlần sau';
        }
        else if (award.awardType === 'money') {
            nodeUnLock.getComponentInChildren(cc.Label).string = award.ratio + ' x ' + this.gamePlay.betting;
        }
        this.countCoffer += 1;
        //cc.log('### openCoffer  ' + this.countCoffer + ' / ' + this.maxCoffer);
        if (this.countCoffer >= this.maxCoffer) {
            this.node.runAction(cc.sequence(cc.delayTime(2), cc.callFunc(function () {
                this.node.stopAllActions();
                this.node.active = false;
                if (this.callbackShowFinish) {
                    this.callbackShowFinish();
                }
            }.bind(this))));
        }
        this.txtTitle.string = 'BẠN CÒN ' + (this.maxCoffer - this.countCoffer) + ' LẦN MỞ HỘP QUÀ ';
    },

    _initOnce: function () {
        if (this.itemList === undefined) {
            this.countCoffer = 0;
            this.maxCoffer = 0;
            this.hidding = false;
            var self = this;
            this.itemList = [];
            var index = 0;
            for (var i = 0; i < this.hopQuaRow.length; i += 1) {
                var row = this.hopQuaRow[i];
                for (var j = 0; j < row.children.length; j += 1) {
                    (function (id) {
                        var node = row.children[j];
                        node.addComponent(cc.Button);
                        node.on(cc.Node.EventType.TOUCH_END, function () {
                            if (self.countCoffer >= self.maxCoffer && !self.hidding) {
                                self.hidding = true;
                                // cc.log('Da mo het hop qua');
                                self.node.runAction(cc.sequence(cc.delayTime(2), cc.callFunc(function () {
                                    self.hidding = false;
                                    self.node.stopAllActions();
                                    self.node.active = false;
                                    if (self.callbackShowFinish) {
                                        self.callbackShowFinish();
                                    }
                                })));
                                return;
                            }
                            //cc.log('### this.countCoffer  ' + self.countCoffer + ' / ' + self.maxCoffer);
                            self.gamePlay.gameManager.openLuckyCoffer(id);
                        }, node);
                        self.itemList.push(node);
                    }(index));
                    index += 1;
                }
            }
        }
    },
});
