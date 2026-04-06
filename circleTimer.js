var CircleTimer = pc.createScript('circleTimer');

CircleTimer.attributes.add('circleImage', { type: 'entity' });
CircleTimer.attributes.add('circleID', { type: 'number' });

CircleTimer.prototype.postInitialize = function () {

    // let stored = localStorage.getItem('UserTimer');
    // if (stored !== null) {
    //     this.tourSeconds = Math.max(parseFloat(stored), 0.1);
    // } else {
    //     this.tourSeconds = 10;  
    // }
    this.startCircle = false;
    this.soundFired = false;
    this._progress = 0;
    this.isMoving = false;
    this.lastTime = Date.now();
    this.tourSeconds;
    this._element = this.entity.element;
    this._element.material = this._element.material.clone();

    this.app.on('PlayerFlowManager:Activate circle', this.activateCircle, this);
    this.app.on('GameManager:SetTimeToUSerTImer', this.defineTimer, this);

    // PERF: use app update — no setInterval overhead or double-tick
    this._updateFn = (dt) => { if (this.isMoving) this.manualUpdate(dt); };
    this.app.on('update', this._updateFn);
};

CircleTimer.prototype.defineTimer = function (seconds) {
    this.tourSeconds =seconds;
    // localStorage.setItem('UserTimer', this.tourSeconds);
};

CircleTimer.prototype.activateCircle = function (playerIndex) {

    if (this.circleID === playerIndex) {
        this.startCircle = true;
        this.isMoving = true;
        this.soundFired = false;
        this.setProgress(0);

        if (this.circleImage && this.circleImage.element) {
            this.circleImage.element.color = new pc.Color(1, 1, 0);
        }
    } else {
        this.startCircle = false;
        this.isMoving = false;
        this.setProgress(1);
    }
};

CircleTimer.prototype.setProgress = function (value) {
    value = pc.math.clamp(value, 0, 1);
    this._progress = value;

    if (this.circleImage && this.circleImage.element) {
        this.circleImage.element.color = new pc.Color(1, 1, 0);
    }

    if (this._element) {
        this._element.material.alphaTest = value + 0.001;
        this._element.material.update();
    }

    if (this.circleImage && this.circleImage.element) {
        const t = pc.math.clamp(value * 2, 0, 1);
        // PERF: reuse color object
        if (!this._timerColor) this._timerColor = new pc.Color(1, 1, 0);
        this._timerColor.r = 1.0;
        this._timerColor.g = 1.0 - t;
        this._timerColor.b = 0;
        this.circleImage.element.color = this._timerColor;
    }
};

CircleTimer.prototype.manualUpdate = function (dt) {
    if (!this.startCircle) return;

    if (!this.tourSeconds || this.tourSeconds <= 0) return;

    this.setProgress(this._progress + dt / this.tourSeconds);

    if (this._progress >= 0.6 && !this.soundFired) {
        if (this.circleID == 4) {
            this.app.fire('CircleTimmer:Start_rotateTheUser4Frame', 4);
        } else {
            // this.app.fire('CircleTimmer:Stop_rotateTheUser4Frame', 4);
        }
        this.soundFired = true;
        this.app.fire('PlaySound:PlayTimer');
    }

    if (this._progress >= 1) {
        this.startCircle = false;
        this.isMoving = false;
        this.setProgress(1);
    }
};


CircleTimer.prototype.onDestroy = function () {
    if (this._updateFn) {
        this.app.off('update', this._updateFn);
        this._updateFn = null;
    }
};