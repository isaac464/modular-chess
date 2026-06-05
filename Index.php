<!DOCTYPE html>
<html lang="en-GB">
<head>
    <meta charset="UTF-8">
    <title>Chess - Select Gamemode</title>
    <link rel="stylesheet" href="CSS/style.css">
    <link rel="stylesheet" href="CSS/gamemode-selection.css">
    <link rel="icon" type="image/png" href="Assets/favicon.PNG">
</head>
<body>

    <!-- Gamemode Selection Screen -->
    <div id="gamemode-screen" class="gamemode-screen">
        <div class="gamemode-container">
            <div class="logo-container">
                <img src="Assets/logo.PNG" alt="Modular Chess Logo" class="gamemode-logo">
            </div>
            <p class="gamemode-subtitle">Select Your Gamemode</p>

            <div class="gamemodes-grid">
                <!-- Classic Chess -->
                <div class="gamemode-card" data-mode="classic">
                    <div class="gamemode-icon">♟</div>
                    <h2 class="gamemode-name">Classic</h2>
                    <p class="gamemode-description">Play traditional chess with no time limit. Perfect for learning and strategy.</p>
                </div>

                <!-- Sandbox Mode -->
                <div class="gamemode-card" data-mode="sandbox">
                    <div class="gamemode-icon">🎨</div>
                    <h2 class="gamemode-name">Sandbox</h2>
                    <p class="gamemode-description">Free placement mode. Place pieces anywhere on the board to create custom positions.</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Game Type Selection Screen -->
    <div id="game-type-screen" class="game-type-screen hidden">
        <div class="game-type-container">
            <button id="game-type-back-btn" class="game-type-back-btn">← Back</button>
            <div class="game-type-header">
                <h1 class="game-type-title">Select Game Type</h1>
                <p class="game-type-subtitle">Choose how you want to play</p>
            </div>

            <div class="game-types-grid">
                <!-- Local Game -->
                <div class="game-type-card" data-type="local">
                    <div class="game-type-icon">👥</div>
                    <h2 class="game-type-name">Local</h2>
                    <p class="game-type-description">Play against another player on the same device.</p>
                </div>

                <!-- Vs Bot -->
                <div class="game-type-card" data-type="bot">
                    <div class="game-type-icon">🤖</div>
                    <h2 class="game-type-name">Vs Bot</h2>
                    <p class="game-type-description">Challenge the AI opponent and test your skills.</p>
                </div>

                <!-- Multiplayer -->
                <div class="game-type-card" data-type="multiplayer">
                    <div class="game-type-lock-overlay">🔒</div>
                    <div class="game-type-icon">🌐</div>
                    <h2 class="game-type-name">Multiplayer</h2>
                    <p class="game-type-description">Play against opponents online.</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Multiplayer WIP Dialog -->
    <div id="multiplayer-wip-dialog" class="confirmation-dialog hidden">
        <div class="confirmation-content">
            <h2 class="confirmation-title">Work In Progress</h2>
            <p class="confirmation-message">Multiplayer is not available in this version. This feature is coming soon!</p>
            <div class="confirmation-buttons">
                <button id="wip-close-btn" class="confirm-btn-primary">OK</button>
            </div>
        </div>
    </div>

    <!-- Exit Match Confirmation Dialog -->
    <div id="exit-confirmation-dialog" class="confirmation-dialog hidden">
        <div class="confirmation-content">
            <h2 class="confirmation-title">Exit Match?</h2>
            <p class="confirmation-message">This Match will end and the board will be reset</p>
            <div class="confirmation-buttons">
                <button id="confirm-cancel-btn" class="confirm-btn-secondary">Cancel</button>
                <button id="confirm-exit-btn" class="confirm-btn-primary">Exit Match</button>
            </div>
        </div>
    </div>

    <!-- Gamemode Settings Screen -->
    <div id="settings-screen" class="settings-screen hidden">
        <div class="settings-container">
            <h1 id="settings-title" class="settings-title">Gamemode Settings</h1>
            <p id="settings-subtitle" class="settings-subtitle">Customize your experience</p>

            <div id="settings-content" class="settings-content">
                <!-- Settings will be dynamically injected here -->
            </div>

            <div class="settings-buttons">
                <button id="settings-back-btn" class="settings-button-secondary">← Back</button>
                <button id="settings-start-btn" class="settings-button-primary">Start Game</button>
            </div>
        </div>
    </div>

    <!-- Chess Board Screen (Hidden Initially) -->
    <div id="board-screen" class="board-screen hidden">
        <div class="board-header">
            <button id="back-button" class="back-button">← Back to Menu</button>
            <h2 id="gamemode-title-display" class="gamemode-display">Classic Chess</h2>
            <div class="board-controls">
                <button id="flip-board-btn" class="control-btn" title="Flip Board Perspective">🔄 Flip Board</button>
            </div>
        </div>

        <div class="game-container">
            <div class="board-wrapper">
                <div id="left-coordinates" class="coordinates vertical"></div>

                <div id="chessboard">
                    <svg id="arrow-svg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;"></svg>
                </div>

                <div></div>

                <div id="bottom-coordinates" class="coordinates horizontal"></div>
            </div>

            <div class="side-panel">
                <div id="history-section" class="move-history">
                    <h3 class="side-panel-title">Move History</h3>
                    <div id="move-list" class="move-list"></div>
                </div>
                <div id="analysis-controls" class="analysis-controls hidden">
                    <h3 class="side-panel-title">Analysis</h3>
                    <div class="analysis-nav">
                        <button id="analysis-first" class="nav-btn" title="First Move">«</button>
                        <button id="analysis-prev" class="nav-btn" title="Previous Move">‹</button>
                        <button id="analysis-next" class="nav-btn" title="Next Move">›</button>
                        <button id="analysis-last" class="nav-btn" title="Last Move">»</button>
                    </div>
                    <div class="side-panel-controls">
                        <button id="analysis-exit-btn" class="control-btn">Exit Analysis</button>
                    </div>
                </div>
                <div id="game-controls" class="side-panel-controls">
                    <button id="undo-btn" class="control-btn">↶ Undo</button>
                </div>
            </div>
        </div>

        <div id="game-result" class="game-result hidden">
            <div class="result-content">
                <h1 id="result-title" class="result-title">White Won</h1>
                <div class="result-buttons">
                    <button id="result-analyze-btn" class="result-button-secondary">Analyze Game</button>
                    <button id="result-menu-btn" class="result-button">Return to Menu</button>
                </div>
            </div>
        </div>
    </div>

    <script src="JS/pieces.js"></script>
    <script src="JS/engine.js"></script>
    <script src="JS/Bots/bot.js"></script>
    <script src="JS/board.js"></script>
    <script src="JS/main.js"></script>
</body>
</html>
