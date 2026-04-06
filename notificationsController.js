var NotificationsController = pc.createScript('notificationsController');

NotificationsController.prototype.initialize = function() {
    this.app.on('NotificationsController:addNotification', this.newNotification, this);
    
    this.notifications = [];
    this.notificationId = 0;
    this.container = null;
    
    this.initContainer();
};

NotificationsController.prototype.initContainer = function() {
    this.container = document.createElement('div');
    this.container.className = 'poker-border-notifications';
    document.body.appendChild(this.container);
    
    this.addStyles();
};

NotificationsController.prototype.newNotification = function(message, timer = 9) {
    if (!message || message.trim() === "") return;
    
    const notificationId = ++this.notificationId;
    
    const notification = document.createElement('div');
    notification.className = 'border-alert';
    notification.id = `border-alert-${notificationId}`;
    
    const text = document.createElement('div');
    text.className = 'border-alert-text';
    text.textContent = message;
    
    const timerLine = document.createElement('div');
    timerLine.className = 'border-alert-timer';
    
    notification.appendChild(text);
    notification.appendChild(timerLine);
    this.container.appendChild(notification);
    
    const notificationData = {
        id: notificationId,
        element: notification,
        timeoutId: null
    };
    
    this.notifications.push(notificationData);
    
    setTimeout(() => {
        notification.classList.add('visible');
        timerLine.style.animation = `border-timer-progress ${timer}s linear forwards`;
    }, 10);
    
    if (timer > 0) {
        const timeoutId = setTimeout(() => {
            this.removeNotification(notificationId);
        }, timer * 1000);
        
        notificationData.timeoutId = timeoutId;
    }
    
    this.addSwipeFunctionality(notification, notificationId);
    
    this.cleanupOldNotifications();
    
    return notificationId;
};

NotificationsController.prototype.addSwipeFunctionality = function(element, notificationId) {
    let startX = 0;
    let currentX = 0;
    let isSwiping = false;
    let swipeThreshold = 60; // pixels per swipe
    
    const startSwipe = (clientX) => {
        startX = clientX;
        currentX = clientX;
        isSwiping = true;
        element.style.transition = 'none';
        element.style.cursor = 'grabbing';
    };
    
    const moveSwipe = (clientX) => {
        if (!isSwiping) return;
        
        currentX = clientX;
        const deltaX = currentX - startX;
        
        // veq djatht
        if (deltaX > 0) {
            const translateX = Math.min(deltaX, 200); 
            element.style.transform = `translateX(${translateX}px)`;
            
            // perderi sa leviz
            const opacity = 1 - (translateX / 300);
            element.style.opacity = Math.max(0.3, opacity);
        }
    };
    
    const endSwipe = () => {
        if (!isSwiping) return;
        
        isSwiping = false;
        element.style.transition = 'all 0.3s ease-out';
        element.style.cursor = '';
        
        const deltaX = currentX - startX;
        
        if (deltaX > swipeThreshold) {
            element.style.transform = 'translateX(400px)';
            element.style.opacity = '0';
            
            // setTimeout(() => {
                this.removeNotification(notificationId);
            // }, 300);
        } else {
            element.style.transform = 'translateX(0)';
            element.style.opacity = '1';
        }
    };
    
    // mobile tablet
    element.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) return; // multiple touch
        startSwipe(e.touches[0].clientX);
        e.preventDefault();
    }, { passive: false });
    
    element.addEventListener('touchmove', (e) => {
        if (e.touches.length > 1) return;
        moveSwipe(e.touches[0].clientX);
        e.preventDefault();
    }, { passive: false });
    
    element.addEventListener('touchend', (e) => {
        if (e.touches.length > 0) return;
        endSwipe();
        e.preventDefault();
    }, { passive: false });
    
    //  desktop
    element.addEventListener('mousedown', (e) => {
        startSwipe(e.clientX);
        e.preventDefault();
    });
    
    element.addEventListener('mousemove', (e) => {
        moveSwipe(e.clientX);
        e.preventDefault();
    });
    
    element.addEventListener('mouseup', (e) => {
        endSwipe();
        e.preventDefault();
    });
    
    element.addEventListener('mouseleave', () => {
        if (isSwiping) {
            endSwipe();
        }
    });
    //swipe hint
    // setTimeout(() => {
    //     if (element.parentNode) { 
    //         element.classList.add('swipe-hint');
    //         setTimeout(() => {
    //             element.classList.remove('swipe-hint');
    //         }, 2000);
    //     }
    // }, 1000);
};

NotificationsController.prototype.removeNotification = function(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index === -1) return;
    
    const notification = this.notifications[index];
    const element = notification.element;
    
    element.classList.remove('visible');
    element.classList.add('hiding');
    
    setTimeout(() => {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
        this.notifications.splice(index, 1);
    }, 250);
    
    if (notification.timeoutId) {
        clearTimeout(notification.timeoutId);
    }
};

