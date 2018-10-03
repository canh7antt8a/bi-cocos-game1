cc.Class({
    extends: cc.Component,

    properties: {
        radius: 45,
        timeRotate: 3,
        particleNode: cc.Node
    },

    onLoad: function () {
        this.run = false;
        this.time = 0;
        this.isIncrease = true;
    },

    update: function (dt) {
        if (this.time >= 0.01) {
            if (!this.run) {
                this.time = 0;
                this.run = true;
                var particleSystem = this.particleNode.getComponent(cc.ParticleSystem);
                if (particleSystem) {
                    particleSystem.resetSystem();
                }
            }
        }
        if (this.isIncrease) {
            this.time += dt / this.timeRotate;
        }
        if (this.time >= 1) {
            this.time = 0;
        }
        var dirY = this.time < 0.5 ? 1 : -1;
        // x di chuyen giao dong dieu hoa => x = Rcos(2πt)
        // Duong tron x2 + y2 = R2 => y =sqrt(R2-x2)
        var x = this.radius * Math.cos(2 * Math.PI * this.time);
        var y = dirY * Math.sqrt(this.radius * this.radius - x * x);
        this.particleNode.position = cc.v2(x, y);
    },
});
