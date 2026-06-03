<!DOCTYPE html>
<html lang="en-GB">
<head>
    <meta charset="UTF-8">
    <title>Chess - Select Gamemode</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/gamemode-selection.css">
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
            </div>

            <p class="gamemode-footer">Hold to select a mode • Press back to return</p>
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