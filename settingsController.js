var SettingsController = pc.createScript('settingsController');

// Attributes
SettingsController.attributes.add('openSettingsButton', { type: 'entity' });
SettingsController.attributes.add('settingsPopUp', { type: 'entity' });
SettingsController.attributes.add('button_to_Close_settings', {type: 'entity'});

SettingsController.attributes.add('resume', { type: 'entity' });
SettingsController.attributes.add('leaveTable', { type: 'entity' });
SettingsController.attributes.add('standUP', { type: 'entity' });
SettingsController.attributes.add('sitOut', { type: 'entity' });
SettingsController.attributes.add('sitIn', { type: 'entity' });
SettingsController.attributes.add('settings', { type: 'entity' });

SettingsController.attributes.add('checkFold', { type: 'entity' });
SettingsController.attributes.add('callAny', { type: 'entity' });

SettingsController.attributes.add('confirmCss', { type: 'asset', assetType: 'css' });

SettingsController.prototype.initialize = function() {
    if (this.confirmCss && this.confirmCss.resource) {
        const style = document.createElement('style');
        style.innerHTML = this.confirmCss.resource;
        document.head.appendChild(style);
    }
    
    this.isUser4InGame;

    this.resume.element.on('click', this.debounce(this.onResumeButtonClicked.bind(this), 300), this);
    this.leaveTable.element.on('click', this.debounce(this.onLeaveTableButtonClicked.bind(this), 300), this);
    this.standUP.element.on('click', this.debounce(this.onStandUPButtonClicked.bind(this), 300), this);
    this.sitOut.element.on('click', this.debounce(this.onSitOutButtonClicked.bind(this), 300), this);
    this.sitIn.element.on('click', this.debounce(this.onSitInButtonClicked.bind(this), 300), this);
    this.settings.element.on('click', this.debounce(this.onSettingsButtonClicked.bind(this), 300), this);
    
    this.checkFold.element.on('click', this.debounce(this.onCheckBetButtonClicked.bind(this), 300), this);
    this.callAny.element.on('click', this.debounce(this.onCallAnyButtonClicked.bind(this), 300), this);
    this.button_to_Close_settings.element.on('click', this.debounce(this.closeSettingsPopUP.bind(this), 300), this);
    
    this.app.on('SettingsController:buttonClickedSettings', this.onSettingsButtonClicked, this);
    this.app.on('SettingsController:SetSitInButtonState', this.updateSitInSitOutButtonState, this);
    this.app.on('MessageController:hidePopUp_Settings', this.hidePopUPSettings, this);
    
    this.app.on('GameManager:defineIsMainUserPlaying', this.defineIsUser4Playing, this);
    this.mainPlayerisSitOut = false;
    this.sitOut.enabled = false;
    this.standUP.enabled = false;
    this.sitIn.enabled = false;
};

SettingsController.prototype.defineIsUser4Playing = function(isUser4Playing) {
    this.isUser4InGame = isUser4Playing;
    this.updateButtons();
};
SettingsController.prototype.debounce = function(func, wait) {
    return function() {
        var context = this, args = arguments;
        if (!context.isProcessingClick) {
            context.isProcessingClick = true;
            setTimeout(function() {
                func.apply(context, args);
                context.isProcessingClick = false;
            }, wait);
        }
    };
};
SettingsController.prototype.updateButtons = function() {

    if(this.isUser4InGame == true){
        if(this.mainPlayerisSitOut == true){
            this.sitOut.enabled = false;
        }else{
            this.sitOut.enabled = true;
        }
        this.standUP.enabled = true;
    }else{
        this.sitOut.enabled = false;
        this.standUP.enabled = false;
    }

};

