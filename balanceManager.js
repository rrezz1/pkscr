var BalanceManager = pc.createScript('balanceManager');



// BalanceManager.attributes.add('enablePopUpButton', { type: 'entity' }); 

BalanceManager.attributes.add('backgrounddisablePopUp', { type: 'entity' }); 
BalanceManager.attributes.add('xBUttondisablePopUp', { type: 'entity' }); 
BalanceManager.attributes.add('balancePopUp', { type: 'entity' }); 
BalanceManager.attributes.add('add_Button', { type: 'entity' });
BalanceManager.attributes.add('remove_Button', { type: 'entity' });
BalanceManager.attributes.add('confirm_Button', { type: 'entity' });
BalanceManager.attributes.add('scrollBar', { type: 'entity' });
BalanceManager.attributes.add('show_pot', { type: 'entity' });

BalanceManager.attributes.add('youreBalance', { type: 'entity' });
BalanceManager.attributes.add('show_Minpot', { type: 'entity' });
BalanceManager.attributes.add('show_Maxpot', { type: 'entity' });

BalanceManager.attributes.add('chips', { type: 'entity', array: true });

BalanceManager.prototype.initialize = function () {
    this.didEventCalledFromAddBalanceButton = false;
    this.minBet = 0;
    this.maxBet = 150;
    this.requestIndexToSitIn = 0;
    this.app.on('BalanceManager:enableBuyBalancePopUP', this.addBalanceState, this);

    this.app.on('BalanceManager:enableBuyBalancePopUP:AddBalanceButton', this.addBalanceStateFromAddBalanceButton, this);
    
    this.app.on('GameManager:getMainUserBalance:AddBalance', this.defineYoureBlance, this);
    
    this.app.on('GameManager:getValuesThatMainUserCanBuyIn:AddBalance', this.defineValue, this);
    
    
    this.app.on('GameManager:getMaxValueThatUserHasInBalance', this.maxUserValue, this);


    this.app.on('GameManager:getMinValueThatUserHasInBalance', this.minUserValue, this);
    // this.app.on('GameManager_UIManager:ResetRaiseValue', this.resetAddBalance, this);
    this.currentBet = 0;


    // this.enablePopUpButton.element.on('click', this.addBalanceState, this);
    this.backgrounddisablePopUp.element.on('click', this.disablePopUp, this);
    this.xBUttondisablePopUp.element.on('click', this.disablePopUp, this);

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
BalanceManager.prototype._setTextIfChanged = function (element, text) {
    if (!element) return;
    const next = text !== undefined && text !== null ? String(text) : '';
    if (element.text !== next) {
        element.text = next;
    }
};
BalanceManager.prototype.defineYoureBlance = function (yourBalanceValue) {
    let fixYourBalanceValue = yourBalanceValue / 100;
    this._setTextIfChanged(this.youreBalance.element, 'Your Balance: ' + fixYourBalanceValue);
}
BalanceManager.prototype.defineValue = function (minBetValue, maxBetValue) {
    let fixMinBetValue = minBetValue/ 100;
    let fixMaxBetValue = maxBetValue / 100;
    this.minUserValue(fixMinBetValue);
    this.maxUserValue(fixMaxBetValue);
}
BalanceManager.prototype.maxUserValue = function (maxBetValue) {
    this.maxBet = maxBetValue;
    if (this.currentBet > this.maxBet) {
        this.currentBet = this.maxBet;
    }
    this.updateChipsUI();
}

BalanceManager.prototype.minUserValue = function (minBetValue) {
    this.minBet = minBetValue;
    this.currentBet = this.minBet;
    this.updateChipsUI();
}

BalanceManager.prototype.onScrollChanged = function (value) {
    this.currentBet = Math.round(this.minBet + value * (this.maxBet - this.minBet));
    
    if (this.currentBet < this.minBet) {
        this.currentBet = this.minBet;
    }
    
    this.app.fire('PlaySound_ChipMove');
    this.updateChipsUI();
};

BalanceManager.prototype.updateChipsUI = function () {
    var effectiveRange = this.maxBet - this.minBet;
    var currentPosition = this.currentBet - this.minBet;
    
    var fillRatio = effectiveRange > 0 ? currentPosition / effectiveRange : 0;
    
    if (this.show_pot && this.show_pot.element) {
        this._setTextIfChanged(this.show_pot.element, this.currentBet);
    }
    if (this.show_Minpot && this.show_Minpot.element) {
        this._setTextIfChanged(this.show_Minpot.element, this.minBet);
    }
    if (this.show_Maxpot && this.show_Maxpot.element) {
        this._setTextIfChanged(this.show_Maxpot.element, this.maxBet);
    }

    if (this.scrollBar && (this.scrollBar.scrollbar || this.scrollBar.slider)) {
        let newVal = effectiveRange > 0 ? currentPosition / effectiveRange : 0;
        if (this.scrollBar.scrollbar) {
            this.scrollBar.scrollbar.value = newVal;
        } else if (this.scrollBar.slider) {
            this.scrollBar.slider.value = newVal;
        }
    }
    
    this.updateChipsBasedOnPercentage(fillRatio);
};

BalanceManager.prototype.updateChipsBasedOnPercentage = function (percentage) {
    var percent = percentage * 100;

    for (var i = 0; i < this.chips.length; i++) {
        if (this.chips[i]) {
            this.chips[i].enabled = false;
        }
    }
    
    if (percent <= 33) {
        if (this.chips[0]) {
            this.chips[0].enabled = true;
        }
    } else if (percent > 33 && percent <= 66) {
        if (this.chips[0]) {
            this.chips[0].enabled = true;
        }
        if (this.chips[1]) {
            this.chips[1].enabled = true;
        }
    } else if (percent > 66) {
        if (this.chips[0]) {
            this.chips[0].enabled = true;
        }
        if (this.chips[1]) {
            this.chips[1].enabled = true;
        }
        if (this.chips[2]) {
            this.chips[2].enabled = true;
        }
    }
    
};

BalanceManager.prototype.resetAddBalance = function () {
    this.currentBet = this.minBet;
    this.updateChipsUI();

    if (this.scrollBar && (this.scrollBar.scrollbar || this.scrollBar.slider)) {
        let resetValue = 0;
        if (this.scrollBar.scrollbar) {
            this.scrollBar.scrollbar.value = resetValue;
        } else if (this.scrollBar.slider) {
            this.scrollBar.slider.value = resetValue;
        }
    }

    if (this.show_Minpot && this.show_Minpot.element) {
        this._setTextIfChanged(this.show_Minpot.element, this.minBet);
    }
};

BalanceManager.prototype.addChip = function () {
    if (this.currentBet < this.maxBet) {
        this.currentBet++;
        this.updateChipsUI();
    }
};

BalanceManager.prototype.removeChip = function () {
    if (this.currentBet > this.minBet) {
        this.currentBet--;
        this.updateChipsUI();
    }
};

BalanceManager.prototype.setMaxBet = function () {
    this.currentBet = this.maxBet;
    this.updateChipsUI();
};

BalanceManager.prototype.setFullPot = function () {
    this.setMaxBet();
};

BalanceManager.prototype.setHalfPot = function () {
    var halfValue = this.minBet + Math.floor((this.maxBet - this.minBet) / 2);
    this.currentBet = halfValue;
    this.updateChipsUI();
};

BalanceManager.prototype.on_confirm_Button = function () {
    
    // this.app.fire('balanceManager:amountFromTheDepositRequest', this.currentBet);
    
    
    // this.app.fire('SettingsController:SitIn', this.requestIndexToSitIn);

    let fixBetAmountForBack = this.currentBet * 100;


    if(this.didEventCalledFromAddBalanceButton == true){
        this.app.fire('balanceManager:MainUserAddedBalance',fixBetAmountForBack);
    }else{
        const positionIndex = window.GameManager.uiToServerIndex(this.requestIndexToSitIn);
        this.app.fire('balanceManager:RequestToSitIn', positionIndex, fixBetAmountForBack);
    }
    this.resetAddBalance();
    
    this.currentBet = this.minBet;
    this.updateChipsUI();
    this.disablePopUp();

    this.didEventCalledFromAddBalanceButton = false;
};
 BalanceManager.prototype.disablePopUp = function () {
    this.app.fire('PlaySound_ButtonPressed');
    this.app.fire('uiButtons:shouldEnableMoneyButton', true);
    // this.resetAddBalance();
    this.app.fire('EnableCurrentButtonsToClickAction');
    this.didEventCalledFromAddBalanceButton = false;
    this.currentBet = this.minBet;
    this.updateChipsUI();
    this.balancePopUp.enabled = false;

};


BalanceManager.prototype.addBalanceStateFromAddBalanceButton = function () {
    this.didEventCalledFromAddBalanceButton = true;
    this.app.fire('uiButtons:shouldEnableMoneyButton', false);
    this.balancePopUp.enabled = true;
};

BalanceManager.prototype.addBalanceState = function (index) {
    this.requestIndexToSitIn = index;
    this.app.fire('uiButtons:shouldEnableMoneyButton', false);
    this.balancePopUp.enabled = true;
};
