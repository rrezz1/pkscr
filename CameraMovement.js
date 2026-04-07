var CameraMovement = pc.createScript('cameraMovement');

CameraMovement.attributes.add('mainCamera', { type: 'entity', title: 'Main Camera' });
CameraMovement.attributes.add('cameraToPositionUI', { type: 'entity' });
CameraMovement.prototype.initialize = function() {
    this.camDelay = 0.5;
    this.didCameraWentBack = false;
    this.isMoving = false;
    this.cameraNeverStarted = true;
    this.app.on('GameManager_MOVECAMERA', this.startCameraMovement, this);
    this.app.on('CameraController_UIManager:Fold', this.moveCameraBack, this);
    this.app.on('CameraController_UIManager:Check', this.bringCameraBackToTheGame, this);
    this.app.on('CameraController:PositoinCameraForUIUsers', this.positoinCameraforUIUsers, this);
    this.setButtonsUIState(false, true);
    
    const targetData = this.getCurrentCamPosRot();
    this.targetCamPos = targetData.position;
    this.targetCamRot = targetData.rotation;

    // PERF: scratch objects — no per-frame heap allocation in manualUpdate
    this._scratchPos = new pc.Vec3();
    this._scratchRot = new pc.Quat();

    window.addEventListener('resize', this.handleScreenResize.bind(this));
    // PERF: manualUpdate is now called from update() directly — no setInterval needed
};

CameraMovement.prototype.startCameraMovement = function() {
    if (this.mainCamera) {
        
        this.startCamPos = new pc.Vec3(0, 5.339,4.741);
        this.startCamRot = new pc.Quat().setFromEulerAngles(-45.4, 0, 0); 
       
        const targetData = this.getCurrentCamPosRot();
        
        this.targetCamPos = targetData.position;
        this.targetCamRot = targetData.rotation;

        this.positoinCameraforUIUsers();
        this.mainCamera.setLocalPosition(this.startCamPos);
        this.mainCamera.setLocalRotation(this.startCamRot);


   
        this.camLerpProgress = 0;
        this.camLerpDuration = 1;
        this.camMoving = true;
        this.isMoving = true; 
    } 
};

CameraMovement.prototype.positoinCameraforUIUsers = function() {
        const targetData = this.getCurrentCamPosRot();
        
        this.targetCamPos = targetData.position;
        this.targetCamRot = targetData.rotation;
        this.cameraToPositionUI.setLocalPosition(this.targetCamPos);
        this.cameraToPositionUI.setLocalRotation(this.targetCamRot);
        
};

