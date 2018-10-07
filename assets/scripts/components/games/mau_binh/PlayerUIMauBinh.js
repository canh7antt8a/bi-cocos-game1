var Card = require('Card'),
    Utils = require('Utils'),
    CardUI = require('CardUI'),
    PlayerUI = require('PlayerUI'),
    AuthUser = require('AuthUser'),
    MauBinhConstant = require('MauBinhConstant'),
    CardLayoutMauBinh = require('CardLayoutMauBinh');

cc.Class({
    extends: cc.Component,

    properties: {
        lblMoneyChi: cc.Label,
        lblChiType: cc.Label,
        cardLayout: CardLayoutMauBinh,
        xepXongNode: cc.Node,
        cardPrefab: cc.Prefab
    },

    setGamePlay: function (gamePlay) {
        this.gamePlay = gamePlay;
    },

    onLoad: function () {
        // Time Effect Swap
        this.timeEffectSwap = Utils.Number.random(2, 5);

        // Reset
        this._resetFirstTime();
    },

    update: function (dt) {
        // Swap Effect
        if (this.state === MauBinhConstant.PlayerState.IN_TURN) {
            this.time += dt;
            if (this.time >= this.timeEffectSwap) {
                var user = this.node.getComponent(PlayerUI).player;
                if (user && (user.data.username !== AuthUser.username)) {
                    this.timeEffectSwap = Utils.Number.random(2, 5);
                    this.time = 0;
                    this.cardLayout.createEffectSwapCard();
                }
            }
            if (this.runEffectCountDown) {
                this.runEffectCountDown = false;
                var currentTime = (new Date()).getTime();
                var timeRemain = this.timeOut - (currentTime - this.startTime);
                if (timeRemain > 0) {
                    this.node.getComponent(PlayerUI).setCountDown(timeRemain);
                }
            }
        }
    },

    showCardLayout: function (active, sortCardLayoutActive) {
        this._resetFirstTime();
        this.isSapHam = false;
        this.isThangTrang = false;
        this.cardAvatar.active = false;
        this.cardLayout.layoutCard.active = false;
        if (active) {
            if (sortCardLayoutActive) {
                this.cardAvatar.active = true;
            }
            else {
                this.cardAvatar.active = false;
                this.cardLayout.showAllLayout();
            }
        }
    },

    reset: function () {
        // Reset
        this.isActive = false;
        this.isSapHam = false;
        this.isThangTrang = false;
        this.isOpenChi = [false, false, false];

        // Remove Effect
        var playerUI = this.node.getComponent(PlayerUI);
        playerUI.clearCountDown();
        playerUI.removeWinEffect();
        playerUI.removeLoseEffect();
        playerUI.removeDrawEffect();

        // Reset Cardd Layout
        // Card Layout
        this.xepXongNode.active = false;

        // Reset Card
        this.cardLayout.reset();

        // Reset Result 3 Chi
        this.lblChiType.string = '';
        this.lblMoneyChi.string = '';

        // Hide Card
        if (this.cardAvatar) {
            this.cardAvatar.active = false;
        }
    },

    setState: function (state, timeOut, isFinish) {
        this._resetFirstTime();
        this.state = state;
        this.startTime = (new Date()).getTime();
        this.timeOut = timeOut;
        this.node.getComponent(PlayerUI).clearCountDown();
        if (state === MauBinhConstant.PlayerState.IN_TURN) {
            this.isActive = true;
            this.runEffectCountDown = true;
            this.xepXongNode.active = false;
            if (isFinish) {
                this.setState(MauBinhConstant.PlayerState.FINISH);
            }
        }
        else if (state === MauBinhConstant.PlayerState.FINISH) {
            this.isActive = true;
            this.runEffectCountDown = false;
            this.xepXongNode.active = true;
            this.xepXongNode.getComponentInChildren(cc.Label).string = 'XẾP XONG';
        }
        else if (state === MauBinhConstant.PlayerState.WAITING) {
            this.isActive = false;
            this.xepXongNode.active = true;
            this.xepXongNode.getComponentInChildren(cc.Label).string = 'ĐANG ĐỢI';
        }
    },

    unfoldChi: function (index, hand, hasEffect) {
        this._resetFirstTime();
        if (this.isOpenChi[index]) {
            return;
        }

        // Show
        this.isOpenChi[index] = true;
        var cardUIList = this.cardLayout.layoutCardList[index].getComponentsInChildren(CardUI);
        for (var i = 0; i < cardUIList.length; i += 1) {
            cardUIList[i].setCard(Card.fromId(hand[i]));
            var cardNode = cardUIList[i].node;
            cardNode.stopAllActions();
            cardNode.scale = 1;
            if (!hasEffect) {
                cardUIList[i].unfoldNode.active = true;
                cardUIList[i].foldNode.active = false;
            }
            else {
                cardUIList[i].foldNode.active = true;
                cardNode.runAction(cc.sequence(cc.scaleTo(0.2, 0, 1), cc.callFunc(function () {
                    this.getChildByName('Fold').active = false;
                }.bind(cardNode)), cc.scaleTo(0.2, 1, 1)));
            }
        }
    },

    setOpenAllCards: function (cards) {
        this.isOpenChi = [false, false, false];
        for (var i = 0; i < 3; i += 1) {
            var hand = cards.slice(i * 5, i * 5 + (i >= 2 ? 3 : 5));
            this.unfoldChi(i, hand, false);
        }
    },

    setOpenAllChiCards: function (chiInfo) {
        // cc.log('setOpenAllChiCards');
        this.isOpenChi = [false, false, false];
        for (var i = 0; i < chiInfo.length; i += 1) {
            this.unfoldChi(i, chiInfo[i].hand, false);
        }
    },

    compareChi: function (gameAction, gameState, player, actions, isInForcus) {
        // cc.log(player);
        var inFocus = isInForcus === true;
        this._resetFirstTime();
        this.cardLayout.resetPosition();
        this.xepXongNode.active = false;
        this.cardAvatar.active = false;
        this.isActive = player.isActive;
        this.state = MauBinhConstant.PlayerState.ORDER_CARDS;
        if (player.isThangTrang) {
            return;
        }
        var i, index = 0;
        if (player.isBinhLung && player.cards) {
            this.setOpenAllCards(player.cards);
        }

        // Check If Non Active
        this.showCardLayout(this.isActive, false);
        if (gameAction === MauBinhConstant.Action.COMPARE_CHI_MOT || gameState === MauBinhConstant.GameState.COMPARE_1) {
            index = 0;
            this.node.getComponent(PlayerUI).clearCountDown();
        }
        else if (gameAction === MauBinhConstant.Action.COMPARE_CHI_HAI || gameState === MauBinhConstant.GameState.COMPARE_2) {
            index = 1;

            // Open Chi 1 Neu Chua Mo
            if (!this.isOpenChi[0]) {
                this.unfoldChi(0, player.chiInfo[0].hand, false);
            }
        }
        else if (gameAction === MauBinhConstant.Action.COMPARE_CHI_BA || gameState === MauBinhConstant.GameState.COMPARE_3) {
            index = 2;

            // Open Chi 1, 2 Neu Chua Mo
            if (!this.isOpenChi[0]) {
                this.unfoldChi(0, player.chiInfo[0].hand, false);
            }
            if (!this.isOpenChi[1]) {
                this.unfoldChi(1, player.chiInfo[1].hand, false);
            }
        }

        // Show Black Card Binh Lung
        this.cardLayout.showBinhLung(player.isBinhLung);

        // Unfold Card
        var hasEffect = !(inFocus || player.isBinhLung);
        this.unfoldChi(index, player.chiInfo[index].hand, hasEffect);

        // Chi Type
        if (player.isBinhLung) {
            this.lblChiType.node.scale = 1;
            this.lblChiType.string = 'Binh Lủng';
        }
        else {
            this.lblChiType.node.scale = 0;
            this.lblChiType.node.stopAllActions();
            if (!inFocus) {
                this.lblChiType.node.runAction(cc.scaleTo(0.8, 1));
            }
            else {
                this.lblChiType.node.scale = 1;
            }
            this.lblChiType.string = player.chiInfo[index].type;
        }

        // Calculate Money Exchange
        if (!inFocus && actions) {
            var moneyExchange = 0;
            for (i = 0; i < actions.length; i += 1) {
                var sourcePlayer = actions[i].sourcePlayer,
                    targetPlayer = actions[i].targetPlayer,
                    userName = this.node.getComponent(PlayerUI).player.data.username;
                if (userName === sourcePlayer) {
                    moneyExchange -= actions[i].moneyExchange;
                    this.isSapHam = actions[i].isSapHam;
                }
                if (userName === targetPlayer) {
                    moneyExchange += actions[i].moneyExchange;
                }
            }

            // Show Money Exchange
            this.showMoneyEffect(moneyExchange);
        }

        // Hide Chi Other
        if (!player.isBinhLung && !player.isThangTrang) {
            for (var j = 0; j < 3; j += 1) {
                var active = (j === index);
                this.cardLayout.layoutCardList[j].active = active;
                this.isOpenChi[j] = active;
            }
        }
    },

    showMoneyEffect: function (money) {
        this.lblMoneyChi.node.color = cc.Color.YELLOW;
        this.lblMoneyChi.string = (money >= 0 ? '+' : '') + Utils.Number.abbreviate(money);
        var x = this.node.x > 0 ? -90 : 90;
        var y = 30;
        this.lblMoneyChi.node.position = new cc.Vec2(x, y);
        this.lblMoneyChi.node.stopAllActions();
        this.lblMoneyChi.node.opacity = 255;
        var action = cc.spawn(cc.moveBy(3, cc.p(0, 90)), cc.fadeTo(3, 0));
        action.easing(cc.easeQuadraticActionOut());
        this.lblMoneyChi.node.runAction(action);

        // Main User
        var user = this.node.getComponent(PlayerUI).player;
        if (!this.gamePlay || user.data.username !== AuthUser.username) {
            return;
        }
        if (money >= 0) {
            this.gamePlay.audioManager.playChickenWin();
        }
        else {
            this.gamePlay.audioManager.playLost();
        }
    },

    setThangTrang: function (params) {
        // cc.log('set Thang trang');
        // cc.log(params);
        this.isThangTrang = true;
        this.cardLayout.showAllLayout();
        this.cardLayout.foldAllCard();
        this.setOpenAllCards(params.hand);
        this.cardLayout.imgThangTrang.active = true;
        this.cardLayout.imgThangTrang.getComponentInChildren(cc.Label).string = params.type;
    },

    setResult: function (player, moneyExchange) {
        // cc.log('setResult');
        // cc.log(player);
        this._resetFirstTime();
        this.isActive = player.isActive;
        this.xepXongNode.active = false;

        // If Not Active
        if (!player.isActive) {
            return;
        }

        // Show All Chi
        this.cardLayout.showAllLayout();
        this.cardLayout.foldAllCard();
        this.setOpenAllChiCards(player.chiInfo);

        // Hide Effect 3 Chi
        this.lblChiType.string = '';
        this.lblMoneyChi.string = '';

        // Show Result
        var isMainUser = player.username === AuthUser.username;
        if (moneyExchange > 0) {
            this.node.getComponent(PlayerUI).setWinEffect(moneyExchange);
            if (this.gamePlay && isMainUser) {
                this.gamePlay.audioManager.playWin();
            }
        }
        else if (moneyExchange === 0) {
            this.node.getComponent(PlayerUI).setDrawEffect(moneyExchange);
            if (this.gamePlay && isMainUser) {
                this.gamePlay.audioManager.playWin();
            }
        }
        else {
            this.node.getComponent(PlayerUI).setLoseEffect(moneyExchange);
            if (this.gamePlay && isMainUser) {
                this.gamePlay.audioManager.playLose();
            }
        }
        if (player.isBinhLung) {
            this.lblChiType.string = 'Binh Lủng';
        }
        if (this.isSapHam) {
            this.cardLayout.imgThuaSapHam.active = true;
        }

    },

    _resetFirstTime: function () {
        this.time = 0;
        if (this.callResetFisrtTime) {
            return;
        }
        this.callResetFisrtTime = true;

        // Label Money Chi
        this.lblMoneyChi.node.active = true;

        // Set Position Card Layout
        if (this.node.x > 0) {
            this.lblChiType.node.x = -184;
        }
        else {
            this.lblChiType.node.x = 180;
        }

        // Var
        this.isOpenChi = [false, false, false];

        // Card
        var posX = -130;
        if (this.node.x < 0) {
            posX = 130;
        }
        this.cardAvatar = cc.instantiate(this.cardPrefab);
        this.cardAvatar.scale = 0.5;
        this.cardAvatar.x = posX;
        this.cardAvatar.active = false;
        this.node.addChild(this.cardAvatar);

        // Reset
        this.reset();

        // Check Run Effect Count Down
        this.runEffectCountDown = false;
    },
});
