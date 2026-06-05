const GameLogic = {
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
    selectedSquare: null,
    enPassantTarget: null,
    isPromoting: false,
    promotionSquare: null,
    hasMoved: { wK: false, wR_left: false, wR_right: false, bK: false, bR_left: false, bR_right: false },
    isSandboxMode: false,
    sandboxFreeMovementEnabled: true,
    perspective: 'white',
    autoFlip: false,

    getPieceAt(row, col) { return this.boardState[row][col]; },

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
    },

    clearBoard() {
        this.boardState = [
            ['.',  '.',  '.',  '.',  '.',  '.',  '.',  '.'],
            ['.',  '.',  '.',  '.',  '.',  '.',  '.',  '.'],
            ['.',  '.',  '.',  '.',  '.',  '.',  '.',  '.'],
            ['.',  '.',  '.',  '.',  '.',  '.',  '.',  '.'],
            ['.',  '.',  '.',  '.',  '.',  '.',  '.',  '.'],
            ['.',  '.',  '.',  '.',  '.',  '.',  '.',  '.'],
            ['.',  '.',  '.',  '.',  '.',  '.',  '.',  '.'],
            ['.',  '.',  '.',  '.',  '.',  '.',  '.',  '.']
        ];
        this.turn = 'white';
        this.selectedSquare = null;
        this.enPassantTarget = null;
        this.isPromoting = false;
        this.promotionSquare = null;
        this.hasMoved = { wK: false, wR_left: false, wR_right: false, bK: false, bR_left: false, bR_right: false };
    },

    isInCheck(color, customBoard = this.boardState) {
        const kingChar = color === 'white' ? 'wK' : 'bK';
        let kingPos = null;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (customBoard[r][c] === kingChar) { kingPos = { r, c }; break; }
            }
        }
        return kingPos ? this.isSquareAttacked(kingPos.r, kingPos.c, color === 'white' ? 'black' : 'white', customBoard) : false;
    },

    isSquareAttacked(row, col, attackerColor, customBoard = this.boardState) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = customBoard[r][c];
                if (piece !== '.' && (piece.startsWith('w') ? 'white' : 'black') === attackerColor) {
                    if (PieceMovement.validateBasicMove(r, c, row, col, customBoard, this.enPassantTarget)) return true;
                }
            }
        }
        return false;
    },

    wouldBeInCheck(fR, fC, tR, tC) {
        const simBoard = JSON.parse(JSON.stringify(this.boardState));
        const piece = simBoard[fR][fC];

        // Handle En Passant in simulation
        if (piece[1] === 'P' && this.enPassantTarget && tR === this.enPassantTarget.row && tC === this.enPassantTarget.col) {
            const victimRow = piece.startsWith('w') ? tR + 1 : tR - 1;
            simBoard[victimRow][tC] = '.';
        }

        simBoard[tR][tC] = piece;
        simBoard[fR][fC] = '.';
        return this.isInCheck(piece.startsWith('w') ? 'white' : 'black', simBoard);
    },

    movePiece(fromRow, fromCol, toRow, toCol) {
        if (this.isPromoting) return false;
        if (!this.checkMoveIsValid(fromRow, fromCol, toRow, toCol)) return false;

        // In sandbox mode with free movement, skip check validation
        if (!(this.isSandboxMode && this.sandboxFreeMovementEnabled) && this.wouldBeInCheck(fromRow, fromCol, toRow, toCol)) return false;

        const piece = this.boardState[fromRow][fromCol];

        // 1. Execute Special Moves (Castling/En Passant)
        if (piece[1] === 'K' && Math.abs(toCol - fromCol) === 2) {
            const isKingside = toCol > fromCol;
            const rookCol = isKingside ? 7 : 0;
            const rookDestCol = isKingside ? 5 : 3;
            this.boardState[fromRow][rookDestCol] = this.boardState[fromRow][rookCol];
            this.boardState[fromRow][rookCol] = '.';
        }

        if (piece[1] === 'P' && this.enPassantTarget && toRow === this.enPassantTarget.row && toCol === this.enPassantTarget.col) {
            const victimRow = piece.startsWith('w') ? toRow + 1 : toRow - 1;
            this.boardState[victimRow][toCol] = '.';
        }

        // 2. Track piece movement for castling rights
        if (piece === 'wK') this.hasMoved.wK = true;
        if (piece === 'bK') this.hasMoved.bK = true;
        if (fromRow === 7 && fromCol === 0) this.hasMoved.wR_left = true;
        if (fromRow === 7 && fromCol === 7) this.hasMoved.wR_right = true;
        if (fromRow === 0 && fromCol === 0) this.hasMoved.bR_left = true;
        if (fromRow === 0 && fromCol === 7) this.hasMoved.bR_right = true;

        // 3. Update en passant target for NEXT turn
        const nextEnPassant = (piece[1] === 'P' && Math.abs(toRow - fromRow) === 2)
            ? { row: (fromRow + toRow) / 2, col: fromCol } : null;

        // 4. Update Board State
        this.boardState[toRow][toCol] = piece;
        this.boardState[fromRow][fromCol] = '.';
        this.enPassantTarget = nextEnPassant;

        if (piece[1] === 'P' && (toRow === 0 || toRow === 7)) {
            this.isPromoting = true;
            this.promotionSquare = { row: toRow, col: toCol };
            return "promote";
        }

        this.turn = this.turn === 'white' ? 'black' : 'white';
        if (this.autoFlip) this.perspective = this.turn;
        return true;
    },

    promotePawn(type) {
        const prefix = this.turn === 'white' ? 'w' : 'b';
        this.boardState[this.promotionSquare.row][this.promotionSquare.col] = prefix + type;
        this.isPromoting = false;
        this.turn = this.turn === 'white' ? 'black' : 'white';
        if (this.autoFlip) this.perspective = this.turn;
    },

    checkMoveIsValid(fR, fC, tR, tC, board = this.boardState, turn = this.turn, enPassant = this.enPassantTarget, hasMoved = this.hasMoved) {
        const piece = board[fR][fC];

        // In sandbox mode with free movement enabled, allow moving any piece
        if (this.isSandboxMode && this.sandboxFreeMovementEnabled && board === this.boardState) {
            return piece !== '.';
        }

        if (piece === '.' || (piece.startsWith('w') ? 'white' : 'black') !== turn) return false;

        const target = board[tR][tC];
        if (target !== '.' && (target.startsWith('w') ? 'white' : 'black') === turn) return false;

        if (piece[1] === 'K' && Math.abs(tC - fC) === 2) {
            const kingMoved = turn === 'white' ? hasMoved.wK : hasMoved.bK;
            if (kingMoved || this.isInCheck(turn, board)) return false;

            const kingside = tC > fC;
            if (turn === 'white') {
                if (kingside && (hasMoved.wR_right || board[7][7] !== 'wR')) return false;
                if (!kingside && (hasMoved.wR_left || board[7][0] !== 'wR')) return false;
            } else {
                if (kingside && (hasMoved.bR_right || board[0][7] !== 'bR')) return false;
                if (!kingside && (hasMoved.bR_left || board[0][0] !== 'bR')) return false;
            }

            const path = kingside ? [5, 6] : [1, 2, 3];
            for (let col of path) {
                if (board[fR][col] !== '.' || this.isSquareAttacked(fR, col, turn === 'white' ? 'black' : 'white', board)) return false;
            }
            return true;
        }

        // In sandbox mode with free movement enabled, allow any piece to move to any square
        if (this.isSandboxMode && this.sandboxFreeMovementEnabled && board === this.boardState) {
            return true;
        }

        return PieceMovement.validateBasicMove(fR, fC, tR, tC, board, enPassant);
    },

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

    wouldBeInCheckSim(fR, fC, tR, tC, board, color, enPassant) {
        const simBoard = JSON.parse(JSON.stringify(board));
        const piece = simBoard[fR][fC];

        if (piece[1] === 'P' && enPassant && tR === enPassant.row && tC === enPassant.col) {
            const victimRow = piece.startsWith('w') ? tR + 1 : tR - 1;
            simBoard[victimRow][tC] = '.';
        }

        simBoard[tR][tC] = piece;
        simBoard[fR][fC] = '.';
        return this.isInCheck(color, simBoard);
    }
};
const GameLogic = {
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
    selectedSquare: null,
    enPassantTarget: null,
    isPromoting: false,
    promotionSquare: null,
    hasMoved: { wK: false, wR_left: false, wR_right: false, bK: false, bR_left: false, bR_right: false },
    isSandboxMode: false,
    sandboxFreeMovementEnabled: true,
    perspective: 'white',
    autoFlip: false,
    gameState: null, // 'white-won', 'black-won', 'draw', or null
    moveHistory: [], // Track board positions for repetition detection
    lastMove: null, // Track last move for highlighting {fromRow, fromCol, toRow, toCol}

    getPieceAt(row, col) { return this.boardState[row][col]; },

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
        this.lastMove = null;
    },

    clearBoard() {
        this.boardState = [
            ['.',  '.',  '.',  '.',  '.',  '.',  '.',  '.'],
            ['.',  '.',  '.',  '.',  '.',  '.',  '.',  '.'],
            ['.',  '.',  '.',  '.',  '.',  '.',  '.',  '.'],
            ['.',  '.',  '.',  '.',  '.',  '.',  '.',  '.'],
            ['.',  '.',  '.',  '.',  '.',  '.',  '.',  '.'],
            ['.',  '.',  '.',  '.',  '.',  '.',  '.',  '.'],
            ['.',  '.',  '.',  '.',  '.',  '.',  '.',  '.'],
            ['.',  '.',  '.',  '.',  '.',  '.',  '.',  '.']
        ];
        this.turn = 'white';
        this.selectedSquare = null;
        this.enPassantTarget = null;
        this.isPromoting = false;
        this.promotionSquare = null;
        this.hasMoved = { wK: false, wR_left: false, wR_right: false, bK: false, bR_left: false, bR_right: false };
        this.gameState = null;
        this.moveHistory = [];
        this.lastMove = null;
    },

    isInCheck(color, customBoard = this.boardState) {
        const kingChar = color === 'white' ? 'wK' : 'bK';
        let kingPos = null;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (customBoard[r][c] === kingChar) { kingPos = { r, c }; break; }
            }
        }
        return kingPos ? this.isSquareAttacked(kingPos.r, kingPos.c, color === 'white' ? 'black' : 'white', customBoard) : false;
    },

    isSquareAttacked(row, col, attackerColor, customBoard = this.boardState) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = customBoard[r][c];
                if (piece !== '.' && (piece.startsWith('w') ? 'white' : 'black') === attackerColor) {
                    if (PieceMovement.validateBasicMove(r, c, row, col, customBoard, this.enPassantTarget)) return true;
                }
            }
        }
        return false;
    },

    wouldBeInCheck(fR, fC, tR, tC) {
        const simBoard = JSON.parse(JSON.stringify(this.boardState));
        const piece = simBoard[fR][fC];
        
        // Handle En Passant in simulation
        if (piece[1] === 'P' && this.enPassantTarget && tR === this.enPassantTarget.row && tC === this.enPassantTarget.col) {
            const victimRow = piece.startsWith('w') ? tR + 1 : tR - 1;
            simBoard[victimRow][tC] = '.';
        }

        simBoard[tR][tC] = piece;
        simBoard[fR][fC] = '.';
        return this.isInCheck(piece.startsWith('w') ? 'white' : 'black', simBoard);
    },

    movePiece(fromRow, fromCol, toRow, toCol) {
        if (this.isPromoting) return false;
        if (!this.checkMoveIsValid(fromRow, fromCol, toRow, toCol)) return false;
        
        // In sandbox mode with free movement, skip check validation
        if (!(this.isSandboxMode && this.sandboxFreeMovementEnabled) && this.wouldBeInCheck(fromRow, fromCol, toRow, toCol)) return false;

        const piece = this.boardState[fromRow][fromCol];

        // Add current position to history before making move
        this.moveHistory.push(this.getBoardString());

        // Store the move for highlighting
        this.lastMove = { fromRow, fromCol, toRow, toCol };

        // 1. Execute Special Moves (Castling/En Passant)
        if (piece[1] === 'K' && Math.abs(toCol - fromCol) === 2) {
            const isKingside = toCol > fromCol;
            const rookCol = isKingside ? 7 : 0;
            const rookDestCol = isKingside ? 5 : 3;
            this.boardState[fromRow][rookDestCol] = this.boardState[fromRow][rookCol];
            this.boardState[fromRow][rookCol] = '.';
        }

        if (piece[1] === 'P' && this.enPassantTarget && toRow === this.enPassantTarget.row && toCol === this.enPassantTarget.col) {
            const victimRow = piece.startsWith('w') ? toRow + 1 : toRow - 1;
            this.boardState[victimRow][toCol] = '.';
        }

        // 2. Track piece movement for castling rights
        if (piece === 'wK') this.hasMoved.wK = true;
        if (piece === 'bK') this.hasMoved.bK = true;
        if (fromRow === 7 && fromCol === 0) this.hasMoved.wR_left = true;
        if (fromRow === 7 && fromCol === 7) this.hasMoved.wR_right = true;
        if (fromRow === 0 && fromCol === 0) this.hasMoved.bR_left = true;
        if (fromRow === 0 && fromCol === 7) this.hasMoved.bR_right = true;

        // 3. Update en passant target for NEXT turn
        const nextEnPassant = (piece[1] === 'P' && Math.abs(toRow - fromRow) === 2) 
            ? { row: (fromRow + toRow) / 2, col: fromCol } : null;

        // 4. Update Board State
        this.boardState[toRow][toCol] = piece;
        this.boardState[fromRow][fromCol] = '.';
        this.enPassantTarget = nextEnPassant;

        if (piece[1] === 'P' && (toRow === 0 || toRow === 7)) {
            this.isPromoting = true;
            this.promotionSquare = { row: toRow, col: toCol };
            return "promote";
        }

        this.turn = this.turn === 'white' ? 'black' : 'white';
        if (this.autoFlip) this.perspective = this.turn;
        this.checkGameState();
        return true;
    },

    promotePawn(type) {
        // Add position before promotion to history
        this.moveHistory.push(this.getBoardString());
        
        const prefix = this.turn === 'white' ? 'w' : 'b';
        this.boardState[this.promotionSquare.row][this.promotionSquare.col] = prefix + type;
        this.isPromoting = false;
        this.turn = this.turn === 'white' ? 'black' : 'white';
        if (this.autoFlip) this.perspective = this.turn;
        this.checkGameState();
    },

    checkMoveIsValid(fR, fC, tR, tC) {
        const piece = this.getPieceAt(fR, fC);
        
        // In sandbox mode with free movement enabled, allow moving any piece
        if (this.isSandboxMode && this.sandboxFreeMovementEnabled) {
            return piece !== '.';
        }
        
        if (piece === '.' || (piece.startsWith('w') ? 'white' : 'black') !== this.turn) return false;
        
        const target = this.getPieceAt(tR, tC);
        if (target !== '.' && (target.startsWith('w') ? 'white' : 'black') === this.turn) return false;
        
        if (piece[1] === 'K' && Math.abs(tC - fC) === 2) {
            const kingMoved = this.turn === 'white' ? this.hasMoved.wK : this.hasMoved.bK;
            if (kingMoved || this.isInCheck(this.turn)) return false;

            const kingside = tC > fC;
            if (this.turn === 'white') {
                if (kingside && (this.hasMoved.wR_right || this.getPieceAt(7, 7) !== 'wR')) return false;
                if (!kingside && (this.hasMoved.wR_left || this.getPieceAt(7, 0) !== 'wR')) return false;
            } else {
                if (kingside && (this.hasMoved.bR_right || this.getPieceAt(0, 7) !== 'bR')) return false;
                if (!kingside && (this.hasMoved.bR_left || this.getPieceAt(0, 0) !== 'bR')) return false;
            }

            const path = kingside ? [5, 6] : [1, 2, 3];
            for (let col of path) {
                if (this.getPieceAt(fR, col) !== '.' || this.isSquareAttacked(fR, col, this.turn === 'white' ? 'black' : 'white')) return false;
            }
            return true;
        }
        
        // In sandbox mode with free movement enabled, allow any piece to move to any square
        if (this.isSandboxMode && this.sandboxFreeMovementEnabled) {
            return true;
        }
        
        return PieceMovement.validateBasicMove(fR, fC, tR, tC, this.boardState, this.enPassantTarget);
    },

    hasValidMoves(color) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.boardState[r][c];
                if (piece === '.' || (piece.startsWith('w') ? 'white' : 'black') !== color) continue;
                
                for (let tR = 0; tR < 8; tR++) {
                    for (let tC = 0; tC < 8; tC++) {
                        const target = this.getPieceAt(tR, tC);
                        
                        // Can't capture own piece
                        if (target !== '.' && (target.startsWith('w') ? 'white' : 'black') === color) continue;
                        
                        // Check if move is valid according to piece movement rules
                        if (!PieceMovement.validateBasicMove(r, c, tR, tC, this.boardState, this.enPassantTarget)) continue;
                        
                        // Simulate the move and check if it leaves the king in check
                        const simBoard = JSON.parse(JSON.stringify(this.boardState));
                        const movingPiece = simBoard[r][c];
                        
                        // Handle en passant in simulation
                        if (movingPiece[1] === 'P' && this.enPassantTarget && tR === this.enPassantTarget.row && tC === this.enPassantTarget.col) {
                            const victimRow = movingPiece.startsWith('w') ? tR + 1 : tR - 1;
                            simBoard[victimRow][tC] = '.';
                        }
                        
                        simBoard[tR][tC] = movingPiece;
                        simBoard[r][c] = '.';
                        
                        if (!this.isInCheck(color, simBoard)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    },

    checkGameState() {
        if (this.gameState) return; // Game already ended

        // Check for threefold repetition
        if (this.checkThreefoldRepetition()) {
            this.gameState = 'draw';
            return;
        }

        const isInCheck = this.isInCheck(this.turn);
        const hasValidMoves = this.hasValidMoves(this.turn);

        if (!hasValidMoves) {
            if (isInCheck) {
                // Checkmate
                this.gameState = this.turn === 'white' ? 'black-won' : 'white-won';
            } else {
                // Stalemate (draw)
                this.gameState = 'draw';
            }
        }
    },

    getBoardString() {
        return JSON.stringify(this.boardState) + '|' + this.turn + '|' + JSON.stringify(this.enPassantTarget);
    },

    checkThreefoldRepetition() {
        const currentBoard = this.getBoardString();
        let count = 0;
        for (let i = 0; i < this.moveHistory.length; i++) {
            if (this.moveHistory[i] === currentBoard) count++;
        }
        return count >= 2; // 2 in history + current = 3 total
    },
};
