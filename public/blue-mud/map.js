export class MapManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.rooms = new Map();
        this.roomSize = 20;
        this.roomSpacing = 60;
        this.currentRoomKey = null;
        this.padding = 40; // Padding from canvas edges

        // Set up resize observer
        this.resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                this.handleResize(entry.contentRect);
            }
        });
        this.resizeObserver.observe(this.canvas.parentElement);

        // Initial setup
        this.handleResize(this.canvas.parentElement.getBoundingClientRect());

        this.colors = {
            currentRoom: '#4CAF50',
            ownedRoom: '#2196F3',
            otherRoom: '#9E9E9E',
            connection: '#666666',
            text: '#FFFFFF',
            border: '#000000'
        };
    }

    handleResize(rect) {
        // Get container dimensions
        const containerWidth = rect.width;
        const containerHeight = rect.height;

        // Update canvas size
        this.canvas.width = containerWidth - 20; // Account for padding
        this.canvas.height = containerHeight - 40; // Account for header and padding

        // Recalculate center points
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;

        // Update font size based on canvas size
        const minDimension = Math.min(this.canvas.width, this.canvas.height);
        this.ctx.font = `${minDimension * 0.05}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Adjust room size and spacing based on canvas size
        this.roomSize = minDimension * 0.1;
        this.roomSpacing = minDimension * 0.25;

        // Redraw the map
        this.draw();
    }

    // Calculate bounds of all rooms
    calculateBounds() {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        this.rooms.forEach(room => {
            minX = Math.min(minX, room.coordinates.x);
            maxX = Math.max(maxX, room.coordinates.x);
            minY = Math.min(minY, room.coordinates.y);
            maxY = Math.max(maxY, room.coordinates.y);
        });

        return { minX, maxX, minY, maxY };
    }

    // Calculate scale factor to fit all rooms
    calculateScale() {
        if (this.rooms.size === 0) return 1;

        const bounds = this.calculateBounds();
        const width = bounds.maxX - bounds.minX;
        const height = bounds.maxY - bounds.minY;

        if (width === 0 && height === 0) return 1;

        const scaleX = (this.canvas.width - this.padding * 2) / ((width + 1) * this.roomSpacing);
        const scaleY = (this.canvas.height - this.padding * 2) / ((height + 1) * this.roomSpacing);

        return Math.min(scaleX, scaleY, 1); // Never scale up beyond original size
    }

    getRoomPosition(coordinates) {
        const scale = this.calculateScale();
        const bounds = this.calculateBounds();
        const centerOffsetX = (bounds.maxX + bounds.minX) / 2;
        const centerOffsetY = (bounds.maxY + bounds.minY) / 2;

        return {
            x: this.centerX + ((coordinates.x - centerOffsetX) * this.roomSpacing * scale),
            y: this.centerY - ((coordinates.y - centerOffsetY) * this.roomSpacing * scale)
        };
    }

    draw() {
        this.clear();
        
        // Draw connections first
        this.rooms.forEach((room, rkey) => {
            const roomPos = this.getRoomPosition(room.coordinates);
            
            if (room.exits) {
                Object.entries(room.exits).forEach(([direction, exit]) => {
                    const targetRoom = this.rooms.get(exit.rkey);
                    if (targetRoom) {
                        const targetPos = this.getRoomPosition(targetRoom.coordinates);
                        this.drawConnection(roomPos, targetPos);
                    }
                });
            }
        });

        // Draw rooms on top
        this.rooms.forEach((room, rkey) => {
            const pos = this.getRoomPosition(room.coordinates);
            this.drawRoom(pos, room.title, rkey === this.currentRoomKey);
        });
    }

    drawConnection(start, end) {
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = Math.max(1, this.roomSize * 0.05);
        this.ctx.stroke();
    }

    drawRoom(pos, title, isCurrent) {
        const size = this.roomSize;
        
        // Draw room box
        this.ctx.fillStyle = isCurrent ? '#4CAF50' : '#2196F3';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = Math.max(1, size * 0.05);
        
        this.ctx.beginPath();
        this.ctx.rect(
            pos.x - size/2,
            pos.y - size/2,
            size,
            size
        );
        this.ctx.fill();
        this.ctx.stroke();

        // Draw room title
        this.ctx.fillStyle = '#fff';
        // Truncate title based on room size
        const maxLength = Math.floor(size / (this.ctx.measureText('M').width * 1.2));
        const displayTitle = title.length > maxLength ? 
            title.substring(0, maxLength - 2) + '..' : 
            title;
        this.ctx.fillText(displayTitle, pos.x, pos.y);
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    addRoom(rkey, roomData) {
        this.rooms.set(rkey, roomData);
        this.draw();
    }

    setCurrentRoom(rkey) {
        this.currentRoomKey = rkey;
        this.draw();
    }

    destroy() {
        this.resizeObserver.disconnect();
    }
}