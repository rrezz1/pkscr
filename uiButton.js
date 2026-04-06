var UiButton = pc.createScript('uiButton');

UiButton.attributes.add('actionButtonsParent', { type: 'entity', title: 'Action Buttons Parent' });
UiButton.attributes.add('passiveButtonsParent', { type: 'entity', title: 'Passive Buttons Parent' });

UiButton.attributes.add('actionButtons', {
    type: 'json',
    title: 'Action Buttons Data',
    schema: [
        { name: 'text', type: 'string', default: '' },
        { name: 'buttonID', type: 'string', default: '' }
    ],
    array: true
});

UiButton.attributes.add('passiveButtons', {
    type: 'json',
    title: 'Passive Buttons Data',
    schema: [
        { name: 'text', type: 'string', default: '' },
        { name: 'buttonID', type: 'string', default: '' }
    ],
    array: true
});

UiButton.attributes.add('messageIcon', { type: 'asset' });
UiButton.attributes.add('settingsIcon', { type: 'asset' });
UiButton.attributes.add('moneyIcon', { type: 'asset' });
UiButton.attributes.add('buyTimmerIcon', { type: 'asset' });
UiButton.attributes.add('soundIconMute', {type:'asset'});
UiButton.attributes.add('soundIconUnmute', {type:'asset'});
UiButton.attributes.add('messagePOPUP', { type: 'entity' });
UiButton.attributes.add('settingsPOPUP', { type: 'entity' });
UiButton.attributes.add('raisePOPUP', { type: 'entity' });
UiButton.attributes.add('addBalancePOPUP', { type: 'entity' });

UiButton.attributes.add('positionForBuyTimmer', { type: 'entity' });


UiButton.attributes.add('confirmButton', { type: 'entity' });
UiButton.attributes.add('css', { type: 'asset', assetType: 'css', title: 'CSS File' });


UiButton.prototype.initialize = function () {
    this.isUser4InGame;
    this.htmlButtons = [];
    this.checkedButtons = [];
    this.buttonMap = {};
    this.uiEnabled = true;
    this.allDisabled = false;
    this.addBalanceButtonState;
    this.isBuyTimmerButtonEnabled;
    this.isNonClickActive = true;
    this.isBuyTimmerActivated;
    this._pendingActiveActions = null;
    this._pendingPassiveActions = null;
    this._pendingContainerType = null;
    



    if (this.css && this.css.resource) {
        const style = document.createElement('style');
        style.textContent = this.css.resource;
        document.head.appendChild(style);
    }

    this.createStaticLeftButtons();
    this.actionContainer = this.createButtonGroup(this.actionButtonsParent, this.actionButtons, 'action');
    this.passiveContainer = this.createButtonGroup(this.passiveButtonsParent, this.passiveButtons, 'passive');
    this.disableAllButtonsOnStart();
    
   
    // this.shouldEnableAddBalanceButton(false, true);
    // this.setAddBalanceButtonState(true);
    // this.shouldEnableAddBalanceButton(true);
    this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    this.initializeEvents();

    this.updateSoundButtonDisplay(true);
};


