var NetworkManager = require('NetworkManager'),
    BaseMainGameplay = require('BaseMainGameplay'),
    Utils = require('Utils'),
    AuthUser = require('AuthUser'),
    UiManager = require('UiManager'),
    CommonConstant = require('CommonConstant'),
    GameManagerConstant = require('GameManagerConstant'),
    LOCAL_CONSTANTS = {
        CHAT_CACHE: {
            KEY: 'top_panel_in_game.chat',
            MAX_ITEMS: 8,
            DEFAULT_MESSAGES: [
                'Nhanh đi anh',
                'Nghĩ gì mà lâu vậy?',
                'Where are you now?',
                'Câu giờ max level',
                'Sao lâu vậy má?',
                'Khi nào nghĩ xong thì phone em nha',
                'Lót dép hóng',
                'Lêu lêu'
            ]
        }
    };

cc.Class({
    extends: cc.Component,

    properties: {
        bettingLabel: cc.Label,
        optionLabel: cc.Label,

        backdropNode: cc.Node,
        menuDropDownNode: cc.Node,
        toggleChatButton: cc.Button,

        // chatHistoryLabel: cc.Label,
        chatHistoryLabel: cc.RichText,
        chatPanelNode: cc.Node,
        chatControlPanelNode: cc.Node,
        chatEditBox: cc.EditBox,
        chatScrollView: cc.ScrollView,
        quickChatNode: cc.Node,
        quickChatTemplateButtonNode: cc.Node,
        mainUsernameColor: cc.Color,
        normalUsernameColor: cc.Color,

        checkboxQuitGameNode: cc.Node,
        registerQuitGameNode: cc.Node,
    },

    // use this for initialization
    onLoad: function () {
        var self = this;

        if (self.chatPanelNode) {
            self.chatEditBox.enabled = false;
            self.chatPanelNode.opacity = 0;
            self.chatPanelNode.active = true;
        }

        self.menuDropDownNode.opacity = 0;
        self.menuDropDownNode.active = true;
        self.backdropNode.active = true;

        self._timeoutId = setTimeout(function () {
            if (!self.isValid) {
                return;
            }

            self.menuDropDownNode.active = false;
            self.menuDropDownNode.opacity = 255;
            self.backdropNode.active = false;

            if (self.chatPanelNode) {
                self.chatControlPanelNodePosition = self.chatControlPanelNode.position;
                self.chatControlPanelNodeHidePosition = cc.v2(self.chatControlPanelNode.position.x, self.chatControlPanelNode.position.y - self.chatControlPanelNode.height);

                self.chatScrollViewPosition = self.chatScrollView.node.position;
                self.chatScrollViewHidePosition = cc.v2(self.chatScrollView.node.position.x, self.chatScrollView.node.position.y + self.chatScrollView.node.height);

                self.chatScrollView.node.getComponent(cc.Widget).enabled = false;
                self.chatControlPanelNode.getComponent(cc.Widget).enabled = false;

                self.chatPanelNode.active = false;
                self.chatPanelNode.opacity = 255;
                self.chatEditBox.enabled = true;
            }
        }, 500);
    },

    onDestroy: function () {
        if (this.gameManager) {
            this.gameManager.eventDispatchers.local.removeEventListener(
                GameManagerConstant.Event.UPDATE_REGISTER_QUIT_GAME_STATUS,
                this.onUpdateRegisterQuitGameStatus, this);

            this.gameManager.eventDispatchers.local.removeEventListener(
                GameManagerConstant.Event.UPDATE_BETTING_VALUES,
                this.onUpdateBettingValues, this);

            NetworkManager.SmartFox.offPublicMessage(this.onPublicMessage);
        }

        if (this._timeoutId) {
            clearTimeout(this._timeoutId);
            this._timeoutId = null;
        }
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    init: function (sceneScript) {
        if (!(sceneScript instanceof BaseMainGameplay.constructor)) {
            throw 'sceneScript must be an instance of "BaseMainGameplay"';
        }

        var self = this;

        this.sceneScript = sceneScript;
        this.gameRuntimeConfigs = this.sceneScript.gameRuntimeConfigs;
        this.gameManager = this.sceneScript.gameManager;
        this.game = this.gameRuntimeConfigs.game;

        var configs = this.game && this.game.CONFIG && this.game.CONFIG.TOP_PANEL_IN_GAME;
        if (configs) {
            if (!configs.CHAT) {
                this.toggleChatButton.node.active = false;
                this.toggleChatButton = null;

                this.chatPanelNode.active = false;
                this.chatPanelNode = null;
            }

            if (!configs.REGISTER_QUIT_GAME) {
                this.registerQuitGameNode.active = false;
                this.registerQuitGameNode = null;
            }
        }

        this.chatHistoryLabel.string = '';
        this._createAllQuickChatButtonsFromCache();

        this.setBettingLabel('');
        this.setOptionLabel('');

        if (this.toggleChatButton) {
            this.onPublicMessage = function (event) {
                var roomId = event && event.room && event.room.id,
                    senderName = event && event.sender && event.sender.name,
                    senderDisplayName = senderName,
                    message,
                    playerNode;
                if (this.gameManager && this.gameManager.roomId === roomId && senderName) {
                    playerNode = this.sceneScript.findPlayerNodeByName(senderName);
                    message = event.message;
                    if (playerNode) {
                        senderDisplayName = (playerNode.player && playerNode.player.data && playerNode.player.data.displayName) || senderDisplayName;
                        playerNode.setChatMessage(message);
                    }
                    this._addHistoryItem(senderDisplayName, message);
                }
            }.bind(this);
            NetworkManager.SmartFox.onPublicMessage(this.onPublicMessage);
        }

        if (this.checkboxQuitGameNode) {
            this.gameManager.eventDispatchers.local.addEventListener(
                GameManagerConstant.Event.UPDATE_REGISTER_QUIT_GAME_STATUS,
                this.onUpdateRegisterQuitGameStatus, this);
        }

        this.gameManager.eventDispatchers.local.addEventListener(
            GameManagerConstant.Event.UPDATE_BETTING_VALUES,
            this.onUpdateBettingValues, this);

        Utils.EventManager.onKeyReleased(cc.KEY.enter, this.chatEditBox.node, function () {
            self.sendChatMessage();
        });

        this.onUpdateBettingValues();
        this.onUpdateOption();
    },

    openPopupNapXien: function () {
        UiManager.openNapXienModal();
    },

    openSettings: function () {
        this.hideMenu();
        UiManager.openPopupSettings();
    },

    openHelp: function () {
        this.hideMenu();
        this.gameManager.openHelpModal();
    },

    openChatPanel: function () {
        var self = this;

        if (!self.chatScrollViewPosition) {
            return;
        }

        self.chatScrollView.node.stopAllActions();
        self.chatControlPanelNode.stopAllActions();

        self.chatScrollView.node.position = self.chatScrollViewHidePosition;
        self.chatControlPanelNode.position = self.chatControlPanelNodeHidePosition;
        this.chatPanelNode.active = true;

        self.chatScrollView.node.runAction(cc.sequence(
            cc.moveTo(0.2, self.chatScrollViewPosition).easing(cc.easeIn(3))
        ));

        self.chatControlPanelNode.runAction(cc.sequence(
            cc.moveTo(0.2, self.chatControlPanelNodePosition).easing(cc.easeIn(3))
        ));
    },

    closeChatPanel: function () {
        var self = this;

        if (!self.chatScrollViewPosition) {
            return;
        }

        self.chatScrollView.node.stopAllActions();
        self.chatControlPanelNode.stopAllActions();

        self.chatScrollView.node.position = self.chatScrollViewPosition;
        self.chatScrollView.node.runAction(cc.sequence(
            cc.moveTo(0.2, self.chatScrollViewHidePosition).easing(cc.easeIn(3))
        ));

        self.chatControlPanelNode.position = self.chatControlPanelNodePosition;
        self.chatControlPanelNode.runAction(cc.sequence(
            cc.moveTo(0.2, self.chatControlPanelNodeHidePosition).easing(cc.easeIn(3)),
            cc.callFunc(function () {
                self.chatPanelNode.active = false;
            })
        ));
    },

    toggleMenu: function () {
        this.menuDropDownNode.active = !this.menuDropDownNode.active;
        this.backdropNode.active = this.menuDropDownNode.active;
    },

    hideMenu: function () {
        this.menuDropDownNode.active = false;
        this.backdropNode.active = false;
    },

    openLeaveRoomConfirmModal: function () {
        this.hideMenu();
        UiManager.openConfirmModal('Khi thoát khỏi phòng, bạn sẽ bị tính như thua cuộc và bị trừ tiền. Bạn có chắc vẫn muốn thoát không?', {
            oke_fn: function () {
                this.gameManager.leaveRoom();
            }.bind(this)
        });
    },

    toggleRegisterQuitGame: function () {
        var player = this.gameManager.current.player;
        if (player) {
            if (player.data.isRegisteredToQuitGame) {
                this.gameManager.deregisterQuitGame();
            }
            else {
                this.gameManager.registerQuitGame();
            }
        }
        this.hideMenu();
    },

    onUpdateRegisterQuitGameStatus: function () {
        var player = this.gameManager.current.player;
        if (player) {
            this.checkboxQuitGameNode.active = player.data.isRegisteredToQuitGame;
        }
    },

    onUpdateBettingValues: function () {
        if (this.gameManager.bettingInfo.currency) {
            var gameName = this.gameRuntimeConfigs && this.gameRuntimeConfigs.game && this.gameRuntimeConfigs.game.CONFIG && this.gameRuntimeConfigs.game.CONFIG.NAME,
                prefix = (gameName || 'Mức cược') + ': ';
            this.setBettingLabel(prefix + Utils.Number.abbreviate(this.gameManager.bettingInfo.betting) + ' ' +
                CommonConstant.CurrencyType.findByName(this.gameManager.bettingInfo.currency).DISPLAY_NAME);
        }
    },

    onUpdateOption: function () {
        if (this.sceneScript) {
            var topPanelInGameData = this.sceneScript.topPanelInGameData;
            if (topPanelInGameData) {
                var optionLabel = topPanelInGameData.optionLabel || '';
                this.setOptionLabel(optionLabel);
            }
        }
    },

    setBettingLabel: function (text) {
        this.bettingLabel.string = text;
    },

    setOptionLabel: function (text) {
        this.optionLabel.string = text;
    },

    sendChatMessage: function () {
        var msg = this.chatEditBox.string;
        this.chatEditBox.string = '';
        this._sendChatMessage(msg);
    },

    _sendChatMessage: function (message) {
        this.closeChatPanel();
        if (message) {
            this.gameManager.sendChatMessage(message);
            this._saveNewMessage(message);
        }
    },

    _addHistoryItem: function (name, message) {
        var prefix = (this.chatHistoryLabel.string ? '\n' : '');
        var stringChat = '';
        if (name === AuthUser.username) {
            stringChat = prefix + '<color=#FFDE00>' + name + ':</color> ' + message;
        }
        else {
            stringChat = prefix + '<color=#02bbff>' + name + ':</color> ' + message;
        }
        this.chatHistoryLabel.string += stringChat;
        if (this.chatHistoryLabel.node.height < this.chatScrollView.node.height - 12) {
            this.chatScrollView.scrollToTop();
        }
        else {
            this.chatScrollView.scrollToBottom();
        }
    },

    _createQuickChatButton: function (msg) {
        var node = cc.instantiate(this.quickChatTemplateButtonNode);
        node.getComponentInChildren(cc.Label).string = msg;
        node.on(cc.Node.EventType.TOUCH_END, function (event) {
            event.stopPropagation();
            this._sendChatMessage(msg);
        }, this);
        return node;
    },

    _createAllQuickChatButtons: function (msgList) {
        var i;
        this.quickChatNode.removeAllChildren();
        for (i = 0; i < msgList.length; i += 1) {
            this.quickChatNode.addChild(this._createQuickChatButton(msgList[i]));
        }
    },

    _createAllQuickChatButtonsFromCache: function () {
        var msgList = this._getCacheMessages();
        this._createAllQuickChatButtons(msgList);
    },

    _saveNewMessage: function (msg) {
        var msgList = this._getCacheMessages();
        msgList.unshift(msg);
        msgList = this._truncateAndSaveCacheMessages(msgList);
        this._createAllQuickChatButtons(msgList);
    },

    _getCacheMessages: function () {
        var msgList = cc.sys.localStorage.getItem(LOCAL_CONSTANTS.CHAT_CACHE.KEY),
            delta,
            i;
        try {
            msgList = msgList ? JSON.parse(msgList) : [];
            if (msgList.length > LOCAL_CONSTANTS.CHAT_CACHE.MAX_ITEMS) {
                msgList = this._truncateAndSaveCacheMessages(msgList);
            }

        }
        catch (e) {
            msgList = [];
        }

        delta = LOCAL_CONSTANTS.CHAT_CACHE.MAX_ITEMS - msgList.length;
        if (delta) {
            for (i = 0; i < delta; i += 1) {
                msgList.unshift(LOCAL_CONSTANTS.CHAT_CACHE.DEFAULT_MESSAGES[i]);
            }
            msgList = this._truncateAndSaveCacheMessages(msgList);
        }
        return msgList;
    },

    _truncateAndSaveCacheMessages: function (msgList) {
        msgList = Utils.Array.unique(msgList);
        Utils.Array.trimRight(msgList, LOCAL_CONSTANTS.CHAT_CACHE.MAX_ITEMS);
        cc.sys.localStorage.setItem(LOCAL_CONSTANTS.CHAT_CACHE.KEY, JSON.stringify(msgList));
        return msgList;
    },
});