CameraMovement.prototype.getCurrentCamPosRot = function() {
let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;
const viewportWidth = Math.max(screenWidth, screenHeight);
const viewportHeight = Math.min(screenWidth, screenHeight);
const aspectRatio = viewportWidth / viewportHeight;

let targetPos, targetRot;
let deviceType = "";

if (viewportWidth < 640) {
    if(aspectRatio >= 2.10){
        deviceType = "  Tiny Phone Landscape (<640px)";
        targetPos = new pc.Vec3(0, 3, 4);
        targetRot = new pc.Quat().setFromEulerAngles(-40, 0, 0);
    }else if(aspectRatio < 2.10 && aspectRatio >= 1.92){
       deviceType = "  Tiny Phone Landscape (<640px)";
        targetPos = new pc.Vec3(0, 4, 3.6);
        targetRot = new pc.Quat().setFromEulerAngles(-45, 0, 0);
    }
    else if(aspectRatio < 1.92 && aspectRatio >= 1.78){

        deviceType = "  Tiny Phone Landscape (<640px)";
        targetPos = new pc.Vec3(0, 4.7, 4);
        targetRot = new pc.Quat().setFromEulerAngles(-50, 0, 0);
    }else if(aspectRatio < 1.78 && aspectRatio >= 1.55){

        deviceType = "  Tiny Phone Landscape (<640px)";
        targetPos = new pc.Vec3(0, 6, 3.2);
        targetRot = new pc.Quat().setFromEulerAngles(-58, 0, 0);
    }else if(aspectRatio < 1.55 && aspectRatio >= 1.37){

        deviceType = "  Tiny Phone Landscape (<640px)";
        targetPos = new pc.Vec3(0, 7, 4);
        targetRot = new pc.Quat().setFromEulerAngles(-60, 0, 0);
    }else if(aspectRatio < 1.37 && aspectRatio>= 1.23){

        deviceType = "  Tiny Phone Landscape (<640px)";
        targetPos = new pc.Vec3(0, 8, 5);
        targetRot = new pc.Quat().setFromEulerAngles(-55, 0, 0);
    }else if(aspectRatio < 1.23){

        deviceType = "  Tiny Phone Landscape (<640px)";
        targetPos = new pc.Vec3(0, 10, 7);
        targetRot = new pc.Quat().setFromEulerAngles(-55, 0, 0);
    }
}
else if (viewportWidth >= 640 && viewportWidth < 740) {
    if(aspectRatio >= 2){
        deviceType = "Small Phone Landscape (640-740px)";
        targetPos = new pc.Vec3(0, 4, 3.0);
        targetRot = new pc.Quat().setFromEulerAngles(-50, 0, 0);
    }else if(aspectRatio < 2 && aspectRatio >= 1.85){
        deviceType = "Small Phone Landscape (640-740px)";
        targetPos = new pc.Vec3(0, 4.7, 3);
        targetRot = new pc.Quat().setFromEulerAngles(-55, 0, 0);

    }else if(aspectRatio < 1.85 && aspectRatio >= 1.66){
        deviceType = "Small Phone Landscape (640-740px)";
        targetPos = new pc.Vec3(0, 6, 2.6);
        targetRot = new pc.Quat().setFromEulerAngles(-62, 0, 0);

    }else if(aspectRatio < 1.66 && aspectRatio >= 1.50){
        deviceType = "Small Phone Landscape (640-740px)";
        targetPos = new pc.Vec3(0, 6.5, 3);
        targetRot = new pc.Quat().setFromEulerAngles(-62, 0, 0);

    }else if(aspectRatio < 1.50 && aspectRatio >= 1.24){
        deviceType = "Small Phone Landscape (640-740px)";
        targetPos = new pc.Vec3(0, 8.2, 4);
        targetRot = new pc.Quat().setFromEulerAngles(-60, 0, 0);

    }else if(aspectRatio < 1.24){
        deviceType = "Small Phone Landscape (640-740px)";
        targetPos = new pc.Vec3(0, 9, 7);
        targetRot = new pc.Quat().setFromEulerAngles(-55, 0, 0);

    }
}
else if (viewportWidth >= 740 && viewportWidth < 820) {
    if(aspectRatio >= 1.92){
        deviceType = "Phone Landscape (740-820px)";
        targetPos = new pc.Vec3(0, 4.7, 2.8);
        targetRot = new pc.Quat().setFromEulerAngles(-56, 0, 0);
    }else if(aspectRatio < 1.92 && aspectRatio >= 1.73){
        deviceType = "Phone Landscape (740-820px)";
        targetPos = new pc.Vec3(0, 5.5, 2.8);
        targetRot = new pc.Quat().setFromEulerAngles(-60, 0, 0);
    }else if(aspectRatio < 1.73 && aspectRatio >= 1.56){
        deviceType = "Phone Landscape (740-820px)";
        targetPos = new pc.Vec3(0, 6, 3);
        targetRot = new pc.Quat().setFromEulerAngles(-60, 0, 0);
    }else if(aspectRatio < 1.56 && aspectRatio >= 1.44){
        deviceType = "Phone Landscape (740-820px)";
        targetPos = new pc.Vec3(0, 7, 3);
        targetRot = new pc.Quat().setFromEulerAngles(-62, 0, 0);
    }else if(aspectRatio < 1.44 && aspectRatio >= 1.28){
        deviceType = "Phone Landscape (740-820px)";
        targetPos = new pc.Vec3(0, 8.5, 4);
        targetRot = new pc.Quat().setFromEulerAngles(-60, 0, 0);
    }else if(aspectRatio < 1.28){
        deviceType = "Phone Landscape (740-820px)";
        targetPos = new pc.Vec3(0, 10, 6);
        targetRot = new pc.Quat().setFromEulerAngles(-60, 0, 0);
    }
}
else if (viewportWidth >= 820 && viewportWidth < 896) {
    if(aspectRatio >= 1.92){
        deviceType = "Phone Landscape (740-820px)";
        targetPos = new pc.Vec3(0, 4.2, 2.8);
        targetRot = new pc.Quat().setFromEulerAngles(-53, 0, 0);
    }else if(aspectRatio < 1.92 && aspectRatio >= 1.73){
        deviceType = "Phone Landscape (740-820px)";
        targetPos = new pc.Vec3(0, 5.5, 2.8);
        targetRot = new pc.Quat().setFromEulerAngles(-60, 0, 0);
    }else if(aspectRatio < 1.73 && aspectRatio >= 1.56){
        deviceType = "Phone Landscape (740-820px)";
        targetPos = new pc.Vec3(0, 6.5, 2.8);
        targetRot = new pc.Quat().setFromEulerAngles(-65, 0, 0);
    }else if(aspectRatio < 1.56 && aspectRatio >= 1.44){
        deviceType = "Phone Landscape (740-820px)";
        targetPos = new pc.Vec3(0, 7, 3);
        targetRot = new pc.Quat().setFromEulerAngles(-62, 0, 0);
    }else if(aspectRatio < 1.44 && aspectRatio >= 1.37){
        deviceType = "Phone Landscape (740-820px)";
        targetPos = new pc.Vec3(0, 7.8, 3);
        targetRot = new pc.Quat().setFromEulerAngles(-65, 0, 0);
    }else if(aspectRatio < 1.37 && aspectRatio >= 1.18){
        deviceType = "Phone Landscape (740-820px)";
        targetPos = new pc.Vec3(0, 9, 4);
        targetRot = new pc.Quat().setFromEulerAngles(-65, 0, 0);
    }else if(aspectRatio < 1.18){
        deviceType = "Phone Landscape (740-820px)";
        targetPos = new pc.Vec3(0, 12, 4.5);
        targetRot = new pc.Quat().setFromEulerAngles(-70, 0, 0);
    }
}
else if (viewportWidth >= 896 && viewportWidth < 1024) {
    
    if (aspectRatio >= 2.42){

       deviceType = "iPhone Pro Landscape (896-1024px) aspectRatio > 1.74";
        targetPos = new pc.Vec3(0, 4.5, 2.5);
        targetRot = new pc.Quat().setFromEulerAngles(-57, 0, 0);
    }else if (aspectRatio < 2.42 && aspectRatio > 1.43){

     deviceType = "iPhone Pro Landscape (896-1024px) aspectRatio > 1.43";
        targetPos = new pc.Vec3(0,7.5, 2.5);
        targetRot = new pc.Quat().setFromEulerAngles(-65, 0, 0);
    }
    else if (aspectRatio <= 1.43 && aspectRatio > 1.3) {
        deviceType = "iPhone Pro Landscape (896-1024px)";
        targetPos = new pc.Vec3(0, 8.5, 3.5);
        targetRot = new pc.Quat().setFromEulerAngles(-62, 0, 0);
    }else if (aspectRatio <= 1.3 && aspectRatio > 1.14) {
        deviceType = "iPhone Pro Landscape (896-1024px)";
        targetPos = new pc.Vec3(0, 10, 4);
        targetRot = new pc.Quat().setFromEulerAngles(-65, 0, 0);
    }else if (aspectRatio <= 1.14) {
        deviceType = "iPhone Pro Landscape (896-1024px)";
        targetPos = new pc.Vec3(0, 12, 5);
        targetRot = new pc.Quat().setFromEulerAngles(-65, 0, 0);
    }
    
    // else if(aspectRatio <= 1.3){
    
    //     deviceType = "iPhone Pro Landscape (896-1024px) aspectRatio <= 1.3";
    //     targetPos = new pc.Vec3(0, 8, 2.0);
    //     targetRot = new pc.Quat().setFromEulerAngles(-70, 0, 0);
    
    // }
}
else if (viewportWidth >= 1024 && viewportWidth < 1170) {
    if (aspectRatio >= 1.7) {
        deviceType = "iPhone Pro Max Landscape (1024-1170px)";
        targetPos = new pc.Vec3(0, 6, 2.5);
        targetRot = new pc.Quat().setFromEulerAngles(-65, 0, 0);
    } else if(aspectRatio < 1.77 && aspectRatio >= 1.47){
        deviceType = "iPhone Pro Max Landscape (1024-1170px)";
        targetPos = new pc.Vec3(0, 7.5, 2.3);
        targetRot = new pc.Quat().setFromEulerAngles(-68, 0, 0);
    }else if(aspectRatio < 1.47 && aspectRatio >= 1.1){
        deviceType = "iPhone Pro Max Landscape (1024-1170px)";
        targetPos = new pc.Vec3(0, 10.5, 3.8);
        targetRot = new pc.Quat().setFromEulerAngles(-67, 0, 0);
    }else if(aspectRatio < 1.1){
        deviceType = "iPhone Pro Max Landscape (1024-1170px)";
        targetPos = new pc.Vec3(0, 12, 3.5);
        targetRot = new pc.Quat().setFromEulerAngles(-70, 0, 0);
    }
}
else if (viewportWidth >= 1170 && viewportWidth < 1290) {
    if (aspectRatio >= 1.9) {
        deviceType = "Wide Monitor (1170-1290px)";
        targetPos = new pc.Vec3(0, 5, 2.8);
        targetRot = new pc.Quat().setFromEulerAngles(-58, 0, 0);
    }else if (aspectRatio < 1.9 && aspectRatio >= 1.51) {
        deviceType = "Wide Monitor (1170-1290px)";
        targetPos = new pc.Vec3(0, 6.5, 3);
        targetRot = new pc.Quat().setFromEulerAngles(-60, 0, 0);
    }else if (aspectRatio < 1.51 && aspectRatio >= 1.43) {
        deviceType = "Wide Monitor (1170-1290px)";
        targetPos = new pc.Vec3(0, 7, 3);
        targetRot = new pc.Quat().setFromEulerAngles(-63, 0, 0);
    }else if (aspectRatio < 1.43 && aspectRatio >= 1.21) {
        deviceType = "Wide Monitor (1170-1290px)";
        targetPos = new pc.Vec3(0, 9, 3.5);
        targetRot = new pc.Quat().setFromEulerAngles(-65, 0, 0);
    }else if (aspectRatio < 1.21 ) {
        deviceType = "Wide Monitor (1170-1290px)";
        targetPos = new pc.Vec3(0, 12, 4);
        targetRot = new pc.Quat().setFromEulerAngles(-68, 0, 0);
    }
    //  else {
    //     deviceType = "iPhone Plus Landscape (1170-1290px)";
    //     targetPos = new pc.Vec3(0, 5.0, 1.7);
    //     targetRot = new pc.Quat().setFromEulerAngles(-65, 0, 0);
    // }
}
else if (viewportWidth >= 1290 && viewportWidth < 1366) {
    if (aspectRatio > 1.78) {
        deviceType = "Wide Screen (1290-1366px)";
        targetPos = new pc.Vec3(0, 5.5, 2.6);
        targetRot = new pc.Quat().setFromEulerAngles(-62, 0, 0);
    } else if (aspectRatio <= 1.78 && aspectRatio >= 1.33 ){
        deviceType = "iPad Mini/Small Tablet (1290-1366px)";
        targetPos = new pc.Vec3(0, 8.3, 3);
        targetRot = new pc.Quat().setFromEulerAngles(-70, 0, 0);
    }else if(aspectRatio< 1.33){
        
        deviceType = "iPad Mini/Small Tablet (1290-1366px)";
        targetPos = new pc.Vec3(0, 11, 4.5);
        targetRot = new pc.Quat().setFromEulerAngles(-67, 0, 0);
    }
}
else if (viewportWidth >= 1366 && viewportWidth < 1480) {
    if(aspectRatio >= 1.7){
        deviceType = "Wide Screen (1366-1480px)";
        targetPos = new pc.Vec3(0, 6.2, 2.5);
        targetRot = new pc.Quat().setFromEulerAngles(-65, 0, 0);
    }else if (aspectRatio > 1.6 && aspectRatio < 1.7) {
        deviceType = "Wide Screen (1366-1480px)";
        targetPos = new pc.Vec3(0, 7, 2.5);
        targetRot = new pc.Quat().setFromEulerAngles(-66, 0, 0);
    }
    else if(aspectRatio <= 1.6 && aspectRatio >= 1.35 ) {
        deviceType = "Wide Screen (1366-1480px)";
        targetPos = new pc.Vec3(0, 8, 3);
        targetRot = new pc.Quat().setFromEulerAngles(-65, 0, 0);
    }else if(aspectRatio < 1.35 ) {
        deviceType = "Wide Screen (1366-1480px)";
        targetPos = new pc.Vec3(0, 11, 3.7);
        targetRot = new pc.Quat().setFromEulerAngles(-68, 0, 0);
    }
}
else if (viewportWidth >= 1480 && viewportWidth < 1600) {
    if (aspectRatio > 1.8) {
        deviceType = "iPad Standard (1480-1600px)";
        targetPos = new pc.Vec3(0, 6, 2.5);
        targetRot = new pc.Quat().setFromEulerAngles(-65, 0, 0);
    }else if(aspectRatio <= 1.8 && aspectRatio >= 1.35){

        deviceType = "iPad Standard (1480-1600px)";
        targetPos = new pc.Vec3(0, 8, 3);
        targetRot = new pc.Quat().setFromEulerAngles(-65, 0, 0);
    } 
    else if(aspectRatio < 1.35){
        deviceType = "iPad Standard (1480-1600px)";
        targetPos = new pc.Vec3(0, 10, 3.5);
        targetRot = new pc.Quat().setFromEulerAngles(-68, 0, 0);
    }
}
else if (viewportWidth >= 1600 && viewportWidth < 1680) {
    if (aspectRatio > 1.7) {
        deviceType = "iPad Pro 11\" Landscape (1600-1680px)";
        targetPos = new pc.Vec3(0, 6.5, 2.5);
        targetRot = new pc.Quat().setFromEulerAngles(-65, 0, 0);
    }else if(aspectRatio <= 1.8 && aspectRatio >= 1.5){

        deviceType = "iPad Pro 11\" Landscape (1600-1680px)";
        targetPos = new pc.Vec3(0, 7.5, 3);
        targetRot = new pc.Quat().setFromEulerAngles(-65, 0, 0);
    } 
    else if(aspectRatio < 1.5){
        deviceType = "iPad Pro 11\" Landscape (1600-1680px)";
        targetPos = new pc.Vec3(0, 9, 3.5);
        targetRot = new pc.Quat().setFromEulerAngles(-68, 0, 0);
    }
}
else if (viewportWidth >= 1680 && viewportWidth < 1920) {
    if (aspectRatio > 1.7) {
        deviceType = "iPad Pro 12.9\" Landscape (1680-1920px)";
        targetPos = new pc.Vec3(0, 6.5, 2.5);
        targetRot = new pc.Quat().setFromEulerAngles(-65, 0, 0);
    }else if(aspectRatio <= 1.8 && aspectRatio >= 1.5){

        deviceType = "iPad Pro 12.9\" Landscape (1680-1920px)";
        targetPos = new pc.Vec3(0, 7.8, 3);
        targetRot = new pc.Quat().setFromEulerAngles(-65, 0, 0);
    } 
    else if(aspectRatio < 1.5){
        deviceType = "iPad Pro 12.9\" Landscape (1680-1920px)";
        targetPos = new pc.Vec3(0, 9.5, 3.5);
        targetRot = new pc.Quat().setFromEulerAngles(-68, 0, 0);
    }
}
else if (viewportWidth >= 1920 && viewportWidth < 2048) {
    deviceType = "11-12\" Laptop (1920-2048px)";
    targetPos = new pc.Vec3(0, 6.5, 2.3);
    targetRot = new pc.Quat().setFromEulerAngles(-65, 0, 0);

    //was
    // targetPos = new pc.Vec3(0, 8, 3);
    // targetRot = new pc.Quat().setFromEulerAngles(-65, 0, 0);
}
else if (viewportWidth >= 2048 && viewportWidth < 2304) {
    deviceType = "13\" Laptop (2048-2304px)";
    targetPos = new pc.Vec3(0, 7.5, 2.8);
    targetRot = new pc.Quat().setFromEulerAngles(-65, 0, 0);
}
else if (viewportWidth >= 2304 && viewportWidth < 2560) {
    deviceType = "14-15\" Laptop (2304-2560px)";
    targetPos = new pc.Vec3(0, 5, 2.5);
    targetRot = new pc.Quat().setFromEulerAngles(-60, 0, 0);
}
else if (viewportWidth >= 2560 && viewportWidth < 2880) {
    deviceType = "15-16\" Laptop (2560-2880px)";
    targetPos = new pc.Vec3(0, 4.5, 3);
    targetRot = new pc.Quat().setFromEulerAngles(-53, 0, 0);
}
else if (viewportWidth >= 2880 && viewportWidth < 3072) {
    deviceType = "16\" Laptop (2880-3072px)";
    targetPos = new pc.Vec3(0, 6.2, 2.4);
    targetRot = new pc.Quat().setFromEulerAngles(-64, 0, 0);
}
else if (viewportWidth >= 3072 && viewportWidth < 3200) {
    deviceType = "17\" Laptop (3072-3200px)";
    targetPos = new pc.Vec3(0, 5, 2.3);
    targetRot = new pc.Quat().setFromEulerAngles(-58, 0, 0);
}
else if (viewportWidth >= 3200 && viewportWidth < 3456) {
    deviceType = "Desktop 20-22\" (3200-3456px)";
    targetPos = new pc.Vec3(0, 5, 2);
    targetRot = new pc.Quat().setFromEulerAngles(-62.5, 0, 0);
}
else if (viewportWidth >= 3456 && viewportWidth < 3840) {
    deviceType = "Desktop 24\" Full HD (3456-3840px)";
    targetPos = new pc.Vec3(0, 5.2, 2.1);
    targetRot = new pc.Quat().setFromEulerAngles(-62, 0, 0);
}
else if (viewportWidth >= 3840 && viewportWidth < 4480) {
    deviceType = "QHD/2K Monitor (3840-4480px)";
    targetPos = new pc.Vec3(0, 5.1, 2.0);
    targetRot = new pc.Quat().setFromEulerAngles(-61.5, 0, 0);
}
else if (viewportWidth >= 4480 && viewportWidth < 5120) {
    deviceType = "4K Monitor (4480-5120px)";
    targetPos = new pc.Vec3(0, 5.0, 2.0);
    targetRot = new pc.Quat().setFromEulerAngles(-61, 0, 0);
}
else if (viewportWidth >= 5120 && viewportWidth < 5760) {
    deviceType = "5K/Ultra Wide (5120-5760px)";
    targetPos = new pc.Vec3(0, 4.9, 1.9);
    targetRot = new pc.Quat().setFromEulerAngles(-60.5, 0, 0);
}
else if (viewportWidth >= 5760 && viewportWidth < 6400) {
    deviceType = "Super Ultra Wide (5760-6400px)";
    targetPos = new pc.Vec3(0, 4.8, 1.8);
    targetRot = new pc.Quat().setFromEulerAngles(-60, 0, 0);
}
else if (viewportWidth >= 6400 && viewportWidth < 7680) {
    deviceType = "8K Monitor (6400-7680px)";
    targetPos = new pc.Vec3(0, 4.7, 1.7);
    targetRot = new pc.Quat().setFromEulerAngles(-59.5, 0, 0);
}
else if (viewportWidth >= 7680) {
    deviceType = "Extreme Resolution (7680px+)";
    targetPos = new pc.Vec3(0, 4.6, 1.6);
    targetRot = new pc.Quat().setFromEulerAngles(-59, 0, 0);
}

this.targetCamPos = targetPos;
this.targetCamRot = targetRot;

// console.error("Device Type: " + deviceType + " | Viewport: " + viewportWidth + "x" + viewportHeight + " | Aspect: " + aspectRatio.toFixed(2));
// console.error(`Screen: ${screenWidth}x${screenHeight}`);
// console.error(`==========================`);

return {
    position: targetPos,
    rotation: targetRot,
    screenWidth: screenWidth,
    screenHeight: screenHeight,
    deviceType: deviceType,
    effectiveWidth: viewportWidth,
    aspectRatio: aspectRatio
};
};
CameraMovement.prototype.moveCameraBack = function () {
    return;
    if (this.mainCamera) {
        this.didCameraWentBack = true;

        this.startCamPos = this.startCamPos || new pc.Vec3();
        this.startCamRot = this.startCamRot || new pc.Quat();

        this.startCamPos.copy(this.mainCamera.getLocalPosition());
        this.startCamRot.copy(this.mainCamera.getLocalRotation());

        this.targetCamPos = new pc.Vec3(0, 3.276, 1.9);
        this.targetCamRot = new pc.Quat().setFromEulerAngles(-55.5, 0, 0);

        this.camLerpProgress = 0;
        this.camLerpDuration = 2;
        this.camMoving = true;
        this.isMoving = true; // ADD THIS LINE
    }
};