UiButton.prototype.initializeEvents = function () {
    this.app.on('GameManager_UiMenager:ButtonsState', this.toggleButtonGroups, this);
    this.app.on('stateOfButtonsFromLandScape', this.stateFromLandsCape, this);
    this.app.on('EnableCurrentButtonsToClickAction', this.enableCurrentButtons, this);
    this.app.on('DisableCurrentButtonsToClickAction', this.disableCurrentButtons, this);

    //MoneyButton
    this.app.on('uiButtons:SetAddBalanceButtonState', this.setAddBalanceButtonState, this);
    this.app.on('uiButtons:shouldEnableMoneyButton', this.shouldEnableAddBalanceButton, this);

    //active passsive button LOGIC
    this.app.on('uiButtons:setNonClick_ActiveButtons', this.setNonClickActiveButtons, this);
    this.app.on('uiButtons:setNonClick_PassiveButtons', this.setNonClickPassiveButtons, this);
    
    //enable buttons - called from GameManager player_turn
    this.app.on('GameManager:ActiveButtons', this.enableThoseActiveButtons, this);
    this.app.on('GameManager:PassiveButtons', this.enableThosePassiveButtons, this);
    
    this.app.on('uiButtons:setCheckButton_Check_Call', this.defineCheckButtonIfIs_Check_Call, this);

    // timmerButton

    this.app.on('uiButtons:ActivateBuyTimmer:InMainPlayerTurn', this.activateBuyTimmerInMainPlayerTurn, this);
    this.app.on('uiButtons:setStateBuyTimmerButton', this.shouldEnableBuyTimmerButton, this);
    this.app.on('GameManager:defineIsMainUserPlaying', this.defineIsUser4Playing, this);
    this.app.on('PLayerManager:Position_UI_Player_Cards',this.updateBuyTimmerBUttonPos, this);

    this.app.on('Settings:EnableCurrentButtonsToClickAction', this.updateUiStateBasedOnPopups, this);
    this.app.on('MessageController:NewMessage', this.showNewMessageAnimationInMessageButton, this);

    // Money button events
    this.app.on('GameManager_RESTARTSCRIPT', this.resetScript, this);
};
UiButton.prototype.defineCheckButtonIfIs_Check_Call = function (isItCheck) {
    
    const checkBtn = this.actionContainer?.querySelector('[data-button-id="ActiveCheckButton"], [data-button-id="ActiveCallButton"]') ||
                    this.buttonMap?.['ActiveCheckButton'] ||
                    this.buttonMap?.['ActiveCallButton'];
    
    if (!checkBtn) {
        console.error('Check/Call button not found!');
        return;
    }
    
    const label = checkBtn.querySelector('.button-label');
    if (!label) {
        console.error('Button label not found!');
        return;
    }
    
    const newText = isItCheck ? 'Check' : 'Call';
    const newButtonID = isItCheck ? 'ActiveCheckButton' : 'ActiveCallButton';
    const oldButtonID = isItCheck ? 'ActiveCallButton' : 'ActiveCheckButton';
    
    if (label.textContent !== newText) {
        label.textContent = newText;
    }
    
    if (checkBtn.getAttribute('data-button-id') !== newButtonID) {
        checkBtn.setAttribute('data-button-id', newButtonID);
    }
    
    if (this.buttonMap[oldButtonID] === checkBtn) {
        delete this.buttonMap[oldButtonID];
    }
    this.buttonMap[newButtonID] = checkBtn;
    
};
UiButton.prototype.setNonClickActiveButtons = function (isCheckActive = false, isRaiseActive = false) {
    const removeFromChecked = (button) => {
        if (button) {
            const index = this.checkedButtons.indexOf(button);
            if (index !== -1) {
                this.checkedButtons.splice(index, 1);
            }
        }
    };

    // Check button logic
    const checkBtn = this.actionContainer?.querySelector('[data-button-id="ActiveCheckButton"], [data-button-id="ActiveCallButton"]') ||
                    this.buttonMap?.['ActiveCheckButton'] ||
                    this.buttonMap?.['ActiveCallButton'];
    if (checkBtn) {
        if (isCheckActive) {
            checkBtn.classList.add('nonClick');
            checkBtn.classList.remove( 'checked');
            removeFromChecked(checkBtn);
        } else {
            checkBtn.classList.remove('nonClick');
        }
    }

    // Raise button logic
    const raiseBtn = this.actionContainer?.querySelector('[data-button-id="ActiveRaiseButton"]') ||
                    this.buttonMap?.['ActiveRaiseButton'];
    if (raiseBtn) {
        if (isRaiseActive) {
            raiseBtn.classList.add('nonClick');
            raiseBtn.classList.remove( 'checked');
            removeFromChecked(raiseBtn);
        } else {
            raiseBtn.classList.remove('nonClick');
        }
    }
};
UiButton.prototype.setNonClickPassiveButtons = function (isCheckActive = false, isRaiseActive = false) {

    if (isCheckActive) {
        const checkBtn = this.passiveContainer?.querySelector('[data-button-id="PassiveCheckButton"]') ||
            this.buttonMap?.['PassiveCheckButton'];
        if (checkBtn) {
            checkBtn.classList.add('nonClick');
            checkBtn.classList.remove('checked');
            
            // Only remove if checkBtn is in checkedButtons array
            const index = this.checkedButtons.indexOf(checkBtn);
            if (index !== -1) {
                this.checkedButtons.splice(index, 1);
            }
        }
    } else {
        const checkBtn = this.passiveContainer?.querySelector('[data-button-id="PassiveCheckButton"]') ||
            this.buttonMap?.['PassiveCheckButton'];
        if (checkBtn) {
            checkBtn.classList.remove('nonClick');
        }
    }

    if (isRaiseActive) {
        const raiseBtn = this.passiveContainer?.querySelector('[data-button-id="PassiveRaiseButton"]') ||
            this.buttonMap?.['PassiveRaiseButton'];
        if (raiseBtn) {
            raiseBtn.classList.add('nonClick');
            raiseBtn.classList.remove('checked');
            
            // Only remove if raiseBtn is in checkedButtons array
            const index = this.checkedButtons.indexOf(raiseBtn);
            if (index !== -1) {
                this.checkedButtons.splice(index, 1);
            }
        }
    } else {
        const raiseBtn = this.passiveContainer?.querySelector('[data-button-id="PassiveRaiseButton"]') ||
            this.buttonMap?.['PassiveRaiseButton'];
        if (raiseBtn) {
            raiseBtn.classList.remove('nonClick');
        }
    }
};

