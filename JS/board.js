/**
 * BoardRenderer
 * Responsible for the visual representation of the chessboard, pieces,
 * move history, timers, and interactive elements like right-click arrows.
 */
const BoardRenderer = {
    container: document.getElementById('chessboard'),
    svgContainer: null,
    // Mapping of engine piece codes to Unicode chess characters
    pieceSymbols: {
        'wR': '♖', 'wN': '♘', 'wB': '♗', 'wQ': '♕', 'wK': '♔', 'wP': '♙',
        'bR': '♜', 'bN': '♞', 'bB': '♝', 'bQ': '♛', 'bK': '♚', 'bP': '♟'
    },

    // Tracking for right-click analysis arrows
    rightClickStart: null,
    arrows: [],
    lastMoveProcessed: null, // Tracks the last animated move to prevent repeat triggers

    // Pagination for the move history panel
    historyPage: 1,
    movesPerPage: 10,

    /**
     * Initialises the renderer and attaches global board-related event listeners.
     */
    init() {
        this.svgContainer = document.getElementById('arrow-svg');
        this.setupGlobalListeners();
        this.setupResultButtonListener();
        this.renderOutsideCoordinates();
        this.render();
    },

    /**
     * Binds listeners to the game-over result overlay buttons.
     */
    setupResultButtonListener() {
        const resultMenuBtn = document.getElementById('result-menu-btn');
        if (resultMenuBtn) {
            resultMenuBtn.addEventListener('click', () => {
                GamemodeManager.returnToMenu();
            });
        }

        const resultAnalyzeBtn = document.getElementById('result-analyze-btn');
        if (resultAnalyzeBtn) {
            resultAnalyzeBtn.addEventListener('click', () => {
                AnalysisManager.startAnalysis();
            });
        }
    },

    /**
     * Sets up broad listeners for context menu suppression and coordinate recalculation.
     */
    setupGlobalListeners() {
        // Suppress default context menu to allow custom right-click arrow drawing
        this.container.oncontextmenu = (e) => e.preventDefault();

        // Left-clicking anywhere on the board/document clears analysis arrows
        document.addEventListener('click', (e) => {
            if (e.button === 0) {
                this.clearArrows();
            }
        });

        // Recalculate arrow coordinates when the window is resized to maintain alignment
        window.addEventListener('resize', () => {
            if (this.arrows.length > 0) {
                this.drawSVGArrows();
            }
        });
    },

    /**
     * Wipes all SVG arrows from the board.
     */
    clearArrows() {
        this.arrows = [];
        if (this.svgContainer) this.svgContainer.innerHTML = '';
    },

    /**
     * Renders rank (1-8) and file (a-h) labels based on the current perspective.
     */
    renderOutsideCoordinates() {
        const leftCoords = document.getElementById('left-coordinates');
        const bottomCoords = document.getElementById('bottom-coordinates');

        if (leftCoords && bottomCoords) {
            leftCoords.innerHTML = '';
            bottomCoords.innerHTML = '';

            const isWhitePerspective = GameLogic.perspective === 'white';

            // Render numbers
            for (let i = 0; i < 8; i++) {
                const span = document.createElement('span');
                span.innerText = isWhitePerspective ? (8 - i) : (i + 1);
                leftCoords.appendChild(span);
            }

            // Render letters
            for (let i = 0; i < 8; i++) {
                const span = document.createElement('span');
                const charCode = isWhitePerspective ? (97 + i) : (104 - i);
                span.innerText = String.fromCharCode(charCode);
                bottomCoords.appendChild(span);
            }
        }
    },

    /**
     * Core render cycle. Rebuilds the DOM for the board and pieces,
     * calculates animations, and updates UI components (history, timers).
     */
    render() {
        this.renderOutsideCoordinates();
        this.updateMoveHistoryUI();

        // Determine which board state to show (Live vs Analysis)
        const targetBoard = AnalysisManager.isAnalyzing ? AnalysisManager.getCurrentBoard() : GameLogic.boardState;
        const targetLastMove = AnalysisManager.isAnalyzing ? AnalysisManager.getCurrentLastMove() : GameLogic.lastMove;

        const isWhitePerspective = GameLogic.perspective === 'white';
        const oldSquares = Array.from(this.container.querySelectorAll('.square'));

        // Pre-calculation for capture animations
        let capturedPieceElem = null;
        if (GameLogic.lastMove && GameLogic.lastMove !== this.lastMoveProcessed && GameLogic.lastMove.captured !== '.') {
            const capR = isWhitePerspective ? GameLogic.lastMove.toRow : 7 - GameLogic.lastMove.toRow;
            const capC = isWhitePerspective ? GameLogic.lastMove.toCol : 7 - GameLogic.lastMove.toCol;

            let targetSq;
            if (GameLogic.lastMove.isEnPassant) {
                const victimRow = GameLogic.lastMove.piece.startsWith('w') ? GameLogic.lastMove.toRow + 1 : GameLogic.lastMove.toRow - 1;
                targetSq = oldSquares.find(sq => parseInt(sq.dataset.row) === victimRow && parseInt(sq.dataset.col) === GameLogic.lastMove.toCol);
            } else {
                targetSq = oldSquares.find(sq => parseInt(sq.dataset.row) === GameLogic.lastMove.toRow && parseInt(sq.dataset.col) === GameLogic.lastMove.toCol);
            }

            if (targetSq) {
                const p = targetSq.querySelector('.piece');
                if (p) capturedPieceElem = p.cloneNode(true);
            }
        }

        // Clear and prepare board container
        this.container.innerHTML = '';
        this.container.appendChild(this.svgContainer);
        this.clearArrows();

        // Build 8x8 grid
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const row = isWhitePerspective ? r : 7 - r;
                const col = isWhitePerspective ? c : 7 - c;

                const square = document.createElement('div');
                let colorClass = (row + col) % 2 === 0 ? 'white' : 'black';

                // Apply highlighting for selection and last move
                if (GameLogic.selectedSquare && GameLogic.selectedSquare.row === row && GameLogic.selectedSquare.col === col) {
                    colorClass = 'selected';
                } else if (targetLastMove &&
                           ((targetLastMove.fromRow === row && targetLastMove.fromCol === col) ||
                            (targetLastMove.toRow === row && targetLastMove.toCol === col))) {
                    colorClass = 'last-move';
                }

                square.className = `square ${colorClass}`;
                square.dataset.row = row;
                square.dataset.col = col;

                // Render piece if square is not empty
                const pieceCode = targetBoard[row][col];
                if (pieceCode !== '.') {
                    const pieceSpan = document.createElement('span');
                    pieceSpan.className = 'piece';
                    pieceSpan.innerText = this.pieceSymbols[pieceCode];
                    square.appendChild(pieceSpan);

                    // Smooth transition for the piece that just moved
                    if (!AnalysisManager.isAnalyzing && GameLogic.lastMove && GameLogic.lastMove !== this.lastMoveProcessed &&
                        GameLogic.lastMove.toRow === row && GameLogic.lastMove.toCol === col) {

                        const fromR = isWhitePerspective ? GameLogic.lastMove.fromRow : 7 - GameLogic.lastMove.fromRow;
                        const fromC = isWhitePerspective ? GameLogic.lastMove.fromCol : 7 - GameLogic.lastMove.fromCol;
                        const toR = isWhitePerspective ? GameLogic.lastMove.toRow : 7 - GameLogic.lastMove.toRow;
                        const toC = isWhitePerspective ? GameLogic.lastMove.toCol : 7 - GameLogic.lastMove.toCol;

                        const squareSize = this.container.offsetWidth / 8;
                        const dx = (fromC - toC) * squareSize;
                        const dy = (fromR - toR) * squareSize;

                        pieceSpan.style.transition = 'none';
                        pieceSpan.style.transform = `translate(${dx}px, ${dy}px)`;

                        requestAnimationFrame(() => {
                            pieceSpan.style.transition = 'transform 0.2s ease-in-out';
                            pieceSpan.style.transform = '';
                        });
                    }
                }

                // Interaction listeners
                square.onclick = () => {
                    if (AnalysisManager.isAnalyzing) return;
                    this.handleSquareClick(row, col);
                };

                square.onmousedown = (e) => {
                    if (e.button === 2) {
                        this.rightClickStart = { row, col };
                    }
                };

                square.onmouseup = (e) => {
                    if (e.button === 2 && this.rightClickStart) {
                        if (this.rightClickStart.row !== row || this.rightClickStart.col !== col) {
                            this.createArrow(this.rightClickStart, { row, col });
                        }
                        this.rightClickStart = null;
                    }
                };

                this.container.appendChild(square);
            }
        }

        // Execute capture animation (Piece fade/scale out)
        if (capturedPieceElem) {
            const toR = isWhitePerspective ? GameLogic.lastMove.toRow : 7 - GameLogic.lastMove.toRow;
            const toC = isWhitePerspective ? GameLogic.lastMove.toCol : 7 - GameLogic.lastMove.toCol;

            let capR = toR;
            let capC = toC;

            if (GameLogic.lastMove.isEnPassant) {
                const victimRow = GameLogic.lastMove.piece.startsWith('w') ? GameLogic.lastMove.toRow + 1 : GameLogic.lastMove.toRow - 1;
                capR = isWhitePerspective ? victimRow : 7 - victimRow;
            }

            const squareSize = this.container.offsetWidth / 8;
            capturedPieceElem.style.left = (capC * squareSize) + 'px';
            capturedPieceElem.style.top = (capR * squareSize) + 'px';
            capturedPieceElem.style.transition = 'opacity 0.2s ease-out, transform 0.2s ease-out';
            this.container.appendChild(capturedPieceElem);

            requestAnimationFrame(() => {
                capturedPieceElem.style.opacity = '0';
                capturedPieceElem.style.transform = 'scale(0.5)';
                setTimeout(() => capturedPieceElem.remove(), 200);
            });
        }

        this.lastMoveProcessed = GameLogic.lastMove;

        if (GameLogic.isPromoting) this.showPromotionUI();

        if (GameLogic.gameState) {
            this.showGameResult();
        }

        this.updateTimerDisplay();
    },

    /**
     * Updates the visual countdowns and active status of game timers.
     */
    updateTimerDisplay() {
        const timerContainer = document.getElementById('game-timers');
        if (!timerContainer) return;

        if (!GameLogic.timerEnabled) {
            timerContainer.classList.add('hidden');
            return;
        }

        timerContainer.classList.remove('hidden');

        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        const whiteTimer = document.getElementById('white-timer');
        const blackTimer = document.getElementById('black-timer');

        if (whiteTimer) {
            whiteTimer.innerText = `W: ${formatTime(GameLogic.whiteTime)}`;
            whiteTimer.classList.toggle('active', GameLogic.turn === 'white' && !GameLogic.gameState);
            whiteTimer.classList.toggle('low-time', GameLogic.whiteTime <= 30); // Flash red at 30s
        }

        if (blackTimer) {
            blackTimer.innerText = `B: ${formatTime(GameLogic.blackTime)}`;
            blackTimer.classList.toggle('active', GameLogic.turn === 'black' && !GameLogic.gameState);
            blackTimer.classList.toggle('low-time', GameLogic.blackTime <= 30);
        }
    },

    /**
     * Refreshes the side-panel move list and handles pagination.
     */
    updateMoveHistoryUI() {
        const moveList = document.getElementById('move-list');
        if (!moveList) return;

        moveList.innerHTML = '';
        const totalFullMoves = Math.ceil(GameLogic.moveLog.length / 2);
        const totalPages = Math.max(1, Math.ceil(totalFullMoves / this.movesPerPage));

        // Auto-advance to latest move page during active play
        if (!AnalysisManager.isAnalyzing) {
            this.historyPage = totalPages;
        }

        if (this.historyPage > totalPages) this.historyPage = totalPages;
        if (this.historyPage < 1) this.historyPage = 1;

        const startIndex = (this.historyPage - 1) * this.movesPerPage * 2;
        const endIndex = Math.min(startIndex + this.movesPerPage * 2, GameLogic.moveLog.length);

        for (let i = startIndex; i < endIndex; i += 2) {
            const row = document.createElement('div');
            row.className = 'move-row';

            const num = document.createElement('span');
            num.className = 'move-number';
            num.innerText = Math.floor(i / 2) + 1 + '.';
            row.appendChild(num);

            const whiteMove = document.createElement('span');
            whiteMove.innerText = GameLogic.moveLog[i];
            if (AnalysisManager.isAnalyzing && AnalysisManager.currentIndex === i) {
                whiteMove.className = 'active-move';
            }
            whiteMove.onclick = () => {
                if (AnalysisManager.isAnalyzing) AnalysisManager.goToMove(i);
            };
            row.appendChild(whiteMove);

            if (GameLogic.moveLog[i + 1]) {
                const blackMove = document.createElement('span');
                blackMove.innerText = GameLogic.moveLog[i + 1];
                if (AnalysisManager.isAnalyzing && AnalysisManager.currentIndex === i + 1) {
                    blackMove.className = 'active-move';
                }
                blackMove.onclick = () => {
                    if (AnalysisManager.isAnalyzing) AnalysisManager.goToMove(i + 1);
                };
                row.appendChild(blackMove);
            }

            moveList.appendChild(row);
        }

        this.updatePaginationUI(totalPages);

        // Auto-scroll to ensure visibility of current move
        if (AnalysisManager.isAnalyzing) {
            const active = moveList.querySelector('.active-move');
            if (active) active.scrollIntoView({ block: 'nearest' });
        } else {
            moveList.scrollTop = moveList.scrollHeight;
        }
    },

    updatePaginationUI(totalPages) {
        const paginationContainer = document.getElementById('history-pagination');
        if (!paginationContainer) return;

        paginationContainer.innerHTML = '';

        if (totalPages <= 1) {
            paginationContainer.classList.add('hidden');
            return;
        }

        paginationContainer.classList.remove('hidden');

        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.innerText = '‹';
        prevBtn.disabled = this.historyPage === 1;
        prevBtn.onclick = () => {
            this.historyPage--;
            this.render();
        };

        const pageInfo = document.createElement('span');
        pageInfo.className = 'page-info';
        pageInfo.innerText = `Page ${this.historyPage} of ${totalPages}`;

        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.innerText = '›';
        nextBtn.disabled = this.historyPage === totalPages;
        nextBtn.onclick = () => {
            this.historyPage++;
            this.render();
        };

        paginationContainer.appendChild(prevBtn);
        paginationContainer.appendChild(pageInfo);
        paginationContainer.appendChild(nextBtn);
    },

    showGameResult() {
        const resultDiv = document.getElementById('game-result');
        const resultTitle = document.getElementById('result-title');
        
        if (resultDiv && resultTitle) {
            if (GameLogic.gameState === 'white-won') {
                resultTitle.textContent = 'White Won';
            } else if (GameLogic.gameState === 'black-won') {
                resultTitle.textContent = 'Black Won';
            } else if (GameLogic.gameState === 'draw') {
                resultTitle.textContent = 'Draw';
            }
            
            resultDiv.classList.remove('hidden');
        }
    },

    /**
     * Orchestrates board interactions, translating clicks into engine move commands
     * or Sandbox piece placement.
     */
    handleSquareClick(row, col) {
        if (GameLogic.isPromoting) return;

        // Block input if it is the bot's turn
        const botColor = GamemodeManager.activeSettings.playerColor === 'white' ? 'black' : 'white';
        if (GamemodeManager.activeSettings.botDifficulty !== 'none' && GameLogic.turn === botColor) return;

        const isFreeMovement = GameLogic.isSandboxMode && GameLogic.sandboxFreeMovementEnabled;

        // Sandbox: If a piece is selected in the palette, spawn it on click
        if (GameLogic.isSandboxMode && GamemodeManager.selectedPalettePiece) {
            GameLogic.boardState[row][col] = GamemodeManager.selectedPalettePiece;
            this.render();
            return;
        }

        const selected = GameLogic.selectedSquare;
        if (selected) {
            // Attempt to move piece from selected square to clicked square
            const moveResult = GameLogic.movePiece(selected.row, selected.col, row, col);

            if (moveResult === true || moveResult === "promote") {
                GameLogic.selectedSquare = null;
                this.render();
                if (moveResult === true) {
                    GamemodeManager.checkBotMove();
                }
            } else {
                // Handle invalid move/selection update
                const kingInCheck = GameLogic.isInCheck(GameLogic.turn);
                const piece = GameLogic.getPieceAt(row, col);

                if (piece !== '.' && (isFreeMovement || (piece.startsWith('w') ? 'white' : 'black') === GameLogic.turn)) {
                    GameLogic.selectedSquare = { row, col };
                } else {
                    GameLogic.selectedSquare = null;
                }

                this.render();

                // Trigger 'Check Flash' if the user tries an illegal move while in check
                if (kingInCheck) {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            this.flashKing();
                        });
                    });
                }
            }
        } else {
            // Selection logic: Select a piece if it belongs to the active player (or free movement is on)
            const piece = GameLogic.getPieceAt(row, col);
            if (piece !== '.' && (isFreeMovement || (piece.startsWith('w') ? 'white' : 'black') === GameLogic.turn)) {
                GameLogic.selectedSquare = { row, col };
                this.render();
            }
        }
    },

    createArrow(start, end) {
        // Prevent duplicate arrows in the exact same direction
        const isDuplicate = this.arrows.some(a => a.start.row === start.row && a.start.col === start.col && a.end.row === end.row && a.end.col === end.col);
        if (isDuplicate) return;

        this.arrows.push({ start, end });
        this.drawSVGArrows();
    },

    /**
     * Renders analysis arrows as SVG polylines. Supports straight lines
     * and L-shaped elbows for knight-style movements.
     */
    drawSVGArrows() {
        let defs = this.svgContainer.querySelector('defs');
        if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', 'arrowhead');
            marker.setAttribute('markerWidth', '6');
            marker.setAttribute('markerHeight', '6');
            marker.setAttribute('refX', '4');
            marker.setAttribute('refY', '3');
            marker.setAttribute('orient', 'auto');

            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', '0 0, 6 3, 0 6');
            polygon.setAttribute('fill', 'rgba(247, 148, 29, 0.85)');

            marker.appendChild(polygon);
            defs.appendChild(marker);
            this.svgContainer.appendChild(defs);
        }

        const oldArrows = this.svgContainer.querySelectorAll('polyline');
        oldArrows.forEach(a => a.remove());

        const squareSize = this.container.offsetWidth / 8;
        const isWhitePerspective = GameLogic.perspective === 'white';

        this.arrows.forEach(arrow => {
            const startCol = isWhitePerspective ? arrow.start.col : 7 - arrow.start.col;
            const startRow = isWhitePerspective ? arrow.start.row : 7 - arrow.start.row;
            const endCol = isWhitePerspective ? arrow.end.col : 7 - arrow.end.col;
            const endRow = isWhitePerspective ? arrow.end.row : 7 - arrow.end.row;

            const x1 = (startCol * squareSize) + (squareSize / 2);
            const y1 = (startRow * squareSize) + (squareSize / 2);
            let x2 = (endCol * squareSize) + (squareSize / 2);
            let y2 = (endRow * squareSize) + (squareSize / 2);

            const rowDiff = Math.abs(arrow.start.row - arrow.end.row);
            const colDiff = Math.abs(arrow.start.col - arrow.end.col);

            const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
            let points = "";

            if ((rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2)) {
                // Knight-style L-shape: Elbow calculated by maintaining start X and target Y
                const elbowX = x1;
                const elbowY = y2;

                const angle = Math.atan2(y2 - elbowY, x2 - elbowX);
                const shortX2 = x2 - Math.cos(angle) * 15;
                const shortY2 = y2 - Math.sin(angle) * 15;

                points = `${x1},${y1} ${elbowX},${elbowY} ${shortX2},${shortY2}`;
            } else {
                // Standard straight line
                const angle = Math.atan2(y2 - y1, x2 - x1);
                const shortX2 = x2 - Math.cos(angle) * 15;
                const shortY2 = y2 - Math.sin(angle) * 15;
                points = `${x1},${y1} ${shortX2},${shortY2}`;
            }

            polyline.setAttribute('points', points);
            polyline.setAttribute('class', 'chess-arrow');
            this.svgContainer.appendChild(polyline);
        });
    },

    flashKing() {
        const kingChar = GameLogic.turn === 'white' ? 'wK' : 'bK';
        const squares = this.container.getElementsByClassName('square');

        for (let sq of squares) {
            const r = parseInt(sq.dataset.row);
            const c = parseInt(sq.dataset.col);

            if (GameLogic.getPieceAt(r, c) === kingChar) {
                sq.classList.remove('check-flash');
                void sq.offsetWidth;
                sq.classList.add('check-flash');
                break;
            }
        }
    },

    showPromotionUI() {
        const overlay = document.createElement('div');
        overlay.style = "position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; justify-content:center; align-items:center; z-index:1000; gap:10px;";

        ['Q', 'R', 'B', 'N'].forEach(type => {
            const btn = document.createElement('button');
            const prefix = GameLogic.turn === 'white' ? 'w' : 'b';
            btn.innerText = this.pieceSymbols[prefix + type];
            btn.style = "width:60px; height:60px; font-size:40px; cursor:pointer; background:#fff; border:2px solid #333;";
            btn.onclick = (e) => {
                e.stopPropagation();
                GameLogic.promotePawn(type);
                this.render();
                GamemodeManager.checkBotMove();
            };
            overlay.appendChild(btn);
        });
        this.container.appendChild(overlay);
    }
};
