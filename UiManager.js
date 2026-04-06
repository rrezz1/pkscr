var UiManager = pc.createScript('uiManager');


UiManager.attributes.add('buttonsUi', { type: 'entity' });


UiManager.attributes.add('check_Button', { type: 'entity' });
UiManager.attributes.add('bet_Button', { type: 'entity' });
UiManager.attributes.add('fold_Button', { type: 'entity' });
UiManager.attributes.add('confirm_Button', { type: 'entity' });

UiManager.attributes.add('auto_buttonsUi', { type: 'entity' });

UiManager.attributes.add('auto_check_Button', { type: 'entity' });
UiManager.attributes.add('auto_Call_any_Button', { type: 'entity' });
UiManager.attributes.add('auto_fold_Button', { type: 'entity' });

UiManager.attributes.add('auto_check_Button_frame', { type: 'entity' });
UiManager.attributes.add('auto_Call_any_Button_frame', { type: 'entity' });
UiManager.attributes.add('auto_fold_Button_frame', { type: 'entity' });

UiManager.attributes.add('disable_Reise_Ui_Button', { type: 'entity' });


UiManager.attributes.add('button_to_Close_settings', { type: 'entity' });
UiManager.attributes.add('reise_UI', { type: 'entity' });

UiManager.attributes.add('loader', { type: 'entity' });
UiManager.attributes.add('cssLoader', { type: 'asset', assetType: 'css', title: 'Loader CSS File' });



UiManager.attributes.add('playersbet', { type: 'entity', array: true });
UiManager.attributes.add('table_value', { type: 'entity', title: 'table value' });
UiManager.attributes.add('table_backgrouund', { type: 'entity' });
UiManager.attributes.add('pokerChip_BLACK', { type: 'entity' });
UiManager.attributes.add('pokerChip_BLUE', { type: 'entity' });
UiManager.attributes.add('pokerChip_GREEN', { type: 'entity' });
UiManager.attributes.add('pokerChip_RED', { type: 'entity' });
UiManager.attributes.add('pokerChip_YELLOW', { type: 'entity' });

UiManager.prototype.initialize = function () {

    this.app.on('GameManager_UiMenager:EnableDisableButtonsUI', this.isUiEnabled, this);
    this.app.on('GameManager_UiMenager:tableValue', this.changeTablePot, this);
    this.app.on('GameManager:disablePlayerBet', this.disablePlayerBet, this);
    this.app.on('UiButton:disableRaise', this.on_disable_reise_Button, this);
    this.app.on('GameManager:defineIsMainUserPlaying', this.defineIsUser4Playing, this);
    this.app.on('GameManager_RESTARTSCRIPT', this.resetScript, this);

    this.button_to_Close_settings.element.on('click', this.debounce(this.on_disable_reise_Button.bind(this), 0), this);
    this.disable_Reise_Ui_Button.element.on('click', this.debounce(this.on_disable_reise_Button.bind(this), 0), this);

    this.currentChip = null;
    this.chipAnimState = null;
    this.chipScale = new pc.Vec3(1, 1, 1);


    this.check_Button.element.on('click', this.debounce(this.on_check_Button.bind(this), 300), this);
    this.bet_Button.element.on('click', this.debounce(this.on_bet_Button.bind(this), 300), this);
    this.fold_Button.element.on('click', this.debounce(this.on_fold_Button.bind(this), 300), this);
    this.confirm_Button.element.on('click', this.debounce(this.on_confirm_Button.bind(this), 300), this);

    this.isUser4InGame;
    this.buttonNumberThatClicked = 0;

    this.auto_check_Button.element.on(
        'click',
        this.debounce(() => this.on_autoButtonClikced(1), 300),
        this
    );

    this.auto_Call_any_Button.element.on(
        'click',
        this.debounce(() => this.on_autoButtonClikced(2), 300),
        this
    );

    this.auto_fold_Button.element.on(
        'click',
        this.debounce(() => this.on_autoButtonClikced(3), 300),
        this
    );

};
UiManager.prototype.defineIsUser4Playing = function (isUser4Playing) {
    this.isUser4InGame = isUser4Playing;
};
UiManager.prototype.debounce = function (func, wait) {
    return function () {
        var context = this, args = arguments;
        if (!context.isProcessingClick) {
            context.isProcessingClick = true;
            setTimeout(function () {
                func.apply(context, args);
                context.isProcessingClick = false;
            }, wait);
        }
    };
};

