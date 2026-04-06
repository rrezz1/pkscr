var PlayerManager = pc.createScript('playerManager');

PlayerManager.CHIP_VALUES = {
    BLACK: { min: 0, max: 120 },
    BLUE: { min: 121, max: 300 },
    GREEN: { min: 301, max: 500 },
    RED: { min: 501, max: 750 },
    YELLOW: { min: 751, max: Infinity }
};

PlayerManager.TABLE_AMOUNT_THRESHOLDS = {
    BLACK: 350,
    BLUE: 700,
    GREEN: 1300,
    RED: 1500,
    YELLOW: 2000
};

PlayerManager.BINANCE_FORMATS = {
    BILLION: 1_000_000_000,
    MILLION: 1_000_000,
    THOUSAND: 1_000
};

// Player UI positions
PlayerManager.attributes.add('playersInfoPositions', {
    type: 'json',
    array: true,
    schema: [
        { name: 'position', type: 'entity', title: 'Position Entity' },
        { name: 'entity', type: 'entity', title: 'UI Entity to Enable/Disable' },
        { name: 'profile', type: 'entity', title: 'User profile' },
        { name: 'name', type: 'entity', title: 'Name Element' },
        { name: 'altTextName', type: 'entity', title: 'altTextName' },
        { name: 'altTextHover', type: 'entity', title: 'altTextHover' },
        { name: 'status', type: 'entity', title: 'Status Element' },
        { name: 'sasia_e_bastit', type: 'entity', title: 'Bet Element' },
        { name: 'binance', type: 'entity', title: 'Binance Element' },
        { name: 'playerBetHolder', type: 'entity' },
        { name: 'buttonSitInHolder', type: 'entity' },
        { name: 'buttonSitIn', type: 'entity' },
        { name: 'iconToSitInwhenus4NOTINgame', type: 'entity' },
        { name: 'iconToSitInwhenus4INgame', type: 'entity' }
    ],
    title: 'Player Info UI Positions'
});

PlayerManager.attributes.add('uiPosInGameWin', { type: 'entity', array: true });
PlayerManager.attributes.add('sasia_e_bastit_5', { type: 'entity' });
PlayerManager.attributes.add('player5BetHolder', { type: 'entity' });
PlayerManager.attributes.add('chipsClone5Position', {
    type: 'json',
    schema: [
        { name: '1_Turn_5', type: 'entity', title: '1_Turn_5' },
        { name: '2_Turn_5', type: 'entity', title: '2_Turn_5' },
        { name: '3_Turn_5', type: 'entity', title: '3_Turn_5' },
        { name: '4_Turn_5', type: 'entity', title: '4_Turn_5' }
    ],
    title: 'Chips Clone Position'
});

// Chip positions
PlayerManager.attributes.add('chipsClonePosition', {
    type: 'json',
    array: true,
    schema: [
        { name: '1_Turn', type: 'entity', title: '1_Turn' },
        { name: '2_Turn', type: 'entity', title: '2_Turn' },
        { name: '3_Turn', type: 'entity', title: '3_Turn' },
        { name: '4_Turn', type: 'entity', title: '4_Turn' }
    ],
    title: 'Chips Clone Position'
});
PlayerManager.attributes.add('hipMovementPointToChipsClonePosition', {
    type: 'json',
    array: true,
    schema: [
        { name: 'positoinChipThatMoveToChipsClonePosition', type: 'entity' }
    ],
    title: 'Hip Movement Point To Chips Clone Position'
});
PlayerManager.attributes.add('hipMovementpl5PointToChipsClonePosition', {
    type: 'entity',
    title: 'Hip Movement pl 5 Point To Chips Clone Position'
});
// Chip entities
PlayerManager.attributes.add('chipEntity', { type: 'entity' });
PlayerManager.attributes.add('pokerChip_BLACK', { type: 'entity' });
PlayerManager.attributes.add('pokerChip_BLUE', { type: 'entity' });
PlayerManager.attributes.add('pokerChip_GREEN', { type: 'entity' });
PlayerManager.attributes.add('pokerChip_RED', { type: 'entity' });
PlayerManager.attributes.add('pokerChip_YELLOW', { type: 'entity' });

// Game entities
PlayerManager.attributes.add('collectChipsPoint', { type: 'entity' });
PlayerManager.attributes.add('chipsClonedParent', { type: 'entity' });
PlayerManager.attributes.add('chipsThatEnableDisableForPLayerPoker', { type: 'entity', array: true });
PlayerManager.attributes.add('chipsThatEnableDisableForPLayerOhama', { type: 'entity', array: true });
PlayerManager.attributes.add('buttonsSitIn', { type: 'entity', array: true, title: 'Button Sit In' });
PlayerManager.attributes.add('tableAmount', { type: 'entity' });
PlayerManager.attributes.add('tableAmountParent', { type: 'entity' });
PlayerManager.attributes.add('tableAmountBackgound', { type: 'entity' });

PlayerManager.prototype.initialize = function () {

    // this.drawProfile();
    this._initializeProperties();
    this._setupEventListeners();
    this._setupUIElements();
    // this._prepareProfileMasks()
    setTimeout(() => { this.app.fire('GameManager:get_state'); }, 50);
    
};
PlayerManager.prototype._initializeProperties = function () {

    this.yourLastSeat;

    this.isGameStateOhama;
    this.isGameStateTournament;
    this.isUser4InGame;
    this.gameStateIsRewarding = false;
    this.movingChips = [];
    this.tableAmountClone = null;
    this.tableAmountMoveData = null;
    this.positionThatTableAmountGo = null;
    this.allInLockedPlayers = new Set();

    // Player state tracking
    this.previousPlayerStates = new Array(this.playersInfoPositions.length).fill(null);
    this.previousBinanceValues = new Array(this.playersInfoPositions.length).fill(null);
    this.binanceAnimationTimers = new Array(this.playersInfoPositions.length).fill(null);

    // Active fade animations
    this.activeFades = [];
    this.smoothFadeDuration = 0.5;

    this._activeBetFades = new Map();

    // PERFORMANCE FIX: Object pools for Vec3 to reduce garbage collection
    this.vec3Pool = [];
    this.maxVec3PoolSize = 100;
   
};

