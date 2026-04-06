var ProfileLoaderController = pc.createScript('profileLoaderController');

ProfileLoaderController.attributes.add('playersInfoPositions', {
    type: 'json',
    array: true,
    schema: [
        { name: 'position', type: 'entity', title: 'Position Entity' },
        { name: 'profile',  type: 'entity', title: 'User profile'   },
    ],
    title: 'Player Info UI Positions'
});

ProfileLoaderController.attributes.add('maxConcurrentLoads', {
    type: 'number',
    default: 2,
    title: 'Max Concurrent Loads',
    description: 'Maximum number of images to load simultaneously'
});

ProfileLoaderController.attributes.add('loadDelay', {
    type: 'number',
    default: 100,
    title: 'Load Delay',
    description: 'Delay in milliseconds between starting image loads'
});

ProfileLoaderController.prototype.initialize = function () {
    this.imageCache        = new Map();
    this.loadingQueue      = [];
    this.activeLoads       = 0;
    this.activeLoadUrls    = new Set();
    this.profileMasks      = [];
    this.isProcessingQueue = false;
    this.pendingPlayerData = new Map();

    this._prepareProfileMasks();

    this.app.on('GameManager:updatePlayersInfo',              this.updateAllPlayersUI,    this);
    this.app.on('GameManager:updateSpecificPlayerInfo',       this.updateSpecificPlayerUI,this);
    this.app.on('GameManager:updateProfile:player_seated',   this.updateImageUrl,        this);
};

ProfileLoaderController.prototype._prepareProfileMasks = function () {
    if (!this.playersInfoPositions || !this.playersInfoPositions.length) return;

    this.profileMasks = new Array(this.playersInfoPositions.length);

    for (let i = 0; i < this.playersInfoPositions.length; i++) {
        this.profileMasks[i] = this._createRoundedMask();
    }
};

ProfileLoaderController.prototype._createRoundedMask = function () {
    const size         = 256;
    const borderRadius = 57;
    const canvas       = document.createElement('canvas');
    canvas.width       = size;
    canvas.height      = size;
    const ctx          = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    return { canvas, ctx, size, borderRadius };
};

// ─── UPDATE ALL PLAYERS ───────────────────────────────────────────────────────

ProfileLoaderController.prototype.updateAllPlayersUI = function (playersInfo) {
    if (!this.playersInfoPositions || !this.playersInfoPositions.length) return;

    // FIX: nderto mapen me serverPos si key (qysh vjen prej backend)
    var playersByServerPos = {};
    for (var i = 0; i < playersInfo.length; i++) {
        var p = playersInfo[i];
        if (p != null && p.position !== undefined) {
            playersByServerPos[p.position] = p;
        }
    }

    this.loadingQueue = [];
    this.pendingPlayerData.clear();

    // FIX: loop-o mbi serverPos, konverto ne physicalSlot per cdo player
    for (var serverPos = 0; serverPos < playersInfo.length; serverPos++) {
        var playerInfo = playersByServerPos[serverPos];
        if (!playerInfo) continue;

        // konverto serverPos → physicalSlot (pozicioni UI)
        var physicalSlot = window.GameManager.serverToUiIndex(serverPos);
        if (physicalSlot === undefined || physicalSlot < 0) continue;

        var positionData = this.playersInfoPositions[physicalSlot];
        if (!positionData || !positionData.profile || !positionData.profile.element) continue;

        // shfaq fallback me iniciale ndersa po ngarkohet foto
        this._createSimpleFallback(positionData.profile.element, 'P' + (serverPos + 1));

        if (playerInfo.imageUrl) {
            this._queueImageLoad(physicalSlot, playerInfo.imageUrl, positionData.profile.element);
        }
    }

    this._scheduleQueueProcessing();
};

// ─── UPDATE SPECIFIC PLAYER ───────────────────────────────────────────────────

