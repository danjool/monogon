import { BSKY_SERVICE, RECORD_TYPES } from './config.js';

export class RoomManager {
    constructor(agent) {
        this.agent = agent;
        this.currentRoom = null;
    }

    async initialize(playerDid) {
        try {
            await this.createRoom(playerDid);
        } catch (error) {
            if (error.response?.status === 500) {
                await this.enterRoom(playerDid);
            } else throw error;
        }
    }

    async createRoom(playerDid) {
        await axios.post(`${BSKY_SERVICE}/xrpc/com.atproto.repo.createRecord`, {
            repo: playerDid,
            collection: RECORD_TYPES.ROOM,
            rkey: 'room1',
            record: {
                title: "A New Room",
                description: "An empty room waiting to be described.",
                exits: [],
                items: [],
                players: [],
                owner: playerDid,
                $type: RECORD_TYPES.ROOM
            }
        }, {
            headers: { Authorization: `Bearer ${this.agent.jwt}` }
        });
    }

    async enterRoom(ownerDid, updatePlayers = true) {
        try {
            if (updatePlayers && currentRoom) {
                await updateRoom(currentRoom.owner, room => {
                    room.players = room.players.filter(p => p !== playerDid);
                    return room;
                });
            }

            const response = await axios.get(
                `${BSKY_SERVICE}/xrpc/com.atproto.repo.listRecords?repo=${ownerDid}&collection=${MUD_RECORD_TYPE}`,
                {
                    headers: { 'Authorization': `Bearer ${agent.jwt}` }
                }
            );

            if (response.data.records?.length > 0) {
                const roomRecord = response.data.records[0].value;
                currentRoom = roomRecord;
                
                if (updatePlayers) {
                    await updateRoom(ownerDid, room => {
                        if (!room.players.includes(playerDid)) {
                            room.players.push(playerDid);
                        }
                        return room;
                    });
                }

                document.getElementById('roomTitle').textContent = roomRecord.title;
                document.getElementById('roomDesc').textContent = roomRecord.description;
                
                const exitsList = roomRecord.exits?.map(exit => 
                    `${exit.name} (${exit.did})`
                ).join(', ') || 'none';
                document.getElementById('exits').textContent = `Exits: ${exitsList}`;
                
                document.getElementById('playersHere').textContent = 
                    `Players here: ${roomRecord.players.join(', ') || 'none'}`;
                document.getElementById('itemsHere').textContent = 
                    `Items here: ${roomRecord.items?.join(', ') || 'none'}`;
                
                if (updatePlayers) {
                    addMessage('System', `You entered ${roomRecord.title}`);
                }
            }
        } catch (error) {
            addMessage('System', 'Error fetching room: ' + error.message);
        }
    }

    async updateRoom(ownerDid, updateFn) {
        try {
            const response = await axios.get(
                `${BSKY_SERVICE}/xrpc/com.atproto.repo.listRecords?repo=${ownerDid}&collection=${MUD_RECORD_TYPE}`,
                {
                    headers: { 'Authorization': `Bearer ${agent.jwt}` }
                }
            );

            if (response.data.records?.length > 0) {
                const record = response.data.records[0];
                const updatedRoom = updateFn(record.value);

                await axios.post(`${BSKY_SERVICE}/xrpc/com.atproto.repo.putRecord`, {
                    repo: ownerDid,
                    collection: MUD_RECORD_TYPE,
                    rkey: record.rkey || 'room1',
                    record: {
                        ...updatedRoom,
                        $type: MUD_RECORD_TYPE
                    }
                }, {
                    headers: { 'Authorization': `Bearer ${agent.jwt}` }
                });
            }
        } catch (error) {
            addMessage('System', 'Error updating room: ' + error.message);
        }
    }
}
