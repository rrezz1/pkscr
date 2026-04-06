var CardsManager = pc.createScript('cardsManager');

    CardsManager.attributes.add('defaultCard', {type: 'entity', title: 'Default Card'});
    CardsManager.attributes.add('cardsHolder', {type: 'entity', title: 'Cards Holder'});
    CardsManager.attributes.add('clonedCardsDefaultPosition', {type: 'entity'});
    CardsManager.attributes.add('positionThatCardsGoOnFold', {type: 'entity'});

    CardsManager.attributes.add('pokerTemplateCards', {
        type: 'json',
        title: 'Poker Template Cards by Suit',
        schema: [
            {name: 'hearts', type: 'asset', assetType: 'template', array: true, title: 'Hearts Cards'},
            {name: 'diamonds', type: 'asset', assetType: 'template', array: true, title: 'Diamonds Cards'},
            {name: 'clubs', type: 'asset', assetType: 'template', array: true, title: 'Clubs Cards'},
            {name: 'spades', type: 'asset', assetType: 'template', array: true, title: 'Spades Cards'}
        ]
    });

    CardsManager.attributes.add('cardsPosition', {
        type: 'json',
        array: true,
        schema: [
            {name: 'card1', type: 'entity', title: 'Card 1'},
            {name: 'card2', type: 'entity', title: 'Card 2'},
            {name: 'card3', type: 'entity', title: 'Card 3'},
            {name: 'card4', type: 'entity', title: 'Card 4'}
        ]
    });

    CardsManager.attributes.add('card_1_pl_4_inactive', {type: 'entity'});
    CardsManager.attributes.add('card_2_pl_4_inactive', {type: 'entity'});
    CardsManager.attributes.add('card_3_pl_4_inactive', {type: 'entity'});
    CardsManager.attributes.add('card_4_pl_4_inactive', {type: 'entity'});

    CardsManager.attributes.add('tablePositions', {type: 'entity', array: true, title: 'Table Positions'});

    CardsManager.attributes.add('point0', {type: 'entity'});
    CardsManager.attributes.add('point1', {type: 'entity'});
    CardsManager.attributes.add('point2', {type: 'entity'});
    CardsManager.attributes.add('point3', {type: 'entity'});

    CardsManager.prototype.initialize = function () {
        this._isOhama = false;
        this._mainPlayerHasCards = false; // true kur payload.cards vjen me karta reale
        this.tableCards = [];

        this.firstCards = new Array(9);
        this.secondCards = new Array(9);
        this.thirdCards = new Array(9);
        this.fourthCards = new Array(9);

        for (let i = 0; i < 9; i++) {
            this.firstCards[i] = null;
            this.secondCards[i] = null;
            this.thirdCards[i] = null;
            this.fourthCards[i] = null;
        }

        this.lerpSpeed = 12;
        this.currentMovingIndex = 0;
        this.isMoving = false;
        this.isCardsStillProcesing = false;
        this.cardsCloned = false;
        this.cardReplacedCount = 0;
        this.totalHoleCardsExpected = 0;
        this._pendingHoleCardRotate = false;

        this.dealQueue = [];
        this.isProcessingDeal = false;

        this.moveUpDistanceTabCards = 0.2;
        this.moveUpDuration = 0.2;
        this.rotateDuration = 0.4;
        this.moveDownDuration = 0.2;
        this.moveToPointDuration = 0.5;

        this.durationWhenTableCardFinishedAndNeedToRotate = 0.5;
        this.durationForCardToMoveFromPosToTarg = 0.5;

        this.currentPhase = 'idle';
        this.phaseStarted = false;

        // PERF: use app update instead of a manual 16ms interval
        this._updateFn = (dt) => {
            if (this.isMoving) {
                this.manualUpdate(dt);
            }
        };
        this.app.on('update', this._updateFn);

        this.initializeEventsManager();
    };

    //----------
    // nes jena spectator  kthen -1
    CardsManager.prototype._getMainPlayerSlot = function () {
       return 4;
    };

    CardsManager.prototype.initializeEventsManager = function () {
        this.app.on('GameManager:updatePlayersInfo', this.onPlayersInfoReceived, this);
        this.app.on('GameManager:updateSpecificPlayerInfo:player_seated', this.onPlayerSeated, this);
        this.app.on('GameManager:updateSpecificPlayerInfo:player_left', this.onPlayerLeft, this);

        this.app.on("GameManager:playerStatus:sitin",this.onPlayerSitIn ,this);
        this.app.on("GameManager:playerStatus:sitout",this.onPlayerSitOut ,this);

        this.app.on('GameManager:gameState:Ohama:Poker', this._noOp, this);
        this.app.on('GameManager:defineIsMainUserPlaying', this._noOp, this);
        this.app.on('GameManager:defineGameSpeedMode', this.defineGameSpeedMode, this);
        this.app.on('GameManager_Pharse:moveFirstCards', this.startCardMovement, this);

        this.app.on('CardsManager:DealHoleCards', this.queueHoleCardDeal, this);
        this.app.on('CardsManager:DealCommunityCards', this.queueCommunityCardDeal, this);
        this.app.on('CardsManager:DealHoleCards_withoutAnimation', this.instantHoleCardDeal, this);
        this.app.on('CardsManager:DealCommunityCards_withoutAnimaton', this.instantCommunityCardDeal, this);

        this.app.on("GameManager:replaceCard", this.onReplaceCard, this);
        this.app.on('GameManager_Rotate:PlayerCards', this.rotatePlayerCards, this);
        this.app.on('GameManager_Pharse:First3TableCards', this.rotateFirst3TableCards, this);
        this.app.on('GameManager_Pharse:LastPenultimateTableCards', this.rotatePenultimateTableCards, this);
        this.app.on('GameManager_Pharse:LastTableCards', this.rotateLastTableCards, this);
        this.app.on('CardsManager:cardsAnimationOnGameWin', this.cardsAnimationOnGameWin, this);
        this.app.on("CardsManager:cardsAnimationOnFold", this.cardsAnimationOnFold, this);
        this.app.on("CardsManager:cardsAnimationOnLeft", this.cardsAnimationOnLeft, this);
        this.app.on('GameManager_State:game_won:collectAllCards', this.gameState_GameWON_collectCards, this);
        this.app.on('GameManager_RESTARTSCRIPT', this.resetScript, this);
        this.app.on('CardsManager:TeleportCardsToNewPositions', this.teleportCardsToNewPositions, this);
    };
