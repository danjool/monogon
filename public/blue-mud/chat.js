import { BSKY_SERVICE, RECORD_TYPES } from './config.js';

export class ChatManager {
    constructor(agent) {
        this.agent = agent;
        this.lastMessageTime = {};
    }

    async sendMessage(roomOwner, playerDid, message) {
        const timestamp = Date.now();
        await axios.post(`${BSKY_SERVICE}/xrpc/com.atproto.repo.createRecord`, {
            repo: roomOwner,
            collection: RECORD_TYPES.CHAT,
            rkey: `chat-${timestamp}`,
            record: {
                sender: playerDid,
                message: message,
                timestamp: timestamp,
                $type: RECORD_TYPES.CHAT
            }
        }, {
            headers: { Authorization: `Bearer ${this.agent.jwt}` }
        });
        
        return { timestamp, sender: playerDid, message };
    }

    async fetchNewMessages(roomOwner) {
        const response = await axios.get(
            `${BSKY_SERVICE}/xrpc/com.atproto.repo.listRecords?repo=${roomOwner}&collection=${RECORD_TYPES.CHAT}&limit=50`,
            { headers: { Authorization: `Bearer ${this.agent.jwt}` } }
        );

        const newMessages = [];
        if (response.data.records?.length > 0) {
            response.data.records.forEach(record => {
                const chat = record.value;
                if (chat.timestamp > (this.lastMessageTime[chat.sender] || 0)) {
                    newMessages.push(chat);
                    this.lastMessageTime[chat.sender] = chat.timestamp;
                }
            });
        }
        return newMessages;
    }
}