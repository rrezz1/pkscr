// MasterController.js - Global Object
window.MasterController = {
    // Properties
    app: null,
    currentScene: null,
    isLoading: false,
    gamePreloaded: false,

    // Websocket connection specific
    ws: null,
    wsConnected: false,
    wsConnectionTries: 0,
    wsLastPingTime: 0, // unix timestamp Date.now()
    wsTimeDifference: 0, // milliseconds
    originUrl: '',

    // Initialize method
    initialize: function (app) {

        this.debug = true;
        this.app = app;
        this.currentScene = null;
        this.isLoading = false;

        this.wsConnected = false;
        this.wsConnectionTries = 0;
        this.wsLastPingTime = 0;
        this.wsTimeDifference = 0;
        this.originUrl = 'http://172.104.132.138';

        if (window['WebSocket']) {
            this.dialWs()
        } else { // TODO: handle unsupported browser, probably redirect to origin
            alert(
                'You are using an unsupported browser. ' +
                'Please use a modern browser like Chrome, Firefox or Safari!',
            )

            window.location.replace(this.originUrl + '/?error=unsupported_browser&src=gameplay');
        }

        app.on("preload:end", () => {
            this.gamePreloaded = true;
        })

        // Loop every 100ms until game preload and ws connection are established
        let startInterval = setInterval(() => {
            // console.log('waiting for game preload/connection...', this.gamePreloaded, this.wsConnected)
            if (this.gamePreloaded && this.wsConnected) {
                this.changeScene('Game');
                clearInterval(startInterval);
                console.log('scene set to Game')
                if (this.debug) {
                    window.BackendSimulator.testScript();
                }
            }
        }, 100)

        app.on('scene:change', this.changeScene, this);

        return this;
    },

    sendWs: function (msgType, msgPayload) {
        if(this.debug == true)
            return;

        if (this.ws.readyState === WebSocket.OPEN && this.wsConnected === true) {
            this.ws.send(JSON.stringify({ type: msgType, payload: msgPayload }))
        } else {
            console.error('unable to send message: websocket is not open')
        }
    },

    pingPongData: function () {
        return {
            ts: Date.now(),
            ua: navigator.userAgent,
            ln: navigator.languages,
            mtp: navigator.maxTouchPoints,
            platform: navigator.platform,
            vendor: navigator.vendor,
        }
    },

    // Custom-built websocket dial method
    dialWs: function () {
        if (this.debug) {
            this.wsConnected = true;
            return
        }

        // Increase connection counter
        this.wsConnectionTries++

        let pingInterval = null
        let urlParams = new URLSearchParams(window.location.search);
        this.ws = new WebSocket('ws://172.104.132.138/api/gameplay?data=' + urlParams.get('data'))
        this.ws.addEventListener('open', (event) => {
            console.log('✅ ws connection opened', event);
            this.wsConnectionTries = 0;
            this.wsConnected = true;

            pingInterval = setInterval(() => {
                this.sendWs('ping', this.pingPongData());
                console.log('🏓 ws ping sent');
            }, 30000);
        });

        this.ws.addEventListener('close', (event) => {
            console.log('❌ ws connection closed', event);
            this.wsConnected = false;
            clearInterval(pingInterval);

            if (event.code !== 1000 && event.code !== 1001 && this.wsConnectionTries < 6) {
                console.log('⏳ ws connection retry in 2s');
                setTimeout(this.dialWs, 2000);
                return
            }

            window.location.replace(this.originUrl + '/?error=websocket_connection_failed&src=gameplay');
        });

        this.ws.addEventListener("message", (event) => {
            try {
                const msg = JSON.parse(event.data)
                console.log("WS Message received:", msg)

                window.GameManager._handleWsMessages(msg)
                return

                if (msg.type !== 'pong') return

                const serverTime = msg.payload.mts;
                const clientTime = msg.payload.yts;

                if (serverTime > clientTime) {
                    // Client time is behind (negative) nr. of milliseconds
                    this.wsTimeDifference = (serverTime - clientTime) * -1;
                } else if (serverTime < clientTime) {
                    // Client time is ahead (positive) nr. of milliseconds
                    this.wsTimeDifference = (clientTime - serverTime) * +1;
                } else {
                    this.wsTimeDifference = 0;
                }

                this.wsLastPingTime = Date.now();

                JSON.stringify({type: 'take_seat', payload: {position: 3, buy_in: 2289}})

                console.log('⏰ clock difference with server is:', this.wsTimeDifference, 'ms')
            } catch (error) {
                // TODO: handle error
                console.error('📩 ws message invalid:', typeof event.data)
            }
        });
    },

    // Change Scene method
    changeScene: function (sceneName) {
        if (sceneName == "Game") {
            this.app.fire("removeSplash");
        }


        this.isLoading = true;

        if (sceneName === 'Tournament_Qualified') {
            this.app.fire('TournamentEvent:Qualified_State', true);
            if (this.app) {
                setTimeout(function () {
                    this.changeScene('Game');

                    this.app.fire('TournamentEvent:Qualified_State', false);
                }.bind(this), 6000);
            }
        }

        const root = this.app.root;
        const rootChildren = this.app.root.children;
        while (rootChildren.length > 0) {
            rootChildren[0].destroy();
        }

        this.app.scenes.changeScene(sceneName, (err) => {
            this.isLoading = false;

            if (sceneName !== 'Start_Stop')

                if (err) {
                    console.error('Failed to change scene:', sceneName, err);
                    if (this.app) {
                        this.app.fire('scene:error', {
                            scene: sceneName,
                            error: err
                        });
                    }
                    return;
                }

            this.currentScene = sceneName;


        });
    },


    isReady: function () {
        return !!(this.app && this.app.root);
    },


    getCurrentScene: function () {
        return this.currentScene;
    },


    isLoadingScene: function () {
        return this.isLoading;
    },

};

if (typeof pc !== 'undefined' && pc.app) {
    window.MasterController.initialize(pc.app);
}   