CameraMovement.prototype.bringCameraBackToTheGame = function () {
    if (this.didCameraWentBack == false) 
        return; 
        
    this.startCamPos = this.startCamPos || new pc.Vec3();
    this.startCamRot = this.startCamRot || new pc.Quat();

    this.startCamPos.copy(this.mainCamera.getLocalPosition());
    this.startCamRot.copy(this.mainCamera.getLocalRotation());

    this.targetCamPos = new pc.Vec3(0, 2.121,1.305 );
    this.targetCamRot = new pc.Quat().setFromEulerAngles(-54.35, 0, 0);

    this.camLerpProgress = 0;
    this.camLerpDuration = 2;
    this.camMoving = true;
    this.isMoving = true; // ADD THIS LINE
};

CameraMovement.prototype.manualUpdate = function(dt) {
    // CAMERA LOGIC
    if (!this.camStarted) {
        this.camDelay -= dt;

        if (this.camDelay <= 0) {
            this.camStarted = true;
        }
    }

    if (this.camStarted && this.camMoving && this.mainCamera) {
        this.camLerpProgress += dt / this.camLerpDuration;
        this.camLerpProgress = pc.math.clamp(this.camLerpProgress, 0, 1);

        // smoothstep calculate
        let t = this.camLerpProgress;
        t = t * t * (3 - 2 * t);

        // PERF: reuse scratch — no per-frame allocation
        this._scratchPos.lerp(this.startCamPos, this.targetCamPos, t);
        if (!isNaN(this._scratchPos.x) && !isNaN(this._scratchPos.y) && !isNaN(this._scratchPos.z)) {
            this.mainCamera.setLocalPosition(this._scratchPos);
        }

        this._scratchRot.slerp(this.startCamRot, this.targetCamRot, t);
        if (!isNaN(this._scratchRot.x) && !isNaN(this._scratchRot.y) && !isNaN(this._scratchRot.z) && !isNaN(this._scratchRot.w)) {
            this.mainCamera.setLocalRotation(this._scratchRot);
        }

        if (this.camLerpProgress >= 1) {
            // window.GameManager.changeScene('Start/Stop');
            this.camMoving = false;
            this.camFinished = true;
            this.isMoving = false; // ADD THIS LINE
            // this.setButtonsUIState(false);
            setTimeout(() => {
                // this.app.fire('PLayerManager:Position_UI_Player_Cards');
                this.cameraNeverStarted = false;
            // this.enable_disable_UIUsers(true);
            // this.app.fire("CameraController:ShowPlayerCardUIWhenCameraFinished",true);
            }, 2000);
        }
    }
};

