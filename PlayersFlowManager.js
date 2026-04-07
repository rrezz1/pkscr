var PlayersFlowManager = pc.createScript('playersFlowManager');

PlayersFlowManager.attributes.add('playersFlowManager', {
    type: 'json',
    array: true,
    schema: [
        { name: 'pfpOpacity', type: 'entity' },
        { name: 'profile', type: 'entity' },
        { name: 'bckOpacity', type: 'entity' },
        { name: 'tableShadow', type: 'entity' },
        { name: 'nameOpacity', type: 'entity' },
        { name: 'balOpacity', type: 'entity' },
        { name: 'statusOpacity', type: 'entity'},
        { name: 'playerturn', type: 'entity', title: 'Player Turn' },
        { name: 'frameGameWin', type: 'entity' },
        { name: 'statusHolder', type: 'entity' },
        { name: 'playerCheck', type: 'entity', title: 'Player Check' },
        { name: 'playerBet', type: 'entity', title: 'Player Bet' },
        { name: 'playerFold', type: 'entity', title: 'Player Fold' },
        { name: 'playerAllIn', type: 'entity', title: 'Player Allin' },
        { name: 'sitIn', type: 'entity' },
        { name: 'iconToSitInwhenus4NOTINgame', type: 'entity' },
        { name: 'iconToSitInwhenus4INgame', type: 'entity' }
    ],
    title: 'playersFlowManager'
});
PlayersFlowManager.attributes.add('player4Actions', {
    type: 'json',
    title: 'Player 4 Actions',
    schema: [

        { name: 'table4Shadow', type: 'entity' },
        { name: 'status4Holder', type: 'entity' },
        { name: 'player4Check', type: 'entity' },
        { name: 'player4Bet', type: 'entity' },
        { name: 'player4Fold', type: 'entity' },
        { name: 'player4AllIn', type: 'entity' }
    ]
});

PlayersFlowManager.attributes.add('actionCollector', {
    type: "entity",
});

PlayersFlowManager.attributes.add('timmerButton', {
    type: "entity",
});

PlayersFlowManager.attributes.add('timmerButtonParent', {
    type: "entity",
});


PlayersFlowManager.prototype.initialize = function () {

    if (!this.playersFlowManager) {
        this.playersFlowManager = [];
    }
    this.isUser4InGame;
    this.isGameStateOhama;
    this.shouldUserUiEnabled = 0.5;
    this.shadowOffset = new pc.Vec2(0, 0);
    this.outlineThinkes = 0;
    this.fadeTime = 0;
    this.fadeDuration = 0;

    this.lightOpacity = 1;
    this.playerOpacityNormalMode = 0.3;
    this.opacityOnFold = 0.12;
    this.opacityOnlose = 0.12;
    this.allInLockedPlayers = new Set();
    this.gameWonUser = new Set();
    this.moveOpacityTo0Timer = 3; // 3 seconds
    this.opacityTimerActive = false;
    this.opacityTimerElapsed = 0;

    // FIX: max opacity e lejuar për statusHolder
    this.STATUS_HOLDER_MAX_OPACITY = 0.25;

    this.activeFades = [];
    this.smoothFadeDuration = 0.5; // fade duration 
    this.fadeEasing = this.easeInOutQuad;
    this.currentTurnIndex = null;
    this.turnWobbleTime = 0;
    this.turnWobbleSpeed = 8;
    this.turnWobbleAngle = 6;
    this.call_TurnWobble = false;
    this.turnScaleTarget = 3.5;
    this.turnScaleLerpSpeed = 4;//sppeedd of scale
    this.turnScaleProgress = 0;
    this.turnScaleDownIndex = null;
    this.turnScaleDownProgress = 0;
    this.turnWobbleScaleAmount = 0.12;

    if (this.timmerButton && this.timmerButton.element) {

        this.timmerButton.element.on('click', this.onTimmerButtonClicked.bind(this));
    }
    
    // PERFORMANCE FIX: Centralized animation system prevents listener buildup
    this.activeAnimations = [];
    this.animationId = 0;
    this.singleUpdateHandler = this._updateAllAnimations.bind(this);
    this.hasUpdateListener = false;
    this.cachedVec3Pool = [];
    this.maxVec3PoolSize = 50;

    this.app.on('GameManager:gameState:Ohama:Poker', this.defineIsGameIsOhamaOrPoker, this);
    this.app.on('GameManager:defineIsMainUserPlaying', this.defineIsUser4Playing, this);
    // this.app.on('GameManager_UiManager:enable_disable_UIUsers', this.userUiState, this);
    this.app.on('GameManager_PlayerFlow:playerTurn', this.setPlayerTurn, this);
    
    this.app.on('GameManager:playerAction:check', this.setPlayerActionCheck, this);
    this.app.on('GameManager:playerAction:bet', this.setPlayerActionBet, this);
    this.app.on('GameManager:playerAction:call', this.setPlayerActionCall, this);
    this.app.on('GameManager:playerAction:raise', this.setPlayerActionRaise, this);
    this.app.on('GameManager:playerAction:fold', this.setPlayerActionFold, this);
    this.app.on('GameManager:playerAction:smallblind', this.setPlayerActionSmallBlind, this);
    this.app.on('GameManager:playerAction:bigblind', this.setPlayerActionBigBlind, this);
    this.app.on('GameManager:playerAction:allin', this.setPlayerActionAllIn, this);
    this.app.on('GameManager:playerAction:ante', this.setPlayerActionAnte, this);

    this.app.on("GameManager:updateSpecificPlayerInfo:player_left", this.onPlayerLeft,this);


    this.app.on('GameManager:playerStatus:sitin', this.setPlayerStatusSitIn, this);
    this.app.on('GameManager:playerStatus:sitout', this.setPlayerStatusSitOut, this);
    this.app.on('GameManager:playerStatus:waiting', this.setPlayerStatusWaiting, this);
    this.app.on('GameManager:playerStatus:disconnected', this.setPlayerStatusDisconnected, this);
    this.app.on('GameManager:playerStatus:connected', this.setPlayerStatusConnected, this);    

    this.app.on('GameManager_PlayerFlow:CollectActions', this.collectActoins, this);
    this.app.on('GameManager:collectAllinActions', this.collectAllAllin, this);
    this.app.on('GameManager:collectSpecificAllinActions', this.collectSpecificAllin, this);

    this.app.on('GameManager:disablePlayerBet', this.disableAllActions, this);
    this.app.on('GameManager:disableSpecificPlayerBet', this.disableSpecificPLayerAction, this);
    this.app.on('GameManager_State:game_won:CardUserReward', this.gameWon, this);
    this.app.on('ManageOpacity:Fold', this.manageOpacityOnFold, this);

    this.app.on('PlayersFlowManager:StartOpacityTimer', this.startOpacityTimer, this);
    this.app.on('PlayersFlowManager:StopOpacityTimer', this.stopOpacityTimer, this);
    this.app.on('PlayersFlowManager:fadeAllPlayersToZero', this.fadeAllPlayersToZero, this);

    this.app.on('GameManager_RESTARTSCRIPT', this.resetScript, this);
    this.app.on('CircleTimmer:Start_rotateTheUser4Frame', this.animatePulseAndRotate, this);

};
PlayersFlowManager.prototype._setTextIfChanged = function (element, text) {
    if (!element) return;
    const next = text !== undefined && text !== null ? String(text) : '';
    if (element.text !== next) {
        element.text = next;
    }
};

PlayersFlowManager.prototype.animatePulseAndRotate = function (index) {
    if (!this.isUser4InGame) return;
    if (typeof index === 'number' && index >= 0 && index < this.playersFlowManager.length) {
        this.currentTurnIndex = index;
    }
    this.call_TurnWobble = true;
    this.turnWobbleTime = 0;
    this.turnScaleProgress = 0;
    this._cacheOriginalBckRotations();

    this.app.fire('uiButtons:setStateBuyTimmerButton', true);
};
PlayersFlowManager.prototype.onTimmerButtonClicked = function () {
    this.app.fire("TimmerButton:Clicked");
};
PlayersFlowManager.prototype.serverToUiIndex = function (serverPosition) {
    return window.GameManager.serverToUiIndex(serverPosition);
};

// Kthen array-in e UI physicalSlots aktive për numrin aktual të lojtarëve
PlayersFlowManager.prototype._getActiveSeats = function () {
    if (window.GameManager && window.GameManager.seatsArray) {
        return window.GameManager.getSeatPosition(window.GameManager.seatsArray);
    }
    // Fallback: të gjithë slotet
    var all = [];
    for (var i = 0; i < this.playersFlowManager.length; i++) all.push(i);
    return all;
};

PlayersFlowManager.prototype._updateAllAnimations = function(dt) {
    
    if (this.activeAnimations.length === 0) {
        this.app.off('update', this.singleUpdateHandler);
        this.hasUpdateListener = false;
        return;
    }
    
    // Update all active animations
    for (let i = this.activeAnimations.length - 1; i >= 0; i--) {
        const anim = this.activeAnimations[i];
        
        if (!anim || !anim.update) {
            this.activeAnimations.splice(i, 1);
            continue;
        }
        
        const isComplete = anim.update(dt);
        
        if (isComplete) {
            if (anim.onComplete) {
                anim.onComplete();
            }
            this.activeAnimations.splice(i, 1);
        }
    }
};