UiButton.prototype.enableThoseActiveButtons = function (validActions, call_amount) {
    const codeToButtonID = {
        104: 'ActiveFoldButton',
        105: 'ActiveCallButton',
        106: 'ActiveCheckButton',
        107: 'ActiveBetButton',
        108: 'ActiveRaiseButton',
        109: 'ActiveAllinButton'
    };

    if (!this.actionContainer || this.isUser4InGame !== true) return;

    // Save pending active state so enableCurrentButtons() can restore it later
    this._pendingActiveActions = { validActions: validActions, call_amount: call_amount };
    this._pendingContainerType = 'active';

    // Set up container visibility
    this.actionContainer.style.display = 'flex';
    if (this.passiveContainer) this.passiveContainer.style.display = 'none';

    // Hide ALL action buttons first
    const allActionButtons = this.actionContainer.querySelectorAll('.poker-button');
    allActionButtons.forEach(btn => {
        btn.classList.add('disabled');
        btn.style.pointerEvents = 'none';
        btn.style.display = 'none';
    });

    const popupOpen = (this.messagePOPUP && this.messagePOPUP.enabled) ||
                      (this.settingsPOPUP && this.settingsPOPUP.enabled) ||
                      (this.raisePOPUP && this.raisePOPUP.enabled) ||
                      (this.addBalancePOPUP && this.addBalancePOPUP.enabled);

    for (let i = 0; i < validActions.length; i++) {
        const code = validActions[i];
        const buttonID = codeToButtonID[code];
        if (!buttonID) continue;

        const btn = this.actionContainer.querySelector(`[data-button-id="${buttonID}"]`) ||
                    this.buttonMap?.[buttonID];
        if (btn) {
            btn.style.display = '';

            if (code === 105 && call_amount !== undefined && call_amount !== null) {
                const label = btn.querySelector('.button-label');
                if (label) label.textContent = 'Call ' + call_amount / 100;
            }

            if (popupOpen) {
                btn.classList.add('disabled');
                btn.style.pointerEvents = 'none';
                btn.style.opacity = '0.4';
            } else {
                btn.classList.remove('disabled');
                btn.style.pointerEvents = 'auto';
                btn.style.opacity = '';
                this.actionContainer.classList.remove('disabled-container');
            }
        }
    }

    if (popupOpen) {
        this.actionContainer.classList.add('disabled-container');
        this.uiEnabled = false;
        this.allDisabled = true;
    } else {
        this.actionContainer.classList.remove('disabled-container');
        this.uiEnabled = true;
        this.allDisabled = false;
    }
};

UiButton.prototype.enableThosePassiveButtons = function (validActions, call_amount) {
    const codeToButtonID = {
        104: 'PassiveFoldButton',
        105: 'PassiveCallButton',
        106: 'PassiveCheckButton',
        107: 'PassiveBetButton',
        108: 'PassiveRaiseButton',
        109: 'PassiveAllinButton'
    };

    if (!this.passiveContainer || this.isUser4InGame !== true) return;

    // Save the pending passive state so enableCurrentButtons() can restore it later
    this._pendingPassiveActions = { validActions: validActions, call_amount: call_amount };
    this._pendingContainerType = 'passive';

    // Set up container visibility
    this.passiveContainer.style.display = 'flex';
    if (this.actionContainer) this.actionContainer.style.display = 'none';

    // Hide ALL passive buttons first
    const allPassiveButtons = this.passiveContainer.querySelectorAll('.poker-button');
    allPassiveButtons.forEach(btn => {
        btn.classList.add('disabled');
        btn.style.pointerEvents = 'none';
        btn.style.display = 'none';
    });

    // Mark which buttons should be active (visible) — but keep them disabled if popup is open
    const popupOpen = (this.messagePOPUP && this.messagePOPUP.enabled) ||
                      (this.settingsPOPUP && this.settingsPOPUP.enabled) ||
                      (this.raisePOPUP && this.raisePOPUP.enabled) ||
                      (this.addBalancePOPUP && this.addBalancePOPUP.enabled);

    for (let i = 0; i < validActions.length; i++) {
        const code = validActions[i];
        const buttonID = codeToButtonID[code];
        if (!buttonID) continue;

        const btn = this.passiveContainer.querySelector(`[data-button-id="${buttonID}"]`) ||
                    this.buttonMap?.[buttonID];
        if (btn) {
            // Always make the button visible in layout
            btn.style.display = '';

            if (code === 105 && call_amount !== undefined && call_amount !== null) {
                const label = btn.querySelector('.button-label');
                if (label) label.textContent = 'Call ' + call_amount;
            }

            if (popupOpen) {
                // Popup is open: keep visually disabled but show the slot
                btn.classList.add('disabled');
                btn.style.pointerEvents = 'none';
                btn.style.opacity = '0.4';
            } else {
                // No popup: enable normally
                btn.classList.remove('disabled');
                btn.style.pointerEvents = 'auto';
                btn.style.opacity = '';
                this.passiveContainer.classList.remove('disabled-container');
            }
        }
    }

    if (popupOpen) {
        this.passiveContainer.classList.add('disabled-container');
        this.uiEnabled = false;
        this.allDisabled = true;
    } else {
        this.passiveContainer.classList.remove('disabled-container');
        this.uiEnabled = true;
        this.allDisabled = false;
    }
};

UiButton.prototype.getActiveButtonById = function (buttonID) {
    const activeContainer = this.getActiveContainer();
    const btn = this.buttonMap?.[buttonID];

    if (!activeContainer || !btn) return null;
    if (!activeContainer.contains(btn)) return null;

    return btn;
};


