export const BSKY_SERVICE = 'https://bsky.social';
export const RECORD_TYPES = {
    ROOM: 'app.bsky.feed.post',  // Using standard post type
    INVENTORY: 'app.bsky.feed.post',
    CHAT: 'app.bsky.feed.post',
    PENNIES: 'app.bsky.feed.post',
    CONNECTION_REQUEST: 'app.bsky.feed.post'
};

// Add tags to differentiate our post types
export const MUD_TAGS = {
    ROOM: 'mud-room',
    INVENTORY: 'mud-inventory',
    CHAT: 'mud-chat',
    PENNIES: 'mud-pennies',
    CONNECTION: 'mud-connection'
};

export const DIRECTIONS = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'];
export const MAX_ROOMS = 16;
export const MAX_PENNIES = 32;
export const PENNY_COST_NEW_ROOM = 1;
export const PENNY_COST_CONNECTION = 1;