var MessageButton = pc.createScript('messageButton');

MessageButton.attributes.add('messageButtonCss', { type: 'asset', assetType: 'css' });
MessageButton.attributes.add('buttonsParent', { type: 'entity', title: 'Buttons Parent' });

MessageButton.prototype.initialize = function() {
    if (this.messageButtonCss && this.messageButtonCss.resource) {
        const style = document.createElement('style');
        style.innerHTML = this.messageButtonCss.resource;
        document.head.appendChild(style);
    }

    this.buttons = [];
    this.isEnabled = false;
    this.cooldownActive = false;

    this._setUpEvents();
    
    this.container = this.createButtonContainer();
    
    this.disableButtons();
    
    const messages = ["Loj e mire", "phaa", "fat","uhuuu", "keq", "OK","JACKPOT"];
    this.setMessage(messages);
};

MessageButton.prototype.createButtonContainer = function() {
    let parentElement;
    
    if (this.buttonsParent && this.buttonsParent.element && this.buttonsParent.element._domElement) {
        parentElement = this.buttonsParent.element._domElement;
    } else {
        parentElement = document.createElement('div');
        document.body.appendChild(parentElement);
        this._customParentDOM = parentElement;
    }

    parentElement.style.zIndex = '1000';
    
    const container = document.createElement('div');
    container.className = 'message-button-container';
    parentElement.appendChild(container);
    
    return container;
};

MessageButton.prototype._setUpEvents = function() {
    this.app.off('MessageButton:setMessage', this.setMessage, this);
    this.app.off('MessageButton:enableButtons', this.enableButtons, this);
    this.app.off('MessageButton:disableButtons', this.disableButtons, this);
    this.app.off('MessageButton:clearButtons', this.clearButtons, this);

    this.app.on('MessageButton:setMessage', this.setMessage, this);
    this.app.on('MessageButton:enableButtons', this.enableButtons, this);
    this.app.on('MessageButton:disableButtons', this.disableButtons, this);
    this.app.on('MessageButton:clearButtons', this.clearButtons, this);
};

MessageButton.prototype.setMessage = function(messageData) {
    this.clearButtons();

    if (!messageData || !Array.isArray(messageData)) {
        return;
    }

    this.createButtons(messageData);
    
    if (this.isEnabled) {
        this.enableButtons();
    } else {
        this.disableButtons();
    }
};

MessageButton.prototype.createButtons = function(messages) {
    this.buttons = [];

    messages.forEach((message, index) => {
        const button = document.createElement('div');
        button.className = 'message-button';
        
        const label = document.createElement('span');
        label.className = 'message-button-label';
        label.textContent = message;
        button.appendChild(label);

        button.messageValue = message;

        button.onclick = () => {
            if (!this.isEnabled || this.cooldownActive) {
                this.app.fire('PlaySound:NonClick');
                return;
            }
            
                this.app.fire('PlaySound_ButtonPressed');
            
            // this.on_MessageButtonClicked_SendGameManagerText(button);
            this.on_MessageButtonClicked_SendGameManagerValue(button);
        };

        this.container.appendChild(button);
        this.buttons.push(button);
    });
};
MessageButton.prototype.on_MessageButtonClicked_SendGameManagerValue = function(button) {
    const position = this.buttons.indexOf(button);

    this.app.fire('GameManager_Message:NewMessageCalled', position);

    this.startCooldown();
};
MessageButton.prototype.on_MessageButtonClicked_SendGameManagerText = function(button) {
    const value = button.messageValue;
    
    this.app.fire('GameManager_Message:NewMessageCalled', value);

    this.startCooldown();
};

MessageButton.prototype.startCooldown = function() {
    if (this.cooldownActive) return;
    
    this.cooldownActive = true;
    
    this.buttons.forEach(button => {
        button.classList.add('cooldown');
    });

    setTimeout(() => {
        this.cooldownActive = false;
        
        this.buttons.forEach(button => {
            button.classList.remove('cooldown');
        });
    }, 3000);
};

MessageButton.prototype.enableButtons = function() {
    this.isEnabled = true;
    
    this.container.style.display = 'flex';
    this.buttons.forEach(button => {
        button.style.display = 'flex';
        button.style.pointerEvents = 'auto';
        button.style.opacity = '1';
    });
};

MessageButton.prototype.disableButtons = function() {
    this.isEnabled = false;
    
    this.container.style.display = 'none';
    this.buttons.forEach(button => {
        button.style.display = 'none';
        button.style.pointerEvents = 'none';
        button.style.opacity = '0';
    });
};

MessageButton.prototype.clearButtons = function() {
    this.buttons.forEach(button => {
        if (button.parentNode) {
            button.parentNode.removeChild(button);
        }
    });
    
    this.buttons = [];
};

MessageButton.prototype.destroy = function() {
    this.clearButtons();
    if (this._customParentDOM?.parentNode) {
        this._customParentDOM.parentNode.removeChild(this._customParentDOM);
    }
    
    this.app.off('MessageButton:setMessage', this.setMessage, this);
    this.app.off('MessageButton:enableButtons', this.enableButtons, this);
    this.app.off('MessageButton:disableButtons', this.disableButtons, this);
    this.app.off('MessageButton:clearButtons', this.clearButtons, this);
};