var Rotatez = pc.createScript('rotatez');

Rotatez.attributes.add('rotateSpeed', {
    type: 'number',
    default: 10,
    title: 'Collectables Rotate Speed'
});

Rotatez.prototype.initialize = function() {
    this.currentAngle = 0; 
};

Rotatez.prototype.update = function(dt) {
    if (!this.entity.enabled) return;
    this.currentAngle -= this.rotateSpeed * dt;

    if (this.currentAngle >= 360) {
        this.currentAngle -= 360;
    }

    this.entity.setLocalEulerAngles(0, 0, this.currentAngle);
};