PlayerManager.prototype._setupEventListeners = function () {
    const self = this;

    // Sit in buttons
    this.buttonsSitIn.forEach((btn, index) => {
        if (btn?.element) {
            btn.element.on('click', () => self.onButtonSitClick(index), self);
        }
    });

    // Game events
    this.app.on('GameManager:gameState:Ohama:Poker', this.defineIsGameIsOhamaOrPoker, this);
    this.app.on('GameManager:gameState:Tournament', this.defineGameStateIsTournament, this);
    this.app.on('GameManager:defineIsMainUserPlaying', this.defineIsUser4Playing, this);
    this.app.on('GameManager:defineChipsValue', this.defineChipsValue, this);

    this.app.on('GameManager:updatePlayersInfo', this.updateAllPlayersUI, this);
    this.app.on('GameManager:updateSpecificPlayerInfo', this.updateSpecificPlayerUI, this);
    this.app.on('GameManager:updateSpecificPlayerInfo:player_seated', this.onPlayerSeated, this);
    this.app.on("GameManager:updateSpecificPlayerInfo:player_left", this.onPlayerLeft, this);
    this.app.on('GameManager:updateSpecificPlayerInfo:player_balance', this.updateSpecifiPlayerBalance, this);


    this.app.on('GameManager:playerAction:check', this._clearPlayerBetUI, this);
    this.app.on('GameManager:playerAction:bet', this.showPlayerBet, this);
    this.app.on('GameManager:playerAction:call', this.showPlayerBet, this);
    this.app.on('GameManager:playerAction:raise', this.showPlayerBet, this);
    this.app.on('GameManager:playerAction:fold', this._clearPlayerBetUI, this);
    this.app.on('GameManager:playerAction:smallblind', this.showPlayerBet, this);
    this.app.on('GameManager:playerAction:bigblind', this.showPlayerBet, this);
    this.app.on('GameManager:playerAction:allin', this.showPlayerBet, this);
    this.app.on('GameManager:playerAction:ante', this.showPlayerBet, this);
    // this.app.on('GameManager:playerAction:sitout', this.showPlayerBet, this);
    this.app.on("PlayerManager:ShowPlayerCardUIWhenCameraFinished",this.userUiState, this);
    this.app.on('GameManager:showPlayerBet', this.showPlayerBet, this);
    this.app.on('GameManager:collectPlayersAction', this.collectAllChips, this);
    this.app.on('GameManager:collectSpecificPlayersAction', this.collectSpecificUserChips, this);

    this.app.on('GameManager:collectAllinActions', this.collectAllAllin, this);
    this.app.on('GameManager:collectSpecificAllinActions', this.collectSpecificAllin, this);

    this.app.on('PLayerManager:Position_UI_Player_Cards', this.positionUiCards, this);
    this.app.on('GameManager_RESTARTSCRIPT', this.resetScript, this);
    this.app.on('GameManager_State:game_won:chipsReward', this.gameWonStateRewardChips, this);
    this.app.on('DeviceDetector:DeviceType', this.checkDeviceToRescale, this);

};
PlayerManager.prototype.defineIsUser4Playing = function (isUser4Playing) {
    this.isUser4InGame = isUser4Playing;

    for (let i = 0; i < this.playersInfoPositions.length; i++) {
        const positionData = this.playersInfoPositions[i];
        if (this.isUser4InGame == false) {
            if (positionData.iconToSitInwhenus4NOTINgame) {
                positionData.iconToSitInwhenus4NOTINgame.enabled = true;
            }
            if (positionData.iconToSitInwhenus4INgame) {
                positionData.iconToSitInwhenus4INgame.enabled = false;
            }
        } else {
            if (positionData.iconToSitInwhenus4INgame) {
                positionData.iconToSitInwhenus4INgame.enabled = true;
            }
            if (positionData.iconToSitInwhenus4NOTINgame) {
                positionData.iconToSitInwhenus4NOTINgame.enabled = false;
            }
        }
    }
};
PlayerManager.prototype.defineIsGameIsOhamaOrPoker = function (isOhama) {
    this.isGameStateOhama = isOhama;
};
PlayerManager.prototype.defineGameStateIsTournament = function (isTournament) {
    this.isGameStateTournament = isTournament;
}
PlayerManager.prototype.defineChipsValue = function (maxTableValue) {
    const chipValue = parseFloat(maxTableValue / 100) || 1000;
    const tableValue = chipValue * 3;
    PlayerManager.CHIP_VALUES = {
        BLACK: { min: 0, max: chipValue * 0.2 },
        BLUE: { min: chipValue * 0.2, max: chipValue * 0.45 },
        GREEN: { min: chipValue * 0.45, max: chipValue * 0.7 },
        RED: { min: chipValue * 0.7, max: chipValue },
        YELLOW: { min: chipValue, max: Infinity }
    };
    PlayerManager.TABLE_AMOUNT_THRESHOLDS = {
        BLACK: tableValue * 0.35,
        BLUE: tableValue * 0.7,
        GREEN: tableValue * 1.3,
        RED: tableValue * 1.5
    };


};
PlayerManager.prototype.onButtonSitClick = function (index) {
    if (this.isUser4InGame == true) return;
    this.app.fire('PlaySound_ButtonPressed');

    this.app.fire('BalanceManager:enableBuyBalancePopUP', index);
};
PlayerManager.prototype.checkDeviceToRescale = function (deviceType) {
    if (!this.playersInfoPositions?.length) return;

    const targetScale = (deviceType === 'Mobile' || deviceType === 'Tablet') ? 3 : 3;


    for (let i = 0; i < this.playersInfoPositions.length; i++) {
        const positionData = this.playersInfoPositions[i];

        if (!positionData.entity) {
            continue;
        }

        positionData.entity.setLocalScale(targetScale, targetScale, targetScale);
        positionData.buttonSitIn.setLocalScale(targetScale, targetScale, targetScale);

    }
};
PlayerManager.prototype._setupUIElements = function () {
    if (!this.playersInfoPositions?.length) return;

    this.playersInfoPositions.forEach(positionData => {
        const elements = [
            positionData.entity?.element,
            positionData.name?.element,
            positionData.status?.element,
            positionData.binance?.element,
            positionData.buttonSitIn?.element,
            this.isUser4InGame ? positionData.iconToSitInwhenus4INgame?.element : positionData.iconToSitInwhenus4NOTINgame?.element

        ];

        elements.forEach(element => {
            if (element) element.opacity = 0;
        });
    });
};
PlayerManager.prototype.positionUiCards = function () {
    // console.error('called');
    if (!this.playersInfoPositions || !this.playersInfoPositions.length || this.gameStateIsRewarding == true) {
        return;
    }
    for (let i = 0; i < this.playersInfoPositions.length; i++) {
        const positionData = this.playersInfoPositions[i];

        if (!positionData) continue;

        if (positionData.position) {
            const newPosition = positionData.position.getPosition();

            if (positionData.entity) {
                positionData.entity.setPosition(newPosition);
            }

            if (positionData.buttonSitIn) {
                positionData.buttonSitIn.setPosition(newPosition);
            }

        }
    }
};


PlayerManager.prototype.smoothFadeEntity = function (entity, targetEnabled, options = {}) {
    if (!entity || !entity.element) {
        if (entity) entity.enabled = targetEnabled;
        return;
    }

    const duration = options.duration || this.smoothFadeDuration;
    const startOpacity = options.startOpacity;
    const endOpacity = options.endOpacity || (targetEnabled ? 0.3 : 0);

    this.cancelFade(entity);

    entity.enabled = true;

    if (startOpacity !== undefined) {
        entity.element.opacity = startOpacity;
    }

    const fade = {
        entity: entity,
        startTime: 0,
        duration: duration,
        initialOpacity: startOpacity !== undefined ? startOpacity : entity.element.opacity,
        targetOpacity: endOpacity,
        initialEnabled: true,
        targetEnabled: targetEnabled
    };

    this.activeFades.push(fade);

    return {
        cancel: () => this.cancelFade(entity)
    };
};
PlayerManager.prototype.cancelFade = function (entity) {
    this.activeFades = this.activeFades.filter(fade => {
        if (fade.entity === entity) {
            if (!fade.targetEnabled && fade.entity) {
                fade.entity.enabled = false;
                fade.entity.element.opacity = 0;
            }
            return false;
        }
        return true;
    });
};
PlayerManager.prototype._updatePlayerBetUI = function (playerIndex, betAmount, positionData, isAllin) {
    //  console.error("_updatePlayerBetUI --------------------------------------"+ playerIndex +" | "+ betAmount+" | "+ positionData);
    const isOhamaAndPl4 = this.isGameStateOhama && playerIndex === 4;

    const _playerBetHolder = (isOhamaAndPl4 ? this.player5BetHolder : positionData.playerBetHolder);
    const _sasia_e_bastit = (isOhamaAndPl4 ? this.sasia_e_bastit_5 : positionData.sasia_e_bastit);

    if (_playerBetHolder) {
        if (!_playerBetHolder.enabled) {
            _playerBetHolder.enabled = true;
            _playerBetHolder.element.opacity = 0;
        }

        this.smoothFadeEntity(_playerBetHolder, true, {
            duration: 0.3,
            startOpacity: _playerBetHolder.element.opacity, // Use current opacity
            endOpacity: 0.4
        });
    }

    if (_sasia_e_bastit?.element) {
        if (!_sasia_e_bastit.enabled) {
            _sasia_e_bastit.enabled = true;
            _sasia_e_bastit.element.opacity = 0;
        }

        // _sasia_e_bastit.element.text = betAmount.toString();

        this._betTextFadeTo(_sasia_e_bastit, _sasia_e_bastit.element.opacity, 1, 0.3, null);
    }
};

PlayerManager.prototype._updatePlayerBetUIAfterActed = function (playerIndex, betAmount, positionData, isAllin) {
    //  console.error("_updatePlayerBetUI --------------------------------------"+ playerIndex +" | "+ betAmount+" | "+ positionData);
    const isOhamaAndPl4 = this.isGameStateOhama && playerIndex === 4;

    const _playerBetHolder = (isOhamaAndPl4 ? this.player5BetHolder : positionData.playerBetHolder);
    const _sasia_e_bastit = (isOhamaAndPl4 ? this.sasia_e_bastit_5 : positionData.sasia_e_bastit);

    if (_playerBetHolder) {
        if (!_playerBetHolder.enabled) {
            _playerBetHolder.enabled = true;
            _playerBetHolder.element.opacity = 0;
        }

        this.smoothFadeEntity(_playerBetHolder, true, {
            duration: 0.3,
            startOpacity: _playerBetHolder.element.opacity, // Use current opacity
            endOpacity: 0.4
        });
    }

    if (_sasia_e_bastit?.element) {
        if (!_sasia_e_bastit.enabled) {
            _sasia_e_bastit.enabled = true;
            _sasia_e_bastit.element.opacity = 0;
        }

        _sasia_e_bastit.element.text = betAmount.toString();

        this._betTextFadeTo(_sasia_e_bastit, _sasia_e_bastit.element.opacity, 1, 0.3, null);
    }
};
PlayerManager.prototype._disableAllBetHolders = function (options = {}) {
    const skipSet = new Set(options.skipPlayers || []);
    const onlySet = options.onlyPlayers ? new Set(options.onlyPlayers) : null;

    const shouldSkip = (index) => {
        if (onlySet) return !onlySet.has(index);
        return skipSet.has(index);
    };

    for (let i = 0; i < this.playersInfoPositions.length; i++) {

        const positionData = this.playersInfoPositions[i];
        const isOhamaAndPl4 = this.isGameStateOhama == true && i == 4;
        const _sasia_e_bastit = (isOhamaAndPl4 ? this.sasia_e_bastit_5 : positionData.sasia_e_bastit);
        const _playerBetHolder = (isOhamaAndPl4 ? this.player5BetHolder : positionData.playerBetHolder);

        if (!positionData) continue;
        if (shouldSkip(i)) continue;

        if (_playerBetHolder && _playerBetHolder.enabled) {
            this.smoothFadeEntity(_playerBetHolder, false, {
                duration: 0.3,
                endOpacity: 0
            });
        }

        if (_sasia_e_bastit &&
            _sasia_e_bastit.enabled &&
            _sasia_e_bastit.element &&
            _sasia_e_bastit.element.opacity > 0) {

            const startOpacity = _sasia_e_bastit.element.opacity;
            this._betTextFadeTo(_sasia_e_bastit, startOpacity, 0, 0.3, function () {
                _sasia_e_bastit.enabled = false;
            });
        }
    }
};

PlayerManager.prototype._getVec3 = function (x, y, z) {
    let vec;
    if (this.vec3Pool.length > 0) {
        vec = this.vec3Pool.pop();
        if (x !== undefined) {
            vec.set(x || 0, y || 0, z || 0);
        }
    } else {
        vec = new pc.Vec3(x || 0, y || 0, z || 0);
    }
    return vec;
};

