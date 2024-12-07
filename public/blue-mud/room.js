import { BSKY_SERVICE, RECORD_TYPES, RECORD_FORMAT, DIRECTIONS } from './config.js';

export class RoomManager {
    constructor(agent, mapManager) {
        this.agent = agent;
        this.currentRoom = null;
        this.rooms = new Map();
        this.mapManager = mapManager;
    }

    async createRoom(playerDid, roomData) {
        if (!roomData.title || !roomData.description) {
            throw new Error('Room must have title and description');
        }
    
        const rkey = `room-${Date.now()}`;
        const record = {
            $type: RECORD_TYPES.ROOM,
            title: roomData.title,
            description: roomData.description,
            exits: roomData.exits || {},
            items: roomData.items || [],
            players: roomData.players || [],
            coordinates: roomData.coordinates || {x: 0, y: 0, z: 0},
            timestamp: Date.now()
        };
    
        try {
            await axios.post(
                `${BSKY_SERVICE}/xrpc/com.atproto.repo.createRecord`,
                {
                    repo: playerDid,
                    collection: RECORD_TYPES.ROOM,
                    rkey: rkey,
                    record: record
                },
                { headers: { Authorization: `Bearer ${this.agent.jwt}` } }
            );
            
            const roomWithMetadata = {
                ...record,
                rkey,
                owner: playerDid,
                coordinates: record.coordinates
            };
            
            this.rooms.set(rkey, roomWithMetadata);
            
            if (this.mapManager) {
                this.mapManager.addRoom(rkey, roomWithMetadata);
            }
            
            return rkey;
        } catch (error) {
            console.error('Error creating room:', error);
            throw error;
        }
    }

    async loadAllRooms(playerDid) {
        try {
            const response = await axios.get(
                `${BSKY_SERVICE}/xrpc/com.atproto.repo.listRecords`,
                {
                    params: {
                        repo: playerDid,
                        collection: RECORD_TYPES.ROOM,
                        limit: 100
                    },
                    headers: { Authorization: `Bearer ${this.agent.jwt}` }
                }
            );
    
            this.rooms.clear();
            
            response.data.records?.forEach(record => {
                const rkey = record.rkey;
                if (record.value.$type === RECORD_TYPES.ROOM) {
                    const roomData = {
                        ...record.value,
                        rkey,
                        owner: playerDid,
                        title: record.value.title || "Unnamed Room",
                        coordinates: record.value.coordinates || {x: 0, y: 0, z: 0}
                    };
                    
                    this.rooms.set(rkey, roomData);
                    
                    if (this.mapManager) {
                        this.mapManager.addRoom(rkey, roomData);
                    }
                }
            });
    
            return this.rooms;
        } catch (error) {
            console.error('Error loading rooms:', error);
            throw error;
        }
    }

    async updateRoom(ownerDid, rkey, roomData) {
        if (!rkey) throw new Error('No rkey provided for update');

        const record = {
            $type: RECORD_TYPES.ROOM,
            did: ownerDid,
            title: roomData.title,
            description: roomData.description,
            exits: roomData.exits || {},
            items: roomData.items || [],
            players: roomData.players || [],
            coordinates: roomData.coordinates || {x: 0, y: 0, z: 0},
            timestamp: Date.now()
        };

        try {
            await axios.post(
                `${BSKY_SERVICE}/xrpc/com.atproto.repo.putRecord`,
                {
                    repo: ownerDid,
                    collection: RECORD_TYPES.ROOM,
                    rkey: rkey,
                    record: record
                },
                { headers: { Authorization: `Bearer ${this.agent.jwt}` } }
            );

            this.rooms.set(rkey, {
                ...record,
                rkey,
                owner: ownerDid
            });

            if (this.currentRoom?.rkey === rkey) {
                this.currentRoom = this.rooms.get(rkey);
            }

            return true;
        } catch (error) {
            console.error('Error updating room:', error);
            throw error;
        }
    }

    
    async initialize(playerDid) {
        try {
            await this.loadAllRooms(playerDid);
            const lastLocation = await this.getLastLocation(playerDid);
            
            // If no last location or room not found, create starting room
            if (!lastLocation || !this.rooms.has(lastLocation.rkey)) {
                const roomData = {
                    title: "Starting Room",
                    description: "Your first room in the world.",
                    exits: {},
                    items: [],
                    players: [],
                    coordinates: {x: 0, y: 0, z: 0}
                };
                
                const rkey = await this.createRoom(playerDid, roomData);
                await this.enterRoom(playerDid, rkey);
                await this.saveLastLocation(playerDid, {owner: playerDid, rkey});
                return;
            }
            
            await this.enterRoom(lastLocation.owner, lastLocation.rkey);
        } catch (error) {
            console.error('Initialization failed:', error);
            throw error;
        }
    }
    