ProfileLoaderController.prototype.updateSpecificPlayerUI = function (playerInfo) {
    if (!playerInfo || playerInfo.position === undefined) {
        console.warn('[ProfileLoader] updateSpecificPlayerUI: playerInfo invalid');
        return;
    }

    // FIX: playerInfo.position vjen si serverPos nga backend, konverto
    var physicalSlot = window.GameManager.serverToUiIndex(playerInfo.position);
    if (physicalSlot === undefined || physicalSlot < 0) {
        console.warn('[ProfileLoader] updateSpecificPlayerUI: serverToUiIndex returned invalid slot for serverPos=' + playerInfo.position);
        return;
    }

    var positionData = this.playersInfoPositions[physicalSlot];
    if (!positionData || !positionData.profile || !positionData.profile.element) {
        console.warn('[ProfileLoader] updateSpecificPlayerUI: no positionData for physicalSlot=' + physicalSlot);
        return;
    }

    this._createSimpleFallback(positionData.profile.element, 'P' + (physicalSlot + 1));

    if (playerInfo.imageUrl) {
        this._queueImageLoad(physicalSlot, playerInfo.imageUrl, positionData.profile.element, true);
        this._scheduleQueueProcessing();
    }
};

// ─── UPDATE IMAGE URL (player_seated) ────────────────────────────────────────

ProfileLoaderController.prototype.updateImageUrl = function (position, imageUrl) {
    var physicalSlot = window.GameManager.serverToUiIndex(position);
    if (physicalSlot === undefined || physicalSlot < 0 || !imageUrl) {
        console.warn('[ProfileLoader] updateImageUrl: invalid position or imageUrl');
        return;
    }

    var positionData = this.playersInfoPositions[physicalSlot];
    if (!positionData || !positionData.profile || !positionData.profile.element) {
        console.warn('[ProfileLoader] updateImageUrl: no positionData for physicalSlot=' + physicalSlot);
        return;
    }

    this._createSimpleFallback(positionData.profile.element, 'P' + (position + 1));

    this._queueImageLoad(physicalSlot, imageUrl, positionData.profile.element, true);
    this._scheduleQueueProcessing();
};

// ─── QUEUE MANAGEMENT ─────────────────────────────────────────────────────────

ProfileLoaderController.prototype._queueImageLoad = function (physicalSlot, imageUrl, element, priority) {
    priority = priority || false;
    if (!imageUrl) return;

    // nese osht ne cache, apliko direkt
    if (this.imageCache.has(imageUrl)) {
        this._applyCachedImage(physicalSlot, imageUrl, element);
        return;
    }

    // regjistro kete player si pritës per kete URL
    if (!this.pendingPlayerData.has(imageUrl)) {
        this.pendingPlayerData.set(imageUrl, []);
    }

    var waitingPlayers = this.pendingPlayerData.get(imageUrl);

    // mos e shto dy here te njejtin player
    var alreadyWaiting = waitingPlayers.some(function (p) { return p.index === physicalSlot; });
    if (alreadyWaiting) return;

    waitingPlayers.push({ index: physicalSlot, element: element });

    // nese URL osht tashme ne queue ose duke u ngarkuar, mos e shto perseri
    var isAlreadyQueued  = this.loadingQueue.some(function (item) { return item.imageUrl === imageUrl; });
    var isCurrentlyLoading = this.activeLoadUrls.has(imageUrl);

    if (isAlreadyQueued || isCurrentlyLoading) return;

    var queueItem = {
        imageUrl:   imageUrl,
        retryCount: 0,
        maxRetries: 2,
        addedAt:    Date.now()
    };

    if (priority) {
        this.loadingQueue.unshift(queueItem); // shto ne fillim te radhes
    } else {
        this.loadingQueue.push(queueItem);
    }
};

ProfileLoaderController.prototype._scheduleQueueProcessing = function () {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;
    this._processQueue();
};