PlayerManager.prototype._returnVec3 = function (vec) {
    if (this.vec3Pool.length < this.maxVec3PoolSize) {
        this.vec3Pool.push(vec);
    }
};

PlayerManager.prototype.update = function (dt) {
    if (!this.tableAmountMoveData &&
        (!this.movingChips || this.movingChips.length === 0) &&
        (!this.activeFades || this.activeFades.length === 0) &&
        (!this._activeBetFades || this._activeBetFades.size === 0)) {
        return;
    }
    this._updateTableAmountMove(dt);
    this._updateMovingChips(dt);
    this._updateFades(dt);
    this._updateBetFades(dt);
};

PlayerManager.prototype._betTextFadeTo = function (entity, fromOpacity, toOpacity, duration, onComplete) {
    if (!entity || !entity.element) return;
    this._activeBetFades.set(entity, {
        elapsed: 0,
        duration: duration,
        from: fromOpacity,
        to: toOpacity,
        onComplete: onComplete || null
    });
};

PlayerManager.prototype._updateBetFades = function (dt) {
    if (!this._activeBetFades || this._activeBetFades.size === 0) return;
    this._activeBetFades.forEach(function (data, entity) {
        if (!entity || !entity.element) {
            this._activeBetFades.delete(entity);
            return;
        }
        data.elapsed += dt;
        var t = Math.min(data.elapsed / data.duration, 1);
        entity.element.opacity = pc.math.lerp(data.from, data.to, t);
        if (t >= 1) {
            if (data.onComplete) data.onComplete();
            this._activeBetFades.delete(entity);
        }
    }, this);
};

PlayerManager.prototype._updateFades = function (dt) {
    for (let i = this.activeFades.length - 1; i >= 0; i--) {
        const fade = this.activeFades[i];

        if (!fade.entity || !fade.entity.element) {
            this.activeFades.splice(i, 1);
            continue;
        }

        fade.startTime += dt;
        const progress = Math.min(fade.startTime / fade.duration, 1);

        fade.entity.element.opacity = pc.math.lerp(
            fade.initialOpacity,
            fade.targetOpacity,
            progress
        );

        if (progress >= 1) {
            fade.entity.element.opacity = fade.targetOpacity;
            fade.entity.enabled = fade.targetEnabled;
            this.activeFades.splice(i, 1);
        }
    }
};

PlayerManager.prototype.collectSpecificUserChips = function (userPosition) {
    if (userPosition === undefined || userPosition === null) return;
    if (!this.collectChipsPoint) return;

    this._disableAllBetHolders({ onlyPlayers: [userPosition] });
    this._collectChipsFromAllSources({ onlyPlayers: [userPosition] });
};

PlayerManager.prototype.collectAllChips = function () {
    if (!this.collectChipsPoint) {
        return;
    }

    const lockedAllInPlayers = Array.from(this.allInLockedPlayers || []);
    this._disableAllBetHolders({ skipPlayers: lockedAllInPlayers });
    this._collectChipsFromAllSources({ skipPlayers: lockedAllInPlayers });
};
// PlayerManager.prototype.collectAllAllin = function () {
//     const lockedAllInPlayers = Array.from(this.allInLockedPlayers || []);
//     if (!lockedAllInPlayers.length) return;

//     this.gameStateIsRewarding = true;
//     this._disableAllBetHolders({ onlyPlayers: lockedAllInPlayers });
//     this._collectChipsFromAllSources({ onlyPlayers: lockedAllInPlayers });
//     this.allInLockedPlayers.clear();
// };
PlayerManager.prototype._collectChipsFromAllSources = function (options = {}) {
    const skipSet = new Set(options.skipPlayers || []);
    const onlySet = options.onlyPlayers ? new Set(options.onlyPlayers) : null;

    const shouldSkip = (index) => {
        if (onlySet) return !onlySet.has(index);
        return skipSet.has(index);
    };

    const target = this.collectChipsPoint.getPosition().clone();
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

    const addChipMovement = (chip) => {
        if (!chip.enabled) return;
        // skip 
        if (chip.__playerIndex !== undefined) {
            const idx = chip.__playerIndex;
            if (onlySet && !onlySet.has(idx)) return;
            if (!onlySet && skipSet.has(idx)) return;
        }

        const start = chip.getPosition().clone();
        const randomOffset = new pc.Vec3(0.15, 0.15, 0.15);
        const finalTarget = target.clone().add(randomOffset);
        const duration = 0.45 + 0.35;
        const startDelay = 0.15;

        this.movingChips.push({
            entity: chip,
            start: start.clone(),
            target: finalTarget.clone(),
            duration: duration,
            delay: startDelay,
            progress: 0,
            easing: easeOutCubic,
            toPot: true
        });
    };

    // Collect from chips parent
    this.chipsClonedParent?.children?.forEach(addChipMovement);

    // Collect from player chip slots 
    for (let index = 0; index < (this.chipsClonePosition?.length || 0); index++) {
        if (shouldSkip(index)) continue;

        const slot = this.chipsClonePosition[index];
        if (!slot) continue;

        Object.values(slot).forEach(posEntity => {
            if (!posEntity?.children) return;

            const children = [...posEntity.children];
            children.forEach(child => {
                if (child && child.enabled) {
                    addChipMovement(child);
                }
            });
        });
    }

    if (this.isGameStateOhama) {
        const player5Index = 4;
        if (!shouldSkip(player5Index) && this.chipsClone5Position) {
            Object.values(this.chipsClone5Position).forEach(posEntity => {
                if (!posEntity?.children) return;

                const children = [...posEntity.children];
                children.forEach(child => {
                    if (child && child.enabled) {
                        child.__playerIndex = player5Index;
                        addChipMovement(child);
                    }
                });
            });
        }
    }
};

PlayerManager.prototype._updateTableAmountMove = function (dt) {
    if (!this.tableAmountMoveData) return;

    const data = this.tableAmountMoveData;
    data.progress += dt / data.duration;

    if (data.progress >= 1) {
        const finalPos = this._getVec3();
        finalPos.copy(data.targetPos);
        this.tableAmountBackgound.setPosition(finalPos);
        this._returnVec3(finalPos);

        data.callback?.();
        this.tableAmountMoveData = null;
    } else {
        const newPos = this._getVec3();
        newPos.lerp(data.startPos, data.targetPos, data.progress);
        this.tableAmountBackgound.setPosition(newPos);
        this._returnVec3(newPos);
    }
};

PlayerManager.prototype._updateMovingChips = function (dt) {
    if (!this.movingChips?.length) return;

    for (let i = this.movingChips.length - 1; i >= 0; i--) {
        const chipData = this.movingChips[i];

        if (!chipData.entity) {
            this.movingChips.splice(i, 1);
            continue;
        }

        if (chipData.delay > 0) {
            chipData.delay -= dt;
            continue;
        }

        chipData.progress = Math.min(chipData.progress + dt / chipData.duration, 1);
        const t = chipData.easing?.(chipData.progress) ?? chipData.progress;

        const newPos = this._getVec3();
        newPos.lerp(chipData.start, chipData.target, t);
        chipData.entity.setPosition(newPos);
        this._returnVec3(newPos);

        if (chipData.progress >= 1) {
            if (chipData.toPot || chipData.disableAfterFinish) {
                chipData.entity.enabled = false;
            }

            chipData.onComplete?.();
            this.movingChips.splice(i, 1);
        }
    }
};

PlayerManager.prototype._moveChipToTarget = function (chipEntity, startEntity, targetEntity, speed = 2, callback) {
    const startPos = startEntity.getPosition().clone();
    const targetPos = targetEntity.getPosition().clone();

    if (this.chipsClonedParent) {
        this.chipsClonedParent.addChild(chipEntity);
        chipEntity.setLocalPosition(0, 0, 0);
    } else {
        chipEntity.setPosition(startPos);
        if (chipEntity.parent !== this.app.root) {
            this.app.root.addChild(chipEntity);
        }
    }

    const distance = startPos.distance(targetPos);
    const duration = distance / speed;

    this.movingChips.push({
        entity: chipEntity,
        start: startPos,
        target: targetPos,
        progress: 0,
        duration: duration,
        toPot: false,
        onComplete: () => {
            callback?.();
            this._playSoundAfterChipFinish();
        }
    });
};

