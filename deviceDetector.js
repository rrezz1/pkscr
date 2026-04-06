var DeviceDetector = pc.createScript('deviceDetector');

// DEFINE ALL HELPER METHODS FIRST, before initialize
DeviceDetector.prototype._detectBrowser = function(ua) {
    if (ua.includes('Chrome') && !ua.includes('Edg')) {
        const match = ua.match(/Chrome\/([0-9.]+)/);
        return {
            name: 'Chrome',
            version: match ? match[1] : 'Unknown',
            engine: 'Blink'
        };
    } else if (ua.includes('Firefox')) {
        const match = ua.match(/Firefox\/([0-9.]+)/);
        return {
            name: 'Firefox',
            version: match ? match[1] : 'Unknown',
            engine: 'Gecko'
        };
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
        const match = ua.match(/Version\/([0-9.]+)/);
        return {
            name: 'Safari',
            version: match ? match[1] : 'Unknown',
            engine: 'WebKit'
        };
    } else if (ua.includes('Edg')) {
        const match = ua.match(/Edg\/([0-9.]+)/);
        return {
            name: 'Microsoft Edge',
            version: match ? match[1] : 'Unknown',
            engine: 'Blink'
        };
    }
    
    return { name: 'Unknown', version: 'Unknown', engine: 'Unknown' };
};

DeviceDetector.prototype._detectOS = function(ua) {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
};

DeviceDetector.prototype._detectDeviceType = function(ua) {
    if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|Opera Mini|IEMobile|WPDesktop/i.test(ua)) {
        return /iPad/i.test(ua) ? 'Tablet' : 'Mobile';
    }
    return 'Desktop';
};

DeviceDetector.prototype._detectArchitecture = function() {
    return navigator.platform.includes('64') ? '64-bit' : 
           navigator.platform.includes('86') ? '32-bit' : 
           navigator.platform || 'Unknown';
};

DeviceDetector.prototype._getOrientation = function() {
    if (screen.orientation) {
        return screen.orientation.type;
    }
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
};

DeviceDetector.prototype._testCookies = function() {
    document.cookie = 'testcookie=1';
    const enabled = document.cookie.indexOf('testcookie=1') !== -1;
    document.cookie = 'testcookie=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    return enabled;
};

DeviceDetector.prototype._testLocalStorage = function() {
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
    } catch (e) {
        return false;
    }
};

DeviceDetector.prototype._testWebGL = function() {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
};

DeviceDetector.prototype._testWebRTC = function() {
    return !!(window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection);
};

DeviceDetector.prototype._getConnectionInfo = function() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!connection) return null;
    
    return {
        type: connection.type || 'Unknown',
        effectiveType: connection.effectiveType || 'Unknown',
        downlink: connection.downlink ? connection.downlink + ' Mbps' : 'Unknown',
        rtt: connection.rtt ? connection.rtt + ' ms' : 'Unknown'
    };
};