PlayersFlowManager.prototype._addAnimation = function(animationConfig) {
    const animation = {
        id: ++this.animationId,
        elapsed: 0,
        duration: animationConfig.duration || 0.5,
        update: animationConfig.update,
        onComplete: animationConfig.onComplete,
        data: animationConfig.data || {}
    };
    
    this.activeAnimations.push(animation);
    
    if (!this.hasUpdateListener) {
        this.app.on('update', this.singleUpdateHandler);
        this.hasUpdateListener = true;
    }
    
    return animation.id;
};

PlayersFlowManager.prototype._getVec3 = function() {
    if (this.cachedVec3Pool.length > 0) {
        return this.cachedVec3Pool.pop();
    }
    return new pc.Vec3();
};

PlayersFlowManager.prototype._returnVec3 = function(vec) {
    if (this.cachedVec3Pool.length < this.maxVec3PoolSize) {
        this.cachedVec3Pool.push(vec);
    }
};

PlayersFlowManager.prototype.defineIsUser4Playing = function (isUser4Playing) {
    this.isUser4InGame = isUser4Playing;

    const targetEnabled = (this.isUser4InGame == true);

    if (this.fadeAnimation) {
        this.app.off('update', this.fadeAnimation);
        this.fadeAnimation = null;
    }

};

PlayersFlowManager.prototype.easeInOutQuad = function (t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};

PlayersFlowManager.prototype.easeOutCubic = function (t) {
    return 1 - Math.pow(1 - t, 3);
};

PlayersFlowManager.prototype.easeInOutSine = function (t) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
};

PlayersFlowManager.prototype.smoothFadeEntity = function (entity, targetEnabled, options = {}) {
    if (!entity || !entity.element) {
        if (entity) entity.enabled = targetEnabled;
        return;
    }

    // const duration = options.duration || this.smoothFadeDuration; //was
    const duration = 0;
    const easing = options.easing || this.fadeEasing;
    const onComplete = options.onComplete;
    const startOpacity = options.startOpacity;

    // FIX: nëse ky entitet është statusHolder, kufizo targetOpacity në max 0.25
    let endOpacity;
    if (options.endOpacity !== undefined) {
        endOpacity = options.endOpacity;
    } else if (targetEnabled) {
        endOpacity = this._isStatusHolder(entity) ? this.STATUS_HOLDER_MAX_OPACITY : 1;
    } else {
        endOpacity = 0;
    }

    const initialOpacity = startOpacity !== undefined ? startOpacity : entity.element.opacity;
    const initialEnabled = entity.enabled;

    this.cancelFade(entity);

    const fade = {
        entity: entity,
        startTime: 0,
        duration: duration,
        easing: easing,
        initialOpacity: initialOpacity,
        targetOpacity: endOpacity,
        initialEnabled: initialEnabled,
        targetEnabled: targetEnabled,
        onComplete: onComplete
    };

    if (!targetEnabled) {
        entity.enabled = true;
        entity.element.opacity = initialOpacity;
    } else {
        entity.enabled = true;
        entity.element.opacity = 0;
        fade.initialOpacity = 0;
    }

    this.activeFades.push(fade);

    return {
        cancel: () => this.cancelFade(entity)
    };
};

PlayersFlowManager.prototype._isStatusHolder = function (entity) {
    if (!entity) return false;
    for (let i = 0; i < this.playersFlowManager.length; i++) {
        const p = this.playersFlowManager[i];
        if (p && p.statusHolder === entity) return true;
    }
    if (this.player4Actions && this.player4Actions.status4Holder === entity) return true;
    return false;
};