CardsManager.prototype.teleportCardsToNewPositions = function (oldMap, newMap) {
    var mainSlot = this._getMainPlayerSlot();

    var oldFirst  = this.firstCards.slice();
    var oldSecond = this.secondCards.slice();
    var oldThird  = this.thirdCards.slice();
    var oldFourth = this.fourthCards.slice();

    var newFirst  = new Array(9).fill(null);
    var newSecond = new Array(9).fill(null);
    var newThird  = new Array(9).fill(null);
    var newFourth = new Array(9).fill(null);

    // main slot
    newFirst[mainSlot]  = oldFirst[mainSlot];
    newSecond[mainSlot] = oldSecond[mainSlot];
    newThird[mainSlot]  = oldThird[mainSlot];
    newFourth[mainSlot] = oldFourth[mainSlot];

    var activeSeats = window.GameManager.getSeatPosition(window.GameManager.seatsArray);

    for (var serverPos = 0; serverPos < activeSeats.length; serverPos++) {
        var oldUiSlot = oldMap[serverPos]; // ku ishte 
        var newUiSlot = newMap[serverPos]; // ku duhet me kan

        if (oldUiSlot === undefined || newUiSlot === undefined) continue;
        if (newUiSlot === mainSlot) continue; // osht mir

        var cardArrays = [
            { old: oldFirst,  new: newFirst,  num: 1 },
            { old: oldSecond, new: newSecond, num: 2 },
            { old: oldThird,  new: newThird,  num: 3 },
            { old: oldFourth, new: newFourth, num: 4 }
        ];

        for (var j = 0; j < cardArrays.length; j++) {
            var cardData = cardArrays[j].old[oldUiSlot]; // merr nga slot-i i vjetër UI
            if (!cardData || !cardData.entity) continue;

            // teleport 
            var newPos = this.getCardTargetPosition(newUiSlot, cardArrays[j].num, false);
            var newRot = this.getCardTargetRotation(newUiSlot, cardArrays[j].num, false);

            cardData.entity.setLocalPosition(newPos);
            cardData.entity.setLocalRotation(newRot);
            cardData.targetPos = newPos;
            cardData.targetRot = newRot;

            cardArrays[j].new[newUiSlot] = cardData; // sloti ri
        }
    }

    this.firstCards  = newFirst;
    this.secondCards = newSecond;
    this.thirdCards  = newThird;
    this.fourthCards = newFourth;

};
CardsManager.prototype.instantHoleCardDeal = function (payload) {
    var cardCount = payload.count || 0;
    if (cardCount !== 2 && cardCount !== 4) return;

    this._isOhama = (cardCount === 4);
    var rawCards = (payload.cards && payload.cards.length > 0) ? payload.cards : null;
    this._mainPlayerHasCards = (rawCards !== null);

    this._handGeneration = (this._handGeneration || 0) + 1;

    var _prevArrays = [this.firstCards, this.secondCards, this.thirdCards, this.fourthCards];
    for (var _ai = 0; _ai < _prevArrays.length; _ai++) {
        var _arr = _prevArrays[_ai];
        if (!_arr) continue;
        for (var _ci = 0; _ci < _arr.length; _ci++) {
            if (_arr[_ci] && _arr[_ci].entity) { _arr[_ci].entity.destroy(); _arr[_ci] = null; }
        }
    }
    this.cardsCloned = false;
    this.isCardsStillProcesing = false;

    var mainSlot = this._getMainPlayerSlot();
    var activeSeats = window.GameManager.getSeatPosition(window.GameManager.seatsArray);

    //i krijon kartat qetu
    for (var si = 0; si < activeSeats.length; si++) {
        var physicalSlot = activeSeats[si];
        var playerInfo = this.playersInfo ? this.playersInfo[physicalSlot] : null;
        if (!this.isValidPlayer(playerInfo)) continue;
        var isMainPlayer = (physicalSlot === mainSlot);
        var isMainPlayerInactive = isMainPlayer && !this._mainPlayerHasCards;
        this.createPlayerCardPair(physicalSlot, isMainPlayer, isMainPlayerInactive);
        if (cardCount === 4) this.createAdditionalOmahaCards(physicalSlot, isMainPlayer, isMainPlayerInactive);
    }
    //kartat e main pl
    if (rawCards) {
        for (var ci = 0; ci < rawCards.length; ci++) {
            var cardStr = rawCards[ci];
            var parsed = (cardStr && cardStr !== '') ? this.parseCardString(cardStr) : null;
            if (parsed) this.replaceCard(mainSlot, ci + 1, parsed.suit, parsed.rank);
        }
    }

    // pa animacion i bon setup
    var faceUpMap = new Map(); // entity -> { pos, euler }
    if (this._mainPlayerHasCards) {
        var ptMapping;
        if (this._isOhama) {
            ptMapping = [
                { arr: this.firstCards,  point: this.point0 },
                { arr: this.secondCards, point: this.point1 },
                { arr: this.thirdCards,  point: this.point2 },
                { arr: this.fourthCards, point: this.point3 }
            ];
        } else {
            ptMapping = [
                { arr: this.firstCards,  point: this.point1 },
                { arr: this.secondCards, point: this.point2 }
            ];
        }
        for (var pi = 0; pi < ptMapping.length; pi++) {
            var pm = ptMapping[pi];
            if (!pm.point) continue;
            var cd = pm.arr[mainSlot];
            if (!cd || !cd.entity) continue;
            var ptE = pm.point.getLocalEulerAngles();
            faceUpMap.set(cd.entity, {
                pos:   pm.point.getLocalPosition().clone(),
                euler: new pc.Vec3(ptE.x, ptE.y, ptE.z - 180)
            });
        }
    }
    //snap lartat
    var cardArrays = [this.firstCards, this.secondCards, this.thirdCards, this.fourthCards];
    for (var si2 = 0; si2 < activeSeats.length; si2++) {
        var slot = activeSeats[si2];
        for (var cai = 0; cai < cardArrays.length; cai++) {
            var cardData = cardArrays[cai][slot];
            if (!cardData || !cardData.entity) continue;
            var faceUp = faceUpMap.get(cardData.entity);
            if (faceUp) {
                cardData.entity.setLocalPosition(faceUp.pos);
                cardData.entity.setLocalEulerAngles(faceUp.euler.x, faceUp.euler.y, faceUp.euler.z);
            } else {
                cardData.entity.setLocalPosition(cardData.targetPos);
                cardData.entity.setLocalRotation(cardData.targetRot);
            }
            cardData.entity.setLocalScale(cardData.originalScale);
            cardData._hasStartedMoving = true;
        }
    }

    this.cardsCloned = true;
    this.isCardsStillProcesing = false;
};

CardsManager.prototype.instantCommunityCardDeal = function (cards) {
    if (!cards || !Array.isArray(cards) || cards.length === 0) return;

    for (var i = 0; i < cards.length && i < 5; i++) {
        var parsed = this.parseCardString(cards[i]);
        if (!parsed) continue;

        if (!this.tableCards[i] || !this.tableCards[i].entity) this.cloneTableCards(i);

        this.replaceCard(0, i + 1, parsed.suit, parsed.rank);

        var cardData = this.tableCards[i];
        if (cardData && cardData.entity) {
            cardData.entity.setLocalPosition(cardData.targetPos);
            cardData.entity.setLocalRotation(cardData.targetRot);
            cardData.entity.setLocalScale(cardData.originalScale);
            var euler = cardData.entity.getLocalEulerAngles();
            cardData.entity.setLocalEulerAngles(euler.x, euler.y, euler.z - 180);
        }
    }
};

CardsManager.prototype.queueHoleCardDeal = function (payload) {
        let cardCount = payload.count || 0;

        if (cardCount !== 2 && cardCount !== 4) {
            return;
        }

        this._handGeneration = (this._handGeneration || 0) + 1;

        this._isOhama = (cardCount === 4);

        var rawCards = (payload.cards && payload.cards.length > 0) ? payload.cards : null;//length vjen mashum se 0 gjith amo tu be sure
        this._mainPlayerHasCards = (rawCards !== null);

        var cardSlots = [];
        if (rawCards) {
            for (var i = 0; i < rawCards.length; i++) {
                var cardStr = rawCards[i];
                var parsed = (cardStr !== '') ? this.parseCardString(cardStr) : null;
                cardSlots.push({
                    cardIndex: i + 1,
                    suit: parsed ? parsed.suit : null,
                    rank: parsed ? parsed.rank : null,
                    hasData: parsed !== null
                });
            }
        }

        this.dealQueue = [];
        this.isProcessingDeal = false;
        this.isMoving = false;
        this.currentPhase = 'idle';
        this._pendingHoleCardRotate = false;

        this.dealQueue.push({
            type: 'holeCardBatch',
            cards: cardSlots,       // faceDouwn
            totalCount: cardCount
        });

        this.processNextDeal();
    };

    CardsManager.prototype.queueCommunityCardDeal = function (cards) {
        if (!cards || !Array.isArray(cards)) {
            return;
        }
        var startPosition = 0;
        for (var tableCardIndex = 0; tableCardIndex < 5; tableCardIndex++) {
            if (this.tableCards[tableCardIndex] && this.tableCards[tableCardIndex].entity) {
                startPosition = tableCardIndex + 1;
            }
        }

        for (var q = 0; q < this.dealQueue.length; q++) {
            if (this.dealQueue[q].type === 'communityCard') {
                startPosition = Math.max(startPosition, this.dealQueue[q].data.position + 1);
            }
        }
        if (startPosition >= 5) {
            return;
        }

        var self = this;
        cards.forEach(function (cardStr, index) {
            var tablePos = startPosition + index;
            if (tablePos >= 5) return;

            var parsed = self.parseCardString(cardStr);
            if (!parsed) return;

            self.dealQueue.push({
                type: 'communityCard',
                data: {
                    position: tablePos,
                    suit: parsed.suit,
                    rank: parsed.rank
                }
            });
        });

        this.processNextDeal();
    };

    CardsManager.prototype.parseCardString = function (cardStr) {
        if (!cardStr || cardStr.length < 2) return null;

        const rankChar = cardStr.slice(0, -1);
        const suitChar = cardStr.slice(-1).toLowerCase();

        const suitMap = {'s': 'spades', 'h': 'hearts', 'd': 'diamonds', 'c': 'clubs'};
        const rankMap = {
            'A': 0, 'a': 0,
            '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7, '9': 8,
            '10': 9, 'T': 9, 't': 9,
            'J': 10, 'j': 10,
            'Q': 11, 'q': 11,
            'K': 12, 'k': 12
        };

        const suit = suitMap[suitChar];
        const rank = rankMap[rankChar.toUpperCase()];

        if (!suit || rank === undefined) return null;

        return {suit, rank};
    };

    // rul lojtart qysh jan prej back
    CardsManager.prototype.onPlayersInfoReceived = function (playersInfo) {
        this.playersInfo = {};
        this.playersInfo.length = 0;

        for (let i = 0; i < playersInfo.length; i++) {
            const p = playersInfo[i];
            if (p == null || p.position === undefined) continue;

            var physicalSlot = window.GameManager.serverToUiIndex(p.position);
            if (physicalSlot === undefined || physicalSlot === -1) continue;

            this.playersInfo[physicalSlot] = {
                is_empty: p.is_empty,
                position: physicalSlot
            };

            if (physicalSlot >= this.playersInfo.length) {
                this.playersInfo.length = physicalSlot + 1;
            }
        }
    };

    CardsManager.prototype.onPlayerLeft = function (position) {
        var physicalSlot = window.GameManager.serverToUiIndex(position);
        if (physicalSlot === undefined || physicalSlot === -1) return;

        if (this.playersInfo && this.playersInfo[physicalSlot]) {
            this.playersInfo[physicalSlot].is_empty = true;
        }
    };

    CardsManager.prototype.onPlayerSeated = function (position) {
        var physicalSlot = window.GameManager.serverToUiIndex(position);
        if (physicalSlot === undefined || physicalSlot === -1) return;

        if (this.playersInfo && this.playersInfo[physicalSlot]) {
            this.playersInfo[physicalSlot].is_empty = false;
        }
    };

    CardsManager.prototype.onPlayerSitIn = function (position) {
        var physicalSlot = window.GameManager.serverToUiIndex(position);
        if (physicalSlot === undefined || physicalSlot === -1) return;

        if (this.playersInfo && this.playersInfo[physicalSlot]) {
            this.playersInfo[physicalSlot].is_empty = false;
        }
    };
    CardsManager.prototype.onPlayerSitOut = function (position) {
        var physicalSlot = window.GameManager.serverToUiIndex(position);
        if (physicalSlot === undefined || physicalSlot === -1) return;

        if (this.playersInfo && this.playersInfo[physicalSlot]) {
            this.playersInfo[physicalSlot].is_empty = true;
        }
    };

