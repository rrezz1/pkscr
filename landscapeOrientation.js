var LandscapeOrientation = pc.createScript('landscapeOrientation');
LandscapeOrientation.attributes.add('scene2D', { type: 'entity'});

LandscapeOrientation.prototype.initialize = function() {
    this.createRotateMessage();
    this.rotateMessageElement.style.display = 'none';
    this.checkOrientation();
    window.addEventListener('resize', this.checkOrientation.bind(this));
    window.addEventListener('orientationchange', this.checkOrientation.bind(this));
};

LandscapeOrientation.prototype.createRotateMessage = function() {
    this.rotateMessageElement = document.createElement('div');
    this.rotateMessageElement.id = 'rotatePhoneMessage';
    
    this.rotateMessageElement.innerHTML = `
        <div style="font-size: 100px; margin-bottom: 20px;">↺</div>
        <div style="font-size: 18px; font-weight: bold;">Please rotate your device</div>
    `;

    this.rotateMessageElement.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: #000000;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-family: Arial, sans-serif;
        color: white;
        text-align: center;
    `;
    
    document.body.appendChild(this.rotateMessageElement);
};

LandscapeOrientation.prototype.checkOrientation = function() {
    const isLandscape = window.innerWidth > window.innerHeight;
    
    if (isLandscape) {
        this.rotateMessageElement.style.display = 'none';
        if (this.scene2D) this.scene2D.enabled = false;
        this.app.fire('stateOfButtonsFromLandScape', true);
        
    } else {
        this.rotateMessageElement.style.display = 'flex';
        if (this.scene2D) this.scene2D.enabled = true;
        this.app.fire('stateOfButtonsFromLandScape', false);
    }
};

LandscapeOrientation.prototype.onDestroy = function() {
    window.removeEventListener('resize', this.checkOrientation.bind(this));
    window.removeEventListener('orientationchange', this.checkOrientation.bind(this));
    if (this.rotateMessageElement && document.body.contains(this.rotateMessageElement)) {
        document.body.removeChild(this.rotateMessageElement);
    }
};