var TournamentEventQualified = pc.createScript('tournamentEventQualified');

TournamentEventQualified.prototype.initialize = function() {
    this.app.on("TournamentEvent:Qualified_State", this.qualified_State, this);
};

TournamentEventQualified.prototype.qualified_State = function(isEnable) {

    if (!isEnable) {
        this.disable();
        return;
    }

    this.disable();

    const container = document.createElement("div");
    container.id = "qualifiedPopup";
    container.innerHTML = `
        <div class="ql-box">
            <p class="ql-text">Ju jeni pranuar në turne!</p>
        </div>
    `;

    const style = document.createElement("style");
    style.id = "qualifiedPopupCSS";
    style.innerHTML = `
        #qualifiedPopup {
            position: fixed;
            top: 0; left: 0;
            width: 100vw; height: 100vh;
            background: #000000; /* FULL BLACK BACKGROUND */
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            opacity: 0;
            animation: qlFadeIn 0.8s ease forwards;
        }

        @keyframes qlFadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
        }

        .ql-box {
            background: linear-gradient(145deg, #ffffff, #f5f5f5);
            padding: 40px 55px;
            border-radius: 18px;
            text-align: center;
            font-family: 'Segoe UI', sans-serif;
            max-width: 380px;
            box-shadow: 0 0 25px rgba(0,0,0,0.28),
                        0 0 18px rgba(46, 204, 113, 0.5);
            transform: scale(0.7);
            animation: qlZoomIn 0.5s ease forwards 0.1s;
        }

        @keyframes qlZoomIn {
            from { transform: scale(0.7); opacity: 0; }
            to   { transform: scale(1); opacity: 1; }
        }

        .ql-text {
            font-size: 26px;
            font-weight: 600;
            color: #1e8449;
            text-shadow: 0 0 12px rgba(46,204,113,0.45);
            margin: 0;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(container);
};
TournamentEventQualified.prototype.disable = function () {

    const oldPopup = document.getElementById("qualifiedPopup");
    if (oldPopup) oldPopup.remove();

    const oldStyle = document.getElementById("qualifiedPopupCSS");
    if (oldStyle) oldStyle.remove();
};
