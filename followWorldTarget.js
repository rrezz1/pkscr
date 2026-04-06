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

FollowWorldTarget.prototype.initialize = function() {
    // Store previous positions to detect changes
    this.previousUIPositions = [];
    this.previousEnabledStates = [];
    this._screenPos = new pc.Vec3();
    
    // Initialize arrays with default values
    for (let i = 0; i < this.uiPos.length; i++) {
        this.previousUIPositions.push(new pc.Vec3());
        this.previousEnabledStates.push(false);
    }
};

FollowWorldTarget.prototype.update = function(dt) {
    this._updatePos();
};

FollowWorldTarget.prototype._updatePos = function(dt) {
    const screenPos = this._screenPos;
    const pixelRatio = this.app.graphicsDevice.maxPixelRatio;
    
    // Track if any position or enabled state changed
    let anythingChanged = false;
    
    // Get uiHolder boundaries
    let uiHolder_xminus = -1;
    let uiHolder_xplus = 1;
    let uiHolder_yminus = -1;
    let uiHolder_yplus = 1;
    
    if (this.uiHolder && this.uiHolder.element) {
        if (this.uiHolder.screen) {
            const screenRes = this.uiHolder.screen.resolution;
            uiHolder_xminus = -screenRes.x / 2;
            uiHolder_xplus = screenRes.x / 2;
            uiHolder_yminus = -screenRes.y / 2;
            uiHolder_yplus = screenRes.y / 2;
        }
        else if (this.uiHolder.element.anchor) {
            const deviceWidth = this.app.graphicsDevice.width;
            const deviceHeight = this.app.graphicsDevice.height;
            const anchor = this.uiHolder.element.anchor;
            
            uiHolder_xminus = -deviceWidth * anchor.x;
            uiHolder_xplus = deviceWidth * (1 - anchor.x);
            uiHolder_yminus = -deviceHeight * anchor.y;
            uiHolder_yplus = deviceHeight * (1 - anchor.y);
        }
    }

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
        this.app.fire('PLayerManager:Position_UI_Player_Cards');
    }
};
