
var ReiseBetController = pc.createScript('reiseBetController');

ReiseBetController.attributes.add('raisePopUpUi', { type: 'entity' });
ReiseBetController.attributes.add('max_Bet_Button', { type: 'entity' });
ReiseBetController.attributes.add('full_Pot_Button', { type: 'entity' });
ReiseBetController.attributes.add('half_Pot_Button', { type: 'entity' }); 
ReiseBetController.attributes.add('add_Button', { type: 'entity' });
ReiseBetController.attributes.add('remove_Button', { type: 'entity' });
ReiseBetController.attributes.add('confirm_Button', { type: 'entity' });
ReiseBetController.attributes.add('scrollBar', { type: 'entity' });
ReiseBetController.attributes.add('show_pot', { type: 'entity' });
ReiseBetController.attributes.add('show_Minpot', { type: 'entity' });

ReiseBetController.attributes.add('raise_Bet_Text', { type: 'entity' });

ReiseBetController.attributes.add('chips_that_Show', { type: 'entity', array: true });

ReiseBetController.prototype.initialize = function () {
    this.minBet;
    this.maxBet;
    this.didEventCalledFromRaise;
    this.app.on('RaiseController:enableRaisePopUP', this.raiseState, this)
    this.app.on('GameManager:getMaxValueThatUserCanBet', this.maxUserValue, this);
    this.app.on('GameManager:getMinValueThatUserCanBet', this.minUserValue, this);
    this.app.on('GameManager:getValuesThatMainUserCanBet:Raise', this.updateValuesForMainUserThatCanBet,this);
    this.app.on('GameManager_UIManager:ResetRaiseValue', this.resetRaiseUI, this);
    this.currentBet = 0;

    this.max_Bet_Button.element.on('click', this.setMaxBet, this);
    this.full_Pot_Button.element.on('click', this.setFullPot, this);
    this.half_Pot_Button.element.on('click', this.setHalfPot, this);
    this.add_Button.element.on('click', this.addChip, this);
    this.remove_Button.element.on('click', this.removeChip, this);
    this.confirm_Button.element.on('click', this.on_confirm_Button, this);

    if (this.scrollBar && this.scrollBar.scrollbar) {
        this.scrollBar.scrollbar.on('set:value', this.onScrollChanged, this);
    }
    else if (this.scrollBar && this.scrollBar.slider) {
        this.scrollBar.slider.on('set:value', this.onScrollChanged, this);
    }

    this.updateChipsUI();
};
ReiseBetController.prototype._setTextIfChanged = function (element, text) {
    if (!element) return;
    const next = text !== undefined && text !== null ? String(text) : '';
    if (element.text !== next) {
        element.text = next;
    }
};

ReiseBetController.prototype.updateValuesForMainUserThatCanBet = function (maxBetValue, minBetValue) {
    // let fixMaxBetValue = 
    // let fixMinBetValue = 
    
    this.maxBet = maxBetValue / 100;
    this.minBet = minBetValue / 100;

    this.currentBet = this.minBet;
    this.updateChipsUI();
}
ReiseBetController.prototype.maxUserValue = function (maxBetValue) {
    let fixMaxBetValue = maxBetValue / 100;
    this.maxBet = fixMaxBetValue;
    if (this.currentBet > this.maxBet) {
        this.currentBet = this.maxBet;
    }
    this.updateChipsUI();
}

ReiseBetController.prototype.minUserValue = function (minBetValue) {
    let fixMinBetValue = minBetValue / 100;
    this.minBet = fixMinBetValue;
    this.currentBet = this.minBet;
    this.updateChipsUI();
}

ReiseBetController.prototype.onScrollChanged = function (value) {
    let inverted = 1 - value;
    this.currentBet = Math.round(this.minBet + inverted * (this.maxBet - this.minBet));
    
    if (this.currentBet < this.minBet) {
        this.currentBet = this.minBet;
    }
    
    this.updateChipsUI();
    this.app.fire('PlaySound_ChipMove');
};