DeviceDetector.prototype._getUTCOffset = function() {
    const now = new Date();
    const offset = -now.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    
    return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// NOW DEFINE THE MAIN METHODS
DeviceDetector.prototype.initialize = function() {
    // Store interval reference for cleanup
    this.updateInterval = null;
    
    // Bind event handlers with proper context
    this.onResizeBound = this.onResize.bind(this);
    this.onOnlineStatusChangeBound = this.onOnlineStatusChange.bind(this);
    
    // Initialize deviceInfo object first
    this.app.deviceInfo = {};
    
    // Run initial detection
    this.detectDeviceInformation();
    
    // Update periodically - use bind to maintain context
    this.updateInterval = setInterval(this.updateDynamicInfo.bind(this), 1000);
    
    // Listen for events
    window.addEventListener('resize', this.onResizeBound);
    window.addEventListener('online', this.onOnlineStatusChangeBound);
    window.addEventListener('offline', this.onOnlineStatusChangeBound);
    
    console.log('Device Detector initialized');
    
    // Fire event with device info - use timeout to ensure complete initialization
    setTimeout(() => {
        this.app.fire('deviceDetector:ready', this.app.deviceInfo);
        this.fireNewInfos();
    }, 100);
};

DeviceDetector.prototype.detectDeviceInformation = function() {
    const ua = navigator.userAgent;
    
    // Create complete device info object
    const deviceInfo = {
        // Browser Information
        userAgent: ua,
        browser: this._detectBrowser(ua),
        os: this._detectOS(ua),
        
        // Screen Information
        screen: {
            width: screen.width,
            height: screen.height,
            availWidth: screen.availWidth,
            availHeight: screen.availHeight,
            colorDepth: screen.colorDepth,
            pixelRatio: window.devicePixelRatio || 1,
            orientation: this._getOrientation()
        },
        
        // Window Information
        window: {
            width: window.innerWidth,
            height: window.innerHeight,
            outerWidth: window.outerWidth,
            outerHeight: window.outerHeight
        },
        
        // Device Information
        device: {
            type: this._detectDeviceType(ua),
            platform: navigator.platform,
            cpuCores: navigator.hardwareConcurrency || 'Unknown',
            memory: navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'Unknown',
            architecture: this._detectArchitecture()
        },
        
        // Capabilities
        capabilities: {
            cookies: this._testCookies(),
            localStorage: this._testLocalStorage(),
            webgl: this._testWebGL(),
            webrtc: this._testWebRTC(),
            geolocation: !!navigator.geolocation,
            serviceWorker: 'serviceWorker' in navigator,
            websocket: !!window.WebSocket,
            indexedDB: !!window.indexedDB,
            canvas: !!document.createElement('canvas').getContext,
            webassembly: !!window.WebAssembly,
            touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0
        },
        
        // Network Information
        network: {
            online: navigator.onLine,
            connection: this._getConnectionInfo(),
            doNotTrack: navigator.doNotTrack === '1' || window.doNotTrack === '1'
        },
        
        // Localization
        locale: {
            languages: navigator.languages ? navigator.languages.join(', ') : navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            utcOffset: this._getUTCOffset()
        },
        
        // Timestamp
        timestamp: new Date().toISOString()
    };
    
    // Store in app.deviceInfo
    this.app.deviceInfo = deviceInfo;
    
    // Fire mobile detection events - FIXED TYPO: 'DectiveDevice' to 'DeviceDetector'
    const deviceType = this.app.deviceInfo.device.type;
    const isMobile = deviceType === 'Mobile' || deviceType === 'Tablet';
    
    // Fire events
    this.app.fire('DeviceDetector:ItsDeviceMobile', isMobile);
    // this.app.fire('DeviceDetector:DeviceType', deviceType);
    // console.error('u thirrrrrrrrrrrrrrrrrrrrr' + deviceType);
    
    return this.app.deviceInfo;
};

DeviceDetector.prototype.updateDynamicInfo = function() {
    if (!this.app.deviceInfo) {
        this.detectDeviceInformation();
        return;
    }
    
    // Update dynamic properties
    this.app.deviceInfo.screen.orientation = this._getOrientation();
    this.app.deviceInfo.screen.pixelRatio = window.devicePixelRatio || 1;
    
    this.app.deviceInfo.window = {
        width: window.innerWidth,
        height: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight
    };
    
    this.app.deviceInfo.network.online = navigator.onLine;
    
    const connectionInfo = this._getConnectionInfo();
    if (connectionInfo) {
        this.app.deviceInfo.network.connection = connectionInfo;
    }
    
    this.app.deviceInfo.timestamp = new Date().toISOString();
    
    // Check for device type change
    const oldDeviceType = this.app.deviceInfo.device.type;
    const newDeviceType = this._detectDeviceType(navigator.userAgent);
    
    if (oldDeviceType !== newDeviceType) {
        this.app.deviceInfo.device.type = newDeviceType;
        const isMobile = newDeviceType === 'Mobile' || newDeviceType === 'Tablet';
        this.app.fire('DeviceDetector:ItsDeviceMobile', isMobile);
        // this.app.fire('DeviceDetector:DeviceType', newDeviceType);
        // console.error('u thirrrrrrrrrrrrrrrrrrrrr ' +newDeviceType);
    }
    
    // Fire update event
    this.app.fire('deviceDetector:updated', this.app.deviceInfo);
};

// Event handlers
DeviceDetector.prototype.onResize = function() {
    this.updateDynamicInfo();
};

DeviceDetector.prototype.onOnlineStatusChange = function() {
    this.updateDynamicInfo();
};

// Method to get device info from other scripts
DeviceDetector.prototype.getDeviceInfo = function() {
    return this.app.deviceInfo || this.detectDeviceInformation();
};

// Method to check specific capability
DeviceDetector.prototype.hasCapability = function(capability) {
    if (!this.app.deviceInfo || !this.app.deviceInfo.capabilities) {
        return false;
    }
    return this.app.deviceInfo.capabilities[capability] || false;
};

// Helper methods for device type checking
DeviceDetector.prototype.isMobile = function() {
    const deviceType = this.getDeviceType();
    return deviceType === 'Mobile' || deviceType === 'Tablet';
};

DeviceDetector.prototype.isTablet = function() {
    return this.getDeviceType() === 'Tablet';
};

DeviceDetector.prototype.isDesktop = function() {
    return this.getDeviceType() === 'Desktop';
};

DeviceDetector.prototype.getDeviceType = function() {
    if (!this.app.deviceInfo || !this.app.deviceInfo.device) {
        this.detectDeviceInformation();
    }
    return this.app.deviceInfo?.device?.type || 'Unknown';
};

// Method to log device info to console
DeviceDetector.prototype.fireNewInfos = function() {
    const info = this.getDeviceInfo();
    
    // console.group('Device Information');
    // // console.error('Browser:', info.browser);
    // console.error('OS:', info.os);
    // console.error('Device Type:', info.device.type);
    // console.error('Is Mobile:', info.device.type === 'Mobile' || info.device.type === 'Tablet');
    // // console.error('Screen:', info.screen);
    // // console.error('Capabilities:', info.capabilities);
    // // console.error('Network:', info.network);
    // console.groupEnd();
    const isMobile = info.device.type === 'Mobile' || info.device.type === 'Tablet';
    this.app.fire('DeviceDetector:DeviceType', info.device.type);
    
    // console.error(`Device is ${isMobile ? 'Mobile/Tablet' : 'Desktop'}`);
};

DeviceDetector.prototype.onDestroy = function() {
    // Clear the interval
    if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
    }
    
    // Remove event listeners
    window.removeEventListener('resize', this.onResizeBound);
    window.removeEventListener('online', this.onOnlineStatusChangeBound);
    window.removeEventListener('offline', this.onOnlineStatusChangeBound);
};