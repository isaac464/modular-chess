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

        // Try opening book first for hard difficulty
        if (difficulty === 'hard') {
            selectedMove = this.getOpeningMove(moves);
        }

        if (!selectedMove) {
            if (difficulty === 'easy') {
                selectedMove = this.getRandomMove(moves);
            } else if (difficulty === 'medium') {
                selectedMove = this.getGreedyMove(moves);
            } else if (difficulty === 'hard') {
                selectedMove = this.getBestMoveMinimax(moves, 4, color);
            }
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

    getOpeningMove(moves) {
        if (typeof OpeningBook === 'undefined') return null;

        // Strip check/mate indicators from history to match book
        const history = GameLogic.moveLog.map(m => m.replace(/[+#]$/, '')).join(' ');
        const possibleContinuations = OpeningBook[history];

        if (possibleContinuations && possibleContinuations.length > 0) {
            console.log(`Opening book match found for history: "${history}". Options: ${possibleContinuations}`);
            // Shuffle possible continuations to try them randomly
            const shuffled = [...possibleContinuations].sort(() => Math.random() - 0.5);

            for (const chosenNotation of shuffled) {
                // Find which move in 'moves' matches 'chosenNotation'
                for (const move of moves) {
                    const piece = GameLogic.boardState[move.fR][move.fC];
                    const targetPiece = GameLogic.boardState[move.tR][move.tC];

                    const notation = this.getNotationForMove(move, piece, targetPiece);
                    if (notation === chosenNotation) {
                        console.log(`Bot chose opening move: ${notation}`);
                        return move;
                    }
                }
            }
        }
        return null;
    },

    getNotationForMove(move, piece, targetPiece) {
        const files = 'abcdefgh';
        const isPawn = piece[1] === 'P';
        const pieceType = isPawn ? '' : piece[1];

        // Handle En Passant for notation
        const isEnPassant = isPawn && GameLogic.enPassantTarget &&
                           move.tR === GameLogic.enPassantTarget.row &&
                           move.tC === GameLogic.enPassantTarget.col;

        const capture = (targetPiece !== '.' || isEnPassant) ? 'x' : '';
        const toSquare = files[move.tC] + (8 - move.tR);

        let moveNotation = pieceType;
        if (isPawn && capture) {
            moveNotation += files[move.fC]; // e.g., exd4
        }
        moveNotation += capture + toSquare;

        if (piece[1] === 'K' && Math.abs(move.tC - move.fC) === 2) {
            moveNotation = move.tC > move.fC ? 'O-O' : 'O-O-O';
        }

        // If it's a pawn move without capture, it should just be the toSquare (e.g., e4)
        if (isPawn && !capture) {
            moveNotation = toSquare;
        }

        return moveNotation;
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
        let moveValues = [];

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

            moveValues.push({ move, value: boardValue });
        }

        // Sort moves by value descending
        moveValues.sort((a, b) => b.value - a.value);

        // Randomly pick from moves that are close to the best move (within 30 points)
        // This makes the bot less predictable and more "human-like"
        const threshold = 30;
        const bestValue = moveValues[0].value;
        const goodMoves = moveValues.filter(mv => mv.value >= bestValue - threshold);

        return goodMoves[Math.floor(Math.random() * goodMoves.length)].move;
    },

    minimax(depth, board, alpha, beta, color, enPassant, hasMoved) {
        if (depth === 0) {
            return this.quiescenceSearch(board, alpha, beta, color, enPassant, hasMoved);
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

    quiescenceSearch(board, alpha, beta, color, enPassant, hasMoved) {
        let standbyEval = this.evaluateBoard(board, color);
        if (standbyEval >= beta) return beta;
        if (alpha < standbyEval) alpha = standbyEval;

        const moves = GameLogic.getAllValidMoves(color, board, enPassant, hasMoved);
        // Only consider captures (including en passant) in quiescence search
        const captures = moves.filter(move => {
            const isStandardCapture = board[move.tR][move.tC] !== '.';
            const isEnPassant = board[move.fR][move.fC][1] === 'P' && enPassant && move.tR === enPassant.row && move.tC === enPassant.col;
            return isStandardCapture || isEnPassant;
        });
        const sortedCaptures = this.orderMoves(captures, board);

        for (let move of sortedCaptures) {
            const nextEnPassant = (board[move.fR][move.fC][1] === 'P' && Math.abs(move.tR - move.fR) === 2)
                ? { row: (move.fR + move.tR) / 2, col: move.fC } : null;

            const undoInfo = this.simulateMove(move, board, enPassant, hasMoved);
            const evaluation = -this.quiescenceSearch(board, -beta, -alpha, color === 'white' ? 'black' : 'white', nextEnPassant, hasMoved);
            this.undoMove(board, undoInfo, hasMoved);

            if (evaluation >= beta) return beta;
            if (evaluation > alpha) alpha = evaluation;
        }

        return alpha;
    },

    orderMoves(moves, board) {
        return moves.sort((a, b) => {
            const pieceA = board[a.fR][a.fC];
            const targetA = board[a.tR][a.tC];
            const pieceB = board[b.fR][b.fC];
            const targetB = board[b.tR][b.tC];

            let scoreA = 0;
            let scoreB = 0;

            // MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
            if (targetA !== '.') {
                scoreA = 100 * this.pieceValues[targetA[1]] - this.pieceValues[pieceA[1]];
            } else {
                // If not a capture, prefer moving to a better square according to PST
                const colorA = pieceA.startsWith('w') ? 'white' : 'black';
                scoreA = colorA === 'white' ? this.pst[pieceA[1]][a.tR][a.tC] : this.pst[pieceA[1]][7 - a.tR][a.tC];
            }

            if (targetB !== '.') {
                scoreB = 100 * this.pieceValues[targetB[1]] - this.pieceValues[pieceB[1]];
            } else {
                const colorB = pieceB.startsWith('w') ? 'white' : 'black';
                scoreB = colorB === 'white' ? this.pst[pieceB[1]][b.tR][b.tC] : this.pst[pieceB[1]][7 - b.tR][b.tC];
            }

            return scoreB - scoreA;
        });
    },

    evaluateBoard(board, color) {
        let whiteEval = 0;
        let blackEval = 0;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (piece === '.') continue;

                const pieceColor = piece.startsWith('w') ? 'white' : 'black';
                const type = piece[1];
                let value = this.pieceValues[type];

                // PST
                if (pieceColor === 'white') {
                    value += this.pst[type][r][c];
                    whiteEval += value;
                } else {
                    value += this.pst[type][7 - r][c];
                    blackEval += value;
                }
            }
        }

        // Return evaluation from the perspective of 'color'
        const eval = whiteEval - blackEval;
        return color === 'white' ? eval : -eval;
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
