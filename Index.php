<!DOCTYPE html>
<html lang="en-GB">
<head>
    <meta charset="UTF-8">
    <title>Local Chess Project</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="icon" type="image/png" href="Assets/favicon.PNG">
</head>
<body>

    <div class="board-wrapper">
        <div id="left-coordinates" class="coordinates vertical"></div>
        
        <div id="chessboard">
            <svg id="arrow-svg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;"></svg>
        </div>
        
        <div></div>

        <div id="bottom-coordinates" class="coordinates horizontal"></div>
    </div>

    <script src="js/pieces.js"></script>
    <script src="js/engine.js"></script>
    <script src="js/board.js"></script>
    <script src="js/main.js"></script>
</body>
</html>