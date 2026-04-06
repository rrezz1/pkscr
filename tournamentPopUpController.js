var TournamentPopUpController = pc.createScript('tournamentPopUpController');



TournamentPopUpController.attributes.add('tournamentPopUp', { type: 'entity' });
TournamentPopUpController.attributes.add('cooldownNumbers', { type: 'entity' });
TournamentPopUpController.attributes.add('nextRoundDesc', { type: 'entity' });

TournamentPopUpController.prototype.initialize = function() {
    this.app.on('GameManager:gameState:Tournament', this.checkTournamentState, this);
    this.app.on('TournamentController:UpdateCooldownNumbers', this.updateCooldown, this);
    this.app.on('TournamentController:UpdateNextRoundDesc', this.updateNextRoundDesc, this);
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
    
    this.cooldownNumbers.element.text = timer !== undefined ? timer.toString() : "00:00";
};

TournamentPopUpController.prototype.updateNextRoundDesc = function(nextRound) {
    if (!this.nextRoundDesc || !this.nextRoundDesc.element) {
        return;
    }
    
    const prefix = "Next Round: ";
    const dataText = nextRound !== undefined ? nextRound.toString() : "Starting soon";
    
    this.nextRoundDesc.element.text = prefix + dataText;
};

TournamentPopUpController.prototype.onDestroy = function() {
    this.app.off('TournamentController:UpdateCooldownNumbers', this.updateCooldown, this);
    this.app.off('TournamentController:UpdateNextRoundDesc', this.updateNextRoundDesc, this);
};