// CARDS ──────────────────────────────────────────────────────────

    CardsManager.prototype.cloneAllCards = function (count) {
        if (this.cardsCloned == true) return;
        if (this.isCardsStillProcesing) return;
        this.isCardsStillProcesing = true;

        var mainSlot = this._getMainPlayerSlot();
        var activeSeats = window.GameManager.getSeatPosition(window.GameManager.seatsArray);

        for (let i = 0; i < activeSeats.length; i++) {
            var physicalSlot = activeSeats[i];
            var playerInfo = this.playersInfo[physicalSlot];

            if (!this.isValidPlayer(playerInfo)) continue;

            if (physicalSlot === mainSlot) continue;

            this.createPlayerCards(physicalSlot, count);
        }

        this.cardsCloned = true;
    };

    CardsManager.prototype.cloneTableCards = function (index) {
        if (index < 0 || index > 4) return;

        if (!this.tableCards) {
            this.tableCards = new Array(5).fill(null);
        }

        if (this.tableCards[index] && this.tableCards[index].entity) {
            this.tableCards[index].entity.destroy();
        }

        let card = this.defaultCard.clone();
        card.name = `Card_Table_${index + 1}`;
        this.cardsHolder.addChild(card);
        card.setLocalPosition(this.clonedCardsDefaultPosition.getLocalPosition());
        card.enabled = true;

        let originalScale = card.getLocalScale().clone();
        card.setLocalScale(0, 0, 0);

        let targetPos = this.tablePositions[index]?.getLocalPosition().clone() || new pc.Vec3(index * 2, 0, 0);
        let targetRot = this.tablePositions[index]?.getLocalRotation().clone() || new pc.Quat();

        const cardData = {
            entity: card,
            targetPos: targetPos,
            targetRot: targetRot,
            originalScale: originalScale,
            index: index
        };

        this.tableCards[index] = cardData;
    };

    CardsManager.prototype.isValidPlayer = function (playerInfo) {
        return playerInfo && playerInfo.is_empty == false;
    };

// ─── PROCESS HOLE CARD ──────────────────────────────────────────────────
    CardsManager.prototype.processNextDeal = function () {
        if (this.isProcessingDeal || this.isMoving) {
            return;
        }

        if (this.dealQueue.length === 0) {
            return;
        }

        const deal = this.dealQueue.shift();
        this.isProcessingDeal = true;

        if (deal.type === 'holeCardBatch') {
            this.processHoleCardBatch(deal.cards, deal.totalCount);
        } else if (deal.type === 'communityCard') {
            this.processCommunityCardDeal(deal.data);
        }
    };

    CardsManager.prototype.processHoleCardBatch = function (cards, totalCount) {
        var mainSlot = this._getMainPlayerSlot();

        this.cloneAllCards(totalCount);

        this.currentPhase = 'playerCards';

        if (mainSlot >= 0) {
            this.createAllHoleCardSlots(mainSlot, totalCount);
        }

        var self = this;
        setTimeout(function () {
            
            if (mainSlot >= 0 && self._mainPlayerHasCards) {
                for (var i = 0; i < cards.length; i++) {
                    var card = cards[i];
                    if (card.hasData) {
                        self.replaceCard(mainSlot, card.cardIndex, card.suit, card.rank);
                    }
                }
            }

            var activePlayers = self.getActivePlayerIndices();
            self.currentPlayerIndex = (activePlayers.length > 0) ? activePlayers[0] : 0;
            self.isMoving = true;
            self.phaseStarted = false;
            
            self._pendingHoleCardRotate = self._mainPlayerHasCards;
        }, 100);
    };

    CardsManager.prototype.processCommunityCardDeal = function (communityCardData) {
        if (!communityCardData) {
            this.isProcessingDeal = false;
            this.processNextDeal();
            return;
        }

        const cardIndex = communityCardData.position;

        if (cardIndex < 0 || cardIndex > 4) {
            this.isProcessingDeal = false;
            this.processNextDeal();
            return;
        }

        this.currentPhase = 'tableCard';

        if (!this.tableCards[cardIndex]) {
            this.cloneTableCards(cardIndex);

            setTimeout(() => {
                this._doCommunityCardReplace(cardIndex, communityCardData);
            }, 50);
        } else {
            this._doCommunityCardReplace(cardIndex, communityCardData);
        }
    };

    CardsManager.prototype._doCommunityCardReplace = function (cardIndex, communityCardData) {
        this.replaceCard(0, cardIndex + 1, communityCardData.suit, communityCardData.rank);

        this.currentPhase = 'rotateCard';
        this.currentMovingIndex = 0;
        this.isMoving = true;
        this.currentTableCardIndex = cardIndex;
        this.phaseStarted = false;

        this.rotateTableCard(cardIndex);

        this.waitForRotationComplete(() => {
            this.isProcessingDeal = false;
            setTimeout(() => {
                this.processNextDeal();
            }, 100);
        });
    };

    CardsManager.prototype.waitForMovementComplete = function (callback) {
        const checkInterval = setInterval(() => {
            if (!this.isMoving && this.currentPhase === 'idle') {
                clearInterval(checkInterval);
                if (callback) callback();
            }
        }, 50);

        setTimeout(() => {
            clearInterval(checkInterval);
            if (callback) callback();
        }, 2000);
    };

    CardsManager.prototype.waitForRotationComplete = function (callback) {
        const checkInterval = setInterval(() => {
            if (!this.isMoving) {
                clearInterval(checkInterval);
                if (callback) callback();
            }
        }, 50);

        setTimeout(() => {
            clearInterval(checkInterval);
            if (callback) callback();
        }, 5000);
    };

    CardsManager.prototype._noOp = function () {};

    CardsManager.prototype.defineGameSpeedMode = function (speedMode) {
        switch (speedMode) {
            case 101:
            case 103:
                this.lerpSpeed = 12;
                this.moveUpDistanceTabCards = 0.2;
                this.moveUpDuration = 0.2;
                this.rotateDuration = 0.4;
                this.moveDownDuration = 0.2;
                this.moveToPointDuration = 0.5;
                this.durationWhenTableCardFinishedAndNeedToRotate = 0.5;
                this.durationForCardToMoveFromPosToTarg = 0.5;
                break;

            case 102:
                this.lerpSpeed = 25;
                this.moveUpDistanceTabCards = 0.2;
                this.moveUpDuration = 0.1;
                this.rotateDuration = 0.2;
                this.moveDownDuration = 0.1;
                this.moveToPointDuration = 0.3;
                this.durationWhenTableCardFinishedAndNeedToRotate = 0;
                this.durationForCardToMoveFromPosToTarg = 0.3;
                break;
        }
    };

    CardsManager.prototype.startCardMovement = function () {
        this.currentPhase = 'playerCards';
        this.currentPlayerIndex = 0;
        this.isMoving = true;
        this.phaseStarted = false;
    };

    CardsManager.prototype.onReplaceCard = function (playerIndex, cardIndex, suit, rank) {
        this.replaceCard(playerIndex, cardIndex, suit, rank);
    };

