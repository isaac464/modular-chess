const ChessBot = {
    pieceValues: {
        'P': 10,
        'N': 30,
        'B': 30,
        'R': 50,
        'Q': 90,
        'K': 900
    },

    async makeMove(difficulty, color) {
        // Add a small delay to make it feel more natural
        await new Promise(resolve => setTimeout(resolve, 600));

        const moves = GameLogic.getAllValidMoves(color);
        if (moves.length === 0) return null;

        let selectedMove;
        if (difficulty === 'easy') {
            selectedMove = this.getRandomMove(moves);
        } else if (difficulty === 'medium') {
            selectedMove = this.getGreedyMove(moves);
        } else if (difficulty === 'hard') {
            selectedMove = this.getBestMoveMinimax(moves, 3, color);
        }

        if (selectedMove) {
            const result = GameLogic.movePiece(selectedMove.fR, selectedMove.fC, selectedMove.tR, selectedMove.tC);
            if (result === "promote") {
                // Bots always promote to Queen for simplicity
                GameLogic.promotePawn('Q');
            }
            BoardRenderer.render();
            return true;
        }
        return false;
    },

    getRandomMove(moves) {
        return moves[Math.floor(Math.random() * moves.length)];
    },

    getGreedyMove(moves) {
        let bestMoves = [];
        let maxGain = -Infinity;

        moves.forEach(move => {
            const targetPiece = GameLogic.getPieceAt(move.tR, move.tC);
            let gain = 0;
            if (targetPiece !== '.') {
                gain = this.pieceValues[targetPiece[1]];
            }

            if (gain > maxGain) {
                maxGain = gain;
                bestMoves = [move];
            } else if (gain === maxGain) {
                bestMoves.push(move);
            }
        });

        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    },

    getBestMoveMinimax(moves, depth, color) {
        let bestMoves = [];
        let bestValue = -Infinity;

        for (let move of moves) {
            const boardCopy = JSON.parse(JSON.stringify(GameLogic.boardState));
            const enPassantCopy = GameLogic.enPassantTarget ? { ...GameLogic.enPassantTarget } : null;
            const hasMovedCopy = { ...GameLogic.hasMoved };

            this.simulateMove(move, boardCopy, enPassantCopy, hasMovedCopy);

            const boardValue = -this.minimax(depth - 1, boardCopy, -Infinity, Infinity, color === 'white' ? 'black' : 'white', enPassantCopy, hasMovedCopy);

            if (boardValue > bestValue) {
                bestValue = boardValue;
                bestMoves = [move];
            } else if (boardValue === bestValue) {
                bestMoves.push(move);
            }
        }
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    },

    minimax(depth, board, alpha, beta, color, enPassant, hasMoved) {
        if (depth === 0) {
            return this.evaluateBoard(board, color);
        }

        const moves = GameLogic.getAllValidMoves(color, board, enPassant, hasMoved);

        if (moves.length === 0) {
            if (GameLogic.isInCheck(color, board)) {
                return -10000 - depth; // Prefer quicker checkmates
            }
            return 0; // Stalemate
        }

        let maxEval = -Infinity;
        for (let move of moves) {
            const boardCopy = JSON.parse(JSON.stringify(board));
            const enPassantCopy = enPassant ? { ...enPassant } : null;
            const hasMovedCopy = { ...hasMoved };

            this.simulateMove(move, boardCopy, enPassantCopy, hasMovedCopy);

            const evaluation = -this.minimax(depth - 1, boardCopy, -beta, -alpha, color === 'white' ? 'black' : 'white', enPassantCopy, hasMovedCopy);
            maxEval = Math.max(maxEval, evaluation);
            alpha = Math.max(alpha, evaluation);
            if (beta <= alpha) break;
        }
        return maxEval;
    },

    evaluateBoard(board, color) {
        let totalEvaluation = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                totalEvaluation += this.getPieceValue(board[r][c], color, r, c);
            }
        }
        return totalEvaluation;
    },

    getPieceValue(piece, color, row, col) {
        if (piece === '.') return 0;
        const pieceColor = piece.startsWith('w') ? 'white' : 'black';
        const type = piece[1];
        let value = this.pieceValues[type];

        // Positional bonus
        if (type === 'P') {
            value += (pieceColor === 'white' ? (6 - row) : (row - 1)) * 0.1;
        } else if (type === 'N' || type === 'B') {
            const distFromCenter = Math.abs(3.5 - row) + Math.abs(3.5 - col);
            value += (7 - distFromCenter) * 0.1;
        }

        return pieceColor === color ? value : -value;
    },

    simulateMove(move, board, enPassant, hasMoved) {
        const piece = board[move.fR][move.fC];

        // Handle Castling
        if (piece[1] === 'K' && Math.abs(move.tC - move.fC) === 2) {
            const isKingside = move.tC > move.fC;
            const rookCol = isKingside ? 7 : 0;
            const rookDestCol = isKingside ? 5 : 3;
            board[move.fR][rookDestCol] = board[move.fR][rookCol];
            board[move.fR][rookCol] = '.';
        }

        // Handle En Passant
        if (piece[1] === 'P' && enPassant && move.tR === enPassant.row && move.tC === enPassant.col) {
            const victimRow = piece.startsWith('w') ? move.tR + 1 : move.tR - 1;
            board[victimRow][move.tC] = '.';
        }

        // Update board
        board[move.tR][move.tC] = piece;
        board[move.fR][move.fC] = '.';

        // Update hasMoved
        if (piece === 'wK') hasMoved.wK = true;
        if (piece === 'bK') hasMoved.bK = true;
        if (move.fR === 7 && move.fC === 0) hasMoved.wR_left = true;
        if (move.fR === 7 && move.fC === 7) hasMoved.wR_right = true;
        if (move.fR === 0 && move.fC === 0) hasMoved.bR_left = true;
        if (move.fR === 0 && move.fC === 7) hasMoved.bR_right = true;
    }
};
