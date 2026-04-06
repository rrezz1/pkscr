var BlindController = pc.createScript('blindController');

BlindController.attributes.add('users', {
    type: 'json',
    array: true,
    schema: [
        { name: 'position', type: 'entity', title: 'Position Entity' },
        { name: 'secondposition', type: 'entity' },
    ],
    title: 'Users'
});

BlindController.attributes.add('userInactivePos', { type: 'entity' });
BlindController.attributes.add('userInactiveSecondPos', { type: 'entity' });

BlindController.attributes.add('Blinds_DefauldPos', { type: 'entity' });
BlindController.attributes.add('small_Blind_Entity', { type: 'entity' });
BlindController.attributes.add('big_Blind_Entity', { type: 'entity' });
BlindController.attributes.add('Dealer_Entity', { type: 'entity' });

BlindController.prototype.initialize = function () {
    this.isMoving = false;
    this.movingBlinds = [];
    this.currentBigBlindIndex = -1;
    this.currentSmallBlindIndex = -1;
    this.currentDealerIndex = -1;
    this.isUserPlaying;

    this.app.on('BlindController:set_BlindOnDefault', this.setBlindsOnDefault, this);
    this.app.on('BlindController:set_BothBlinds', this.setBothBlinds, this);
    this.app.on('GameManager:defineIsMainUserPlaying', this.defineIsMainUserPlaying, this);

    // PERF: single app update listener — no setInterval
    this._updateFn = (dt) => { if (this.isMoving) this.manualUpdate(dt); };
    this.app.on('update', this._updateFn);
    // PERF: scratch vec3 for lerp — no per-frame allocation
    this._scratchPos = new pc.Vec3();
};

BlindController.prototype.defineIsMainUserPlaying = function (isPlaying) {
    this.isUserPlaying = isPlaying;
};

BlindController.prototype.getTargetPosition = function(userIndex, entityToMove) {
    let targetPosition;
    if (userIndex === 4 && !this.isUserPlaying) {
        targetPosition = this.userInactivePos;
    } else {
        targetPosition = this.users[userIndex]?.position;
    }

    if (!targetPosition) return null;

    const entities = [this.big_Blind_Entity, this.small_Blind_Entity, this.Dealer_Entity];
    const targetPos = targetPosition.getPosition();

    for (const other of entities) {
        if (other === entityToMove) continue;

        const queued = this.movingBlinds.find(b => b.entity === other);
        const otherPos = queued ? queued.targetPos : other.getPosition();

        if (otherPos.distance(targetPos) < 0.01) {
            if (userIndex === 4 && !this.isUserPlaying) {
                return this.userInactiveSecondPos || targetPosition;
            }
            return this.users[userIndex]?.secondposition || targetPosition;
        }
    }

    return targetPosition;
};
BlindController.prototype.onSetBigBlind = function (userIndex, callback) {
    if (userIndex < 0 || userIndex >= this.users.length) {
        if (callback) callback(false);
        return;
    }

    const targetPosition = this.getTargetPosition(userIndex, this.big_Blind_Entity);
    if (!targetPosition) {
        if (callback) callback(false);
        return;
    }

    this.currentBigBlindIndex = userIndex;
    this.big_Blind_Entity.enabled = true;

    this.movingBlinds.push({
        entity: this.big_Blind_Entity,
        startPos: this.big_Blind_Entity.getPosition().clone(),
        targetPos: targetPosition.getPosition().clone(),
        duration: 0.8,
        progress: 0,
        callback: callback
    });

    this.isMoving = true;
};

BlindController.prototype.onSetSmallBlind = function (userIndex, callback) {
    if (userIndex < 0 || userIndex >= this.users.length) {
        if (callback) callback(false);
        return;
    }

    const targetPosition = this.getTargetPosition(userIndex, this.small_Blind_Entity);
    if (!targetPosition) {
        if (callback) callback(false);
        return;
    }

    this.currentSmallBlindIndex = userIndex;
    this.small_Blind_Entity.enabled = true;

    this.movingBlinds.push({
        entity: this.small_Blind_Entity,
        startPos: this.small_Blind_Entity.getPosition().clone(),
        targetPos: targetPosition.getPosition().clone(),
        duration: 0.8,
        progress: 0,
        callback: callback
    });

    this.isMoving = true;
};

BlindController.prototype.onSetDealer = function (userIndex, callback) {
    if (userIndex < 0 || userIndex >= this.users.length) {
        if (callback) callback(false);
        return;
    }

    const targetPosition = this.getTargetPosition(userIndex, this.Dealer_Entity);
    if (!targetPosition) {
        if (callback) callback(false);
        return;
    }

    this.currentDealerIndex = userIndex;
    this.Dealer_Entity.enabled = true;

    this.movingBlinds.push({
        entity: this.Dealer_Entity,
        startPos: this.Dealer_Entity.getPosition().clone(),
        targetPos: targetPosition.getPosition().clone(),
        duration: 0.8,
        progress: 0,
        callback: callback
    });

    this.isMoving = true;
};