// CARDS ────────────────────────────────────────────────────────

    CardsManager.prototype.createAllHoleCardSlots = function (playerIndex, totalCount) {
        var mainSlot = this._getMainPlayerSlot();
        var isMainPlayer = (playerIndex === mainSlot);
        var isMainPlayerInactive = isMainPlayer && !this._mainPlayerHasCards;

        this.createPlayerCardPair(playerIndex, isMainPlayer, isMainPlayerInactive);

        if (totalCount === 4) {
            this.createAdditionalOmahaCards(playerIndex, isMainPlayer, isMainPlayerInactive);
        }
    };

    CardsManager.prototype.createSpecificPlayerCards = function (playerIndex, cardIndex, suit, rank) {
        var mainSlot = this._getMainPlayerSlot();
        var isMainPlayer = (playerIndex === mainSlot);
        var isMainPlayerInactive = isMainPlayer && !this._mainPlayerHasCards;

        this.createPlayerCardPair(playerIndex, isMainPlayer, isMainPlayerInactive);

        if (this._isOhama) {
            this.createAdditionalOmahaCards(playerIndex, isMainPlayer, isMainPlayerInactive);
        }

        this.replaceCard(playerIndex, cardIndex, suit, rank);
    };

    CardsManager.prototype.createPlayerCards = function (playerIndex, count) {
        this.createPlayerCardPair(playerIndex, false, false);

        if (count == 4) {
            this.createAdditionalOmahaCards(playerIndex, false, false);
        }
    };

    CardsManager.prototype.createPlayerCardPair = function (playerIndex, isMainPlayer, isMainPlayerInactive) {
        const card1 = this.createCard(`Card_Player_${playerIndex}_1`);
        const scale1 = this.getCardScale(isMainPlayer, this._mainPlayerHasCards);

        this.firstCards[playerIndex] = this.createCardData(
            card1,
            this.getCardTargetPosition(playerIndex, 1, isMainPlayerInactive),
            this.getCardTargetRotation(playerIndex, 1, isMainPlayerInactive),
            scale1
        );

        const card2 = this.createCard(`Card_Player_${playerIndex}_2`);
        const scale2 = this.getCardScale(isMainPlayer, this._mainPlayerHasCards);

        this.secondCards[playerIndex] = this.createCardData(
            card2,
            this.getCardTargetPosition(playerIndex, 2, isMainPlayerInactive),
            this.getCardTargetRotation(playerIndex, 2, isMainPlayerInactive),
            scale2
        );
    };

    CardsManager.prototype.createAdditionalOmahaCards = function (playerIndex, isMainPlayer, isMainPlayerInactive) {
        const card3 = this.createCard(`Card_Player_${playerIndex}_3`);
        const scale3 = this.getCardScale(isMainPlayer, this._mainPlayerHasCards);

        this.thirdCards[playerIndex] = this.createCardData(
            card3,
            this.getCardTargetPosition(playerIndex, 3, isMainPlayerInactive),
            this.getCardTargetRotation(playerIndex, 3, isMainPlayerInactive),
            scale3
        );

        const card4 = this.createCard(`Card_Player_${playerIndex}_4`);
        const scale4 = this.getCardScale(isMainPlayer, this._mainPlayerHasCards);

        this.fourthCards[playerIndex] = this.createCardData(
            card4,
            this.getCardTargetPosition(playerIndex, 4, isMainPlayerInactive),
            this.getCardTargetRotation(playerIndex, 4, isMainPlayerInactive),
            scale4
        );
    };

    CardsManager.prototype.createCard = function (name) {
        const card = this.defaultCard.clone();
        card.name = name;
        this.cardsHolder.addChild(card);
        card.setLocalPosition(this.clonedCardsDefaultPosition.getLocalPosition());
        card.enabled = true;
        card.setLocalScale(0, 0, 0);
        return card;
    };

    CardsManager.prototype.createCardData = function (entity, targetPos, targetRot, originalScale) {
        return {
            entity: entity,
            targetPos: targetPos,
            targetRot: targetRot,
            originalScale: originalScale
        };
    };

    CardsManager.prototype.getCardScale = function (isMainPlayer, isMainPlayerActive) {
        return (isMainPlayer && isMainPlayerActive) ?
            new pc.Vec3(3.2, 3.2, 3.2) :
            new pc.Vec3(1.5, 1.5, 1.5);
    };

    CardsManager.prototype.getCardTargetPosition = function (playerIndex, cardNumber, isMainPlayerInactive) {
        if (isMainPlayerInactive) {
            const inactiveMap = {
                1: this.card_1_pl_4_inactive,
                2: this.card_2_pl_4_inactive,
                3: this.card_3_pl_4_inactive,
                4: this.card_4_pl_4_inactive
            };
            const targetEntity = inactiveMap[cardNumber];
            return targetEntity ? targetEntity.getLocalPosition().clone() : new pc.Vec3(playerIndex * 2, 0, 0);
        }

        if (this._isOhama) {
            return this.getOmahaCardPosition(playerIndex, cardNumber);
        } else {
            return this.getTexasHoldemCardPosition(playerIndex, cardNumber);
        }
    };

    CardsManager.prototype.getCardTargetRotation = function (playerIndex, cardNumber, isMainPlayerInactive) {
        if (isMainPlayerInactive) {
            const inactiveMap = {
                1: this.card_1_pl_4_inactive,
                2: this.card_2_pl_4_inactive,
                3: this.card_3_pl_4_inactive,
                4: this.card_4_pl_4_inactive
            };
            const targetEntity = inactiveMap[cardNumber];
            return targetEntity ? targetEntity.getLocalRotation().clone() : new pc.Quat();
        }

        if (this._isOhama) {
            return this.getOmahaCardRotation(playerIndex, cardNumber);
        } else {
            return this.getTexasHoldemCardRotation(playerIndex, cardNumber);
        }
    };
    CardsManager.prototype.getOmahaCardPosition = function (playerIndex, cardNumber) {
        const positionMap = {
            1: this.cardsPosition[playerIndex]?.card1,
            2: this.cardsPosition[playerIndex]?.card2,
            3: this.cardsPosition[playerIndex]?.card3,
            4: this.cardsPosition[playerIndex]?.card4
        };

        const targetEntity = positionMap[cardNumber];
        return targetEntity?.getLocalPosition().clone() || new pc.Vec3(playerIndex * 2, 0, 0);
    };

    CardsManager.prototype.getTexasHoldemCardPosition = function (playerIndex, cardNumber) {
        var mainSlot = this._getMainPlayerSlot();

        if (playerIndex === mainSlot) {
            const positionMap = {
                1: this.cardsPosition[playerIndex]?.card2,
                2: this.cardsPosition[playerIndex]?.card3
            };
            const targetEntity = positionMap[cardNumber];
            return targetEntity?.getLocalPosition().clone() || new pc.Vec3(playerIndex * 2, 0, 0);
        }

        const positionMap = {
            1: this.cardsPosition[playerIndex]?.card2,
            2: this.cardsPosition[playerIndex]?.card3
        };
        const targetEntity = positionMap[cardNumber];
        return targetEntity?.getLocalPosition().clone() || new pc.Vec3(playerIndex * 2 + (cardNumber === 2 ? 0.5 : 0), 0, 0);
    };

    // CardsManager.prototype.getCardTargetRotation = function (playerIndex, cardNumber, isMainPlayerInactive) {
    //     if (isMainPlayerInactive) {
    //         const inactiveCard = this[`card_${cardNumber}_pl_4_inactive`];
    //         return inactiveCard?.getLocalRotation().clone() || new pc.Quat();
    //     }

    //     if (this._isOhama) {
    //         return this.getOmahaCardRotation(playerIndex, cardNumber);
    //     } else {
    //         return this.getTexasHoldemCardRotation(playerIndex, cardNumber);
    //     }
    // };

    CardsManager.prototype.getOmahaCardRotation = function (playerIndex, cardNumber) {
        const rotationMap = {
            1: this.cardsPosition[playerIndex]?.card1,
            2: this.cardsPosition[playerIndex]?.card2,
            3: this.cardsPosition[playerIndex]?.card3,
            4: this.cardsPosition[playerIndex]?.card4
        };

        const targetEntity = rotationMap[cardNumber];
        return targetEntity?.getLocalRotation().clone() || new pc.Quat();
    };

    CardsManager.prototype.getTexasHoldemCardRotation = function (playerIndex, cardNumber) {
        var mainSlot = this._getMainPlayerSlot();

        if (playerIndex === mainSlot) {
            const rotationMap = {
                1: this.cardsPosition[playerIndex]?.card2,
                2: this.cardsPosition[playerIndex]?.card3
            };
            const targetEntity = rotationMap[cardNumber];
            return targetEntity?.getLocalRotation().clone() || new pc.Quat();
        }

        const rotationMap = {
            1: this.cardsPosition[playerIndex]?.card2,
            2: this.cardsPosition[playerIndex]?.card3
        };
        const targetEntity = rotationMap[cardNumber];
        return targetEntity?.getLocalRotation().clone() || new pc.Quat();
    };

