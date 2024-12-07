import { AuthManager } from './auth.js';
import { RoomManager } from './room.js';
import { InventoryManager } from './inventory.js';
import { ChatManager } from './chat.js';
import { CommandHandler } from './commands.js';
import { PenniesManager } from './pennies.js';
import { UIManager } from './ui.js';
import { MapManager } from './map.js';
import { BSKY_SERVICE, RECORD_TYPES } from './config.js';

export class Game {
    constructor() {
        this.ui = new UIManager();
        this.agent = null;
        this.playerDid = null;
        this.mapManager = new MapManager('map');
    }

    async initialize() {
        this.setupEventListeners();
    }

    async login(identifier, password) {
        try {
            this.agent = await AuthManager.login(identifier, password);
            this.playerDid = this.agent.did;
            // await this.purgeOldData();
            
            this.room = new RoomManager(this.agent, this.mapManager);
            this.inventory = new InventoryManager(this.agent);
            this.chat = new ChatManager(this.agent);
            this.pennies = new PenniesManager(this.agent);
            this.commands = new CommandHandler(
                this.room, 
                this.inventory, 
                this.chat, 
                this.pennies,
                this.ui
            );
            
            await Promise.all([
                this.room.initialize(this.playerDid),
                this.inventory.initialize(this.playerDid),
                this.pennies.initialize(this.playerDid)
            ]);

            await this.room.cleanupDuplicateRooms(this.playerDid);
            this.ui.toggleGameArea(true);
            this.startPolling();
        } catch (error) {
            console.error('Login failed:', error);
            this.ui.addMessage('System', 'Login failed: ' + error.message);
        }
    }

    setupEventListeners() {
        const cmdInput = document.getElementById('command');
        cmdInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') {
                this.commands.handleCommand(e.target.value, this.playerDid);
                e.target.value = '';
            }
        });
    }

    startPolling() {
        setInterval(async () => {
            if (this.room.currentRoom && this.playerDid) {
                await Promise.all([
                    this.room.enterRoom(this.room.currentRoom.owner, this.room.currentRoom.rkey, false),
                    this.chat.fetchNewMessages(this.room.currentRoom.owner)
                ]);
            }
        }, 30 * 1000); // this will poll bsky every 30 seconds
    }

    async purgeOldData() {
        const oldTypes = [
            'app.mud.room',
            'app.mud.inventory',
            'app.mud.chat',
            'app.mud.pennies',
        ];
        
        for (const type of oldTypes) {
            try {
                const records = await this.fetchAllRecords(type);
                for (const record of records) {
                    if (this.isMUDRecord(record)) {
                        await this.deleteRecord(type, record);
                    }
                }
            } catch (error) {
                console.error(`Failed to purge ${type}:`, error.message);
            }
        }
    }

    async fetchAllRecords(type) {
        const response = await axios.get(`${BSKY_SERVICE}/xrpc/com.atproto.repo.listRecords`, {
            params: { repo: this.playerDid, collection: type, limit: 100 },
            headers: { Authorization: `Bearer ${this.agent.jwt}` }
        });
        return response.data.records || [];
    }

    isMUDRecord(record) {
        return record.value.$type?.startsWith('app.mud.') ||
               record.value.text?.startsWith('MUD ');
    }

    async deleteRecord(type, record) {
        await axios.post(`${BSKY_SERVICE}/xrpc/com.atproto.repo.deleteRecord`, {
            repo: this.playerDid,
            collection: type,
            rkey: record.uri.split('/').pop()
        }, {
            headers: { Authorization: `Bearer ${this.agent.jwt}` }
        });
    }
}