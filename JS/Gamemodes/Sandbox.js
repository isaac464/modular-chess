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
        }
    ],
    engineSettings: {
        sandboxMode: true
    },

    // UI Panels
    showSandboxPanel: true
};
