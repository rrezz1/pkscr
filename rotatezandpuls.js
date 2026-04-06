var Rotatezandpuls = pc.createScript('rotatezandpuls');

Rotatezandpuls.attributes.add('rotateSpeed', {
    type: 'number',
    default: 10,
    title: 'Collectables Rotate Speed'
});

Rotatezandpuls.prototype.initialize = function() {
    this.currentWidth = 58.38;
    this.currentHeight = 67.83;
    this.currentAngle = 0;

    this.targetWidth = 55.38;
    this.targetHeight = 64.83;

    this.pulseTimmer = 1.5;

    this._baseScale = this.entity.getLocalScale().clone();
    var widthRatio = this.targetWidth / this.currentWidth;
    var heightRatio = this.targetHeight / this.currentHeight;
    this._targetScale = new pc.Vec3(
        this._baseScale.x * widthRatio,
        this._baseScale.y * heightRatio,
        this._baseScale.z
    );

    this._pulseTimer = 0; 
};

Rotatezandpuls.prototype.update = function(dt) {
    // this.callRotete(dt);
    this.callScale(dt);
};

Rotatezandpuls.prototype.callRotete = function(dt) {
    this.currentAngle -= this.rotateSpeed * dt;
    if (this.currentAngle >= 360) {
        this.currentAngle -= 360;
    }
    this.entity.setLocalEulerAngles(0, 0, this.currentAngle);
};

Rotatezandpuls.prototype.callScale = function(dt) {
    if (!this.entity.enabled) {
        return;
    }

    this._pulseTimer += dt;
    var fullPulse = Math.max(this.pulseTimmer, 0.0001); 
    var halfPulse = fullPulse * 0.5;
    var phase = this._pulseTimer % fullPulse;
    var pulsingOut = phase < halfPulse; 
    var t = (phase % halfPulse) / halfPulse;

    var fromScale = pulsingOut ? this._baseScale : this._targetScale;
    var toScale = pulsingOut ? this._targetScale : this._baseScale;

    var x = pc.math.lerp(fromScale.x, toScale.x, t);
    var y = pc.math.lerp(fromScale.y, toScale.y, t);

    this.entity.setLocalScale(x, y, this._baseScale.z);
};