    async enterRoom(ownerDid, rkey, updatePlayers = true) {
        if (!rkey || !this.rooms.has(rkey)) {
            throw new Error(`Room ${rkey} not found`);
        }
    
        try {
            if (updatePlayers && this.currentRoom) {
                const currentRoom = this.rooms.get(this.currentRoom.rkey);
                if (currentRoom) {
                    const updatedPlayers = currentRoom.players.filter(p => p !== this.agent.did);
                    await this.updateRoom(this.currentRoom.owner, this.currentRoom.rkey, {
                        ...currentRoom,
                        players: updatedPlayers
                    });
                }
            }
    
            const newRoom = this.rooms.get(rkey);
            if (updatePlayers) {
                const updatedRoom = {
                    ...newRoom,
                    players: [...new Set([...newRoom.players, this.agent.did])]
                };
                await this.updateRoom(ownerDid, rkey, updatedRoom);
            }
    
            this.currentRoom = {
                ...newRoom,
                rkey,
                owner: ownerDid
            };
    
            if (this.mapManager) {
                this.mapManager.setCurrentRoom(rkey);
            }
    
            return this.currentRoom;
        } catch (error) {
            console.error('Error entering room:', error);
            throw error;
        }
    }

    async saveLastLocation(playerDid, location) {
        const record = {
            text: "MUD Last Location",
            createdAt: new Date().toISOString(),
            tags: ["mud-location"],
            location: location,
            $type: RECORD_TYPES.ROOM
        };

        try {
            await axios.post(
                `${BSKY_SERVICE}/xrpc/com.atproto.repo.putRecord`,
                {
                    repo: playerDid,
                    collection: RECORD_TYPES.ROOM,
                    rkey: 'last-location',
                    record: record
                },
                { headers: { Authorization: `Bearer ${this.agent.jwt}` } }
            );
        } catch (error) {
            console.error('Error saving location:', error);
        }
    }

    async getLastLocation(playerDid) {
        try {
            const response = await axios.get(
                `${BSKY_SERVICE}/xrpc/com.atproto.repo.getRecord`,
                {
                    params: {
                        repo: playerDid,
                        collection: RECORD_TYPES.ROOM,
                        rkey: 'last-location'
                    },
                    headers: { Authorization: `Bearer ${this.agent.jwt}` }
                }
            );
            return response.data.value?.location;
        } catch (error) {
            return null;
        }
    }

    async cleanupDuplicateRooms(playerDid) {
        const rooms = Array.from(this.rooms.entries());
        const seenTitles = new Map();
        const toDelete = [];

        // Find duplicates, keeping the newest version
        rooms.forEach(([rkey, room]) => {
            if (room.title === "Starting Room") {
                if (!seenTitles.has(room.title)) {
                    seenTitles.set(room.title, {rkey, timestamp: parseInt(rkey.split('-')[1])});
                } else {
                    const existing = seenTitles.get(room.title);
                    if (parseInt(rkey.split('-')[1]) > existing.timestamp) {
                        toDelete.push(existing.rkey);
                        seenTitles.set(room.title, {rkey, timestamp: parseInt(rkey.split('-')[1])});
                    } else {
                        toDelete.push(rkey);
                    }
                }
            }
        });

        // Delete duplicate rooms
        for (const rkey of toDelete) {
            try {
                await axios.post(
                    `${BSKY_SERVICE}/xrpc/com.atproto.repo.deleteRecord`,
                    {
                        repo: playerDid,
                        collection: RECORD_TYPES.ROOM,
                        rkey: rkey
                    },
                    { headers: { Authorization: `Bearer ${this.agent.jwt}` } }
                );
                this.rooms.delete(rkey);
            } catch (error) {
                console.error(`Failed to delete room ${rkey}:`, error);
            }
        }

        return toDelete.length;
    }
}