CameraMovement.prototype.resetCamera = function() {
    this.app.off('GameManager_MOVECAMERA', this.startCameraMovement, this);
    this.mainCamera.setLocalPosition(this.startCamPos.clone());
    this.mainCamera.setLocalRotation(this.startCamRot.clone());

    this.camLerpProgress = 0;
    this.camMoving = true;
    this.camStarted = true;  
    this.camFinished = false;
    this.camDelay = 0.5;    
    this.isMoving = true; // ADD THIS LINE
};

CameraMovement.prototype.enable_disable_UIUsers = function(isEnabled){
    // this.app.fire('GameManager_UiManager:enable_disable_UIUsers',isEnabled);  
};

CameraMovement.prototype.setButtonsUIState = function( setButtonsUIState ,dontShowNothing = false){
    this.app.fire('GameManager_UiMenager:EnableDisableButtonsUI', setButtonsUIState, dontShowNothing);
    this.app.fire('GameManager_UiMenager:ButtonsState', setButtonsUIState, dontShowNothing);
};






// //for testtt
CameraMovement.prototype.update = function(dt) {
    // PERF: manualUpdate now runs here — setInterval removed
    if (this.isMoving) this.manualUpdate(dt);

    if(this.cameraNeverStarted == true) return;
    if (this.lastScreenWidth !== window.innerWidth || this.lastScreenHeight !== window.innerHeight) {
        this.handleScreenResize();
        this.lastScreenWidth = window.innerWidth;
        this.lastScreenHeight = window.innerHeight;
    }
    if (this.isMoving && !this.camMoving) {
        this.adjustCameraToCurrentScale();
    }
};

