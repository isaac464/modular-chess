const SandboxGamemode = {
    name: 'Sandbox',
    description: 'Free placement mode. Create custom positions.',
    availableSettings: [
        {
            id: 'auto-flip',
            name: 'Auto-flip Board',
            description: 'Perspective automatically shifts to the current player',
            type: 'checkbox',
            default: false
        },
        {
            id: 'free-movement',
            name: 'Free Piece Movement',
            description: 'Move any piece anywhere without chess rules',
            type: 'checkbox',
            default: false
        },
        {
            id: 'empty-board',
            name: 'Start with Empty Board',
            description: 'Begin with a completely empty board instead of starting position',
            type: 'checkbox',
            default: false
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
        sandboxMode: true
    },

    // UI Panels
    showSandboxPanel: true
};
