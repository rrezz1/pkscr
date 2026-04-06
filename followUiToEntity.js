var FollowUiToEntity = pc.createScript('followUiToEntity');

FollowUiToEntity.attributes.add('cameraEntity', { type: 'entity' })
FollowUiToEntity.attributes.add('targetEntity', { type: 'entity' })
FollowUiToEntity.attributes.add('screenEntity', { type: 'entity' })
// initialize code called once per entity
FollowUiToEntity.prototype.initialize = function () {
    this.camera = this.cameraEntity.camera;
    this._screenPos = new pc.Vec3();
};

// update code called every frame
FollowUiToEntity.prototype.postUpdate = function (dt) {
    // World space position of target
    const worldPos = this.targetEntity.getPosition();
    const screenPos = this._screenPos;

    // Convert to screen space
    this.camera.worldToScreen(worldPos, screenPos);

    // Check if the entity is in front of the camera
    if (screenPos.z > 0) {
        this.entity.element.enabled = true;

        // Take pixel ratio into account
        const pixelRatio = this.app.graphicsDevice.maxPixelRatio;
        screenPos.x *= pixelRatio;
        screenPos.y *= pixelRatio;

        const device = this.app.graphicsDevice;

        const x = ((screenPos.x / device.width) * 2) - 1;
        const y = ((1 - (screenPos.y / device.height)) * 2) - 1;

        // Elements are positioned between -1 and 1 on both axes
        this.entity.setPosition(x, y, 0);
    } else {
        this.entity.element.enabled = false;
    }
};

// uncomment the swap method to enable hot-reloading for this script
// update the method body to copy state from the old instance
// FollowUiToEntity.prototype.swap = function(old) { };

// learn more about scripting here:
// https://developer.playcanvas.com/user-manual/scripting/
