var Utils = require('Utils'),
    AnimationManager;

AnimationManager = {

    /**
     * Fill a node UI by growth circle at any point.
     *
     * @param  {Node}     node                    node
     * @param  {Position} centerPositionNodeSpace position of center of circle (node space)
     * @param  {Number}   duration                duration in seconds
     * @param  {Boolean}  isStopManually          stop animation manually or not
     * @param  {Function} finishCallback          animation finishing callback
     * @return {Function}                         function to stop animation
     */
    fillRadial: (function () {
        var UPDATE_INTERVAL = 10; // 10ms

        function getMaxRadius(node, centerPositionNodeSpace) {
            var w = node.width,
                h = node.height,
                x = centerPositionNodeSpace.x,
                y = centerPositionNodeSpace.y;

            return Math.max(
                calcHypotenuse(x, y),
                calcHypotenuse(x, h - y),
                calcHypotenuse(w - x, y),
                calcHypotenuse(w - x, h - y)
            );
        }

        function calcHypotenuse(a1, a2) {
            return Math.sqrt(a1 * a1 + a2 * a2);
        }

        return function (node, centerPositionNodeSpace, options) {
            options = options || {};
            if (!node || !centerPositionNodeSpace || options.duration <= 0) {
                return null;
            }

            var radius = getMaxRadius(node, centerPositionNodeSpace),
                diameter = radius * 2,
                rectMaskNode = new cc.Node(),
                rectMask = rectMaskNode.addComponent(cc.Mask),
                circleMaskNode = new cc.Node(),
                circleMask = circleMaskNode.addComponent(cc.Mask),
                spriteNode = new cc.Node(),
                sprite = spriteNode.addComponent(cc.Sprite),
                radiusIncrStep = radius * UPDATE_INTERVAL / (options.duration * 1000),
                diamterIncrStep = 2 * radiusIncrStep,
                intervalId;

            cc.loader.loadRes('textures/SingleColor', cc.SpriteFrame, function (err, spriteFrame) {
                if (!err) {
                    try {
                        sprite.spriteFrame = spriteFrame;
                    }
                    catch (e) {}
                }
            });

            circleMask.type = cc.Mask.Type.ELLIPSE;
            circleMaskNode.parent = rectMaskNode;
            circleMaskNode.setContentSize(0, 0);
            circleMaskNode.setPosition(centerPositionNodeSpace.x - node.width / 2,
                centerPositionNodeSpace.y - node.height / 2);

            spriteNode.color = options.color || cc.Color.BLACK;
            spriteNode.opacity = (options.opacity >= 0 ? options.opacity : 80);
            spriteNode.parent = circleMaskNode;

            rectMask.type = cc.Mask.Type.RECT;
            rectMaskNode.parent = node;
            rectMaskNode.setContentSize(node.getContentSize());
            rectMaskNode.setSiblingIndex(0);

            function stop() {
                if (intervalId) {
                    clearInterval(intervalId);
                    intervalId = null;
                }

                node.removeChild(rectMaskNode);
                if (rectMaskNode && rectMaskNode.isValid) {
                    rectMaskNode.destroy();
                }
            }

            intervalId = setInterval(function () {
                if (!circleMaskNode || !circleMaskNode.isValid || circleMaskNode.width >= diameter) {
                    if (!options.isStopManually) {
                        stop();
                    }
                    if (Utils.Type.isFunction(options.finishCallback)) {
                        options.finishCallback();
                    }
                    return;
                }

                circleMaskNode.setContentSize(circleMaskNode.width + diamterIncrStep, circleMaskNode.height + diamterIncrStep);
                spriteNode.setContentSize(circleMaskNode.getContentSize());
            }, UPDATE_INTERVAL);

            return stop;
        };
    }())

};

module.exports = AnimationManager;