UiButton.prototype.defineIsUser4Playing = function (isUser4Playing) {
    this.isUser4InGame = isUser4Playing;
    if(isUser4Playing == true)
        this.enableCurrentButtons();
    // else
    //     this.disableCurrentButtons();
};

UiButton.prototype.onKeyDown = function (event) {
    if (event.key === pc.KEY_ESCAPE) {
        this.app.fire('MessageController:hidePopUp_Message');
        this.app.fire('MessageController:hidePopUp_Settings');
        this.app.fire('MessageButton:disableButtons');

        if (this.raisePOPUP.enabled == true) {
            this.app.fire('UiButton:disableRaise');
        }
        if (this.allDisabled == false || this.uiEnabled == false) {
            this.enableCurrentButtons();
        }
    }
};

UiButton.prototype.disableAllButtonsOnStart = function () {
    this.uiEnabled = false;
    this.allDisabled = true;

    if (this.actionContainer) {
        this.actionContainer.classList.add('disabled-container');
        const actionButtons = this.actionContainer.querySelectorAll('.poker-button');
        actionButtons.forEach(btn => btn.classList.add('disabled'));
    }

    if (this.passiveContainer) {
        this.passiveContainer.classList.add('disabled-container');
        const passiveButtons = this.passiveContainer.querySelectorAll('.poker-button');
        passiveButtons.forEach(btn => btn.classList.add('disabled'));
    }
};

UiButton.prototype.showNewMessageAnimationInMessageButton = function () {
    // Find the message button (now third button)
    const messageButton = document.querySelector('.static-left-buttons .square-button:nth-child(1)');
    if (!messageButton) return;

    // Add notification animation class
    messageButton.classList.add('has-notification');

    // Create notification dot element
    let notificationDot = messageButton.querySelector('.notification-dot');
    if (!notificationDot) {
        notificationDot = document.createElement('div');
        notificationDot.className = 'notification-dot';
        messageButton.appendChild(notificationDot);
    }

    // Start pulsing animation
    notificationDot.style.animation = 'notificationPulse 2s infinite';

    // Store reference to remove animation later
    this._messageNotificationDot = notificationDot;
    this._messageButtonWithNotification = messageButton;
};
UiButton.prototype.createStaticLeftButtons = function () {
    const topLeftContainer = document.createElement('div');
    topLeftContainer.className = 'top-left-buttons';
    document.body.appendChild(topLeftContainer);

    // Store the container as a class property so we can access it later
    this._positionForBuyTimmerContainer = document.createElement('div');
    this._positionForBuyTimmerContainer.className = 'position-for-buy-timmer';
    this._positionForBuyTimmerContainer.style.position = 'absolute';

    if (this.positionForBuyTimmer) {
        const screenPos = this.getEntityScreenPosition(this.positionForBuyTimmer);

        this._positionForBuyTimmerContainer.style.left = `${screenPos.x}px`;
        this._positionForBuyTimmerContainer.style.top = `${screenPos.y}px`;
        this._positionForBuyTimmerContainer.style.transform = 'translate(-0%, -100%)';
    }

    document.body.appendChild(this._positionForBuyTimmerContainer);


    const bottomLeftContainer = document.createElement('div');
    bottomLeftContainer.className = 'static-left-buttons';
    document.body.appendChild(bottomLeftContainer);

    const getIconUrl = (asset) => {
        if (!asset) return null;
        if (asset.resource && asset.resource.textureAtlas) {
            const frames = Object.values(asset.resource.frames);
            if (frames.length > 0) return asset.resource.textureAtlas.texture.getFileUrl();
        }
        if (asset.getFileUrl) return asset.getFileUrl();
        return null;
    };

    const messageIcon = getIconUrl(this.messageIcon);
    const settingsIcon = getIconUrl(this.settingsIcon);
    const moneyIcon = getIconUrl(this.moneyIcon);
    const buyTimmerIcon = getIconUrl(this.buyTimmerIcon);
    
    const soundIconMute = getIconUrl(this.soundIconMute);
    const soundIconUnmute = getIconUrl(this.soundIconUnmute); 

  
    if (buyTimmerIcon) {
        const buyTimmer = document.createElement('div');
        buyTimmer.className = 'poker-button square-button';

        buyTimmer.classList.add('disableBuyTimmer');
        buyTimmer.id = 'buyTimmerBUtton';

        const buyTimmerImg = document.createElement('img');
        
buyTimmerImg.style.pointerEvents = 'none';
        buyTimmerImg.src = buyTimmerIcon;
        buyTimmerImg.alt = 'buyTimmer Icon';
        buyTimmerImg.className = 'square-icon-img';

        buyTimmer.appendChild(buyTimmerImg);

        buyTimmer.onclick = () => {
            
            this.app.fire('PlaySound_ButtonPressed');
            this.app.fire('TimmerButton:Clicked');
        };

        this._positionForBuyTimmerContainer.appendChild(buyTimmer);
        this._buyTimmerButton = buyTimmer; // Uncommented
    }

    // Bottom-left: Message and Settings buttons
    const bottomButtons = [
        { id: 'MessageButton', label: 'Message', icon: messageIcon },
        { id: 'SettingsButton', label: 'Settings', icon: settingsIcon }
    ];

    bottomButtons.forEach(btnData => {
        const btn = document.createElement('div');
        btn.className = 'poker-button square-button';
        btn.id = btnData.id;

        if (btnData.icon) {
            const img = document.createElement('img');
            img.src = btnData.icon;
            img.alt = btnData.label + ' Icon';
            img.className = 'square-icon-img';
            btn.appendChild(img);
        } else {
            const fallback = document.createElement('span');
            fallback.textContent = btnData.label[0] || '?';
            fallback.className = 'square-icon';
            btn.appendChild(fallback);
        }

        btn.onclick = () => {
            if (btn.classList.contains('disabled')) return;

            if (btnData.id === 'SettingsButton') {
                this.app.fire('SettingsController:buttonClickedSettings');
                this.app.fire('MessageButton:disableButtons');
                this.updateUiStateBasedOnPopups();
            }
            if (btnData.id === 'MessageButton') {
                this.removeMessageNotification();
                this.app.fire('MessageController:buttonClickedMessage');
                this.updateUiStateBasedOnPopups();
            }
            this.app.fire('PlaySound_ButtonPressed');
        };

        bottomLeftContainer.appendChild(btn);
    });
    if (moneyIcon) {
        const moneyBtn = document.createElement('div');
        moneyBtn.className = 'poker-button square-button';
        moneyBtn.id = 'MoneyButton';

        const moneyImg = document.createElement('img');
        moneyImg.src = moneyIcon;
        moneyImg.style.pointerEvents = 'none';
        moneyImg.alt = 'Money Icon';
        moneyImg.className = 'square-icon-img';

        moneyBtn.appendChild(moneyImg);

        moneyBtn.onclick = () => {
            this.app.fire('BalanceManager:enableBuyBalancePopUP:AddBalanceButton');
            
            this.app.fire('PlaySound_ButtonPressed');
            this.disableCurrentButtons();
        };

        bottomLeftContainer.appendChild(moneyBtn);
        this._addBalanceButton = moneyBtn;
    }
    // if (soundIcon) {
        
        const soundBtn = document.createElement('div');
        soundBtn.className = 'poker-button square-button';
        soundBtn.id = 'soundButton';

        const soundImg = document.createElement('img');
        soundImg.src = soundIconMute;
        soundImg.alt = 'Sound Icon';
        soundImg.className = 'square-icon-img';

        soundBtn.appendChild(soundImg);

        soundBtn.classList.add('muted');

        soundBtn.onclick = () => {
            const isCurrentlyMuted = soundBtn.classList.contains('muted');
            
            if (isCurrentlyMuted) {
                soundImg.src = soundIconUnmute;
                soundBtn.classList.replace('muted', 'unmuted');
                this.app.fire('PlaySound_ShouldMuted', false);
            } else {
                soundImg.src = soundIconMute;
                soundBtn.classList.replace('unmuted', 'muted');
                this.app.fire('PlaySound_ShouldMuted', true);
            }
            
        };
        topLeftContainer.appendChild(soundBtn);
        this._soundButton = soundBtn;
    // }
};

