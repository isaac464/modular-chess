/**
 * OpeningBook
 * A dictionary of common chess openings in Standard Algebraic Notation (SAN).
 * The 'hard' bot uses this to ensure variety and theory-based play in the early game.
 */
const OpeningBook = {
    // Each key is a space-separated string of preceding moves.
    // Each value is an array of theoretical continuations.
    "": ["e4", "d4", "Nf3", "c4"],

    // King's Pawn responses
    "e4": ["e5", "c5", "e6", "c6"],
    "e4 e5": ["Nf3", "Nc3", "d4"],
    "e4 e5 Nf3": ["Nc6", "d6", "Nf6"],
    "e4 e5 Nf3 Nc6": ["Bb5", "Bc4", "d4"],
    "e4 e5 Nf3 Nc6 Bb5": ["a6", "Nf6"],
    "e4 e5 Nf3 Nc6 Bc4": ["Bc5", "Nf6"],

    // Sicilian
    "e4 c5": ["Nf3", "Nc3", "d4"],
    "e4 c5 Nf3": ["d6", "e6", "Nc6"],

    // Queen's Pawn responses
    "d4": ["d5", "Nf6"],
    "d4 d5": ["c4"],
    "d4 d5 c4": ["e6", "c6", "dxc4"],
    "d4 Nf6": ["c4", "Nf3", "g3"],

    // English Opening
    "c4": ["e5", "c5", "Nf6"],

    // Reti Opening
    "Nf3": ["d5", "Nf6"]
};
