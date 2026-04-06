var TournametEvent = pc.createScript('tournametEvent');

TournametEvent.prototype.initialize = function () {
    this.app.on('Tournament_Event:Disqualified', this.disqualifiedPopUp, this);

    this.disqualifiedPopUp(true);
};

TournametEvent.prototype.disqualifiedPopUp = function (state) {

    if (!state) {
        const oldPopup = document.getElementById("disqualifiedPopup");
        if (oldPopup) oldPopup.remove();

        const oldStyle = document.getElementById("disqualifiedPopupCSS");
        if (oldStyle) oldStyle.remove();

        return;
    }

    const oldPopup = document.getElementById("disqualifiedPopup");
    if (oldPopup) oldPopup.remove();
    const oldStyle = document.getElementById("disqualifiedPopupCSS");
    if (oldStyle) oldStyle.remove();

    const container = document.createElement("div");
    container.id = "disqualifiedPopup";
    container.innerHTML = `
        <div class="dq-box">
            <p class="dq-text">Fatkeqësisht ju jeni diskualifikuar nga turneu</p>
            <button class="dq-btn">Kthehu në Menu</button>
        </div>
    `;

    const style = document.createElement("style");
    style.id = "disqualifiedPopupCSS";
    style.innerHTML = `
        #disqualifiedPopup {
            position: fixed;
            top: 0; 
            left: 0;
            width: 100vw; 
            height: 100vh;
            background: #000000; /* FULL BLACK */
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            opacity: 0;
            animation: dqFadeIn 0.7s ease forwards;
        }

        @keyframes dqFadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
        }

        .dq-box {
            background: linear-gradient(145deg, #ffffff, #f0f0f0);
            padding: 40px 55px;
            border-radius: 18px;
            text-align: center;
            font-family: 'Segoe UI', sans-serif;
            max-width: 380px;
            box-shadow: 0 0 25px rgba(0,0,0,0.3),
                        0 0 18px rgba(192, 57, 43, 0.4);
            transform: scale(0.7);
            animation: dqZoomIn 0.5s ease forwards 0.1s;
        }

        @keyframes dqZoomIn {
            from { transform: scale(0.7); opacity: 0; }
            to   { transform: scale(1); opacity: 1; }
        }

        .dq-text {
            font-size: 22px;
            font-weight: 600;
            color: #c0392b;
            text-shadow: 0 0 12px rgba(231, 76, 60, 0.45);
            margin-bottom: 25px;
            margin-top: 0;
        }

        .dq-btn {
            padding: 12px 22px;
            font-size: 18px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            transition: 0.2s;
        }

        .dq-btn:hover {
            background: #2980b9;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(container);

    const btn = container.querySelector(".dq-btn");
    btn.onclick = () => {
        window.location.href = "http://google.com/";
    };
    setTimeout(() => {
        if (document.getElementById("disqualifiedPopup")) {
            window.location.href = "http://google.com/";
        }
    }, 15000);
};
