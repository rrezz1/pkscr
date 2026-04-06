var ShowMessage = pc.createScript('showMessage');

ShowMessage.attributes.add('messageCss', { type: 'asset', assetType: 'css' });
ShowMessage.attributes.add('messagesParent', { type: 'entity', title: 'Messages Parent' });

ShowMessage.prototype.initialize = function() {
    if (this.messageCss && this.messageCss.resource) {
        const style = document.createElement('style');
        style.innerHTML = this.messageCss.resource;
        document.head.appendChild(style);
    }
this.textsArray = [
    'Raising the stakes!',
    'All in, baby!',
    'Nice bluff... or was it?',
    'Read \'em and weep!',
    'The cards never lie.',
    'Feeling lucky tonight!',
    'Fold or glory, your choice.',
    'That river card changed everything!',
    'Poker face activated.',
    'Winner takes all!'
];
    this.messages = [];
    this.maxMessages = 20;
    this.isEnabled = false;

    this.container = this.createMessageContainer();
    
    this.app.on('GameManager_Message:addMessage', this.addNewMessage, this);

    this.app.on('GameManager_Message:AddNeMessage', this.onaddNewMessage, this);
    
    this.app.on('MessageButton:enableButtons', this.enableMessages, this);
    this.app.on('MessageButton:disableButtons', this.disableMessages, this);
    
    this.disableMessages();
    
};

ShowMessage.prototype.onaddNewMessage = function(name, textPosition, time, isOtherMessageUser = true) {
    
    if (isOtherMessageUser == true) {
        this.app.fire('MessageController:NewMessage');
        this.app.fire('PlaySound_NewMessage');
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = 'message-item';
    
    const headerElement = document.createElement('div');
    headerElement.className = 'message-header';
    
    const nameElement = document.createElement('div');
    nameElement.className = 'message-name';
    nameElement.textContent = name + ':';
    
    const timeElement = document.createElement('div');
    timeElement.className = 'message-time';
    timeElement.textContent = time;
    
    headerElement.appendChild(nameElement);
    headerElement.appendChild(timeElement);
    
    const textElement = document.createElement('div');
    textElement.className = 'message-text';
    textElement.textContent = this.textsArray[textPosition];
    
    messageElement.appendChild(headerElement);
    messageElement.appendChild(textElement);
    
    this.container.appendChild(messageElement);
    this.messages.push(messageElement);
    
    if (this.messages.length > this.maxMessages) {
        const oldestMessage = this.messages.shift();
        if (oldestMessage.parentNode) {
            oldestMessage.parentNode.removeChild(oldestMessage);
        }
    }
    
    this.forceScrollToBottom();
    
    messageElement.style.animation = 'messageSlideIn 0.3s ease-out';
};
ShowMessage.prototype.createMessageContainer = function() {
    let parentElement;
    
    if (this.messagesParent && this.messagesParent.element && this.messagesParent.element._domElement) {
        parentElement = this.messagesParent.element._domElement;
    } else {
        parentElement = document.createElement('div');
        document.body.appendChild(parentElement);
        this._customParentDOM = parentElement;
    }

    parentElement.style.zIndex = '9998';
    
    const container = document.createElement('div');
    container.className = 'message-display-container';
    parentElement.appendChild(container);
    
    return container;
};

ShowMessage.prototype.enableMessages = function() {
    this.isEnabled = true;
    this.container.style.display = 'flex';
    this.container.style.visibility = 'visible';
    this.container.style.opacity = '1';
};

ShowMessage.prototype.disableMessages = function() {
    this.isEnabled = false;
    this.container.style.display = 'none';
    this.container.style.visibility = 'hidden';
    this.container.style.opacity = '0';
};

ShowMessage.prototype.addNewMessage = function(name, text, time, isOtherMessageUser = true) {
    
    if (isOtherMessageUser == true) {
        this.app.fire('MessageController:NewMessage');
        this.app.fire('PlaySound_NewMessage');
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = 'message-item';
    
    const headerElement = document.createElement('div');
    headerElement.className = 'message-header';
    
    const nameElement = document.createElement('div');
    nameElement.className = 'message-name';
    nameElement.textContent = name + ':';
    
    const timeElement = document.createElement('div');
    timeElement.className = 'message-time';
    timeElement.textContent = time;
    
    headerElement.appendChild(nameElement);
    headerElement.appendChild(timeElement);
    
    const textElement = document.createElement('div');
    textElement.className = 'message-text';
    textElement.textContent = text;
    
    messageElement.appendChild(headerElement);
    messageElement.appendChild(textElement);
    
    this.container.appendChild(messageElement);
    this.messages.push(messageElement);
    
    if (this.messages.length > this.maxMessages) {
        const oldestMessage = this.messages.shift();
        if (oldestMessage.parentNode) {
            oldestMessage.parentNode.removeChild(oldestMessage);
        }
    }
    
    this.forceScrollToBottom();
    
    messageElement.style.animation = 'messageSlideIn 0.3s ease-out';
};

ShowMessage.prototype.forceScrollToBottom = function() {
    setTimeout(() => {
        this.container.scrollTop = this.container.scrollHeight;
        
        const scrollToBottom = () => {
            this.container.scrollTop = this.container.scrollHeight;
        };
        
        scrollToBottom();
        setTimeout(scrollToBottom, 50);
        setTimeout(scrollToBottom, 100);
    }, 10);
};

ShowMessage.prototype.removeMessage = function(messageElement) {
    const index = this.messages.indexOf(messageElement);
    if (index > -1) {
        this.messages.splice(index, 1);
    }
    
    if (messageElement.parentNode) {
        messageElement.style.animation = 'messageSlideOut 0.3s ease-in';
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 300);
    }
};

ShowMessage.prototype.clearAllMessages = function() {
    
    this.messages.forEach(message => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    });
    
    this.messages = [];
};

ShowMessage.prototype.destroy = function() {
    this.clearAllMessages();
    if (this._customParentDOM?.parentNode) {
        this._customParentDOM.parentNode.removeChild(this._customParentDOM);
    }
    
    this.app.off('GameManager_Message:addMessage', this.addNewMessage, this);
    this.app.off('MessageButton:enableButtons', this.enableMessages, this);
    this.app.off('MessageButton:disableButtons', this.disableMessages, this);
};

