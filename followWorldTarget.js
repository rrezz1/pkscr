var FollowWorldTarget = pc.createScript('followWorldTarget');

FollowWorldTarget.attributes.add('worldPos', {
    type: 'entity',
    array: true
});

FollowWorldTarget.attributes.add('uiPos', {
    type: 'entity',
    array: true
});

FollowWorldTarget.attributes.add('camera', {
    type: 'entity'
});

FollowWorldTarget.attributes.add('uiHolder', {
    type: 'entity'
});

FollowWorldTarget.attributes.add('positionThreshold', {
    type: 'number',
    default: 0.001,
    title: 'Position Change Threshold',
    description: 'Minimum position change required to trigger the event'
});
FollowWorldTarget.attributes.add('updateIntervalMs', {
    type: 'number',
    default: 50,
    title: 'Update Interval (ms)',
    description: '0 = every frame, >0 = throttle updates'
});
FollowWorldTarget.attributes.add('idleTimeoutMs', {
    type: 'number',
    default: 2000,
    title: 'Idle Timeout (ms)',
    description: 'After this idle time, switch to idle update interval'
});
FollowWorldTarget.attributes.add('idleUpdateIntervalMs', {
    type: 'number',
    default: 250,
    title: 'Idle Update Interval (ms)',
    description: 'Update frequency while idle'
});
FollowWorldTarget.attributes.add('fireIntervalMs', {
    type: 'number',
    default: 100,
    title: 'Fire Interval (ms)',
    description: 'Minimum interval between app.fire calls'
});

FollowWorldTarget.prototype.initialize = function() {
    // Store previous positions to detect changes
    this.previousUIPositions = [];
    this.previousEnabledStates = [];
    this._screenPos = new pc.Vec3();
    this._accumMs = 0;
    this._fireAccumMs = 0;
    this._idleElapsedMs = 0;
    this._isIdle = false;
    this._boundsCache = {
        useScreen: false,
        w: -1,
        h: -1,
        ax: -1,
        ay: -1,
        xminus: -1,
        xplus: 1,
        yminus: -1,
        yplus: 1
    };
    
    // Initialize arrays with default values
    for (let i = 0; i < this.uiPos.length; i++) {
        this.previousUIPositions.push(new pc.Vec3());
        this.previousEnabledStates.push(false);
    }
};