PlayerManager.prototype._playSoundAfterChipFinish = function () {
    this.app.fire('PlaySound_Reise');
};
PlayerManager.prototype.rewardChip = function (playerIndex, betAmount, isAllin = false) {
    const parsedAmount = parseInt(betAmount, 10);
    const positionData = this.playersInfoPositions[playerIndex];

    if (!positionData) return;


    this._updatePlayerBetUI(playerIndex, parsedAmount, positionData, isAllin);
    // this._animateChipForBet(playerIndex, parsedAmount, betTurn, isAllin);
};
PlayerManager.prototype.showPlayerBet = function (playerIndex, betAmount, isAllin = false, betTurn = 3) {
    var uiIndex = window.GameManager.serverToUiIndex(playerIndex);
    if (uiIndex === -1) {
        return;
    }
    playerIndex = uiIndex;
    const parsedAmount = betAmount / 100;
    // console.error(parsedAmount);
    const positionData = this.playersInfoPositions[playerIndex];

    if (!positionData) return;

    if (isAllin) {
        this.allInLockedPlayers.add(playerIndex);
    } else if (this.allInLockedPlayers.has(playerIndex)) {
        this.allInLockedPlayers.delete(playerIndex);
    }
    this._syncAllInLock(playerIndex, isAllin);
    this._updatePlayerBetUIAfterActed(playerIndex, parsedAmount, positionData, isAllin);
    this._animateChipForBet(playerIndex, parsedAmount, betTurn, isAllin);
};
PlayerManager.prototype._clearPlayerBetUI = function (playerIndex) {
    const positionData = this.playersInfoPositions[playerIndex];
    if (!positionData) return;

    const isOhamaAndPl4 = this.isGameStateOhama && playerIndex === 4;
    const _playerBetHolder = (isOhamaAndPl4 ? this.player5BetHolder : positionData.playerBetHolder);
    const _sasia_e_bastit = (isOhamaAndPl4 ? this.sasia_e_bastit_5 : positionData.sasia_e_bastit);

    if (_playerBetHolder && _playerBetHolder.enabled) {
        this.smoothFadeEntity(_playerBetHolder, false, {
            duration: 0.2,
            endOpacity: 0
        });
    }

    if (_sasia_e_bastit && _sasia_e_bastit.enabled && _sasia_e_bastit.element) {
        const startOpacity = _sasia_e_bastit.element.opacity;
        this._betTextFadeTo(_sasia_e_bastit, startOpacity, 0, 0.2, function () {
            _sasia_e_bastit.enabled = false;
            _sasia_e_bastit.element.text = '';
        });
    }

    this._removePlayerChips(playerIndex);
};

PlayerManager.prototype._removePlayerChips = function (playerIndex) {
    const isOhamaAndPl4 = this.isGameStateOhama && playerIndex == 4;

    let chipPositions;
    if (isOhamaAndPl4) {
        chipPositions = this.chipsClone5Position;
    } else {
        chipPositions = this.chipsClonePosition[playerIndex];
    }

    if (!chipPositions) return;

    Object.values(chipPositions).forEach(turnPosEntity => {
        if (!turnPosEntity?.children) return;

        const children = [...turnPosEntity.children];

        children.forEach(child => {
            if (child && child.enabled) {
                if (child.__playerIndex === playerIndex) {
                    child.enabled = false;
                    child.destroy?.();
                }
            }
        });
    });

    for (let i = this.movingChips.length - 1; i >= 0; i--) {
        const chipData = this.movingChips[i];
        if (chipData.entity && chipData.entity.__playerIndex === playerIndex) {
            if (chipData.entity.enabled) {
                chipData.entity.enabled = false;
                chipData.entity.destroy?.();
            }
            this.movingChips.splice(i, 1);
        }
    }

    if (this.chipsClonedParent?.children) {
        const children = [...this.chipsClonedParent.children];
        children.forEach(child => {
            if (child && child.enabled && child.__playerIndex === playerIndex) {
                child.enabled = false;
                child.destroy?.();
            }
        });
    }
};
PlayerManager.prototype._animateChipForBet = function (playerIndex, betAmount, betTurn, isAllin) {
    const isOhamaAndPl4 = this.isGameStateOhama && playerIndex == 4;
    const startEntity = this.hipMovementPointToChipsClonePosition[playerIndex]?.positoinChipThatMoveToChipsClonePosition;

    const targetEntity = (isOhamaAndPl4 ? this.chipsClone5Position?.[`${betTurn}_Turn_5`] : this.chipsClonePosition[playerIndex]?.[`${betTurn}_Turn`]);

    if (!startEntity || !targetEntity) {
        return;
    }

    const chipToEnable = this._getChipForBetAmount(betAmount);
    const clonedChip = chipToEnable.clone();
    clonedChip.enabled = true;
    clonedChip.__playerIndex = playerIndex;

    this._moveChipToTarget(clonedChip, startEntity, targetEntity, 3.5, () => {
        this._playSoundAfterChipFinish();
    });
};

PlayerManager.prototype._getChipForBetAmount = function (betAmount) {
    if (betAmount <= PlayerManager.CHIP_VALUES.BLACK.max) return this.pokerChip_BLACK;
    if (betAmount <= PlayerManager.CHIP_VALUES.BLUE.max) return this.pokerChip_BLUE;
    if (betAmount <= PlayerManager.CHIP_VALUES.GREEN.max) return this.pokerChip_GREEN;
    if (betAmount <= PlayerManager.CHIP_VALUES.RED.max) return this.pokerChip_RED;
    if (betAmount <= PlayerManager.CHIP_VALUES.YELLOW.max) return this.pokerChip_YELLOW;
    return this.pokerChip_BLACK;
};
PlayerManager.prototype.userUiState = function (itIstrue) {
    if (!this.playersInfoPositions || this.playersInfoPositions.length === 0) return;

    var activeSeats = (window.GameManager && window.GameManager.seatsArray)
        ? window.GameManager.getSeatPosition(window.GameManager.seatsArray)
        : Array.from({ length: this.playersInfoPositions.length }, (_, i) => i);

    const fadeDuration = 0.3;
    const delayBetweenPlayers = 0.1;
    const targetOpacity = itIstrue ? 0.3 : 0.0;
    const startOpacity = itIstrue ? 0.0 : 0.5;

    // set initial state
    for (let i = 0; i < this.playersInfoPositions.length; i++) {
        const p = this.playersInfoPositions[i];
        if (!p) continue;

        if (activeSeats.indexOf(i) === -1) {
            // Slot joaktiv — fshi gjithçka
            this.safeSetOpacity(p.entity, 0);
            this.safeSetOpacity(p.buttonSitIn, 0);
            this.safeSetOpacity(p.iconToSitInwhenus4NOTINgame, 0);
            this.safeSetOpacity(p.iconToSitInwhenus4INgame, 0);
            this.safeSetOpacity(p.binance, 0);
            this.safeSetOpacity(p.name, 0);
            this.safeSetOpacity(p.profile, 0);
            this.safeSetOpacity(p.status, 0);
            if (p.entity?.element) p.entity.enabled = false;
            if (p.buttonSitIn?.element) p.buttonSitIn.enabled = false;
            continue;
        }

        // Slot aktiv — set start opacity
        this.safeSetOpacity(p.entity, startOpacity);
        this.safeSetOpacity(p.buttonSitIn, startOpacity);

        if (this.isUser4InGame == false) {
            this.safeSetOpacity(p.iconToSitInwhenus4NOTINgame, startOpacity);
            this.safeSetOpacity(p.iconToSitInwhenus4INgame, 0);
        } else {
            this.safeSetOpacity(p.iconToSitInwhenus4INgame, startOpacity);
            this.safeSetOpacity(p.iconToSitInwhenus4NOTINgame, 0);
        }

        this.safeSetOpacity(p.binance, startOpacity);
        this.safeSetOpacity(p.name, startOpacity);
        this.safeSetOpacity(p.profile, startOpacity);
        this.safeSetOpacity(p.status, startOpacity);

        // Reset shadow/outline
        if (p.binance?.element) {
            p.binance.element.shadowOffset = new pc.Vec2(0, 0);
            p.binance.element.outlineThickness = 0;
        }
        if (p.name?.element) {
            p.name.element.shadowOffset = new pc.Vec2(0, 0);
            p.name.element.outlineThickness = 0;
            p.name.element.useInput = true;
        }
        if (p.status?.element) {
            p.status.element.shadowOffset = new pc.Vec2(0, 0);
            p.status.element.outlineThickness = 0;
        }
    }

    // fade me delay
    let delayIndex = 0;
    const self = this;

    for (let i = 0; i < this.playersInfoPositions.length; i++) {
        const p = this.playersInfoPositions[i];
        if (!p) continue;
        if (activeSeats.indexOf(i) === -1) continue;

        const elements = [
            p.entity?.element,
            p.buttonSitIn?.element,
            p.iconToSitInwhenus4INgame?.element,
            p.iconToSitInwhenus4NOTINgame?.element,
            p.binance?.element,
            p.name?.element,
            p.profile?.element,
            p.status?.element
        ];

        const binanceEl = p.binance?.element;
        const nameEl = p.name?.element;
        const statusEl = p.status?.element;
        const profileEl = p.profile?.element;

        const slotI = i; 

        setTimeout(() => {
            self.app.fire('ChipsManager:enable_Chip_For_Player', slotI);
            console.log("CHIPS(PlayerManager): " + slotI );
            // Outline thickness on fade-in
            if (p.binance?.element) p.binance.element.outlineThickness = 0.6;
            if (p.name?.element) p.name.element.outlineThickness = 0.6;
            if (p.status?.element) p.status.element.outlineThickness = 0.6;

            let elapsed = 0;

            const fadeHandler = function (dt) {
                elapsed += dt;
                const t = Math.min(elapsed / fadeDuration, 1);
                const currentOpacity = pc.math.lerp(startOpacity, targetOpacity, t);

                elements.forEach(e => {
                    if (!e) return;
                    // binance, name, profile, status → sempre opacity 1 kur itIstrue
                    if (itIstrue && (
                        e === binanceEl ||
                        e === nameEl ||
                        e === profileEl ||
                        e === statusEl
                    )) {
                        e.opacity = 1;
                    } else {
                        e.opacity = currentOpacity;
                    }
                });

                if (t >= 1) {
                    self.app.off('update', fadeHandler);
                }
            };

            self.app.fire('PlaySound_UserJoin');
            self.app.on('update', fadeHandler);

        }, delayIndex * delayBetweenPlayers * 1000);

        delayIndex++;
    }
};
PlayerManager.prototype.safeSetOpacity = function (entity, opacity) {
    if (!entity || !entity.element) {
        if (entity && entity.enabled !== undefined) {
            entity.enabled = opacity > 0;
        }
        return false;
    }
    entity.element.opacity = opacity;
    return true;
};
PlayerManager.prototype.updateAllPlayersUI = function (seatsInfo) {
    if (!seatsInfo) return;
    this.activeSeatCount = seatsInfo.length;
    if (this.activeSeatCount !== undefined && seatsInfo.length !== this.activeSeatCount) {
        this._resetGameState();
        this._resetPlayerUI();
        this._cleanupMovingChips();
        this._cleanupTableAmount();
        this._cleanupChipContainers();
        this.previousPlayerStates = new Array(this.playersInfoPositions.length).fill(null);
        this.previousBinanceValues = new Array(this.playersInfoPositions.length).fill(null);
        this.binanceAnimationTimers = new Array(this.playersInfoPositions.length).fill(null);
        this.allInLockedPlayers.clear();
        this.activeFades = [];
    }

    var yourSeatServer = window.GameManager.getYoureSeat();
    if (this.yourLastSeat !== yourSeatServer) {
        setTimeout(() => { this.userUiState(true); }, 50);
        this.yourLastSeat = yourSeatServer;
    }
    if (!this.playersInfoPositions?.length) return;

    var seats = window.GameManager.getSeatPosition(window.GameManager.seatsArray); // UI aktive, p.sh. [1,3,4,5]

    // Fshi pozitat që nuk janë aktive
    for (var j = 0; j < this.playersInfoPositions.length; j++) {
        if (seats.indexOf(j) === -1) {
            var pd = this.playersInfoPositions[j];
            if (pd && pd.entity) pd.entity.enabled = false;
            if (pd && pd.buttonSitIn) pd.buttonSitIn.enabled = false;
        }
    }

    // lojtart prej back - playerData
    var playerByServerPos = {};
    for (var i = 0; i < seatsInfo.length; i++) {
        var playerData = seatsInfo[i];
        if (playerData && playerData.position !== undefined) {
            playerByServerPos[playerData.position] = playerData;
        }
    }

    // per qdo pozicion qe vjen prej srv, gjej uicarden edhe boj lojtart show
    for (var serverPos = 0; serverPos < seatsInfo.length; serverPos++) {
        var physicalSlot = window.GameManager._serverToUiMap[serverPos];
        if (physicalSlot === undefined) continue;

        var positionData = this.playersInfoPositions[physicalSlot];
        
        var status = this.playersInfoPositions[serverPos].status;
        
        var playerInfo = playerByServerPos[serverPos];

        if (!positionData) continue;

        if (playerInfo) {
            this._updatePlayerUI(positionData, playerInfo, physicalSlot);
            // if(seatsInfo[playerInfo].status != status) 
        } else {
            this._updatePlayerUI(positionData, { is_empty: true, position: serverPos }, physicalSlot);
        }
    }
};
PlayerManager.prototype._checkPreviousStatus = function (positionData,status) {

    // const previusStatus = this.activeSeatCount[positionData].status;
    // console.error(positionData   + "  " +status);
    // if (previusStatus === status) return;


    switch(status){
        case 102: // sit Out
            // this.app.fire('GameManager:playerStatus:sitout', positionData);
        return;
        case 103: // waiting

        return;
        case 105: // all in

        return;
        case 106: // fold

        return;
    }
    // sit Out = 102
    // waiting = 103
    // all in = 105
    // fold = 106

};
PlayerManager.prototype.updateSpecificPlayerUI = function (playerInfo) {
    const positionData = this.playersInfoPositions[playerInfo.position];
    this._updatePlayerUI(positionData, playerInfo, playerInfo.position);
    // this.drawProfile(playerInfo.position,playerInfo.imageUrl);
};
PlayerManager.prototype.onPlayerSeated = function (position, username,id, balance) {
    position = window.GameManager.serverToUiIndex(position);
    const positionData = this.playersInfoPositions[position];
    const previousState = this.previousPlayerStates[position];
    const currentState = 'active';

    this._ButtonSitInState(positionData, position, false);
    this.previousPlayerStates[position] = currentState;


    this._handlePlayerStateChange(previousState, currentState, position);

    this._enablePlayerUIPlayerSeated(positionData, position);
    this._updateSinglePlayerBinance(positionData, position, balance, '', false);
    this._updatePlayerInfoTextPlayerSeated(positionData, username, position, balance);
    this._updatePlayerPosition(positionData);
 
    // this.previousPlayerStates[position] = currentState;
};
PlayerManager.prototype.onPlayerLeft = function (position) {
    position = window.GameManager.serverToUiIndex(position);
    if (position == -1)
        return;


    // const backgroundCard = this.playersInfoPositions[position].entity;
    // // backgroundCard.element.color = FFFFFF;
    //  backgroundCard.element.color = new pc.Color(1, 1, 1); // White
    //  backgroundCard.element.opacity = 0.2;
    const positionData = this.playersInfoPositions[position];

    const previousState = this.previousPlayerStates[position];
    const currentState = 'empty';
    this._handlePlayerStateChange(previousState, currentState, position);



    this._ButtonSitInState(positionData, position, true);
    this.previousPlayerStates[position] = currentState;
};

