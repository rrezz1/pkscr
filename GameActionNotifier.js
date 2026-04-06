var GameActionNotifier = pc.createScript('gameActionNotifier');

GameActionNotifier.prototype.initialize = function () {
    this._createUI();
    this.isTextShowed = false;
    this.app.on('GameActionNotifier:show', this.showMessage, this);
    this.app.on('GameActionNotifier:stateShow', this.messageState, this);
    this.app.on('GameManager_RESTARTSCRIPT', this.resetScript, this);
    // setTimeout(() => {
    //     this.showMessage('FULL HOUSE');
    // }, 5000);
};

GameActionNotifier.prototype._createUI = function () {
    if (this.root) return;

    this.root = document.createElement('div');
    this.root.id = 'poker-notifier';

    this.bg = document.createElement('div');
    this.bg.className = 'poker-bg';

    this.leftLine = document.createElement('div');
    this.leftLine.className = 'poker-line left';

    this.textEl = document.createElement('div');
    this.textEl.className = 'poker-text';

    this.rightLine = document.createElement('div');
    this.rightLine.className = 'poker-line right';

    this.root.appendChild(this.bg);
    this.root.appendChild(this.leftLine);
    this.root.appendChild(this.textEl);
    this.root.appendChild(this.rightLine);

    document.body.appendChild(this.root);

    if (!document.getElementById('poker-notifier-style')) {
        const style = document.createElement('style');
        style.id = 'poker-notifier-style';
        style.innerHTML = `
            :root {
                --gold-main: #f5d36b;
                --gold-glow: rgba(255,215,120,0.85);
                --glass: rgba(10,10,10,0.3);
                --line-width: 220px;
                --fullhouse-font-size: 38px;
            }

            #poker-notifier {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.9);
                display: flex;
                align-items: center;
                gap: 20px;
                opacity: 0;
                pointer-events: none;
                z-index: 99;
                transition:
                    opacity 0.5s ease-out;
            }

            #poker-notifier.show {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
                transition:
                    opacity 0.5s ease-out,
                    transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            #poker-notifier.showState {
                opacity: 0 !important;
                pointer-events: none !important;
                transition: opacity 0s ease-out !important;
            }

            .poker-bg {
                position: absolute;
                inset: -18px -30px;
                background: linear-gradient(
                    90deg,
                    rgba(10,10,10,0),
                    var(--glass),
                    rgba(10,10,10,0)
                );
                border-radius: 14px;
                opacity: 0;
                transition: opacity 0.5s ease-out;
            }

            #poker-notifier.show .poker-bg {
                opacity: 1;
            }

            .poker-text {
                position: relative;
                font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
                font-size: var(--fullhouse-font-size);
                font-weight: 700;
                letter-spacing: 0.18em;
                text-transform: uppercase;
                color: var(--gold-main);
                white-space: nowrap;
                text-align: center;
                text-shadow:
                    0 0 8px rgba(0,0,0,0.8),
                    0 0 14px var(--gold-glow);
                max-width: 80vw;
                opacity: 0;
                transform: translateY(10px);
                transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            #poker-notifier.show .poker-text {
                opacity: 1;
                transform: translateY(0);
            }

            .poker-line {
                height: 2px;
                width: var(--line-width);
                opacity: 0;
                background: var(--gold-main);
                transition: opacity 0.5s ease-out;
            }

            .poker-line.left {
                transform-origin: right center;
            }

            .poker-line.right {
                transform-origin: left center;
            }

            #poker-notifier.show .poker-line {
                opacity: 1;
            }

            /* iPhone 12 Pro  */
            @media (max-height: 850px) and (orientation: landscape) {
                #poker-notifier {
                    transform: translate(-50%, -50%) scale(0.9);
                }

                #poker-notifier.show {
                    transform: translate(-50%, -50%) scale(1);
                }

                .poker-text {
                    font-size: 30px;
                    letter-spacing: 0.14em;
                }

                .poker-bg {
                    inset: -14px -24px;
                }

                .poker-line {
                    width: 160px;
                }

                #poker-notifier {
                    gap: 18px;
                }
            }

            @media (max-height: 600px) and (orientation: landscape) {
                #poker-notifier {
                    transform: translate(-50%, -50%) scale(0.85);
                }

                #poker-notifier.show {
                    transform: translate(-50%, -50%) scale(0.95);
                }

                .poker-text {
                    font-size: 26px;
                    letter-spacing: 0.12em;
                }

                .poker-bg {
                    inset: -12px -20px;
                }

                .poker-line {
                    width: 120px;
                }

                #poker-notifier {
                    gap: 16px;
                }
            }

            @media (max-height: 450px) and (orientation: landscape) {
                #poker-notifier {
                    transform: translate(-50%, -50%) scale(0.8);
                }

                #poker-notifier.show {
                    transform: translate(-50%, -50%) scale(0.9);
                }

                .poker-text {
                    font-size: 22px;
                    letter-spacing: 0.1em;
                }

                .poker-bg {
                    inset: -10px -16px;
                }

                .poker-line {
                    width: 80px;
                }

                #poker-notifier {
                    gap: 14px;
                }
            }

            @media (max-height: 350px) and (orientation: landscape) {
                #poker-notifier {
                    transform: translate(-50%, -50%) scale(0.7);
                }

                #poker-notifier.show {
                    transform: translate(-50%, -50%) scale(0.8);
                }

                .poker-text {
                    font-size: 18px;
                    letter-spacing: 0.08em;
                }

                .poker-bg {
                    inset: -8px -12px;
                }

                .poker-line {
                    width: 60px;
                }

                #poker-notifier {
                    gap: 10px;
                }
            }
        `;
        document.head.appendChild(style);
    }
};

GameActionNotifier.prototype.showMessage = function (text, showTime = 9) {
    if (!this.root) return;

    this.textEl.textContent = text;

    this.root.classList.remove('show');
    void this.root.offsetWidth;
    this.isTextShowed = true;
    this.root.classList.add('show');

    clearTimeout(this._hideTimer);
    
    this._hideTimer = setTimeout(() => {
        this.root.classList.remove('show');
        this.isTextShowed = false;
    }, showTime * 1000);
};

GameActionNotifier.prototype.messageState = function (isItTrue) {
    if (isItTrue == false ) {
        this.root.classList.add('showState');
    } else {
        this.root.classList.remove('showState');
        
    }
};

GameActionNotifier.prototype.resetScript = function () {
       this.root.classList.remove('show');
        this.isTextShowed = false;
};