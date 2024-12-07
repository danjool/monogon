import { UIManager } from './ui.js';
import { DIRECTIONS, PENNY_COST_NEW_ROOM } from './config.js';

    // Helper function to get opposite direction
    function getOppositeDirection(direction) {
        const opposites = {
            'n': 's',
            's': 'n',
            'e': 'w',
            'w': 'e',
            'ne': 'sw',
            'nw': 'se',
            'se': 'nw',
            'sw': 'ne'
        };
        return opposites[direction] || null;
    }
    
    // Helper function to calculate new room coordinates
    function calculateNewCoordinates(currentCoords, direction) {
        const coords = { ...currentCoords };
        switch (direction) {
            case 'n':  coords.y++; break;
            case 's':  coords.y--; break;
            case 'e':  coords.x++; break;
            case 'w':  coords.x--; break;
            case 'ne': coords.x++; coords.y++; break;
            case 'nw': coords.x--; coords.y++; break;
            case 'se': coords.x++; coords.y--; break;
            case 'sw': coords.x--; coords.y--; break;
        }
        return coords;
    }

export class CommandHandler {
    constructor(room, inventory, chat, pennies, ui) {
        this.room = room;
        this.inventory = inventory;
        this.chat = chat;
        this.pennies = pennies;
        this.ui = ui;
    }

    async handleCommand(rawCommand, playerDid) {
        if (!rawCommand) return;
        
        const [command, ...args] = rawCommand.toLowerCase().trim().split(' ');
        
        switch(command) {
            case 'look':
                this.handleLook();
                break;
            case 'go':
                await this.handleGo(args[0], playerDid);
                break;
            case 'say':
                await this.handleSay(rawCommand.substring(4), playerDid);
                break;
            case 'edit':
                await this.handleEdit(playerDid);
                break;
            case 'take':
                await this.handleTake(args.join(' '), playerDid);
                break;
            case 'drop':
                await this.handleDrop(args.join(' '), playerDid);
                break;
            case 'dig':
                await this.handleDig(args[0], playerDid);
                break;
            case 'pennies':
                this.handlePennies();
                break;
            default:
                this.ui.addMessage('System', 'Unknown command. Try: look, go [direction], say [message], take [item], drop [item], dig [direction], edit, pennies');
        }
    }

    handleLook() {
        if (!this.room.currentRoom) {
            this.ui.addMessage('System', 'You are in the void.');
            return;
        }

        const room = this.room.currentRoom;
        this.ui.addMessage('System', `You are in: ${room.title}`);
        this.ui.addMessage('System', room.description);
        
        // Show exits
        const exits = Object.keys(room.exits || {});
        if (exits.length > 0) {
            this.ui.addMessage('System', `Exits: ${exits.join(', ')}`);
        } else {
            this.ui.addMessage('System', 'There are no obvious exits.');
        }
        
        // Show items
        if (room.items && room.items.length > 0) {
            this.ui.addMessage('System', `You see: ${room.items.join(', ')}`);
        }
        
        // Show players
        if (room.players && room.players.length > 0) {
            const otherPlayers = room.players.filter(p => p !== this.room.agent.did);
            if (otherPlayers.length > 0) {
                this.ui.addMessage('System', `Players here: ${otherPlayers.join(', ')}`);
            }
        }
    }

    async handleGo(direction, playerDid) {
        if (!direction) {
            this.ui.addMessage('System', 'Go where? Try: go [direction]');
            return;
        }

        const currentRoom = this.room.currentRoom;
        if (!currentRoom || !currentRoom.exits) {
            this.ui.addMessage('System', 'There are no exits here.');
            return;
        }

        const exit = currentRoom.exits[direction];
        if (!exit) {
            this.ui.addMessage('System', `There is no exit in direction: ${direction}`);
            return;
        }

        try {
            await this.room.enterRoom(exit.owner, exit.rkey);
            this.handleLook();
        } catch (error) {
            this.ui.addMessage('System', `Could not go that way: ${error.message}`);
        }
    }

    async handleSay(message, playerDid) {
        if (!message) {
            this.ui.addMessage('System', 'Say what?');
            return;
        }

        try {
            const chatMessage = await this.chat.sendMessage(
                this.room.currentRoom.owner,
                playerDid,
                message.trim()
            );
            this.ui.addMessage(playerDid, message.trim());
        } catch (error) {
            this.ui.addMessage('System', `Could not send message: ${error.message}`);
        }
    }