PlayerManager.prototype._updatePlayerUI = function (positionData, playerInfo, index) {
    const previousState = this.previousPlayerStates[index];
    const currentState = this._getPlayerState(playerInfo);


    this._handlePlayerStateChange(previousState, currentState, index);
    // this._syncAllInLock(playerInfo, index);

    if (playerInfo.is_empty == true) { //osht valid
        this._ButtonSitInState(positionData, index, true);
        this.previousPlayerStates[index] = currentState;
        return;
    } else {
        this._ButtonSitInState(positionData, index, false);
    }
 
    this._enablePlayerUI(playerInfo, positionData, index);
    this._updatePlayerInfoText(positionData, playerInfo, index);
    // this._updatePlayerStatus(positionData, playerInfo, index);
    this._updatePlayerPosition(positionData);

    this.previousPlayerStates[index] = currentState;
};
PlayerManager.prototype._getPlayerState = function (playerInfo) {
    if (!playerInfo.is_empty == true) {
        return 'empty';
    }
    return playerInfo.status === "sitOut" ? 'sitOut' : playerInfo.status === "standUp" ? 'standUp' : 'active';
};

PlayerManager.prototype.collectSpecificAllin = function (playerIndex) {

    playerIndex = window.GameManager.serverToUiIndex(playerIndex);

    if (playerIndex === undefined || playerIndex === null) return;
    if (!this.allInLockedPlayers || !this.allInLockedPlayers.has(playerIndex)) return;
    if (!this.collectChipsPoint) return;

    this._disableAllBetHolders({ onlyPlayers: [playerIndex] });
    this._collectChipsFromAllSources({ onlyPlayers: [playerIndex] });
    this._clearAllInStatus(playerIndex);

    this.allInLockedPlayers.delete(playerIndex);
};

PlayerManager.prototype.collectAllAllin = function () {
    const lockedAllInPlayers = Array.from(this.allInLockedPlayers || []);
    if (!lockedAllInPlayers.length) return;

    this.gameStateIsRewarding = true;
    this._disableAllBetHolders({ onlyPlayers: lockedAllInPlayers });
    this._collectChipsFromAllSources({ onlyPlayers: lockedAllInPlayers });

    // Clear ALL IN
    lockedAllInPlayers.forEach(playerIndex => {
        this._clearAllInStatus(playerIndex);
    });

    this.allInLockedPlayers.clear();
};

PlayerManager.prototype._clearAllInStatus = function (playerIndex) {
    const userNr = this.playersInfoPositions[playerIndex];
    const binanceEntity = userNr?.status;

    if (binanceEntity?.element) {
        //to normal
        const playerInfo = this.playersInfo?.[playerIndex];
        if (playerInfo?.balance !== undefined) {
            binanceEntity.element.text = this._formatBinanceValue(String(playerInfo.balance));
        } else {
            binanceEntity.element.text = '';
        }

        //color to white
        binanceEntity.element.color = new pc.Color(1, 1, 1);

        //scale
        binanceEntity.setLocalScale(1, 1, 1);

        // stop animation nese ka
        if (binanceEntity._allInAnimation) {
            this.app.off('update', binanceEntity._allInAnimation);
            binanceEntity._allInAnimation = null;
        }
    }
};

// Keep the original _syncAllInLock function as is
PlayerManager.prototype._syncAllInLock = function (index, isallin) {
    if (!this.allInLockedPlayers) {
        this.allInLockedPlayers = new Set();
    }

    const userNr = this.playersInfoPositions[index];
    const binanceEntity = userNr.status;// statusin a binance?

    if (isallin === true) {
        // if (binanceEntity?.element) {
        //     binanceEntity.enabled = true;
        //     binanceEntity.element.text = 'ALL IN';
        //     binanceEntity.element.color = new pc.Color(217 / 255, 164 / 255, 0);

        //     this._animateAllInText(binanceEntity);
        // }
        // this.allInLockedPlayers.add(index);
    } else {
        if (binanceEntity?.element) {
            const playerInfo = this.playersInfo?.[index];
            if (playerInfo?.balance !== undefined) {
                binanceEntity.element.text = this._formatBinanceValue(String(playerInfo.balance));
            }
            binanceEntity.element.color = new pc.Color(1, 1, 1);

            binanceEntity.setLocalScale(1, 1, 1);

            if (binanceEntity._allInAnimation) {
                this.app.off('update', binanceEntity._allInAnimation);
                binanceEntity._allInAnimation = null;
            }
        }
        this.allInLockedPlayers.delete(index);
    }
};

