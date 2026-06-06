const ClassicGamemode = {
    name: 'Classic Chess',
    description: 'Play traditional chess with no time limit',
    availableSettings: [
        {
            id: 'auto-flip',
            name: 'Auto-flip Board',
            description: 'Perspective automatically shifts to the current player',
            type: 'checkbox',
            default: false
        },
        {
            id: 'bot-difficulty',
            name: 'Opponent',
            description: 'Select difficulty level',
            type: 'select',
            options: [
                { value: 'none', label: 'Human' },
                { value: 'easy', label: 'Bot (Easy)' },
                { value: 'medium', label: 'Bot (Medium)' },
                { value: 'hard', label: 'Bot (Hard)' }
            ],
            default: 'none'
        }
    ],
    engineSettings: {
        sandboxMode: false
    }
};
