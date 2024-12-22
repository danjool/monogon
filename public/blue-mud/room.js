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
                // Only skip last-location record
                if (record.rkey === 'last-location') return;
                
                if (record.value.$type === RECORD_TYPES.ROOM) {
                    const roomData = {
                        ...record.value,
                        rkey: record.rkey,
                        owner: playerDid,
                        title: record.value.title || "Unnamed Room",
                        description: record.value.description || "",
                        exits: record.value.exits || {},
                        items: record.value.items || [],
                        players: record.value.players || [],
                        coordinates: record.value.coordinates || {x: 0, y: 0, z: 0}
                    };
                    
                    this.rooms.set(record.rkey, roomData);
                    
                    if (this.mapManager) {
                        this.mapManager.addRoom(record.rkey, roomData);
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
            
            if (this.rooms.size === 0) {
                // Create starting room if user has no existing rooms
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
            } else if (lastLocation?.rkey && this.rooms.has(lastLocation.rkey)) {
                // Enter last known location if available
                console.log('Entering last location:', lastLocation.rkey, this.rooms.has(lastLocation.rkey));
                await this.enterRoom(lastLocation.owner, lastLocation.rkey);
            } else {
                // Fallback to the first available room
                const firstRoom = Array.from(this.rooms.keys())[0];
                if (firstRoom) {
                    console.log('Entering first room:', firstRoom);
                    await this.enterRoom(playerDid, firstRoom);
                } else {
                    throw new Error('No available rooms found');
                }
            }
        } catch (error) {
            console.error('Initialization failed:', error);
            throw error;
        }
    }
    
    async enterRoom(ownerDid, rkey, updatePlayers = true) {
        console.log('Entering room:', rkey);
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
            console.log('Saved last location:', location);
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
            console.log('Got Last location:', response.data.value?.location);
            return response.data.value?.location;
        } catch (error) {
            return null;
        }
    }

    async cleanupDuplicateRooms(playerDid) {
        const rooms = Array.from(this.rooms.entries());
        const duplicates = new Map();
        const toDelete = [];
    
        rooms.forEach(([rkey, room]) => {
            if (room.title === "Starting Room") {
                const timestamp = parseInt(rkey.split('-')[1]);
                if (!duplicates.has(timestamp)) {
                    duplicates.set(timestamp, rkey);
                } else {
                    // Only consider it a duplicate if created in the exact same millisecond
                    toDelete.push(rkey);
                }
            }
        });
    
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