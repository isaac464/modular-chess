/**
 * AnalysisManager
 * Handles the post-game analysis state, allowing users to navigate through
 * the game's move history using stored state snapshots.
 */
const AnalysisManager = {
    isAnalyzing: false,
    currentIndex: -1, // Current move index being viewed (-1 is starting position)
    history: [],      // Array of game state snapshots

    /**
     * Initialises the analysis manager and sets up UI listeners.
     */
    init() {
        this.setupEventListeners();
    },

    /**
     * Attaches event listeners to the analysis navigation buttons.
     */
    setupEventListeners() {
        const firstBtn = document.getElementById('analysis-first');
        const prevBtn = document.getElementById('analysis-prev');
        const nextBtn = document.getElementById('analysis-next');
        const lastBtn = document.getElementById('analysis-last');
        const exitBtn = document.getElementById('analysis-exit-btn');

        if (firstBtn) firstBtn.addEventListener('click', () => this.goToMove(-1));
        if (prevBtn) prevBtn.addEventListener('click', () => this.goToMove(this.currentIndex - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => this.goToMove(this.currentIndex + 1));
        if (lastBtn) lastBtn.addEventListener('click', () => this.goToMove(this.history.length - 1));
        if (exitBtn) exitBtn.addEventListener('click', () => this.exitAnalysis());
    },

    /**
     * Activates analysis mode, populating history snapshots and updating the UI.
     */
    startAnalysis() {
        this.isAnalyzing = true;
        // history[0] = initial state
        // history[1...n] = states after moveLog[0...n-1]
        this.history = [...GameLogic.moveHistory, GameLogic.getGameStateSnapshot()];

        // Initial state is index -1, first move is index 0, last move is moveLog.length - 1
        this.currentIndex = GameLogic.moveLog.length - 1;

        const gameResultDiv = document.getElementById('game-result');
        if (gameResultDiv) {
            gameResultDiv.style.display = 'none';
        }

        document.getElementById('game-controls').classList.add('hidden');
        document.getElementById('analysis-controls').classList.remove('hidden');

        BoardRenderer.render();
    },

    /**
     * Exits analysis mode and returns the UI to the live game state (results screen).
     */
    exitAnalysis() {
        this.isAnalyzing = false;
        this.currentIndex = -1;
        this.history = [];
        document.getElementById('game-controls').classList.remove('hidden');
        document.getElementById('analysis-controls').classList.add('hidden');

        const gameResultDiv = document.getElementById('game-result');
        if (gameResultDiv) {
            gameResultDiv.style.display = '';
        }

        if (typeof BoardRenderer !== 'undefined') {
            BoardRenderer.render();
        }
    },

    /**
     * Navigates to a specific move in the history and triggers a board re-render.
     * @param {number} index - The move index to navigate to.
     */
    goToMove(index) {
        if (index < -1 || index >= GameLogic.moveLog.length) return;
        this.currentIndex = index;

        // Automatically switch to the correct page for the selected move in the history list
        if (index !== -1) {
            const moveNumber = Math.floor(index / 2) + 1;
            BoardRenderer.historyPage = Math.ceil(moveNumber / BoardRenderer.movesPerPage);
        }

        BoardRenderer.render();
    },

    /**
     * Retrieves the board state for the current analysis index.
     * @returns {Array} The 2D array representing the board state.
     */
    getCurrentBoard() {
        // Safe access: history[0] is the start state, history[index+1] is state after move 'index'
        const state = this.history[this.currentIndex + 1];
        return state ? state.boardState : this.history[0].boardState;
    },

    /**
     * Retrieves the last move data for the current analysis index to handle highlighting.
     * @returns {Object|null} The last move object or null.
     */
    getCurrentLastMove() {
        if (this.currentIndex === -1) return null;
        const state = this.history[this.currentIndex + 1];
        return state ? state.lastMove : null;
    }
};

/**
 * GamemodeManager
 * Orchestrates gamemode selection, setting configuration, and game initialisation.
 * Manages the transitions between various menu screens and the active board.
 */
const GamemodeManager = {
    currentMode: null,      // e.g., 'classic', 'sandbox'
    currentSettings: null,  // Engine-specific setting flags
    currentGameType: null,  // e.g., 'local', 'bot'

    // Active configuration for the current match
    activeSettings: {
        autoFlip: false,
        freeMovement: false,
        emptyBoard: false,
        botDifficulty: 'none',
        playerColor: 'white',
        timeLimit: 'none'
    },
    selectedPalettePiece: null, // Piece selected in Sandbox palette

    gamemodes: {},

    /**
     * Initialises the manager, registering available gamemodes.
     */
    init() {
        this.gamemodes = {
            classic: ClassicGamemode,
            sandbox: SandboxGamemode
        };
        this.setupEventListeners();
        AnalysisManager.init();
    },

    /**
     * Sets up event delegation and direct listeners for UI interactions.
     */
    setupEventListeners() {
        // Gamemode card selection
        const gamemodeCards = document.querySelectorAll('.gamemode-card');
        gamemodeCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const mode = card.dataset.mode;
                this.selectGamemode(mode);
            });
        });

        // Game type card selection
        const gameTypeCards = document.querySelectorAll('.game-type-card');
        gameTypeCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const type = card.dataset.type;
                this.selectGameType(type);
            });
        });

        // Game type back button
        const gameTypeBackBtn = document.getElementById('game-type-back-btn');
        if (gameTypeBackBtn) {
            gameTypeBackBtn.addEventListener('click', () => {
                this.closeGameTypeScreen();
            });
        }

        // WIP close button
        const wipCloseBtn = document.getElementById('wip-close-btn');
        if (wipCloseBtn) {
            wipCloseBtn.addEventListener('click', () => {
                this.closeWipDialog();
            });
        }

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

        // Undo button
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                this.undoLastMove();
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

        // Sandbox Palette event listeners
        const spawnPiecesBtn = document.getElementById('spawn-pieces-btn');
        const closePaletteBtn = document.getElementById('close-palette-btn');
        const palettePieces = document.querySelectorAll('.palette-piece');

        if (spawnPiecesBtn) {
            spawnPiecesBtn.addEventListener('click', () => {
                document.getElementById('piece-palette').classList.remove('hidden');
            });
        }

        if (closePaletteBtn) {
            closePaletteBtn.addEventListener('click', () => {
                document.getElementById('piece-palette').classList.add('hidden');
                this.selectedPalettePiece = null;
                palettePieces.forEach(p => p.classList.remove('active'));
            });
        }

        palettePieces.forEach(piece => {
            piece.addEventListener('click', () => {
                palettePieces.forEach(p => p.classList.remove('active'));
                if (this.selectedPalettePiece === piece.dataset.piece) {
                    this.selectedPalettePiece = null;
                } else {
                    this.selectedPalettePiece = piece.dataset.piece;
                    piece.classList.add('active');
                }
            });
        });

        // Sandbox Timer Button
        const sandboxTimerBtn = document.getElementById('sandbox-timer-btn');
        if (sandboxTimerBtn) {
            sandboxTimerBtn.addEventListener('click', () => {
                if (this.activeSettings.freeMovement) {
                    console.log("Timer disabled in Free Piece Movement mode");
                    return;
                }
                if (GameLogic.timerEnabled) {
                    GameLogic.timerEnabled = false;
                    GameLogic.stopTimer();
                } else {
                    GameLogic.timerEnabled = true;
                    // Default to 10 mins if not set
                    if (GameLogic.whiteTime <= 0) GameLogic.whiteTime = 600;
                    if (GameLogic.blackTime <= 0) GameLogic.blackTime = 600;
                    GameLogic.startTimer();
                }
                BoardRenderer.updateTimerDisplay();
            });
        }

        // Settings dynamic updates (Event Delegation)
        const settingsContent = document.getElementById('settings-content');
        if (settingsContent) {
            settingsContent.addEventListener('change', (e) => {
                if (this.currentMode === 'sandbox' && e.target.id === 'setting-free-movement') {
                    this.updateSandboxSettingsUI();
                }
            });
        }

        // Placeholder for new sandbox settings
        const placeholderBtns = ['sandbox-rules-btn', 'sandbox-win-btn', 'spawn-blocks-btn'];
        placeholderBtns.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => {
                    console.log(`${id} clicked - Feature coming soon!`);
                });
            }
        });
    },

    /**
     * Handles the selection of a primary gamemode.
     * @param {string} mode - The mode identifier.
     */
    selectGamemode(mode) {
        if (!this.gamemodes[mode]) {
            console.error('Invalid gamemode:', mode);
            return;
        }

        this.currentMode = mode;
        this.currentSettings = JSON.parse(JSON.stringify(this.gamemodes[mode].engineSettings));

        // Classic mode requires an additional 'Game Type' step (Local vs Bot)
        if (mode === 'classic') {
            this.showGameTypeScreen();
        } else {
            this.showSettings(mode);
        }
    },

    /**
     * Displays the game type selection screen (Local, Bot, Multiplayer).
     */
    showGameTypeScreen() {
        const gamemodeScreen = document.getElementById('gamemode-screen');
        const gameTypeScreen = document.getElementById('game-type-screen');

        if (gamemodeScreen && gameTypeScreen) {
            gamemodeScreen.classList.add('hidden');
            gameTypeScreen.classList.remove('hidden');
        }
    },

    /**
     * Closes the game type screen and returns to the main menu.
     */
    closeGameTypeScreen() {
        const gamemodeScreen = document.getElementById('gamemode-screen');
        const gameTypeScreen = document.getElementById('game-type-screen');

        if (gamemodeScreen && gameTypeScreen) {
            gameTypeScreen.classList.add('hidden');
            gamemodeScreen.classList.remove('hidden');

            this.currentMode = null;
            this.currentSettings = null;
            this.currentGameType = null;
        }
    },

    /**
     * Handles selection of a game type (Local vs Bot).
     * @param {string} type - The game type identifier.
     */
    selectGameType(type) {
        if (type === 'multiplayer') {
            this.showMultiplayerWip();
        } else {
            this.currentGameType = type;
            
            if (type === 'local') {
                this.activeSettings.botDifficulty = 'none';
            } else if (type === 'bot') {
                this.activeSettings.botDifficulty = 'medium';
            }

            this.showSettings(this.currentMode);
        }
    },

    showMultiplayerWip() {
        const wipDialog = document.getElementById('multiplayer-wip-dialog');
        if (wipDialog) {
            wipDialog.classList.remove('hidden');
        }
    },

    closeWipDialog() {
        const wipDialog = document.getElementById('multiplayer-wip-dialog');
        if (wipDialog) {
            wipDialog.classList.add('hidden');
        }
    },

    /**
     * Dynamically generates and displays the settings screen for a gamemode.
     * @param {string} mode - The active gamemode.
     */
    showSettings(mode) {
        const gamemodeScreen = document.getElementById('gamemode-screen');
        const gameTypeScreen = document.getElementById('game-type-screen');
        const settingsScreen = document.getElementById('settings-screen');
        const settingsTitle = document.getElementById('settings-title');
        const settingsSubtitle = document.getElementById('settings-subtitle');
        const settingsContent = document.getElementById('settings-content');

        if (settingsScreen) {
            const config = this.gamemodes[mode];
            settingsTitle.textContent = `${config.name} Settings`;
            settingsSubtitle.textContent = config.description;

            // Filter settings based on context (e.g., Hide bot settings in local matches)
            let settingsToShow = config.availableSettings;
            if (mode === 'classic' && this.currentGameType) {
                if (this.currentGameType === 'local') {
                    settingsToShow = config.availableSettings.filter(s => s.id === 'auto-flip' || s.id === 'time-limit');
                } else if (this.currentGameType === 'bot') {
                    settingsToShow = config.availableSettings.filter(s => s.id === 'bot-difficulty' || s.id === 'player-color' || s.id === 'time-limit');
                    // Ensure the 'none' (Human) option is excluded when explicitly playing VS Bot
                    settingsToShow = settingsToShow.map(setting => ({
                        ...setting,
                        options: (setting.options || []).filter(opt => opt.value !== 'none')
                    }));
                }
            }

            // Generate HTML for each setting (checkbox or select dropdown)
            settingsContent.innerHTML = '';
            settingsToShow.forEach(setting => {
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
                } else if (setting.type === 'select') {
                    group.innerHTML = `
                        <div class="settings-label">
                            <div class="setting-details">
                                <span class="checkbox-text">${setting.name}</span>
                                <span class="checkbox-desc">${setting.description}</span>
                            </div>
                            <select id="setting-${setting.id}" class="settings-select">
                                ${setting.options.map(opt => `<option value="${opt.value}" ${opt.value === setting.default ? 'selected' : ''}>${opt.label}</option>`).join('')}
                            </select>
                        </div>
                    `;
                }

                settingsContent.appendChild(group);
            });

            if (mode === 'classic' && this.currentGameType) {
                if (gameTypeScreen) gameTypeScreen.classList.add('hidden');
            } else {
                if (gamemodeScreen) gamemodeScreen.classList.add('hidden');
            }
            settingsScreen.classList.remove('hidden');

            if (mode === 'sandbox') {
                this.updateSandboxSettingsUI();
            }
        }
    },

    /**
     * Updates Sandbox UI to disable conflicting settings (e.g., no timers in Free Movement).
     */
    updateSandboxSettingsUI() {
        const freeMovementCheckbox = document.getElementById('setting-free-movement');
        const timeLimitSelect = document.getElementById('setting-time-limit');

        if (freeMovementCheckbox && timeLimitSelect) {
            const settingsGroup = timeLimitSelect.closest('.settings-group');
            if (freeMovementCheckbox.checked) {
                timeLimitSelect.value = 'none';
                timeLimitSelect.disabled = true;
                if (settingsGroup) settingsGroup.style.opacity = '0.5';
            } else {
                timeLimitSelect.disabled = false;
                if (settingsGroup) settingsGroup.style.opacity = '1';
            }
        }
    },

    closeSettings() {
        const gamemodeScreen = document.getElementById('gamemode-screen');
        const gameTypeScreen = document.getElementById('game-type-screen');
        const settingsScreen = document.getElementById('settings-screen');

        if (settingsScreen) {
            settingsScreen.classList.add('hidden');
            
            // If in classic mode with game type selected, return to game type screen
            if (this.currentMode === 'classic' && this.currentGameType) {
                if (gameTypeScreen) {
                    gameTypeScreen.classList.remove('hidden');
                }
            } else {
                // Otherwise return to gamemode screen
                if (gamemodeScreen) {
                    gamemodeScreen.classList.remove('hidden');
                }
                // Reset current mode when returning to gamemode screen
                this.currentMode = null;
                this.currentSettings = null;
            }
        }
    },

    /**
     * Finalises active settings from the UI and starts the match.
     */
    startGameFromSettings() {
        const config = this.gamemodes[this.currentMode];

        // Reset active settings to defaults before populating
        this.activeSettings = {
            autoFlip: false,
            freeMovement: false,
            emptyBoard: false,
            botDifficulty: 'none',
            playerColor: 'white',
            timeLimit: 'none'
        };

        // Scrape values from the generated DOM elements
        config.availableSettings.forEach(setting => {
            const element = document.getElementById(`setting-${setting.id}`);
            if (element) {
                if (setting.type === 'checkbox') {
                    if (setting.id === 'auto-flip') this.activeSettings.autoFlip = element.checked;
                    if (setting.id === 'free-movement') this.activeSettings.freeMovement = element.checked;
                    if (setting.id === 'empty-board') this.activeSettings.emptyBoard = element.checked;
                } else if (setting.type === 'select') {
                    if (setting.id === 'bot-difficulty') this.activeSettings.botDifficulty = element.value;
                    if (setting.id === 'player-color') this.activeSettings.playerColor = element.value;
                    if (setting.id === 'time-limit') this.activeSettings.timeLimit = element.value;
                }
            }
        });

        // Enforce logic constraints (e.g., No auto-flip when playing against a bot)
        if (this.currentMode === 'classic' && this.activeSettings.botDifficulty !== 'none') {
            this.activeSettings.autoFlip = false;

            if (this.activeSettings.playerColor === 'random') {
                this.activeSettings.playerColor = Math.random() < 0.5 ? 'white' : 'black';
            }
        }

        // Prepare the board state
        if (this.activeSettings.emptyBoard) {
            GameLogic.clearBoard();
        } else {
            GameLogic.resetBoard();
        }

        this.startGame();
    },

    /**
     * Shows the confirmation dialog when attempting to exit an active match.
     */
    showExitConfirmation() {
        const confirmDialog = document.getElementById('exit-confirmation-dialog');
        if (confirmDialog) {
            confirmDialog.classList.remove('hidden');
        }
    },

    /**
     * Hides the exit confirmation dialog.
     */
    cancelExit() {
        const confirmDialog = document.getElementById('exit-confirmation-dialog');
        if (confirmDialog) {
            confirmDialog.classList.add('hidden');
        }
    },

    /**
     * Confirms match exit and returns to the menu.
     */
    confirmExit() {
        this.returnToMenu();
    },

    /**
     * Switches the UI to the board screen and triggers engine initialisation.
     */
    startGame() {
        const settingsScreen = document.getElementById('settings-screen');
        const gamemodeScreen = document.getElementById('gamemode-screen');
        const boardScreen = document.getElementById('board-screen');

        if (boardScreen) {
            if (settingsScreen) settingsScreen.classList.add('hidden');
            if (gamemodeScreen) gamemodeScreen.classList.add('hidden');
            boardScreen.classList.remove('hidden');

            const titleDisplay = document.getElementById('gamemode-title-display');
            if (titleDisplay && this.gamemodes[this.currentMode]) {
                titleDisplay.textContent = this.gamemodes[this.currentMode].name;
            }

            this.updatePanelVisibility();
            this.updateFlipButtonVisibility();
            this.initializeBoard();
        }
    },

    /**
     * Toggles visibility of the side panel sections (History vs Sandbox controls).
     */
    updatePanelVisibility() {
        const historyPanel = document.getElementById('history-section');
        const sandboxSections = document.getElementById('sandbox-sections');

        if (this.currentMode && this.gamemodes[this.currentMode].showSandboxPanel) {
            if (historyPanel) historyPanel.classList.add('hidden');
            if (sandboxSections) sandboxSections.classList.remove('hidden');

            const sandboxTimerBtn = document.getElementById('sandbox-timer-btn');
            if (sandboxTimerBtn) {
                sandboxTimerBtn.classList.toggle('hidden', this.activeSettings.freeMovement);
            }
        } else {
            if (historyPanel) historyPanel.classList.remove('hidden');
            if (sandboxSections) sandboxSections.classList.add('hidden');
        }
    },

    /**
     * Hides the 'Flip Board' button if Auto-flip is enabled (since it happens automatically).
     */
    updateFlipButtonVisibility() {
        const flipBoardBtn = document.getElementById('flip-board-btn');
        if (flipBoardBtn) {
            flipBoardBtn.classList.toggle('hidden', this.activeSettings.autoFlip);
        }
    },

    /**
     * Initialises the board renderer and engine state for a new match.
     */
    initializeBoard() {
        this.updatePanelVisibility();
        this.applyGamemodeSettings();

        BoardRenderer.historyPage = 1;
        BoardRenderer.init();

        // Check if the bot should make the first move
        this.checkBotMove();
    },

    /**
     * Triggers the bot's move selection if it is currently the bot's turn.
     */
    async checkBotMove() {
        const botColor = this.activeSettings.playerColor === 'white' ? 'black' : 'white';
        if (this.activeSettings.botDifficulty !== 'none' && GameLogic.turn === botColor && !GameLogic.isPromoting) {
            await ChessBot.makeMove(this.activeSettings.botDifficulty, botColor);
        }
    },

    /**
     * Reverts the last move. In bot matches, reverts two plies to return to the player's turn.
     */
    undoLastMove() {
        if (GameLogic.isPromoting) return;

        if (this.activeSettings.botDifficulty !== 'none') {
            // Revert both the bot's and the player's move if it's the player's turn
            if (GameLogic.turn === this.activeSettings.playerColor) {
                GameLogic.undoMove();
                GameLogic.undoMove();
            } else {
                GameLogic.undoMove();
            }
        } else {
            GameLogic.undoMove();
        }

        BoardRenderer.lastMoveProcessed = GameLogic.lastMove;
        BoardRenderer.render();
        this.checkBotMove();
    },

    /**
     * Syncs engine configuration with the active match settings.
     */
    applyGamemodeSettings() {
        const settings = this.currentSettings;

        if (this.activeSettings.timeLimit !== 'none') {
            const timeSeconds = parseInt(this.activeSettings.timeLimit);
            GameLogic.timerEnabled = true;
            GameLogic.whiteTime = timeSeconds;
            GameLogic.blackTime = timeSeconds;
            GameLogic.startTimer();
        } else {
            GameLogic.timerEnabled = false;
            GameLogic.stopTimer();
        }

        if (settings.sandboxMode) {
            GameLogic.isSandboxMode = true;
            GameLogic.sandboxFreeMovementEnabled = this.activeSettings.freeMovement;
            this.selectedPalettePiece = null;
            document.querySelectorAll('.palette-piece').forEach(p => p.classList.remove('active'));
        } else {
            GameLogic.isSandboxMode = false;
            GameLogic.sandboxFreeMovementEnabled = false;
        }

        GameLogic.autoFlip = this.activeSettings.autoFlip;
        if (GameLogic.autoFlip) {
            GameLogic.perspective = GameLogic.turn;
        } else if (this.activeSettings.botDifficulty !== 'none') {
            GameLogic.perspective = this.activeSettings.playerColor;
        }
    },

    /**
     * Resets the game state and returns to the main menu.
     */
    returnToMenu() {
        const gamemodeScreen = document.getElementById('gamemode-screen');
        const settingsScreen = document.getElementById('settings-screen');
        const boardScreen = document.getElementById('board-screen');
        const confirmDialog = document.getElementById('exit-confirmation-dialog');
        const gameResultDiv = document.getElementById('game-result');

        if (gamemodeScreen && boardScreen) {
            GameLogic.resetBoard();
            BoardRenderer.historyPage = 1;

            boardScreen.classList.add('hidden');
            if (settingsScreen) settingsScreen.classList.add('hidden');
            if (confirmDialog) confirmDialog.classList.add('hidden');
            if (gameResultDiv) gameResultDiv.classList.add('hidden');
            gamemodeScreen.classList.remove('hidden');

            GameLogic.isSandboxMode = false;
            GameLogic.sandboxFreeMovementEnabled = false;
            this.selectedPalettePiece = null;
            document.querySelectorAll('.palette-piece').forEach(p => p.classList.remove('active'));
            document.getElementById('piece-palette').classList.add('hidden');

            this.currentMode = null;
            this.currentSettings = null;
            this.currentGameType = null;

            AnalysisManager.exitAnalysis();

            this.activeSettings = {
                autoFlip: false,
                freeMovement: false,
                emptyBoard: false,
                botDifficulty: 'none',
                timeLimit: 'none'
            };

            GameLogic.autoFlip = false;
            this.updateFlipButtonVisibility();
        }
    }
};

/**
 * Global initialisation on DOM load.
 */
document.addEventListener('DOMContentLoaded', () => {
    GamemodeManager.init();
});