ProfileLoaderController.prototype._processQueue = function () {
    if (this.loadingQueue.length === 0) {
        this.isProcessingQueue = false;
        return;
    }

    if (this.activeLoads >= this.maxConcurrentLoads) {
        return; // prit qe te lirohet nje slot
    }

    var item = this.loadingQueue.shift();
    if (!item) { this.isProcessingQueue = false; return; }

    // mund te kete hyre ne cache ndersa ishte ne queue
    if (this.imageCache.has(item.imageUrl)) {
        this._applyToAllPendingPlayers(item.imageUrl);
        setTimeout(() => this._processQueue(), 10);
        return;
    }

    if (this.activeLoadUrls.has(item.imageUrl)) {
        this.loadingQueue.push(item); // ktheje ne fund te radhes
        setTimeout(() => this._processQueue(), 100);
        return;
    }

    this._startImageLoad(item);
    setTimeout(() => this._processQueue(), this.loadDelay);
};

ProfileLoaderController.prototype._startImageLoad = function (item) {
    var imageUrl   = item.imageUrl;
    var retryCount = item.retryCount;
    var maxRetries = item.maxRetries;

    this.activeLoads++;
    this.activeLoadUrls.add(imageUrl);

    this._loadImage(imageUrl)
        .then((img) => {
            this.imageCache.set(imageUrl, img);
            this._applyToAllPendingPlayers(imageUrl);
            this.activeLoads--;
            this.activeLoadUrls.delete(imageUrl);
            setTimeout(() => this._processQueue(), 10);
        })
        .catch((error) => {
            console.warn('[ProfileLoader] Failed to load: ' + imageUrl.substring(0, 50), error.message);
            this.activeLoads--;
            this.activeLoadUrls.delete(imageUrl);

            if (retryCount < maxRetries) {
                this.loadingQueue.push({
                    imageUrl:   imageUrl,
                    retryCount: retryCount + 1,
                    maxRetries: maxRetries,
                    addedAt:    Date.now()
                });
            } else {
                this.pendingPlayerData.delete(imageUrl); // hiq nga lista e pritjes
            }

            setTimeout(() => this._processQueue(), 50);
        });
};

ProfileLoaderController.prototype._loadImage = function (url) {
    return new Promise((resolve, reject) => {
        if (this.imageCache.has(url)) { resolve(this.imageCache.get(url)); return; }

        const img      = new Image();
        img.crossOrigin = 'anonymous';

        const timeoutId = setTimeout(() => {
            img.onload  = null;
            img.onerror = null;
            reject(new Error('Image load timeout (8s)'));
        }, 8000);

        img.onload = () => { clearTimeout(timeoutId); resolve(img); };

        img.onerror = () => {
            clearTimeout(timeoutId);
            this._loadWithProxy(url).then(resolve).catch(() => {
                reject(new Error('Failed direct + proxy load'));
            });
        };

        img.src = url;

        if (img.complete && img.naturalHeight !== 0) {
            clearTimeout(timeoutId);
            resolve(img);
        }
    });
};

ProfileLoaderController.prototype._loadWithProxy = function (url) {
    return new Promise((resolve, reject) => {
        const proxyUrl  = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
        const img       = new Image();
        img.crossOrigin = 'anonymous';

        const timeoutId = setTimeout(() => {
            img.onload  = null;
            img.onerror = null;
            reject(new Error('Proxy load timeout (8s)'));
        }, 8000);

        img.onload  = () => { clearTimeout(timeoutId); resolve(img); };
        img.onerror = () => { clearTimeout(timeoutId); reject(new Error('Proxy load failed')); };
        img.src     = proxyUrl;
    });
};

// ─── APLIKO FOTON ─────────────────────────────────────────────────────────────

ProfileLoaderController.prototype._applyToAllPendingPlayers = function (imageUrl) {
    var waitingPlayers = this.pendingPlayerData.get(imageUrl);
    if (!waitingPlayers || waitingPlayers.length === 0) return;

    var cachedImg = this.imageCache.get(imageUrl);
    if (!cachedImg) return;

    waitingPlayers.forEach(({ index, element }) => {
        var mask = this.profileMasks[index];
        if (mask && element) {
            this._applyLoadedImage(element, cachedImg, mask);
        }
    });

    this.pendingPlayerData.delete(imageUrl);
};