PlayersFlowManager.prototype.cancelFade = function (entity) {
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

PlayersFlowManager.prototype.startOpacityTimer = function () {
    this.opacityTimerActive = true;
    this.opacityTimerElapsed = 0;
};

PlayersFlowManager.prototype.stopOpacityTimer = function () {
    this.opacityTimerActive = false;
    this.opacityTimerElapsed = 0;
};

PlayersFlowManager.prototype.fadeAllPlayersToZero = function () {
    const fadeDuration = 1.0;

    for (let i = 0; i < this.playersFlowManager.length; i++) {
        const player = this.playersFlowManager[i];
        if (!player) continue;

        const elements = [
            player.pfpOpacity?.element,
            player.bckOpacity?.element,
            player.nameOpacity?.element,
            player.profile?.element,
            player.balOpacity?.element,
            player.statusOpacity?.element,
            player.tableShadow?.element,
            player.sitIn?.element,
            player.iconToSitInwhenus4INgame?.element ,
            player.iconToSitInwhenus4NOTINgame?.element
        ];
        player.statusOpacity.element.outlineThickness = 0;
        player.balOpacity.element.outlineThickness = 0;
        player.nameOpacity.element.outlineThickness = 0;
        

        // PERFORMANCE FIX: Use centralized animation instead of multiple listeners
        elements.forEach(element => {
            if (!element) return;

            const startOpacity = element.opacity || 1;

            this._addAnimation({
                duration: fadeDuration,
                data: { element, startOpacity },
                update: (dt) => {
                    const anim = this.activeAnimations.find(a => a.data.element === element);
                    if (!anim) return true;
                    
                    anim.elapsed += dt;
                    const t = Math.min(anim.elapsed / anim.duration, 1);
                    element.opacity = pc.math.lerp(startOpacity, 0, t);

                    if (t >= 1) {
                        element.opacity = 0;
                        return true;
                    }
                    return false;
                }
            });
        });
    }

    if (this.isUser4InGame) {
        // Handle timmerButton - PERFORMANCE FIX: Use centralized animation
        if (this.timmerButton && this.timmerButton.element) {
            const element = this.timmerButton.element;
            const startOpacity = element.opacity || 1;
            const fadeDuration = 0.5;

            this._addAnimation({
                duration: fadeDuration,
                data: { element, target: this.timmerButton, startOpacity },
                update: (dt) => {
                    const anim = this.activeAnimations.find(a => a.data.element === element);
                    if (!anim) return true;
                    
                    anim.elapsed += dt;
                    const t = Math.min(anim.elapsed / anim.duration, 1);
                    element.opacity = pc.math.lerp(startOpacity, 0, t);

                    if (t >= 1) {
                        element.opacity = 0;
                        anim.data.target.enabled = false;
                        return true;
                    }
                    return false;
                }
            });
        }

        // Handle timmerButtonParent - PERFORMANCE FIX: Use centralized animation
        if (this.timmerButtonParent && this.timmerButtonParent.element) {
            const element = this.timmerButtonParent.element;
            const startOpacity = element.opacity || 1;
            const fadeDuration = 0.5;

            this._addAnimation({
                duration: fadeDuration,
                data: { element, target: this.timmerButtonParent, startOpacity },
                update: (dt) => {
                    const anim = this.activeAnimations.find(a => a.data.element === element);
                    if (!anim) return true;
                    
                    anim.elapsed += dt;
                    const t = Math.min(anim.elapsed / anim.duration, 1);
                    element.opacity = pc.math.lerp(startOpacity, 0, t);

                    if (t >= 1) {
                        element.opacity = 0;
                        anim.data.target.enabled = false;
                        return true;
                    }
                    return false;
                }
            });
        }
    }
};

PlayersFlowManager.prototype.defineIsGameIsOhamaOrPoker = function (isOhama) {
    this.isGameStateOhama = isOhama;
};


PlayersFlowManager.prototype.disableSpecificPLayerAction = function (playerPosition) {
    if (!this.playersFlowManager || playerPosition === undefined || playerPosition === null) return;

    const player = this.playersFlowManager[playerPosition];
    if (!player) return;

    const isOhamaPlayer4 = this.isGameStateOhama && playerPosition === 4;

    const fadeOptions = {
        duration: 0.4,
        easing: this.easeInOutSine
    };

    if (isOhamaPlayer4) {
        if (this.player4Actions.status4Holder && this.player4Actions.status4Holder.enabled)
            this.player4Actions.status4Holder.element.opacity = 0;
            this.player4Actions.status4Holder.enabled = false;

        if (this.player4Actions.player4Check && this.player4Actions.player4Check.enabled)
            this.player4Actions.player4Check.element.opacity = 0;
            this.player4Actions.player4Check.enabled = false;

        if (this.player4Actions.player4Bet && this.player4Actions.player4Bet.enabled)
            this.player4Actions.player4Bet.element.opacity = 0;
            this.player4Actions.player4Bet.enabled = false;

        if (this.player4Actions.player4Fold && this.player4Actions.player4Fold.enabled)
            this.player4Actions.player4Fold.element.opacity = 0;
            this.player4Actions.player4Fold.enabled = false;
        if (this.player4Actions.player4AllIn && this.player4Actions.player4AllIn.enabled)
            this.player4Actions.player4AllIn.element.opacity = 0;
            this.player4Actions.player4AllIn.enabled = false;

    } else {
        if (this.allInLockedPlayers && this.allInLockedPlayers.has(playerPosition)) return;

        if (player.statusHolder && player.statusHolder.enabled)
            player.statusHolder.element.opacity = 0;
            player.statusHolder.enabled = false;
        if (player.playerCheck && player.playerCheck.enabled)
            player.playerCheck.element.opacity = 0;;
            player.playerCheck.enabled = false;
        if (player.playerBet && player.playerBet.enabled)
            player.playerBet.element.opacity = 0;;
            player.playerBet.enabled = false;
        if (player.playerFold && player.playerFold.enabled)
            player.playerFold.element.opacity = 0;;
            player.playerFold.enabled = false;
        if (player.playerAllIn && player.playerAllIn.enabled)
            player.playerAllIn.element.opacity = 0;;
            player.playerAllIn.enabled = false;
    }
};
PlayersFlowManager.prototype.disableAllActions = function () {
    if (!this.playersFlowManager || this.playersFlowManager.length === 0) {
        return;
    }
    const lockedAllIn = this.allInLockedPlayers || new Set();

    const instantHide = (entity) => {
        if (!entity) return;
        this.cancelFade(entity); 
        if (entity.element) {
            entity.element.opacity = 0;
        }
        entity.enabled = false;
    };

    for (let i = 0; i < this.playersFlowManager.length; i++) {
        let player = this.playersFlowManager[i];
        if (!player) continue;

        if (player.actionTimeout) {
            clearTimeout(player.actionTimeout);
            player.actionTimeout = null;
        }

        if (lockedAllIn.has(i)) continue;

        instantHide(player.statusHolder);
        instantHide(player.playerCheck);
        instantHide(player.playerBet);
        instantHide(player.playerFold);
        instantHide(player.playerAllIn);
    }

    // Pjesa për Lojtarin 4 (Omaha) pa smoothFadeEntity
    if (this.player4Actions) {
        if (this.player4Actions.actionTimeout) {
            clearTimeout(this.player4Actions.actionTimeout);
            this.player4Actions.actionTimeout = null;
        }
        
        instantHide(this.player4Actions.status4Holder);
        instantHide(this.player4Actions.player4Check);
        instantHide(this.player4Actions.player4Bet);
        instantHide(this.player4Actions.player4Fold);
        instantHide(this.player4Actions.player4AllIn);
    }
};

PlayersFlowManager.prototype.setPlayerTurn = function (playerIndex) {
    playerIndex = window.GameManager.serverToUiIndex(playerIndex);

    this.app.fire('uiButtons:setStateBuyTimmerButton', false);

    if (!this.playersFlowManager || this.playersFlowManager.length === 0) {
        return;
    }

    if (playerIndex == -1) {
        for (let i = 0; i < this.playersFlowManager.length; i++) {
            if (this.foldedPlayers && this.foldedPlayers[i]) continue;

            const player = this.playersFlowManager[i];
            if (!player) continue;


            if (player.pfpOpacity && player.pfpOpacity.element)
                player.pfpOpacity.element.opacity = this.playerOpacityNormalMode;
            if (player.bckOpacity && player.bckOpacity.element)
                player.bckOpacity.element.opacity = this.playerOpacityNormalMode;
            if (player.nameOpacity && player.nameOpacity.element)
                player.nameOpacity.element.opacity = 1;

            if(player.profile && player.profile.element)
                player.profile.element.opacity = 1;

            if (player.balOpacity && player.balOpacity.element)
                player.balOpacity.element.opacity = 1;
            if(player.statusOpacity &&  player.statusOpacity.element)
                player.statusOpacity.element.opacity = 1;
            // Hide shadow
            let playerShadow;
            if (i == 4) {
                if (this.isUser4InGame == false) {
                    playerShadow = this.player4Actions.table4Shadow;
                } else {
                    playerShadow = player.tableShadow;
                }
            } else {
                playerShadow = player.tableShadow;
            }

            if (playerShadow && playerShadow.element)
                playerShadow.element.opacity = 0;
        }

        this.app.fire('PlayerFlowManager:Activate circle', playerIndex);
        return;
    }
    if (playerIndex < 0 || playerIndex >= this.playersFlowManager.length) {
        console.warn("Invalid player index:", playerIndex);
        return;
    }

    for (let i = 0; i < this.playersFlowManager.length; i++) {
        if (this.foldedPlayers && this.foldedPlayers[i]) continue;

        const player = this.playersFlowManager[i];
        if (!player) continue;


        if (player.pfpOpacity && player.pfpOpacity.element)
            player.pfpOpacity.element.opacity = this.playerOpacityNormalMode;
        if (player.bckOpacity && player.bckOpacity.element)
            player.bckOpacity.element.opacity = this.playerOpacityNormalMode;
        if (player.nameOpacity && player.nameOpacity.element)
            player.nameOpacity.element.opacity = 1;
        if(player.profile && player.profile.element)
            player.profile.element.opacity = 1;
        if (player.balOpacity && player.balOpacity.element)
            player.balOpacity.element.opacity = 1;

        if(player.statusOpacity &&  player.statusOpacity.element)
            player.statusOpacity.element.opacity = 1;

        let playerShadow;
        if (i == 4) {

            if (this.isUser4InGame == false) {
                playerShadow = this.player4Actions.table4Shadow;
            } else {
                playerShadow = player.tableShadow;
            }
        } else {
            playerShadow = player.tableShadow;
        }

        if (playerShadow && playerShadow.element)
            playerShadow.element.opacity = 0;

    }

    this.app.fire('PlayerFlowManager:Activate circle', playerIndex);

    const currentPlayer = this.playersFlowManager[playerIndex];
    if (!currentPlayer) return;

    let pfpOpc = currentPlayer.pfpOpacity;
    let bckOpc = currentPlayer.bckOpacity;
    let nameOpc = currentPlayer.nameOpacity;
    let profileOpc = currentPlayer.profile;
    let balOpc = currentPlayer.balOpacity;
    let stOpc = currentPlayer.statusOpacity;

    let shadow;
    if (playerIndex == 4) {
        if (this.isUser4InGame == false) {
            shadow = this.player4Actions.table4Shadow;
        } else {
            shadow = currentPlayer.tableShadow;
        }
    } else {
        shadow = currentPlayer.tableShadow;
    }


        if (pfpOpc && pfpOpc.element) pfpOpc.element.opacity = 1;
        if (bckOpc && bckOpc.element) bckOpc.element.opacity = 0.4;
        if (nameOpc && nameOpc.element) nameOpc.element.opacity = 1;
        if (profileOpc && profileOpc.element) profileOpc.element.opacity = 1;
        if (balOpc && balOpc.element) balOpc.element.opacity = 1;
        if (stOpc && stOpc.element) stOpc.element.opacity = 1;
        if (shadow && shadow.element) shadow.element.opacity = 0;

        this.fadeTime = 0;
        this.fadeDuration = 10;

        if (shadow && shadow.element) {
            this.shadowfadeTarget = shadow.element;
            this.shadowfadeTime = 0;
            this.shadowfadeDuration = 0.5;
        }

        if (bckOpc && bckOpc.element) {
            this.bckfadeTarget = bckOpc.element;
            this.bckfadeTime = 0;
            this.bckfadeDuration = 0.2;
        }

        this.currentTurnIndex = playerIndex;
        this.turnWobbleTime = 0;
        this.turnScaleProgress = 0;
    
};
//one by one
// PlayersFlowManager.prototype.userUiState = function (itIstrue) {
//     if (!this.playersFlowManager || this.playersFlowManager.length === 0) {
//         return;
//     }

//     var activeSeats = this._getActiveSeats(); // p.sh. [1,3,4,5] për 4 lojtarë

//     const fadeDuration = 0.3;
//     const delayBetweenPlayers = 0.1;
//     const targetOpacity = itIstrue ? 0.3 : 0.0;
//     const startOpacity = itIstrue ? 0.0 : 0.5;

//     for (let i = 0; i < this.playersFlowManager.length; i++) {
//         const player = this.playersFlowManager[i];
//         if (!player) continue;

//         // Fshi slotet joaktive
//         if (activeSeats.indexOf(i) === -1) {
//             this.safeSetOpacity(player.bckOpacity, 0);
//             this.safeSetOpacity(player.sitIn, 0);
//             this.safeSetOpacity(player.iconToSitInwhenus4NOTINgame, 0);
//             this.safeSetOpacity(player.iconToSitInwhenus4INgame, 0);
//             this.safeSetOpacity(player.balOpacity, 0);
//             this.safeSetOpacity(player.nameOpacity, 0);
//             this.safeSetOpacity(player.profile, 0);
//             this.safeSetOpacity(player.statusOpacity, 0);
//             if (player.bckOpacity?.element)    player.bckOpacity.enabled    = false;
//             if (player.sitIn?.element)         player.sitIn.enabled         = false;
//             continue;
//         }

//         this.safeSetOpacity(player.bckOpacity, startOpacity);
//         this.safeSetOpacity(player.sitIn, startOpacity);
//         if (this.isUser4InGame == false) {
//             this.safeSetOpacity(player.iconToSitInwhenus4NOTINgame, startOpacity);
//         } else {
//             this.safeSetOpacity(player.iconToSitInwhenus4INgame, startOpacity);
//         }
//         this.safeSetOpacity(player.balOpacity, startOpacity);
//         this.safeSetOpacity(player.nameOpacity, startOpacity);
//         this.safeSetOpacity(player.profile, startOpacity);
//         this.safeSetOpacity(player.statusOpacity, startOpacity);

//         if (player.balOpacity && player.balOpacity.element) {
//             player.balOpacity.element.shadowOffset = new pc.Vec2(0, 0);
//             player.balOpacity.element.outlineThickness = 0;
//         }
//         if (player.nameOpacity && player.nameOpacity.element) {
//             player.nameOpacity.element.shadowOffset = new pc.Vec2(0, 0);
//             player.nameOpacity.element.outlineThickness = 0;
//             player.nameOpacity.element.useInput = true;
//         }
//         if (player.statusOpacity && player.statusOpacity.element) {
//             player.statusOpacity.element.shadowOffset = new pc.Vec2(0, 0);
//             player.statusOpacity.element.outlineThickness = 0;
//         }
//     }

//     let totalPlayers = activeSeats.length;
//     let delayIndex = 0;

//     for (let i = 0; i < this.playersFlowManager.length; i++) {
//         const player = this.playersFlowManager[i];
//         if (!player) continue;
//         if (activeSeats.indexOf(i) === -1) continue; // kalon slotet joaktive

//         const slotIndex = activeSeats[activeSeats.indexOf(i)]; 
//         const elements = [
//             player.bckOpacity?.element,
//             player.sitIn?.element,
//             player.iconToSitInwhenus4INgame?.element,
//             player.iconToSitInwhenus4NOTINgame?.element,
//             player.balOpacity?.element,
//             player.nameOpacity?.element,
//             player.profile?.element,
//             player.statusOpacity?.element
//         ];
//         const balOpacityElement    = player.balOpacity?.element;
//         const nameOpacityElement   = player.nameOpacity?.element;
//         const statusOpacityElement = player.statusOpacity?.element;
//         const profileOpacityElement = player.profile?.element;

//         const self = this;

//         setTimeout(() => {
//             self.app.fire('ChipsManager:enable_Chip_For_Player', i);

//             if (player.balOpacity && player.balOpacity.element) {
//                 player.balOpacity.element.outlineThickness = 0.6;
//                 player.nameOpacity.element.outlineThickness = 0.6;
//                 player.statusOpacity.element.outlineThickness = 0.6;
//             }

//             let elapsed = 0;

//             const fadeHandler = function (dt) {
//                 elapsed += dt;
//                 const t = Math.min(elapsed / fadeDuration, 1);
//                 const currentOpacity = pc.math.lerp(startOpacity, targetOpacity, t);

//                 elements.forEach(e => {
//                     if (e) {
//                         if ((e === balOpacityElement    && itIstrue) ||
//                             (e === nameOpacityElement   && itIstrue) ||
//                             (e === profileOpacityElement && itIstrue) ||
//                             (e === statusOpacityElement && itIstrue)) {
//                             e.opacity = 1;
//                         } else {
//                             e.opacity = currentOpacity;
//                         }
//                     }
//                 });

//                 if (t >= 1) {
//                     self.app.off('update', fadeHandler, self);
//                 }
//             };
//             self.app.fire('PlaySound_UserJoin');
//             self.app.on('update', fadeHandler, self);
//         }, delayIndex * delayBetweenPlayers * 1000);

//         delayIndex++;
//     }

//     const totalAnimationTime = fadeDuration + (delayBetweenPlayers * totalPlayers);

//     setTimeout(() => {
//         // this.app.fire('GameManager_Pharse:moveFirstCards');
//     }, totalAnimationTime * 1000);
// };
PlayersFlowManager.prototype.safeSetOpacity = function (entity, opacity) {
    if (!entity || !entity.element) {
        if (entity && entity.enabled !== undefined) {
            entity.enabled = opacity > 0;
        }
        return false;
    }
    entity.element.opacity = opacity;
    return true;
};
PlayersFlowManager.prototype.gameWon = function (winnerId) {
    winnerId = window.GameManager.serverToUiIndex(winnerId);
    if (!winnerId) return;

    const playerIndexes = [winnerId];
    
    this.gameWonUser.add(winnerId);
    for (let i = 0; i < this.playersFlowManager.length; i++) {
        const playerId = i;
        const isWinner = this.gameWonUser.has(playerId);
        
        this.setPlayerOpacity(playerId, isWinner);  
    }
    
    this.app.fire('PlaySound_GammeWinner');
};
PlayersFlowManager.prototype.setPlayerOpacity = function(playerId, isWinner) {
    let player = this.safeGetPlayer(playerId);
    if (!player) return;
    
    player.nameOpacity.element.useInput = false;
    
    const opacity = isWinner ? 1 : this.opacityOnlose;
    const shadowOpacity = isWinner ? this.lightOpacity : 0;
    
    this.safeSetOpacity(player.pfpOpacity, opacity);
    this.safeSetOpacity(player.bckOpacity, opacity);
    this.safeSetOpacity(player.profile, opacity);
    this.safeSetOpacity(player.nameOpacity, opacity);
    this.safeSetOpacity(player.balOpacity, opacity);
    this.safeSetOpacity(player.statusOpacity, opacity);
    
    if (playerId == 4) {
        if (this.isUser4InGame == false) {
            this.safeSetOpacity(this.player4Actions.table4Shadow, shadowOpacity);
        } else {
            this.safeSetOpacity(player.tableShadow, shadowOpacity);
        }
    } else {
        this.safeSetOpacity(player.tableShadow, shadowOpacity);
    }
};



PlayersFlowManager.prototype.update = function (dt) {
    if (!this.shadowfadeTarget &&
        !this.bckfadeTarget &&
        (!this.activeFades || this.activeFades.length === 0) &&
        !this.opacityTimerActive) {
        return;
    }

    if (this.shadowfadeTarget) {
        this.shadowfadeTime += dt;

        let t = pc.math.clamp(this.shadowfadeTime / this.shadowfadeDuration, 0, 1);

        this.shadowfadeTarget.opacity = pc.math.lerp(0, this.lightOpacity, t);

        if (t >= 1) {
            this.shadowfadeTarget = null;
        }
    }
    if (this.bckfadeTarget) {
        this.bckfadeTime += dt;

        let t = pc.math.clamp(this.bckfadeTime / this.bckfadeDuration, 0, 1);

        this.bckfadeTarget.opacity = pc.math.lerp(0, 1, t);

        if (t >= 1) {
            this.bckfadeTarget = null;
        }
    }

    for (let i = this.activeFades.length - 1; i >= 0; i--) {
        const fade = this.activeFades[i];

        if (!fade.entity || !fade.entity.element) {
            this.activeFades.splice(i, 1);
            continue;
        }

        fade.startTime += dt;
        const progress = Math.min(fade.startTime / fade.duration, 1);
        const easedProgress = fade.easing(progress);

        // FIX: kufizo opacity-n e statusHolder gjatë fade loop gjithashtu
        let currentOpacity = pc.math.lerp(fade.initialOpacity, fade.targetOpacity, easedProgress);
        if (this._isStatusHolder(fade.entity) && currentOpacity > this.STATUS_HOLDER_MAX_OPACITY) {
            currentOpacity = this.STATUS_HOLDER_MAX_OPACITY;
        }
        fade.entity.element.opacity = currentOpacity;

        if (progress >= 1) {
            fade.entity.element.opacity = fade.targetOpacity;
            fade.entity.enabled = fade.targetEnabled;

            if (fade.onComplete) {
                fade.onComplete();
            }

            this.activeFades.splice(i, 1);
        }
    }

    if (this.opacityTimerActive) {
        this.opacityTimerElapsed += dt;

        if (this.opacityTimerElapsed >= this.moveOpacityTo0Timer) {
            this.opacityTimerActive = false;
            this.opacityTimerElapsed = 0;
            this.fadeAllPlayersToZero();
        }
    }
};



PlayersFlowManager.prototype.safeGetPlayer = function (index) {
    if (!this.playersFlowManager ||
        this.playersFlowManager.length === 0 ||
        index < 0 ||
        index >= this.playersFlowManager.length) {
        return null;
    }
    return this.playersFlowManager[index];
};

PlayersFlowManager.prototype.manageOpacityOnFold = function (playerIndex, isPlayerOnFold) {
    let player = this.safeGetPlayer(playerIndex);
    if (!player) {
        console.warn("Invalid player index in manageOpacityOnFold:", playerIndex);
        return;
    }

    if (!this.foldedPlayers) this.foldedPlayers = {};

    const opacity = isPlayerOnFold ? this.opacityOnFold : this.playerOpacityNormalMode;

    if (isPlayerOnFold) {
        this.foldedPlayers[playerIndex] = true;
    } else {
        delete this.foldedPlayers[playerIndex];
    }

    this.safeSetOpacity(player.pfpOpacity, opacity);
    this.safeSetOpacity(player.bckOpacity, opacity);
    this.safeSetOpacity(player.nameOpacity, opacity);
    this.safeSetOpacity(player.profile, opacity);
    this.safeSetOpacity(player.balOpacity, opacity);
    this.safeSetOpacity(player.statusOpacity, opacity);

    if (playerIndex == 4) {

        if (this.isUser4InGame == false) {
            this.safeSetOpacity(this.player4Actions.table4Shadow, 0);
        } else {
            this.safeSetOpacity(player.tableShadow, 0);
        }
    } else {
        this.safeSetOpacity(player.tableShadow, 0);
    }
};

PlayersFlowManager.prototype._cacheOriginalBckRotations = function () {
    this.originalBckRotations = (this.playersFlowManager || []).map(player => {
        const bck = player?.bckOpacity;
        if (!bck || !bck.getLocalEulerAngles) return null;
        const euler = bck.getLocalEulerAngles();
        if (euler?.clone) return euler.clone();
        return new pc.Vec3(euler?.x || 0, euler?.y || 0, euler?.z || 0);
    });
    this.originalBckScales = (this.playersFlowManager || []).map(player => {
        const bck = player?.bckOpacity;
        if (!bck || !bck.getLocalScale) return null;
        const scale = bck.getLocalScale();
        if (scale?.clone) return scale.clone();
        return new pc.Vec3(scale?.x || 3, scale?.y || 3, scale?.z || 3);
    });
};

PlayersFlowManager.prototype._resetBckRotation = function (index = 4, resetScale = true) {
    const player = this.playersFlowManager && this.playersFlowManager[index];
    if (!player || !player.bckOpacity) return;
    const baseRot = this.originalBckRotations && this.originalBckRotations[index];
    const targetRot = baseRot
        ? (baseRot.clone ? baseRot.clone() : new pc.Vec3(baseRot.x || 0, baseRot.y || 0, baseRot.z || 0))
        : new pc.Vec3(0, 0, 0);
    if (player.bckOpacity.setLocalEulerAngles) {
        player.bckOpacity.setLocalEulerAngles(targetRot);
    }
    if (resetScale) {
        const baseScale = this.originalBckScales && this.originalBckScales[index];
        const targetScale = baseScale
            ? (baseScale.clone ? baseScale.clone() : new pc.Vec3(baseScale.x || 3, baseScale.y || 3, baseScale.z || 3))
            : new pc.Vec3(3, 3, 3);
        if (player.bckOpacity.setLocalScale) {
            player.bckOpacity.setLocalScale(targetScale);
        }
    }
};

PlayersFlowManager.prototype._updateTurnWobble = function (dt) {
    // commented out - kept for reference
};

PlayersFlowManager.prototype._clearPreviousAction = function (playerIndex, isOhamaPlayer4) {
    let player = this.playersFlowManager[playerIndex];
    const fadeOptions = {
        duration: 0.3,
        easing: this.easeOutCubic
    };

    if (isOhamaPlayer4) {
        // FIX: fshi të GJITHA aksionet aktive, jo vetëm të parin
        const ohamaActions = [
            this.player4Actions.player4Check,
            this.player4Actions.player4Bet,
            this.player4Actions.player4Fold,
            this.player4Actions.player4AllIn
        ];

        ohamaActions.forEach(actionEntity => {
            if (actionEntity && actionEntity.enabled &&
                actionEntity.element && actionEntity.element.opacity > 0) {
                this.smoothFadeEntity(actionEntity, false, fadeOptions);
            }
        });

            if (this.player4Actions.status4Holder) {
                this.smoothFadeEntity(this.player4Actions.status4Holder, true, fadeOptions);
            }
    } else {
        const actions = [
            player.playerCheck,
            player.playerBet,
            player.playerFold,
            player.playerAllIn
        ];

        actions.forEach(actionEntity => {
            if (actionEntity && actionEntity.enabled &&
                actionEntity.element && actionEntity.element.opacity > 0) {
                this.smoothFadeEntity(actionEntity, false, fadeOptions);
            }
        });

            if (player.statusHolder) {
                this.smoothFadeEntity(player.statusHolder, true, fadeOptions);
            }
  
    }
};

PlayersFlowManager.prototype.setPlayerActionCheck = function (playerIndex) {
    playerIndex = window.GameManager.serverToUiIndex(playerIndex);
    let player = this.playersFlowManager[playerIndex];
    if (!player) return;
    
    const isOhamaPlayer4 = this.isGameStateOhama && playerIndex == 4;
    const fadeOptions = {
        duration: 0.5,
        easing: this.easeOutCubic
    };

    this._clearPreviousAction(playerIndex, isOhamaPlayer4);
    
        if (isOhamaPlayer4) {
            if (this.player4Actions.player4Check) {
                this.smoothFadeEntity(this.player4Actions.player4Check, true, fadeOptions);
            }
        } else {
            if (player.playerCheck) {
                this.smoothFadeEntity(player.playerCheck, true, fadeOptions);
            }
        }
        this.app.fire('PlaySound_Check');

};

PlayersFlowManager.prototype.setPlayerActionBet = function (playerIndex) {
    playerIndex = window.GameManager.serverToUiIndex(playerIndex);
    let player = this.playersFlowManager[playerIndex];
    if (!player) return;
    // console.error("setPlayerActionBet"+playerIndex+" "+player) 
    const isOhamaPlayer4 = this.isGameStateOhama && playerIndex == 4;
    const fadeOptions = {
        duration: 0.5,
        easing: this.easeOutCubic
    };

    this._clearPreviousAction(playerIndex, isOhamaPlayer4);
    
        if (isOhamaPlayer4) {
            if (this.player4Actions.player4Bet) {
                this._setTextIfChanged(this.player4Actions.player4Bet.element, 'Bet');
                this.smoothFadeEntity(this.player4Actions.player4Bet, true, fadeOptions);
            }
        } else {
            if (player.playerBet) {
                this._setTextIfChanged(player.playerBet.element, 'Bet');
                this.smoothFadeEntity(player.playerBet, true, fadeOptions);
            }
        }

};

PlayersFlowManager.prototype.setPlayerActionCall = function (playerIndex) {
    playerIndex = window.GameManager.serverToUiIndex(playerIndex);
    let player = this.playersFlowManager[playerIndex];
    if (!player) return;
    
    const isOhamaPlayer4 = this.isGameStateOhama && playerIndex == 4;
    const fadeOptions = {
        duration: 0.5,
        easing: this.easeOutCubic
    };

    this._clearPreviousAction(playerIndex, isOhamaPlayer4);
    
        if (isOhamaPlayer4) {
            if (this.player4Actions.player4Bet) {
                this._setTextIfChanged(this.player4Actions.player4Bet.element, 'Call');
                this.smoothFadeEntity(this.player4Actions.player4Bet, true, fadeOptions);
            }
        } else {
            if (player.playerBet) {
                this._setTextIfChanged(player.playerBet.element, 'Call');
                this.smoothFadeEntity(player.playerBet, true, fadeOptions);
            }
        }

};

PlayersFlowManager.prototype.setPlayerActionRaise = function (playerIndex) {
    playerIndex = window.GameManager.serverToUiIndex(playerIndex);
    let player = this.playersFlowManager[playerIndex];
    if (!player) return;
    
    const isOhamaPlayer4 = this.isGameStateOhama && playerIndex == 4;
    const fadeOptions = {
        duration: 0.5,
        easing: this.easeOutCubic
    };

    this._clearPreviousAction(playerIndex, isOhamaPlayer4);
    
        if (isOhamaPlayer4) {
            if (this.player4Actions.player4Bet) {
                this._setTextIfChanged(this.player4Actions.player4Bet.element, 'Raise');
                this.smoothFadeEntity(this.player4Actions.player4Bet, true, fadeOptions);
            }
        } else {
            if (player.playerBet) {
                this._setTextIfChanged(player.playerBet.element, 'Raise');
                this.smoothFadeEntity(player.playerBet, true, fadeOptions);
            }
        }
   
};

PlayersFlowManager.prototype.setPlayerActionFold = function (playerIndex) {
    playerIndex = window.GameManager.serverToUiIndex(playerIndex);
    let player = this.playersFlowManager[playerIndex];
    if (!player) return;
     if (!this.allInLockedPlayers) this.allInLockedPlayers = new Set();
    
    
    this.changeStatus(playerIndex,'fold');
    const isOhamaPlayer4 = this.isGameStateOhama && playerIndex == 4;
    const fadeOptions = {
        duration: 0.5,
        easing: this.easeOutCubic
    };
    this.allInLockedPlayers.add(playerIndex);
    this._clearPreviousAction(playerIndex, isOhamaPlayer4);
    this.manageOpacityOnFold(playerIndex, true);

        if (isOhamaPlayer4) {
            if (this.player4Actions.player4Fold) {
                this.smoothFadeEntity(this.player4Actions.player4Fold, true, fadeOptions);
            }
        } else {
            if (player.playerFold) {
                this.smoothFadeEntity(player.playerFold, true, fadeOptions);
            }
        }
        this.cardAnimationOnFold(playerIndex);
        this.app.fire('PlaySound_Fold');

};

PlayersFlowManager.prototype.setPlayerActionAnte = function (playerIndex) {
    playerIndex = window.GameManager.serverToUiIndex(playerIndex);
    let player = this.playersFlowManager[playerIndex];
    if (!player) return;
    
    const isOhamaPlayer4 = this.isGameStateOhama && playerIndex == 4;
    const fadeOptions = {
        duration: 0.5,
        easing: this.easeOutCubic
    };

    this._clearPreviousAction(playerIndex, isOhamaPlayer4);
 
        if (isOhamaPlayer4) {
            if (this.player4Actions.player4Bet) {
                this._setTextIfChanged(this.player4Actions.player4Bet.element, 'ante');
                this.smoothFadeEntity(this.player4Actions.player4Bet, true, fadeOptions);
            }
        } else {
            if (player.playerBet) {
                this._setTextIfChanged(player.playerBet.element, 'ante');
                this.smoothFadeEntity(player.playerBet, true, fadeOptions);
            }
        }
    
};
PlayersFlowManager.prototype.setPlayerActionSmallBlind = function (playerIndex) {
    playerIndex = window.GameManager.serverToUiIndex(playerIndex);
    let player = this.playersFlowManager[playerIndex];
    if (!player) return;
    
    const isOhamaPlayer4 = this.isGameStateOhama && playerIndex == 4;
    const fadeOptions = {
        duration: 0.5,
        easing: this.easeOutCubic
    };

    this._clearPreviousAction(playerIndex, isOhamaPlayer4);
    
  
        if (isOhamaPlayer4) {
            if (this.player4Actions.player4Bet) {
                this._setTextIfChanged(this.player4Actions.player4Bet.element, 'S. B.');
                this.smoothFadeEntity(this.player4Actions.player4Bet, true, fadeOptions);
            }
        } else {
            if (player.playerBet) {
                this._setTextIfChanged(player.playerBet.element, 'S. B.');
                this.smoothFadeEntity(player.playerBet, true, fadeOptions);
            }
        }

};

PlayersFlowManager.prototype.setPlayerActionBigBlind = function (playerIndex) {
    playerIndex = window.GameManager.serverToUiIndex(playerIndex);
    let player = this.playersFlowManager[playerIndex];
    if (!player) return;
    
    const isOhamaPlayer4 = this.isGameStateOhama && playerIndex == 4;
    const fadeOptions = {
        duration: 0.5,
        easing: this.easeOutCubic
    };

    this._clearPreviousAction(playerIndex, isOhamaPlayer4);
    

        if (isOhamaPlayer4) {
            if (this.player4Actions.player4Bet) {
                this._setTextIfChanged(this.player4Actions.player4Bet.element, 'B. B.');
                this.smoothFadeEntity(this.player4Actions.player4Bet, true, fadeOptions);
            }
        } else {
            if (player.playerBet) {
                this._setTextIfChanged(player.playerBet.element, 'B. B.');
                this.smoothFadeEntity(player.playerBet, true, fadeOptions);
            }
        }
 
};

PlayersFlowManager.prototype.setPlayerActionAllIn = function (playerIndex) {
    playerIndex = window.GameManager.serverToUiIndex(playerIndex);
    let player = this.playersFlowManager[playerIndex];
    if (!player) return;
    if (!this.allInLockedPlayers) this.allInLockedPlayers = new Set();
    
    const isOhamaPlayer4 = this.isGameStateOhama && playerIndex == 4;
    const fadeOptions = {
        duration: 0.5,
        easing: this.easeOutCubic
    };

    this._clearPreviousAction(playerIndex, isOhamaPlayer4);
    this.allInLockedPlayers.add(playerIndex);

    const fadeInAlways = (entity) => {
        if (!entity) return;
        if (entity.element) {
            entity.enabled = true;
            entity.element.opacity = 0;
        } else {
            entity.enabled = true;
        }
        this.smoothFadeEntity(entity, true, fadeOptions);
    };

  
        if (isOhamaPlayer4) {
            fadeInAlways(this.player4Actions.status4Holder);
            fadeInAlways(this.player4Actions.player4AllIn);
        } else {
            fadeInAlways(player.statusHolder);
            fadeInAlways(player.playerAllIn);
        }
 
};
PlayersFlowManager.prototype.onPlayerLeft = function (playerIndex) {
    playerIndex = window.GameManager.serverToUiIndex(playerIndex);
    this.changeStatus(playerIndex, 'left');
};
PlayersFlowManager.prototype.setPlayerStatusSitIn = function (playerIndex) {
    playerIndex = window.GameManager.serverToUiIndex(playerIndex);
    this.changeStatus(playerIndex, 'sit_in');
};

PlayersFlowManager.prototype.setPlayerStatusSitOut = function (playerIndex) {
    playerIndex = window.GameManager.serverToUiIndex(playerIndex);
    // console.trace("QYSH U THIRR SITOUT?");
    this.changeStatus(playerIndex, 'sit_out');
};
PlayersFlowManager.prototype.setPlayerStatusWaiting = function (playerIndex) {
    playerIndex = window.GameManager.serverToUiIndex(playerIndex);
    this.changeStatus(playerIndex, 'waiting');
};
PlayersFlowManager.prototype.setPlayerStatusDisconnected = function (playerIndex) {
    playerIndex = window.GameManager.serverToUiIndex(playerIndex);
    this.changeStatus(playerIndex, 'disconnected');
};
PlayersFlowManager.prototype.setPlayerStatusConnected = function (playerIndex) {
    playerIndex = window.GameManager.serverToUiIndex(playerIndex);
    this.changeStatus(playerIndex, 'connected');
};


PlayersFlowManager.prototype.changeStatus = function (playerIndex, status) {
    const player = this.playersFlowManager[playerIndex];
    if (!player) return;
    const background = player.bckOpacity;
    const statusElement = player.statusOpacity; 
    
    const easeOutBack = (t) => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    };
    
    const easeInOutSine = (t) => {
        return -(Math.cos(Math.PI * t) - 1) / 2;
    };
    
    switch(status) {
        case 'left':
            background.element.color = new pc.Color(1, 1, 1); // White
            background.element.opacity = 0.2;
        break;
        case 'waiting':
            // let currentText = statusElement.innerText.trim().toLowerCase(); 

            // if (currentText === 'sit out') {
                
                // statusElement.element.text = ''; 
                statusElement.enabled = false;
                // background.enabled = true;
                background.element.color = new pc.Color(1, 1, 1); 
                
            // }
        break;
       case 'sit_in':
            if (background?.element) {
                // background.enabled = true;
                background.element.color = new pc.Color(1, 1, 1); // White
                
                this._addAnimation({
                    duration: 0.5,
                    data: { background },
                    update: (dt) => {
                        const anim = this.activeAnimations.find(a => a.data.background === background);
                        if (!anim) return true;
                        
                        anim.elapsed += dt;
                        const progress = Math.min(anim.elapsed / anim.duration, 1);
                        const smoothProgress = easeInOutSine(progress);
                        
                        background.element.opacity = smoothProgress * 0.3; 
                        
                        return progress >= 1;
                    }
                });
            }
            
            if (statusElement?.element) {
                this._setTextIfChanged(statusElement.element, 'SIT IN');
                statusElement.element.color = new pc.Color(0, 1, 0); 
                statusElement.enabled = true;
                
                const originalScale = statusElement.getLocalScale().clone();
                
                const duration = 3; 
                const pulseCount = 3; 
                statusElement.setLocalScale(
                    originalScale.x * 0.5,
                    originalScale.y * 0.5,
                    originalScale.z
                );
                statusElement.element.opacity = 0;
                
                this._addAnimation({
                    duration: duration + 0.5, 
                    data: { statusElement, originalScale, pulseCount, mainDuration: duration },
                    update: (dt) => {
                        const anim = this.activeAnimations.find(a => a.data.statusElement === statusElement);
                        if (!anim) return true;
                        
                        anim.elapsed += dt;
                        const elapsed = anim.elapsed;
                        const mainDuration = anim.data.mainDuration;
                        
                        if (elapsed <= mainDuration) {
                            const progress = elapsed / mainDuration;
                            
                            if (elapsed < 0.3) {
                                const popProgress = elapsed / 0.3;
                                const smoothPop = easeOutBack(popProgress);
                                
                                statusElement.setLocalScale(
                                    originalScale.x * (0.5 + 0.5 * smoothPop),
                                    originalScale.y * (0.5 + 0.5 * smoothPop),
                                    originalScale.z
                                );
                                statusElement.element.opacity = easeInOutSine(popProgress);
                                
                                if (statusElement.element.outlineColor !== undefined) {
                                    statusElement.element.outlineColor = new pc.Color(0, 0, 0);
                                }
                                if (statusElement.element.outlineThickness !== undefined) {
                                    statusElement.element.outlineThickness = 0;
                                }
                            } 
                            else {
                                const pulsePhase = (progress - 0.1) * Math.PI * 2 * pulseCount;
                                const pulseScale = 1 + 0.15 * Math.sin(pulsePhase) * Math.abs(Math.sin(pulsePhase * 0.5));
                                const pulseOpacity = 0.9 + 0.1 * Math.sin(pulsePhase * 1.5);
                                
                                statusElement.setLocalScale(
                                    originalScale.x * pulseScale,
                                    originalScale.y * pulseScale,
                                    originalScale.z
                                );
                                statusElement.element.opacity = pulseOpacity;
                                
                                if (statusElement.element.outlineThickness !== undefined) {
                                    statusElement.element.outlineThickness = 0;
                                }
                            }
                        } else {
                            const fadeOutDuration = 0.5;
                            
                            if (elapsed <= mainDuration + fadeOutDuration) {
                                const fadeProgress = (elapsed - mainDuration) / fadeOutDuration;
                                const smoothFade = 1 - easeInOutSine(fadeProgress);
                                
                                statusElement.element.opacity = smoothFade;
                                
                                statusElement.setLocalScale(
                                    originalScale.x * (1 - fadeProgress * 0.3),
                                    originalScale.y * (1 - fadeProgress * 0.3),
                                    originalScale.z
                                );
                                
                                if (statusElement.element.outlineThickness !== undefined) {
                                    statusElement.element.outlineThickness = 0;
                                }
                            } else {
                                if (statusElement.element.outlineThickness !== undefined) {
                                    statusElement.element.outlineThickness = 0;
                                }
                                statusElement.enabled = false;
                                return true;
                            }
                        }
                        return false;
                    }
                });
            }
            break;

        case 'sit_out':

            if (background?.element) {
                // background.enabled = true;
                background.element.color = new pc.Color(0, 0, 0); 
                
                this._addAnimation({
                    duration: 0.5,
                    data: { background },
                    update: (dt) => {
                        const anim = this.activeAnimations.find(a => a.data.background === background);
                        if (!anim) return true;
                        
                        anim.elapsed += dt;
                        const progress = Math.min(anim.elapsed / anim.duration, 1);
                        const smoothProgress = easeInOutSine(progress);
                        
                        background.element.opacity = smoothProgress * 0.3;
                        
                        return progress >= 1;
                    }
                });
            }
            
            if (statusElement?.element) {
                this._setTextIfChanged(statusElement.element, 'SIT OUT');
                statusElement.element.color = new pc.Color(1, 0.5, 0); 
                statusElement.enabled = true;
                
                const originalScale = statusElement.getLocalScale().clone();
                
                statusElement.setLocalScale(
                    originalScale.x * 0.8,
                    originalScale.y * 0.8,
                    originalScale.z
                );
                statusElement.element.opacity = 0;
                
                this._addAnimation({
                    duration: 0.5,
                    data: { statusElement, originalScale },
                    update: (dt) => {
                        const anim = this.activeAnimations.find(a => a.data.statusElement === statusElement);
                        if (!anim) return true;
                        
                        anim.elapsed += dt;
                        const progress = Math.min(anim.elapsed / anim.duration, 1);
                        const smoothProgress = easeInOutSine(progress);
                        
                        statusElement.setLocalScale(
                            originalScale.x * (0.8 + 0.2 * smoothProgress),
                            originalScale.y * (0.8 + 0.2 * smoothProgress),
                            originalScale.z
                        );
                        statusElement.element.opacity = smoothProgress;
                        
                        if (progress >= 1) {
                            statusElement.setLocalScale(originalScale);
                            statusElement.element.opacity = 1;
                            return true;
                        }
                        return false;
                    }
                });
            }
            break;

        case 'disconnected':

            if (background?.element) {
                // background.enabled = true;
                background.element.color = new pc.Color(0, 0, 0); 
                
                this._addAnimation({
                    duration: 0.5,
                    data: { background },
                    update: (dt) => {
                        const anim = this.activeAnimations.find(a => a.data.background === background);
                        if (!anim) return true;
                        
                        anim.elapsed += dt;
                        const progress = Math.min(anim.elapsed / anim.duration, 1);
                        const smoothProgress = easeInOutSine(progress);
                        
                        background.element.opacity = smoothProgress * 0.3;
                        
                        return progress >= 1;
                    }
                });
            }
            
            if (statusElement?.element) {
                this._setTextIfChanged(statusElement.element, 'disconnected');
                statusElement.element.color = new  pc.Color(1, 0, 0); 
                statusElement.enabled = true;
                
                const originalScale = statusElement.getLocalScale().clone();
                
                statusElement.setLocalScale(
                    originalScale.x * 0.8,
                    originalScale.y * 0.8,
                    originalScale.z
                );
                statusElement.element.opacity = 0;
                
                this._addAnimation({
                    duration: 0.5,
                    data: { statusElement, originalScale },
                    update: (dt) => {
                        const anim = this.activeAnimations.find(a => a.data.statusElement === statusElement);
                        if (!anim) return true;
                        
                        anim.elapsed += dt;
                        const progress = Math.min(anim.elapsed / anim.duration, 1);
                        const smoothProgress = easeInOutSine(progress);
                        
                        statusElement.setLocalScale(
                            originalScale.x * (0.8 + 0.2 * smoothProgress),
                            originalScale.y * (0.8 + 0.2 * smoothProgress),
                            originalScale.z
                        );
                        statusElement.element.opacity = smoothProgress;
                        
                        if (progress >= 1) {
                            statusElement.setLocalScale(originalScale);
                            statusElement.element.opacity = 1;
                            return true;
                        }
                        return false;
                    }
                });
            }
            break;

        case 'connected':
                if (background?.element) {
                    // background.enabled = true;
                    background.element.color = new pc.Color(1, 1, 1); // White
                    
                    this._addAnimation({
                        duration: 0.5,
                        data: { background },
                        update: (dt) => {
                            const anim = this.activeAnimations.find(a => a.data.background === background);
                            if (!anim) return true;
                            
                            anim.elapsed += dt;
                            const progress = Math.min(anim.elapsed / anim.duration, 1);
                            const smoothProgress = easeInOutSine(progress);
                            
                            background.element.opacity = smoothProgress * 0.3; 
                            
                            return progress >= 1;
                        }
                    });
                }
                
                if (statusElement?.element) {
                    this._setTextIfChanged(statusElement.element, 'connected');
                    statusElement.element.color = new pc.Color(0, 1, 0); 
                    statusElement.enabled = true;
                    
                    const originalScale = statusElement.getLocalScale().clone();
                    
                    const duration = 3; 
                    const pulseCount = 3; 
                    statusElement.setLocalScale(
                        originalScale.x * 0.5,
                        originalScale.y * 0.5,
                        originalScale.z
                    );
                    statusElement.element.opacity = 0;
                    
                    this._addAnimation({
                        duration: duration + 0.5, 
                        data: { statusElement, originalScale, pulseCount, mainDuration: duration },
                        update: (dt) => {
                            const anim = this.activeAnimations.find(a => a.data.statusElement === statusElement);
                            if (!anim) return true;
                            
                            anim.elapsed += dt;
                            const elapsed = anim.elapsed;
                            const mainDuration = anim.data.mainDuration;
                            
                            if (elapsed <= mainDuration) {
                                const progress = elapsed / mainDuration;
                                
                                if (elapsed < 0.3) {
                                    const popProgress = elapsed / 0.3;
                                    const smoothPop = easeOutBack(popProgress);
                                    
                                    statusElement.setLocalScale(
                                        originalScale.x * (0.5 + 0.5 * smoothPop),
                                        originalScale.y * (0.5 + 0.5 * smoothPop),
                                        originalScale.z
                                    );
                                    statusElement.element.opacity = easeInOutSine(popProgress);
                                    
                                    if (statusElement.element.outlineColor !== undefined) {
                                        statusElement.element.outlineColor = new pc.Color(0, 0, 0);
                                    }
                                    if (statusElement.element.outlineThickness !== undefined) {
                                        statusElement.element.outlineThickness = 0;
                                    }
                                } 
                                else {
                                    const pulsePhase = (progress - 0.1) * Math.PI * 2 * pulseCount;
                                    const pulseScale = 1 + 0.15 * Math.sin(pulsePhase) * Math.abs(Math.sin(pulsePhase * 0.5));
                                    const pulseOpacity = 0.9 + 0.1 * Math.sin(pulsePhase * 1.5);
                                    
                                    statusElement.setLocalScale(
                                        originalScale.x * pulseScale,
                                        originalScale.y * pulseScale,
                                        originalScale.z
                                    );
                                    statusElement.element.opacity = pulseOpacity;
                                    
                                    if (statusElement.element.outlineThickness !== undefined) {
                                        statusElement.element.outlineThickness = 0;
                                    }
                                }
                            } else {
                                const fadeOutDuration = 0.5;
                                
                                if (elapsed <= mainDuration + fadeOutDuration) {
                                    const fadeProgress = (elapsed - mainDuration) / fadeOutDuration;
                                    const smoothFade = 1 - easeInOutSine(fadeProgress);
                                    
                                    statusElement.element.opacity = smoothFade;
                                    
                                    statusElement.setLocalScale(
                                        originalScale.x * (1 - fadeProgress * 0.3),
                                        originalScale.y * (1 - fadeProgress * 0.3),
                                        originalScale.z
                                    );
                                    
                                    if (statusElement.element.outlineThickness !== undefined) {
                                        statusElement.element.outlineThickness = 0;
                                    }
                                } else {
                                    if (statusElement.element.outlineThickness !== undefined) {
                                        statusElement.element.outlineThickness = 0;
                                    }
                                    statusElement.enabled = false;
                                    return true;
                                }
                            }
                            return false;
                        }
                    });
                }
                break;
    }
};

