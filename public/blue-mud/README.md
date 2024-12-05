# Bluesky MUD

A Multi-User Dungeon (MUD) built on Bluesky's AT Protocol. Players can create rooms, navigate between them, chat, and interact with items using their Bluesky identity.

## Features

- Room creation and customization
- Item management (take/drop system)
- Real-time chat
- Named exits (up to 3 per room)
- Inventory system

## Prerequisites

- Bluesky account
- App Password from bsky.social

## Setup

1. Clone repository
2. Start a local web server in project directory
3. Open index.html in browser
4. Log in with Bluesky handle and App Password

## Commands

- `look` - View current room
- `edit` - Modify your room (title, description, exits, items)
- `go [exit name]` - Move to another room
- `say [message]` - Chat in current room
- `take [item]` - Pick up an item
- `drop [item]` - Drop an item from inventory

## Technical Details

- Uses AT Protocol for data storage
- Rooms stored as `app.mud.room` records
- Inventory stored as `app.mud.inventory` records
- Chat stored as `app.mud.chat` records
- Real-time updates via polling

## File Structure

```
blue-mud/
├── index.html    # Main entry point
├── config.js     # Constants and configuration
├── game.js       # Core game orchestration
├── auth.js       # Authentication handling
├── room.js       # Room management
├── inventory.js  # Inventory system
├── chat.js       # Chat functionality
├── commands.js   # Command processing
└── ui.js         # User interface updates
```

## Contributing

### bugs:
    - double stating of things said with 'say' in system chat for the user that said it
    - chat persists forever, should be 'live' chat, any client may delete TTL expired chat records

### improvements:
    get user's name instead of DID in system chat and 'Players here' list
    overhaul ui to be both:
        - more visually appealing and distinct
        - easy for mobile users: 
            - user actions are buttons instead of text input ( desktop users can opt in to buttons)
### ideas?:
    should invites and exits/links to be the same thing, an invite-limiting system?
    result would be realtively planar graph of rooms, slowly creeping out as people invite people to their rooms, no?

Feel free to submit pull requests.

## License

MIT