    async handleEdit(playerDid) {
        if (!this.room.currentRoom || this.room.currentRoom.owner !== playerDid) {
            this.ui.addMessage('System', 'You can only edit your own rooms!');
            return;
        }

        const title = prompt('Enter new room title:', this.room.currentRoom.title);
        if (!title) return;

        const description = prompt('Enter new room description:', this.room.currentRoom.description);
        if (!description) return;

        try {
            await this.room.updateRoom(playerDid, this.room.currentRoom.rkey, {
                ...this.room.currentRoom,
                title,
                description
            });
            this.handleLook();
        } catch (error) {
            this.ui.addMessage('System', `Could not edit room: ${error.message}`);
        }
    }

    async handleTake(itemName, playerDid) {
        if (!itemName) {
            this.ui.addMessage('System', 'Take what?');
            return;
        }

        const currentRoom = this.room.currentRoom;
        if (!currentRoom || !currentRoom.items) {
            this.ui.addMessage('System', 'Nothing to take here.');
            return;
        }

        if (!currentRoom.items.includes(itemName)) {
            this.ui.addMessage('System', `There is no ${itemName} here.`);
            return;
        }

        try {
            await this.inventory.addItem(itemName, playerDid);
            
            const updatedItems = currentRoom.items.filter(item => item !== itemName);
            await this.room.updateRoom(currentRoom.owner, currentRoom.rkey, {
                ...currentRoom,
                items: updatedItems
            });
            
            this.ui.addMessage('System', `You take the ${itemName}.`);
        } catch (error) {
            this.ui.addMessage('System', `Could not take ${itemName}: ${error.message}`);
        }
    }

    async handleDrop(itemName, playerDid) {
        if (!itemName) {
            this.ui.addMessage('System', 'Drop what?');
            return;
        }

        if (!this.inventory.hasItem(itemName)) {
            this.ui.addMessage('System', `You don't have a ${itemName}.`);
            return;
        }

        const currentRoom = this.room.currentRoom;
        try {
            await this.inventory.removeItem(itemName, playerDid);
            
            const updatedItems = [...(currentRoom.items || []), itemName];
            await this.room.updateRoom(currentRoom.owner, currentRoom.rkey, {
                ...currentRoom,
                items: updatedItems
            });
            
            this.ui.addMessage('System', `You drop the ${itemName}.`);
        } catch (error) {
            this.ui.addMessage('System', `Could not drop ${itemName}: ${error.message}`);
        }
    }

    handlePennies() {
        const amount = this.pennies.getAmount();
        this.ui.addMessage('System', `You have ${amount} ${amount === 1 ? 'penny' : 'pennies'}.`);
    }

    async handleDig(direction, playerDid) {
        // Validate direction
        if (!direction || !DIRECTIONS.includes(direction)) {
            this.ui.addMessage('System', `Invalid direction. Use: ${DIRECTIONS.join(', ')}`);
            return;
        }
    
        // Check room ownership
        if (!this.room.currentRoom || this.room.currentRoom.owner !== playerDid) {
            this.ui.addMessage('System', "You can only dig from your own rooms!");
            return;
        }
    
        // Check penny cost
        if (this.pennies.getAmount() < PENNY_COST_NEW_ROOM) {
            this.ui.addMessage('System', `You need ${PENNY_COST_NEW_ROOM} ${PENNY_COST_NEW_ROOM === 1 ? 'penny' : 'pennies'} to dig a new room`);
            return;
        }
    
        // Get room details from user
        const title = prompt('Enter new room title:');
        if (!title) return;
        
        const description = prompt('Enter new room description:');
        if (!description) return;
    
        try {
            // Create new room
            const newRoomKey = await this.room.createRoom(playerDid, {
                title,
                description,
                exits: {
                    [getOppositeDirection(direction)]: {
                        rkey: this.room.currentRoom.rkey,
                        owner: playerDid
                    }
                },
                items: [],
                players: [],
                coordinates: calculateNewCoordinates(this.room.currentRoom.coordinates, direction)
            });
    
            // Update current room's exits
            const currentRoom = this.room.currentRoom;
            const updatedExits = {
                ...(currentRoom.exits || {}),
                [direction]: {
                    rkey: newRoomKey,
                    owner: playerDid
                }
            };
    
            await this.room.updateRoom(playerDid, currentRoom.rkey, {
                ...currentRoom,
                exits: updatedExits
            });
    
            // Deduct penny cost
            await this.pennies.transfer(PENNY_COST_NEW_ROOM, playerDid, playerDid);
            
            this.ui.addMessage('System', `You dug a new room to the ${direction}`);
            
            // Enter the new room
            await this.room.enterRoom(playerDid, newRoomKey);
            this.handleLook();
        } catch (error) {
            this.ui.addMessage('System', `Failed to dig room: ${error.message}`);
        }
    }

}