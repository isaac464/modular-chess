// Gamemode Manager
const GamemodeManager = {
    currentMode: null,
    
    gamemodes: {
        classic: {
            name: 'Classic Chess',
            description: 'Play traditional chess with no time limit'
        }
        // Add more gamemodes here in the future:
        // blitz: {
        //     name: 'Blitz Chess',
        //     description: 'Fast-paced chess with 5-minute time limits'
        // },
        // puzzle: {
        //     name: 'Puzzle Mode',
        //     description: 'Solve chess puzzles and improve your tactical skills'
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
                this.returnToMenu();
            });
        }
    },

    selectGamemode(mode) {
        if (!this.gamemodes[mode]) {
            console.error('Invalid gamemode:', mode);
            return;
        }

        this.currentMode = mode;
        console.log(`Selected gamemode: ${mode}`);
        
        // Hide gamemode screen and show board
        const gamemodeScreen = document.getElementById('gamemode-screen');
        const boardScreen = document.getElementById('board-screen');
        
        if (gamemodeScreen && boardScreen) {
            gamemodeScreen.classList.add('hidden');
            boardScreen.classList.remove('hidden');
            
            // Update the title in the board header
            const titleDisplay = document.getElementById('gamemode-title-display');
            if (titleDisplay) {
                titleDisplay.textContent = this.gamemodes[mode].name;
            }
            
            // Initialize the chess board
            this.initializeBoard();
        }
    },

    initializeBoard() {
        // Initialize the board with the selected gamemode
        console.log(`Initializing board with ${this.currentMode} mode`);
        
        // Add gamemode-specific logic here:
        switch(this.currentMode) {
            case 'classic':
            default:
                console.log('Starting classic game');
                // Classic gamemode initialization
                break;
            // Add cases for new gamemodes here
        }
        
        // Initialize board renderer
        BoardRenderer.init();
    },

    returnToMenu() {
        const gamemodeScreen = document.getElementById('gamemode-screen');
        const boardScreen = document.getElementById('board-screen');
        
        if (gamemodeScreen && boardScreen) {
            boardScreen.classList.add('hidden');
            gamemodeScreen.classList.remove('hidden');
            
            // Reset current mode
            this.currentMode = null;
            
            console.log('Returned to gamemode selection menu');
        }
    }
};

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("Chess Game Initialised");
    GamemodeManager.init();
});