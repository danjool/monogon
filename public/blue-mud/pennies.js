import { BSKY_SERVICE, RECORD_TYPES, MAX_PENNIES } from './config.js';

export class PenniesManager {
    constructor(agent) {
        this.agent = agent;
        this.pennies = 0;
        this.currentRkey = null;
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

            if (!response.data.records?.length) {
                await this.createPennies(playerDid);
            } else {
                const record = response.data.records[0];
                if (record.value.$type === RECORD_TYPES.PENNIES) {
                    this.pennies = record.value.amount || 0;
                    this.currentRkey = record.rkey;
                } else {
                    await this.createPennies(playerDid);
                }
            }
        } catch (error) {
            console.error('Pennies initialization error:', error);
            this.pennies = 0;
        }
    }

    async createPennies(playerDid) {
        this.currentRkey = `pennies-${Date.now()}`;
        const record = {
            $type: RECORD_TYPES.PENNIES,
            amount: MAX_PENNIES,
            timestamp: Date.now()
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
        } catch (error) {
            console.error('Pennies creation error:', error);
            throw error;
        }
    }

    async save(playerDid) {
        if (!this.currentRkey) return;

        const record = {
            $type: RECORD_TYPES.PENNIES,
            amount: Math.min(this.pennies, MAX_PENNIES),
            timestamp: Date.now()
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
    }

    async transfer(amount, fromDid, toDid) {
        if (this.pennies < amount) return false;
        
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