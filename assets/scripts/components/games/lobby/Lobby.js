var GameManager = require('GameManager'),
    NetworkManager = require('NetworkManager'),
    CommonConstant = require('CommonConstant'),
    BaseGameOptionModal = require('BaseGameOptionModal'),
    AudioManager = require('AudioManager'),
    UiManager = require('UiManager'),
    EventDispatcher = require('EventDispatcher'),
    GameManagerConstant = require('GameManagerConstant'),
    PlatformImplement = require('PlatformImplement'),
    AuthUser = require('AuthUser'),
    Url = require('Url'),
    Utils = require('Utils'),
    TOP_WIN_GAME_ANIMATION = 'TopWinGamePanel',
    TOP_WIN_GAME_REVERSED_ANIMATION = 'TopWinGamePanelReversed',
    MAX_CHAT_MSG = 30;

cc.Class({
    extends: cc.Component,

    properties: {
        gameNameLabel: cc.Label,

        ipRoomTypeNode: cc.Node,
        xuRoomTypeNode: cc.Node,

        bettingSectionNode: cc.Node,
        bettingItemContainer: cc.Node,
        bettingItemListScrollView: cc.ScrollView,
        ipBettingItemTemplateNode: cc.Node,
        xuBettingItemTemplateNode: cc.Node,

        fakeBettingSectionNode: cc.Node,
        fakeCenterInBettingSectionNode: cc.Node,
        joinRoomLoadingSection: cc.Node,

        getBettingsLoadingSection: cc.Node,

        rightPanelNode: cc.Node,
        topWinGameContainerNode: cc.Node,
        topWinGameScrollView: cc.ScrollView,
        itemTopWinGamePrefab: cc.Prefab,

        chatLogScrollView: cc.ScrollView,
        chatLogLabel: cc.RichText,

        chatEditBox: cc.EditBox,

        inactiveBettingOpacity: 100
    },

    // use this for initialization
    onLoad: function () {
        var gameConfigs = GameManager.getLobbyGameRuntimeConfigs(),
            self = this;
        if (!gameConfigs) {
            return;
        }

        gameConfigs.isSuspending = false;
        this.game = gameConfigs.game;
        this.room = gameConfigs.room;

        this.bettingSectionNodePosition = this.bettingSectionNode.position;

        this.gameNameLabel.string = (this.game && this.game.name) || '';
        this.chatLogLabel.string = '';

        this.activeCurrency = null;
        this.bettingValuesByCurrencyMap = null;
        this.bettingItemContainer.removeAllChildren();
        GameManager.getBettingValues(this.game.gameId, function (response) {
            if (!this.isValid) {
                return;
            }

            var bettingValuesByCurrencies = response && response.bettingValues,
                bettingValuesByCurrency,
                i;
            if (bettingValuesByCurrencies) {
                this.bettingValuesByCurrencyMap = {};
                for (i = 0; i < bettingValuesByCurrencies.length; i += 1) {
                    bettingValuesByCurrency = bettingValuesByCurrencies[i];
                    if (bettingValuesByCurrency) {
                        this.bettingValuesByCurrencyMap[bettingValuesByCurrency.currency] = bettingValuesByCurrency.bettingValues;
                    }
                }
                this.getBettingsLoadingSection.active = false;
                this.showPiBettings();
            }
        }.bind(this));

        this.getTopWinGame();

        this.onPublicMessageBinding = this.onPublicMessage.bind(this);
        NetworkManager.SmartFox.onPublicMessage(this.onPublicMessageBinding);

        this.clickedBettingBtn = null;
        this.cloneClickedBettingBtn = null;

        this.topWinGameAnimationData = {
            name: TOP_WIN_GAME_REVERSED_ANIMATION,
            isPlaying: false,
            timeoutId: null,
            duration: this.node.getComponent(cc.Animation).getClips()[1].duration,
            touchMove: false
        };

        this.topWinGameScrollView.node.on(cc.Node.EventType.TOUCH_MOVE, function () {
            self.topWinGameAnimationData.touchMove = true;
        });

        [this.topWinGameScrollView.content.parent, this.rightPanelNode].forEach(function (node) {
            node.on(cc.Node.EventType.MOUSE_ENTER, function () {
                PlatformImplement.setCursorToHand();
            });
            node.on(cc.Node.EventType.MOUSE_LEAVE, function () {
                PlatformImplement.setCursorToNormal();
            });
        });

        // back key event
        Utils.EventManager.onKeyReleased(cc.KEY.back, this.node, function () {
            self.backToHall();
        });

        EventDispatcher.addEventListener(GameManagerConstant.Event.JOIN_GAME, this.onFinishJoinGame, this);

        cc.game.on(cc.game.EVENT_SHOW, this.$onFocus, this);
        cc.game.on(cc.game.EVENT_HIDE, this.$onLostFocus, this);
    },

    onDestroy: function () {
        if (this.clickedBettingBtn) {
            this.clickedBettingBtn.stopAllActions();
        }
        if (this.cloneClickedBettingBtn) {
            this.cloneClickedBettingBtn.stopAllActions();
        }
        if (this.bettingSectionNode) {
            this.bettingSectionNode.stopAllActions();
        }

        if (this.topWinGameAnimationData.timeoutId) {
            clearTimeout(this.topWinGameAnimationData.timeoutId);
            this.topWinGameAnimationData.timeoutId = null;
        }

        NetworkManager.SmartFox.offPublicMessage(this.onPublicMessageBinding);

        EventDispatcher.removeEventListener(GameManagerConstant.Event.JOIN_GAME, this.onFinishJoinGame, this);

        cc.game.off(cc.game.EVENT_SHOW, this.$onFocus, this);
        cc.game.off(cc.game.EVENT_HIDE, this.$onLostFocus, this);
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    $onFocus: function () {
        NetworkManager.SmartFox.onPublicMessage(this.onPublicMessageBinding);
    },

    $onLostFocus: function () {
        NetworkManager.SmartFox.offPublicMessage(this.onPublicMessageBinding);
    },

    _showBettingsByCurrency: function (currency) {
        AudioManager.instance.playButtonClick();

        if (this.activeCurrency !== currency) {
            var self = this,
                bettingItemTemplateNode,
                activeRoomTypeBtn,
                inactiveRoomTypeBtn,
                animation;
            if (currency === CommonConstant.CurrencyType.Xu.NAME) {
                bettingItemTemplateNode = this.xuBettingItemTemplateNode;
                activeRoomTypeBtn = this.xuRoomTypeNode;
                inactiveRoomTypeBtn = this.ipRoomTypeNode;
            }
            else {
                bettingItemTemplateNode = this.ipBettingItemTemplateNode;
                activeRoomTypeBtn = this.ipRoomTypeNode;
                inactiveRoomTypeBtn = this.xuRoomTypeNode;
            }

            if (activeRoomTypeBtn) {
                animation = activeRoomTypeBtn.getComponent(cc.Animation);
                if (animation) {
                    animation.play();
                }
            }
            if (inactiveRoomTypeBtn) {
                animation = inactiveRoomTypeBtn.getComponent(cc.Animation);
                if (animation) {
                    animation.stop();
                }
                var label = inactiveRoomTypeBtn.getComponentInChildren(cc.Label);
                if (label) {
                    label.node.runAction(cc.scaleTo(0.1, 1));
                }
                inactiveRoomTypeBtn.getComponentsInChildren(cc.Sprite).forEach(function (comp) {
                    if (comp.node !== inactiveRoomTypeBtn) {
                        comp.node.active = false;
                    }
                });
            }

            this.activeCurrency = currency;
            this._runAnimationHideBettingSection(function () {
                var preShowAnimation = self.bettingItemContainer.getChildren().length > 0;
                self.bettingItemContainer.removeAllChildren();
                if (self.bettingValuesByCurrencyMap) {
                    var bettingValues = self.bettingValuesByCurrencyMap[currency],
                        bettingItem,
                        betting,
                        i;
                    if (bettingValues) {
                        for (i = 0; i < bettingValues.length; i += 1) {
                            betting = bettingValues[i];
                            (function (betting) {
                                bettingItem = cc.instantiate(bettingItemTemplateNode);
                                bettingItem.active = true;
                                bettingItem.getComponentInChildren(cc.Label).string = Utils.Number.abbreviate(betting.value);
                                if (betting.isActive) {
                                    bettingItem.on(cc.Node.EventType.TOUCH_END, function () {
                                        var selfNode = this;
                                        AudioManager.instance.playButtonClick();

                                        if (self.game) {
                                            self.hideTopWinGamePanel(function () {
                                                var gameOptionModalPrefabLink = self.game.CONFIG.GAME_OPTION_MODAL_PREFAB,
                                                    gameId = self.game.gameId,
                                                    gameConfigs = {
                                                        currency: NetworkManager.SmartFox.type.utfString(self.activeCurrency),
                                                        isSolo: NetworkManager.SmartFox.type.bool(self.game.isSolo),
                                                        betting: NetworkManager.SmartFox.type.long(betting.value)
                                                    };
                                                // open game option modal then enter game later
                                                if (gameOptionModalPrefabLink) {
                                                    UiManager.openModalByName(gameOptionModalPrefabLink, function (modal) {
                                                        modal.getComponent(BaseGameOptionModal).init(gameId, gameConfigs, function (_gameConfigs, enterGameFn) {
                                                            self._runLoadingAnimation(self, selfNode, enterGameFn);
                                                        });
                                                    });
                                                }
                                                // enter game directly
                                                else {
                                                    self._runLoadingAnimation(self, selfNode, function () {
                                                        GameManager.enterGame(gameId, gameConfigs);
                                                    });
                                                }
                                            });
                                        }
                                    }, bettingItem);
                                }
                                else {
                                    bettingItem.opacity = self.inactiveBettingOpacity;
                                    bettingItem.getComponent(cc.Button).interactable = false;
                                }
                                self.bettingItemContainer.addChild(bettingItem);
                            }(betting));
                        }
                        self.bettingItemListScrollView.scrollToTop();
                        self._runAnimationShowBettingSection(preShowAnimation);
                    }
                }
            });
        }
    },

    _runLoadingAnimation: function (self, clickedBettingBtn, onFinishMovement) {
        this._stopLoadingAnimation();
        var cloneNode = cc.instantiate(clickedBettingBtn),
            centerPos = self.fakeBettingSectionNode.convertToNodeSpaceAR(
                self.fakeCenterInBettingSectionNode.convertToWorldSpace(cc.v2(0, 0))),
            posTmp = self.fakeBettingSectionNode.convertToNodeSpaceAR(clickedBettingBtn.convertToWorldSpace(cc.v2(0, 0))),
            pos = cc.v2(posTmp.x + cloneNode.width / 2, posTmp.y + cloneNode.height / 2),
            preloadSceneSuccess = false,
            animation = cc.sequence(
                cc.callFunc(function () {
                    self.bettingSectionNode.active = false;
                    self.joinRoomLoadingSection.active = true;
                    cloneNode.scale = 1;
                    cloneNode.parent = self.fakeBettingSectionNode;
                    cloneNode.position = pos;
                }),
                cc.moveTo(0.2, centerPos),
                cc.delayTime(1),
                cc.callFunc(function () {
                    var runSubAnimation = function () {
                        if (!subAnimation.__isStopped) {
                            cloneNode.runAction(subAnimation);
                        }
                    };
                    Utils.Director.preloadScene(self.game.CONFIG.SCENE, function () {
                        preloadSceneSuccess = true;
                        runSubAnimation();
                    }, runSubAnimation);
                })
            ),
            subAnimation = cc.sequence(
                cc.callFunc(function () {
                    if (preloadSceneSuccess && Utils.Type.isFunction(onFinishMovement)) {
                        onFinishMovement();
                    }
                }),
                cc.delayTime(GameManager.JOIN_GAME_TIMEOUT / 1000),
                cc.callFunc(function () {
                    self.bettingSectionNode.active = true;
                    self.joinRoomLoadingSection.active = false;
                    if (cloneNode) {
                        cloneNode.destroy();
                    }
                    clickedBettingBtn.runAction(cc.sequence(
                        cc.fadeOut(0.3),
                        cc.fadeIn(0.5)
                    ));
                })
            );
        cloneNode.targetOff(cloneNode);
        cloneNode.getComponent('ButtonScaler').destroy();
        cloneNode.runAction(animation);
        this.clickedBettingBtn = clickedBettingBtn;
        this.cloneClickedBettingBtn = cloneNode;
        this.subAnimation = subAnimation;
    },

    _stopLoadingAnimation: function () {
        this.bettingSectionNode.active = true;
        this.joinRoomLoadingSection.active = false;
        if (this.cloneClickedBettingBtn) {
            this.cloneClickedBettingBtn.stopAllActions();
            this.cloneClickedBettingBtn.destroy();
            this.cloneClickedBettingBtn = null;
        }
        if (this.clickedBettingBtn) {
            this.clickedBettingBtn.runAction(cc.sequence(
                cc.fadeOut(0.3),
                cc.fadeIn(0.5)
            ));
            this.clickedBettingBtn = null;
        }
        if (this.subAnimation) {
            this.subAnimation.__isStopped = true;
            this.subAnimation = null;
        }
    },

    onFinishJoinGame: function (params) {
        if (params && params.gameId === this.game.gameId && !params.isJoining) {
            this._stopLoadingAnimation();
        }
    },

    _runAnimationShowBettingSection: function (preShowAnimation) {
        var self = this,
            children = self.bettingSectionNode.getChildren(),
            child = children && children[0],
            moveToLowerAnimation = cc.spawn([
                // cc.moveTo(0, cc.v2(self.bettingSectionNodePosition.x, self.bettingSectionNodePosition.y - self.bettingSectionNode.height / 4)),
                cc.fadeOut(0)
            ]),
            moveToInitialPositionAnimation = cc.sequence(
                // cc.moveTo(0.2, self.bettingSectionNodePosition),
                cc.fadeIn(0.2)
            );
        self.bettingSectionNode.stopAllActions();
        if (preShowAnimation) {
            self.bettingSectionNode.runAction(cc.sequence(
                moveToLowerAnimation,
                moveToInitialPositionAnimation
            ));
        }
        else {
            if (child) {
                child.active = false;
            }
            self.bettingSectionNode.runAction(cc.sequence(
                moveToLowerAnimation,
                cc.callFunc(function () {
                    if (child) {
                        child.active = true;
                    }
                }),
                moveToInitialPositionAnimation
            ));
        }
    },

    _runAnimationHideBettingSection: function (onFinish) {
        var finishAnimation = cc.callFunc(function () {
            if (Utils.Type.isFunction(onFinish)) {
                onFinish();
            }
        });
        this.bettingSectionNode.stopAllActions();
        if (this.bettingItemContainer.getChildren().length > 0) {
            this.bettingSectionNode.runAction(cc.sequence(
                cc.spawn([
                    // cc.moveTo(0.1, cc.v2(this.bettingSectionNodePosition.x, this.bettingSectionNodePosition.y - this.bettingSectionNode.height / 3)),
                    cc.fadeOut(0.1)
                ]),
                finishAnimation
            ));
        }
        else {
            this.bettingSectionNode.runAction(cc.sequence(
                finishAnimation
            ));
        }
    },

    showXuBettings: function () {
        this._showBettingsByCurrency(CommonConstant.CurrencyType.Xu.NAME);
    },

    showPiBettings: function () {
        this._showBettingsByCurrency(CommonConstant.CurrencyType.Ip.NAME);
    },

    backToHall: function () {
        AudioManager.instance.playButtonClick();
        NetworkManager.SmartFox.leaveRoom(this.room.id);
        Utils.Director.loadScene(CommonConstant.Scene.HALL);
    },

    getTopWinGame: function () {
        var self = this;
        NetworkManager.Http.fetch('GET', Url.Http.TOP_WIN_GAME, {
                game_id: self.game.gameId
            }, {
                cache: 29 * 60,
                delay: 800
            })
            .success(function (topResp) {
                if (!self.isValid) {
                    return;
                }

                var topItemNode, topComponent, topSprite,
                    topItems = topResp.data,
                    i;
                self.topWinGameContainerNode.removeAllChildren();
                for (i = 0; i < topItems.length; i += 1) {
                    topItemNode = cc.instantiate(self.itemTopWinGamePrefab);
                    topComponent = topItemNode.getComponent('ItemTopWinGame');
                    topComponent.updateData(topItems[i]);
                    topSprite = topItemNode.getComponent(cc.Sprite);
                    topSprite.enabled = (i % 2 === 0);
                    self.topWinGameContainerNode.addChild(topItemNode);
                }
                self.topWinGameScrollView.scrollToTop();
            });
    },

    onPublicMessage: function (event) {
        var roomId = event && event.room && event.room.id,
            senderName = event && event.sender && event.sender.name,
            message;
        if (this.room && this.room.id === roomId && senderName) {
            message = event.message;
            this._addHistoryItem(senderName, message);
        }
    },

    _addHistoryItem: function (name, message) {
        var sep = (this.chatLogLabel.string ? '\n' : ''),
            msg = name.indexOf('[') >= 0 ? message : Utils.String.escape(Utils.String.removeRichText(message)),
            wrappedName = '<color=#02bbff>' + name + '</color>',
            stringChat = sep + wrappedName + ': ' + msg;
        this.chatLogLabel.string = (this.chatLogLabel.string || '').split('\n').slice(-MAX_CHAT_MSG).join('\n') + stringChat;
        if (this.chatLogLabel.node.height < this.chatLogScrollView.node.height - 12) {
            this.chatLogScrollView.scrollToTop();
        }
        else if (AuthUser.username === name) {
            this.chatLogScrollView.scrollToBottom();
        }
    },

    _decorateText: function (text) {
        var innerText = Utils.String.removeRichText(text);
        return text.replace(innerText, Utils.String.escape(innerText));
    },

    sendChatMessage: function () {
        var message = this.chatEditBox.string;
        this.chatEditBox.string = '';
        NetworkManager.SmartFox.sendPublicMessageRequest(message, this.room.id);
    },

    toggleTopWinGamePanel: function () {
        if (!this.topWinGameAnimationData.touchMove) {
            this._runTopWinGamePanelAnimation(this.topWinGameAnimationData.name === TOP_WIN_GAME_ANIMATION ?
                TOP_WIN_GAME_REVERSED_ANIMATION : TOP_WIN_GAME_ANIMATION);
        }
        this.topWinGameAnimationData.touchMove = false;
    },

    showTopWinGamePanel: function (callback) {
        this._runTopWinGamePanelAnimation(TOP_WIN_GAME_ANIMATION, callback);
    },

    hideTopWinGamePanel: function (callback) {
        this._runTopWinGamePanelAnimation(TOP_WIN_GAME_REVERSED_ANIMATION, callback);
    },

    _runTopWinGamePanelAnimation: function (name, callback) {
        if (this.topWinGameAnimationData.isPlaying || this.topWinGameAnimationData.name === name) {
            if (callback) {
                callback();
            }
            return;
        }

        var animation = this.node.getComponent(cc.Animation),
            self = this;
        if (animation) {
            if (name === TOP_WIN_GAME_REVERSED_ANIMATION) {
                this.topWinGameContainerNode.getComponentsInChildren('ItemTopWinGame').forEach(function (comp) {
                    comp.useShortInfo();
                });
            }
            else {
                this.topWinGameContainerNode.getComponentsInChildren('ItemTopWinGame').forEach(function (comp) {
                    comp.useLongInfo();
                });
            }
            this.topWinGameAnimationData.name = name;
            this.topWinGameAnimationData.isPlaying = true;
            animation.play(name);
            this.topWinGameAnimationData.timeoutId = setTimeout(function () {
                self.topWinGameAnimationData.isPlaying = false;
                if (callback) {
                    callback();
                }
            }, this.topWinGameAnimationData.duration);
        }
    }
});