UiButton.prototype.changeMuteButtonIcon = function (entity) {

};
UiButton.prototype.getEntityScreenPosition = function (entity) {
    if (!entity) return { x: 0, y: 0 };

    const worldPos = entity.getPosition();
    const canvas = this.app.graphicsDevice.canvas;

    if (!canvas) {
        return { x: 0, y: 0 };
    }

    const canvasRect = canvas.getBoundingClientRect();

    // Get the actual rendered canvas size
    const canvasWidth = canvas.clientWidth || canvas.width;
    const canvasHeight = canvas.clientHeight || canvas.height;

    // Normalize world coordinates
    const normalizedX = (worldPos.x + 1) / 2;
    const normalizedY = (-worldPos.y + 1) / 2;

    // Calculate screen position
    const x = canvasRect.left + (normalizedX * canvasWidth);
    const y = canvasRect.top + (normalizedY * canvasHeight);

    return { x, y };
};



// UiButton.prototype.removeMoneyNotification = function () {
//     if (this._moneyNotificationDot) {
//         this._moneyNotificationDot.remove();
//         this._moneyNotificationDot = null;
//     }

//     if (this._addBalanceButtonWithNotification) {
//         this._addBalanceButtonWithNotification.classList.remove('has-notification');
//         this._addBalanceButtonWithNotification = null;
//     }

//     const existingDots = this._addBalanceButton?.querySelectorAll('.notification-dot');
//     existingDots?.forEach(dot => dot.remove());
// };

UiButton.prototype.removeMessageNotification = function () {
    // Remove notification dot if it exists
    if (this._messageNotificationDot) {
        this._messageNotificationDot.remove();
        this._messageNotificationDot = null;
    }

    // Remove notification class from button
    if (this._messageButtonWithNotification) {
        this._messageButtonWithNotification.classList.remove('has-notification');
        this._messageButtonWithNotification = null;
    }

    // Also remove any notification dots from DOM
    const existingDots = document.querySelectorAll('.notification-dot');
    existingDots.forEach(dot => dot.remove());

    const messageButtons = document.querySelectorAll('.static-left-buttons .square-button:first-child');
    messageButtons.forEach(btn => btn.classList.remove('has-notification'));
};