// ─── ROTATE CARDS ─────────────────────────────────────────────────────────────
    CardsManager.prototype.rotateCards180Z = function (cardEntities) {
        if (!cardEntities || cardEntities.length === 0) return;

        var mainSlot = this._getMainPlayerSlot();
        const moveUpDistance = 0.2;
        const totalDuration = 1.0;
        const startTime = Date.now();

        const updateAllCards = (dt) => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / totalDuration, 1);
            const t = progress * progress * (3 - 2 * progress);

            for (let i = 0; i < cardEntities.length; i++) {
                const card = cardEntities[i];
                if (!card) continue;

                const startPos = card._rotateStartPos || card.getLocalPosition().clone();
                const startRot = card._rotateStartRot || card.getLocalEulerAngles().clone();

                let targetPos = startPos.clone();
                let targetRot = startRot.clone();

                // perdor mainSlot ven hardcoded 4
                if (this._isOhama == false) {
                    if (card === this.firstCards[mainSlot]?.entity && this.point1) {
                        targetPos = this.point1.getLocalPosition().clone();
                        targetRot = this.point1.getLocalEulerAngles().clone();
                    } else if (card === this.secondCards[mainSlot]?.entity && this.point2) {
                        targetPos = this.point2.getLocalPosition().clone();
                        targetRot = this.point2.getLocalEulerAngles().clone();
                    }
                } else {
                    if (card === this.firstCards[mainSlot]?.entity && this.point0) {
                        targetPos = this.point0.getLocalPosition().clone();
                        targetRot = this.point0.getLocalEulerAngles().clone();
                    } else if (card === this.secondCards[mainSlot]?.entity && this.point1) {
                        targetPos = this.point1.getLocalPosition().clone();
                        targetRot = this.point1.getLocalEulerAngles().clone();
                    } else if (card === this.thirdCards[mainSlot]?.entity && this.point2) {
                        targetPos = this.point2.getLocalPosition().clone();
                        targetRot = this.point2.getLocalEulerAngles().clone();
                    } else if (card === this.fourthCards[mainSlot]?.entity && this.point3) {
                        targetPos = this.point3.getLocalPosition().clone();
                        targetRot = this.point3.getLocalEulerAngles().clone();
                    }
                }

                if (!card._rotateStartPos) {
                    card._rotateStartPos = startPos;
                    card._rotateStartRot = startRot;
                    card._rotateTargetPos = targetPos;
                    card._rotateTargetRot = targetRot;
                    card._rotateEndRot = new pc.Vec3(targetRot.x, targetRot.y, startRot.z - 180);
                }

                const upPos = card._rotateTargetPos.clone();
                upPos.y += moveUpDistance;

                if (progress < 0.5) {
                    const phaseT = t * 2;
                    const heightT = phaseT < 0.5 ? phaseT * 2 : 1;
                    const rotateT = Math.max(0, (phaseT - 0.5) * 2);

                    card.setLocalPosition(
                        pc.math.lerp(card._rotateStartPos.x, card._rotateTargetPos.x, phaseT),
                        pc.math.lerp(card._rotateStartPos.y, upPos.y, heightT),
                        pc.math.lerp(card._rotateStartPos.z, card._rotateTargetPos.z, phaseT)
                    );

                    if (rotateT > 0) {
                        card.setLocalEulerAngles(
                            pc.math.lerp(card._rotateStartRot.x, card._rotateTargetRot.x, phaseT),
                            pc.math.lerp(card._rotateStartRot.y, card._rotateTargetRot.y, phaseT),
                            pc.math.lerpAngle(card._rotateStartRot.z, card._rotateEndRot.z, rotateT)
                        );
                    }
                } else {
                    const phaseT = (t - 0.5) * 2;
                    card.setLocalPosition(
                        card._rotateTargetPos.x,
                        pc.math.lerp(upPos.y, card._rotateTargetPos.y, phaseT),
                        card._rotateTargetPos.z
                    );
                    card.setLocalEulerAngles(card._rotateTargetRot.x, card._rotateTargetRot.y, card._rotateEndRot.z);
                }

                if (progress >= 1) {
                    card.setLocalPosition(card._rotateTargetPos);
                    card.setLocalEulerAngles(card._rotateTargetRot.x, card._rotateTargetRot.y, card._rotateEndRot.z);

                    delete card._rotateStartPos;
                    delete card._rotateStartRot;
                    delete card._rotateTargetPos;
                    delete card._rotateTargetRot;
                    delete card._rotateEndRot;
                }
            }

            if (progress >= 1) {
                this.app.off('update', updateAllCards);
            }
        };

        this.app.fire('PlaySound_FlipCard');
        this.app.on('update', updateAllCards);
    };

    CardsManager.prototype.rotateTableCardsSequentially = function (cardEntities) {
        if (!cardEntities || cardEntities.length === 0) return;

        let index = 0;

        const rotateNext = () => {
            if (index >= cardEntities.length) return;

            const card = cardEntities[index];
            if (!card) {
                index++;
                rotateNext();
                return;
            }

            this.app.fire('PlaySound_FlipCard');

            const startPos = card.getLocalPosition().clone();
            const startRot = card.getLocalEulerAngles().clone();

            let targetPos = startPos.clone();
            let targetRot = startRot.clone();

            const upPos = targetPos.clone();
            upPos.y += this.moveUpDistanceTabCards;
            const endRot = new pc.Vec3(targetRot.x, targetRot.y, startRot.z - 180);

            let elapsed = 0;
            let phase = (!startPos.equals(targetPos)) ? 'moveToPoint' : 'up';

            const update = (dt) => {
                elapsed += dt;
                let t;

                if (phase === 'moveToPoint') {
                    t = Math.min(elapsed / this.moveToPointDuration, 1);
                    const newPos = new pc.Vec3().lerp(startPos, targetPos, t);
                    const newRot = new pc.Vec3().lerp(startRot, targetRot, t);
                    card.setLocalPosition(newPos);
                    card.setLocalEulerAngles(newRot);
                    if (t >= 0.8) {
                        elapsed = 0;
                        phase = 'up';
                    }
                } else if (phase === 'up') {
                    t = Math.min(elapsed / this.moveUpDuration, 1);
                    card.setLocalPosition(targetPos.x, pc.math.lerp(targetPos.y, upPos.y, t), targetPos.z);
                    if (t >= 1) {
                        elapsed = 0;
                        phase = 'rotate';
                    }
                } else if (phase === 'rotate') {
                    t = Math.min(elapsed / this.rotateDuration, 1);
                    card.setLocalEulerAngles(targetRot.x, targetRot.y, pc.math.lerpAngle(startRot.z, endRot.z, t));
                    if (t >= 1) {
                        elapsed = 0;
                        phase = 'down';
                    }
                } else if (phase === 'down') {
                    t = Math.min(elapsed / this.moveDownDuration, 1);
                    card.setLocalPosition(targetPos.x, pc.math.lerp(upPos.y, targetPos.y, t), targetPos.z);
                    if (t >= 1) {
                        this.app.off('update', update);
                        index++;
                        rotateNext();
                    }
                }
            };

            this.app.on('update', update);
        };

        rotateNext();
    };

    CardsManager.prototype.replaceCard = function (playerIndex, cardSlot, suit, rank) {
        let newCardTemplate = this.pokerTemplateCards[suit] && this.pokerTemplateCards[suit][rank];
        if (!newCardTemplate) {
            return;
        }

        let targetEntity = null;
        let targetData = null;

        if (playerIndex > 0) {
            switch (cardSlot) {
                case 1:
                    targetData = this.firstCards[playerIndex];
                    targetEntity = targetData?.entity;
                    break;
                case 2:
                    targetData = this.secondCards[playerIndex];
                    targetEntity = targetData?.entity;
                    break;
                case 3:
                    targetData = this.thirdCards[playerIndex];
                    targetEntity = targetData?.entity;
                    break;
                case 4:
                    targetData = this.fourthCards[playerIndex];
                    targetEntity = targetData?.entity;
                    break;
            }
        } else {
            // TABLE CARDS
            targetData = this.tableCards[cardSlot - 1];
            targetEntity = targetData?.entity;
        }

        if (!targetEntity || !targetData) {
            return;
        }

        const parent = targetEntity.parent;
        const pos = targetEntity.getLocalPosition().clone();
        const rot = targetEntity.getLocalRotation().clone();
        const scale = targetEntity.getLocalScale().clone();

        targetEntity.destroy();

        let newCard;
        if (newCardTemplate.resource && typeof newCardTemplate.resource.instantiate === 'function') {
            newCard = newCardTemplate.resource.instantiate();
        } else {
            console.warn('Failed to instantiate template');
            return;
        }

        newCard.enabled = true;
        targetData.entity = newCard;

        parent.addChild(newCard);
        newCard.setLocalPosition(pos);
        newCard.setLocalRotation(rot);
        newCard.setLocalScale(scale);
    };

    CardsManager.prototype.cardsAnimationOnGameWin = function (playerNumber) {
        const scaleDownCards = () => {
            const card1Data = this.firstCards[playerNumber];
            const card2Data = this.secondCards[playerNumber];
            const card3Data = this.thirdCards ? this.thirdCards[playerNumber] : null;
            const card4Data = this.fourthCards ? this.fourthCards[playerNumber] : null;

            if (!card1Data || !card2Data) return;

            const cards = this._isOhama
                ? [card1Data.entity, card2Data.entity, card3Data?.entity, card4Data?.entity].filter(Boolean)
                : [card1Data.entity, card2Data.entity];

            const scaleDuration = 0.5;
            let elapsed = 0;
            const startScales = cards.map(c => c ? c.getLocalScale().clone() : new pc.Vec3(0, 0, 0));

            const updateScale = (dt) => {
                elapsed += dt;
                const t = Math.min(elapsed / scaleDuration, 1);

                for (let i = 0; i < cards.length; i++) {
                    const card = cards[i];
                    if (!card || card._destroyed) continue;

                    const newScale = new pc.Vec3();
                    newScale.lerp(startScales[i], new pc.Vec3(0, 0, 0), t);
                    card.setLocalScale(newScale);
                }

                if (t >= 1) {
                    this.app.off('update', updateScale);
                    cards.forEach((c) => {
                        if (c && !c._destroyed) c.enabled = false;
                    });
                }
            };

            this.app.on('update', updateScale);
        };

        scaleDownCards();
    };

    CardsManager.prototype.cardsAnimationOnLeft = function (playerNumber) {
        playerNumber = window.GameManager.serverToUiIndex(playerNumber);
        var mainSlot = this._getMainPlayerSlot();

        const moveCardsToFold = () => {
            const card1Data = this.firstCards[playerNumber];
            const card2Data = this.secondCards[playerNumber];
            const card3Data = this.thirdCards ? this.thirdCards[playerNumber] : null;
            const card4Data = this.fourthCards ? this.fourthCards[playerNumber] : null;

            if (!card1Data || !card2Data) return;
            if (!this.positionThatCardsGoOnFold) return;

            const cards = this._isOhama
                ? [card1Data.entity, card2Data.entity, card3Data?.entity, card4Data?.entity].filter(Boolean)
                : [card1Data.entity, card2Data.entity];

            const targetPos = this.positionThatCardsGoOnFold.getLocalPosition().clone();
            const moveDuration = 0.5;
            let elapsed = 0;
            const startPositions = cards.map(c => c.getLocalPosition().clone());

            const updateFold = (dt) => {
                elapsed += dt;
                const t = Math.min(elapsed / moveDuration, 1);

                for (let i = 0; i < cards.length; i++) {
                    const newPos = new pc.Vec3();
                    newPos.lerp(startPositions[i], targetPos, t);
                    cards[i].setLocalPosition(newPos);
                }

                if (t >= 1) {
                    this.app.off('update', updateFold);
                    cards.forEach(c => {
                        if (c) c.enabled = false;
                    });
                }
            };

            this.app.on('update', updateFold);
        };

        if (playerNumber === mainSlot && this._mainPlayerHasCards == true) {
            this.rotatePlayerCards(mainSlot);
            setTimeout(() => moveCardsToFold(), 1500);
        } else {
            moveCardsToFold();
        }
    };

    CardsManager.prototype.cardsAnimationOnFold = function (playerNumber) {
        var mainSlot = this._getMainPlayerSlot();
       
        var foldGeneration = this._handGeneration;

        const moveCardsToFold = () => {
            if (this._handGeneration !== foldGeneration) return;

            const card1Data = this.firstCards[playerNumber];
            const card2Data = this.secondCards[playerNumber];
            const card3Data = this.thirdCards ? this.thirdCards[playerNumber] : null;
            const card4Data = this.fourthCards ? this.fourthCards[playerNumber] : null;

            if (!card1Data || !card2Data) return;
            if (!this.positionThatCardsGoOnFold) return;

            const cards = this._isOhama
                ? [card1Data.entity, card2Data.entity, card3Data?.entity, card4Data?.entity].filter(Boolean)
                : [card1Data.entity, card2Data.entity];

            const targetPos = this.positionThatCardsGoOnFold.getLocalPosition().clone();
            const moveDuration = 0.5;
            let elapsed = 0;
            const startPositions = cards.map(c => c.getLocalPosition().clone());

            const updateFold = (dt) => {
                // Abort if new hand started
                if (this._handGeneration !== foldGeneration) {
                    this.app.off('update', updateFold);
                    return;
                }

                elapsed += dt;
                const t = Math.min(elapsed / moveDuration, 1);

                for (let i = 0; i < cards.length; i++) {
                    if (!cards[i] || cards[i]._destroyed) continue;
                    const newPos = new pc.Vec3();
                    newPos.lerp(startPositions[i], targetPos, t);
                    cards[i].setLocalPosition(newPos);
                }

                if (t >= 1) {
                    this.app.off('update', updateFold);
                    cards.forEach(c => {
                        if (c && !c._destroyed) c.enabled = false;
                    });
                }
            };

            this.app.on('update', updateFold);
        };

        //  main player 
        if (playerNumber === mainSlot && this._mainPlayerHasCards == true) {
            this.rotatePlayerCards(mainSlot);
            setTimeout(() => moveCardsToFold(), 1500);
        } else {
            moveCardsToFold();
        }
    };

    CardsManager.prototype.gameState_GameWON_collectCards = function () {
        if (!this.positionThatCardsGoOnFold) return;

        const targetPos = this.positionThatCardsGoOnFold.getLocalPosition().clone();
        const moveDuration = 0.7;
        let elapsed = 0;

        const allCards = []
            .concat(this.firstCards.map(c => c?.entity).filter(Boolean))
            .concat(this.secondCards.map(c => c?.entity).filter(Boolean))
            .concat(this.tableCards ? this.tableCards.map(c => c?.entity).filter(Boolean) : [])
            .filter(c => !!c);

        if (allCards.length === 0) return;

        const startPositions = allCards.map(c => c.getLocalPosition().clone());

        const updateCollect = (dt) => {
            elapsed += dt;
            let t = Math.min(elapsed / moveDuration, 1);

            for (let i = 0; i < allCards.length; i++) {
                let newPos = new pc.Vec3();
                newPos.lerp(startPositions[i], targetPos, t);
                allCards[i].setLocalPosition(newPos);
            }

            if (t >= 1) {
                this.app.off('update', updateCollect);
                allCards.forEach(c => {
                    c.enabled = false;
                });
            }
        };

        this.app.on('update', updateCollect);
    };

