import { BSKY_SERVICE, RECORD_TYPES, MAX_PENNIES, MUD_TAGS } from './config.js';

export class PenniesManager {
    constructor(agent) {
        this.agent = agent;
        this.pennies = 0;
        this.currentRkey = null; // Track the current record key
    }

    async initialize(playerDid) {
        try {
            const response = await axios.get(
                `${BSKY_SERVICE}/xrpc/com.atproto.repo.listRecords`,
                {
                    params: {
                        repo: playerDid,
                        collection: RECORD_TYPES.PENNIES
                    },
                    headers: { Authorization: `Bearer ${this.agent.jwt}` }
                }
            );

            if (!response.data.records || response.data.records.length === 0) {
                await this.createPennies(playerDid);
            } else {
                // Find the most recent pennies record
                const record = response.data.records[0];
                if (record.value.tags?.includes(MUD_TAGS.PENNIES)) {
                    this.pennies = record.value.amount || 0;
                    this.currentRkey = record.rkey;
                } else {
                    await this.createPennies(playerDid);
                }
            }
            console.log('Initialized pennies amount:', this.pennies, 'with rkey:', this.currentRkey);
        } catch (error) {
            console.error('Pennies initialization error:', error);
            this.pennies = 0;
        }
    }

    async createPennies(playerDid) {
        console.log('=== Creating Pennies Record ===');
        this.currentRkey = `pennies-${Date.now()}`;
        const record = {
            text: `MUD Pennies: ${MAX_PENNIES}`,
            createdAt: new Date().toISOString(),
            tags: [MUD_TAGS.PENNIES],
            facets: [],
            amount: MAX_PENNIES,
            langs: ["en"],
            $type: RECORD_TYPES.PENNIES
        };

        try {
            await axios.post(
                `${BSKY_SERVICE}/xrpc/com.atproto.repo.createRecord`,
                {
                    repo: playerDid,
                    collection: RECORD_TYPES.PENNIES,
                    rkey: this.currentRkey,
                    record: record
                },
                { headers: { Authorization: `Bearer ${this.agent.jwt}` } }
            );
            this.pennies = MAX_PENNIES;
            console.log('Created pennies record with amount:', MAX_PENNIES);
        } catch (error) {
            console.error('Pennies creation error:', error);
            throw error;
        }
    }

    async save(playerDid) {
        try {
            if (!this.currentRkey) {
                console.error('No rkey available for pennies record');
                return;
            }

            const record = {
                text: `MUD Pennies: ${this.pennies}`,
                createdAt: new Date().toISOString(),
                tags: [MUD_TAGS.PENNIES],
                facets: [],
                amount: Math.min(this.pennies, MAX_PENNIES),
                langs: ["en"],
                $type: RECORD_TYPES.PENNIES
            };

            await axios.post(
                `${BSKY_SERVICE}/xrpc/com.atproto.repo.putRecord`,
                {
                    repo: playerDid,
                    collection: RECORD_TYPES.PENNIES,
                    rkey: this.currentRkey,
                    record: record
                },
                { headers: { Authorization: `Bearer ${this.agent.jwt}` } }
            );
            console.log('Saved pennies amount:', this.pennies);
        } catch (error) {
            console.error('Error saving pennies:', error);
            console.error('Error details:', error.response?.data);
        }
    }

    async transfer(amount, fromDid, toDid) {
        if (this.pennies < amount) {
            return false;
        }
        
        try {
            this.pennies -= amount;
            await this.save(fromDid);

            const toManager = new PenniesManager(this.agent);
            await toManager.initialize(toDid);
            toManager.pennies += amount;
            await toManager.save(toDid);
            
            return true;
        } catch (error) {
            console.error('Transfer error:', error);
            return false;
        }
    }

    getAmount() {
        return this.pennies;
    }
}