/**
 * PieceMovement
 * Stateless utility object for validating standard chess piece movement vectors.
 * Does not check for King safety (Check).
 */
const PieceMovement = {
    /**
     * Entry point for piece-specific movement validation.
     */
    validateBasicMove(fR, fC, tR, tC, boardState, enPassantTarget) {
        const piece = boardState[fR][fC];
        if (piece === '.') return false;
        
        const type = piece[1];
        const color = piece.startsWith('w') ? 'white' : 'black';
        const target = boardState[tR][tC];

        switch (type) {
            case 'P': return this.validatePawn(fR, fC, tR, tC, color, target, boardState, enPassantTarget);
            case 'R': return this.validateSliding(fR, fC, tR, tC, boardState, true, false);
            case 'B': return this.validateSliding(fR, fC, tR, tC, boardState, false, true);
            case 'Q': return this.validateSliding(fR, fC, tR, tC, boardState, true, true);
            case 'N': return this.validateKnight(fR, fC, tR, tC);
            case 'K': return this.validateKingSimple(fR, fC, tR, tC);
            default: return false;
        }
    },

    validatePawn(fR, fC, tR, tC, color, target, boardState, enPassantTarget) {
        const dir = color === 'white' ? -1 : 1;
        const rDiff = tR - fR;
        const cDiff = Math.abs(tC - fC);
        
        if (cDiff === 0) {
            if (rDiff === dir && target === '.') return true;
            if (rDiff === 2 * dir && fR === (color === 'white' ? 6 : 1) && boardState[fR + dir][fC] === '.' && target === '.') return true;
        } else if (cDiff === 1 && rDiff === dir) {
            if (target !== '.' || (enPassantTarget && tR === enPassantTarget.row && tC === enPassantTarget.col)) return true;
        }
        return false;
    },

    validateSliding(fR, fC, tR, tC, boardState, orth, diag) {
        const rD = Math.abs(tR - fR), cD = Math.abs(tC - fC);
        if (!((rD === 0 || cD === 0) && orth) && !(rD === cD && diag)) return false;
        const rS = tR === fR ? 0 : (tR > fR ? 1 : -1), cS = tC === fC ? 0 : (tC > fC ? 1 : -1);
        let r = fR + rS, c = fC + cS;
        while (r !== tR || c !== tC) { if (boardState[r][c] !== '.') return false; r += rS; c += cS; }
        return true;
    },

    validateKnight(fR, fC, tR, tC) {
        const rD = Math.abs(tR - fR), cD = Math.abs(tC - fC);
        return (rD === 2 && cD === 1) || (rD === 1 && cD === 2);
    },

    validateKingSimple(fR, fC, tR, tC) {
        return Math.abs(tR - fR) <= 1 && Math.abs(tC - fC) <= 1;
    }
};