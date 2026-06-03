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

    getPieceAt(row, col) { return this.boardState[row][col]; },

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
        if (this.wouldBeInCheck(fromRow, fromCol, toRow, toCol)) return false;

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
        return true;
    },

    promotePawn(type) {
        const prefix = this.turn === 'white' ? 'w' : 'b';
        this.boardState[this.promotionSquare.row][this.promotionSquare.col] = prefix + type;
        this.isPromoting = false;
        this.turn = this.turn === 'white' ? 'black' : 'white';
    },

    checkMoveIsValid(fR, fC, tR, tC) {
        const piece = this.getPieceAt(fR, fC);
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
        return PieceMovement.validateBasicMove(fR, fC, tR, tC, this.boardState, this.enPassantTarget);
    }
};