SettingsController.prototype.updateSitInSitOutButtonState = function(isSitINButtonEnabled) {
    if(isSitINButtonEnabled){//o sit in
        this.mainPlayerisSitOut = false;
        this.sitIn.enabled = false;
        this.sitOut.enabled = true;
    }else{// o sit out
        this.mainPlayerisSitOut = true;
        this.sitIn.enabled = true;
        this.sitOut.enabled = false;
    }
};
SettingsController.prototype.gameConfirm = function(message) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'game-confirm-overlay';
        overlay.innerHTML = `
            <div class="game-confirm-box">
                <div class="game-confirm-message">${message}</div>
                <div class="game-confirm-buttons">
                    <div class="game-confirm-yes">YES</div>
                    <div class="game-confirm-no">NO</div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const yesBtn = overlay.querySelector('.game-confirm-yes');
        const noBtn = overlay.querySelector('.game-confirm-no');

        yesBtn.onclick = () => { 
            overlay.remove(); 
            resolve(true); 
            
            this.app.fire('PlaySound_ButtonPressed');
        };
        noBtn.onclick = () => { 
            overlay.remove(); 
            resolve(false); 
            
            this.app.fire('PlaySound_ButtonPressed');
        };
    });
};

SettingsController.prototype.hidePopUPSettings = function() {
    this.settingsPopUp.enabled = false;
};

SettingsController.prototype.onSettingsButtonClicked = function() {
    this.settingsPopUp.enabled = !this.settingsPopUp.enabled;
    this.app.fire('MessageController:hidePopUp_Message');
    this.app.fire('PlaySound_ButtonPressed');
};

SettingsController.prototype.onResumeButtonClicked = function() {
    this.settingsPopUp.enabled = false;
    this.app.fire('PlaySound_ButtonPressed');
};

// -----------------------------
SettingsController.prototype.onLeaveTableButtonClicked = function() {
    this.gameConfirm("Are you sure you want to leave the table?").then((confirmed) => {
        if (!confirmed) return;
        this.app.fire('SettingsController:LeaveTable');
    this.app.fire('PlaySound_ButtonPressed');
    });
};

SettingsController.prototype.onStandUPButtonClicked = function() {
    this.gameConfirm("Are you sure you want to stand up?").then((confirmed) => {
        if (!confirmed) return;
        this.app.fire('PlaySound_ButtonPressed');

        this.app.fire('SettingsController:StandUp');
        // this.sitOut.enabled = false;
        // this.standUP.enabled = false;
        // this.sitIn.enabled = true;
        this.closeSettingsPopUP();
    });
};

SettingsController.prototype.onSitOutButtonClicked = function() {
    this.gameConfirm("Are you sure you want to sit out?").then((confirmed) => {
        if (!confirmed ) return;
        this.app.fire('PlaySound_ButtonPressed');

        this.app.fire('SettingsController:SitOut');
        // this.sitOut.enabled = false;
        // this.standUP.enabled = true;
        // this.sitIn.enabled = true;
        this.closeSettingsPopUP();
    });
};

SettingsController.prototype.onSitInButtonClicked = function(index) {
    
    // if(this.isUser4InGame == true) return;
    this.gameConfirm("Are you sure you want to sit in?").then((confirmed) => {
        if (!confirmed) return;
    
        this.app.fire('PlaySound_ButtonPressed');
        // this.app.fire('SettingsController:SitIn',index);
        this.app.fire('SettingsController:SitIn');
        // this.app.fire('BalanceManager:enableBuyBalancePopUP',index);
        this.sitOut.enabled = true;
        this.standUP.enabled = true;
        this.sitIn.enabled = false;
        this.closeSettingsPopUP();
    });
};

SettingsController.prototype.onCheckBetButtonClicked = function() {
    this.gameConfirm("Are you sure you want to check/bet?").then((confirmed) => {
        if (!confirmed) return;
    });
};

SettingsController.prototype.onCallAnyButtonClicked = function() {
    this.gameConfirm("Are you sure you want to call?").then((confirmed) => {
        if (!confirmed) return;
    });
};

SettingsController.prototype.closeSettingsPopUP = function() {
    this.settingsPopUp.enabled = false;
    this.app.fire('Settings:EnableCurrentButtonsToClickAction');
};