PlayerManager.prototype._animateAllInText = function (entity) {
    if (!entity) return;

    const originalScale = entity.getLocalScale().clone();
    const duration = 0.5;
    let elapsed = 0;

    if (entity._allInAnimation) {
        this.app.off('update', entity._allInAnimation);
    }

    const animate = (dt) => {
        elapsed += dt;

        if (elapsed <= duration) {
            const progress = elapsed / duration;
            let scale;
            if (progress < 0.3) {
                scale = 1 + (0.3 * (progress / 0.3));
            } else {
                scale = 1.3 - (0.3 * ((progress - 0.3) / 0.7));
            }

            entity.setLocalScale(
                originalScale.x * scale,
                originalScale.y * scale,
                originalScale.z
            );
        } else {
            entity.setLocalScale(originalScale);

            this.app.off('update', animate);
            entity._allInAnimation = null;
        }
    };

    this.app.on('update', animate);
    entity._allInAnimation = animate;
};
PlayerManager.prototype._handlePlayerStateChange = function (previousState, currentState, playerIndex) {
    if (previousState === currentState) return;

    if ((previousState === 'empty' || previousState === 'standUp') &&
        (currentState === 'active' || currentState === 'sitOut')) {
        this.app.fire('PlaySound_UserJoin');
    }
    else if ((previousState === 'active' || previousState === 'sitOut') &&
        (currentState === 'empty' || currentState === 'standUp')) {
        this.app.fire('PlaySound_UserLeft');
    }
    else if (previousState === 'active' && currentState === 'sitOut') {
        this.app.fire('PlaySound_UserLeft');
    }
    else if (previousState === 'sitOut' && currentState === 'active') {
        this.app.fire('PlaySound_UserJoin');
    }
};

PlayerManager.prototype._isValidPlayer = function (playerInfo) {
    return playerInfo.is_empty === false;
};

PlayerManager.prototype._ButtonSitInState = function (positionData, index, isEnable) {
    // alert(positionData.position);
    if (!positionData) return
    if (positionData.entity) {
        positionData.entity.enabled = false;
    }
    // let didPlayerExist;
    const chipsAssetPosition = this.isGameStateOhama
        ? this.chipsThatEnableDisableForPLayerOhama[index]
        : this.chipsThatEnableDisableForPLayerPoker[index];
    chipsAssetPosition && (chipsAssetPosition.enabled = false);

    // if (playerExist == true) {
    //     didPlayerExist = true
    // }
    // else {
    //     didPlayerExist = playersInfo && playersInfo.exist !== undefined && playersInfo.exist !== null
    //         ? playersInfo.exist
    //         : playerExist;
    // }

    if (positionData.buttonSitIn && isEnable == true) { //was didPlayerExist == true
        positionData.buttonSitIn.enabled = true;
    } else {
        positionData.buttonSitIn.enabled = false;
    }

    // Handle icons based on user4 game state
    if (this.isUser4InGame == false) {
        if (positionData.iconToSitInwhenus4NOTINgame) {
            positionData.iconToSitInwhenus4NOTINgame.enabled = true;
        }
        if (positionData.iconToSitInwhenus4INgame) {
            positionData.iconToSitInwhenus4INgame.enabled = false;
        }
    } else {
        if (positionData.iconToSitInwhenus4INgame) {
            positionData.iconToSitInwhenus4INgame.enabled = true;
        }
        if (positionData.iconToSitInwhenus4NOTINgame) {
            positionData.iconToSitInwhenus4NOTINgame.enabled = false;
        }
    }
};
PlayerManager.prototype._enablePlayerUIPlayerSeated = function (positionData, position) {
    positionData.entity && (positionData.entity.enabled = true);

    const chipsAssetPosition = this.isGameStateOhama
        ? this.chipsThatEnableDisableForPLayerOhama[position]
        : this.chipsThatEnableDisableForPLayerPoker[position];
    chipsAssetPosition && (chipsAssetPosition.enabled = true);

    positionData.buttonSitIn.enabled = false;

};
PlayerManager.prototype._enablePlayerUI = function (playersInfo, positionData, index) {
    positionData.entity && (positionData.entity.enabled = true);

    const chipsAssetPosition = this.isGameStateOhama
        ? this.chipsThatEnableDisableForPLayerOhama[index]
        : this.chipsThatEnableDisableForPLayerPoker[index];
    chipsAssetPosition && (chipsAssetPosition.enabled = true);

    // if (positionData.buttonSitIn && playersInfo.exist == true) {
    //     positionData.buttonSitIn.enabled = playersInfo.is_empty === true;
    // } else {
    //     positionData.buttonSitIn.enabled = playersInfo.is_empty === false;
    // }
};

PlayerManager.prototype._updatePlayerInfoTextPlayerSeated = function (positionData, name, id, balance) {
    if (positionData.name?.element) {
        const nameLength = name.length;

        if (positionData.altTextName?.element) {
            positionData.altTextName.element.text = name;
        }

        positionData.name.element.text = nameLength > 12 ? name.slice(0, 12) + '...' : name;

        const needsHover = nameLength > 12;

        if (needsHover) {
            if (!positionData.name._hoverBound) {
                positionData.name._hoverBound = true;
                positionData.name._positionData = positionData;

                positionData.name.element.on('mouseenter', this.onShowAltText, this);
                positionData.name.element.on('mouseleave', this.onHideAltText, this);
            }
        } else {
            if (positionData.name._hoverBound) {

                document.body.style.cursor = 'default';
                positionData.altTextHover.enabled = false;

                positionData.name.element.off('mouseenter', this.onShowAltText, this);
                positionData.name.element.off('mouseleave', this.onHideAltText, this);
                positionData.name._hoverBound = false;
            }
        }
    }
};

PlayerManager.prototype._updatePlayerStatus = function (positionData, playerInfo, index) {
    // if(positionData.status?.element){
        const status = playerInfo.status;

        switch(status){
            case 102: // sit Out
                // this.app.fire('GameManager:playerStatus:sitout', index);
            return;
            case 103: // waiting

            return;
            case 105: // all in

            return;
            case 106: // fold

            return;
        }       
    // }

};
PlayerManager.prototype._updatePlayerInfoText = function (positionData, playerInfo, index) {
    if (positionData.name?.element) {
        const name = playerInfo.username || '';
        const nameLength = name.length;

        if (positionData.altTextName?.element) {
            positionData.altTextName.element.text = name;
        }

        positionData.name.element.text = nameLength > 12 ? name.slice(0, 12) + '...' : name;

        const needsHover = nameLength > 12;

        if (needsHover) {
            if (!positionData.name._hoverBound) {
                positionData.name._hoverBound = true;
                positionData.name._positionData = positionData;

                positionData.name.element.on('mouseenter', this.onShowAltText, this);
                positionData.name.element.on('mouseleave', this.onHideAltText, this);
            }
        } else {
            if (positionData.name._hoverBound) {

                document.body.style.cursor = 'default';
                positionData.altTextHover.enabled = false;

                positionData.name.element.off('mouseenter', this.onShowAltText, this);
                positionData.name.element.off('mouseleave', this.onHideAltText, this);
                positionData.name._hoverBound = false;
            }
        }
    }
    // if (positionData.status?.element) {
    //     const statusText = playerInfo.status !== undefined && playerInfo.status !== null
    //         ? playerInfo.status.toString()
    //         : '';

    //     positionData.status.element.text = statusText;
    // }

    this._updatePlayerBetAmount(positionData, playerInfo.current_bet, index);

    this._updatePlayerBinance(positionData, playerInfo, index);
};

PlayerManager.prototype.onShowAltText = function (event) {
    const positionData = event.element.entity._positionData;
    document.body.style.cursor = 'pointer';
    if (!positionData) return;
    positionData.altTextHover.enabled = true;
};

PlayerManager.prototype.onHideAltText = function (event) {
    const positionData = event.element.entity._positionData;

    document.body.style.cursor = 'default';
    if (!positionData) return;
    positionData.altTextHover.enabled = false;
};

//koment se u bojshin update prej table seats
PlayerManager.prototype._updatePlayerBetAmountPlayerSeated = function (positionData, betAmount, index) {
    // const isOhamaAndPl4 = this.isGameStateOhama && index == 4;
    // const betElement = isOhamaAndPl4 ? this.sasia_e_bastit_5 : positionData.sasia_e_bastit;

    // betElement?.element && (betElement.element.text = betAmount?.toString() || '0');
};

PlayerManager.prototype._updatePlayerBetAmount = function (positionData, betAmount, index) {
    // const isOhamaAndPl4 = this.isGameStateOhama && index == 4;
    // const betElement = isOhamaAndPl4 ? this.sasia_e_bastit_5 : positionData.sasia_e_bastit;

    // betElement?.element && (betElement.element.text = betAmount?.toString() || '0');
};

PlayerManager.prototype.updateSpecifiPlayerBalance = function (position, balance, change, enableAnimate = false) {
    position = window.GameManager.serverToUiIndex(position);
    const positionData = this.playersInfoPositions[position];
    this._updateSinglePlayerBinance(positionData, position, balance, change, enableAnimate);
};

