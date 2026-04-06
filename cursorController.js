var CursorController = pc.createScript('cursorController');

CursorController.attributes.add('hoverElements', {
    type: 'entity',
    array: true
});

CursorController.prototype.initialize = function () {
    this.hoverElements.forEach(element => {
        if (element && element.element) {
            element.element.on('mouseenter', this.onHover, this);
            element.element.on('mouseleave', this.onLeave, this);
        } 
    });
};

CursorController.prototype.onHover = function () {
    document.body.style.cursor = 'pointer';
};

CursorController.prototype.onLeave = function () {
    document.body.style.cursor = 'default';
};