FollowWorldTarget.prototype.update = function(dt) {
    const dtMs = dt * 1000;
    const baseInterval = this.updateIntervalMs > 0 ? this.updateIntervalMs : 0;
    const idleInterval = this.idleUpdateIntervalMs > 0 ? this.idleUpdateIntervalMs : baseInterval;
    const effectiveInterval = this._isIdle ? idleInterval : baseInterval;

    if (effectiveInterval > 0) {
        this._accumMs += dtMs;
        if (this._accumMs < effectiveInterval) return;
        this._accumMs = 0;
    }
    if (this.fireIntervalMs > 0) {
        this._fireAccumMs += dtMs;
    }
    const changed = this._updatePos();
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

FollowWorldTarget.prototype._updateBounds = function() {
    // Default bounds
    let xminus = -1;
    let xplus = 1;
    let yminus = -1;
    let yplus = 1;

    if (this.uiHolder && this.uiHolder.element) {
        if (this.uiHolder.screen) {
            const screenRes = this.uiHolder.screen.resolution;
            xminus = -screenRes.x / 2;
            xplus = screenRes.x / 2;
            yminus = -screenRes.y / 2;
            yplus = screenRes.y / 2;
        } else if (this.uiHolder.element.anchor) {
            const deviceWidth = this.app.graphicsDevice.width;
            const deviceHeight = this.app.graphicsDevice.height;
            const anchor = this.uiHolder.element.anchor;
            xminus = -deviceWidth * anchor.x;
            xplus = deviceWidth * (1 - anchor.x);
            yminus = -deviceHeight * anchor.y;
            yplus = deviceHeight * (1 - anchor.y);
        }
    }

    this._boundsCache.xminus = xminus;
    this._boundsCache.xplus = xplus;
    this._boundsCache.yminus = yminus;
    this._boundsCache.yplus = yplus;
};

FollowWorldTarget.prototype._ensureBounds = function() {
    if (!this.uiHolder || !this.uiHolder.element) {
        if (this._boundsCache.useScreen !== false) {
            this._boundsCache.useScreen = false;
            this._updateBounds();
        }
        return;
    }

    if (this.uiHolder.screen) {
        const screenRes = this.uiHolder.screen.resolution;
        if (!this._boundsCache.useScreen ||
            this._boundsCache.w !== screenRes.x ||
            this._boundsCache.h !== screenRes.y) {
            this._boundsCache.useScreen = true;
            this._boundsCache.w = screenRes.x;
            this._boundsCache.h = screenRes.y;
            this._updateBounds();
        }
        return;
    }

    const anchor = this.uiHolder.element.anchor;
    const deviceWidth = this.app.graphicsDevice.width;
    const deviceHeight = this.app.graphicsDevice.height;
    if (this._boundsCache.useScreen ||
        this._boundsCache.w !== deviceWidth ||
        this._boundsCache.h !== deviceHeight ||
        this._boundsCache.ax !== anchor.x ||
        this._boundsCache.ay !== anchor.y) {
        this._boundsCache.useScreen = false;
        this._boundsCache.w = deviceWidth;
        this._boundsCache.h = deviceHeight;
        this._boundsCache.ax = anchor.x;
        this._boundsCache.ay = anchor.y;
        this._updateBounds();
    }
};

FollowWorldTarget.prototype._updatePos = function(dt) {
    const screenPos = this._screenPos;
    const pixelRatio = this.app.graphicsDevice.maxPixelRatio;
    
    // Track if any position or enabled state changed
    let anythingChanged = false;
    
    // Get uiHolder boundaries (cached)
    this._ensureBounds();
    const uiHolder_xminus = this._boundsCache.xminus;
    const uiHolder_xplus = this._boundsCache.xplus;
    const uiHolder_yminus = this._boundsCache.yminus;
    const uiHolder_yplus = this._boundsCache.yplus;

    for (let i = 0; i < this.worldPos.length; i++) {
        const target = this.worldPos[i];
        const uiEntity = this.uiPos[i];

        if (target && uiEntity) {
            const worldPosition = target.getPosition();

            this.camera.camera.worldToScreen(worldPosition, screenPos);

            // Check if enabled state changed
            const wasEnabled = this.previousEnabledStates[i];
            const isEnabled = screenPos.z > 0;
            
            if (isEnabled !== wasEnabled) {
                anythingChanged = true;
                this.previousEnabledStates[i] = isEnabled;
            }

            if (isEnabled) {
                uiEntity.element.enabled = true;

                screenPos.x *= pixelRatio;
                screenPos.y *= pixelRatio;

                const deviceWidth = this.app.graphicsDevice.width;
                const deviceHeight = this.app.graphicsDevice.height;

                // Convert to normalized coordinates (-1 to 1)
                let normalizedX = ((screenPos.x / deviceWidth) * 2) - 1;
                let normalizedY = ((1 - (screenPos.y / deviceHeight)) * 2) - 1;
                
                // Convert normalized coordinates to screen coordinates
                let screenX = (normalizedX + 1) * (deviceWidth / 2);
                let screenY = deviceHeight - ((normalizedY + 1) * (deviceHeight / 2));
                
                // Clamp to uiHolder boundaries
                screenX = Math.max(uiHolder_xminus, Math.min(uiHolder_xplus, screenX));
                screenY = Math.max(uiHolder_yminus, Math.min(uiHolder_yplus, screenY));
                
                // Convert back to normalized coordinates
                normalizedX = (screenX / (deviceWidth / 2)) - 1;
                normalizedY = 1 - (screenY / (deviceHeight / 2));

                const uiX = normalizedX;
                const uiY = normalizedY;
                
                // Check if position changed significantly
                const previousPos = this.previousUIPositions[i];
                const dx = Math.abs(uiX - previousPos.x);
                const dy = Math.abs(uiY - previousPos.y);
                const dz = Math.abs(0 - previousPos.z);

                if (dx > this.positionThreshold || dy > this.positionThreshold || dz > this.positionThreshold) {
                    anythingChanged = true;
                    previousPos.set(uiX, uiY, 0);
                }

                uiEntity.setPosition(uiX, uiY, 0);
            } else {
                uiEntity.element.enabled = false;
            }
        }
    }
    
    if (anythingChanged) {
        if (this.fireIntervalMs <= 0 || this._fireAccumMs >= this.fireIntervalMs) {
            this.app.fire('PLayerManager:Position_UI_Player_Cards');
            this._fireAccumMs = 0;
        }
    }
    return anythingChanged;
};
