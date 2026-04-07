var TournamentPopUpController = pc.createScript('tournamentPopUpController');



TournamentPopUpController.attributes.add('tournamentPopUp', { type: 'entity' });
TournamentPopUpController.attributes.add('cooldownNumbers', { type: 'entity' });
TournamentPopUpController.attributes.add('nextRoundDesc', { type: 'entity' });

TournamentPopUpController.prototype.initialize = function() {
    this.app.on('GameManager:gameState:Tournament', this.checkTournamentState, this);
    this.app.on('TournamentController:UpdateCooldownNumbers', this.updateCooldown, this);
    this.app.on('TournamentController:UpdateNextRoundDesc', this.updateNextRoundDesc, this);
};
TournamentPopUpController.prototype._setTextIfChanged = function (element, text) {
    if (!element) return;
    const next = text !== undefined && text !== null ? String(text) : '';
    if (element.text !== next) {
        element.text = next;
    }
};
TournamentPopUpController.prototype.checkTournamentState = function(isGameStateTornament) {
    if(isGameStateTornament == true){
        this.tournamentPopUp.enabled = true;
    }else{
        this.tournamentPopUp.enabled = false;
    }

};
TournamentPopUpController.prototype.updateCooldown = function(timer) {
    if (!this.cooldownNumbers || !this.cooldownNumbers.element) {
        return;
    }
    
    this._setTextIfChanged(
        this.cooldownNumbers.element,
        timer !== undefined ? timer.toString() : "00:00"
    );
};

TournamentPopUpController.prototype.updateNextRoundDesc = function(nextRound) {
    if (!this.nextRoundDesc || !this.nextRoundDesc.element) {
        return;
    }
    
    const prefix = "Next Round: ";
    const dataText = nextRound !== undefined ? nextRound.toString() : "Starting soon";
    
    this._setTextIfChanged(this.nextRoundDesc.element, prefix + dataText);
};

TournamentPopUpController.prototype.onDestroy = function() {
    this.app.off('TournamentController:UpdateCooldownNumbers', this.updateCooldown, this);
    this.app.off('TournamentController:UpdateNextRoundDesc', this.updateNextRoundDesc, this);
};
