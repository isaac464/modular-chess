// Gamemode Manager
const GamemodeManager = {
    currentMode: null,
    currentSettings: null,
    sandboxSettings: {
        freeMovement: true,
        emptyBoard: false
    },

    gamemodes: {
        classic: {
            name: 'Classic Chess',
            description: 'Play traditional chess with no time limit',
            settings: {
                timeLimit: null,
                movesLimit: null,
                customRules: false,
                sandboxMode: false
            }
        },
        sandbox: {
            name: 'Sandbox',
            description: 'Free placement mode. Create custom positions.',
            settings: {
                timeLimit: null,
                movesLimit: null,
                customRules: true,
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

        // Sandbox settings buttons
        const sandboxBackBtn = document.getElementById('sandbox-back-btn');
        const sandboxStartBtn = document.getElementById('sandbox-start-btn');

        if (sandboxBackBtn) {
            sandboxBackBtn.addEventListener('click', () => {
                this.closeSandboxSettings();
            });
        }

        if (sandboxStartBtn) {
            sandboxStartBtn.addEventListener('click', () => {
                this.startSandboxGame();
            });
        }

        // Perspective controls
        const flipBoardBtn = document.getElementById('flip-board-btn');
        const autoFlipToggle = document.getElementById('auto-flip-toggle');

        if (flipBoardBtn) {
            flipBoardBtn.addEventListener('click', () => {
                GameLogic.perspective = GameLogic.perspective === 'white' ? 'black' : 'white';
                BoardRenderer.render();
            });
        }

        if (autoFlipToggle) {
            autoFlipToggle.addEventListener('change', (e) => {
                GameLogic.autoFlip = e.target.checked;
                if (GameLogic.autoFlip) {
                    GameLogic.perspective = GameLogic.turn;
                    BoardRenderer.render();
                }
            });
        }
    },

    selectGamemode(mode) {
        if (!this.gamemodes[mode]) {
            console.error('Invalid gamemode:', mode);
            return;
        }

        this.currentMode = mode;
        this.currentSettings = JSON.parse(JSON.stringify(this.gamemodes[mode].settings));
        console.log(`Selected gamemode: ${mode}`, this.currentSettings);

        // If sandbox mode, show settings first
        if (mode === 'sandbox') {
            this.showSandboxSettings();
        } else {
            this.startGame();
        }
    },

    showSandboxSettings() {
        const gamemodeScreen = document.getElementById('gamemode-screen');
        const sandboxScreen = document.getElementById('sandbox-settings-screen');

        if (gamemodeScreen && sandboxScreen) {
            gamemodeScreen.classList.add('hidden');
            sandboxScreen.classList.remove('hidden');

            // Set checkboxes to current sandbox settings
            const freeMoveCheckbox = document.getElementById('enable-free-movement');
            const emptyBoardCheckbox = document.getElementById('enable-clear-board');

            if (freeMoveCheckbox) freeMoveCheckbox.checked = this.sandboxSettings.freeMovement;
            if (emptyBoardCheckbox) emptyBoardCheckbox.checked = this.sandboxSettings.emptyBoard;
        }
    },

    closeSandboxSettings() {
        const gamemodeScreen = document.getElementById('gamemode-screen');
        const sandboxScreen = document.getElementById('sandbox-settings-screen');

        if (gamemodeScreen && sandboxScreen) {
            sandboxScreen.classList.add('hidden');
            gamemodeScreen.classList.remove('hidden');

            // Reset current mode
            this.currentMode = null;
            this.currentSettings = null;
        }
    },

    startSandboxGame() {
        // Update sandbox settings from checkboxes
        const freeMoveCheckbox = document.getElementById('enable-free-movement');
        const emptyBoardCheckbox = document.getElementById('enable-clear-board');

        this.sandboxSettings.freeMovement = freeMoveCheckbox.checked;
        this.sandboxSettings.emptyBoard = emptyBoardCheckbox.checked;

        // Apply empty board if selected
        if (this.sandboxSettings.emptyBoard) {
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
        const sandboxScreen = document.getElementById('sandbox-settings-screen');
        const gamemodeScreen = document.getElementById('gamemode-screen');
        const boardScreen = document.getElementById('board-screen');

        if (boardScreen) {
            if (sandboxScreen) sandboxScreen.classList.add('hidden');
            if (gamemodeScreen) gamemodeScreen.classList.add('hidden');
            boardScreen.classList.remove('hidden');

            // Update the title in the board header
            const titleDisplay = document.getElementById('gamemode-title-display');
            if (titleDisplay && this.gamemodes[this.currentMode]) {
                titleDisplay.textContent = this.gamemodes[this.currentMode].name;
            }

            // Initialize the chess board with gamemode settings
            this.initializeBoard();
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
        // Apply the current gamemode settings to the game
        const settings = this.currentSettings;

        // Apply sandbox mode
        if (settings.sandboxMode) {
            GameLogic.isSandboxMode = true;
            // Apply the specific free movement setting
            GameLogic.sandboxFreeMovementEnabled = this.sandboxSettings.freeMovement;
            console.log(`Sandbox mode enabled - free piece movement ${this.sandboxSettings.freeMovement ? 'enabled' : 'disabled'}`);
        } else {
            GameLogic.isSandboxMode = false;
            GameLogic.sandboxFreeMovementEnabled = false;
        }

        // Apply time limit if set
        if (settings.timeLimit) {
            console.log(`Applying time limit: ${settings.timeLimit}ms`);
            // TODO: Initialize timer UI
        }

        // Apply move limit if set
        if (settings.movesLimit) {
            console.log(`Applying moves limit: ${settings.movesLimit}`);
            // TODO: Initialize move counter
        }

        // Apply custom rules if enabled
        if (settings.customRules) {
            console.log('Applying custom rules');
            // TODO: Load custom rule logic
        }
    },

    returnToMenu() {
        const gamemodeScreen = document.getElementById('gamemode-screen');
        const sandboxScreen = document.getElementById('sandbox-settings-screen');
        const boardScreen = document.getElementById('board-screen');
        const confirmDialog = document.getElementById('exit-confirmation-dialog');

        if (gamemodeScreen && boardScreen) {
            // Reset board before hiding
            GameLogic.resetBoard();

            boardScreen.classList.add('hidden');
            sandboxScreen.classList.add('hidden');
            confirmDialog.classList.add('hidden');
            gamemodeScreen.classList.remove('hidden');

            // Reset gamemode settings
            GameLogic.isSandboxMode = false;
            GameLogic.sandboxFreeMovementEnabled = false;

            // Reset current mode and settings
            this.currentMode = null;
            this.currentSettings = null;

            // Reset perspective UI
            const autoFlipToggle = document.getElementById('auto-flip-toggle');
            if (autoFlipToggle) autoFlipToggle.checked = false;
            GameLogic.autoFlip = false;

            console.log('Returned to gamemode selection menu - board reset');
        }
    }
};

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("Chess Game Initialised");
    GamemodeManager.init();
});
