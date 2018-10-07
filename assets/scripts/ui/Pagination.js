var Utils = require('Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        buttonTemplateNode: cc.Node,
        normalColor: cc.Color,
        activeColor: cc.Color,
        buttonListNode: cc.Node
    },

    // use this for initialization
    onLoad: function () {

    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    init: function (pageListInfo, handler) {
        var pageList = pageListInfo.pageList || pageListInfo.page_list,
            jumpFirst = pageListInfo.jumpFirst || pageListInfo.jump_first,
            jumpLast = pageListInfo.jumpLast || pageListInfo.jump_last,
            currentPage = pageListInfo.currentPage || pageListInfo.current_page || 0,
            page,
            i;

        this.buttonListNode.removeAllChildren();

        if (jumpFirst) {
            this._addPageButton(false, {
                jumpFirst: jumpFirst
            }, handler);
        }

        for (i = 0; i < pageList.length; i += 1) {
            page = pageList[i];
            this._addPageButton(page === currentPage, {
                page: page
            }, handler);
        }

        if (jumpLast) {
            this._addPageButton(false, {
                jumpLast: jumpLast
            }, handler);
        }
    },

    _addPageButton: function (isCurrentPage, pageInfo, handler) {
        var node = cc.instantiate(this.buttonTemplateNode),
            nodeLabel = node.getComponentInChildren(cc.Label),
            page = pageInfo.page,
            self = this;

        if (pageInfo.jumpFirst) {
            page = '<<';
        }
        else if (pageInfo.jumpLast) {
            page = '>>';
        }
        nodeLabel.string = page;
        this._setButtonState(node, isCurrentPage);

        node.on(cc.Node.EventType.TOUCH_START, (function (pageInfo) {
            return function () {
                var children = self.buttonListNode.getChildren(),
                    child,
                    i;
                for (i = 0; i < children.length; i += 1) {
                    child = children[i];
                    if (child === this) {
                        self._setButtonState(child, true);
                    }
                    else {
                        self._setButtonState(child, false);
                    }
                }
                if (Utils.Type.isFunction(handler)) {
                    handler(pageInfo);
                }
            };
        }(pageInfo)), node);

        node.active = true;

        this.buttonListNode.addChild(node);
    },

    _setButtonState: function (buttonNode, isActive) {
        buttonNode.getComponentInChildren(cc.Label).node.color = isActive ? this.activeColor : this.normalColor;
    }
});
