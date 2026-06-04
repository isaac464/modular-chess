<!DOCTYPE html>
<html lang="en-GB">
<head>
    <meta charset="UTF-8">
    <title>Chess - Select Gamemode</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/gamemode-selection.css">
    <link rel="icon" type="image/png" href="Assets/favicon.PNG">
</head>
<body>

    <!-- Gamemode Selection Screen -->
    <div id="gamemode-screen" class="gamemode-screen">
        <div class="gamemode-container">
            <h1 class="gamemode-title">CHESS</h1>
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

            <p class="gamemode-footer">Hold to select a mode • Press back to return</p>
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

    <!-- Sandbox Settings Screen -->
    <div id="sandbox-settings-screen" class="sandbox-settings-screen hidden">
        <div class="sandbox-settings-container">
            <h1 class="settings-title">Sandbox Settings</h1>
            <p class="settings-subtitle">Customize your sandbox experience</p>
            
            <div class="settings-content">
                <div class="settings-group">
                    <label class="settings-label">
                        <input type="checkbox" id="enable-free-movement" class="settings-checkbox" checked>
                        <span class="checkbox-text">Free Piece Movement</span>
                        <span class="checkbox-desc">Move any piece anywhere without chess rules</span>
                    </label>
                </div>
                
                <div class="settings-group">
                    <label class="settings-label">
                        <input type="checkbox" id="enable-clear-board" class="settings-checkbox">
                        <span class="checkbox-text">Start with Empty Board</span>
                        <span class="checkbox-desc">Begin with a completely empty board instead of starting position</span>
                    </label>
                </div>
            </div>
            
            <div class="settings-buttons">
                <button id="sandbox-back-btn" class="settings-button-secondary">← Back</button>
                <button id="sandbox-start-btn" class="settings-button-primary">Start Sandbox</button>
            </div>
        </div>
    </div>

    <!-- Chess Board Screen (Hidden Initially) -->
    <div id="board-screen" class="board-screen hidden">
        <div class="board-header">
            <button id="back-button" class="back-button">← Back to Menu</button>
            <h2 id="gamemode-title-display" class="gamemode-display">Classic Chess</h2>
        </div>
        
        <div class="board-wrapper">
            <div id="left-coordinates" class="coordinates vertical"></div>
            
            <div id="chessboard">
                <svg id="arrow-svg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;"></svg>
            </div>
            
            <div></div>

            <div id="bottom-coordinates" class="coordinates horizontal"></div>
        </div>
    </div>

    <script src="js/pieces.js"></script>
    <script src="js/engine.js"></script>
    <script src="js/board.js"></script>
    <script src="js/main.js"></script>
</body>
</html>