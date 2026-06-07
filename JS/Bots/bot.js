const ChessBot = {
    pieceValues: {
        'P': 100,
        'N': 320,
        'B': 330,
        'R': 500,
        'Q': 900,
        'K': 20000
    },

    // Piece-Square Tables (PSTs) to encourage better positional play
    // Tables from perspective of white. For black, rows are flipped.
    pst: {
        'P': [
            [0,  0,  0,  0,  0,  0,  0,  0],
            [50, 50, 50, 50, 50, 50, 50, 50],
            [10, 10, 20, 30, 30, 20, 10, 10],
            [5,  5, 10, 25, 25, 10,  5,  5],
            [0,  0,  0, 20, 20,  0,  0,  0],
            [5, -5,-10,  0,  0,-10, -5,  5],
            [5, 10, 10,-20,-20, 10, 10,  5],
            [0,  0,  0,  0,  0,  0,  0,  0]
        ],
        'N': [
            [-50,-40,-30,-30,-30,-30,-40,-50],
            [-40,-20,  0,  0,  0,  0,-20,-40],
            [-30,  0, 10, 15, 15, 10,  0,-30],
            [-30,  5, 15, 20, 20, 15,  5,-30],
            [-30,  0, 15, 20, 20, 15,  0,-30],
            [-30,  5, 10, 15, 15, 10,  5,-30],
            [-40,-20,  0,  5,  5,  0,-20,-40],
            [-50,-40,-30,-30,-30,-30,-40,-50]
        ],
        'B': [
            [-20,-10,-10,-10,-10,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5, 10, 10,  5,  0,-10],
            [-10,  5,  5, 10, 10,  5,  5,-10],
            [-10,  0, 10, 10, 10, 10,  0,-10],
            [-10, 10, 10, 10, 10, 10, 10,-10],
            [-10,  5,  0,  0,  0,  0,  5,-10],
            [-20,-10,-10,-10,-10,-10,-10,-20]
        ],
        'R': [
            [0,  0,  0,  0,  0,  0,  0,  0],
            [5, 10, 10, 10, 10, 10, 10,  5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [0,  0,  0,  5,  5,  0,  0,  0]
        ],
        'Q': [
            [-20,-10,-10, -5, -5,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5,  5,  5,  5,  0,-10],
            [-5,  0,  5,  5,  5,  5,  0, -5],
            [0,  0,  5,  5,  5,  5,  0, -5],
            [-10,  5,  5,  5,  5,  5,  0,-10],
            [-10,  0,  5,  0,  0,  0,  0,-10],
            [-20,-10,-10, -5, -5,-10,-10,-20]
        ],
        'K': [
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-20,-30,-30,-40,-40,-30,-30,-20],
            [-10,-20,-20,-20,-20,-20,-20,-10],
            [20, 20,  0,  0,  0,  0, 20, 20],
            [20, 30, 10,  0,  0, 10, 30, 20]
        ]
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
            selectedMove = this.getBestMoveMinimax(moves, 4, color);
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

        // Sort moves to improve alpha-beta pruning (captures first)
        const sortedMoves = this.orderMoves(moves, GameLogic.boardState);

        for (let move of sortedMoves) {
            const board = GameLogic.boardState.map(row => [...row]);
            const enPassant = GameLogic.enPassantTarget ? { ...GameLogic.enPassantTarget } : null;
            const hasMoved = { ...GameLogic.hasMoved };

            const nextEnPassant = (board[move.fR][move.fC][1] === 'P' && Math.abs(move.tR - move.fR) === 2)
                ? { row: (move.fR + move.tR) / 2, col: move.fC } : null;

            const undoInfo = this.simulateMove(move, board, enPassant, hasMoved);
            const boardValue = -this.minimax(depth - 1, board, -Infinity, Infinity, color === 'white' ? 'black' : 'white', nextEnPassant, hasMoved);
            this.undoMove(board, undoInfo, hasMoved);

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
            if (GameLogic.isInCheck(color, board, enPassant)) {
                return -10000 - depth; // Prefer quicker checkmates
            }
            return 0; // Stalemate
        }

        // Sort moves to improve alpha-beta pruning
        const sortedMoves = this.orderMoves(moves, board);

        let maxEval = -Infinity;
        for (let move of sortedMoves) {
            const nextEnPassant = (board[move.fR][move.fC][1] === 'P' && Math.abs(move.tR - move.fR) === 2)
                ? { row: (move.fR + move.tR) / 2, col: move.fC } : null;

            const undoInfo = this.simulateMove(move, board, enPassant, hasMoved);
            const evaluation = -this.minimax(depth - 1, board, -beta, -alpha, color === 'white' ? 'black' : 'white', nextEnPassant, hasMoved);
            this.undoMove(board, undoInfo, hasMoved);

            maxEval = Math.max(maxEval, evaluation);
            alpha = Math.max(alpha, evaluation);
            if (beta <= alpha) break;
        }
        return maxEval;
    },

    orderMoves(moves, board) {
        return moves.sort((a, b) => {
            const pieceA = board[a.fR][a.fC];
            const targetA = board[a.tR][a.tC];
            const pieceB = board[b.fR][b.fC];
            const targetB = board[b.tR][b.tC];

            let scoreA = 0;
            let scoreB = 0;

            if (targetA !== '.') {
                scoreA = 10 * this.pieceValues[targetA[1]] - this.pieceValues[pieceA[1]];
            }
            if (targetB !== '.') {
                scoreB = 10 * this.pieceValues[targetB[1]] - this.pieceValues[pieceB[1]];
            }

            return scoreB - scoreA;
        });
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

        // Add positional value from PST
        if (pieceColor === 'white') {
            value += this.pst[type][row][col];
        } else {
            value += this.pst[type][7 - row][col];
        }

        return pieceColor === color ? value : -value;
    },

    simulateMove(move, board, enPassant, hasMoved) {
        const piece = board[move.fR][move.fC];
        const undoInfo = {
            fR: move.fR, fC: move.fC, tR: move.tR, tC: move.tC,
            piece: piece,
            target: board[move.tR][move.tC],
            oldHasMoved: { ...hasMoved }
        };

        // Handle Castling
        if (piece[1] === 'K' && move.tR === move.fR && Math.abs(move.tC - move.fC) === 2) {
            const isKingside = move.tC > move.fC;
            const rookCol = isKingside ? 7 : 0;
            const rookDestCol = isKingside ? 5 : 3;
            undoInfo.rookF = rookCol;
            undoInfo.rookT = rookDestCol;
            undoInfo.rookPiece = board[move.fR][rookCol];
            board[move.fR][rookDestCol] = board[move.fR][rookCol];
            board[move.fR][rookCol] = '.';
        }

        // Handle En Passant
        if (piece[1] === 'P' && enPassant && move.tR === enPassant.row && move.tC === enPassant.col) {
            const victimRow = piece.startsWith('w') ? move.tR + 1 : move.tR - 1;
            undoInfo.victimRow = victimRow;
            undoInfo.victimPiece = board[victimRow][move.tC];
            board[victimRow][move.tC] = '.';
        }

        // Update board
        board[move.tR][move.tC] = piece;
        board[move.fR][move.fC] = '.';

        // Handle promotion
        if (piece[1] === 'P' && (move.tR === 0 || move.tR === 7)) {
            board[move.tR][move.tC] = piece[0] + 'Q';
        }

        // Update hasMoved
        if (piece === 'wK') hasMoved.wK = true;
        if (piece === 'bK') hasMoved.bK = true;
        if (move.fR === 7 && move.fC === 0) hasMoved.wR_left = true;
        if (move.fR === 7 && move.fC === 7) hasMoved.wR_right = true;
        if (move.fR === 0 && move.fC === 0) hasMoved.bR_left = true;
        if (move.fR === 0 && move.fC === 7) hasMoved.bR_right = true;

        return undoInfo;
    },

    undoMove(board, undoInfo, hasMoved) {
        board[undoInfo.fR][undoInfo.fC] = undoInfo.piece;
        board[undoInfo.tR][undoInfo.tC] = undoInfo.target;
        if (undoInfo.rookPiece) {
            board[undoInfo.fR][undoInfo.rookF] = undoInfo.rookPiece;
            board[undoInfo.fR][undoInfo.rookT] = '.';
        }
        if (undoInfo.victimPiece) {
            board[undoInfo.victimRow][undoInfo.tC] = undoInfo.victimPiece;
        }
        Object.assign(hasMoved, undoInfo.oldHasMoved);
    }
};
