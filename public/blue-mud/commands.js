import { UIManager } from './ui.js';

export class CommandHandler {
    constructor(room, inventory, chat, ui) {
        this.room = room;
        this.inventory = inventory;
        this.chat = chat;
        this.ui = ui;
    }

    async handleCommand(rawCommand, playerDid) {
        const lowerCommand = rawCommand.toLowerCase();
        
        if (lowerCommand === 'look') {
            this.handleLook();
        }
        else if (lowerCommand.startsWith('go ')) {
            await this.handleGo(lowerCommand.substring(3).trim());
        }
        else if (lowerCommand.startsWith('say ')) {
            await this.handleSay(rawCommand.substring(4), playerDid);
        }
        else if (lowerCommand === 'edit') {
            await this.handleEdit(playerDid);
        }
        else if (lowerCommand.startsWith('take ')) {
            await this.handleTake(rawCommand.substring(5), playerDid);
        }
        else if (lowerCommand.startsWith('drop ')) {
            await this.handleDrop(rawCommand.substring(5), playerDid);
        }
        else {
            this.ui.addMessage('System', 'Unknown command. Try: look, go [exit name], say [message], take [item], drop [item], edit');
        }
    }

    handleLook() {
        const room = this.room.currentRoom;
        this.ui.addMessage('System', `You look around ${room.title}.\n${room.description}`);
    }

    async handleGo(exitName) {
        const exit = this.room.currentRoom.exits.find(e => e.name.toLowerCase() === exitName);
        if (exit) {
            await this.room.enterRoom(exit.did);
        } else {
            this.ui.addMessage('System', `There is no exit named '${exitName}'`);
        }
    }

    async handleSay(message, playerDid) {
        if (message.trim()) {
            await this.chat.sendMessage(this.room.currentRoom.owner, playerDid, message);
            this.ui.addMessage('You', message, 'chat');
        }
    }

    async handleEdit(playerDid) {
        if (this.room.currentRoom.owner !== playerDid) {
            this.ui.addMessage('System', "You can only edit your own room!");
            return;
        }

        const newTitle = prompt('Enter new room title:', this.room.currentRoom.title);
        if (!newTitle) return;
        
        const newDesc = prompt('Enter new room description:', this.room.currentRoom.description);
        if (!newDesc) return;

        const exits = [];
        for (let i = 0; i < 3; i++) {
            const exitName = prompt(`Enter name for exit ${i + 1} (or leave empty to skip):`);
            if (!exitName) continue;
            
            const exitDid = prompt(`Enter DID for exit "${exitName}":`);
            if (!exitDid) continue;
            
            exits.push({ name: exitName, did: exitDid });
        }

        const itemsStr = prompt('Enter items (comma-separated):', 
            (this.room.currentRoom.items || []).join(','));
        const items = itemsStr ? itemsStr.split(',').map(i => i.trim()) : [];

        await this.room.updateRoom(playerDid, room => ({
            ...room,
            title: newTitle,
            description: newDesc,
            exits,
            items
        }));

        await this.room.enterRoom(playerDid);
    }

    async handleTake(item, playerDid) {
        if (this.room.currentRoom.items?.includes(item)) {
            await this.room.updateRoom(this.room.currentRoom.owner, room => {
                room.items = room.items.filter(i => i !== item);
                return room;
            });
            await this.inventory.addItem(item, playerDid);
            this.ui.addMessage('System', `You took ${item}`);
            await this.room.enterRoom(this.room.currentRoom.owner);
        } else {
            this.ui.addMessage('System', `There is no '${item}' here`);
            this.ui.addMessage('System', `Available items: ${this.room.currentRoom.items?.join(', ') || 'none'}`);
        }
    }

    async handleDrop(item, playerDid) {
        if (this.inventory.hasItem(item)) {
            await this.inventory.removeItem(item, playerDid);
            await this.room.updateRoom(this.room.currentRoom.owner, room => {
                if (!room.items) room.items = [];
                room.items.push(item);
                return room;
            });
            this.ui.addMessage('System', `You dropped ${item}`);
            await this.room.enterRoom(this.room.currentRoom.owner);
        } else {
            this.ui.addMessage('System', `You don't have '${item}'`);
            this.ui.addMessage('System', `Your inventory: ${this.inventory.getItems().join(', ') || 'empty'}`);
        }
    }
}