UiButton.prototype.setAddBalanceButtonState = function (allowed) {
    this.addBalanceButtonState = allowed;
    this.shouldEnableAddBalanceButton(allowed)
};

UiButton.prototype.shouldEnableAddBalanceButton = function (enable, isInInitialize = false) {
    if (!this._addBalanceButton) {
        return;
    }

    const stateCheck = isInInitialize ? true : this.addBalanceButtonState == true;

    if (enable && this.messagePOPUP.enabled == false && this.settingsPOPUP.enabled == false && stateCheck) {
        this._addBalanceButton.classList.remove('disableMoneyIcon');
        this._addBalanceButton.style.pointerEvents = 'auto';
        this._addBalanceButton.style.opacity = '1';
        this._addBalanceButton.style.filter = 'none';
    } else {
        this._addBalanceButton.classList.add('disableMoneyIcon');
        this._addBalanceButton.style.pointerEvents = 'none';
        this._addBalanceButton.style.opacity = '0';
        this._addBalanceButton.style.filter = 'grayscale(100%) brightness(0.8)';
    }
};
UiButton.prototype.activateBuyTimmerInMainPlayerTurn = function (enable) {
    this.isBuyTimmerActivated = enable;
};
UiButton.prototype.shouldEnableBuyTimmerButton = function (enable) {
    if (!this._buyTimmerButton || this.isBuyTimmerActivated == false) {
        return;
    }


    if (enable) {
        if (this.positionForBuyTimmer) {
            const screenPos = this.getEntityScreenPosition(this.positionForBuyTimmer);

            this._positionForBuyTimmerContainer.style.left = `${screenPos.x}px`;
            this._positionForBuyTimmerContainer.style.top = `${screenPos.y}px`;
            this._positionForBuyTimmerContainer.style.transform = 'translate(-0%, -50%)';
        }

        this.isBuyTimmerButtonEnabled = true;

        if (this.messagePOPUP.enabled == false && this.settingsPOPUP.enabled == false && this.raisePOPUP.enabled == false && this.addBalancePOPUP.enabled == false) {
            this.updateTimmerButtonDisplay(true);
        }
    } else {
        this.isBuyTimmerButtonEnabled = false;

        this.updateTimmerButtonDisplay(false);
    }
};
UiButton.prototype.updateBuyTimmerBUttonPos = function () {
  if (this.positionForBuyTimmer) {
            const screenPos = this.getEntityScreenPosition(this.positionForBuyTimmer);

            this._positionForBuyTimmerContainer.style.left = `${screenPos.x}px`;
            this._positionForBuyTimmerContainer.style.top = `${screenPos.y}px`;
            this._positionForBuyTimmerContainer.style.transform = 'translate(-0%, -50%)';
    }
};


UiButton.prototype.updateTimmerButtonDisplay = function (didButtonNeedToEnable) {
    if (this.isBuyTimmerButtonEnabled == true && didButtonNeedToEnable == true) {
        this._buyTimmerButton.classList.remove('disableBuyTimmer');
        this._buyTimmerButton.style.pointerEvents = 'auto';
        this._buyTimmerButton.style.opacity = '1';
        this._buyTimmerButton.style.filter = 'none';
    } else {
        this._buyTimmerButton.classList.add('disableBuyTimmer');
        this._buyTimmerButton.style.pointerEvents = 'none';
        this._buyTimmerButton.style.opacity = '0';
        this._buyTimmerButton.style.filter = 'grayscale(100%) brightness(0.8)';
    }


}
UiButton.prototype.updateSoundButtonDisplay = function (didButtonNeedToEnable) {
    if (didButtonNeedToEnable == true) {
        this._soundButton.classList.remove('disableBuyTimmer');
        this._soundButton.style.pointerEvents = 'auto';
        this._soundButton.style.opacity = '1';
        this._soundButton.style.filter = 'none';
    } else {
        this._soundButton.classList.add('disableBuyTimmer');
        this._soundButton.style.pointerEvents = 'none';
        this._soundButton.style.opacity = '0';
        this._soundButton.style.filter = 'grayscale(100%) brightness(0.8)';
    }


}
UiButton.prototype.updateUiStateBasedOnPopups = function () {
    if ((this.messagePOPUP && this.messagePOPUP.enabled) ||
        (this.settingsPOPUP && this.settingsPOPUP.enabled) ||
        (this.raisePOPUP && this.raisePOPUP.enabled) ||
        (this.addBalancePOPUP && this.addBalancePOPUP.enabled)) {
        this.disableCurrentButtons();
        return;
    }

    this.enableCurrentButtons();
};

UiButton.prototype.disableCurrentButtons = function () {
    this.uiEnabled = false;
    this.allDisabled = true;
    
    this.app.fire('GameActionNotifier:stateShow', false);
    this.shouldEnableAddBalanceButton(false);
    this.updateTimmerButtonDisplay(false);
    this.updateSoundButtonDisplay(false);
    const activeContainer = this.getActiveContainer();
    if (activeContainer) {
        activeContainer.classList.add('disabled-container');
        const buttons = activeContainer.querySelectorAll('.poker-button');
        buttons.forEach(btn => btn.classList.add('disabled'));
    }
};