NotificationsController.prototype.cleanupOldNotifications = function() {
    const maxNotifications = 3;
    
    if (this.notifications.length > maxNotifications) {
        const toRemove = this.notifications.slice(0, this.notifications.length - maxNotifications);
        toRemove.forEach(notification => {
            this.removeNotification(notification.id);
        });
    }
};

NotificationsController.prototype.removeAllNotifications = function() {
    const notificationsCopy = [...this.notifications];
    notificationsCopy.forEach(notification => {
        this.removeNotification(notification.id);
    });
    
    this.notifications = [];
};

NotificationsController.prototype.addStyles = function() {
    if (document.getElementById('poker-border-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'poker-border-styles';
    style.textContent = `
        .poker-border-notifications {
            position: fixed;
            top: 30px;
            right: 0px;
            z-index: 900;
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-width: 380px;
            pointer-events: none;
            width: auto;
        }
        
        .border-alert {
            background: rgba(10, 15, 20, 0.60);
            border-left: 4px solid #D4AF37;
            border-radius: 0 4px 4px 0;
            padding: 16px 20px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.7);
            transform: translateX(120%);
            opacity: 0;
            transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: auto;
            position: relative;
            overflow: hidden;
            max-width: 250px;
            min-width: 250px;
            width: 350px;
            cursor: grab;
            user-select: none;
            touch-action: pan-x;
        }
        
        .border-alert:active {
            cursor: grabbing;
        }
        
        .border-alert.visible {
            transform: translateX(0);
            opacity: 1;
        }
        
        .border-alert.hiding {
            transform: translateX(120%);
            opacity: 0;
        }
        
        .border-alert-text {
            color: #FFFFFF;
            font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif;
            font-size: 15px;
            font-weight: 500;
            line-height: 1.4;
            letter-spacing: 0.2px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        
        .border-alert-timer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: #D4AF37;
            transform-origin: left;
            transform: scaleX(1);
        }
        
        @keyframes border-timer-progress {
            from { transform: scaleX(1); }
            to { transform: scaleX(0); }
        }
        
        .border-alert:hover {
            background: rgba(15, 20, 25, 0.95);
            border-left-color: #F5D76E;
        }
        .border-alert.action {
            border-left-color: #3498DB;
        }
        
        .border-alert.action .border-alert-timer {
            background: #3498DB;
        }
        
        .border-alert.win {
            border-left-color: #2ECC71;
        }
        
        .border-alert.win .border-alert-timer {
            background: #2ECC71;
        }
        
        .border-alert.important {
            border-left-color: #E74C3C;
        }
        
        .border-alert.important .border-alert-timer {
            background: #E74C3C;
        }
        
        /* hinti nese e perdorim*/
        .border-alert.swipe-hint {
            animation: swipe-hint-landscape 1.5s ease-in-out 2;
        }
        
        @keyframes swipe-hint-landscape {
            0%, 100% { 
                transform: translateX(0);
                opacity: 1;
            }
            50% { 
                transform: translateX(40px);
                opacity: 0.8;
            }
        }
        
        /* Mobile landscape optimization */
        @media (max-width: 1024px) and (orientation: landscape) {
            .poker-border-notifications {
                top: 20px;
                right: 25px;
                max-width: 20vw;
                min-width: 20vw;
                width: auto;
                gap: 8px;
            }
            
            .border-alert {
                width: 100% !important;
                max-width: 100% !important;
                min-width: 100% !important;
                padding: 10px 16px;
                cursor: pointer; /* Për mobile touch */
                touch-action: pan-x;
            }
            
            .border-alert-text {
                font-size: 12px;
                line-height: 1;
            }
            
            .border-alert.swipe-hint {
                animation: swipe-hint-mobile-landscape 1.5s ease-in-out 2;
            }
            
            @keyframes swipe-hint-mobile-landscape {
                0%, 100% { 
                    transform: translateX(0);
                    opacity: 1;
                }
                50% { 
                    transform: translateX(30px);
                    opacity: 0.8;
                }
            }
        }
        
        /*tel ma i vogel */
        @media (max-width: 768px) and (orientation: landscape) {
            .poker-border-notifications {
                top: 15px;
                right: 20px;
                max-width: 20vw;
                min-width: 20vw;
                gap: 6px;
            }
            
            .border-alert {
                padding: 8px 12px;
                min-width: auto;
                max-width: 100%;
            }
            
            .border-alert-text {
                font-size: 11px;
                line-height: 1.1;
            }
        }
    `;
    
    document.head.appendChild(style);
};

NotificationsController.prototype.onDestroy = function() {
    this.app.off('NotificationsController:addNotification', this.newNotification, this);
    
    this.removeAllNotifications();
    
    if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
    }
    
    const styles = document.getElementById('poker-border-styles');
    if (styles && styles.parentNode) {
        styles.parentNode.removeChild(styles);
    }
};