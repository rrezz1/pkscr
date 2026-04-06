var PoolishManager = pc.createScript('poolishManager');
PoolishManager.attributes.add('cardsOnGameLuck', {
    type: 'json',
    array: true,
    schema: [
        { name: 'winnerText', type: 'entity' },
        { name: 'bilanceText', type: 'entity' },
        { name: 'textHolder', type: 'entity' }
    ]
});
PoolishManager.attributes.add('company_Name', {
    type: 'entity',
    array: true
});

PoolishManager.prototype.initialize = function () {
    this.cardAnimationDelayToComplete = 1;
    this.cardMovetoPointDelay = 1;
    this.originalTextHolderPos = 0.835;
    this.moveTextHolderTo = -5.5;

    // Manual update system
    this._activeAnims = [];
    this._lastTime = Date.now();
    this._manualInterval = setInterval(() => {
        const now = Date.now();
        const dt = (now - this._lastTime) / 1000;
        this._lastTime = now;
        this._tickAnims(dt);
    }, 16);

    this.app.on('PolishManager:EnableWinnerUi', this.winnerUI, this);
    this.app.on('PolishManager:Company_Name', this.showCompanyName, this);
    this.app.on('GameManager_RESTARTSCRIPT', this.resetScript, this);
};

// Register a frame-by-frame animation function
PoolishManager.prototype._addAnim = function (fn) {
    this._activeAnims.push(fn);
    return fn;
};

PoolishManager.prototype._removeAnim = function (fn) {
    const idx = this._activeAnims.indexOf(fn);
    if (idx !== -1) this._activeAnims.splice(idx, 1);
};

PoolishManager.prototype._tickAnims = function (dt) {
    const anims = this._activeAnims.slice();
    for (let i = 0; i < anims.length; i++) {
        anims[i](dt);
    }
};

PoolishManager.prototype.showCompanyName = function (position) {
    for (let i = 0; i < this.company_Name.length; i++) {
        this.company_Name[i].enabled = false;
        if (position === i) {
            this.company_Name[i].enabled = true;
        }
    }
};

PoolishManager.prototype.winnerUI = function (position, amount,new_balance) {
    for (let i = 0; i < this.cardsOnGameLuck.length; i++) {
        const cardData = this.cardsOnGameLuck[i];
        if (!cardData) continue;
        if (position === i) {
            this.highlightBilanceText(i, new_balance);
            if (amount !== undefined && amount !== null) {
                this._createFlyingBalanceClone(cardData.bilanceText, amount);
            }
        }
    }
};

