import { BSKY_SERVICE, RECORD_TYPES } from './config.js';

export class InventoryManager {
    constructor(agent) {
        this.agent = agent;
        this.items = [];
    }

    async initialize(playerDid) {
        try {
            await this.createInventory(playerDid);
        } catch (error) {
            if (error.response?.status !== 500) throw error;
        }
        await this.load(playerDid);
    }

    async createInventory(playerDid) {
        await axios.post(`${BSKY_SERVICE}/xrpc/com.atproto.repo.createRecord`, {
            repo: playerDid,
            collection: RECORD_TYPES.INVENTORY,
            rkey: 'inv1',
            record: {
                items: [],
                $type: RECORD_TYPES.INVENTORY
            }
        }, {
            headers: { Authorization: `Bearer ${this.agent.jwt}` }
        });
    }

    async load(playerDid) {
        const response = await axios.get(
            `${BSKY_SERVICE}/xrpc/com.atproto.repo.listRecords?repo=${playerDid}&collection=${RECORD_TYPES.INVENTORY}`,
            { headers: { Authorization: `Bearer ${this.agent.jwt}` } }
        );

        if (response.data.records?.length > 0) {
            this.items = response.data.records[0].value.items;
            this.updateDisplay();
        }
    }

    async save(playerDid) {
        const records = await axios.get(
            `${BSKY_SERVICE}/xrpc/com.atproto.repo.listRecords?repo=${playerDid}&collection=${RECORD_TYPES.INVENTORY}`,
            { headers: { Authorization: `Bearer ${this.agent.jwt}` } }
        );

        const rkey = records.data.records[0].rkey;
        
        await axios.post(`${BSKY_SERVICE}/xrpc/com.atproto.repo.putRecord`, {
            repo: playerDid,
            collection: RECORD_TYPES.INVENTORY,
            rkey: rkey,
            record: {
                items: this.items,
                $type: RECORD_TYPES.INVENTORY
            }
        }, {
            headers: { Authorization: `Bearer ${this.agent.jwt}` }
        });
        
        this.updateDisplay();
    }

    hasItem(item) {
        return this.items.includes(item);
    }

    async addItem(item, playerDid) {
        this.items.push(item);
        await this.save(playerDid);
    }

    async removeItem(item, playerDid) {
        this.items = this.items.filter(i => i !== item);
        await this.save(playerDid);
    }

    updateDisplay() {
        const inv = document.getElementById('inventoryItems');
        inv.innerHTML = this.items.length ? this.items.join(', ') : 'Empty';
    }

    getItems() {
        return [...this.items];
    }
}