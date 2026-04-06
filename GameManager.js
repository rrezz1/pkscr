window.GameManager = {
    SSE: {
        GAMECONFIGURATION: "gameConfiguration",
        ISUSER$INGAME: "isUser4InGame",
        UPDATE_PLAYERS: "updatePlayers",
        BLINDS: "blinds",
        ADDMESSAGE: "addMessage",
        ADDNOTIFICATION: "addNotification",
    },
    SEATSPOSITION: {
        Seats_4_players: [1, 3, 4, 5],//0,1,2,3
        Seats_5_players: [1, 3, 4, 5, 7],//0,1,2,3,4
        Seats_6_players: [1, 2, 3, 4, 5, 7],
        Seats_7_players: [1, 2, 3, 4, 5, 6, 7],//0,1,2,3,4,5,6
        Seats_8_players: [0, 1, 2, 3, 4, 5, 6, 7],
        Seats_9_players: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    },
    MainSeat: {
        Seats_4_players: 2,
        Seats_5_players: 2,
        Seats_6_players: 3,
        Seats_7_players: 3,
        Seats_8_players: 4,
        Seats_9_players: 4
    },
    app: null,
    evtSource: null,
    _pcScript: null,

    initialize: function (app) {
        this.app = app;

        if (typeof pc !== "undefined" && pc.createScript) {
            this._createPCScript();
        }

        return this;
    },
    _createPCScript: function () {
        if (this._pcScript) return;

        this._pcScript = pc.createScript('gameManager');
        var self = this;

        self.isTableSetup = false;
        self.didCurrentHandSetUp = false;
        self.allScriptsInitialized = false;
        self.your_seat = -1;
        self.youreID = null;
        self.handId = -1;
        self.isAnyHoleCardInTable = false;

        self.currentSeatsPayload = null;
        self.activeBets = {};
        self.currentStatus = {};
        self._lastHoleCardsPayload = {};

        self._pcScript.prototype.initialize = function () {
            this.app.fire('GameManager_MOVECAMERA');
            self._initializeEventsThatFrontSend();
            // debug check nuk ka nevon se o n MasterController
        };
    },
    // _createPCScript: function () {
    //     if (this._pcScript) return;

    //     this._pcScript = pc.createScript("gameManager");
    //     var self = this;

    //     this._pcScript.prototype.initialize = function () {
    //         // this.app = app;
    //         self.isTableSetup = false;
    //         self.didCurrentHandSetUp = false;
    //         self.your_seat = -1;
    //         self.youreID = null;
    //         self.handId = -1;
    //         self.currentSeatsPayload;

    //         self.currentActiveBets;
    //         self.activeBets = {};
    //         self._lastHoleCardsPayload = {};

    //         if (typeof pc !== "undefined" && pc.createScript) {
    //             self._createPCScript();
    //         }


    //         this.app.fire("GameManager_MOVECAMERA"); // vyn per me shku kamera te tavolina, userat sdalin pa pas t dhana
    //         self._initializeEventsThatFrontSend();
    //         if (window.MasterController.debug) {
    //             // self.simulateWebsocket();
    //             return;
    //         }
    //     };
    // },
    getSeatPosition: function (seatsCount) {
        switch (seatsCount) {
            case 4: return this.SEATSPOSITION.Seats_4_players;
            case 5: return this.SEATSPOSITION.Seats_5_players;
            case 6: return this.SEATSPOSITION.Seats_6_players;
            case 7: return this.SEATSPOSITION.Seats_7_players;
            case 8: return this.SEATSPOSITION.Seats_8_players;
            case 9: return this.SEATSPOSITION.Seats_9_players;
            default: return this.SEATSPOSITION.Seats_9_players;
        }
    },

    getMainSeat: function (seatsCount) {
        switch (seatsCount) {
            case 4: return this.MainSeat.Seats_4_players;
            case 5: return this.MainSeat.Seats_5_players;
            case 6: return this.MainSeat.Seats_6_players;
            case 7: return this.MainSeat.Seats_7_players;
            case 8: return this.MainSeat.Seats_8_players;
            case 9: return this.MainSeat.Seats_9_players;
            default: return this.MainSeat.Seats_9_players;
        }
    },
    wrapSeats: function (seats) {
        
        var occupiedSeats = seats.filter(s => !s.is_empty);
        var seatLength = seats.length; // total seats per layout
        
        var seats_ui = this.getSeatPosition(seatLength);
        var mainSeatIdx = this.getMainSeat(seatLength);
        var yourSeatServer = this.your_seat;

        this.seatsArray = seatLength;
        var n = seats_ui.length;

        this._serverToUiMap = {};

        if (yourSeatServer >= 0) {
            var offset = ((mainSeatIdx - yourSeatServer) % n + n) % n;
            for (var i = 0; i < n; i++) {
                var serverPos = (i - offset + n) % n; // ndrrim
                this._serverToUiMap[serverPos] = seats_ui[i];
            }
        } else {
            for (var i = 0; i < n; i++) {
                this._serverToUiMap[i] = seats_ui[i];
            }
        }
        
        console.log('_serverToUiMap:', this._serverToUiMap);
    },
    // wrapSeats: function (seats) {
    //     var seatLength = seats.length;
    //     var yourSeatServer = this.your_seat;
    //     var seats_ui = this.getSeatPosition(seatLength);
    //     var mainSeatIdx = this.getMainSeat(seatLength);

    //     this.seatsArray = seatLength;

    //     var n = seats_ui.length;
    //     var serverOrder;

    //     if (yourSeatServer >= 0) {
    //         var offset = ((mainSeatIdx - yourSeatServer) % n + n) % n;
    //         serverOrder = [];
    //         for (var i = 0; i < n; i++) {
    //             serverOrder.push((i - offset + n) % n);
    //         }
    //     } else {
    //         serverOrder = [];
    //         for (var i = 0; i < n; i++) serverOrder.push(i);
    //     }

    //     this._serverToUiMap = {};
    //     for (var i = 0; i < n; i++) {
    //         this._serverToUiMap[serverOrder[i]] = seats_ui[i];
    //     }
    // console.log('_serverToUiMap:', this._serverToUiMap);
    // },
    wrapSeatsOnSeated: function (seats, yourSeat) {
        var seatLength = seats.length;
        this.your_seat = yourSeat;
        var seats_ui = this.getSeatPosition(seatLength);
        var mainSeatIdx = this.getMainSeat(seatLength);

        this.seatsArray = seatLength;

        var n = seats_ui.length;
        var serverOrder;

        if (this.your_seat >= 0) {
            var offset = ((mainSeatIdx - this.your_seat) % n + n) % n;
            serverOrder = [];
            for (var i = 0; i < n; i++) {
                serverOrder.push((i - offset + n) % n);
            }
        } else {
            serverOrder = [];
            for (var i = 0; i < n; i++) serverOrder.push(i);
        }

        this._serverToUiMap = {};
        for (var i = 0; i < n; i++) {
            this._serverToUiMap[serverOrder[i]] = seats_ui[i];
        }
    },
    getYoureSeat: function () {
        return this.your_seat;
    },
    serverToUiIndex: function (serverPosition) {
        if (!this._serverToUiMap) return -1;
        var ui = this._serverToUiMap[serverPosition];
        return (ui !== undefined) ? ui : -1;
    },
    uiToServerIndex: function (uiSlot) {
        var seats = this.getSeatPosition(this.seatsArray);
        var index = seats.indexOf(uiSlot);
        return index;
    },
    _ensureActiveBets: function () {
        if (!this.activeBets) this.activeBets = {};
    },
    remapExistingCards: function () {
        var self = this;
        var app = this.app;

        // Merr kartat ekzistuese dhe ndrron veq targetPos/targetRot/emrin
        // pa animacion
        var activeSeats = this.getSeatPosition(this.seatsArray);

        for (var i = 0; i < activeSeats.length; i++) {
            var physicalSlot = activeSeats[i];

            // kartat e slotit ndrro pozicionin direkt
            app.fire('CardsManager:RemapSlotCards', physicalSlot);
        }
    },
    _sanitizeActiveBets: function () {
        if (!this.currentSeatsPayload || !this.currentSeatsPayload.seats) return;

        var seatMap = {};
        for (var i = 0; i < this.currentSeatsPayload.seats.length; i++) {
            var s = this.currentSeatsPayload.seats[i];
            seatMap[s.position] = s;
        }

        for (var serverPos in this.activeBets) {
            var seat = seatMap[parseInt(serverPos)];
            if (!seat || seat.is_empty || seat.status === 102) {
                delete this.activeBets[serverPos];
            }
        }
    },
    wsHandleTableStateTicker: function (payload) {

        this.your_seat = (payload.your_seat !== undefined && payload.your_seat !== null)
            ? payload.your_seat
            : -1;
        this.seatsArray = payload.seats.length; // ose payload.max_seats
        console.log('wsHandleTableStateTicker called:', payload)
        console.log('Active Bets', this.activeBets); // saved nese ulesh vyn
        this.currentSeatsPayload = payload;
        if (!this.isTableSetup) {
            this.setupTable(payload);
        }
        this.app.fire('GameManager:getValuesThatMainUserCanBuyIn:AddBalance',
            payload.config.min_buy_in,
            payload.config.max_buy_in
        );
        this.app.fire("GameManager:defineIsMainUserPlaying", this.your_seat !== -1);// in progress to remove
        
        this.app.fire("GameManager:updatePlayersInfo", payload.seats);

        this.app.fire('GameManager:getMainUserBalance:AddBalance', payload.your_accounts_balance);
        this.app.fire('uiButtons:SetAddBalanceButtonState', payload.your_seat !== -1);

        this.app.fire("uiButtons:ActivateBuyTimmer:InMainPlayerTurn", payload.config.allow_buy_more_time);
        
        //min buy in, max out
        

        if (!this.didCurrentHandSetUp && payload.current_hand) {
            this.current_hand(payload);
        }
        this.updateStatus(payload);
        // Redraw players in table.... to be evaluated
    },
    updateStatus: function (payload) {

        var seats = payload.seats;
        for (var i = 0; i < seats.length; i++) {
            var position = seats[i].position;
            var status = seats[i].status;
            if(!status){
                 console.log("statusi i lojtarit SKA: " +status);
            }    
            else if (this.currentStatus[position] == status) {
                console.log("statusi i lojtarit (same) "+ position+" o i njejt si heren e  kalune pra, u kan: "+ this.currentStatus[position]+ " edhe osht" + status);
                // 
                continue;
            }else{
                console.log("Statusi i lojtarit (u ndrru) "+ position+" u ndrru, pra prej " + this.currentStatus[position] + " u bo " + status);
                this.currentStatus[position] = status;
            }

           
            switch (status) {
                case 102: // sit Out
                    this.app.fire('GameManager:playerStatus:sitout', position);
                    break;
                case 103: // waiting
                case 104:
                    this.app.fire('GameManager:playerStatus:waiting', position);
                    break;
                case 105:
                    this.activeBets[position] = { action: 'allin', amount: total_bet, isAllin: true };
                    this.app.fire('GameManager:playerAction:allin', position, total_bet, false);
                    break;
                case 106:
                    this.activeBets[position] = { action: 'fold', amount: 0, isAllin: false };
                    this.app.fire('GameManager:playerAction:fold', position, true);
                    break;
            }
        }
    },
    setupTable: function (payload) {

        let gameSpeed = payload.config.speed;

        this.youreID = payload.your_id;
        this.wrapSeats(payload.seats);


        this.app.fire("GameManager:defineChipsValue", payload.config.max_buy_in);

        let isTournament = (payload.config.game_type == 102 || payload.config.game_type == 104);
        let isOmahaLiveCash = false;
        if (payload.config.game_type == 103) {
            isOmahaLiveCash = true;
        }
        // console.error(isTournament);
        // console.error(isOmahaLiveCash);

        this.app.fire("GameManager:gameState:Ohama:Poker", isOmahaLiveCash);
        this.app.fire("GameManager:gameState:Tournament", isTournament);
        this.app.fire('defineIfPlayerBalanceIsDollar', !isTournament);
        this.app.fire("GameManager:defineGameSpeedMode", gameSpeed);
        this.app.fire("PolishManager:Company_Name", 1); // pranon int 0-2 (3 kompani)
        this.isTableSetup = true;

    },
    current_hand: function (payload) {
        console.log("current_hand: " + this.didCurrentHandSetUp);
        if (!payload || !payload.current_hand || !this.allScriptsInitialized) {
            console.log("u bo return");
            return;
        }
        this.app.fire('GameManager_UiMenager:tableValue', payload.current_hand.total_pot);
        

        var participants = payload.current_hand.participants;
        var current_hand = payload.current_hand;

        this.app.fire('GameManager:SetTimeToUSerTImer', current_hand.time_remaining);
        this.app.fire('GameManager_PlayerFlow:playerTurn',current_hand.active_pos); 
        
        // this.app.fire('GameManager:ActiveButtons', payload.valid_actions, payload.call_amount); //todo

        for (var i = 0; i < participants.length; i++) {
            var position = participants[i].position;
            var status = participants[i].status;
            var total_bet = participants[i].total_bet;

            var last_betting_action = participants[i].last_betting_action;

            this.currentStatus[position] = status
            // switch (status) {
            //     case 102: // sit Out
            //         this.app.fire('GameManager:playerStatus:sitout', position);
            //         break;
            //     case 103: // waiting
            //     case 104:
            //         this.app.fire('GameManager:playerStatus:waiting', position);
            //         break;
            //     case 105:
            //         this.activeBets[position] = { action: 'allin', amount: total_bet, isAllin: true };
            //         this.app.fire('GameManager:playerAction:allin', position, total_bet, false);
            //         break;
            //     case 106:
            //         this.activeBets[position] = { action: 'fold', amount: 0, isAllin: false };
            //         this.app.fire('GameManager:playerAction:fold', position, true);
            //         break;
            // }

            if(payload.your_seat !== -1 && position == this.getYoureSeat() && position == current_hand.active_pos){
                this.app.fire('GameManager:ActiveButtons', participants[i].valid_actions, participants[i].call_amount);
            }

            if(!last_betting_action)
                continue;

            var amount = participants[i].last_betting_action.amount;
            var action = participants[i].last_betting_action.action;
            
            switch(action)
            {
                case 101: // smallblind
                    this.activeBets[position] = { action: 'smallblind', amount: amount, isAllin: false };
                    this.app.fire('GameManager:playerAction:smallblind', position, amount);
                    
                    break;
                case 102: // bib blinds
                    this.activeBets[position] = { action: 'bigblind', amount: amount, isAllin: false };
                    this.app.fire('GameManager:playerAction:bigblind', position, amount);
                        
                    break;
                case 103: //ante
                    this.activeBets[position] = { action: 'ante', amount: amount, isAllin: false };
                    this.app.fire('GameManager:playerAction:ante', position, amount);
                        
                    break;
                case 104: //fold
                    this.activeBets[position] = { action: 'fold', amount: 0, isAllin: false };
                    this.app.fire('GameManager:playerAction:fold', position, true);
                        
                    break;
                case 105: // call
                    this.activeBets[position] = { action: 'call', amount: amount, isAllin: false };
                    this.app.fire('GameManager:playerAction:call', position, amount);
                        
                    break;
                case 106: //check
                    delete this.activeBets[position];
                    this.app.fire('GameManager:playerAction:check', position);
                        
                    break;
                case 107:   //bet   
                    this.activeBets[position] = { action: 'bet', amount: amount, isAllin: false };
                    this.app.fire('GameManager:playerAction:bet', position, amount);
                        
                    break;
                case 108: //raise
                    this.activeBets[position] = { action: 'raise', amount: amount, isAllin: false };
                    this.app.fire('GameManager:playerAction:raise', position, amount);
                        
                    break;
                case 109:   //allin
                    this.activeBets[position] = { action: 'allin', amount: amount, isAllin: true };
                    this.app.fire('GameManager:playerAction:allin', position, amount, true);
                        
                    break;
                
            }
            
         
        }
        this.app.fire('CardsManager:DealCommunityCards_withoutAnimaton', payload.current_hand.community_cards);

        var count = (payload.config && payload.config.game_type === 103) ? 4 : 2;

        if (this.your_seat > -1) {
            var holeCardsPayload = { count: count };
            if (payload.your_hole_cards && payload.your_hole_cards.length > 0) {
                holeCardsPayload.cards = payload.your_hole_cards;
            }
            this.app.fire('CardsManager:DealHoleCards_withoutAnimation', holeCardsPayload);
            this.isAnyHoleCardInTable = true;
        }
        console.error("current_hand is true rn"  + this.didCurrentHandSetUp)
        this.didCurrentHandSetUp = true;
    },
    wsHandleUpdateChat: function (username, message, time, player_id) {

        let enableSound = false;

        if (player_id !== this.youreID) {
            enableSound = true;
        }

        var date = new Date(time * 1000);
        var hours = date.getUTCHours().toString().padStart(2, '0');
        var minutes = date.getUTCMinutes().toString().padStart(2, '0');
        var readableTime = hours + ':' + minutes;

        this.app.fire(
            "GameManager_Message:AddNeMessage",
            username,
            message,
            readableTime,
            enableSound,
        );
    },
    wsHandleUpdateBalance: function (position, change, balance) {
        // payload.position, payload.balance, payload.change, payload.reason
        // balance is the current seat balance
        // change is the change from previous balance for example:
        //  1. previous=100; now=250; change=+150
        //  2. previous=100; now=75; change=-25

        let animationEnable = true;
        this.app.fire("GameManager:updateSpecificPlayerInfo:player_balance", position, balance, change, animationEnable); // false nese sduhet animacion
    },
    setButtonsUIState: function (setButtonsUIState, dontShowNothing = false) {// true for active
        this.app.fire('GameManager_UiMenager:EnableDisableButtonsUI', setButtonsUIState, dontShowNothing);
        this.app.fire('GameManager_UiMenager:ButtonsState', setButtonsUIState, dontShowNothing);

    },
    _handleWsMessages: function (message) {
        // Message contents, different for each type of message
        const payload = message.payload;

        console.log('_handleWsMessages called:', message.type)

        switch (message.type) {
            case "table_state":
                this.wsHandleTableStateTicker(payload);
                return;

            case "player_joined": //mun me kan spectator , per me u ul useri osht player
                // TODO: implement
                return;

            case "player_left": //pastro kejt qa ka edhe action edhe kartat edhe kejt
                if (payload.player_id === this.youreID) {
                    window.location.replace(window.MasterController.originUrl);
                    return;
                }

                // var payload.position = this.F(payload.position);
                this.app.fire("GameManager:updateSpecificPlayerInfo:player_left", payload.position);
                this.app.fire('CardsManager:cardsAnimationOnLeft', payload.position);
                this.app.fire('GameManager:collectSpecificPlayersAction', payload.position);
                this.app.fire('GameManager:disableSpecificPlayerBet', payload.position);
                this.app.fire('PlaySound_collectChips');

                return;

            case "player_seated":

                if (payload.player_id == this.youreID) {
                    this.app.fire("PlayerManager:ShowPlayerCardUIWhenCameraFinished", false);
                    this.app.fire('GameManager:collectPlayersAction');
                    this.app.fire('GameManager:disablePlayerBet');
                    this.app.fire('GameManager:collectAllinActions');
                    
                    this.app.fire('GameManager_PlayerFlow:playerTurn',-1);

                    var oldServerToUiMap = Object.assign({}, this._serverToUiMap);

                    this.wrapSeatsOnSeated(this.currentSeatsPayload.seats, payload.position);

                    this.app.fire('GameManager:defineIsMainUserPlaying', true);
                    this.app.fire('GameManager:updatePlayersInfo', this.currentSeatsPayload.seats);
                    
                    // var isSitOut = (payload.your_status === 102);
                    this.app.fire("SettingsController:SetSitInButtonState", true);// was !isSitOut
                    

                    setTimeout(() => {
                        this._sanitizeActiveBets(); // per actions
                        for (var serverPos in this.activeBets) { 
                            var bet = this.activeBets[serverPos];
                            var pos = parseInt(serverPos);

                            switch (bet.action) {
                                case 'smallblind': this.app.fire('GameManager:playerAction:smallblind', pos, bet.amount); break;
                                case 'bigblind': this.app.fire('GameManager:playerAction:bigblind', pos, bet.amount); break;
                                case 'ante': this.app.fire('GameManager:playerAction:ante', pos, bet.amount); break;
                                case 'bet': this.app.fire('GameManager:playerAction:bet', pos, bet.amount); break;
                                case 'call': this.app.fire('GameManager:playerAction:call', pos, bet.amount); break;
                                case 'raise': this.app.fire('GameManager:playerAction:raise', pos, bet.amount); break;
                                case 'allin': this.app.fire('GameManager:playerAction:allin', pos, bet.amount, true); break;
                                case 'fold': this.app.fire('GameManager:playerAction:fold', pos, true); break;
                            }
                        }
                        if(this.isAnyHoleCardInTable){
                            this.app.fire('CardsManager:TeleportCardsToNewPositions', oldServerToUiMap, this._serverToUiMap);
                        }
                    }, 600);
                }
                // per kejt

                this.app.fire("GameManager:updateSpecificPlayerInfo:player_seated",
                    payload.position,
                    payload.username,
                    payload.player_id,
                    payload.balance,
                );
                this.app.fire("GameManager:updateProfile:player_seated", payload.position, payload.imageUrl);
                return;
            case "player_stood": // what here exacly come
                // this.app.fire("GameManager:updateSpecificPlayerInfo:player_stood",);
                return;

            case "balance_updated": // fixed
                this.wsHandleUpdateBalance(payload.position, payload.change, payload.balance);
                return;

            case "chat_message":

                // player_id
                // username
                // message
                // time (unix time stamp)

                this.wsHandleUpdateChat(payload.username, payload.message, payload.time, payload.player_id);
                return;
            case "player_turn_extra_time":

                this.app.fire('GameManager:SetTimeToUSerTImer', payload.time_remaining);
                this.app.fire('GameManager_PlayerFlow:playerTurn', payload.position);
                return;
            case "notifications":
                this.app.fire(
                    "NotificationsController:addNotification",
                    payload.text,
                    payload.time,
                ); // timmer o per sa sekonda me nejt i shfaqet, nese se definon e ka default 9
                return;

            case "hand_starting":
                if (this.handId !== -1 && this.handId !== payload.id) {
                    // console.error("mreana hand_starting");
                    this.activeBets = {};
                    //a me i qu d,s,m te dealeri (pozita dealer femen) se meniher po na bjen me i thirr posht?
                    // this.app.fire('GameManager:collectPlayersAction');
                    this.app.fire('GameManager:disablePlayerBet');
                    this.app.fire('GameManager:collectAllinActions');
                    this.app.fire('PlaySound_collectChips');
                    this.app.fire('GameManager_RESTARTSCRIPT');
                }
                this.handId = payload.id;
                //per levizje t chipit
                this.app.fire('BlindController:set_BothBlinds', payload.dealer_pos, payload.small_blind_pos, payload.big_blind_pos);
                // per me e show action n tavolin
                // this.app.fire('GameManager:playerAction:smallblind', payload.small_blind_pos, payload.small_blind);
                // this.app.fire('GameManager:playerAction:bigblind', payload.big_blind_pos, payload.big_blind);
                //per me update user card(dealer not needed), so npayload?


                //sjan payload amo them needed
                // this.app.fire("GameManager:updateSpecificPlayerInfo:player_balance", payload.small_blind_pos, payload.small_blind);
                // this.app.fire("GameManager:updateSpecificPlayerInfo:player_balance", payload.big_blind_pos, payload.big_blind);  

                return;

            case "hole_cards":
                this._lastHoleCardsPayload = payload; // store it
                this.app.fire('CardsManager:DealHoleCards', payload);
                this.isAnyHoleCardInTable = true;
                return

            case "community_cards":
                // Table's cards
                this.app.fire('CardsManager:DealCommunityCards', payload.cards);
                return;

            case "betting_round":
                this.activeBets = {};
                //fshi actions prej positoinChipThatMoveToChipsClonePosition
                // this.app.fire('GameManager_PlayerFlow:CollectActions');
                this.app.fire('PlaySound_collectChips');
                this.app.fire('GameManager:collectPlayersAction');
                this.app.fire('GameManager:disablePlayerBet');
                return;

            case "player_turn":

                // payload.position;
                // payload.time_remaining;
                // let buttons = payload.validactions;
                // payload.call_amount;
                // payload.min_bet;
                // payload.max_Bet;

                this.app.fire('PlayerFlowManager:Activate circle', payload.time_remaining);
                this.app.fire('GameManager:getValuesThatMainUserCanBet:Raise',
                    payload.max_bet,
                    payload.min_bet
                );

                if (payload.position == this.getYoureSeat()) {
                    this.app.fire("PlaySound_Turn");
                    this.app.fire('GameManager:ActiveButtons', payload.valid_actions, payload.call_amount);
                }
                else {
                    this.app.fire("GameManager_UiMenager:ButtonsState", false);
                    //need to fix the logix for passive buttons
                    // this.app.fire('GameManager:PassiveButtons', payload.valid_actions, payload.call_amount);
                }

                this.app.fire('GameManager_PlayerFlow:playerTurn', payload.position);
                return;

            case "player_disconnected":
                this.app.fire('PlaySound_UserLeft');
                this.app.fire('GameManager:playerStatus:disconnected', payload.position);
                return;

            case "player_reconnected":
                this.app.fire('PlaySound_UserJoin');
                this.app.fire('GameManager:playerStatus:connected', payload.position);
                return;

            case "player_acted":

                if (payload.action !== "sit_out" && payload.action !== "sit_in") {
                    this.app.fire('GameManager_UiMenager:tableValue', payload.pot_total);
                }
                switch (payload.action) {
                    case "small_blind":
                        this.activeBets[payload.position] = { action: 'smallblind', amount: payload.amount, isAllin: false };
                        this.app.fire("GameManager:updateSpecificPlayerInfo:player_balance", payload.position, payload.new_balance);
                        this.app.fire('GameManager:playerAction:smallblind', payload.position, payload.amount);
                        return;
                    case "big_blind":
                        this.activeBets[payload.position] = { action: 'bigblind', amount: payload.amount, isAllin: false };
                        this.app.fire("GameManager:updateSpecificPlayerInfo:player_balance", payload.position, payload.new_balance);
                        this.app.fire('GameManager:playerAction:bigblind', payload.position, payload.amount);
                        return;
                    case "ante":
                        this.activeBets[payload.position] = { action: 'ante', amount: payload.amount, isAllin: false };
                        this.app.fire("GameManager:updateSpecificPlayerInfo:player_balance", payload.position, payload.new_balance);
                        this.app.fire('GameManager:playerAction:ante', payload.position, payload.amount);
                        return;
                    case "bet":
                        this.activeBets[payload.position] = { action: 'bet', amount: payload.amount, isAllin: false };
                        this.app.fire("GameManager:updateSpecificPlayerInfo:player_balance", payload.position, payload.new_balance);
                        this.app.fire('GameManager:playerAction:bet', payload.position, payload.amount);
                        return;
                    case "call":
                        this.activeBets[payload.position] = { action: 'call', amount: payload.amount, isAllin: false };
                        this.app.fire("GameManager:updateSpecificPlayerInfo:player_balance", payload.position, payload.new_balance);
                        this.app.fire('GameManager:playerAction:call', payload.position, payload.amount);
                        return;
                    case "raise":
                        this.activeBets[payload.position] = { action: 'raise', amount: payload.amount, isAllin: false };
                        this.app.fire("GameManager:updateSpecificPlayerInfo:player_balance", payload.position, payload.new_balance);
                        this.app.fire('GameManager:playerAction:raise', payload.position, payload.amount);
                        return;
                    case "all_in":
                        this.activeBets[payload.position] = { action: 'allin', amount: payload.amount, isAllin: true };
                        this.app.fire("GameManager:updateSpecificPlayerInfo:player_balance", payload.position, payload.new_balance);
                        this.app.fire('GameManager:playerAction:allin', payload.position, payload.amount, true);
                        return;
                    case "fold":
                        this.activeBets[payload.position] = { action: 'fold', amount: 0, isAllin: false };
                        this.app.fire("GameManager:updateSpecificPlayerInfo:player_balance", payload.position, payload.new_balance);
                        this.app.fire('GameManager:playerAction:fold', payload.position, true);
                        return;
                    case "check":
                        delete this.activeBets[payload.position];
                        this.app.fire('GameManager:playerAction:check', payload.position);
                        return;
                      case "sit_in":
                        
                        if(payload.position === this.getYoureSeat()){
                            this.app.fire("SettingsController:SetSitInButtonState", true);
                        }
                        this.app.fire('PlaySound_UserJoin');
                        this.app.fire('GameManager:playerStatus:sitin', payload.position);
                        return;

                    case "sit_out":
                        if(payload.position === this.getYoureSeat()){
                            this.app.fire("SettingsController:SetSitInButtonState", false);
                            this.app.fire("GameManager_UiMenager:ButtonsState", false);
                        }
                        this.app.fire('PlaySound_UserLeft');
                        this.app.fire('GameManager:playerStatus:sitout', payload.position);
                        return;
                }
                return; 

            case "pot_updated":

                //total_pot
                //sen tjt
                this.app.fire('GameManager_UiMenager:tableValue', payload.total_pot);
                return;

            case "showdown": // qikjo vjen mi shfaq kartat
          

                // this.app.fire('GameManager:collectAllinActions');
                // this.app.fire('GameManager_RESTARTSCRIPT');



                for (let i = 0; i < payload.reveals.length; i++) {
                    const playerPositoin = payload.reveals[i].position;
                    const playerCards = payload.reveals[i].hole_cards;
                    const cards_rank = payload.reveals[i].hand_rank;
                    const cards_desc = payload.reveals[i].hand_desc;
                    this.app.fire('GameManager_State:showDownCardsArray', playerPositoin, playerCards);
                }
                return;

            case "hand_result": // ka mundsi sperdoret - diskuto

                return;

            case "hand_ended": 

                this.app.fire('GameManager_PlayerFlow:playerTurn', -1);
                this.app.fire("GameManager_UiMenager:ButtonsState", false);
                var textToShow = "Hand ended & winners declared";
                for (let i = 0; i < payload.winners.length; i++) {
                    const _ui_winner = this.serverToUiIndex(payload.winners[i].position);
                    const winnerPosition = payload.winners[i].position;
                    const cards_rank = payload.winners[i].hand_rank;
                    const cards_desc = payload.winners[i].hand_desc;
                    const amount = payload.winners[i].amount;
                    const new_balance = payload.winners[i].new_balance;

                    const didIWin = winnerPosition === this.getYoureSeat();
                    // console.error(didIWin ? ("po" + winnerPosition + " seat " + this.getYoureSeat()) : ("jo" + winnerPosition + " seat " + this.getYoureSeat()))
                    // this.app.fire('DisableCurrentButtonsToClickAction');
                    this.app.fire('GameManager_State:game_won:chipsReward', winnerPosition, amount);

                    if (didIWin) {

                        // didIWin = true;
                        textToShow = cards_desc.toString();
                    }


                    this.app.fire('GameManager_State:game_won:CardUserReward', winnerPosition, amount, new_balance, '', '');
                    this.handId = 0;
                }
                // if(didIWin){
                this.app.fire('GameActionNotifier:show', textToShow);
                // }
                this.app.fire("NotificationsController:addNotification", "dora tjeter fillon pas " + payload.next_hand_in + " sekonda");
                return;

            //kur me pastru kejt ....
            //this.app.fire('GameManager_RESTARTSCRIPT'); // qekjo i pastron gjithqka , perveq userCards


            case "error":
                // payload.code; payload.message

                // Capitalize the first letter of a message
                // const msg =
                //     payload.message.charAt(0).toUpperCase() + payload.message.slice(1);

                // Show error message on screen
                console.error("📩 ws error received:", payload.message);

                this.app.fire("NotificationsController:addNotification", payload.message);
                return;
        }

        return;
    },
    // Acceptable message types:
    // "take_seat", "leave_seat", "leave_table", "sit_out", "sit_in", "add_balance",
    // "send_chat", "fold", "check", "call", "bet", "raise", "all_in", "ping", "pong"
    wsSendMessage: function (msgType, msgPayload) {
        return window.MasterController.sendWs(msgType, msgPayload);
    },
    _initializeEventsThatFrontSend: function () {

        // requests

        this.app.on('GameManager:get_state', this.get_state, this);
        this.app.on('balanceManager:RequestToSitIn', this.requestToSitIn, this);

        this.app.on("SettingsController:SitOut", this.userSendSitOutRequest, this);
        this.app.on("SettingsController:SitIn", this.userSendSitInRequestFromSettings, this);
        this.app.on("SettingsController:StandUp", this.userSendStandUpRequest, this);

        this.app.on('balanceManager:MainUserAddedBalance', this.requestToAddBalance, this)


        //buy 1 more turn
        this.app.on('TimmerButton:Clicked', this.mainUserClickedButtonToBuyTime, this);

        //playerActed
        this.app.on('GameManager_UIManager:Check', this.playerActed_Check, this);
        this.app.on('GameManager_UIManager:Call', this.playerActed_Call, this);
        this.app.on('RaiseBetController:amountFromRaise', this.playerActed_Raise, this);
        this.app.on('RaiseBetController:amountFromBet', this.playerActed_Bet, this);
        this.app.on('GameManager_UIManager:AllIn', this.playerActed_AllIn, this);
         this.app.on('GameManager_UIManager:Fold', this.playerActed_Fold, this);

        //Message   
        this.app.on('GameManager_Message:NewMessageCalled', this.mainUserSendMessageInChat, this);


        //Buy timmer Button, if it enable_disable_UIUsers
        this.app.on('TimmerButton:Clicked', this.requestToBuyTimmer, this);
    },
    //User Sit in
    get_state: function () {
        console.log("Scripts Are Ready, give me table_state now");
        this.allScriptsInitialized = true;
        this.wsSendMessage("get_state", {});
    },
    // User to Sit In from settings
    userSendSitInRequestFromSettings: function () {
        console.log("request to sit In from Settings");
        this.wsSendMessage("sit_in", {});
    },
    // User to Sit Out from button
    requestToSitIn: function (tableIndex, amountRequest) {
        console.log("request to sit in " + tableIndex + " amount " + amountRequest);
        // tableIndex =
        this.wsSendMessage("take_seat", {
            position: tableIndex,
            buy_in: amountRequest,
        });
    },
    //User to Sit Out
    userSendSitOutRequest: function () {
        // console.error("request to sit Out");
        this.wsSendMessage("sit_out", {});
    },
    //User to Stand Up
    userSendStandUpRequest: function () {
        console.log("request to stend Up");
        this.wsSendMessage("leave_seat", {});
    },
    //Main User Added Balance
    requestToAddBalance: function (amountRequest) {
        console.log("Main User want to add this amount " + amountRequest + " in balance");

        this.wsSendMessage("add_balance", {
            amount: amountRequest,
        });
    },
    //Sit in -> AMOUNT
    amountFromTheDepositRequest: function (amount) {
        console.log(amount);
        // this.wsSendMessage("", {
        // });
    },
    //Player Acted

    playerActed_Check: function () {
        console.log('Player Acted Check');
        this.wsSendMessage("check", {});
        // this.wsSendMessage("", {
        // });
    },
    playerActed_Call: function () {
        console.log('Player Acted Call');
        this.wsSendMessage("call", {});
        // this.wsSendMessage("", {
        // });
    },

    playerActed_Raise: function (amount, isFrom) {
        console.log(amount);
        this.wsSendMessage("raise", {
            amount: amount,
        });

    },
    playerActed_Bet: function (amount, isFrom) {
        // console.error("bet " +amount);
        this.wsSendMessage("bet", {
            amount: amount,
        });

    },
    playerActed_AllIn: function () {
        console.log('Player Acted all_in');
        this.wsSendMessage("all_in", {});
    },
    playerActed_Fold: function () {
        console.log('Player Acted Fold');
        this.wsSendMessage("fold", {});
    },
    //User whan to buy turn, happend when it allowed
    mainUserClickedButtonToBuyTime: function () {
        this.wsSendMessage("", {});
    },
    //user wamt tp send a message
    mainUserSendMessageInChat: function (value) {
        console.log("message index " + value);
        this.wsSendMessage("", {});
    },

    //Buy Timmer Button
    requestToBuyTimmer: function () {
        console.log('Player Request To Buy more time');
        // this.wsSendMessage("", {
        // });
    },
    // Maybe needed for BACK
    isReady: function () {
        return !!(this.app && this.app.root);
    },

    getPCScript: function () {
        return this._pcScript;
    },
};

if (typeof pc !== "undefined" && pc.app) {
    window.GameManager.initialize(pc.app);
}