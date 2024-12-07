import { BSKY_SERVICE, RECORD_TYPES } from './config.js';

export class ChatManager {
    constructor(agent) {
        this.agent = agent;
        this.lastMessageTime = {};
    }

    async sendMessage(roomOwner, playerDid, message) {
        const timestamp = Date.now();
        const rkey = `chat-${timestamp}`;
        
        try {
            await axios.post(`${BSKY_SERVICE}/xrpc/com.atproto.repo.createRecord`, {
                repo: roomOwner,
                collection: RECORD_TYPES.CHAT,
                rkey: rkey,
                record: {
                    $type: RECORD_TYPES.CHAT,
                    message: message,
                    sender: playerDid,
                    timestamp: timestamp
                }
            }, {
                headers: { Authorization: `Bearer ${this.agent.jwt}` }
            });
            
            return { timestamp, sender: playerDid, message };
        } catch (error) {
            console.error('Chat send error:', error);
            throw error;
        }
    }

    async fetchNewMessages(roomOwner) {
        try {
            const response = await axios.get(
                `${BSKY_SERVICE}/xrpc/com.atproto.repo.listRecords`,
                {
                    params: {
                        repo: roomOwner,
                        collection: RECORD_TYPES.CHAT,
                        limit: 50
                    },
                    headers: { Authorization: `Bearer ${this.agent.jwt}` }
                }
            );

            const newMessages = [];
            if (response.data.records?.length > 0) {
                response.data.records.forEach(record => {
                    if (record.value.$type === RECORD_TYPES.CHAT) {
                        const chat = record.value;
                        if (chat.timestamp > (this.lastMessageTime[chat.sender] || 0)) {
                            newMessages.push({
                                sender: chat.sender,
                                message: chat.message,
                                timestamp: chat.timestamp
                            });
                            this.lastMessageTime[chat.sender] = chat.timestamp;
                        }
                    }
                });
            }
            return newMessages;
        } catch (error) {
            console.error('Chat fetch error:', error);
            return [];
        }
    }
}