BlindController.prototype.setBothBlinds = function (dealerIndex, smallBlindIndex, bigBlindIndex, callback) {
    dealerIndex = window.GameManager.serverToUiIndex(dealerIndex);
    smallBlindIndex = window.GameManager.serverToUiIndex(smallBlindIndex);
    bigBlindIndex = window.GameManager.serverToUiIndex(bigBlindIndex);
    
    let completed = 0;
    const total = 3;
    const results = [];

    const cb = (success) => {
        completed++;
        results.push(success);

        if (completed === total && callback) {
            callback(results.every(r => r === true));
        }
    };

    const getPos = (index) => {
        if (index === 4 && !this.isUserPlaying) return this.userInactivePos;
        return this.users[index]?.position || null;
    };

    const resolvePosition = (index, takenPositions) => {
        const primary = getPos(index);
        if (!primary) return null;
        const primaryPos = primary.getPosition();
        const conflict = takenPositions.some(p => p.distance(primaryPos) < 0.01);
        if (conflict) {
            if (index === 4 && !this.isUserPlaying) {
                return this.userInactiveSecondPos || primary;
            }
            const second = this.users[index]?.secondposition;
            return second || primary;
        }
        return primary;
    };

    const takenPositions = [];

    const dealerPos = resolvePosition(dealerIndex, takenPositions);
    if (dealerPos) takenPositions.push(dealerPos.getPosition().clone());

    const smallPos = resolvePosition(smallBlindIndex, takenPositions);
    if (smallPos) takenPositions.push(smallPos.getPosition().clone());

    const bigPos = resolvePosition(bigBlindIndex, takenPositions);

    const pushMove = (entity, targetPosition, blindCallback) => {
        if (!targetPosition) { if (blindCallback) blindCallback(false); return; }
        entity.enabled = true;
        this.movingBlinds.push({
            entity: entity,
            startPos: entity.getPosition().clone(),
            targetPos: targetPosition.getPosition().clone(),
            duration: 0.8,
            progress: 0,
            callback: blindCallback
        });
    };

    this.currentDealerIndex = dealerIndex;
    this.currentSmallBlindIndex = smallBlindIndex;
    this.currentBigBlindIndex = bigBlindIndex;

    pushMove(this.Dealer_Entity, dealerPos, cb);
    pushMove(this.small_Blind_Entity, smallPos, cb);
    pushMove(this.big_Blind_Entity, bigPos, cb);

    this.isMoving = true;
};

BlindController.prototype.setBlindsOnDefault = function (callback) {
    const defPos = this.Blinds_DefauldPos.getPosition().clone();

    this.currentBigBlindIndex = -1;
    this.currentSmallBlindIndex = -1;
    this.currentDealerIndex = -1;

    let completed = 0;
    const total = 3;
    const results = [];

    const cb = (success) => {
        completed++;
        results.push(success);

        if (completed === total) {
            this.small_Blind_Entity.enabled = false;
            this.big_Blind_Entity.enabled = false;
            this.Dealer_Entity.enabled = false;

            if (callback) callback(results.every(r => r === true));
        }
    };

    const pushMove = (entity) => {
        this.movingBlinds.push({
            entity: entity,
            startPos: entity.getPosition().clone(),
            targetPos: defPos.clone(),
            duration: 0.8,
            progress: 0,
            callback: cb
        });
    };

    pushMove(this.big_Blind_Entity);
    pushMove(this.small_Blind_Entity);
    pushMove(this.Dealer_Entity);

    this.isMoving = true;
};

BlindController.prototype.manualUpdate = function (dt) {
    if (this.movingBlinds.length === 0) {
        this.isMoving = false;
        return;
    }

    for (let i = this.movingBlinds.length - 1; i >= 0; i--) {
        const b = this.movingBlinds[i];

        if (!b.entity) {
            if (b.callback) b.callback(false);
            this.movingBlinds.splice(i, 1);
            continue;
        }

        b.entity.enabled = true;
        b.progress += dt / b.duration;

        if (b.progress >= 1) {
            b.entity.setPosition(b.targetPos);
            if (b.callback) b.callback(true);
            this.movingBlinds.splice(i, 1);
        } else {
            // PERF: reuse scratch
            this._scratchPos.lerp(b.startPos, b.targetPos, b.progress);
            b.entity.setPosition(this._scratchPos);
        }
    }

    if (this.movingBlinds.length === 0) {
        this.isMoving = false;
    }
};

BlindController.prototype.destroy = function () {
    if (this._updateFn) {
        this.app.off('update', this._updateFn);
        this._updateFn = null;
    }
};