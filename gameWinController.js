var GameWinController = pc.createScript('gameWinController');

GameWinController.attributes.add('playersPopUp', {
    type: 'json',
    array: true,
    schema: [
        { name: 'pupUp', type: 'entity' },
        { name: 'backgorundFrame', type: 'entity' },
        { name: 'parentPokerPosHolder', type: 'entity' },
        { name: 'parentOhamaPosHolder', type: 'entity' },
        { name: 'hand_rank', type: 'entity' },
        { name: 'hand_desc', type: 'entity' },
        { name: 'card1Poker', type: 'entity' },
        { name: 'card2Poker', type: 'entity' },
        { name: 'card1Ohama', type: 'entity' },
        { name: 'card2Ohama', type: 'entity' },
        { name: 'card3Ohama', type: 'entity' },
        { name: 'card4Ohama', type: 'entity' },
        { name: 'card5Ohama', type: 'entity', title: 'Card 5 Ohama (optional)' },
        { name: 'showcard1Poker', type: 'entity' },
        { name: 'showcard2Poker', type: 'entity' },
        { name: 'showcard1Ohama', type: 'entity' },
        { name: 'showcard2Ohama', type: 'entity' },
        { name: 'showcard3Ohama', type: 'entity' },
        { name: 'showcard4Ohama', type: 'entity' }
    ],
    title: 'Players Pop Up'
});

GameWinController.attributes.add('pokerCards', {
    type: 'json',
    title: 'Poker Cards by Suit (Template Assets)',
    schema: [
        { name: 'hearts', type: 'asset', assetType: 'template', array: true, title: 'Hearts Cards' },
        { name: 'diamonds', type: 'asset', assetType: 'template', array: true, title: 'Diamonds Cards' },
        { name: 'clubs', type: 'asset', assetType: 'template', array: true, title: 'Clubs Cards' },
        { name: 'spades', type: 'asset', assetType: 'template', array: true, title: 'Spades Cards' }
    ]
});

GameWinController.prototype.initialize = function () {
    this.defaultWidth = 68.83;
    this.defaultHeight = 27.96;
    this.defaultPPU = 20;
    this.defaultParentCardsPos = -2.115;
    this.backGroundFrameDefaultWidth = 80;
    this.backGroundFrameDefaultHeight = 39;
    this.backGroundFrameDefaultPPU = 16.76;

    this.targetWidth_Poker = 68.83;
    this.targetHeight = 46.66;
    this.targetPPU_Poker = 20;

    this.backGroundFrameTargetWidth_Poker = 78.723;
    this.backGroundFrameTargetHeight = 56.3;
    this.backGroundFrameTargetPPU_Poker = 16.76;

    this.targetarentCardsPos = 4.787;
    this.duration = 0.6;

    this._savedShowDownCards = {};

    // PERF: use app update — no setInterval overhead
    this._activeAnims = [];
    this._tickFn = (dt) => { if (this._activeAnims.length > 0) this._tickAnims(dt); };
    this.app.on('update', this._tickFn);

    this.app.on('GameManager_State:game_won:CardUserReward', this.showCardsForWinner, this);
    this.app.on('GameManager_State:showDownCardsArray', this.showDownCardsArray, this);
    this.app.on('GameManager_RESTARTSCRIPT', this.resetScript, this);
};

GameWinController.prototype._addAnim = function (fn) {
    this._activeAnims.push(fn);
    return fn;
};

GameWinController.prototype._removeAnim = function (fn) {
    const idx = this._activeAnims.indexOf(fn);
    if (idx !== -1) this._activeAnims.splice(idx, 1);
};

GameWinController.prototype._tickAnims = function (dt) {
    // PERF: iterate backwards so removals don't skip items; no .slice() alloc
    for (let i = this._activeAnims.length - 1; i >= 0; i--) {
        if (this._activeAnims[i]) this._activeAnims[i](dt);
    }
};