PlayersFlowManager.prototype._forceCollectEntity = function (entity) {
    if (!entity) return;

    this.cancelFade(entity);

    for (let i = this.activeAnimations.length - 1; i >= 0; i--) {
        const anim = this.activeAnimations[i];
        if (anim && anim.data && (
            anim.data.statusElement === entity ||
            anim.data.background === entity ||
            anim.data.element === (entity.element ? entity.element : null)
        )) {
            this.activeAnimations.splice(i, 1);
        }
    }

    if (!entity.element) {
        entity.enabled = false;
        return;
    }

    if (!entity.enabled) return;

    const startOpacity = entity.element.opacity;
    if (startOpacity <= 0) {
        entity.enabled = false;
        return;
    }

    const fadeOptions = {
        duration: 0.25,
        startOpacity: startOpacity,
        endOpacity: 0,
        easing: this.easeOutCubic
    };
    this.smoothFadeEntity(entity, false, fadeOptions);
};

PlayersFlowManager.prototype.collectSpecificAllin = function (playerIndex) {
    
    playerIndex = window.GameManager.serverToUiIndex(playerIndex);

    if (playerIndex === undefined || playerIndex === null) return;
    if (!this.allInLockedPlayers || !this.allInLockedPlayers.has(playerIndex)) return;

    const player = this.safeGetPlayer(playerIndex);
    if (player) {
        this._forceCollectEntity(player.statusHolder);
        this._forceCollectEntity(player.playerAllIn);
        this._forceCollectEntity(player.playerFold);
    }

    if (this.isGameStateOhama && playerIndex === 4 && this.player4Actions) {
        this._forceCollectEntity(this.player4Actions.status4Holder);
        this._forceCollectEntity(this.player4Actions.player4AllIn);
    }

    this.allInLockedPlayers.delete(playerIndex);
};