UiManager.prototype.isUiEnabled = function (getUiState, dontShowNothing = false) {

    if (getUiState == true && dontShowNothing == false) {
        this.buttonsUi.enabled = true;
        this.on_autoButtonClikced(0);
        this.auto_buttonsUi.enabled = false;
    }
    else if (getUiState == false && dontShowNothing == false) {
        this.buttonsUi.enabled = false;
        this.auto_buttonsUi.enabled = true;
    } else if (dontShowNothing == true) {
        this.buttonsUi.enabled = false;
        this.auto_buttonsUi.enabled = false;
    }
    if (this.isUser4InGame == true) {
        this.app.fire('GameManager_UiMenager:ButtonsState', getUiState, dontShowNothing);
    }

};
UiManager.prototype.changeTablePot = function (potAmount) {
    potAmount = potAmount /100;
    this.table_value.element.text = potAmount.toString();
    this.table_backgrouund.enabled = true;

    this.pokerChip_BLACK.enabled = false;
    this.pokerChip_BLUE.enabled = false;
    this.pokerChip_GREEN.enabled = false;
    this.pokerChip_RED.enabled = false;
    this.pokerChip_YELLOW.enabled = false;

    let chipToEnable = null;

    if (potAmount >= 0 && potAmount <= 350) {
        chipToEnable = this.pokerChip_BLACK;
    } else if (potAmount > 350 && potAmount <= 800) {
        chipToEnable = this.pokerChip_BLUE;
    } else if (potAmount > 800 && potAmount <= 1500) {
        chipToEnable = this.pokerChip_GREEN;
    } else if (potAmount > 1500 && potAmount <= 2000) {
        chipToEnable = this.pokerChip_RED;
    } else if (potAmount > 2000) {
        chipToEnable = this.pokerChip_YELLOW;
    } else {
        chipToEnable = this.pokerChip_BLACK;
    }

    if (chipToEnable) {
        chipToEnable.enabled = true;
        this.startChipAnimation(chipToEnable);
    }
};

UiManager.prototype.startChipAnimation = function (chipEntity) {
    this.currentChip = chipEntity;
    this.chipAnimState = "down";
    this.chipScale.set(1, 1, 1);
    this.currentChip.setLocalScale(this.chipScale);
};
UiManager.prototype.update = function (dt) {
    if (!this.currentChip || !this.chipAnimState) return;

    this.minimumChipsGoInAnim = 0.7;
    this.maximumChipsGoInAnim = 1.4;

    let speed = 10;
    if (this.chipAnimState === "down") {
        this.chipScale.lerp(this.chipScale, new pc.Vec3(this.minimumChipsGoInAnim, this.minimumChipsGoInAnim, this.minimumChipsGoInAnim), dt * speed);
        this.currentChip.setLocalScale(this.chipScale);

        if (this.chipScale.x <= (this.minimumChipsGoInAnim + 0.01)) {
            this.chipAnimState = "up";
        }
    }
    else if (this.chipAnimState === "up") {
        this.chipScale.lerp(this.chipScale, new pc.Vec3(this.maximumChipsGoInAnim, this.maximumChipsGoInAnim, this.maximumChipsGoInAnim), dt * speed);
        this.currentChip.setLocalScale(this.chipScale);

        if (this.chipScale.x >= (this.maximumChipsGoInAnim - 0.01)) {
            this.chipAnimState = "normal";
        }
    }
    else if (this.chipAnimState === "normal") {
        this.chipScale.lerp(this.chipScale, new pc.Vec3(1, 1, 1), dt * speed);
        this.currentChip.setLocalScale(this.chipScale);

        if (Math.abs(this.chipScale.x - 1) < 0.01) {
            // finished
            this.chipAnimState = null;
            this.currentChip = null;
        }
    }
};