GameWinController.prototype.fadeOpacitySmoothly = function (entity, targetOpacity, duration, callback) {
    if (!entity || !entity.element) return;
    const element = entity.element;
    entity.enabled = true;
    element.opacity = 0;
    let elapsed = 0;

    const update = (dt) => {
        elapsed += dt;
        const t = Math.min(elapsed / duration, 1);
        element.opacity = pc.math.lerp(0, targetOpacity, t);
        if (t >= 1) {
            this._removeAnim(update);
            if (callback) callback();
        }
    };
    this._addAnim(update);
};

GameWinController.prototype.scalePopupSmoothly = function (popupEntity, targetW, targetH, targetPPU_Poker, duration, callback) {
    if (!popupEntity || !popupEntity.element) return;
    const element = popupEntity.element;
    const startW = element.width;
    const startH = element.height;
    const startPPU = element.pixelsPerUnit || this.defaultPPU;
    let elapsed = 0;

    const update = (dt) => {
        elapsed += dt;
        const t = Math.min(elapsed / duration, 1);
        element.width = pc.math.lerp(startW, targetW, t);
        element.height = pc.math.lerp(startH, targetH, t);
        element.pixelsPerUnit = pc.math.lerp(startPPU, targetPPU_Poker, t);
        if (t >= 1) {
            this._removeAnim(update);
            if (callback) callback();
        }
    };
    this._addAnim(update);
};

GameWinController.prototype.userUiWinnerFrameWithNoCard = function (userWinIndex) {
    const playerPop = this.playersPopUp[userWinIndex];
    if (!playerPop) return;

    if (playerPop.backgorundFrame) {
        playerPop.backgorundFrame.enabled = true;
        playerPop.backgorundFrame.element.width = this.backGroundFrameDefaultWidth;
        playerPop.backgorundFrame.element.height = this.backGroundFrameDefaultHeight;
        playerPop.backgorundFrame.element.pixelsPerUnit = this.backGroundFrameDefaultPPU;
    }
};

GameWinController.prototype.userUiWinnerFrameOnShowDown = function (userWinIndex) {
    const playerPop = this.playersPopUp[userWinIndex];
    if (!playerPop || !playerPop.pupUp) return;

    if (playerPop.backgorundFrame) {
        playerPop.backgorundFrame.enabled = true;
        if (playerPop.backgorundFrame.element) {
            playerPop.backgorundFrame.element.opacity = 0;
            const fadeDuration = 0.4;
            let elapsed = 0;
            const fadeInBg = (dt) => {
                elapsed += dt;
                const t = Math.min(elapsed / fadeDuration, 1);
                playerPop.backgorundFrame.element.opacity = pc.math.lerp(0, 1, t);
                if (t >= 1) {
                    this._removeAnim(fadeInBg);
                }
            };
            this._addAnim(fadeInBg);
        }
    }

    if (playerPop.parentPokerPosHolder) {
        const pos = playerPop.parentPokerPosHolder.getLocalPosition();
        playerPop.parentPokerPosHolder.setLocalPosition(pos.x, this.targetarentCardsPos, pos.z);
    }
    if (playerPop.parentOhamaPosHolder) {
        const pos = playerPop.parentOhamaPosHolder.getLocalPosition();
        playerPop.parentOhamaPosHolder.setLocalPosition(pos.x, this.targetarentCardsPos, pos.z);
    }

    this.scalePopupSmoothly(playerPop.pupUp, this.targetWidth_Poker, this.targetHeight, this.targetPPU_Poker, this.duration);
    this.scalePopupSmoothly(playerPop.backgorundFrame, this.backGroundFrameTargetWidth_Poker, this.backGroundFrameTargetHeight, this.backGroundFrameTargetPPU_Poker, this.duration);
};