// ─── ROTATE PLAYER CARDS main player ───────────────────────────────────────
    CardsManager.prototype.rotatePlayerCards = function (playerIndex) {
        var mainSlot = this._getMainPlayerSlot();

        if (playerIndex !== mainSlot) return;

        const cardsToRotate = [];

        if (this.firstCards[mainSlot]?.entity) {
            cardsToRotate.push(this.firstCards[mainSlot].entity);
        }
        if (this.secondCards[mainSlot]?.entity) {
            cardsToRotate.push(this.secondCards[mainSlot].entity);
        }

        if (this._isOhama == true) {
            if (this.thirdCards[mainSlot]?.entity) {
                cardsToRotate.push(this.thirdCards[mainSlot].entity);
            }
            if (this.fourthCards[mainSlot]?.entity) {
                cardsToRotate.push(this.fourthCards[mainSlot].entity);
            }
        }

        if (cardsToRotate.length > 0) {
            this.rotateCards180Z(cardsToRotate);
        }
    };

    // ─── MANUAL UPDATE ────────────────────────────────────────────────────────────
    CardsManager.prototype.manualUpdate = function (dt) {
        if (!this.isMoving) return;

        if (this.currentPlayerIndex === 0 && !this.phaseStarted) {
            this.phaseStarted = true;
        }

        if (this.currentPhase === 'playerCards') {
            const currentPlayerIndex = this.currentPlayerIndex;
            const activePlayers = this.getActivePlayerIndices();

            if (activePlayers.length === 0 || !activePlayers.includes(currentPlayerIndex)) {
                this.completeCurrentPhase();
                return;
            }

            let anyCardMoving = false;
            let playerHasCards = false;

            const cardArrays = [
                this.firstCards[currentPlayerIndex],
                this.secondCards[currentPlayerIndex]
            ];

            if (this._isOhama) {
                cardArrays.push(
                    this.thirdCards[currentPlayerIndex],
                    this.fourthCards[currentPlayerIndex]
                );
            }

            cardArrays.forEach(cardData => {
                if (cardData && cardData.entity) {
                    playerHasCards = true;
                    if (!this.isCardAtTarget(cardData)) {
                        this.processSingleCardMovement(cardData, dt);
                        anyCardMoving = true;
                    }
                }
            });

            if (playerHasCards && !anyCardMoving) {
                this.moveToNextPlayer();
            } else if (!playerHasCards) {
                this.moveToNextPlayer();
            }

        } else if (this.currentPhase === 'tableCard') {
            const cardData = this.tableCards[this.currentTableCardIndex];

            if (cardData && cardData.entity) {
                if (!this.isCardAtTarget(cardData)) {
                    this.processSingleCardMovement(cardData, dt);
                } else {
                    this.completeCurrentPhase();
                }
            } else {
                this.completeCurrentPhase();
            }
        } else {
            let cardsArray;

            switch (this.currentPhase) {
                case 'first3TableCards':
                    cardsArray = this.tableCards.slice(0, 3);
                    break;
                case 'last2TableCards':
                    cardsArray = this.tableCards.slice(3, 5);
                    break;
                default:
                    this.isMoving = false;
                    return;
            }

            if (!cardsArray || cardsArray.length === 0) {
                this.isMoving = false;
                return;
            }

            if (this.currentMovingIndex >= cardsArray.length) {
                this.completeCurrentPhase();
                return;
            }

            let currentCardData = cardsArray[this.currentMovingIndex];
            if (currentCardData && !currentCardData._hasStartedMoving) {
                this.app.fire('DealerAnimation:MoveHand_Once');
                this.app.fire('PlaySound_CardMoved');
            }
            this.processCardMovement(cardsArray, null, null, dt);
        }
    };

    CardsManager.prototype.moveToNextPlayer = function () {
        const activePlayers = this.getActivePlayerIndices();
        const currentIndex = activePlayers.indexOf(this.currentPlayerIndex);

        if (currentIndex >= 0 && currentIndex < activePlayers.length - 1) {
            this.currentPlayerIndex = activePlayers[currentIndex + 1];
        } else {
            this.completeCurrentPhase();
        }
    };