UiButton.prototype.enableCurrentButtons = function () {
    
    this.updateSoundButtonDisplay(true);
    this.shouldEnableAddBalanceButton(true);
    this.app.fire('GameActionNotifier:stateShow', true);
    if (this.isUser4InGame == false)
        return;

    this.updateTimmerButtonDisplay(true);
    this.uiEnabled = true;
    this.allDisabled = false;

    // If we have a saved pending state (set while a popup was open), restore it now
    if (this._pendingContainerType === 'passive' && this._pendingPassiveActions) {
        this.enableThosePassiveButtons(
            this._pendingPassiveActions.validActions,
            this._pendingPassiveActions.call_amount
        );
        return;
    }
    if (this._pendingContainerType === 'active' && this._pendingActiveActions) {
        this.enableThoseActiveButtons(
            this._pendingActiveActions.validActions,
            this._pendingActiveActions.call_amount
        );
        return;
    }

    const activeContainer = this.getActiveContainer();
    if (activeContainer) {
        activeContainer.classList.remove('disabled-container');
        const buttons = activeContainer.querySelectorAll('.poker-button');
        buttons.forEach(btn => {
            btn.classList.remove('disabled');
            btn.style.opacity = '';
            btn.style.pointerEvents = 'auto';
        });
    }
};

UiButton.prototype.getActiveContainer = function () {
    if (this.actionContainer && this.actionContainer.style.display === 'flex') return this.actionContainer;
    if (this.passiveContainer && this.passiveContainer.style.display === 'flex') return this.passiveContainer;
    return null;
};

UiButton.prototype.createButtonGroup = function (parentEntity, buttonList, typeName) {
    let parentElement = parentEntity?.element?._domElement || document.createElement('div');
    if (!parentEntity?.element?._domElement) {
        document.body.appendChild(parentElement);
        this._customParentDOM = parentElement;
    }

    parentElement.style.zIndex = 1000;
    const container = document.createElement('div');
    container.className = `poker-button-container ${typeName}-buttons`;
    parentElement.appendChild(container);

    for (let i = 0; i < buttonList.length; i++) {
        const data = buttonList[i];
        const el = document.createElement('div');
        el.className = 'poker-button';

        // SET DATA ATTRIBUTE FOR EASY QUERYING
        const buttonID = data.buttonID || `${typeName}-button${i + 1}`;
        el.setAttribute('data-button-id', buttonID);

        // STORE IN BUTTON MAP IMMEDIATELY
        this.buttonMap[buttonID] = el;

        let checkbox = null;
        if (typeName === 'passive') {
            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'checkbox-inside';
            checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'passive-checkbox';
            checkbox.disabled = true;
            checkboxContainer.appendChild(checkbox);
            el.appendChild(checkboxContainer);
        }

        const label = document.createElement('span');
        label.className = 'button-label';
        label.textContent = data.text || `Button ${i + 1}`;
        el.appendChild(label);

       el.onclick = () => {
        if (!this.uiEnabled || this.allDisabled) {
            this.app.fire('PlaySound:NonClick');
            return;
        }
    
    this.app.fire('PlaySound_ButtonPressed');
    const currentButtonID = el.getAttribute('data-button-id');
    
    this.app.fire('UiButton:Clicked', currentButtonID);

    if (typeName === 'passive' && checkbox) {
        const isChecked = checkbox.checked;
        const allCheckboxes = container.querySelectorAll('.passive-checkbox');
        allCheckboxes.forEach(cb => {
            cb.checked = false;
            cb.disabled = true;
            cb.parentElement.parentElement.classList.remove('checked');
            this.checkedButtons = [];
        });

        if (isChecked) {
            checkbox.checked = false;
            checkbox.disabled = true;
            el.classList.remove('checked');
            this.checkedButtons = [];
            this.app.fire('UiButton:PassiveUnselected', currentButtonID);
            return;
        }

        checkbox.disabled = false;
        checkbox.checked = true;
        el.classList.add('checked');
        this.checkedButtons.push(el);
        this.app.fire('UiButton:PassiveSelected', currentButtonID);
    }

    if (typeName === 'action') {
        const allActions = container.querySelectorAll('.poker-button');
        allActions.forEach(btn => btn.classList.remove('active-pressed'));
        el.classList.add('active-pressed');
        setTimeout(() => el.classList.remove('active-pressed'), 1000);
    }

    // Use currentButtonID instead of the captured buttonID
    if (currentButtonID === 'ActiveCheckButton') {
        this.app.fire('GameManager_UIManager:Check');
    }
    if(currentButtonID === 'ActiveCallButton') {
        this.app.fire('GameManager_UIManager:Call');
    }
    if(currentButtonID === 'ActiveAllinButton') {
        this.app.fire('GameManager_UIManager:AllIn');
    }
    
    if (currentButtonID === 'ActiveRaiseButton') {
        // this.app.fire("GameManager:getValuesThatMainUserCanBet:Raise");
        this.app.fire('RaiseController:enableRaisePopUP', true);
        this.disableCurrentButtons();
    }
    if (currentButtonID === 'ActiveBetButton') {
        this.app.fire('RaiseController:enableRaisePopUP', false);
        this.disableCurrentButtons();
    }
    if (currentButtonID === 'ActiveFoldButton') this.app.fire('GameManager_UIManager:Fold');
    this.app.fire('PlaySound_ButtonPressed');
};

        container.appendChild(el);
        this.htmlButtons.push(el);
    }

    return container;
};