GameWinController.prototype.parseCardString = function (cardStr) {
    if (!cardStr || cardStr.length < 2) return null;

    const rankChar = cardStr.slice(0, -1);
    const suitChar = cardStr.slice(-1).toLowerCase();

    const suitMap = { 's': 'spades', 'h': 'hearts', 'd': 'diamonds', 'c': 'clubs' };
    const rankMap = {
        'A': 0, 'a': 0,
        '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7, '9': 8,
        '10': 9, 'T': 9, 't': 9,
        'J': 10, 'j': 10,
        'Q': 11, 'q': 11,
        'K': 12, 'k': 12
    };

    const suit = suitMap[suitChar];
    const rank = rankMap[rankChar];

    if (!suit || rank === undefined) return null;
    return { suit, rank };
};

GameWinController.prototype.showDownCardsArray = function (winnerIndex, playerCards) {
    winnerIndex = window.GameManager.serverToUiIndex(winnerIndex);
    if (!this._savedShowDownCards) this._savedShowDownCards = {};
    this._savedShowDownCards[winnerIndex] = playerCards;
};

GameWinController.prototype.showCardsForWinner = function (winnerIndex, amount,new_balance, hand_rank, hand_desc) {
    winnerIndex = window.GameManager.serverToUiIndex(winnerIndex);

    if (!this._winnersShown) this._winnersShown = new Set();
    this._winnersShown.add(winnerIndex);

    const playerPop = this.playersPopUp[winnerIndex];
    if (!playerPop) return;

    if (hand_rank) {
        playerPop.hand_rank.enabled = true;
        playerPop.hand_rank.element.text = hand_rank.toString();
        this.fadeOpacitySmoothly(playerPop.hand_rank, 1, this.duration);
    }
    if (hand_desc) {
        playerPop.hand_desc.enabled = true;
        playerPop.hand_desc.element.text = hand_desc.toString();
        this.fadeOpacitySmoothly(playerPop.hand_desc, 1, this.duration);
    }

    this.app.fire('CardsManager:cardsAnimationOnGameWin', winnerIndex);
    this.app.fire('PolishManager:EnableWinnerUi', winnerIndex, amount, new_balance);

    if (!this._savedShowDownCards || !this._savedShowDownCards[winnerIndex]) {
        this.userUiWinnerFrameWithNoCard(winnerIndex);
    } else {
        const playerCards = this._savedShowDownCards[winnerIndex];
        this.userUiWinnerFrameOnShowDown(winnerIndex);
        if (!playerPop.pupUp) return;

        const cardsPerPlayer = playerCards.length;
        let cardParents = [];
        if (cardsPerPlayer === 1) {
            cardParents = [playerPop.card1Poker];
        } else if (cardsPerPlayer === 2) {
            cardParents = [playerPop.card1Poker, playerPop.card2Poker];
        } else if (cardsPerPlayer > 2) {
            cardParents = [playerPop.card1Ohama, playerPop.card2Ohama, playerPop.card3Ohama, playerPop.card4Ohama];
        } else {
            return;
        }

        for (let i = 0; i < cardsPerPlayer; i++) {
            const cardString = playerCards[i];
            if (!cardString) continue;
            const parsed = this.parseCardString(cardString);
            if (!parsed) continue;
            const parentEntity = cardParents[i];
            if (!parentEntity) continue;
            setTimeout(() => {
                this.setCard(parsed.rank, parsed.suit, parentEntity);
            }, 300 * i);
        }
    }
};

