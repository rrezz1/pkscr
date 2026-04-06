var DealerAnimation = pc.createScript('dealerAnimation');

DealerAnimation.attributes.add('dealerHand', { type: 'entity' });

DealerAnimation.prototype.initialize = function () {
    this.app.on('DealerAnimation:MoveHand_Once', this.callHandAnimationOnce, this);

    this.active = false;
    this.currentAngle = 0;
    this.targetAngle = 0;
    this.speed = 8; 
    this.isReturning = false;
    this.animationProgress = 0;
};

DealerAnimation.prototype.callHandAnimationOnce = function(){
    if (!this.active) {
        this.active = true;
        this.isReturning = false;
        this.animationProgress = 0;
        this.currentAngle = 0;
        this.targetAngle = -18;
    }
};

DealerAnimation.prototype.smoothStep = function(t) {
    return t * t * (3 - 2 * t);
};

DealerAnimation.prototype.update = function (dt) {
    if (!this.active || !this.dealerHand) return;

    this.animationProgress += dt * this.speed;
    var progress = Math.min(this.animationProgress, 1);
    var easedProgress = this.smoothStep(progress);

    if (!this.isReturning) {
        this.currentAngle = -18 * easedProgress;
        
        if (progress >= 1) {
            this.isReturning = true;
            this.animationProgress = 0;
        }
    } else {
        this.currentAngle = -18 * (1 - easedProgress);
        
        if (progress >= 1) {
            this.active = false;
            this.isReturning = false;
            this.currentAngle = 0;
        }
    }

    var euler = this.dealerHand.getLocalEulerAngles();
    euler.z = this.currentAngle;
    this.dealerHand.setLocalEulerAngles(euler);
};