PlayerManager.prototype._updateSinglePlayerBinance = function (positionData, position, balance, change, isfromSpecificPlayer = false) {
    if (!positionData.binance?.element) return;
    // const playerBalance = balance;
    const binanceEntity = positionData.binance;

    let entityElement = null;
    if (positionData.entity && positionData.entity.element) {
        entityElement = positionData.entity.element;
    } else {
        entityElement = binanceEntity.element;
    }

    // if (playerInfo.status === 'sitOut' || playerInfo.status === 'standUp') {
    //     binanceEntity.element.text = 'SIT OUT';
    //     binanceEntity.element.color = new pc.Color(0, 0, 0);
    //     binanceEntity.element.outlineColor = new pc.Color(0, 0, 0);
    //     return;
    // }

    const formattedValue = this._formatBinanceValue(String(balance));

    if (
        this.previousBinanceValues[position] !== formattedValue &&
        this.previousBinanceValues[position] !== null
    ) {
        this._animateBinanceChange(binanceEntity, formattedValue, position);
    } else {
        binanceEntity.element.text = formattedValue;
    }

    this.previousBinanceValues[position] = formattedValue;
    binanceEntity.element.color = new pc.Color(1, 1, 1);
    binanceEntity.element.outlineColor = new pc.Color(0, 0, 0);

    if (isfromSpecificPlayer) {
        const newBalance = change;
        if (entityElement) {
            this._animateOriginalElementColor(entityElement, newBalance);
        }
        this._createFlyingBalanceClone(binanceEntity, newBalance);
    }
};
PlayerManager.prototype._updatePlayerBinance = function (positionData, playerInfo, index, isfromSpecificPlayer = false) {
    if (!positionData.binance?.element) return;
    const playerBalance = playerInfo.balance ? playerInfo.balance : playerInfo.new_balance;
    const binanceEntity = positionData.binance;

    let entityElement = null;
    if (positionData.entity && positionData.entity.element) {
        entityElement = positionData.entity.element;
    } else {
        entityElement = binanceEntity.element;
    } 

    // if (playerInfo.status === 'sitOut' || playerInfo.status === 'standUp') {
    //     binanceEntity.element.text = 'SIT OUT';
    //     binanceEntity.element.color = new pc.Color(0, 0, 0);
    //     binanceEntity.element.outlineColor = new pc.Color(0, 0, 0);
    //     return;
    // }

    const formattedValue = this._formatBinanceValue(String(playerBalance));

    if (
        this.previousBinanceValues[index] !== formattedValue &&
        this.previousBinanceValues[index] !== null
    ) {
        this._animateBinanceChange(binanceEntity, formattedValue, index);
    } else {
        binanceEntity.element.text = formattedValue;
    }

    this.previousBinanceValues[index] = formattedValue;
    binanceEntity.element.color = new pc.Color(1, 1, 1);
    binanceEntity.element.outlineColor = new pc.Color(0, 0, 0);

    if (isfromSpecificPlayer) {
        const newBalance = playerInfo.change;
        if (entityElement) {
            this._animateOriginalElementColor(entityElement, newBalance);
        }
        this._createFlyingBalanceClone(binanceEntity, newBalance);
    }
};

PlayerManager.prototype._createFlyingBalanceClone = function (entity, newBalance) {
    if (!entity || !entity.element) return;

    const clonedEntity = entity.clone();
    clonedEntity.name = 'cloned_balance_' + Date.now();
    entity.parent.addChild(clonedEntity);

    const startPos = entity.getLocalPosition().clone();
    const targetPos = new pc.Vec3(11.65, 18, 0);
    const targetMaxScale = 1.1; // Define target maximum scale

    const formattedValue = this._formatBinanceValue(String(Math.abs(newBalance)));
    const sign = newBalance >= 0 ? '+' : '-';
    clonedEntity.element.text = sign + ' ' + formattedValue;
    clonedEntity.element.color = newBalance >= 0 ? new pc.Color(0.2, 1, 0.2) : new pc.Color(1, 0.2, 0.2);
    clonedEntity.element.opacity = 1;
    clonedEntity.setLocalPosition(startPos);
    clonedEntity.setLocalScale(entity.getLocalScale());

    // Set outline color to black and thickness to 0.6
    if (clonedEntity.element.outlineColor !== undefined) {
        clonedEntity.element.outlineColor = new pc.Color(0, 0, 0); // Black color
    }
    if (clonedEntity.element.outlineThickness !== undefined) {
        clonedEntity.element.outlineThickness = 0.6; // Set thickness to 0.6
    }

    let t = 0;
    const moveDuration = 1.8;
    const stayDuration = 4;
    const scaleDownDuration = 0.7;
    const totalDuration = moveDuration + stayDuration + scaleDownDuration;
    const self = this;

    function anim(dt) {
        t += dt;

        if (t < moveDuration) {
            const moveProgress = t / moveDuration;
            const smoothProgress = moveProgress < 0.5
                ? 2 * moveProgress * moveProgress
                : 1 - Math.pow(-2 * moveProgress + 2, 2) / 2;

            const currentX = pc.math.lerp(startPos.x, targetPos.x, smoothProgress);
            const currentY = pc.math.lerp(startPos.y, targetPos.y, smoothProgress);
            const currentZ = pc.math.lerp(startPos.z, targetPos.z, smoothProgress);

            const arcHeight = 3;
            const arcOffset = Math.sin(moveProgress * Math.PI) * arcHeight;
            const rotation = Math.sin(moveProgress * Math.PI * 2) * 0.1;

            clonedEntity.setLocalPosition(currentX, currentY + arcOffset, currentZ);
            clonedEntity.setEulerAngles(0, 0, rotation);

            const scaleFactor = 0.8 + smoothProgress * (targetMaxScale - 0.8);
            clonedEntity.setLocalScale(
                entity.getLocalScale().x * scaleFactor,
                entity.getLocalScale().y * scaleFactor,
                entity.getLocalScale().z * scaleFactor
            );

            // Keep outline thickness at 0.6 during movement
            if (clonedEntity.element.outlineThickness !== undefined) {
                clonedEntity.element.outlineThickness = 0.6;
            }

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

            // Keep outline thickness at 0.6 during stay (no pulsing)
            if (clonedEntity.element.outlineThickness !== undefined) {
                clonedEntity.element.outlineThickness = 0.6;
            }

        } else {
            const scaleProgress = (t - moveDuration - stayDuration) / scaleDownDuration;
            const easeProgress = Math.pow(scaleProgress, 1.5);

            clonedEntity.setLocalPosition(targetPos);

            const shrinkFactor = targetMaxScale * (1 - easeProgress);
            clonedEntity.setLocalScale(
                entity.getLocalScale().x * shrinkFactor,
                entity.getLocalScale().y * shrinkFactor,
                entity.getLocalScale().z * shrinkFactor
            );

            const fadeProgress = Math.pow(scaleProgress, 0.7);
            clonedEntity.element.opacity = 1 - fadeProgress;

            // Fade out outline thickness during scale down
            if (clonedEntity.element.outlineThickness !== undefined) {
                clonedEntity.element.outlineThickness = 0.6 * (1 - scaleProgress);
            }

            if (scaleProgress >= 1) {
                clonedEntity.destroy();
                self.app.off('update', anim);
            }
        }
    }

    self.app.on('update', anim);

    setTimeout(() => {
        if (clonedEntity && clonedEntity.element) {
            clonedEntity.destroy();
        }
        self.app.off('update', anim);
    }, totalDuration * 1000 + 1000);
};
PlayerManager.prototype._animateOriginalElementColor = function (entityElement, newBalance) {
    if (!entityElement) return;

    const originalColor = entityElement.color ? entityElement.color.clone() : new pc.Color(1, 1, 1);
    const targetColor = newBalance >= 0
        ? new pc.Color(0.3, 1, 0.3) // green
        : new pc.Color(1, 0.3, 0.3); // red

    let t = 0;
    const duration = 1.2;
    const self = this;

    function colorAnim(dt) {
        t += dt;
        const progress = Math.min(t / duration, 1);

        const easeProgress = 1 - Math.pow(1 - progress, 2);

        // color 
        const currentColor = new pc.Color(
            pc.math.lerp(originalColor.r, targetColor.r, easeProgress),
            pc.math.lerp(originalColor.g, targetColor.g, easeProgress),
            pc.math.lerp(originalColor.b, targetColor.b, easeProgress)
        );

        // pulse
        const brightness = 1 + Math.sin(progress * Math.PI * 2) * 0.08;
        entityElement.color = currentColor.clone().mulScalar(brightness);

        //  glow effect
        if (entityElement.outlineThickness !== undefined) {
            entityElement.outlineThickness = 0.05 + Math.sin(progress * Math.PI) * 0.03;
        }

        if (entityElement.outlineColor !== undefined) {
            entityElement.outlineColor = currentColor.clone().mulScalar(1.1);
        }

        if (progress >= 1) {
            //  return
            setTimeout(() => {
                let returnT = 0;
                const returnDuration = 0.6;

                function returnAnim(dt) {
                    returnT += dt;
                    const returnProgress = Math.min(returnT / returnDuration, 1);

                    const returnColor = new pc.Color(
                        pc.math.lerp(targetColor.r, originalColor.r, returnProgress),
                        pc.math.lerp(targetColor.g, originalColor.g, returnProgress),
                        pc.math.lerp(targetColor.b, originalColor.b, returnProgress)
                    );

                    entityElement.color = returnColor;

                    if (entityElement.outlineThickness !== undefined) {
                        entityElement.outlineThickness = 0.05 * (1.1 - returnProgress * 0.1);
                    }

                    if (returnProgress >= 1) {
                        entityElement.color = originalColor;
                        if (entityElement.outlineThickness !== undefined) {
                            entityElement.outlineThickness = 0.05;
                        }
                        self.app.off('update', returnAnim);
                    }
                }

                self.app.on('update', returnAnim);
            }, 100);

            self.app.off('update', colorAnim);
        }
    }

    self.app.on('update', colorAnim);
};
PlayerManager.prototype._formatBinanceValue = function (textValue) {
    return '$' + textValue/100;
};