GameWinController.prototype.onShowCardArrayReceived = function (userThatCardsGonnaShow, cardsArray) {
    if (userThatCardsGonnaShow === undefined || !cardsArray || !Array.isArray(cardsArray)) return;
    if (!this.playersPopUp || this.playersPopUp.length === 0) return;
    if (userThatCardsGonnaShow >= this.playersPopUp.length) return;

    const playerPop = this.playersPopUp[userThatCardsGonnaShow];
    if (!playerPop || !playerPop.pupUp) return;

    const numCards = cardsArray.length;
    let cardPositions = [];

    this.app.fire('CardsManager:cardsAnimationOnGameWin', userThatCardsGonnaShow);

    if (numCards <= 2) {
        cardPositions = [
            { entity: playerPop.showcard1Poker, index: 0 },
            { entity: playerPop.showcard2Poker, index: 1 }
        ];
    } else {
        cardPositions = [
            { entity: playerPop.showcard1Ohama, index: 0 },
            { entity: playerPop.showcard2Ohama, index: 1 },
            { entity: playerPop.showcard3Ohama, index: 2 },
            { entity: playerPop.showcard4Ohama, index: 3 }
        ];
    }

    this.clearShowCards(playerPop);

    for (let i = 0; i < numCards; i++) {
        const cardString = cardsArray[i];
        const position = cardPositions[i];
        if (!position || !position.entity) continue;
        const parsed = this.parseCardString(cardString);
        if (!parsed) continue;
        setTimeout(() => {
            this.createShowCard(parsed.rank, parsed.suit, position.entity, i);
        }, i * 100);
    }
};

GameWinController.prototype.createShowCard = function (rank, suit, parentEntity, index) {
    const suitArray = this.pokerCards[suit];
    if (!suitArray || !Array.isArray(suitArray)) return;

    const templateAsset = suitArray[rank];
    if (!templateAsset || !templateAsset.resource) return;

    const card = templateAsset.resource.instantiate();
    card.enabled = true;
    card.name = `ShowCard_${suit}_${rank}_${index}`;
    parentEntity.addChild(card);
    card.setLocalPosition(0, 0, 0);
    card.setLocalScale(0.01, 0.01, 0.01);

    const duration = 0.6;
    let elapsed = 0;

    const update = (dt) => {
        elapsed += dt;
        let t = Math.min(elapsed / duration, 1);
        t = t * t * (3 - 2 * t);
        const scale = pc.math.lerp(0.01, 20, t);
        card.setLocalScale(scale, scale, scale);
        const rotationY = Math.sin(t * Math.PI) * 10 * (1 - t);
        if (!this._scratchQuat) this._scratchQuat = new pc.Quat();
        this._scratchQuat.setFromEulerAngles(0, rotationY, 0);
        card.setLocalRotation(this._scratchQuat);
        if (t >= 1) this._removeAnim(update);
    };
    this._addAnim(update);
};

GameWinController.prototype.setCard = function (rank, suit, parentEntity) {
    const suitArray = this.pokerCards[suit];
    if (!suitArray || !Array.isArray(suitArray)) return;

    const templateAsset = suitArray[rank];
    if (!templateAsset || !templateAsset.resource) return;

    const card = templateAsset.resource.instantiate();
    card.enabled = true;
    card.name = `Card_${suit}_${rank}`;
    parentEntity.addChild(card);
    card.setLocalPosition(0, 0, 0);
    card.setLocalScale(0.01, 0.01, 0.01);
    card.setLocalRotation(new pc.Quat().setFromEulerAngles(0, 180, 0));

    const duration = 0.5;
    let elapsed = 0;

    const update = (dt) => {
        elapsed += dt;
        let t = Math.min(elapsed / duration, 1);
        t = t * t * (3 - 2 * t);
        const yRot = pc.math.lerp(180, 0, t);
        if (!this._scratchQuat) this._scratchQuat = new pc.Quat();
        this._scratchQuat.setFromEulerAngles(0, yRot, 0);
        card.setLocalRotation(this._scratchQuat);
        const scale = pc.math.lerp(0.01, 25, t);
        card.setLocalScale(scale, scale, scale);
        if (t >= 1) this._removeAnim(update);
    };
    this._addAnim(update);
};