//ku ka lojtar aktiv
    CardsManager.prototype.getActivePlayerIndices = function () {
        if (!this.playersInfo) return [];

        var activeSeats = window.GameManager.getSeatPosition(window.GameManager.seatsArray);
        var activePlayers = [];

        for (let i = 0; i < activeSeats.length; i++) {
            var slot = activeSeats[i];
            if (this.playersInfo[slot] && !this.playersInfo[slot].is_empty) {
                activePlayers.push(slot);
            }
        }

        return activePlayers;
    };

    CardsManager.prototype.isCardAtTarget = function (cardData) {
        if (!cardData || !cardData.entity) return true;

        const card = cardData.entity;
        const currentPos = card.getLocalPosition();
        const currentRot = card.getLocalRotation();
        const currentScale = card.getLocalScale();

        const posComplete = currentPos.distance(cardData.targetPos) < 0.01;
        const rotComplete = Math.abs(currentRot.dot(cardData.targetRot)) > 0.999;
        const scaleComplete = currentScale.distance(cardData.originalScale) < 0.01;

        return posComplete && rotComplete && scaleComplete;
    };

    CardsManager.prototype.processSingleCardMovement = function (cardData, dt) {
        if (!cardData || !cardData.entity) return;

        let card = cardData.entity;
        let targetPos = cardData.targetPos;
        let targetRot = cardData.targetRot;
        let targetScale = cardData.originalScale;

        let currentPos = card.getLocalPosition();
        let currentRot = card.getLocalRotation();
        let currentScale = card.getLocalScale();

        const currentDT = dt * this.lerpSpeed;
        let alpha = Math.min(currentDT, 1);

        if (!cardData._hasStartedMoving) {
            this.app.fire('PlaySound_CardMoved');
            this.app.fire('DealerAnimation:MoveHand_Once');
            cardData._hasStartedMoving = true;
        }

        let newPos = new pc.Vec3().lerp(currentPos, targetPos, alpha);
        card.setLocalPosition(newPos);

        let newRot = new pc.Quat().slerp(currentRot, targetRot, alpha);
        card.setLocalRotation(newRot);

        let newScale = new pc.Vec3().lerp(currentScale, targetScale, alpha);
        card.setLocalScale(newScale);

        if (this.isCardAtTarget(cardData)) {
            card.setLocalPosition(targetPos);
            card.setLocalRotation(targetRot);
            card.setLocalScale(targetScale);
        }
    };

    CardsManager.prototype.processCardMovement = function (cardsArray, targetPositions, targetRotations, dt) {
        let cardData = cardsArray[this.currentMovingIndex];

        if (!cardData || !cardData.entity) {
            this.currentMovingIndex++;
            return;
        }

        let card = cardData.entity;
        let targetPos = targetPositions ? targetPositions[this.currentMovingIndex] : cardData.targetPos;
        let targetRot = targetRotations ? targetRotations[this.currentMovingIndex] : cardData.targetRot;
        let targetScale = cardData.originalScale;

        let currentPos = card.getLocalPosition();
        let currentRot = card.getLocalRotation();
        let currentScale = card.getLocalScale();

        const currentDT = dt * this.lerpSpeed;
        let alpha = Math.min(currentDT, 1);

        if (!cardData._hasStartedMoving) {
            this.app.fire('PlaySound_CardMoved');
            cardData._hasStartedMoving = true;
        }

        let newPos = new pc.Vec3().lerp(currentPos, targetPos, alpha);
        card.setLocalPosition(newPos);

        let newRot = new pc.Quat().slerp(currentRot, targetRot, alpha);
        card.setLocalRotation(newRot);

        let newScale = new pc.Vec3().lerp(currentScale, targetScale, alpha);
        card.setLocalScale(newScale);

        let posComplete = currentPos.distance(targetPos) < 0.05;
        let rotComplete = Math.abs(currentRot.dot(targetRot)) > 0.999;
        let scaleComplete = currentScale.distance(targetScale) < 0.01;

        if (posComplete && rotComplete && scaleComplete) {
            card.setLocalPosition(targetPos);
            card.setLocalRotation(targetRot);
            card.setLocalScale(targetScale);
            this.currentMovingIndex++;
        }
    };

    CardsManager.prototype.rotateFirst3TableCards = function () {
        this.currentPhase = 'first3TableCards';
        this.currentMovingIndex = 0;
        this.isMoving = true;

        this.moveTableCardsThenRotate(0, 3, () => {
            setTimeout(() => {
                if (this.tableCards && this.tableCards.length >= 3) {
                    const firstThreeCards = this.tableCards.slice(0, 3).map(c => c?.entity).filter(Boolean);
                    if (firstThreeCards.length > 0) {
                        this.rotateTableCardsSequentially(firstThreeCards);
                    }
                }
            }, this.durationWhenTableCardFinishedAndNeedToRotate);
        });
    };

    CardsManager.prototype.rotatePenultimateTableCards = function () {
        this.currentPhase = 'last2TableCards';
        this.currentMovingIndex = 3;
        this.isMoving = true;
        this.app.fire('DealerAnimation:MoveHand_Once');
        this.app.fire('PlaySound_CardMoved');
        this.moveTableCardsThenRotate(3, 1, () => {
            setTimeout(() => {
                const fourthCard = this.tableCards[3]?.entity;
                if (fourthCard) {
                    this.rotateTableCardsSequentially([fourthCard]);
                }
            }, this.durationWhenTableCardFinishedAndNeedToRotate);
        });
    };

    CardsManager.prototype.rotateLastTableCards = function () {
        this.currentPhase = 'lastTableCard';
        this.currentMovingIndex = 4;
        this.isMoving = true;
        this.app.fire('DealerAnimation:MoveHand_Once');
        this.app.fire('PlaySound_CardMoved');
        this.moveTableCardsThenRotate(4, 1, () => {
            setTimeout(() => {
                const fifthCard = this.tableCards[4]?.entity;
                if (fifthCard) {
                    this.rotateTableCardsSequentially([fifthCard]);
                }
            }, this.durationWhenTableCardFinishedAndNeedToRotate);
        });
    };

    CardsManager.prototype.rotateTableCard = function (cardIndex) {
        this.currentMovingIndex = cardIndex;
        this.isMoving = true;
        this.app.fire('DealerAnimation:MoveHand_Once');
        this.app.fire('PlaySound_CardMoved');
        this.moveTableCardsThenRotate(cardIndex, 1, () => {
            setTimeout(() => {
                const card = this.tableCards[cardIndex]?.entity;
                if (card) {
                    this.rotateTableCardsSequentially([card]);
                }
            }, this.durationWhenTableCardFinishedAndNeedToRotate);
        });
    };

    CardsManager.prototype.moveTableCardsThenRotate = function (startIndex, count, onComplete) {
        let cardsMoved = 0;

        const moveNextCard = (index) => {
            if (index >= startIndex + count || index >= this.tableCards.length) {
                if (onComplete) onComplete();
                return;
            }

            const cardData = this.tableCards[index];
            if (!cardData || !cardData.entity) {
                moveNextCard(index + 1);
                return;
            }

            const card = cardData.entity;
            const targetPos = cardData.targetPos;
            const targetRot = cardData.targetRot;
            const targetScale = cardData.originalScale;

            this.animateCardToPosition(card, targetPos, targetRot, targetScale, () => {
                cardsMoved++;
                moveNextCard(index + 1);
            });
        };

        moveNextCard(startIndex);
    };

    CardsManager.prototype.animateCardToPosition = function (card, targetPos, targetRot, targetScale, onComplete) {
        const startPos = card.getLocalPosition().clone();
        const startRot = card.getLocalRotation().clone();
        const startScale = card.getLocalScale().clone();

        let elapsed = 0;

        const updateMovement = (dt) => {
            elapsed += dt;
            const t = Math.min(elapsed / this.durationForCardToMoveFromPosToTarg, 1);

            const easedT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

            const newPos = new pc.Vec3();
            newPos.lerp(startPos, targetPos, easedT);
            card.setLocalPosition(newPos);

            const newRot = new pc.Quat();
            newRot.slerp(startRot, targetRot, easedT);
            card.setLocalRotation(newRot);

            const newScale = new pc.Vec3();
            newScale.lerp(startScale, targetScale, easedT);
            card.setLocalScale(newScale);

            if (t >= 1) {
                card.setLocalPosition(targetPos);
                card.setLocalRotation(targetRot);
                card.setLocalScale(targetScale);

                this.app.off('update', updateMovement);
                if (onComplete) onComplete();
            }
        };

        this.app.on('update', updateMovement);
    };

