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
        },
        {
            id: 'time-limit',
            name: 'Time Limit',
            description: 'Select time limit per player',
            type: 'select',
            options: [
                { value: 'none', label: 'No Limit' },
                { value: '60', label: '1 Minute' },
                { value: '180', label: '3 Minutes' },
                { value: '300', label: '5 Minutes' },
                { value: '600', label: '10 Minutes' }
            ],
            default: 'none'
        }
    ],
    engineSettings: {
        sandboxMode: false
    }
};