GameWinController.prototype.clearShowCards = function (playerPop) {
    const clearCardEntities = (entity) => {
        if (entity && entity.children && entity.children.length > 0) {
            entity.children.forEach((child) => {
                if (child.name && child.name.startsWith('ShowCard_')) child.destroy();
            });
        }
    };

    if (playerPop.showcard1Poker) clearCardEntities(playerPop.showcard1Poker);
    if (playerPop.showcard2Poker) clearCardEntities(playerPop.showcard2Poker);
    if (playerPop.showcard1Ohama) clearCardEntities(playerPop.showcard1Ohama);
    if (playerPop.showcard2Ohama) clearCardEntities(playerPop.showcard2Ohama);
    if (playerPop.showcard3Ohama) clearCardEntities(playerPop.showcard3Ohama);
    if (playerPop.showcard4Ohama) clearCardEntities(playerPop.showcard4Ohama);
};
GameWinController.prototype.resetScript = function () {
    // Kill every in-flight animation immediately — no partial states
    this._activeAnims = [];

    if (this._savedShowDownCards) this._savedShowDownCards = {};
    if (this._winnersShown) this._winnersShown = new Set();

    const cleanupChildren = (entity, prefix) => {
        if (!entity || !entity.children || entity.children.length === 0) return;
        const children = [...entity.children];
        children.forEach(child => {
            if (child.name && child.name.startsWith(prefix)) child.destroy();
        });
    };

    this.playersPopUp.forEach((playerPop) => {
        if (!playerPop) return;

        // Hide hand rank/desc instantly — no fade, just off
        if (playerPop.hand_rank && playerPop.hand_rank.element) {
            playerPop.hand_rank.element.opacity = 0;
            playerPop.hand_rank.enabled = false;
        }
        if (playerPop.hand_desc && playerPop.hand_desc.element) {
            playerPop.hand_desc.element.opacity = 0;
            playerPop.hand_desc.enabled = false;
        }

        // Destroy all show/win cards instantly
        cleanupChildren(playerPop.showcard1Poker, 'ShowCard_');
        cleanupChildren(playerPop.showcard2Poker, 'ShowCard_');
        cleanupChildren(playerPop.showcard1Ohama, 'ShowCard_');
        cleanupChildren(playerPop.showcard2Ohama, 'ShowCard_');
        cleanupChildren(playerPop.showcard3Ohama, 'ShowCard_');
        cleanupChildren(playerPop.showcard4Ohama, 'ShowCard_');

        cleanupChildren(playerPop.card1Poker,  'Card_');
        cleanupChildren(playerPop.card2Poker,  'Card_');
        cleanupChildren(playerPop.card1Ohama,  'Card_');
        cleanupChildren(playerPop.card2Ohama,  'Card_');
        cleanupChildren(playerPop.card3Ohama,  'Card_');
        cleanupChildren(playerPop.card4Ohama,  'Card_');
        cleanupChildren(playerPop.card5Ohama,  'Card_');

        // Reset card holder positions instantly
        if (playerPop.parentPokerPosHolder) {
            const pos = playerPop.parentPokerPosHolder.getLocalPosition();
            playerPop.parentPokerPosHolder.setLocalPosition(pos.x, this.defaultParentCardsPos, pos.z);
        }
        if (playerPop.parentOhamaPosHolder) {
            const pos = playerPop.parentOhamaPosHolder.getLocalPosition();
            playerPop.parentOhamaPosHolder.setLocalPosition(pos.x, this.defaultParentCardsPos, pos.z);
        }

        // Reset popup size instantly — no smooth scale
        if (playerPop.pupUp && playerPop.pupUp.element) {
            playerPop.pupUp.element.width        = this.defaultWidth;
            playerPop.pupUp.element.height       = this.defaultHeight;
            playerPop.pupUp.element.pixelsPerUnit = this.defaultPPU;
        }

        // Reset background frame instantly
        if (playerPop.backgorundFrame && playerPop.backgorundFrame.element) {
            playerPop.backgorundFrame.element.width        = this.backGroundFrameDefaultWidth;
            playerPop.backgorundFrame.element.height       = this.backGroundFrameDefaultHeight;
            playerPop.backgorundFrame.element.pixelsPerUnit = this.backGroundFrameDefaultPPU;
            playerPop.backgorundFrame.element.opacity      = 0;
            playerPop.backgorundFrame.enabled              = false;
        }
    });
};