// ─── COMPLETE PHASE ───────────────────────────────────────────────────────────
    CardsManager.prototype.completeCurrentPhase = function () {
        this.isMoving = false;
        this.phaseStarted = false;

        var mainSlot = this._getMainPlayerSlot();

        if (this.currentPhase === 'playerCards') {
            if (this._pendingHoleCardRotate && this._mainPlayerHasCards && mainSlot >= 0) {
                this._pendingHoleCardRotate = false;
                this.rotatePlayerCards(mainSlot);
                // this.app.fire('GameManager_UiMenager:EnableDisableButtonsUI', false);
                // this.app.fire('GameManager_UiMenager:ButtonsState', false);
            }

            this.isProcessingDeal = false;
            this.currentPhase = 'idle';

            setTimeout(() => this.processNextDeal(), 100);
            return;
        }

        if (this.currentPhase === 'lastTableCard') {
            if (this._mainPlayerHasCards && mainSlot >= 0) {
                this.rotatePlayerCards(mainSlot);
            }
            this.isCardsStillProcesing = false;
            this.currentPhase = 'idle';
            return;
        }

        this.currentPhase = 'idle';
    };

    // ─── RESET ────────────────────────────────────────────────────────────────────
    CardsManager.prototype.resetScript = function () {
        this.isMoving = false;
        this.cardsCloned = false;
        this.isCardsStillProcesing = false;
        this.phaseStarted = false;

        this._isOhama = false;
        this._mainPlayerHasCards = false;

        this.dealQueue = [];
        this.isProcessingDeal = false;
        this.cardReplacedCount = 0;
        this.totalHoleCardsExpected = 0;
        this._pendingHoleCardRotate = false;

        this.removeEvents();
        this.destroyAllCards();

        this.currentPhase = "idle";
        this.currentMovingIndex = 0;
        this.currentPlayerIndex = 0;
        this.firstCards = new Array(9);
        this.secondCards = new Array(9);
        this.thirdCards = new Array(9);
        this.fourthCards = new Array(9);
        this.tableCards = [];

        for (let i = 0; i < 9; i++) {
            this.firstCards[i] = null;
            this.secondCards[i] = null;
            this.thirdCards[i] = null;
            this.fourthCards[i] = null;
        }

        this.isCardsStillProcesing = false;
        this.phaseStarted = false;

        this.initializeEventsManager();
    };

    CardsManager.prototype.destroyAllCards = function () {
        const arrays = [
            this.firstCards,
            this.secondCards,
            this.thirdCards,
            this.fourthCards,
            this.tableCards
        ];

        for (let arr of arrays) {
            if (!arr) continue;
            for (let item of arr) {
                if (item && item.entity) {
                    item.entity.destroy();
                }
            }
        }

        this.firstCards = new Array(9);
        this.secondCards = new Array(9);
        this.thirdCards = new Array(9);
        this.fourthCards = new Array(9);
        this.tableCards = [];

        for (let i = 0; i < 9; i++) {
            this.firstCards[i] = null;
            this.secondCards[i] = null;
            this.thirdCards[i] = null;
            this.fourthCards[i] = null;
        }
    };

    CardsManager.prototype.removeEvents = function () {
        this.app.off('GameManager:updatePlayersInfo', this.onPlayersInfoReceived, this);
        this.app.off('GameManager:updateSpecificPlayerInfo:player_seated', this.onPlayerSeated, this);
        this.app.off('GameManager:updateSpecificPlayerInfo:player_left', this.onPlayerLeft, this);
        this.app.off('GameManager:gameState:Ohama:Poker', this._noOp, this);
        this.app.off('GameManager:defineIsMainUserPlaying', this._noOp, this);
        this.app.off('GameManager_Pharse:moveFirstCards', this.startCardMovement, this);
        this.app.off("GameManager:replaceCard", this.onReplaceCard, this);
        this.app.off('GameManager_Rotate:PlayerCards', this.rotatePlayerCards, this);
        this.app.off('GameManager_Pharse:First3TableCards', this.rotateFirst3TableCards, this);
        this.app.off('GameManager_Pharse:LastPenultimateTableCards', this.rotatePenultimateTableCards, this);
        this.app.off('GameManager_Pharse:LastTableCards', this.rotateLastTableCards, this);
        this.app.off("CardsManager:cardsAnimationOnFold", this.cardsAnimationOnFold, this);
        this.app.off("CardsManager:cardsAnimationOnLeft", this.cardsAnimationOnLeft, this);
        this.app.off('GameManager_State:game_won:collectAllCards', this.gameState_GameWON_collectCards, this);
        this.app.off('GameManager_RESTARTSCRIPT', this.resetScript, this);
        this.app.off('CardsManager:DealHoleCards', this.queueHoleCardDeal, this);
        this.app.off('CardsManager:DealCommunityCards', this.queueCommunityCardDeal, this);
        this.app.off('CardsManager:DealHoleCards_withoutAnimation', this.instantHoleCardDeal, this);
        this.app.off('CardsManager:DealCommunityCards_withoutAnimaton', this.instantCommunityCardDeal, this);
    };

    CardsManager.prototype.onDestroy = function () {
        if (this._updateFn) {
            this.app.off('update', this._updateFn);
            this._updateFn = null;
        }
    };
