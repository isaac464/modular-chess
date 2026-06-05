// Gamemode Manager
const GamemodeManager = {
    currentMode: null,
    currentSettings: null,
    // Track selected settings for current game
    activeSettings: {
        autoFlip: false,
        freeMovement: false,
        emptyBoard: false
    },

    gamemodes: {
        classic: {
            name: 'Classic Chess',
            description: 'Play traditional chess with no time limit',
            availableSettings: [
                {
                    id: 'auto-flip',
                    name: 'Auto-flip Board',
                    description: 'Perspective automatically shifts to the current player',
                    type: 'checkbox',
                    default: false
                }
            ],
            engineSettings: {
                sandboxMode: false
            }
        },
        sandbox: {
            name: 'Sandbox',
            description: 'Free placement mode. Create custom positions.',
            availableSettings: [
                {
                    id: 'auto-flip',
                    name: 'Auto-flip Board',
                    description: 'Perspective automatically shifts to the current player',
                    type: 'checkbox',
                    default: false
                },
                {
                    id: 'free-movement',
                    name: 'Free Piece Movement',
                    description: 'Move any piece anywhere without chess rules',
                    type: 'checkbox',
                    default: false
                },
                {
                    id: 'empty-board',
                    name: 'Start with Empty Board',
                    description: 'Begin with a completely empty board instead of starting position',
                    type: 'checkbox',
                    default: false
                }
            ],
            engineSettings: {
                sandboxMode: true
            }
        }
        // Add more gamemodes here in the future:
        // blitz: {
        //     name: 'Blitz Chess',
        //     description: 'Fast-paced chess with 5-minute time limits',
        //     settings: {
        //         timeLimit: 300000, // 5 minutes in milliseconds
        //         movesLimit: null,
        //         customRules: false
        //     }
        // },
        // puzzle: {
        //     name: 'Puzzle Mode',
        //     description: 'Solve chess puzzles and improve your tactical skills',
        //     settings: {
        //         timeLimit: null,
        //         movesLimit: null,
        //         customRules: true,
        //         puzzleMode: true
        //     }
        // }
    },

    init() {
        this.setupEventListeners();
    },

    setupEventListeners() {
        // Gamemode card selection
        const gamemodeCards = document.querySelectorAll('.gamemode-card');
        gamemodeCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const mode = card.dataset.mode;
                this.selectGamemode(mode);
            });
        });

        // Back button
        const backButton = document.getElementById('back-button');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.showExitConfirmation();
            });
        }

        // Exit confirmation buttons
        const confirmExitBtn = document.getElementById('confirm-exit-btn');
        const confirmCancelBtn = document.getElementById('confirm-cancel-btn');

        if (confirmExitBtn) {
            confirmExitBtn.addEventListener('click', () => {
                this.confirmExit();
            });
        }

        if (confirmCancelBtn) {
            confirmCancelBtn.addEventListener('click', () => {
                this.cancelExit();
            });
        }

        // Settings screen buttons
        const settingsBackBtn = document.getElementById('settings-back-btn');
        const settingsStartBtn = document.getElementById('settings-start-btn');

        if (settingsBackBtn) {
            settingsBackBtn.addEventListener('click', () => {
                this.closeSettings();
            });
        }

        if (settingsStartBtn) {
            settingsStartBtn.addEventListener('click', () => {
                this.startGameFromSettings();
            });
        }

        // Perspective controls
        const flipBoardBtn = document.getElementById('flip-board-btn');

        if (flipBoardBtn) {
            flipBoardBtn.addEventListener('click', () => {
                GameLogic.perspective = GameLogic.perspective === 'white' ? 'black' : 'white';
                BoardRenderer.render();
            });
        }
    },

    selectGamemode(mode) {
        if (!this.gamemodes[mode]) {
            console.error('Invalid gamemode:', mode);
            return;
        }

        this.currentMode = mode;
        this.currentSettings = JSON.parse(JSON.stringify(this.gamemodes[mode].engineSettings));
        console.log(`Selected gamemode: ${mode}`, this.currentSettings);

        this.showSettings(mode);
    },

    showSettings(mode) {
        const gamemodeScreen = document.getElementById('gamemode-screen');
        const settingsScreen = document.getElementById('settings-screen');
        const settingsTitle = document.getElementById('settings-title');
        const settingsSubtitle = document.getElementById('settings-subtitle');
        const settingsContent = document.getElementById('settings-content');

        if (gamemodeScreen && settingsScreen) {
            const config = this.gamemodes[mode];
            settingsTitle.textContent = `${config.name} Settings`;
            settingsSubtitle.textContent = config.description;

            // Dynamically generate settings HTML
            settingsContent.innerHTML = '';
            config.availableSettings.forEach(setting => {
                const group = document.createElement('div');
                group.className = 'settings-group';

                if (setting.type === 'checkbox') {
                    group.innerHTML = `
                        <label class="settings-label">
                            <input type="checkbox" id="setting-${setting.id}" class="settings-checkbox" ${setting.default ? 'checked' : ''}>
                            <div class="setting-details">
                                <span class="checkbox-text">${setting.name}</span>
                                <span class="checkbox-desc">${setting.description}</span>
                            </div>
                        </label>
                    `;
                }

                settingsContent.appendChild(group);
            });

            gamemodeScreen.classList.add('hidden');
            settingsScreen.classList.remove('hidden');
        }
    },

    closeSettings() {
        const gamemodeScreen = document.getElementById('gamemode-screen');
        const settingsScreen = document.getElementById('settings-screen');

        if (gamemodeScreen && settingsScreen) {
            settingsScreen.classList.add('hidden');
            gamemodeScreen.classList.remove('hidden');

            // Reset current mode
            this.currentMode = null;
            this.currentSettings = null;
        }
    },

    startGameFromSettings() {
        const config = this.gamemodes[this.currentMode];

        // Collect setting values
        config.availableSettings.forEach(setting => {
            const element = document.getElementById(`setting-${setting.id}`);
            if (element) {
                if (setting.type === 'checkbox') {
                    // Update internal state
                    if (setting.id === 'auto-flip') this.activeSettings.autoFlip = element.checked;
                    if (setting.id === 'free-movement') this.activeSettings.freeMovement = element.checked;
                    if (setting.id === 'empty-board') this.activeSettings.emptyBoard = element.checked;
                }
            }
        });

        // Handle board initialization based on settings
        if (this.activeSettings.emptyBoard) {
            GameLogic.clearBoard();
        } else {
            GameLogic.resetBoard();
        }

        this.startGame();
    },

    showExitConfirmation() {
        const confirmDialog = document.getElementById('exit-confirmation-dialog');
        if (confirmDialog) {
            confirmDialog.classList.remove('hidden');
        }
    },

    cancelExit() {
        const confirmDialog = document.getElementById('exit-confirmation-dialog');
        if (confirmDialog) {
            confirmDialog.classList.add('hidden');
        }
    },

    confirmExit() {
        this.returnToMenu();
    },

    startGame() {
        const settingsScreen = document.getElementById('settings-screen');
        const gamemodeScreen = document.getElementById('gamemode-screen');
        const boardScreen = document.getElementById('board-screen');

        if (boardScreen) {
            if (settingsScreen) settingsScreen.classList.add('hidden');
            if (gamemodeScreen) gamemodeScreen.classList.add('hidden');
            boardScreen.classList.remove('hidden');

            // Update the title in the board header
            const titleDisplay = document.getElementById('gamemode-title-display');
            if (titleDisplay && this.gamemodes[this.currentMode]) {
                titleDisplay.textContent = this.gamemodes[this.currentMode].name;
            }

            // Sync board UI controls with active settings
            this.updateFlipButtonVisibility();

            // Initialize the chess board with gamemode settings
            this.initializeBoard();
        }
    },

    updateFlipButtonVisibility() {
        const flipBoardBtn = document.getElementById('flip-board-btn');
        if (flipBoardBtn) {
            if (this.activeSettings.autoFlip) {
                flipBoardBtn.classList.add('hidden');
            } else {
                flipBoardBtn.classList.remove('hidden');
            }
        }
    },

    initializeBoard() {
        // Initialize the classic chess board with current gamemode settings
        console.log(`Initializing classic board with ${this.currentMode} mode settings`, this.currentSettings);

        // Apply gamemode-specific settings
        this.applyGamemodeSettings();

        // Initialize the classic board renderer
        BoardRenderer.init();
    },

    applyGamemodeSettings() {
        // Apply the current gamemode settings to the game engine
        const settings = this.currentSettings;

        // Apply sandbox mode
        if (settings.sandboxMode) {
            GameLogic.isSandboxMode = true;
            GameLogic.sandboxFreeMovementEnabled = this.activeSettings.freeMovement;
        } else {
            GameLogic.isSandboxMode = false;
            GameLogic.sandboxFreeMovementEnabled = false;
        }

        // Apply shared settings
        GameLogic.autoFlip = this.activeSettings.autoFlip;
        if (GameLogic.autoFlip) {
            GameLogic.perspective = GameLogic.turn;
        }
    },

    returnToMenu() {
        const gamemodeScreen = document.getElementById('gamemode-screen');
        const settingsScreen = document.getElementById('settings-screen');
        const boardScreen = document.getElementById('board-screen');
        const confirmDialog = document.getElementById('exit-confirmation-dialog');
        const gameResultDiv = document.getElementById('game-result');

        if (gamemodeScreen && boardScreen) {
            // Reset board before hiding
            GameLogic.resetBoard();

            boardScreen.classList.add('hidden');
            if (settingsScreen) settingsScreen.classList.add('hidden');
            if (confirmDialog) confirmDialog.classList.add('hidden');
            if (gameResultDiv) gameResultDiv.classList.add('hidden');
            gamemodeScreen.classList.remove('hidden');

            // Reset gamemode settings
            GameLogic.isSandboxMode = false;
            GameLogic.sandboxFreeMovementEnabled = false;

            // Reset current mode and settings
            this.currentMode = null;
            this.currentSettings = null;

            // Reset active settings
            this.activeSettings = {
                autoFlip: false,
                freeMovement: false,
                emptyBoard: false
            };

            // Reset perspective UI
            GameLogic.autoFlip = false;
            this.updateFlipButtonVisibility();

            console.log('Returned to gamemode selection menu - board reset');
        }
    }
};

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("Chess Game Initialised");
    GamemodeManager.init();
});
