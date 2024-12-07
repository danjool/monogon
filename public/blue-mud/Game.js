import { AuthManager } from './auth.js';
import { RoomManager } from './room.js';
import { InventoryManager } from './inventory.js';
import { ChatManager } from './chat.js';
import { CommandHandler } from './commands.js';
import { PenniesManager } from './pennies.js';
import { UIManager } from './ui.js';
import { BSKY_SERVICE, RECORD_TYPES } from './config.js';

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
    
                            // await this.purgeOldData(); // Re-enable this to clean up old data format
            
            this.room = new RoomManager(this.agent);
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
    
            this.ui.toggleGameArea(true);
            this.startPolling();
        } catch (error) {
            console.error('Login failed:', error);
            console.error('Error details:', error.response?.data);
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
                    this.room.enterRoom(
                        this.room.currentRoom.owner,
                        this.room.currentRoom.rkey,
                        false
                    ),
                    this.chat.fetchNewMessages(this.room.currentRoom.owner)
                ]);
            }
        }, 5000);
    }

    async purgeOldData() {
        const oldTypes = ['app.mud.room', 'app.mud.inventory'];
        
        console.log('=== Starting Data Purge ===');
        console.log('BSKY_SERVICE:', BSKY_SERVICE);
        console.log('Player DID:', this.playerDid);
        console.log('Auth token:', this.agent.jwt.substring(0, 20) + '...');
        
        for (const type of oldTypes) {
            console.log(`\nPurging type: ${type}`);
            try {
                const url = `${BSKY_SERVICE}/xrpc/com.atproto.repo.listRecords`;
                const params = {
                    repo: this.playerDid,
                    collection: type
                };
                console.log('GET Request:', url);
                console.log('Params:', params);
                
                const response = await axios.get(url, {
                    params,
                    headers: { 
                        Authorization: `Bearer ${this.agent.jwt}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('Response:', response.data);

                for (const record of response.data.records || []) {
                    const deleteUrl = `${BSKY_SERVICE}/xrpc/com.atproto.repo.deleteRecord`;
                    const deleteData = {
                        repo: this.playerDid,
                        collection: type,
                        rkey: record.uri.split('/').pop()
                    };
                    console.log('\nDELETE Request:', deleteUrl);
                    console.log('Data:', deleteData);
                    
                    await axios.post(deleteUrl, deleteData, {
                        headers: { Authorization: `Bearer ${this.agent.jwt}` }
                    });
                }
            } catch (error) {
                console.error(`\nError purging ${type}:`);
                console.error('Status:', error.response?.status);
                console.error('Data:', error.response?.data);
                console.error('Message:', error.message);
            }
        }
    }
}