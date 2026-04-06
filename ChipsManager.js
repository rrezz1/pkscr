var ChipsManager = pc.createScript('chipsManager');

ChipsManager.attributes.add('chips', {
    type: 'json',
    array: true,
    schema: [
        { name: '1_Red',   type: 'entity' },
        { name: '2_Red',   type: 'entity' },
        { name: '3_Red',   type: 'entity' },
        { name: '1_Blue',  type: 'entity' },
        { name: '2_Blue',  type: 'entity' },
        { name: '3_Blue',  type: 'entity' },
        { name: '1_Green', type: 'entity' },
        { name: '2_Green', type: 'entity' },
        { name: '3_Green', type: 'entity' }
    ]
});

ChipsManager.attributes.add('ohamaChips', {
    type: 'json',
    schema: [
        { name: '1_Red',   type: 'entity' },
        { name: '2_Red',   type: 'entity' },
        { name: '3_Red',   type: 'entity' },
        { name: '1_Blue',  type: 'entity' },
        { name: '2_Blue',  type: 'entity' },
        { name: '3_Blue',  type: 'entity' },
        { name: '1_Green', type: 'entity' },
        { name: '2_Green', type: 'entity' },
        { name: '3_Green', type: 'entity' }
    ],
    title: 'ohamaChips'
});

ChipsManager.attributes.add('user4IsNotPLaying', {
    type: 'json',
    schema: [
        { name: '1_Red',   type: 'entity' },
        { name: '2_Red',   type: 'entity' },
        { name: '3_Red',   type: 'entity' },
        { name: '1_Blue',  type: 'entity' },
        { name: '2_Blue',  type: 'entity' },
        { name: '3_Blue',  type: 'entity' },
        { name: '1_Green', type: 'entity' },
        { name: '2_Green', type: 'entity' },
        { name: '3_Green', type: 'entity' }
    ],
    title: 'user4IsNotPLaying'
});

ChipsManager.prototype.initialize = function () {
    this.indexPlayer    = [];
    this.isGameStateOhama;
    this.isUser4InGame;
    this.playersInfo    = null;
    this.chipState      = {};
    this.lastBinance    = {};
    this.maxValue       = 1000;

    this.app.on('GameManager:defineChipsValue',                          this.defineMaxValue,           this);
    this.app.on('GameManager:updatePlayersInfo',                         this.onPlayersInfoUpdate,      this);
    this.app.on('ChipsManager:enable_Chip_For_Player',                   this.enableChipsForPlayer,     this);
    this.app.on('GameManager:defineIsMainUserPlaying',                   this.defineIsUser4Playing,     this);
    this.app.on('GameManager:gameState:Ohama:Poker',                     this.defineIsGameIsOhamaOrPoker, this);
    this.app.on('GameManager:updateSpecificPlayerInfo',                  this.onPlayerInfoUpdate,       this);
    this.app.on('GameManager:updateSpecificPlayerInfo:player_seated',    this.onPlayerSeated,           this);
    this.app.on('GameManager:updateSpecificPlayerInfo:player_left',      this.onPlayerLeft,             this);
    this.app.on('GameManager:updateSpecificPlayerInfo:player_balance',   this.onPlayerBalanceUpdate,    this);
};
ChipsManager.prototype.onPlayersInfoUpdate = function (info) {
    setTimeout(() => {
        this.playersInfo = {};

        for (let i = 0; i < info.length; i++) {
            const p = info[i];
            if (p != null && p.position !== undefined) {
                const physicalSlot = window.GameManager.serverToUiIndex(p.position);
                if (physicalSlot === undefined || physicalSlot < 0) continue;
                this.playersInfo[physicalSlot] = p;
                this.lastBinance[physicalSlot] = null;
                if (this.indexPlayer.indexOf(physicalSlot) === -1) {
                    this.indexPlayer.push(physicalSlot);
                }
            }
        }

        // tani qe playersInfo eshte gati, thirr per te gjitha slots aktive
        for (let i = 0; i < this.indexPlayer.length; i++) {
            this.updateChipsFor(this.indexPlayer[i]);
        }
    }, 1000);
};
ChipsManager.prototype.onPlayerSeated = function (position, username, balance) {
    position = window.GameManager.serverToUiIndex(position);
    if (position === undefined || position < 0) return;

    if (!this.playersInfo) this.playersInfo = {};

    this.playersInfo[position] = {
        position: position,
        balance:  balance
    };

    if (this.indexPlayer.indexOf(position) === -1) {
        this.indexPlayer.push(position);
    }

    this.updateChipsFor(position);
};

ChipsManager.prototype.onPlayerLeft = function (position) {
    position = window.GameManager.serverToUiIndex(position);
    if (position === undefined || position < 0) return;

    if (this.playersInfo && this.playersInfo[position]) {
        this.playersInfo[position].balance = 0;
    }

    this.lastBinance[position] = null;
    this.updateChipsFor(position);
};