ReiseBetController.prototype.updateChipsUI = function () {

    if (this.minBet > 0 && this.chips_that_Show.length > 0) {
        this.chips_that_Show[0].enabled = true;
    } else {
        if (this.chips_that_Show.length > 0) {
            this.chips_that_Show[0].enabled = false;
        }
    }
    
    var effectiveRange = this.maxBet - this.minBet;
    var currentPosition = this.currentBet - this.minBet;
    
    var fillRatio = effectiveRange > 0 ? currentPosition / effectiveRange : 0;
    
    var chipsToCalculate = this.minBet > 0 ? this.chips_that_Show.length - 1 : this.chips_that_Show.length;
    var startIndex = this.minBet > 0 ? 1 : 0;
    
    var additionalChipsToEnable = Math.round(fillRatio * chipsToCalculate);

    for (let i = startIndex; i < this.chips_that_Show.length; i++) {
        const chipIndexInCalculation = i - startIndex;
        this.chips_that_Show[i].enabled = chipIndexInCalculation < additionalChipsToEnable;
    }

    if (this.show_pot && this.show_pot.element) {
        this._setTextIfChanged(this.show_pot.element, this.currentBet + " / " + this.maxBet);
    }
    if (this.show_Minpot && this.show_Minpot.element) {
        this._setTextIfChanged(this.show_Minpot.element, this.minBet);
    }

    if (this.scrollBar && (this.scrollBar.scrollbar || this.scrollBar.slider)) {
        let newVal = effectiveRange > 0 ? 1 - (currentPosition / effectiveRange) : 1;
        if (this.scrollBar.scrollbar) {
            this.scrollBar.scrollbar.value = newVal;
        } else if (this.scrollBar.slider) {
            this.scrollBar.slider.value = newVal;
        }
    }
};

ReiseBetController.prototype.resetRaiseUI = function () {
    this.currentBet = this.minBet;
    this.updateChipsUI();

    if (this.scrollBar && (this.scrollBar.scrollbar || this.scrollBar.slider)) {
        let resetValue = 1;
        if (this.scrollBar.scrollbar) {
            this.scrollBar.scrollbar.value = resetValue;
        } else if (this.scrollBar.slider) {
            this.scrollBar.slider.value = resetValue;
        }
    }
    if (this.minBet > 0 && this.chips_that_Show.length > 0) {
        this.chips_that_Show[0].enabled = true;
        for (let i = 1; i < this.chips_that_Show.length; i++) {
            this.chips_that_Show[i].enabled = false;
        }
    } else {
        for (let i = 0; i < this.chips_that_Show.length; i++) {
            this.chips_that_Show[i].enabled = false;
        }
    }

    if (this.show_Minpot && this.show_Minpot.element) {
        this._setTextIfChanged(this.show_Minpot.element, this.minBet);
    }
};

ReiseBetController.prototype.addChip = function () {
    if (this.currentBet < this.maxBet) {
        this.currentBet++;
        this.updateChipsUI();
    }
};

ReiseBetController.prototype.removeChip = function () {
    if (this.currentBet > this.minBet) {
        this.currentBet--;
        this.updateChipsUI();
    }
};

ReiseBetController.prototype.setMaxBet = function () {
    this.currentBet = this.maxBet;
    this.updateChipsUI();
};

ReiseBetController.prototype.setFullPot = function () {
    this.setMaxBet();
};

ReiseBetController.prototype.setHalfPot = function () {
    var halfValue = this.minBet + Math.floor((this.maxBet - this.minBet) / 2);
    this.currentBet = halfValue;
    this.updateChipsUI();
};

ReiseBetController.prototype.on_confirm_Button = function () {
    
    this.app.fire('Settings:EnableCurrentButtonsToClickAction');
    let fixBetForBack = this.currentBet * 100;
    this.app.fire('uiButtons:shouldEnableMoneyButton', true);
    if(this.didEventCalledFromRaise == true){
        this.app.fire('RaiseBetController:amountFromRaise', fixBetForBack);
    }else if(this.didEventCalledFromRaise == false){
        this.app.fire('RaiseBetController:amountFromBet', fixBetForBack);
    }else{// per qa do ne rast nevoje
        this.app.fire('RaiseBetController:amountFromRaise', fixBetForBack);
    }
    this.currentBet = this.minBet;
    this.updateChipsUI();
};
ReiseBetController.prototype.fixTextOnRaisePopUP = function (isItRaise) {
    this._setTextIfChanged(this.raise_Bet_Text.element, isItRaise ? "Raise" : "Bet");
}
ReiseBetController.prototype.raiseState = function (isFromRaise) {
    this.didEventCalledFromRaise = isFromRaise;
    this.fixTextOnRaisePopUP(isFromRaise);
    this.raisePopUpUi.enabled = true;
};