UiButton.prototype.toggleButtonGroups = function (state, dontShowNothing) {
    if (document.hidden) {
        setTimeout(() => this.toggleButtonGroups(state, dontShowNothing), 100);
        return;
    }
    
    if (!this.actionContainer && !this.passiveContainer) return;

    if (state === false) {
        this._pendingActiveActions = null;
        this._pendingPassiveActions = null;
        this._pendingContainerType = null;
    }

    this.allDisabled = false;
    this.uiEnabled = true;

    if (this.actionContainer) {
        this.actionContainer.style.display = state ? 'flex' : 'none';
        this.actionContainer.classList.remove('disabled-container');
    }

    if (this.passiveContainer) {
        // was ? 'flex' : 'none'.
        this.passiveContainer.style.display = state ? 'none' : 'none'; 
        this.passiveContainer.classList.remove('disabled-container');
    }
    
    if (state == true) {
        this.checkIfAnyPassiveButtonWasClicked();
    }
    const passiveCheckboxes = document.querySelectorAll('.passive-checkbox');
    passiveCheckboxes.forEach(cb => {
        cb.disabled = true;
        cb.checked = false;
    });

    this.htmlButtons.forEach(el => {
        el.classList.remove('disabled', 'checked');
    });

    if ((this.settingsPOPUP && this.settingsPOPUP.enabled) ||
        (this.messagePOPUP && this.messagePOPUP.enabled) ||
        (this.addBalancePOPUP && this.addBalancePOPUP.enabled)||
        (this.raisePOPUP && this.raisePOPUP.enabled) || 
        dontShowNothing == true || this.isUser4InGame == false) {
        this.disableCurrentButtons();
    }
};
UiButton.prototype.checkIfAnyPassiveButtonWasClicked = function () {
    if (this.checkedButtons.length > 0) {
        const buttonChecked = this.checkedButtons[0];
        if (buttonChecked) {
            const buttonID = buttonChecked.getAttribute('data-button-id');

            if (buttonID == 'PassiveCheckButton') {
                this.app.fire('GameManager_UIManager:Check');
            } else if (buttonID == 'PassiveRaiseButton') {
                this.app.fire('GameManager_UIManager:Call', 50);
            } else if (buttonID == 'PassiveFoldButton') {
                this.app.fire('GameManager_UIManager:Fold');
            }
            this.checkedButtons = [];
            return buttonID;
        }
    }
    return null;
};

UiButton.prototype.stateFromLandsCape = function (isItCurrect) {
    if (isItCurrect === true) {
        this.updateUiStateBasedOnPopups();

        // Enable all square buttons
        const allSquareButtons = document.querySelectorAll('.square-button');
        allSquareButtons.forEach(btn => {
            btn.classList.remove('disabled');
            btn.style.pointerEvents = 'auto';
            btn.style.opacity = '1';
            btn.style.filter = 'none';
        });

        this.shouldEnableAddBalanceButton(true);
    } else {
        this.disableCurrentButtons();

        // Disable all square buttons
        const allSquareButtons = document.querySelectorAll('.square-button');
        allSquareButtons.forEach(btn => {
            btn.classList.add('disabled');
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0.5';
            btn.style.filter = 'grayscale(100%) brightness(0.8)';

        });

        this.shouldEnableAddBalanceButton(false);
    }
};
UiButton.prototype.resetScript = function () {
    this.checkedButtons = [];
    this._pendingActiveActions = null;
    this._pendingPassiveActions = null;
    this._pendingContainerType = null;
};
UiButton.prototype.onDestroy = function () {
    this.app.off('GameManager_UiMenager:ButtonsState', this.toggleButtonGroups, this);
    [this.actionContainer, this.passiveContainer].forEach(container => {
        if (container?.parentNode) container.parentNode.removeChild(container);
    });
    if (this._customParentDOM?.parentNode)
        this._customParentDOM.parentNode.removeChild(this._customParentDOM);

    // this.app.off('GameManager_UiMenager:ButtonsState', this.toggleButtonGroups, this);
    this.app.off('stateOfButtonsFromLandScape', this.stateFromLandsCape, this);
    this.app.off('EnableCurrentButtonsToClickAction', this.enableCurrentButtons, this);
    this.app.off('DisableCurrentButtonsToClickAction', this.disableCurrentButtons, this);

    this.app.off('GameManager:defineIsMainUserPlaying', this.defineIsUser4Playing, this);
    this.app.off('Settings:EnableCurrentButtonsToClickAction', this.updateUiStateBasedOnPopups, this);
    this.app.off('MessageController:NewMessage', this.showNewMessageAnimationInMessageButton, this);

};