ChipsManager.prototype.onPlayerBalanceUpdate = function (position, balance) {
    position = window.GameManager.serverToUiIndex(position);
    if (position === undefined || position < 0) return;

    if (!this.playersInfo) this.playersInfo = {};

    if (this.playersInfo[position]) {
        this.playersInfo[position].balance = balance;
    } else {
        this.playersInfo[position] = { position: position, balance: balance };
    }

    this.lastBinance[position] = null;
    this.updateChipsFor(position);
};



ChipsManager.prototype.onPlayerInfoUpdate = function (playerInfo) {
    if (!this.playersInfo) return;

    const physicalSlot = window.GameManager.serverToUiIndex(playerInfo.position);
    if (physicalSlot === undefined || physicalSlot < 0) return;

    this.playersInfo[physicalSlot] = playerInfo;
    this.updateChipsFor(physicalSlot);
};

ChipsManager.prototype.defineIsUser4Playing = function (isUser4Playing) {
    this.isUser4InGame = isUser4Playing;
};

ChipsManager.prototype.defineIsGameIsOhamaOrPoker = function (isGameStateOhama) {
    this.isGameStateOhama = isGameStateOhama;
};

ChipsManager.prototype.enableChipsForPlayer = function (playerIndex) {
    if (this.indexPlayer.indexOf(playerIndex) === -1) {
        this.indexPlayer.push(playerIndex);
    }
    // if (!this.playersInfo) return;
    this.lastBinance[playerIndex] = null;
    this.updateChipsFor(playerIndex);
    console.log("CHIPS(ChipsManager): "+playerIndex);
};

ChipsManager.prototype.defineMaxValue = function (maxValue) {
    this.maxValue = parseFloat(maxValue / 100) || 1000;

    const redTotalValue   = this.maxValue * 0.40;
    const blueTotalValue  = this.maxValue * 0.35;
    const greenTotalValue = this.maxValue * 0.25;

    this.chipValues = {
        Red:   Math.round(redTotalValue   / 3),
        Blue:  Math.round(blueTotalValue  / 3),
        Green: Math.round(greenTotalValue / 3)
    };

    this.recalculateAllChips();
};

ChipsManager.prototype.recalculateAllChips = function () {
    if (!this.playersInfo) return;

    for (let i = 0; i < this.indexPlayer.length; i++) {
        this.updateChipsFor(this.indexPlayer[i]);
    }
};

ChipsManager.prototype.updateChipsFor = function (i) {
    if (!this.playersInfo) return;
    const player = this.playersInfo[i];
    if (!player || player.balance == null) return;
    const binance = parseFloat(player.balance / 100);
    if (this.lastBinance[i] === binance) return;
    if (!this.chipValues) return;

    this.lastBinance[i] = binance;
    if (i === 4) {
        // Determine which set will be active this frame
        var activeSet = (!this.isUser4InGame) ? this.user4IsNotPLaying :
                        (this.isGameStateOhama) ? this.ohamaChips :
                        this.chips[4];
        // Silently disable the two inactive sets without touching chipState or triggering animations
        var allFourSets = [this.chips[4], this.ohamaChips, this.user4IsNotPLaying];
        for (var s = 0; s < allFourSets.length; s++) {
            var cs = allFourSets[s];
            if (!cs || cs === activeSet) continue;
            for (var k in cs) {
                if (cs[k]) {
                    cs[k].enabled = false;
                    if (cs[k].element) cs[k].element.opacity = 0;
                    cs[k].setLocalScale(0, 0, 0);
                }
            }
        }
    }

    /*
    if (i === 4) {
    
    var prevChipSet = (!this.isUser4InGame && i === 4) ? this.user4IsNotPLaying :
                      (i === 4 && this.isGameStateOhama === true) ? this.ohamaChips :
                      this.chips[4];
    
    var nextChipSet = (!this.isUser4InGame && i === 4) ? this.user4IsNotPLaying :
                      (i === 4 && this.isGameStateOhama === true) ? this.ohamaChips :
                      this.chips[4];

    
    var allFourSets = [this.chips[4], this.ohamaChips, this.user4IsNotPLaying];
    for (var s = 0; s < allFourSets.length; s++) {
        var cs = allFourSets[s];
        if (!cs || cs === nextChipSet) continue; 
        for (var k in cs) {
            if (cs[k]) {
                cs[k].enabled = false;
                if (cs[k].element) cs[k].element.opacity = 0;
                cs[k].setLocalScale(0, 0, 0);
            }
        }
    }
}
     */
    const chipSet = (!this.isUser4InGame && i === 4) ? this.user4IsNotPLaying :
                    (i === 4 && this.isGameStateOhama === true) ? this.ohamaChips :
                    this.chips[i];

    if (!chipSet) return;
    if (!this.chipState[i]) this.chipState[i] = {};

    const newState = {};
    for (var key in chipSet) newState[key] = false;

    if (binance >= this.maxValue) {
        for (var key in chipSet) newState[key] = true;
    } else {
        let redChips   = Math.min(Math.floor(binance / this.chipValues.Red),   3);
        let blueChips  = Math.min(Math.floor(binance / this.chipValues.Blue),  3);
        let greenChips = Math.min(Math.floor(binance / this.chipValues.Green), 3);

        if (binance > 0 && redChips === 0 && blueChips === 0 && greenChips === 0) {
            greenChips = 1;
        }

        if (redChips   >= 1) newState['1_Red']   = true;
        if (redChips   >= 2) newState['2_Red']   = true;
        if (redChips   >= 3) newState['3_Red']   = true;

        if (blueChips  >= 1) newState['1_Blue']  = true;
        if (blueChips  >= 2) newState['2_Blue']  = true;
        if (blueChips  >= 3) newState['3_Blue']  = true;

        if (greenChips >= 1) newState['1_Green'] = true;
        if (greenChips >= 2) newState['2_Green'] = true;
        if (greenChips >= 3) newState['3_Green'] = true;
    }

    const oldState = this.chipState[i];

    for (var key in chipSet) {
        const chip  = chipSet[key];
        if (!chip) continue;

        const wasOn = oldState[key] === true;
        const isOn  = newState[key] === true;

        if (isOn && !wasOn)       this.animateChipEnable(chip);
        else if (!isOn && wasOn)  this.animateChipDisable(chip);
        else {
            chip.enabled = isOn;
            if (chip.element) chip.element.opacity = isOn ? 1 : 0;
            chip.setLocalScale(isOn ? 0.1 : 0, isOn ? 0.1 : 0, isOn ? 0.1 : 0);
        }
    }

    this.chipState[i] = newState;
};