ProfileLoaderController.prototype._applyCachedImage = function (physicalSlot, imageUrl, element) {
    var cachedImg = this.imageCache.get(imageUrl);
    var mask      = this.profileMasks[physicalSlot];
    if (cachedImg && mask) {
        this._applyLoadedImage(element, cachedImg, mask);
    }
};

ProfileLoaderController.prototype.drawProfile = function (playerIndex, imageUrl) {
    var positionData = this.playersInfoPositions[playerIndex];
    if (!positionData || !positionData.profile || !positionData.profile.element) return;

    this._queueImageLoad(playerIndex, imageUrl, positionData.profile.element, true);
    this._scheduleQueueProcessing();
};

ProfileLoaderController.prototype._applyLoadedImage = function (element, img, mask) {
    if (!element || !img || !mask) return;
    try {
        var texture = this._applyRoundedMask(img, mask);
        if (element.type === 'image' && texture) {
            element.texture              = texture;
            element.stretchMode          = pc.STRETCH_MODE_FILL;
            element.preserveAspectRatio  = true;
        }
    } catch (error) {
        console.warn('[ProfileLoader] Error applying mask:', error);
    }
};

ProfileLoaderController.prototype._applyRoundedMask = function (img, mask) {
    var canvas = mask.canvas;
    var ctx    = mask.ctx;
    var size   = mask.size;
    var radius = mask.borderRadius;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    this._drawRoundedRectangle(ctx, 0, 0, size, size, radius);
    ctx.clip();

    var imgRatio = img.width / img.height;
    var drawWidth, drawHeight, offsetX, offsetY;

    if (imgRatio > 1) {
        drawHeight = size;
        drawWidth  = size * imgRatio;
        offsetX    = -(drawWidth - size) / 2;
        offsetY    = 0;
    } else {
        drawWidth  = size;
        drawHeight = size / imgRatio;
        offsetX    = 0;
        offsetY    = -(drawHeight - size) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    ctx.restore();

    var texture = new pc.Texture(this.app.graphicsDevice);
    texture.setSource(canvas);
    return texture;
};

ProfileLoaderController.prototype._createSimpleFallback = function (element, text) {
    if (!element) return;

    var size   = 256;
    var radius = 57;
    var canvas = document.createElement('canvas');
    canvas.width  = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, size, size);
    this._drawRoundedRectangle(ctx, 0, 0, size, size, radius);

    var gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, '#545556');
    gradient.addColorStop(1, '#161718');
    ctx.fillStyle = gradient;
    ctx.fill();

    if (text) {
        ctx.fillStyle    = 'white';
        ctx.font         = 'bold ' + (size / 4) + 'px Arial';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor  = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur   = 4;
        ctx.fillText(text, size / 2, size / 2);
        ctx.shadowBlur   = 0;
    }

    var texture = new pc.Texture(this.app.graphicsDevice);
    texture.setSource(canvas);

    if (element.type === 'image') {
        element.texture             = texture;
        element.stretchMode         = pc.STRETCH_MODE_FILL;
        element.preserveAspectRatio = true;
    }
};

ProfileLoaderController.prototype._drawRoundedRectangle = function (ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y,          x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height,         x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y,                  x + radius, y);
    ctx.closePath();
};

ProfileLoaderController.prototype.destroy = function () {
    this.imageCache.clear();
    this.loadingQueue      = [];
    this.activeLoadUrls.clear();
    this.pendingPlayerData.clear();
    this.activeLoads       = 0;
    this.isProcessingQueue = false;

    this.app.off('GameManager:updatePlayersInfo',            this.updateAllPlayersUI,    this);
    this.app.off('GameManager:updateSpecificPlayerInfo',     this.updateSpecificPlayerUI,this);
    this.app.off('GameManager:updateProfile:player_seated',  this.updateImageUrl,        this);
};