PoolishManager.prototype._createFlyingBalanceClone = function (entity, amount) {
    if (!entity || !entity.element) return;
    const clonedEntity = entity.clone();
    clonedEntity.name = 'cloned_balance_' + Date.now();
    entity.parent.addChild(clonedEntity);
    const startPos = entity.getLocalPosition().clone();
    const targetPos = new pc.Vec3(11.65, 18, 0);
    const targetMaxScale = 1.1;
    const formattedValue = amount / 100;
    clonedEntity.element.text = '+ ' + formattedValue;
    clonedEntity.element.color = new pc.Color(0.988, 0.764, 0.267);
    clonedEntity.element.opacity = 1;
    clonedEntity.setLocalPosition(startPos);
    clonedEntity.setLocalScale(entity.getLocalScale());
    if (clonedEntity.element.outlineColor !== undefined) clonedEntity.element.outlineColor = new pc.Color(0, 0, 0);
    if (clonedEntity.element.outlineThickness !== undefined) clonedEntity.element.outlineThickness = 0.6;

    let t = 0;
    const moveDuration = 1.8;
    const stayDuration = 4;
    const scaleDownDuration = 0.7;
    const totalDuration = moveDuration + stayDuration + scaleDownDuration;
    const self = this;

    const anim = (dt) => {
        t += dt;
        if (t < moveDuration) {
            const moveProgress = t / moveDuration;
            const smoothProgress = moveProgress < 0.5
                ? 2 * moveProgress * moveProgress
                : 1 - Math.pow(-2 * moveProgress + 2, 2) / 2;
            const arcOffset = Math.sin(moveProgress * Math.PI) * 3;
            const rotation = Math.sin(moveProgress * Math.PI * 2) * 0.1;
            clonedEntity.setLocalPosition(
                pc.math.lerp(startPos.x, targetPos.x, smoothProgress),
                pc.math.lerp(startPos.y, targetPos.y, smoothProgress) + arcOffset,
                pc.math.lerp(startPos.z, targetPos.z, smoothProgress)
            );
            clonedEntity.setEulerAngles(0, 0, rotation);
            const scaleFactor = 0.8 + smoothProgress * (targetMaxScale - 0.8);
            clonedEntity.setLocalScale(
                entity.getLocalScale().x * scaleFactor,
                entity.getLocalScale().y * scaleFactor,
                entity.getLocalScale().z * scaleFactor
            );
            if (clonedEntity.element.outlineThickness !== undefined) clonedEntity.element.outlineThickness = 0.6;

        } else if (t < moveDuration + stayDuration) {
            const stayProgress = (t - moveDuration) / stayDuration;
            clonedEntity.setLocalPosition(targetPos);
            clonedEntity.setEulerAngles(0, 0, 0);
            const pulseScale = targetMaxScale + Math.sin(stayProgress * Math.PI * 6) * 0.08;
            clonedEntity.setLocalScale(
                entity.getLocalScale().x * pulseScale,
                entity.getLocalScale().y * pulseScale,
                entity.getLocalScale().z * pulseScale
            );
            if (clonedEntity.element.outlineThickness !== undefined) clonedEntity.element.outlineThickness = 0.6;

        } else {
            const scaleProgress = (t - moveDuration - stayDuration) / scaleDownDuration;
            clonedEntity.setLocalPosition(targetPos);
            const shrinkFactor = targetMaxScale * (1 - Math.pow(scaleProgress, 1.5));
            clonedEntity.setLocalScale(
                entity.getLocalScale().x * shrinkFactor,
                entity.getLocalScale().y * shrinkFactor,
                entity.getLocalScale().z * shrinkFactor
            );
            clonedEntity.element.opacity = 1 - Math.pow(scaleProgress, 0.7);
            if (clonedEntity.element.outlineThickness !== undefined) clonedEntity.element.outlineThickness = 0.6 * (1 - scaleProgress);

            if (scaleProgress >= 1) {
                self._removeAnim(anim);
                if (clonedEntity && clonedEntity.element) clonedEntity.destroy();
            }
        }
    };

    this._addAnim(anim);
    setTimeout(() => {
        self._removeAnim(anim);
        if (clonedEntity && clonedEntity.element) clonedEntity.destroy();
    }, totalDuration * 1000 + 1000);
};

PoolishManager.prototype._formatAmount = function (amount) {
    if (amount === undefined || amount === null) return '0';
    const value = Math.abs(amount) / 100;
    if (value >= 1000000) return (value / 1000000).toFixed(2) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(2) + 'K';
    return value.toFixed(2);
};

PoolishManager.prototype.highlightBilanceText = function (textIndex,new_balance) {
    const item = this.cardsOnGameLuck[textIndex];
    if (!item || !item.bilanceText || !item.bilanceText.element) return;
    const el = item.bilanceText.element;
    el.text = new_balance/100; 
    if (!item.originalColor) item.originalColor = el.color.clone();
    if (item._goldAnimation) {
        this._removeAnim(item._goldAnimation);
        delete item._goldAnimation;
    }
    const startColor = el.color.clone();
    const gold = new pc.Color(0.988, 0.764, 0.267);
    let time = 0;
    const duration = 2.5;
    const self = this;

    const update = (dt) => {
        time += dt;
        const t = Math.min(time / duration, 1);
        el.color = new pc.Color(
            pc.math.lerp(startColor.r, gold.r, t),
            pc.math.lerp(startColor.g, gold.g, t),
            pc.math.lerp(startColor.b, gold.b, t)
        );
        if (t >= 1) {
            self._removeAnim(update);
            delete item._goldAnimation;
            el.color = gold.clone();
        }
    };
    item._goldAnimation = update;
    this._addAnim(update);
};

PoolishManager.prototype.moveTextHolder = function (index) {
    const cardData = this.cardsOnGameLuck[index];
    const holder = cardData.textHolder;
    if (cardData.originalTextPos === undefined) cardData.originalTextPos = holder.getLocalPosition().y;
    const startPos = holder.getLocalPosition().clone();
    const endPos = startPos.clone();
    endPos.y = this.moveTextHolderTo;
    let t = 0;
    const duration = 0.45;
    const self = this;

    const anim = (dt) => {
        t += dt;
        const p = Math.min(t / duration, 1);
        holder.setLocalPosition(startPos.x, pc.math.lerp(startPos.y, endPos.y, p), startPos.z);
        if (p >= 1) self._removeAnim(anim);
    };
    this._addAnim(anim);
};