PlayersFlowManager.prototype.collectAllAllin = function () {
    if (!this.allInLockedPlayers || !this.allInLockedPlayers.size) return;

    this.allInLockedPlayers.forEach((index) => {
        const player = this.safeGetPlayer(index);
        if (player) {
            this._forceCollectEntity(player.statusHolder);
            this._forceCollectEntity(player.playerAllIn);
            this._forceCollectEntity(player.playerFold);
        }

        if (this.isGameStateOhama && index === 4 && this.player4Actions) {
            this._forceCollectEntity(this.player4Actions.status4Holder);
            this._forceCollectEntity(this.player4Actions.player4AllIn);
        }
    });

    this.allInLockedPlayers.clear();
};

PlayersFlowManager.prototype.collectActoins = function () {

    for (let i = 0; i < this.playersFlowManager.length; i++) {
        let player = this.playersFlowManager[i];
        if (!player) continue;
        if (this.allInLockedPlayers && this.allInLockedPlayers.has(i)) continue;


        if (player.statusHolder && player.statusHolder.enabled &&
            player.statusHolder.element && player.statusHolder.element.opacity > 0) {
            this.smoothFadeEntity(player.statusHolder, false, {
                duration: 0.3,
                easing: this.easeOutCubic
            });
        }
    }


    for (let i = 0; i < this.playersFlowManager.length; i++) {
        let player = this.playersFlowManager[i];
        if (!player) continue;
        if (this.allInLockedPlayers && this.allInLockedPlayers.has(i)) continue;

        const actions = [player.playerCheck, player.playerBet, player.playerFold];

        actions.forEach((action, index) => {
            if (!action) return;


            if (!action.enabled || !action.element || action.element.opacity <= 0) {
                return;
            }

            const wasEnabled = action.enabled;

            setTimeout(() => {
                this.smoothFadeEntity(action, false, {
                    duration: 0.4,
                    easing: this.easeInOutSine,
                    onComplete: () => {
                        if (action && action.element && wasEnabled) {
                            action.element.opacity = 1;
                        }
                    }
                });
            }, index * 50);
        });
    }

    if (this.isGameStateOhama && this.player4Actions) {
        const ohamaActions = [
            this.player4Actions.player4Check,
            this.player4Actions.player4Bet,
            this.player4Actions.player4Fold
        ];

        ohamaActions.forEach((action, index) => {
            if (!action) return;

            if (!action.enabled || !action.element || action.element.opacity <= 0) {
                return;
            }

            const wasEnabled = action.enabled;

            setTimeout(() => {
                this.smoothFadeEntity(action, false, {
                    duration: 0.4,
                    easing: this.easeInOutSine,
                    onComplete: () => {
                        if (action && action.element && wasEnabled) {
                            action.element.opacity = 1;
                        }
                    }
                });
            }, index * 50);
        });
    }
};
PlayersFlowManager.prototype.cardAnimationOnFold = function (playerIndex) {
    this.app.fire("CardsManager:cardsAnimationOnFold", playerIndex);
};

