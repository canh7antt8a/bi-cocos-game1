var AudioManager = require('AudioManager');

cc.Class({
    extends: cc.Component,

    properties: {
        activeSprite: {
            default: null,
            type: cc.SpriteFrame,
        },
        normalSprite: {
            default: null,
            type: cc.SpriteFrame,
        },
        activeColor: {
            default: new cc.Color(255, 255, 255)
        },
        normalColor: {
            default: new cc.Color(255, 0, 0)
        },
        selectEvents: {
            default: [],
            type: cc.Component.EventHandler,
        }
    },

    // use this for initialization
    onLoad: function () {
        var tabsNode = this.node.getChildByName('Tabs'),
            tabs = tabsNode.children,
            that = this;
        for (var i = 0; i < tabs.length; i += 1) {
            tabs[i].on(cc.Node.EventType.TOUCH_START, this._onTouchBegan, this);
        }
        tabsNode.on('child-removed', function (event) {
            var contentsNode = that.node.getChildByName('Contents');
            contentsNode.getChildByName(event.detail.name).removeFromParent();
        });
    },

    onEnable: function () {
        var tabs = this.node.getChildByName('Tabs').children;
        // trigger first tab to be active
        if (tabs.length > 0 && !this.activeTabName) {
            this.activeByName(tabs[0].name);
        }
    },

    addTab: function (tabNode, contentNode) {
        var tabs = this.node.getChildByName('Tabs'),
            contents = this.node.getChildByName('Contents'),
            tabName = 'Tab' + tabs.children.length;
        contentNode.name = tabNode.name = tabName;
        tabs.addChild(tabNode);
        tabNode.on(cc.Node.EventType.TOUCH_START, this._onTouchBegan, this);
        contents.addChild(contentNode);
    },

    removeAllTabs: function () {
        this.node.getChildByName('Tabs').removeAllChildren();
        this.node.getChildByName('Contents').removeAllChildren();
    },

    _onTouchBegan: function (event) {
        AudioManager.instance.playButtonClick();
        this._activeByName(event.target.name);
        event.stopPropagation();
    },

    _activeByName: function (name) {
        var tabs = this.node.getChildByName('Tabs').children,
            contentsNode = this.node.getChildByName('Contents'),
            i, sprite, contentNode, labelNode, that = this;
        if (this.activeTabName === name) {
            return;
        }
        for (i = 0; i < tabs.length; i += 1) {
            contentNode = contentsNode.getChildByName(tabs[i].name);
            labelNode = tabs[i].getComponentInChildren(cc.Label).node;
            sprite = tabs[i].getComponent(cc.Sprite);
            if (tabs[i].name === name) {
                this.activeTabName = name;
                contentNode.active = true;
                labelNode.color = this.activeColor;
                sprite.spriteFrame = this.activeSprite;
                // contentNode.scaleX = 0;
                // contentNode.runAction(cc.spawn([cc.scaleTo(0.05, 1, 1), cc.fadeIn(0.05)]));

                that.selectEvents.forEach(function (selectEvent) {
                    selectEvent.emit([tabs[i], contentNode]);
                });
            }
            else {
                contentNode.active = false;
                labelNode.color = this.normalColor;
                sprite.spriteFrame = this.normalSprite;
            }
        }
    },

    activeByName: function (name) {
        var selectedTab = this.node.getChildByName('Tabs').getChildByName(name),
            buttonComponent = selectedTab.getComponent(cc.Button),
            i;
        this._activeByName(name);
        if (buttonComponent) {
            for (i = 0; i < buttonComponent.clickEvents.length; i += 1) {
                buttonComponent.clickEvents[i].emit(selectedTab);
            }
        }
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