UiManager.prototype.disablePlayerBet = function () {
    if (!this.playersbet || this.playersbet.length === 0) {
        return;
    }

    this.playersbet.forEach(function (entity) {
        if (entity && entity.element) {
            let startOpacity = entity.element.opacity;
            let duration = 1;
            let elapsed = 0;

            let script = this;
            let fadeFn = function (dt) {
                elapsed += dt;
                let t = Math.min(elapsed / duration, 1);
                entity.element.opacity = pc.math.lerp(startOpacity, 0, t);

                if (t >= 1) {
                    entity.enabled = false;
                    script.app.off("update", fadeFn);
                }
            };

            this.app.on("update", fadeFn);
        }
    }, this);

};
UiManager.prototype.on_check_Button = function () { this.app.fire('GameManager_UIManager:Check'); };
UiManager.prototype.on_bet_Button = function () {
    this.app.fire('GameManager_UIManager:Bet');
    this.reise_UI.enabled = true;
    this.buttonsUi.enabled = false;

};
UiManager.prototype.on_fold_Button = function () {
    this.app.fire('GameManager_UIManager:Fold');
    // this.app.fire('CameraController_UIManager:Fold');
};
UiManager.prototype.on_confirm_Button = function () {
    this.reise_UI.enabled = false;
    this.app.fire('GameManager_UIManager:ResetRaiseValue');
};

UiManager.prototype.on_disable_reise_Button = function () {
    this.buttonsUi.enabled = true;
    this.reise_UI.enabled = false;
    this.app.fire('Settings:EnableCurrentButtonsToClickAction');
    this.app.fire('PlaySound_ButtonPressed');
    this.app.fire('GameManager_UIManager:ResetRaiseValue');
    this.app.fire('GameManager_UiMenager:ButtonsState', true);
    this.app.fire('uiButtons:shouldEnableMoneyButton', true);
};
UiManager.prototype.on_autoButtonClikced = function (_buttonNumberThatClicked) {

    if (this.buttonNumberThatClicked == _buttonNumberThatClicked)
        _buttonNumberThatClicked = 0;


    this.buttonNumberThatClicked = _buttonNumberThatClicked;

    switch (this.buttonNumberThatClicked) {
        case 0:
            this.auto_check_Button_frame.enabled = false;
            this.auto_Call_any_Button_frame.enabled = false;
            this.auto_fold_Button_frame.enabled = false;
            break;
        case 1:
            this.auto_check_Button_frame.enabled = true;
            this.auto_Call_any_Button_frame.enabled = false;
            this.auto_fold_Button_frame.enabled = false;
            break;
        case 2:
            this.auto_check_Button_frame.enabled = false;
            this.auto_Call_any_Button_frame.enabled = true;
            this.auto_fold_Button_frame.enabled = false;
            break;
        case 3:
            this.auto_check_Button_frame.enabled = false;
            this.auto_Call_any_Button_frame.enabled = false;
            this.auto_fold_Button_frame.enabled = true;
            break;
        default:
            this.auto_check_Button_frame.enabled = false;
            this.auto_Call_any_Button_frame.enabled = false;
            this.auto_fold_Button_frame.enabled = false;
            break;
    }
};
UiManager.prototype.onDestroy = function () {
    if (this.htmlLoaderElement && this.htmlLoaderElement.parentNode) {
        this.htmlLoaderElement.parentNode.removeChild(this.htmlLoaderElement);
        this.htmlLoaderElement = null;
    }

    this.app.off('GameManager_UiMenager:EnableDisableButtonsUI', this.isUiEnabled, this);
    this.app.off('GameManager_UiMenager:tableValue', this.changeTablePot, this);
    this.app.off('GameManager:disablePlayerBet', this.disablePlayerBet, this);
    this.app.off('UiButton:disableRaise', this.on_disable_reise_Button, this);
    this.app.off('GameManager:defineIsMainUserPlaying', this.defineIsUser4Playing, this);
    this.app.off('GameManager_RESTARTSCRIPT', this.resetScript, this);

    // Remove button click event handlers
    if (this.button_to_Close_settings && this.button_to_Close_settings.element) {
        this.button_to_Close_settings.element.off('click');
    }
    if (this.disable_Reise_Ui_Button && this.disable_Reise_Ui_Button.element) {
        this.disable_Reise_Ui_Button.element.off('click');
    }
    if (this.check_Button && this.check_Button.element) {
        this.check_Button.element.off('click');
    }
    if (this.bet_Button && this.bet_Button.element) {
        this.bet_Button.element.off('click');
    }
    if (this.fold_Button && this.fold_Button.element) {
        this.fold_Button.element.off('click');
    }
    if (this.confirm_Button && this.confirm_Button.element) {
        this.confirm_Button.element.off('click');
    }
    if (this.auto_check_Button && this.auto_check_Button.element) {
        this.auto_check_Button.element.off('click');
    }
    if (this.auto_Call_any_Button && this.auto_Call_any_Button.element) {
        this.auto_Call_any_Button.element.off('click');
    }
    if (this.auto_fold_Button && this.auto_fold_Button.element) {
        this.auto_fold_Button.element.off('click');
    }

    this.resetScript();

    this.currentChip = null;
    this.chipAnimState = null;
};