PoolishManager.prototype.fadeEntity = function (entity, from, to, duration, onComplete) {
    if (!entity || !entity.element) return;
    let t = 0;
    entity.element.opacity = from;
    const self = this;

    const anim = (dt) => {
        t += dt;
        const p = Math.min(t / duration, 1);
        entity.element.opacity = pc.math.lerp(from, to, p);
        if (p >= 1) {
            self._removeAnim(anim);
            if (onComplete) onComplete();
        }
    };
    this._addAnim(anim);
};

PoolishManager.prototype.resetScript = function () {
    // Kill every in-flight animation immediately
    this._activeAnims = [];

    for (let i = 0; i < this.company_Name.length; i++) {
        this.company_Name[i].enabled = false;
    }

    for (let i = 0; i < this.cardsOnGameLuck.length; i++) {
        const item = this.cardsOnGameLuck[i];
        if (!item) continue;

        // Cancel any tracked per-item animations
        if (item._goldAnimation)         { item._goldAnimation = null; }
        if (item._bilanceResetAnimation) { item._bilanceResetAnimation = null; }

        // Reset balance text color instantly to original
        if (item.bilanceText && item.bilanceText.element && item.originalColor) {
            item.bilanceText.element.color = item.originalColor.clone();
        }

        // Reset text holder position instantly
        if (item.textHolder) {
            const currentPos = item.textHolder.getLocalPosition();
            const originalY = item.originalTextPos !== undefined
                ? item.originalTextPos
                : this.originalTextHolderPos;
            item.textHolder.setLocalPosition(currentPos.x, originalY, currentPos.z);
        }
    }
};

PoolishManager.prototype._resetWinnerText = function (item) {
    if (!item.winnerText || !item.winnerText.element) return;
    const currentOpacity = item.winnerText.element.opacity;
    if (currentOpacity > 0) {
        this.fadeEntity(item.winnerText, currentOpacity, 0, 0.5);
    } else {
        item.winnerText.element.opacity = 0;
    }
};
PoolishManager.prototype.resetScript = function () {
    // Kill every in-flight animation first
    this._activeAnims = [];

    for (let i = 0; i < this.company_Name.length; i++) {
        this.company_Name[i].enabled = false;
    }

    for (let i = 0; i < this.cardsOnGameLuck.length; i++) {
        const item = this.cardsOnGameLuck[i];
        if (!item) continue;

        // Cancel tracked per-item animation refs
        item._goldAnimation = null;
        item._bilanceResetAnimation = null;

        // Reset balance text color instantly
        if (item.bilanceText && item.bilanceText.element && item.originalColor) {
            item.bilanceText.element.color = item.originalColor.clone();
        }

        // Always snap textHolder back to the defined original Y — never trust
        // the captured originalTextPos which may be stale from a previous hand
        if (item.textHolder) {
            const pos = item.textHolder.getLocalPosition();
            item.textHolder.setLocalPosition(pos.x, this.originalTextHolderPos, pos.z);
            item.originalTextPos = undefined; // force re-capture on next moveTextHolder call
        }

        // Destroy any flying balance clones still alive
        if (item.bilanceText && item.bilanceText.parent) {
            const parent = item.bilanceText.parent;
            const toDestroy = [];
            for (let c = 0; c < parent.children.length; c++) {
                const child = parent.children[c];
                if (child && child.name && child.name.startsWith('cloned_balance_')) {
                    toDestroy.push(child);
                }
            }
            toDestroy.forEach(c => c.destroy());
        }
    }
};
PoolishManager.prototype._resetTextHolderPosition = function (item) {
    if (!item.textHolder) return;
    const currentPos = item.textHolder.getLocalPosition();
    const originalY = item.originalTextPos !== undefined ? item.originalTextPos : this.originalTextHolderPos;
    if (Math.abs(currentPos.y - originalY) > 0.01) {
        const startPos = currentPos.clone();
        let t = 0;
        const duration = 0.5;
        const self = this;

        const anim = (dt) => {
            t += dt;
            const p = Math.min(t / duration, 1);
            item.textHolder.setLocalPosition(
                pc.math.lerp(startPos.x, startPos.x, p),
                pc.math.lerp(startPos.y, originalY, p),
                pc.math.lerp(startPos.z, startPos.z, p)
            );
            if (p >= 1) self._removeAnim(anim);
        };
        this._addAnim(anim);
    } else {
        item.textHolder.setLocalPosition(currentPos.x, originalY, currentPos.z);
    }
};