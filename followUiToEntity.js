var FollowUiToEntity = pc.createScript('followUiToEntity');

FollowUiToEntity.attributes.add('cameraEntity', { type: 'entity' })
FollowUiToEntity.attributes.add('targetEntity', { type: 'entity' })
FollowUiToEntity.attributes.add('screenEntity', { type: 'entity' })
FollowUiToEntity.attributes.add('positionThreshold', {
    type: 'number',
    default: 0.001,
    title: 'Position Change Threshold',
    description: 'Minimum position change required to move UI'
});
FollowUiToEntity.attributes.add('updateIntervalMs', {
    type: 'number',
    default: 50,
    title: 'Update Interval (ms)',
    description: '0 = every frame, >0 = throttle updates'
});
FollowUiToEntity.attributes.add('useAdaptiveIntervals', {
    type: 'boolean',
    default: true,
    title: 'Adaptive Intervals',
    description: 'Use more aggressive intervals on Mobile/Tablet'
});
FollowUiToEntity.attributes.add('mobileUpdateIntervalMs', {
    type: 'number',
    default: 100,
    title: 'Mobile Update Interval (ms)',
    description: 'Update interval when device is Mobile/Tablet'
});
FollowUiToEntity.attributes.add('idleTimeoutMs', {
    type: 'number',
    default: 2000,
    title: 'Idle Timeout (ms)',
    description: 'After this idle time, switch to idle update interval'
});
FollowUiToEntity.attributes.add('idleUpdateIntervalMs', {
    type: 'number',
    default: 500,
    title: 'Idle Update Interval (ms)',
    description: 'Update frequency while idle'
});
FollowUiToEntity.attributes.add('mobileIdleUpdateIntervalMs', {
    type: 'number',
    default: 500,
    title: 'Mobile Idle Update Interval (ms)',
    description: 'Idle update interval when device is Mobile/Tablet'
});
// initialize code called once per entity
FollowUiToEntity.prototype.initialize = function () {
    this.camera = this.cameraEntity.camera;
    this._screenPos = new pc.Vec3();
    this._prevPos = new pc.Vec3();
    this._prevEnabled = false;
    this._accumMs = 0;
    this._idleElapsedMs = 0;
    this._isIdle = false;
    this._baseIntervals = {
        updateIntervalMs: this.updateIntervalMs,
        idleUpdateIntervalMs: this.idleUpdateIntervalMs
    };
    this._onDeviceType = (type) => {
        if (!this.useAdaptiveIntervals) return;
        const isMobile = type === 'Mobile' || type === 'Tablet';
        if (isMobile) {
            this.updateIntervalMs = this.mobileUpdateIntervalMs || this.updateIntervalMs;
            this.idleUpdateIntervalMs = this.mobileIdleUpdateIntervalMs || this.idleUpdateIntervalMs;
        } else {
            this.updateIntervalMs = this._baseIntervals.updateIntervalMs;
            this.idleUpdateIntervalMs = this._baseIntervals.idleUpdateIntervalMs;
        }
    };
    this.app.on('DeviceDetector:DeviceType', this._onDeviceType, this);
};

// update code called every frame
FollowUiToEntity.prototype.postUpdate = function (dt) {
    const dtMs = dt * 1000;
    const baseInterval = this.updateIntervalMs > 0 ? this.updateIntervalMs : 0;
    const idleInterval = this.idleUpdateIntervalMs > 0 ? this.idleUpdateIntervalMs : baseInterval;
    const effectiveInterval = this._isIdle ? idleInterval : baseInterval;

    if (effectiveInterval > 0) {
        this._accumMs += dtMs;
        if (this._accumMs < effectiveInterval) return;
        this._accumMs = 0;
    }
    // World space position of target
    const worldPos = this.targetEntity.getPosition();
    const screenPos = this._screenPos;

    // Convert to screen space
    this.camera.worldToScreen(worldPos, screenPos);

    // Check if the entity is in front of the camera
    let changed = false;
    if (screenPos.z > 0) {
        if (!this._prevEnabled) {
            this.entity.element.enabled = true;
            this._prevEnabled = true;
            changed = true;
        }

        // Take pixel ratio into account
        const pixelRatio = this.app.graphicsDevice.maxPixelRatio;
        screenPos.x *= pixelRatio;
        screenPos.y *= pixelRatio;

        const device = this.app.graphicsDevice;

        const x = ((screenPos.x / device.width) * 2) - 1;
        const y = ((1 - (screenPos.y / device.height)) * 2) - 1;

        // Elements are positioned between -1 and 1 on both axes
        const dx = Math.abs(x - this._prevPos.x);
        const dy = Math.abs(y - this._prevPos.y);
        if (dx > this.positionThreshold || dy > this.positionThreshold) {
            this.entity.setPosition(x, y, 0);
            this._prevPos.set(x, y, 0);
            changed = true;
        }
    } else {
        if (this._prevEnabled) {
            this.entity.element.enabled = false;
            this._prevEnabled = false;
            changed = true;
        }
    }

    if (this.idleTimeoutMs > 0) {
        if (changed) {
            this._idleElapsedMs = 0;
            this._isIdle = false;
        } else {
            this._idleElapsedMs += dtMs;
            if (!this._isIdle && this._idleElapsedMs >= this.idleTimeoutMs) {
                this._isIdle = true;
            }
        }
    }
};

FollowUiToEntity.prototype.onDestroy = function () {
    if (this._onDeviceType) {
        this.app.off('DeviceDetector:DeviceType', this._onDeviceType, this);
        this._onDeviceType = null;
    }
};

// uncomment the swap method to enable hot-reloading for this script
// update the method body to copy state from the old instance
// FollowUiToEntity.prototype.swap = function(old) { };

// learn more about scripting here:
// https://developer.playcanvas.com/user-manual/scripting/
