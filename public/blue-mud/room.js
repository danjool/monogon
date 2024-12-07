import { BSKY_SERVICE, RECORD_TYPES, DIRECTIONS, MAX_ROOMS, MUD_TAGS } from './config.js';

export class RoomManager {
    constructor(agent) {
        this.agent = agent;
        this.currentRoom = null;
        this.rooms = new Map();
    }
    
    async initialize(playerDid) {
        console.log('Initializing RoomManager');
        
        // Try initialization multiple times
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                await this.loadAllRooms(playerDid);
                
                // Get valid rooms
                const validRooms = Array.from(this.rooms.entries())
                    .filter(([key, room]) => key && room);
                
                console.log(`Initialization attempt ${attempt} - Found ${validRooms.length} valid rooms`);
                
                if (validRooms.length === 0) {
                    console.log('Creating first room');
                    const roomData = {
                        title: "Starting Room",
                        description: "Your first room in the world.",
                        exits: {},
                        items: [],
                        players: [],
                        coordinates: {x: 0, y: 0, z: 0}
                    };
                    
                    const rkey = await this.createRoom(playerDid, roomData);
                    console.log('Created first room with key:', rkey);
                    
                    // Reload rooms after creation
                    await this.loadAllRooms(playerDid);
                    
                    if (!this.rooms.has(rkey)) {
                        if (attempt === 3) {
                            throw new Error('Room creation verification failed after multiple attempts');
                        }
                        console.log('Room not found after creation, retrying...');
                        continue;
                    }
                    
                    await this.enterRoom(playerDid, rkey);
                    return;
                } else {
                    const firstRoom = validRooms[0];
                    const firstRoomKey = firstRoom[0];
                    console.log('Entering existing room:', firstRoomKey);
                    await this.enterRoom(playerDid, firstRoomKey);
                    return;
                }
            } catch (error) {
                if (attempt === 3) {
                    console.error('Final initialization attempt failed:', error);
                    throw error;
                }
                console.log(`Attempt ${attempt} failed, retrying...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
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
    
            // Update local cache
            this.rooms.set(rkey, {
                ...record,
                rkey,
                owner: ownerDid
            });
    
            console.log('Room updated:', rkey, record);
        } catch (error) {
            console.error('Error updating room:', error);
            console.error('Error details:', error.response?.data);
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
}