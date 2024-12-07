export const BSKY_SERVICE = 'https://bsky.social';
export const RECORD_TYPES = {
    // Using custom types to avoid feed pollution
    ROOM: 'app.mud.env.room',
    INVENTORY: 'app.mud.player.inventory',
    CHAT: 'app.mud.env.chat',
    PENNIES: 'app.mud.player.pennies',
    CONNECTION: 'app.mud.player.connection'
};

export const RECORD_FORMAT = {
    room: {
        did: '',
        title: '',
        description: '',
        exits: {},
        items: [],
        players: [],
        coordinates: {x: 0, y: 0, z: 0},
        timestamp: 0
    },
    inventory: {
        items: [],
        timestamp: 0
    },
    chat: {
        message: '',
        sender: '',
        timestamp: 0
    },
    pennies: {
        amount: 0,
        timestamp: 0
    }
};

export const DIRECTIONS = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'];
export const MAX_ROOMS = 16;
export const MAX_PENNIES = 32;
export const PENNY_COST_NEW_ROOM = 1;
export const PENNY_COST_CONNECTION = 1;