UiManager.prototype.changeTablePot = function (potAmount) {
    if (!this.table_value || !this.table_value.element) {
        return;
    }

    this.table_value.element.text = potAmount/100;

    if (this.table_backgrouund) {
        this.table_backgrouund.enabled = true;
    }

    const chips = [
        this.pokerChip_BLACK,
        this.pokerChip_BLUE,
        this.pokerChip_GREEN,
        this.pokerChip_RED,
        this.pokerChip_YELLOW
    ];

    chips.forEach(chip => {
        if (chip) chip.enabled = false;
    });

    let chipToEnable = null;

    if (potAmount >= 0 && potAmount <= 350) {
        chipToEnable = this.pokerChip_BLACK;
    } else if (potAmount > 350 && potAmount <= 800) {
        chipToEnable = this.pokerChip_BLUE;
    } else if (potAmount > 800 && potAmount <= 1500) {
        chipToEnable = this.pokerChip_GREEN;
    } else if (potAmount > 1500 && potAmount <= 2000) {
        chipToEnable = this.pokerChip_RED;
    } else if (potAmount > 2000) {
        chipToEnable = this.pokerChip_YELLOW;
    } else {
        chipToEnable = this.pokerChip_BLACK;
    }

    if (chipToEnable) {
        chipToEnable.enabled = true;
        this.startChipAnimation(chipToEnable);
    }
};
UiManager.prototype.resetScript = function () {


    if (this.loader) {
        this.loader.enabled = false;
    }

    if (this.htmlLoaderElement && this.htmlLoaderElement.parentNode) {
        this.htmlLoaderElement.parentNode.removeChild(this.htmlLoaderElement);
        this.htmlLoaderElement = null;
    }

    if (this.buttonsUi) {
        this.buttonsUi.enabled = false;
    }

    if (this.auto_buttonsUi) {
        this.auto_buttonsUi.enabled = false;
    }

    if (this.auto_check_Button_frame) {
        this.auto_check_Button_frame.enabled = false;
    }
    if (this.auto_Call_any_Button_frame) {
        this.auto_Call_any_Button_frame.enabled = false;
    }
    if (this.auto_fold_Button_frame) {
        this.auto_fold_Button_frame.enabled = false;
    }
    this.buttonNumberThatClicked = 0;

    if (this.bet_Button) {
        this.bet_Button.enabled = true;
    }
    if (this.reise_UI) {
        this.reise_UI.enabled = false;
    }

    if (this.table_value && this.table_value.element) {
        this.table_value.element.text = "0";
    }

    if (this.table_backgrouund) {
        this.table_backgrouund.enabled = false;
    }

    const chips = [
        this.pokerChip_BLUE,
        this.pokerChip_GREEN,
        this.pokerChip_RED,
        this.pokerChip_YELLOW
    ];

    chips.forEach(chip => {
        if (chip) chip.enabled = false;
    });

    if (this.pokerChip_BLACK) {
        this.pokerChip_BLACK.enabled = true;
        this.startChipAnimation(this.pokerChip_BLACK);
    }

    this.currentChip = null;
    this.chipAnimState = null;
    if (this.chipScale) {
        this.chipScale.set(1, 1, 1);
    }

    if (this.playersbet && this.playersbet.length > 0) {
        this.playersbet.forEach(function (entity) {
            if (entity) {
                entity.enabled = false;
                if (entity.element) {
                    entity.element.opacity = 1;
                }
            }
        });
    }

    this.isProcessingClick = false;
};
