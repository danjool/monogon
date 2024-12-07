import { BSKY_SERVICE, RECORD_TYPES, DIRECTIONS, MAX_ROOMS, MUD_TAGS } from './config.js';

export class RoomManager {
    constructor(agent) {
        this.agent = agent;
        this.currentRoom = null;
        this.rooms = new Map();
    }

    async initialize(playerDid) {
        console.log('Initializing RoomManager');
        try {
            await this.loadAllRooms(playerDid);
            
            // Load last known location
            const lastLocation = await this.getLastLocation(playerDid);
            
            if (lastLocation) {
                await this.enterRoom(lastLocation.owner, lastLocation.rkey);
                return;
            }
            
            // If no last location, handle first room creation
            const validRooms = Array.from(this.rooms.entries())
                .filter(([key, room]) => key && room);
            
            if (validRooms.length === 0) {
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
            } else {
                const [firstRoomKey, firstRoom] = validRooms[0];
                await this.enterRoom(playerDid, firstRoomKey);
                await this.saveLastLocation(playerDid, {owner: playerDid, rkey: firstRoomKey});
            }
        } catch (error) {
            console.error('Initialization failed:', error);
            throw error;
        }
    }

    async loadAllRooms(playerDid) {
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
    
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
            if (response.data.records) {
                console.log('Processing records:', response.data.records.length);
                
                response.data.records.forEach(record => {
                    // Extract rkey from uri as fallback
                    const rkey = record.rkey || record.uri.split('/').pop();
                    
                    if (record.value) {
                        let roomData;
                        // Handle both old and new format
                        if (record.value.mudData) {
                            // Old format
                            roomData = {
                                ...record.value.mudData,
                                rkey,
                                owner: playerDid
                            };
                        } else {
                            // New format
                            roomData = {
                                title: record.value.title || record.value.text.split(':')[1]?.trim() || "Unnamed Room",
                                description: record.value.description || "",
                                exits: record.value.exits || {},
                                items: record.value.items || [],
                                players: record.value.players || [],
                                coordinates: record.value.coordinates || {x: 0, y: 0, z: 0},
                                rkey,
                                owner: playerDid
                            };
                        }
                        
                        // Only store if it's actually a room
                        const isRoom = record.value.tags?.includes(MUD_TAGS.ROOM) || 
                                     record.value.text?.startsWith('MUD Room:');
                        
                        if (isRoom) {
                            console.log('Found valid room:', rkey, roomData);
                            this.rooms.set(rkey, roomData);
                        }
                    }
                });
            }
    
            const roomCount = this.rooms.size;
            console.log(`Loaded ${roomCount} rooms:`, Object.fromEntries(this.rooms));
            return this.rooms;
        } catch (error) {
            console.error('Error loading rooms:', error);
            console.error('Error details:', error.response?.data);
            throw error;
        }
    }
    
    

    async createRoom(playerDid, roomData) {
        if (!roomData.title || !roomData.description) {
            throw new Error('Room must have title and description');
        }
    
        const rkey = `room-${Date.now()}`;
        const record = {
            text: `MUD Room: ${roomData.title}\n\n${roomData.description}`,
            createdAt: new Date().toISOString(),
            tags: [MUD_TAGS.ROOM],
            facets: [],
            langs: ["en"],
            title: roomData.title,
            description: roomData.description,
            exits: roomData.exits || {},
            items: roomData.items || [],
            players: roomData.players || [],
            coordinates: roomData.coordinates || {x: 0, y: 0, z: 0},
            $type: RECORD_TYPES.ROOM
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
            
            // Store in local cache
            this.rooms.set(rkey, {
                ...record,
                rkey: rkey,
                owner: playerDid
            });
            
            console.log('Created room:', rkey, this.rooms.get(rkey));
            return rkey;
        } catch (error) {
            console.error('Error creating room:', error);
            console.error('Error details:', error.response?.data);
            throw error;
        }
    }
    async updateRoom(ownerDid, rkey, roomData) {
        if (!rkey) {
            throw new Error('No rkey provided for update');
        }

        try {
            const record = {
                text: `MUD Room: ${roomData.title}\n\n${roomData.description}`,
                createdAt: new Date().toISOString(),
                tags: [MUD_TAGS.ROOM],
                facets: [],
                langs: ["en"],
                title: roomData.title,
                description: roomData.description,
                exits: roomData.exits || {},
                items: roomData.items || [],
                players: roomData.players || [],
                coordinates: roomData.coordinates || {x: 0, y: 0, z: 0},
                $type: RECORD_TYPES.ROOM
            };

            const response = await axios.post(
                `${BSKY_SERVICE}/xrpc/com.atproto.repo.putRecord`,
                {
                    repo: ownerDid,
                    collection: RECORD_TYPES.ROOM,
                    rkey: rkey,
                    record: record
                },
                { headers: { Authorization: `Bearer ${this.agent.jwt}` } }
            );

            // Verify update was successful
            const verification = await axios.get(
                `${BSKY_SERVICE}/xrpc/com.atproto.repo.getRecord`,
                {
                    params: {
                        repo: ownerDid,
                        collection: RECORD_TYPES.ROOM,
                        rkey: rkey
                    },
                    headers: { Authorization: `Bearer ${this.agent.jwt}` }
                }
            );

            if (!verification.data.value) {
                throw new Error('Room update verification failed');
            }

            // Update local cache
            this.rooms.set(rkey, {
                ...record,
                rkey,
                owner: ownerDid
            });

            // If this is the current room, update it
            if (this.currentRoom?.rkey === rkey) {
                this.currentRoom = this.rooms.get(rkey);
            }

            console.log('Room updated and verified:', rkey);
            return true;
        } catch (error) {
            console.error('Error updating room:', error);
            throw error;
        }
    }

    async enterRoom(ownerDid, rkey, updatePlayers = true) {
        if (!rkey) {
            throw new Error('No rkey provided for room entry');
        }

        try {
            // Update player list in current room
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

            // Enter new room
            const newRoom = this.rooms.get(rkey);
            if (!newRoom) {
                throw new Error(`Room ${rkey} not found`);
            }

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