CameraMovement.prototype.handleScreenResize = function() {
    const targetData = this.getCurrentCamPosRot();
    
    if (!this.camMoving) {
        this.mainCamera.setLocalPosition(targetData.position);
        this.mainCamera.setLocalRotation(targetData.rotation);
        
        this.targetCamPos = targetData.position;
        this.targetCamRot = targetData.rotation;
        
    } else {
        this.targetCamPos = targetData.position;
        this.targetCamRot = targetData.rotation;
    }
    this.positoinCameraforUIUsers();
};

CameraMovement.prototype.adjustCameraToCurrentScale = function() {
    const currentPos = this.mainCamera.getLocalPosition();
    const currentRot = this.mainCamera.getLocalRotation();
    const targetPos = this.targetCamPos || this.getCurrentCamPosRot().position;
    const targetRot = this.targetCamRot || this.getCurrentCamPosRot().rotation;
    
    const posDiff = currentPos.distance(targetPos);
    const dot = Math.min(1, Math.abs(currentRot.dot(targetRot)));
    const rotDiff = 2 * Math.acos(dot) * pc.math.RAD_TO_DEG;
    
    if (posDiff > 0.1 || rotDiff > 1) {
        
        this.startCamPos = currentPos.clone();
        this.startCamRot = currentRot.clone();
        this.targetCamPos = targetPos;
        this.targetCamRot = targetRot;
        
        this.camLerpProgress = 0;
        this.camLerpDuration = 0.5; 
        this.camMoving = true;
        this.isMoving = true;
    }
};
