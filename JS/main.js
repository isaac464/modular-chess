// Analysis Manager
const AnalysisManager = {
    isAnalyzing: false,
    currentIndex: -1,
    history: [],

    init() {
        this.setupEventListeners();
    },

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

    startAnalysis() {
        this.isAnalyzing = true;
        // history[0] = initial state
        // history[1...n] = states after moveLog[0...n-1]
        this.history = [...GameLogic.moveHistory, GameLogic.getGameStateSnapshot()];

        // currentIndex = index into GameLogic.moveLog
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

    goToMove(index) {
        if (index < -1 || index >= GameLogic.moveLog.length) return;
        this.currentIndex = index;

        // Automatically switch to the correct page for the selected move
        if (index !== -1) {
            const moveNumber = Math.floor(index / 2) + 1;
            BoardRenderer.historyPage = Math.ceil(moveNumber / BoardRenderer.movesPerPage);
        }

        BoardRenderer.render();
    },

    getCurrentBoard() {
        // Safe access: history[0] exists, and history[index+1] exists if index < moveLog.length
        const state = this.history[this.currentIndex + 1];
        return state ? state.boardState : this.history[0].boardState;
    },

    getCurrentLastMove() {
        if (this.currentIndex === -1) return null;
        const state = this.history[this.currentIndex + 1];
        return state ? state.lastMove : null;
    }
};

// Gamemode Manager
const GamemodeManager = {
    currentMode: null,
    currentSettings: null,
    currentGameType: null,
    // Track selected settings for current game
    activeSettings: {
        autoFlip: false,
        freeMovement: false,
        emptyBoard: false,
        botDifficulty: 'none',
        playerColor: 'white',
        timeLimit: 'none'
    },
    selectedPalettePiece: null,

    gamemodes: {},

    init() {
        this.gamemodes = {
            classic: ClassicGamemode,
            sandbox: SandboxGamemode
        };
        this.setupEventListeners();
        AnalysisManager.init();
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

    selectGamemode(mode) {
        if (!this.gamemodes[mode]) {
            console.error('Invalid gamemode:', mode);
            return;
        }

        this.currentMode = mode;
        this.currentSettings = JSON.parse(JSON.stringify(this.gamemodes[mode].engineSettings));
        console.log(`Selected gamemode: ${mode}`, this.currentSettings);

        // For classic mode, show game type selection
        if (mode === 'classic') {
            this.showGameTypeScreen();
        } else {
            // For other modes, go directly to settings
            this.showSettings(mode);
        }
    },

    showGameTypeScreen() {
        const gamemodeScreen = document.getElementById('gamemode-screen');
        const gameTypeScreen = document.getElementById('game-type-screen');

        if (gamemodeScreen && gameTypeScreen) {
            gamemodeScreen.classList.add('hidden');
            gameTypeScreen.classList.remove('hidden');
        }
    },

    closeGameTypeScreen() {
        const gamemodeScreen = document.getElementById('gamemode-screen');
        const gameTypeScreen = document.getElementById('game-type-screen');

        if (gamemodeScreen && gameTypeScreen) {
            gameTypeScreen.classList.add('hidden');
            gamemodeScreen.classList.remove('hidden');

            // Reset current mode and game type
            this.currentMode = null;
            this.currentSettings = null;
            this.currentGameType = null;
        }
    },

    selectGameType(type) {
        if (type === 'multiplayer') {
            this.showMultiplayerWip();
        } else {
            // Store the current game type
            this.currentGameType = type;
            
            // Apply game type to active settings
            if (type === 'local') {
                this.activeSettings.botDifficulty = 'none';
            } else if (type === 'bot') {
                this.activeSettings.botDifficulty = 'medium'; // Default difficulty
            }

            // Show settings screen
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

            // Filter settings based on game type for classic mode
            let settingsToShow = config.availableSettings;
            if (mode === 'classic' && this.currentGameType) {
                if (this.currentGameType === 'local') {
                    // Local: only show auto-flip and time-limit
                    settingsToShow = config.availableSettings.filter(s => s.id === 'auto-flip' || s.id === 'time-limit');
                } else if (this.currentGameType === 'bot') {
                    // Vs Bot: show bot difficulty, player color, and time-limit
                    settingsToShow = config.availableSettings.filter(s => s.id === 'bot-difficulty' || s.id === 'player-color' || s.id === 'time-limit');
                    // Remove 'none' option from bot difficulty
                    settingsToShow = settingsToShow.map(setting => ({
                        ...setting,
                        options: setting.options.filter(opt => opt.value !== 'none')
                    }));
                }
            }

            // Dynamically generate settings HTML
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

            // Hide appropriate screens
            if (mode === 'classic' && this.currentGameType) {
                // Coming from game type screen
                if (gameTypeScreen) gameTypeScreen.classList.add('hidden');
            } else {
                // Coming from gamemode screen
                if (gamemodeScreen) gamemodeScreen.classList.add('hidden');
            }
            settingsScreen.classList.remove('hidden');

            // Add dynamic behavior for Sandbox settings
            if (mode === 'sandbox') {
                this.updateSandboxSettingsUI();
            }
        }
    },

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

    startGameFromSettings() {
        const config = this.gamemodes[this.currentMode];

        // Reset active settings
        this.activeSettings = {
            autoFlip: false,
            freeMovement: false,
            emptyBoard: false,
            botDifficulty: 'none',
            playerColor: 'white',
            timeLimit: 'none'
        };

        // Collect setting values
        config.availableSettings.forEach(setting => {
            const element = document.getElementById(`setting-${setting.id}`);
            if (element) {
                if (setting.type === 'checkbox') {
                    // Update internal state
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

        // Enforce constraints
        if (this.currentMode === 'classic' && this.activeSettings.botDifficulty !== 'none') {
            this.activeSettings.autoFlip = false;

            // Handle random color selection
            if (this.activeSettings.playerColor === 'random') {
                this.activeSettings.playerColor = Math.random() < 0.5 ? 'white' : 'black';
                console.log(`Randomly assigned player color: ${this.activeSettings.playerColor}`);
            }
        }

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

            // Show/hide panels based on gamemode
            this.updatePanelVisibility();

            // Sync board UI controls with active settings
            this.updateFlipButtonVisibility();

            // Initialize the chess board with gamemode settings
            this.initializeBoard();
        }
    },

    updatePanelVisibility() {
        const historyPanel = document.getElementById('history-section');
        const sandboxSections = document.getElementById('sandbox-sections');

        if (this.currentMode && this.gamemodes[this.currentMode].showSandboxPanel) {
            if (historyPanel) historyPanel.classList.add('hidden');
            if (sandboxSections) sandboxSections.classList.remove('hidden');

            // Handle Sandbox timer button visibility based on settings
            const sandboxTimerBtn = document.getElementById('sandbox-timer-btn');
            if (sandboxTimerBtn) {
                if (this.activeSettings.freeMovement) {
                    sandboxTimerBtn.classList.add('hidden');
                } else {
                    sandboxTimerBtn.classList.remove('hidden');
                }
            }
        } else {
            if (historyPanel) historyPanel.classList.remove('hidden');
            if (sandboxSections) sandboxSections.classList.add('hidden');
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
        // Ensure UI panels are correctly shown/hidden
        this.updatePanelVisibility();

        // Initialize the classic chess board with current gamemode settings
        console.log(`Initializing classic board with ${this.currentMode} mode settings`, this.currentSettings);

        // Apply gamemode-specific settings
        this.applyGamemodeSettings();

        // Reset pagination
        BoardRenderer.historyPage = 1;

        // Initialize the classic board renderer
        BoardRenderer.init();

        // If bot is playing and it's their turn (though it should be white's turn initially)
        this.checkBotMove();
    },

    async checkBotMove() {
        const botColor = this.activeSettings.playerColor === 'white' ? 'black' : 'white';
        if (this.activeSettings.botDifficulty !== 'none' && GameLogic.turn === botColor && !GameLogic.isPromoting) {
            console.log("Bot is thinking...");
            await ChessBot.makeMove(this.activeSettings.botDifficulty, botColor);
            console.log("Bot move completed");
        }
    },

    undoLastMove() {
        if (GameLogic.isPromoting) return;

        // In human vs bot, we want to undo both the bot's move and the player's last move
        if (this.activeSettings.botDifficulty !== 'none') {
            // If it's currently human's turn, bot just moved, so undo two steps (bot's and player's)
            // If it's currently bot's turn (waiting for bot), just undo one (player's)
            if (GameLogic.turn === this.activeSettings.playerColor) {
                GameLogic.undoMove();
                GameLogic.undoMove();
            } else {
                GameLogic.undoMove();
            }
        } else {
            // In human vs human, just undo one move
            GameLogic.undoMove();
        }

        // Prevent animation on undo
        BoardRenderer.lastMoveProcessed = GameLogic.lastMove;
        BoardRenderer.render();

        // Check if the bot needs to move (e.g. after undoing a move)
        this.checkBotMove();
    },

    applyGamemodeSettings() {
        // Apply the current gamemode settings to the game engine
        const settings = this.currentSettings;

        // Apply timer settings
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

        // Apply sandbox mode
        if (settings.sandboxMode) {
            GameLogic.isSandboxMode = true;
            GameLogic.sandboxFreeMovementEnabled = this.activeSettings.freeMovement;
            this.selectedPalettePiece = null;
            document.querySelectorAll('.palette-piece').forEach(p => p.classList.remove('active'));
        } else {
            GameLogic.isSandboxMode = false;
            GameLogic.sandboxFreeMovementEnabled = false;
        }

        // Apply shared settings
        GameLogic.autoFlip = this.activeSettings.autoFlip;
        if (GameLogic.autoFlip) {
            GameLogic.perspective = GameLogic.turn;
        } else if (this.activeSettings.botDifficulty !== 'none') {
            GameLogic.perspective = this.activeSettings.playerColor;
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
            BoardRenderer.historyPage = 1;

            boardScreen.classList.add('hidden');
            if (settingsScreen) settingsScreen.classList.add('hidden');
            if (confirmDialog) confirmDialog.classList.add('hidden');
            if (gameResultDiv) gameResultDiv.classList.add('hidden');
            gamemodeScreen.classList.remove('hidden');

            // Reset gamemode settings
            GameLogic.isSandboxMode = false;
            GameLogic.sandboxFreeMovementEnabled = false;
            this.selectedPalettePiece = null;
            document.querySelectorAll('.palette-piece').forEach(p => p.classList.remove('active'));
            document.getElementById('piece-palette').classList.add('hidden');

            // Reset current mode and settings
            this.currentMode = null;
            this.currentSettings = null;
            this.currentGameType = null;

            // Reset analysis state
            AnalysisManager.exitAnalysis();

            // Reset active settings
            this.activeSettings = {
                autoFlip: false,
                freeMovement: false,
                emptyBoard: false,
                botDifficulty: 'none',
                timeLimit: 'none'
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