ChipsManager.prototype.updateChipsInBalanceChange = function (i, change, balance) {
    if (!this.playersInfo) return;

    const player = this.playersInfo[i];
    if (!player) return;
    if (!balance) return;

    const binance = parseFloat(balance / 100);

    if (this.lastBinance[i] === binance) return;
    this.lastBinance[i] = binance;

    const chipSet = (!this.isUser4InGame && i === 4) ? this.user4IsNotPLaying :
                    (i === 4 && this.isGameStateOhama === true) ? this.ohamaChips :
                    this.chips[i];

    if (!chipSet) return;
    if (!this.chipState[i]) this.chipState[i] = {};

    const newState = {};
    for (var key in chipSet) newState[key] = false;

    if (binance >= this.maxValue) {
        for (var key in chipSet) newState[key] = true;
    } else {
        let redChips   = Math.min(Math.floor(binance / this.chipValues.Red),   3);
        let blueChips  = Math.min(Math.floor(binance / this.chipValues.Blue),  3);
        let greenChips = Math.min(Math.floor(binance / this.chipValues.Green), 3);

        if (binance > 0 && redChips === 0 && blueChips === 0 && greenChips === 0) {
            greenChips = 1;
        }

        if (redChips   >= 1) newState['1_Red']   = true;
        if (redChips   >= 2) newState['2_Red']   = true;
        if (redChips   >= 3) newState['3_Red']   = true;

        if (blueChips  >= 1) newState['1_Blue']  = true;
        if (blueChips  >= 2) newState['2_Blue']  = true;
        if (blueChips  >= 3) newState['3_Blue']  = true;

        if (greenChips >= 1) newState['1_Green'] = true;
        if (greenChips >= 2) newState['2_Green'] = true;
        if (greenChips >= 3) newState['3_Green'] = true;
    }

    const oldState = this.chipState[i];

    for (var key in chipSet) {
        const chip  = chipSet[key];
        if (!chip) continue;

        const wasOn = oldState[key] === true;
        const isOn  = newState[key] === true;

        if (isOn && !wasOn)       this.animateChipEnable(chip);
        else if (!isOn && wasOn)  this.animateChipDisable(chip);
        else {
            chip.enabled = isOn;
            if (chip.element) chip.element.opacity = isOn ? 1 : 0;
            chip.setLocalScale(isOn ? 0.1 : 0, isOn ? 0.1 : 0, isOn ? 0.1 : 0);
        }
    }

    this.chipState[i] = newState;
};

ChipsManager.prototype.animateChipEnable = function (chip) {
    chip.enabled = true;
    chip.element.opacity = 0;
    chip.setLocalScale(0, 0, 0);

    var t = 0, dur = 0.2, finalScale = 0.1, self = this;

    function anim(dt) {
        t += dt;
        var p = Math.min(t / dur, 1);
        chip.element.opacity = p;
        chip.setLocalScale(finalScale * p, finalScale * p, finalScale * p);
        if (p >= 1) self.app.off('update', anim);
    }
    this.app.on('update', anim);
};

ChipsManager.prototype.animateChipDisable = function (chip) {
    chip.element.opacity = 1;
    var t = 0, dur = 0.15, self = this;

    function anim(dt) {
        t += dt;
        var p = Math.min(t / dur, 1);
        chip.element.opacity = 1 - p;
        chip.setLocalScale(0.1 * (1 - p), 0.1 * (1 - p), 0.1 * (1 - p));
        if (p >= 1) {
            chip.enabled = false;
            self.app.off('update', anim);
        }
    }
    this.app.on('update', anim);
};