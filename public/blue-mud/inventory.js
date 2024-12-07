import { BSKY_SERVICE, RECORD_TYPES, MUD_TAGS } from './config.js';

export class InventoryManager {
    constructor(agent) {
        this.agent = agent;
        this.items = []; // Initialize empty array
    }

    async initialize(playerDid) {
        try {
            const response = await axios.get(
                `${BSKY_SERVICE}/xrpc/com.atproto.repo.listRecords`,
                {
                    params: {
                        repo: playerDid,
                        collection: RECORD_TYPES.INVENTORY
                    },
                    headers: { Authorization: `Bearer ${this.agent.jwt}` }
                }
            );

            if (!response.data.records || response.data.records.length === 0) {
                await this.createInventory(playerDid);
            } else {
                const record = response.data.records[0];
                if (record.value.tags?.includes(MUD_TAGS.INVENTORY)) {
                    this.items = record.value.items || [];
                }
            }
            this.updateDisplay();
        } catch (error) {
            console.error('Inventory initialization error:', error);
            // Initialize with empty inventory if there's an error
            this.items = [];
            this.updateDisplay();
        }
    }

    async createInventory(playerDid) {
        const record = {
            text: "MUD Inventory",
            createdAt: new Date().toISOString(),
            tags: [MUD_TAGS.INVENTORY],
            items: [],
            $type: RECORD_TYPES.INVENTORY
        };

        await axios.post(
            `${BSKY_SERVICE}/xrpc/com.atproto.repo.createRecord`,
            {
                repo: playerDid,
                collection: RECORD_TYPES.INVENTORY,
                rkey: `inv-${Date.now()}`,
                record: record
            },
            { headers: { Authorization: `Bearer ${this.agent.jwt}` } }
        );
        this.items = [];
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
        const response = await axios.get(
            `${BSKY_SERVICE}/xrpc/com.atproto.repo.listRecords`,
            {
                params: {
                    repo: playerDid,
                    collection: RECORD_TYPES.INVENTORY
                },
                headers: { Authorization: `Bearer ${this.agent.jwt}` }
            }
        );

        const rkey = response.data.records[0].rkey;
        const record = {
            text: "MUD Inventory",
            createdAt: new Date().toISOString(),
            tags: [MUD_TAGS.INVENTORY],
            items: this.items,
            $type: RECORD_TYPES.INVENTORY
        };

        await axios.post(
            `${BSKY_SERVICE}/xrpc/com.atproto.repo.putRecord`,
            {
                repo: playerDid,
                collection: RECORD_TYPES.INVENTORY,
                rkey: rkey,
                record: record
            },
            { headers: { Authorization: `Bearer ${this.agent.jwt}` } }
        );
        
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