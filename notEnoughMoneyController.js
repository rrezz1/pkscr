var NotEnoughMoneyController = pc.createScript('notEnoughMoneyController');

NotEnoughMoneyController.prototype.initialize = function() {
    this.app.on('GameManager:NotEnoughMoney_Enable', this.showHTMLPopup, this);
    
    this.app.on('GameManager:NotEnoughMoney_Disable', this.disableNotEnoughMoneyPopUp, this);
    this.createHTMLPopup();
};

NotEnoughMoneyController.prototype.createHTMLPopup = function() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'money-popup-overlay';
    this.overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #000000;
        display: none;
        z-index: 99999;
        justify-content: center;
        align-items: center;
    `;
    
    this.htmlPopup = document.createElement('div');
    this.htmlPopup.style.cssText = `
        background-color: #1a1a1a;
        padding: 50px 60px;
        border-radius: 12px;
        text-align: center;
        min-width: 450px;
        border: 2px solid #333;
        box-shadow: 0 10px 30px rgba(0,0,0,0.8);
    `;
    
    var title = document.createElement('h2');
    title.textContent = 'Ju nuk keni mjaftueshëm para';
    title.style.cssText = `
        color: #ffffff;
        margin-bottom: 40px;
        font-family: 'Segoe UI', Arial, sans-serif;
        font-size: 28px;
        font-weight: 600;
        text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    `;
    
    var buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        justify-content: space-between;
        gap: 30px;
        margin-top: 30px;
    `;
    
    this.giveMoneyHtmlButton = document.createElement('button');
    this.giveMoneyHtmlButton.textContent = 'Tërhiq para';
    this.giveMoneyHtmlButton.style.cssText = `
        padding: 16px 32px;
        background-color: #2e7d32;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 18px;
        font-weight: 600;
        font-family: 'Segoe UI', Arial, sans-serif;
        transition: all 0.3s ease;
        flex: 1;
        min-width: 180px;
    `;
    
    this.leaveHtmlButton = document.createElement('button');
    this.leaveHtmlButton.textContent = 'Largohu';
    this.leaveHtmlButton.style.cssText = `
        padding: 16px 32px;
        background-color: #c62828;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 18px;
        font-weight: 600;
        font-family: 'Segoe UI', Arial, sans-serif;
        transition: all 0.3s ease;
        flex: 1;
        min-width: 180px;
    `;
    
    this.giveMoneyHtmlButton.onmouseover = function() {
        this.style.backgroundColor = '#43a047';
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 5px 15px rgba(46, 125, 50, 0.4)';
    };
    
    this.giveMoneyHtmlButton.onmouseout = function() {
        this.style.backgroundColor = '#2e7d32';
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'none';
    };
    
    this.leaveHtmlButton.onmouseover = function() {
        this.style.backgroundColor = '#d32f2f';
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 5px 15px rgba(198, 40, 40, 0.4)';
    };
    
    this.leaveHtmlButton.onmouseout = function() {
        this.style.backgroundColor = '#c62828';
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'none';
    };
    
    buttonContainer.appendChild(this.giveMoneyHtmlButton);
    buttonContainer.appendChild(this.leaveHtmlButton);
    this.htmlPopup.appendChild(title);
    this.htmlPopup.appendChild(buttonContainer);
    this.overlay.appendChild(this.htmlPopup);
    document.body.appendChild(this.overlay);
    
    this.giveMoneyHtmlButton.addEventListener('click', this.onButtonGiveMoneyRequest.bind(this));
    this.leaveHtmlButton.addEventListener('click', this.onButtonLeave.bind(this));
};

NotEnoughMoneyController.prototype.showHTMLPopup = function() {
    if (this.overlay) {
        this.overlay.style.display = 'flex';
    }
};

NotEnoughMoneyController.prototype.onButtonLeave = function() {
    window.location.href = 'https://www.google.com/';
    this.app.fire('GameManager:NotEnoughMoney_Disable');
};

NotEnoughMoneyController.prototype.onButtonGiveMoneyRequest = function() {
    this.app.fire('NotEnoughMoneyController:Button_GiveMoneyRequest');
    this.disableNotEnoughMoneyPopUp();
};

NotEnoughMoneyController.prototype.disableNotEnoughMoneyPopUp = function() {
    if (this.overlay) {
        this.overlay.style.display = 'none';
    }
};

NotEnoughMoneyController.prototype.destroy = function() {
    this.app.off('GameManager:NotEnoughMoney', this.showHTMLPopup, this);
    
    if (this.giveMoneyHtmlButton) {
        this.giveMoneyHtmlButton.removeEventListener('click', this.onButtonGiveMoneyRequest);
    }
    
    if (this.leaveHtmlButton) {
        this.leaveHtmlButton.removeEventListener('click', this.onButtonLeave);
    }
    
    if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
    }
};