PlayerManager.prototype._updatePlayerPosition = function (positionData) {
    if (positionData.position && positionData.entity) {
        positionData.entity.setLocalPosition(positionData.position.getLocalPosition().clone());
    }
};

PlayerManager.prototype._animateBinanceChange = function (binanceElement, newValue, playerIndex) {
    if (this.binanceAnimationTimers[playerIndex]) {
        clearTimeout(this.binanceAnimationTimers[playerIndex]);
    }

    this._pulseScaleAnimation(binanceElement, () => {
        binanceElement.element.text = newValue;
    });
};

PlayerManager.prototype._pulseScaleAnimation = function (entity, callback) {
    if (!entity?.element) {
        callback?.();
        return;
    }
    const originalScale = new pc.Vec3(1, 1, 1);

    setTimeout(() => {
        entity.setLocalScale(1.1, 1.1, 1);

        callback?.();

        setTimeout(() => {
            entity.setLocalScale(originalScale);
        }, 333);
    }, 0);
};

PlayerManager.prototype.gameWonStateRewardChips = function (positions, priceAmounts, chipTemplate = this.pokerChip_BLACK) {
    // if (!positions || !positions.length) {
    //     return;
    // }
    positions = window.GameManager.serverToUiIndex(positions);

    this.gameStateIsRewarding = true;

    chipTemplate = chipTemplate || this.pokerChip_BLACK;

    const self = this;

    if (!(chipTemplate instanceof pc.Entity)) {
        chipTemplate = self.pokerChip_BLACK;
    }

    const startPos = this.tableAmountParent?.getPosition().clone();

    if (!startPos) {
        return;
    }

    const originalText = this.tableAmount?.element?.text || "0";
    const clones = [];

    // for (let i = 0; i < positions.length; i++) {
    const winnerIndex = positions;

    const betTurn = 1;
    const isOhamaAndPl4 = this.isGameStateOhama && winnerIndex === 4;
    const targetEntity = isOhamaAndPl4
        ? this.chipsClone5Position?.[`${betTurn}_Turn_5`]
        : this.chipsClonePosition[winnerIndex]?.[`${betTurn}_Turn`];

    const winnerDec = positions;

    if (targetEntity) {
        const tableAmountClone = this._createTableAmountClone(startPos, winnerIndex, originalText);

        // Format price amount 
        let priceAmount = null;
        // if (priceAmounts !== null && priceAmounts !== undefined) {
        //     if (Array.isArray(priceAmounts) && i < priceAmounts.length) {
        priceAmount = priceAmounts / 100;
        // } else if (!Array.isArray(priceAmounts)) {
        //     priceAmount = parseFloat((priceAmounts/100).toFixed(2)).toString();
        // }
        // }

        clones.push({
            entity: tableAmountClone,
            targetEntity: targetEntity,
            winnerIndex: winnerIndex,
            priceAmount: priceAmount,
            winnedDec: winnerDec,
            startPos: startPos.clone()
        });
    }
    // }

    this._startSequentialMovement(clones, chipTemplate);
};
PlayerManager.prototype._startSequentialMovement = function (clones) {
    if (!clones.length) return;

    const self = this;

    clones.forEach((cloneData, index) => {
        setTimeout(() => {
            self.movingChips.push({
                entity: cloneData.entity,
                start: cloneData.startPos.clone(),
                target: cloneData.targetEntity.getPosition().clone(),
                progress: 0,
                duration: 0.8,
                toPot: false,
                disableAfterFinish: false,
                onComplete: function () {
                    if (cloneData.entity && cloneData.entity.enabled) {
                        // Check if priceAmount exists before calling toString
                        const priceAmount = cloneData.priceAmount !== null && cloneData.priceAmount !== undefined
                            ? cloneData.priceAmount.toString()
                            : '0';
                        self.rewardChip(cloneData.winnerIndex, priceAmount);
                    }
                }
            });
        }, 0);
    });
};

PlayerManager.prototype._createTableAmountClone = function (startPos, index = 0, initialText = "0") {
    if (!this.tableAmountParent) return null;

    const clone = this.tableAmountBackgound.clone();

    clone.enabled = true;
    clone.name = `TableAmount_Clone_ToWinner_${index}`;

    this.app.root.addChild(clone);
    clone.setPosition(this.tableAmountBackgound);
    clone.setRotation(this.tableAmountBackgound.getRotation().clone());
    clone.setLocalScale(this.tableAmountBackgound.getLocalScale().clone());

    // this._updateCloneTableAmountText(clone, initialText);
    if (!this.tableAmountClones) {
        this.tableAmountClones = [];
    }

    // Save the clone for later destruction
    this.tableAmountClones.push(clone);
    // if (index === 0) {
    //     this.tableAmountClone = clone;
    // }

    return clone;
};

PlayerManager.prototype._updateCloneTableAmountText = function (cloneEntity, priceText) {
    if (!cloneEntity) return;

    if (this.tableAmount && cloneEntity.name === this.tableAmount.name) {
        if (cloneEntity.element) {
            cloneEntity.element.text = priceText;
        }
        return;
    }

    for (let i = 0; i < cloneEntity.children.length; i++) {
        const child = cloneEntity.children[i];

        if (this.tableAmount && child.name === this.tableAmount.name) {
            if (child.element) {
                child.element.text = priceText;
            }
            return;
        }

        if (child.children.length > 0) {
            this._updateCloneTableAmountText(child, priceText);
        }
    }
};


PlayerManager.prototype.resetScript = function () {
    this.gameStateIsRewarding = false;
    this.tableAmountParent.enabled = true;
    this._cleanupMovingChips();
    this._cleanupTableAmount();
    this._cleanupChipContainers();
    this._resetPlayerUI();
    this._resetGameState();
};

PlayerManager.prototype._cleanupMovingChips = function () {
    this.movingChips?.forEach(chipData => {
        if (chipData.entity?.enabled) {
            chipData.entity.enabled = false;
            chipData.entity.destroy?.();
        }
    });
    this.movingChips = [];
};

PlayerManager.prototype._cleanupTableAmount = function () {
    if (this.tableAmountClones && this.tableAmountClones.length > 0) {
        for (let i = 0; i < this.tableAmountClones.length; i++) {
            const clone = this.tableAmountClones[i];
            if (clone && clone.destroy) {
                clone.destroy();
            }
        }
        this.tableAmountClones = [];
    }
};

PlayerManager.prototype._cleanupChipContainers = function () {
    // Clean chips cloned parent
    if (this.chipsClonedParent?.children) {
        while (this.chipsClonedParent.children.length > 0) {
            this.chipsClonedParent.children[0].destroy();
        }
    }

    // Clean all chip positions
    const chipContainers = [
        ...(this.chipsClonePosition || [])
    ];

    chipContainers.forEach(container => {
        if (!container) return;

        Object.values(container).forEach(turnPosEntity => {
            if (!turnPosEntity?.children) return;

            while (turnPosEntity.children.length > 0) {
                turnPosEntity.children[0].destroy();
            }
        });
    });
};

PlayerManager.prototype._resetPlayerUI = function () {
    this.activeFades = [];

    this.playersInfoPositions?.forEach(positionData => {
        if (positionData.playerBetHolder) {
            positionData.playerBetHolder.enabled = false;
            if (positionData.playerBetHolder.element) {
                positionData.playerBetHolder.element.opacity = 0;
            }
        }

        if (positionData.sasia_e_bastit) {
            positionData.sasia_e_bastit.enabled = false;
            if (positionData.sasia_e_bastit.element) {
                positionData.sasia_e_bastit.element.opacity = 0;
                positionData.sasia_e_bastit.element.text = '';
            }
        }
    });

    // Reset player 5 bet UI
    if (this.player5BetHolder) {
        this.player5BetHolder.enabled = false;
        if (this.player5BetHolder.element) {
            this.player5BetHolder.element.opacity = 0;
        }
    }

    if (this.sasia_e_bastit_5) {
        this.sasia_e_bastit_5.enabled = false;
        if (this.sasia_e_bastit_5.element) {
            this.sasia_e_bastit_5.element.opacity = 0;
            this.sasia_e_bastit_5.element.text = '';
        }
    }
};

PlayerManager.prototype._resetGameState = function () {
    this.tableAmount?.element && (this.tableAmount.element.text = '0');
    this.positionThatTableAmountGo = null;

    this.allInLockedPlayers.clear();

    if (this._activeBetFades) this._activeBetFades.clear();

    this.previousPlayerStates.fill(null);
    this.previousBinanceValues.fill(null);
    this.binanceAnimationTimers.fill(null);
};
PlayerManager.prototype.onDestory = function () {
    this.app.off('GameManager:gameState:Ohama:Poker', this.defineIsGameIsOhamaOrPoker, this);
    this.app.off('GameManager:gameState:Tournament', this.defineGameStateIsTournament, this);
    this.app.off('GameManager:updatePlayersInfo', this.updateAllPlayersUI, this);
    this.app.off('GameManager:updateSpecificPlayerInfo', this.updatePlayerUI, this);
    this.app.off('GameManager:showPlayerBet', this.showPlayerBet, this);
    this.app.off('GameManager:collectPlayersAction', this.collectAllChips, this);
    this.app.off('GameManager_RESTARTSCRIPT', this.resetScript, this);
    this.app.off('GameManager_State:game_won:chipsReward', this.gameWonStateRewardChips, this);
};
