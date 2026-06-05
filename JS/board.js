const BoardRenderer = {
    container: document.getElementById('chessboard'),
    svgContainer: null,
    pieceSymbols: {
        'wR': '♖', 'wN': '♘', 'wB': '♗', 'wQ': '♕', 'wK': '♔', 'wP': '♙',
        'bR': '♜', 'bN': '♞', 'bB': '♝', 'bQ': '♛', 'bK': '♚', 'bP': '♟'
    },

    // Tracking for right-click arrows
    rightClickStart: null,
    arrows: [],
    lastMoveProcessed: null,

    init() {
        this.svgContainer = document.getElementById('arrow-svg');
        this.setupGlobalListeners();
        this.setupResultButtonListener();
        this.renderOutsideCoordinates();
        this.render();
    },

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

    setupGlobalListeners() {
        // Prevent default context menu on right-click inside the board
        this.container.oncontextmenu = (e) => e.preventDefault();

        // Clear arrows on any standard left click on the document
        document.addEventListener('click', (e) => {
            if (e.button === 0) { // Left click
                this.clearArrows();
            }
        });
    },

    clearArrows() {
        this.arrows = [];
        if (this.svgContainer) this.svgContainer.innerHTML = '';
    },

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

    render() {
        // Update coordinates whenever we render
        this.renderOutsideCoordinates();
        this.updateMoveHistoryUI();

        const targetBoard = AnalysisManager.isAnalyzing ? AnalysisManager.getCurrentBoard() : GameLogic.boardState;
        const targetLastMove = AnalysisManager.isAnalyzing ? AnalysisManager.getCurrentLastMove() : GameLogic.lastMove;

        const isWhitePerspective = GameLogic.perspective === 'white';
        const oldSquares = Array.from(this.container.querySelectorAll('.square'));

        // Find captured piece for animation
        let capturedPieceElem = null;
        if (GameLogic.lastMove && GameLogic.lastMove !== this.lastMoveProcessed && GameLogic.lastMove.captured !== '.') {
            const capR = isWhitePerspective ? GameLogic.lastMove.toRow : 7 - GameLogic.lastMove.toRow;
            const capC = isWhitePerspective ? GameLogic.lastMove.toCol : 7 - GameLogic.lastMove.toCol;

            // If it's en passant, the captured piece is in a different square
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

        this.container.innerHTML = '';
        this.container.appendChild(this.svgContainer);
        this.clearArrows();

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const row = isWhitePerspective ? r : 7 - r;
                const col = isWhitePerspective ? c : 7 - c;

                const square = document.createElement('div');
                let colorClass = (row + col) % 2 === 0 ? 'white' : 'black';

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

                // Piece rendering
                const pieceCode = targetBoard[row][col];
                if (pieceCode !== '.') {
                    const pieceSpan = document.createElement('span');
                    pieceSpan.className = 'piece';
                    pieceSpan.innerText = this.pieceSymbols[pieceCode];
                    square.appendChild(pieceSpan);

                    // If this is the piece that just moved, prepare animation
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

                // Left click handling
                square.onclick = () => {
                    if (AnalysisManager.isAnalyzing) return;
                    this.handleSquareClick(row, col);
                };

                // Right click handling for drawing arrows
                square.onmousedown = (e) => {
                    if (e.button === 2) { // Right click down
                        this.rightClickStart = { row, col };
                    }
                };

                square.onmouseup = (e) => {
                    if (e.button === 2 && this.rightClickStart) { // Right click up
                        if (this.rightClickStart.row !== row || this.rightClickStart.col !== col) {
                            this.createArrow(this.rightClickStart, { row, col });
                        }
                        this.rightClickStart = null;
                    }
                };

                this.container.appendChild(square);
            }
        }

        // Animate capture if one happened
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
    },

    updateMoveHistoryUI() {
        const moveList = document.getElementById('move-list');
        if (!moveList) return;

        moveList.innerHTML = '';
        for (let i = 0; i < GameLogic.moveLog.length; i += 2) {
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

        // Auto-scroll to active move or bottom
        if (AnalysisManager.isAnalyzing) {
            const active = moveList.querySelector('.active-move');
            if (active) active.scrollIntoView({ block: 'nearest' });
        } else {
            moveList.scrollTop = moveList.scrollHeight;
        }
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

    handleSquareClick(row, col) {
        if (GameLogic.isPromoting) return;

        // Prevent human move during bot's turn in Classic mode
        if (GamemodeManager.activeSettings.botDifficulty !== 'none' && GameLogic.turn === 'black') return;

        const selected = GameLogic.selectedSquare;
        if (selected) {
            const moveResult = GameLogic.movePiece(selected.row, selected.col, row, col);

            if (moveResult === true || moveResult === "promote") {
                GameLogic.selectedSquare = null;
                this.render();
                if (moveResult === true) {
                    GamemodeManager.checkBotMove();
                }
            } else {
                const kingInCheck = GameLogic.isInCheck(GameLogic.turn);
                const piece = GameLogic.getPieceAt(row, col);

                if (piece !== '.' && (piece.startsWith('w') ? 'white' : 'black') === GameLogic.turn) {
                    GameLogic.selectedSquare = { row, col };
                } else {
                    GameLogic.selectedSquare = null;
                }

                this.render();

                if (kingInCheck) {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            this.flashKing();
                        });
                    });
                }
            }
        } else {
            const piece = GameLogic.getPieceAt(row, col);
            if (piece !== '.' && (piece.startsWith('w') ? 'white' : 'black') === GameLogic.turn) {
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

        // Wipe old arrows
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

            // If it's an L-shape (Knight move style)
            if ((rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2)) {
                // Calculate the elbow: move vertically first, then horizontally
                const elbowX = x1;
                const elbowY = y2;

                // Shorten the final segment so the arrowhead doesn't overlap the center
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
