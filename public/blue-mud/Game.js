import { AuthManager } from './auth.js';
import { RoomManager } from './room.js';
import { InventoryManager } from './inventory.js';
import { ChatManager } from './chat.js';
import { CommandHandler } from './commands.js';
import { UIManager } from './ui.js';

export class Game {
    constructor() {
        this.ui = new UIManager();
        this.agent = null;
        this.playerDid = null;
    }

    async initialize() {
        this.setupEventListeners();
    }

    async login(identifier, password) {
        try {
            this.agent = await AuthManager.login(identifier, password);
            this.playerDid = this.agent.did;
            
            this.room = new RoomManager(this.agent);
            this.inventory = new InventoryManager(this.agent);
            this.chat = new ChatManager(this.agent);
            this.commands = new CommandHandler(this.room, this.inventory, this.chat, this.ui);
            
            await Promise.all([
                this.room.initialize(this.playerDid),
                this.inventory.initialize(this.playerDid)
            ]);

            this.ui.toggleGameArea(true);
            this.startPolling();
        } catch (error) {
            alert('Login failed: ' + error.message);
        }
    }

    setupEventListeners() {
        document.getElementById('command').addEventListener('keypress', e => {
            if (e.key === 'Enter') this.commands.handleCommand(e.target.value, this.playerDid);
        });
    }

    startPolling() {
        setInterval(async () => {
            if (this.room.currentRoom && this.playerDid) {
                await Promise.all([
                    this.room.enterRoom(this.room.currentRoom.owner, false),
                    this.chat.fetchNewMessages(this.room.currentRoom.owner)
                ]);
            }
        }, 5000);
    }
}
