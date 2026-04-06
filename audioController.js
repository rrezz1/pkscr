var AudioController = pc.createScript('audioController');

AudioController.prototype.initialize = function () {
    this.audioContextStarted = false;
    this.muteSounds = true;
    
    if (this.app.systems && this.app.systems.sound) {
        this.app.systems.sound.volume = this.muteSounds ? 0 : 1;
    }
    
    this.app.on('PlaySound_ShouldMuted', this.shouldMuted, this);
    this.app.on('PlaySound_Turn', this.playTurnSound, this);
    this.app.on('PlaySound_Check', this.playCheckSound, this);
    this.app.on('PlaySound_FlipCard', this.playFlip_CardSound, this);
    this.app.on('PlaySound_Reise', this.playReiseSound, this);
    this.app.on('PlaySound_Fold', this.playFoldSound, this);
    this.app.on('PlaySound_collectChips', this.chipMove, this);//was playCollectChipsSound
    this.app.on('PlaySound_CardMoved', this.cardMoved, this);
    this.app.on('PlaySound_GammeWinner', this.gameWinner, this);
    this.app.on('PlaySound_ChipMove', this.chipMove, this);
    this.app.on('PlaySound_NewMessage', this.newMessage, this);
    this.app.on('PlaySound_UserLeft', this.userLeft, this);
    this.app.on('PlaySound_UserJoin', this.userJoin, this);
    this.app.on('PlaySound_ButtonPressed', this.buttonPressed, this);
    this.app.on('PlaySound:PlayTimer', this.playTimer, this);
    this.app.on('PlaySound:NonClick', this.nonCLick, this);
};

AudioController.prototype.playSound = function(slotName) {
    
    if (!this.entity.sound || !this.entity.sound.slot(slotName)) {
        console.log("Sound slot not found:", slotName);
        return;
    }
    
    try {
        this.entity.sound.play(slotName);
    } catch (error) {
        if (!error.message.includes('resume') && !error.message.includes('start the audio device')) {
            console.log("Sound play error ", error);
        }
    }
};

AudioController.prototype.shouldMuted = function (shouldMute) {
    this.muteSounds = shouldMute;
    
    if (this.app.systems && this.app.systems.sound) {
        this.app.systems.sound.volume = shouldMute ? 0 : 1;
    }
    const soundComponents = this.app.root.findComponents('sound');
    soundComponents.forEach(component => {
        component.volume = shouldMute ? 0 : 1;
    });
};
AudioController.prototype.playTurnSound = function () {
    this.playSound('Turn');
};

AudioController.prototype.playCheckSound = function () {
    this.playSound('Check');
};

AudioController.prototype.playFlip_CardSound = function () {
    this.playSound('Flip_Card');
};

AudioController.prototype.playReiseSound = function () {
    this.playSound('Reise');
};

AudioController.prototype.playFoldSound = function () {
    this.playSound('Fold');
};

AudioController.prototype.cardMoved = function () {
    this.playSound('CardMoved');
};

AudioController.prototype.playCollectChipsSound = function () {
    this.playSound('CollectChips');
};

AudioController.prototype.gameWinner = function () {
    this.playSound('GameWinner');
};

AudioController.prototype.chipMove = function () {
    this.playSound('ChipMove');
};

AudioController.prototype.newMessage = function () {
    this.playSound('NewMessage');
};

AudioController.prototype.userJoin = function () {
    this.playSound('UserJoin');
};

AudioController.prototype.userLeft = function () {
    this.playSound('UserJoin');
};

AudioController.prototype.buttonPressed = function () {
    this.playSound('ButtonPressed');
};

AudioController.prototype.playTimer = function () {
    this.playSound('PlayTimer');
};

AudioController.prototype.nonCLick = function () {
    this.playSound('NonClick');
};