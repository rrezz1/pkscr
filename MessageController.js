var MessageController = pc.createScript('messageController');

MessageController.attributes.add('messagePopUp', {type: 'entity'});

MessageController.attributes.add('button_to_Open_Message', {type: 'entity'});

MessageController.attributes.add('messageHolder', { type: 'entity' });
MessageController.attributes.add('message', {
    type: 'json',
    schema: [
        { name: 'messageEntity', type: 'entity', title: 'Message Template Entity' },
        { name: 'userName', type: 'entity', title: 'Username Text Entity' },
        { name: 'userMessage', type: 'entity', title: 'Message Text Entity' }
    ],
    title: 'Message'
});

MessageController.attributes.add('redNottification', { type: 'entity' });

MessageController.prototype.initialize = function () {
    this.messagePopUp.enabled = false;
    this.app.on('MessageController:buttonClickedMessage', this.openMessage, this);
    this.app.on('MessageController:hidePopUp_Message', this.hidePopUPMessage, this);
};
MessageController.prototype.debounce = function(func, wait) {
   return function() {
        var context = this, args = arguments;
        if (!context.isProcessingClick) {
            context.isProcessingClick = true;
            setTimeout(function() {
                func.apply(context, args);
                this.app.fire('PlaySound_ButtonPressed');
                context.isProcessingClick = false;
            }, wait);
        }
    };
};
MessageController.prototype.openMessage = function () {
    if(this.messagePopUp.enabled == true)
    {
        this.messagePopUp.enabled = false;
        this.app.fire('MessageButton:disableButtons');
    }
    else{

        this.messagePopUp.enabled = true;
        
        this.app.fire('MessageButton:enableButtons');
        this.app.fire('MessageController:hidePopUp_Settings');
    }
    this.redNottification.enabled = false;
};
MessageController.prototype.hidePopUPMessage = function () {

    this.messagePopUp.enabled = false;

};

MessageController.prototype.closeMessage = function () {
    this.messagePopUp.enabled = false;
};