PlayersFlowManager.prototype.resetScript = function () {
    
    this.activeFades = [];
    if (this.allInLockedPlayers) {
        this.allInLockedPlayers.clear();
    }
    if (this.gameWonUser) {
        this.gameWonUser.clear();
    }
    this.call_TurnWobble = false;

    this.stopOpacityTimer();

    this.fadeTime = 0;
    this.shadowfadeTarget = null;
    this.shadowfadeTime = 0;
    this.bckfadeTarget = null;
    this.bckfadeTime = 0;

    if (this.foldedPlayers) {
        this.foldedPlayers = {};
    }

    if (this.collectingActions && this.collectingActions.length > 0) {
        this.collectingActions.forEach(item => {
            if (item.entity) {
                item.entity.enabled = false;
            }
        });
        this.collectingActions = [];
    }

    if (!this.playersFlowManager || this.playersFlowManager.length === 0) {
        console.warn("playersFlowManager array is empty!");
        return;
    }

    for (let i = 0; i < this.playersFlowManager.length; i++) {
        let player = this.playersFlowManager[i];
        if (!player) continue;

        if (player.profile && player.profile.element) {
            player.profile.element.opacity = 1;
        }
        if (player.bckOpacity && player.bckOpacity.element) {
            player.bckOpacity.element.opacity = 0.2;
        }
        if (player.nameOpacity && player.nameOpacity.element) {
            player.nameOpacity.element.opacity = 1;
        }
        if (player.statusOpacity && player.statusOpacity.element) {
            player.statusOpacity.element.opacity = 1;
        }
        if (player.balOpacity && player.balOpacity.element) {
            player.balOpacity.element.opacity = 1;
        }
        player.nameOpacity.element.useInput = true;
        if (player.tableShadow && player.tableShadow.element) {
            player.tableShadow.element.opacity = 0;
        }
        if (this.isUser4InGame == false) {
            this.player4Actions.table4Shadow.element.opacity = 0;
        }

        if (player.statusHolder && player.statusHolder.opacity != 0 && player.statusHolder.enabled == true) {
            this.smoothFadeEntity(player.statusHolder, false, { duration: 0 });
        }
        if (player.playerCheck && player.playerCheck.opacity != 0 && player.playerCheck.enabled == true) {
            this.smoothFadeEntity(player.playerCheck, false, { duration: 0 });
        }
        if (player.playerBet && player.playerBet.opacity != 0 && player.playerBet.enabled == true) {
            this.smoothFadeEntity(player.playerBet, false, { duration: 0 });
        }
        if (player.playerFold && player.playerFold.opacity != 0 && player.playerFold.enabled == true) {
            this.smoothFadeEntity(player.playerFold, false, { duration: 0 });
        }
        if (player.playerAllIn && player.playerAllIn.opacity != 0 && player.playerAllIn.enabled == true) {
            this.smoothFadeEntity(player.playerAllIn, false, { duration: 0 });
        }
        if (player.frameGameWin) {
            player.frameGameWin.enabled = false;
        }

        if (player.sitIn && player.sitIn.element) {
            player.sitIn.element.opacity = this.shouldUserUiEnabled;
                    player.iconToSitInwhenus4INgame.element.opacity= this.shouldUserUiEnabled;
                    player.iconToSitInwhenus4NOTINgame.element.opacity= this.shouldUserUiEnabled;
        }

    }

    if (this.player4Actions) {
        if (this.player4Actions.status4Holder && this.player4Actions.status4Holder.opacity != 0 && this.player4Actions.status4Holder.enabled == true) {
            this.smoothFadeEntity(this.player4Actions.status4Holder, false, { duration: 0 });
        }
        if (this.player4Actions.player4Check && this.player4Actions.player4Check.opacity != 0 && this.player4Actions.player4Check.enabled == true) {
            this.smoothFadeEntity(this.player4Actions.player4Check, false, { duration: 0 });
        }
        if (this.player4Actions.player4Bet && this.player4Actions.player4Bet.opacity != 0 && this.player4Actions.player4Bet.enabled == true) {
            this.smoothFadeEntity(this.player4Actions.player4Bet, false, { duration: 0 });
        }
        if (this.player4Actions.player4Fold && this.player4Actions.player4Fold.opacity != 0 && this.player4Actions.player4Fold.enabled == true) {
            this.smoothFadeEntity(this.player4Actions.player4Fold, false, { duration: 0 });
        }
        if (this.player4Actions.player4AllIn && this.player4Actions.player4AllIn.opacity != 0 && this.player4Actions.player4AllIn.enabled == true) {
            this.smoothFadeEntity(this.player4Actions.player4AllIn, false, { duration: 0 });
        }
    }

    this.app.fire('PlayerFlowManager:Activate circle', -1);
};
PlayersFlowManager.prototype.onDestroy = function () {
   
    this.activeFades = [];

    this.shadowfadeTarget = null;
    this.bckfadeTarget = null;
    this.foldedPlayers = {};

    this.app.off('GameManager:gameState:Ohama:Poker', this.defineIsGameIsOhamaOrPoker, this);
    // this.app.off('GameManager_UiManager:enable_disable_UIUsers', this.userUiState, this);
    this.app.off('GameManager_PlayerFlow:playerTurn', this.setPlayerTurn, this);
    this.app.off('GameManager_PlayerFlow:playerAction', this.setPlayerAction, this);
    this.app.off('GameManager_PlayerFlow:CollectActions', this.collectActoins, this);
    this.app.off('GameManager:disablePlayerBet', this.disableAllActions, this);
    this.app.off('GameManager_State:game_won:CardUserReward', this.gameWon, this);
    this.app.off('ManageOpacity:Fold', this.manageOpacityOnFold, this);
    this.app.off('PlayersFlowManager:StartOpacityTimer', this.startOpacityTimer, this);
    this.app.off('PlayersFlowManager:StopOpacityTimer', this.stopOpacityTimer, this);
    this.app.off('PlayersFlowManager:fadeAllPlayersToZero', this.fadeAllPlayersToZero, this);
    this.app.off('GameManager_RESTARTSCRIPT', this.resetScript, this);
    
    if (this.activeAnimations) {
        this.activeAnimations = [];
    }
    
    if (this.hasUpdateListener) {
        this.app.off('update', this.singleUpdateHandler);
        this.hasUpdateListener = false;
    }
    
    if (this.cachedVec3Pool) {
        this.cachedVec3Pool = [];
    }
};
