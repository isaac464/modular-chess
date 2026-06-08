/**
 * GameLogic
 * The core chess engine handling board state, move validation,
 * special rules (castling, en passant, promotion), and game state monitoring.
 */
const GameLogic = {
    // 8x8 board representation using string codes (e.g., 'wP' = White Pawn, '.' = Empty)
    boardState: [
        ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
        ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
        ['.',  '.',  '.',  '.',  '.',  '.',  '.',  '.'],
        ['.',  '.',  '.',  '.',  '.',  '.',  '.',  '.'],
        ['.',  '.',  '.',  '.',  '.',  '.',  '.',  '.'],
        ['.',  '.',  '.',  '.',  '.',  '.',  '.',  '.'],
        ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
        ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
    ],

    turn: 'white',
    selectedSquare: null,   // Currently selected square {row, col}
    enPassantTarget: null,  // Eligible square for en passant capture {row, col}
    isPromoting: false,     // Flag to block input while promotion UI is active
    promotionSquare: null,  // Square where promotion is occurring
    hasMoved: { wK: false, wR_left: false, wR_right: false, bK: false, bR_left: false, bR_right: false },
    isSandboxMode: false,
    sandboxFreeMovementEnabled: true,
    perspective: 'white',
    autoFlip: false,
    gameState: null, // 'white-won', 'black-won', 'draw', or null
    moveHistory: [], // Snapshots of full game states for undo and repetition detection
    moveLog: [],     // Moves in Standard Algebraic Notation (SAN) for the UI list
    lastMove: null,  // Metadata for the most recent move {fromRow, fromCol, toRow, toCol, ...}

    // Timer state (seconds)
    timerEnabled: false,
    whiteTime: 600,
    blackTime: 600,
    timerInterval: null,

    /**
     * Helper to retrieve the piece code at specific coordinates.
     */
    getPieceAt(row, col) { return this.boardState[row][col]; },

    /**
     * Resets the entire engine state to the start of a classic match.
     */
    resetBoard() {
        this.boardState = [
            ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
            ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
            ['.',  '.',  '.',  '.',  '.',  '.',  '.',  '.'],
            ['.',  '.',  '.',  '.',  '.',  '.',  '.',  '.'],
            ['.',  '.',  '.',  '.',  '.',  '.',  '.',  '.'],
            ['.',  '.',  '.',  '.',  '.',  '.',  '.',  '.'],
            ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
            ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
        ];
        this.turn = 'white';
        this.selectedSquare = null;
        this.enPassantTarget = null;
        this.isPromoting = false;
        this.promotionSquare = null;
        this.hasMoved = { wK: false, wR_left: false, wR_right: false, bK: false, bR_left: false, bR_right: false };
        this.perspective = 'white';
        this.gameState = null;
        this.moveHistory = [];
        this.moveLog = [];
        this.lastMove = null;
        this.stopTimer();
        this.timerEnabled = false;
        this.whiteTime = 600;
        this.blackTime = 600;
    },

    /**
     * Clears all pieces from the board, typically for Sandbox setup.
     */
    clearBoard() {
        this.boardState = Array(8).fill(null).map(() => Array(8).fill('.'));
        this.turn = 'white';
        this.selectedSquare = null;
        this.enPassantTarget = null;
        this.isPromoting = false;
        this.promotionSquare = null;
        this.hasMoved = { wK: false, wR_left: false, wR_right: false, bK: false, bR_left: false, bR_right: false };
        this.gameState = null;
        this.moveHistory = [];
        this.moveLog = [];
        this.lastMove = null;
        this.stopTimer();
        this.timerEnabled = false;
    },

    /**
     * Determines if the specified color's king is currently under attack.
     * Supports optional custom board state for move simulations.
     */
    isInCheck(color, customBoard = this.boardState, enPassant = this.enPassantTarget) {
        const kingChar = color === 'white' ? 'wK' : 'bK';
        let kingPos = null;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (customBoard[r][c] === kingChar) { kingPos = { r, c }; break; }
            }
        }
        return kingPos ? this.isSquareAttacked(kingPos.r, kingPos.c, color === 'white' ? 'black' : 'white', customBoard, enPassant) : false;
    },

    /**
     * Checks if a specific square is being attacked by any piece of the attacker's color.
     */
    isSquareAttacked(row, col, attackerColor, customBoard = this.boardState, enPassant = this.enPassantTarget) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = customBoard[r][c];
                if (piece !== '.' && (piece.startsWith('w') ? 'white' : 'black') === attackerColor) {
                    if (PieceMovement.validateBasicMove(r, c, row, col, customBoard, enPassant)) return true;
                }
            }
        }
        return false;
    },

    /**
     * Simulates a move to determine if it would result in the moving player being in check.
     */
    wouldBeInCheck(fR, fC, tR, tC) {
        return this.wouldBeInCheckSim(fR, fC, tR, tC, this.boardState, this.turn, this.enPassantTarget);
    },

    /**
     * Executes a piece movement, handling special rules like castling,
     * en passant, and pawn promotion.
     * @returns {boolean|string} True if move success, 'promote' if promotion triggered, False if illegal.
     */
    movePiece(fromRow, fromCol, toRow, toCol) {
        if (this.isPromoting || this.gameState) return false;
        if (!this.checkMoveIsValid(fromRow, fromCol, toRow, toCol)) return false;

        // Skip check safety validation if Sandbox Free Movement is active
        if (!(this.isSandboxMode && this.sandboxFreeMovementEnabled) && this.wouldBeInCheck(fromRow, fromCol, toRow, toCol)) return false;

        const piece = this.boardState[fromRow][fromCol];
        let targetPiece = this.boardState[toRow][toCol];

        // Detect En Passant for capture tracking and execution
        let isEnPassant = false;
        if (piece[1] === 'P' && this.enPassantTarget && toRow === this.enPassantTarget.row && toCol === this.enPassantTarget.col) {
            isEnPassant = true;
            const victimRow = piece.startsWith('w') ? toRow + 1 : toRow - 1;
            targetPiece = this.boardState[victimRow][toCol];
        }

        // Snapshot current state for Undo functionality
        this.moveHistory.push(this.getGameStateSnapshot());

        // Track last move metadata for UI highlights/animations
        this.lastMove = { fromRow, fromCol, toRow, toCol, piece, captured: targetPiece, isEnPassant };

        // Execute Castling (Move the Rook as well)
        if (piece[1] === 'K' && toRow === fromRow && Math.abs(toCol - fromCol) === 2) {
            const isKingside = toCol > fromCol;
            const rookCol = isKingside ? 7 : 0;
            const rookDestCol = isKingside ? 5 : 3;
            this.boardState[fromRow][rookDestCol] = this.boardState[fromRow][rookCol];
            this.boardState[fromRow][rookCol] = '.';
        }

        // Execute En Passant (Remove the victim pawn)
        if (isEnPassant) {
            const victimRow = piece.startsWith('w') ? toRow + 1 : toRow - 1;
            this.boardState[victimRow][toCol] = '.';
        }

        // Update movement flags for Castling eligibility
        if (piece === 'wK') this.hasMoved.wK = true;
        if (piece === 'bK') this.hasMoved.bK = true;
        if (fromRow === 7 && fromCol === 0) this.hasMoved.wR_left = true;
        if (fromRow === 7 && fromCol === 7) this.hasMoved.wR_right = true;
        if (fromRow === 0 && fromCol === 0) this.hasMoved.bR_left = true;
        if (fromRow === 0 && fromCol === 7) this.hasMoved.bR_right = true;

        // Calculate En Passant target for the NEXT turn
        const nextEnPassant = (piece[1] === 'P' && Math.abs(toRow - fromRow) === 2)
            ? { row: (fromRow + toRow) / 2, col: fromCol } : null;

        // Finalise piece position
        this.boardState[toRow][toCol] = piece;
        this.boardState[fromRow][fromCol] = '.';
        this.enPassantTarget = nextEnPassant;

        // Check for Pawn Promotion
        if (piece[1] === 'P' && (toRow === 0 || toRow === 7)) {
            this.isPromoting = true;
            this.promotionSquare = { row: toRow, col: toCol };
            return "promote";
        }

        this.turn = this.turn === 'white' ? 'black' : 'white';
        if (this.autoFlip) this.perspective = this.turn;
        this.checkGameState();
        if (this.timerEnabled) this.startTimer();

        // Generate algebraic notation for the move log
        this.recordMove(piece, fromRow, fromCol, toRow, toCol, targetPiece);

        return true;
    },

    /**
     * Promotes a pawn to the selected piece type and switches turns.
     */
    promotePawn(type) {
        const prefix = this.turn === 'white' ? 'w' : 'b';
        this.boardState[this.promotionSquare.row][this.promotionSquare.col] = prefix + type;
        this.isPromoting = false;
        this.turn = this.turn === 'white' ? 'black' : 'white';
        if (this.autoFlip) this.perspective = this.turn;
        this.checkGameState();

        // Update the last move notation with promotion suffix (e.g., =Q) and check status
        if (this.moveLog.length > 0) {
            let notation = this.moveLog[this.moveLog.length - 1];
            notation = notation.replace(/[+#]$/, '') + "=" + type;

            const isCheck = this.isInCheck(this.turn);
            const hasMoves = this.hasValidMoves(this.turn);
            if (!hasMoves) {
                notation += isCheck ? '#' : '';
            } else if (isCheck) {
                notation += '+';
            }
            this.moveLog[this.moveLog.length - 1] = notation;
        }
    },

    /**
     * Performs a comprehensive check on whether a move is legal under chess rules.
     * Handles standard movement, turn validation, and special castling conditions.
     */
    checkMoveIsValid(fR, fC, tR, tC, board = this.boardState, turn = this.turn, enPassant = this.enPassantTarget, hasMoved = this.hasMoved) {
        const piece = board[fR][fC];
        if (piece === '.') return false;

        const target = board[tR][tC];
        const pieceColor = piece.startsWith('w') ? 'white' : 'black';

        // Global prohibitions: Cannot capture same-color pieces or any King
        if (target !== '.') {
            const targetColor = target.startsWith('w') ? 'white' : 'black';
            if (pieceColor === targetColor) return false;
            if (target[1] === 'K') return false;
        }

        // Sandbox Override: Free Piece Movement bypasses standard turn/rule validation
        if (this.isSandboxMode && this.sandboxFreeMovementEnabled && board === this.boardState) {
            return true;
        }

        // Enforce turn order
        if (pieceColor !== turn) return false;

        // Specialized Castling Validation
        if (piece[1] === 'K' && tR === fR && Math.abs(tC - fC) === 2) {
            const kingMoved = turn === 'white' ? hasMoved.wK : hasMoved.bK;
            if (kingMoved || this.isInCheck(turn, board, enPassant)) return false;

            const kingside = tC > fC;
            if (turn === 'white') {
                if (kingside && (hasMoved.wR_right || board[7][7] !== 'wR')) return false;
                if (!kingside && (hasMoved.wR_left || board[7][0] !== 'wR')) return false;
            } else {
                if (kingside && (hasMoved.bR_right || board[0][7] !== 'bR')) return false;
                if (!kingside && (hasMoved.bR_left || board[0][0] !== 'bR')) return false;
            }

            // Path must be clear and not under attack
            const path = kingside ? [5, 6] : [1, 2, 3];
            for (let col of path) {
                if (board[fR][col] !== '.' || this.isSquareAttacked(fR, col, turn === 'white' ? 'black' : 'white', board, enPassant)) return false;
            }
            return true;
        }

        // Standard piece movement validation
        return PieceMovement.validateBasicMove(fR, fC, tR, tC, board, enPassant);
    },

    /**
     * Generates all legal moves for a given color.
     * Used by the bot and for checkmate/stalemate detection.
     */
    getAllValidMoves(color, board = this.boardState, enPassant = this.enPassantTarget, hasMoved = this.hasMoved) {
        const moves = [];
        for (let fR = 0; fR < 8; fR++) {
            for (let fC = 0; fC < 8; fC++) {
                const piece = board[fR][fC];
                if (piece !== '.' && (piece.startsWith('w') ? 'white' : 'black') === color) {
                    for (let tR = 0; tR < 8; tR++) {
                        for (let tC = 0; tC < 8; tC++) {
                            if (this.checkMoveIsValid(fR, fC, tR, tC, board, color, enPassant, hasMoved)) {
                                if (!this.wouldBeInCheckSim(fR, fC, tR, tC, board, color, enPassant)) {
                                    moves.push({ fR, fC, tR, tC });
                                }
                            }
                        }
                    }
                }
            }
        }
        return moves;
    },

    /**
     * Core simulation logic for check detection.
     * Temporarily modifies the board to verify if the King would be attacked.
     */
    wouldBeInCheckSim(fR, fC, tR, tC, board, color, enPassant) {
        const piece = board[fR][fC];
        const target = board[tR][tC];
        let victimRow, victimPiece;
        const isEnPassant = piece[1] === 'P' && enPassant && tR === enPassant.row && tC === enPassant.col;

        if (isEnPassant) {
            victimRow = piece.startsWith('w') ? tR + 1 : tR - 1;
            victimPiece = board[victimRow][tC];
            board[victimRow][tC] = '.';
        }

        board[tR][tC] = piece;
        board[fR][fC] = '.';

        const inCheck = this.isInCheck(color, board, enPassant);

        // Undo modifications
        board[fR][fC] = piece;
        board[tR][tC] = target;
        if (isEnPassant) {
            board[victimRow][tC] = victimPiece;
        }

        return inCheck;
    },

    /**
     * Quick check if any legal moves are available for a color.
     */
    hasValidMoves(color) {
        return this.getAllValidMoves(color).length > 0;
    },

    /**
     * Evaluates the board for terminal states: Checkmate, Stalemate, or Threefold Repetition.
     */
    checkGameState() {
        if (this.gameState) return;

        if (this.checkThreefoldRepetition()) {
            this.gameState = 'draw';
            this.stopTimer();
            return;
        }

        const isInCheck = this.isInCheck(this.turn);
        const hasMoves = this.hasValidMoves(this.turn);

        if (!hasMoves) {
            if (isInCheck) {
                this.gameState = this.turn === 'white' ? 'black-won' : 'white-won';
            } else {
                this.gameState = 'draw';
            }
            this.stopTimer();
        }
    },

    /**
     * Serialises critical board state into a string for repetition detection.
     */
    getBoardString() {
        return JSON.stringify(this.boardState) + '|' + this.turn + '|' + JSON.stringify(this.enPassantTarget);
    },

    /**
     * Creates a deep copy of the current game state.
     */
    getGameStateSnapshot() {
        return {
            boardState: JSON.parse(JSON.stringify(this.boardState)),
            turn: this.turn,
            enPassantTarget: this.enPassantTarget ? { ...this.enPassantTarget } : null,
            hasMoved: { ...this.hasMoved },
            lastMove: this.lastMove ? { ...this.lastMove } : null,
            gameState: this.gameState
        };
    },

    /**
     * Restores the engine to a previous state from a snapshot.
     */
    loadGameStateSnapshot(snapshot) {
        this.boardState = snapshot.boardState;
        this.turn = snapshot.turn;
        this.enPassantTarget = snapshot.enPassantTarget;
        this.hasMoved = snapshot.hasMoved;
        this.lastMove = snapshot.lastMove;
        this.gameState = snapshot.gameState;
        this.isPromoting = false;
        this.promotionSquare = null;
    },

    /**
     * Reverts the game to the previous state in the history stack.
     */
    undoMove() {
        if (this.moveHistory.length === 0) return false;

        const snapshot = this.moveHistory.pop();
        this.loadGameStateSnapshot(snapshot);
        this.moveLog.pop();

        if (this.autoFlip) this.perspective = this.turn;

        // Resume timer if game was previously active
        if (this.timerEnabled && !this.gameState) {
            this.startTimer();
        }

        return true;
    },

    /**
     * Converts a move into Standard Algebraic Notation (SAN).
     */
    recordMove(piece, fR, fC, tR, tC, targetPiece) {
        const files = 'abcdefgh';
        const isPawn = piece[1] === 'P';
        const pieceType = isPawn ? '' : piece[1];
        const capture = (targetPiece !== '.' || (isPawn && fC !== tC)) ? 'x' : '';
        const toSquare = files[tC] + (8 - tR);

        let moveNotation = pieceType;
        if (isPawn && capture) {
            moveNotation += files[fC]; // e.g., exd4
        }
        moveNotation += capture + toSquare;

        // Castling Notation
        if (piece[1] === 'K' && Math.abs(tC - fC) === 2) {
            moveNotation = tC > fC ? 'O-O' : 'O-O-O';
        }

        // Append Check (+) or Checkmate (#) indicators
        const isCheck = this.isInCheck(this.turn);
        const hasMoves = this.hasValidMoves(this.turn);

        if (!hasMoves) {
            if (isCheck) moveNotation += '#';
        } else if (isCheck) {
            moveNotation += '+';
        }

        this.moveLog.push(moveNotation);
    },

    /**
     * Checks if the current board position has occurred three times.
     */
    checkThreefoldRepetition() {
        const currentBoard = this.getBoardString();
        let count = 0;
        for (let i = 0; i < this.moveHistory.length; i++) {
            const historyBoardString = JSON.stringify(this.moveHistory[i].boardState) + '|' + this.moveHistory[i].turn + '|' + JSON.stringify(this.moveHistory[i].enPassantTarget);
            if (historyBoardString === currentBoard) count++;
        }
        return count >= 2; // 2 previous + 1 current = 3
    },

    /**
     * Starts or resumes the game timer for the active player.
     */
    startTimer() {
        if (!this.timerEnabled || this.gameState) return;
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            if (this.turn === 'white') {
                this.whiteTime--;
                if (this.whiteTime <= 0) {
                    this.whiteTime = 0;
                    this.gameState = 'black-won';
                    this.stopTimer();
                    BoardRenderer.render();
                }
            } else {
                this.blackTime--;
                if (this.blackTime <= 0) {
                    this.blackTime = 0;
                    this.gameState = 'white-won';
                    this.stopTimer();
                    BoardRenderer.render();
                }
            }
            this.updateTimerUI();
        }, 1000);
    },

    /**
     * Stops the active game timer.
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },

    /**
     * Triggers a UI-only update for the timer displays.
     */
    updateTimerUI() {
        if (typeof BoardRenderer !== 'undefined' && BoardRenderer.updateTimerDisplay) {
            BoardRenderer.updateTimerDisplay();
        }
    }
};
