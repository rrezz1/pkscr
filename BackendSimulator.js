window.BackendSimulator = {

    app: null,
    evtSource: null,
    _pcScript: null,
    _intervalId: null,
    _currentIndex: 0,

    // Each entry: { delay: ms before firing, msg: ws message object }
    // delay is relative to the PREVIOUS message in the sequence.
    _messages: [
        // ── HAND 1 ────────────────────────────────────────────────────────────
        { delay: 2000, msg: {
            "type": "hand_starting",
            "payload": {
                "id": 100163021,
                "dealer_pos": 2,
                "small_blind_pos": 2,
                "big_blind_pos": 4,
                "small_blind": 100,
                "big_blind": 200
            }
        }},
        
        { delay: 800, msg: {
            "type": "player_acted",
            "payload": {
                "position": 2,
                "action": "small_blind",
                "amount": 100,
                "new_balance": 3900,
                "pot_total": 100
            }
        }},
        { delay: 800, msg: {
            "type": "player_acted",
            "payload": {
                "position": 4,
                "action": "big_blind",
                "amount": 200,
                "new_balance": 3800,
                "pot_total": 300
            }
        }},
        { delay: 800, msg: {
            "type": "player_acted",
            "payload": {
                "position": 4,
                "action": "call",
                "amount": 200,
                "new_balance": 3800,
                "pot_total": 300
            }
        }},
        { delay: 800, msg: {
            "type": "player_turn",
            "payload": {
                "position": 2,
                "time_remaining": 60,
                "valid_actions": [104, 105, 108],
                "call_amount": 100,
                "min_bet": 200,
                "max_bet": 3900
            }
        }},

        // hand_ended 200ms after fold
        { delay: 900, msg: {
            "type": "hand_ended",
            "payload": {
                "id": 100163021,
                "winners": [{
                    "position": 2,
                    "amount": 300,
                    "new_balance": 4200,
                    "pot_index": [0],
                    "hand_rank": "High Card",
                    "hand_desc": "Ace High"
                }],
                "next_hand_in": 3
            }
        }},
        // ── HAND 2 — hand_starting + hole_cards within 500ms total ────────────
        { delay: 300, msg: {
            "type": "hand_starting",
            "payload": {
                "id": 100163022,
                "dealer_pos": 4,
                "small_blind_pos": 4,
                "big_blind_pos": 2,
                "small_blind": 100,
                "big_blind": 200
            }
        }},
        { delay: 800, msg: {
            "type": "player_seated",
            "payload": {
                "position": 1,
                "username": "qdqwdwqdqwdqwd",
                "player_id":1123387,
                "balance": 1000,
            }
        }},

        { delay: 840, msg: {
            "type": "player_acted",
            "payload": {
                "position": 1,
                "action": "sit_out"
            }
        }},
        // hole_cards arrives 200ms after hand_starting — fast re-deal scenario
        { delay: 200, msg: {
            "type": "hole_cards",
            "payload": {
                "cards": ["Ah", "Kh", "Qd", "Jc"],
                "count": 4
            }
        }},
        { delay: 800, msg: {
            "type": "player_acted",
            "payload": {
                "position": 4,
                "action": "small_blind",
                "amount": 100,
                "new_balance": 4100,
                "pot_total": 100
            }
        }},
        { delay: 800, msg: {
            "type": "player_acted",
            "payload": {
                "position": 2,
                "action": "big_blind",
                "amount": 200,
                "new_balance": 4000,
                "pot_total": 300
            }
        }},
        { delay: 800, msg: {
            "type": "player_turn",
            "payload": {
                "position": 4,
                "time_remaining": 60,
                "valid_actions": [104, 105, 108],
                "call_amount": 100,
                "min_bet": 200,
                "max_bet": 4100
            }
        }},
        { delay: 2000, msg: {
            "type": "community_cards",
            "payload": {
                "round": "flop",
                "cards": ["2s", "Jd", "8d"]
            }
        }},
        { delay: 2000, msg: {
            "type": "community_cards",
            "payload": {
                "round": "turn",
                "cards": ["5h"]
            }
        }},
        { delay: 2000, msg: {
            "type": "community_cards",
            "payload": {
                "round": "river",
                "cards": ["9c"]
            }
        }},
        { delay: 1000, msg: {
            "type": "showdown",
            "payload": {
                "reveals": [
                    
                    {
                        "position": 2,
                        "hole_cards": ["2c","3h","Kd","As"],
                        "hand_rank": "High Card",
                        "hand_desc": "Ace High"
                    }
                ]
            }
        }},
        { delay: 1000, msg: {
            "type": "hand_ended",
            "payload": {
                "id": 100163022,
                "winners": [{
                    "position": 2,
                    "amount": 600,
                    "new_balance": 4700,
                    "pot_index": [0],
                    "hand_rank": "Straight",
                    "hand_desc": "Ace High Straight"
                }],
                "next_hand_in": 3
            }
        }},
        // Loop marker — 3s pause then loops back
        { delay: 3000, msg: {
            "type": "notifications",
            "payload": { "text": "--- loop restart ---" }
        }}
    ],

    initialize: function (app) {
        this.app = app;

        if (typeof pc !== 'undefined' && pc.createScript) {
            this._createPCScript();
        }

        return this;
    },

    _createPCScript: function () {
        if (this._pcScript) return;

        this._pcScript = pc.createScript('backendSimulator');
        var self = this;

        this._pcScript.prototype.initialize = function () {
            self.app = this.app;
            self.testScript();
        };
    },

    testScript: function () {
        var self = this;
        var original = window.GameManager.wsSendMessage.bind(window.GameManager);
        
        window.GameManager.wsSendMessage = function(msgType, msgPayload) {
            if (msgType === 'get_state') {
                console.log('[BackendSimulator] intercepted get_state → firing table_state');
                self.table_state();
                return;
            }
            // Çdo mesazh tjetër logoje (ose shto logjikë)
            console.log('[BackendSimulator] wsSendMessage intercepted:', msgType, msgPayload);
        };
    },

    table_state: function () {

            window.GameManager._handleWsMessages(
                {
  "type": "table_state",
  "payload": {
    "table_id": 8135821,
    "table_name": "No-Limit Texas Hold'em - Normal",
    "config": {
      "id": 8135821,
      "name": "No-Limit Texas Hold'em - Normal",
      "type": 101,
      "speed": 101,
      "betting_structure": 101,
      "max_seats": 9,
      "min_players": 2,
      "small_blind": 50,
      "big_blind": 100,
      "min_buy_in": 2000,
      "max_buy_in": 10000,
      "rake_percent": 0.0349453355642855,
      "rake_cap": 0,
      "allow_buy_more_time": true,
      "allow_stack_match": true,
      "max_time_bank": 0,
      "created_at": "2025-03-05T01:40:26.251909111Z",
      "updated_at": "2025-12-22T06:49:18.114900024Z"
    },
    "status": "Playing",
    "seats": [
      {
        "position": 0,
        "status": 101,
        "is_empty": true
      },
      {
        "position": 1,
        "status": 101,
        "is_empty": true
      },
      {
        "position": 2,
        "player_id": 1128307,
        "username": "ArchibaldBurlyWood",
        "balance": 1950,
        "status": 104,
        "current_bet": 50,
        "is_connected": true,
        "is_empty": false,
        "is_dealer": true,
        "is_turn": true
      },
      {
        "position": 3,
        "player_id": 1128307,
        "username": "ArchibaldBurlyWood",
        "balance": 1950,
        "status": 104,
        "current_bet": 50,
        "is_connected": true,
        "is_empty": false,
        "is_dealer": true,
        "is_turn": true
      },
      {
        "position": 4,
        "status": 101,
        "is_empty": true
      },
      {
        "position": 5,
        "player_id": 112387,
        "username": "Tcl763",
        "balance": 1300,
        "status": 104,
        "current_bet": 700,
        "is_connected": true,
        "is_empty": false,
        "is_player": true,
        "hole_cards": [
          "Kh",
          "6d"
        ]
      },
      {
        "position": 6,
        "status": 101,
        "is_empty": true
      },
      {
        "position": 7,
        "status": 101,
        "is_empty": true
      },
      {
        "position": 8,
        "status": 101,
        "is_empty": true
      }
    ],
    "dealer_pos": 2,
    "your_id": 1123387,
    "your_accounts_balance": 50000,
    "your_status": 104,
    "your_seat": 2,
    "your_hole_cards": [
      "Kh",
      "6d"
    ],
    "your_balance": 1300,
    "current_hand": {
      "id": 100163151,
      "round": "turn",
      "community_cards": [
        "Qc",
        "Kd",
        "3h",
        "Ks"
      ],
      "pots": [
        {
          "Amount": 100,
          "Eligible": [2, 5]
        }
      ],
      "total_pot": 750,
      "uncalled_bets": {
        "5": 650
      },
      "current_bet": 600, //?
      "min_raise": 600, //?
      "dealer_pos": 5,
      "participants": [
        {
          "current_bet": 0,
          "current_stack": 1950,
          "is_turn": true,
          "position": 2,
          "status": 104,
          
          "total_bet": 50,
          "valid_actions": [104, 105, 108]
        },
         {
          "current_bet": 600,
          "current_stack": 1300,
          "is_turn": false,
          "last_betting_action": {
            "action": 107,
            "amount": 600
          },
          "position": 3,
          "status": 104,
          "total_bet": 700
        },
        {
          "current_bet": 600,
          "current_stack": 1300,
          "is_turn": false,
          "last_betting_action": {
            "action": 107,
            "amount": 600
          },
          "position": 5,
          "status": 104,
          "total_bet": 700
        }
      ],
      "active_pos": 2,
      "time_remaining": 45
    }
  }
}

);

            // Start message loop 3 seconds after table_state
            setTimeout(() => {
                this._startMessageLoop();
            }, 3000);

   
    },

    _startMessageLoop: function () {
        if (this._intervalId) return;
        this._currentIndex = 0;
        this._scheduleNext();
    },

    _scheduleNext: function () {
        if (this._currentIndex >= this._messages.length) {
            this._currentIndex = 0;
        }
        var entry = this._messages[this._currentIndex];
        this._intervalId = setTimeout(() => {
            window.GameManager._handleWsMessages(entry.msg);
            this._currentIndex++;
            this._intervalId = null;
            this._scheduleNext();
        }, entry.delay);
    },

    stopMessageLoop: function () {
        if (this._intervalId) {
            clearTimeout(this._intervalId);
            this._intervalId = null;
        }
    },

    isReady: function () {
        return !!(this.app && this.app.root);
    },

    getPCScript: function () {
        return this._pcScript;
    }
};

if (typeof pc !== 'undefined' && pc.app) {
    window.BackendSimulator.initialize(pc.app);
}