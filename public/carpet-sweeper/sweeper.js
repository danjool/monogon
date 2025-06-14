import * as THREE from 'three';

export class Sweeper3D {
    constructor(scene, options = {}, visualsConfig) {
        this.scene = scene;
        this.position = options.position || new THREE.Vector3(0, 0, 0);
        this.scale = visualsConfig ? visualsConfig.minesweeperScale.value : (options.scale || 100);
        this.visualsConfig = visualsConfig;
        this.multiplayerManager = null; // Will be set by main.js
        
        this.dimensions = { x: 10, y: 10, z: 10 };
        this.mineDimensions = { x: 8, y: 8, z: 8 };
        this.grid = [];
        this.cells = [];
        this.waveQueue = [];
        this.gameStatus = 'playing';
        this.firstClick = true;
        this.revealedCount = 0;
        this.totalCells = this.dimensions.x * this.dimensions.y * this.dimensions.z;
        this.mineCount = Math.floor(this.mineDimensions.x * this.mineDimensions.y * this.mineDimensions.z * 0.09);
        
        this.container = new THREE.Group();
        this.container.position.copy(this.position);
        this.container.scale.set(this.scale, this.scale, this.scale);
        this.scene.add(this.container);
        
        // Debug cube for highlighting cells
        this.debugCube = null;
        this.intersectedDebugCube = null;
        this.highlightedCell = null;
        this.lastHitTime = 0;
        this.createDebugCube();
        
        this.init();
    }
    
    setMultiplayerManager(multiplayerManager) {
        this.multiplayerManager = multiplayerManager;
    }
    
    createDebugCube() {
        const cellSize = this.visualsConfig ? this.visualsConfig.cellSize.value : 0.9;
        
        // Create wireframe cube using EdgesGeometry for clean lines
        const geometry = new THREE.BoxGeometry(cellSize, cellSize, cellSize);
        const edges = new THREE.EdgesGeometry(geometry);
        
        // First debug cube (color-coded for number cells)
        const material = new THREE.LineBasicMaterial({ 
            color: 0x00ff00,
            transparent: true,
            opacity: this.visualsConfig ? this.visualsConfig.debugCubeOpacity.value : 0.8
        });
        
        this.debugCube = new THREE.LineSegments(edges, material);
        this.debugCube.visible = false;
        this.container.add(this.debugCube);
        
        // Second debug cube (white for intersected hidden cubes)
        const whiteMaterial = new THREE.LineBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: this.visualsConfig ? this.visualsConfig.debugCubeOpacity.value : 0.8
        });
        
        this.intersectedDebugCube = new THREE.LineSegments(edges.clone(), whiteMaterial);
        this.intersectedDebugCube.visible = false;
        this.container.add(this.intersectedDebugCube);
    }
    
    init() {
        this.createGrid();
        this.placeMines();
        this.calculateNumbers();
    }
    
    createGrid() {
        const offset = {
            x: -(this.dimensions.x - 1) / 2,
            y: -(this.dimensions.y - 1) / 2,
            z: -(this.dimensions.z - 1) / 2
        };
        
        for (let x = 0; x < this.dimensions.x; x++) {
            this.grid[x] = [];
            for (let y = 0; y < this.dimensions.y; y++) {
                this.grid[x][y] = [];
                for (let z = 0; z < this.dimensions.z; z++) {
                    const cell = this.createCell(x, y, z, offset);
                    this.grid[x][y][z] = cell;
                    this.cells.push(cell);
                }
            }
        }
    }
    
    createCell(x, y, z, offset) {
        const cellSize = this.visualsConfig ? this.visualsConfig.cellSize.value : 0.9;
        const geometry = new THREE.BoxGeometry(cellSize, cellSize, cellSize);
        
        // 3D checkerboard pattern: each dimension alternates 0,1, sum gives shade (0-3)
        const xBit = x % 2;
        const yBit = y % 2;
        const zBit = z % 2;
        const shadeIndex = xBit + yBit + zBit;
        const colors = [0x333333, 0x555555, 0x777777, 0x999999]; // Dark to light gray
        const material = new THREE.MeshBasicMaterial({ 
            color: colors[shadeIndex]
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x + offset.x, y + offset.y, z + offset.z);
        this.container.add(mesh);
        
        return {
            x, y, z,
            type: 'empty',
            value: 0,
            state: 'hidden',
            mesh: mesh,
            numberSpheres: [],
            originalMaterial: material,
        };
    }
    
    placeMines() {
        const minePositions = [];
        const offset = Math.floor((this.dimensions.x - this.mineDimensions.x) / 2);
        
        while (minePositions.length < this.mineCount) {
            const x = Math.floor(Math.random() * this.mineDimensions.x) + offset;
            const y = Math.floor(Math.random() * this.mineDimensions.y) + offset;
            const z = Math.floor(Math.random() * this.mineDimensions.z) + offset;
            
            const key = `${x},${y},${z}`;
            if (!minePositions.includes(key)) {
                minePositions.push(key);
                this.grid[x][y][z].type = 'mine';
            }
        }
    }
    
    calculateNumbers() {
        for (let x = 0; x < this.dimensions.x; x++) {
            for (let y = 0; y < this.dimensions.y; y++) {
                for (let z = 0; z < this.dimensions.z; z++) {
                    const cell = this.grid[x][y][z];
                    if (cell.type !== 'mine') {
                        const mineCount = this.countNeighborMines(x, y, z);
                        if (mineCount > 0) {
                            cell.type = 'number';
                            cell.value = mineCount;
                        }
                    }
                }
            }
        }
    }
    
    countNeighborMines(x, y, z) {
        let count = 0;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dz = -1; dz <= 1; dz++) {
                    if (dx === 0 && dy === 0 && dz === 0) continue;
                    const nx = x + dx, ny = y + dy, nz = z + dz;
                    if (this.isValidPosition(nx, ny, nz) && this.grid[nx][ny][nz].type === 'mine') {
                        count++;
                    }
                }
            }
        }
        return count;
    }
    
    getNeighbors(x, y, z) {
        const neighbors = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dz = -1; dz <= 1; dz++) {
                    if (dx === 0 && dy === 0 && dz === 0) continue;
                    const nx = x + dx, ny = y + dy, nz = z + dz;
                    if (this.isValidPosition(nx, ny, nz)) {
                        neighbors.push(this.grid[nx][ny][nz]);
                    }
                }
            }
        }
        return neighbors;
    }
    
    isValidPosition(x, y, z) {
        return x >= 0 && x < this.dimensions.x && 
               y >= 0 && y < this.dimensions.y && 
               z >= 0 && z < this.dimensions.z;
    }
    
    getInteractableMeshes() {
        return this.cells.filter(cell => cell.state === 'hidden' && cell.mesh.visible).map(cell => cell.mesh);
    }
    
    getAllSolidMeshes() {
        // Get all visible meshes for debug raycast (includes hidden cells = solid cubes)
        return this.cells.filter(cell => cell.state === 'hidden' && cell.mesh.visible).map(cell => cell.mesh);
    }
    
    handleClick(mesh) {
        const cell = this.cells.find(c => c.mesh === mesh);
        if (cell) {
            this.clickCell(cell);
        }
    }
    
    // Check for click interaction using raycaster
    checkInteraction(camera, clicked) {
        if (!clicked) return false;
        
        // Create raycaster
        const raycaster = new THREE.Raycaster();
        
        // Cast ray from camera through center of screen
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(camera.quaternion);
        
        raycaster.set(camera.position, direction);
        
        // Check intersection with minesweeper cells
        const cells = this.getInteractableMeshes();
        const intersects = raycaster.intersectObjects(cells);
        
        if (intersects.length > 0) {
            const clickedMesh = intersects[0].object;
            const cell = this.cells.find(c => c.mesh === clickedMesh);
            
            if (cell) {
                if (this.multiplayerManager && this.multiplayerManager.isMultiplayerActive()) {
                    // Send to server for authoritative handling
                    this.multiplayerManager.sendMineClick(cell.x, cell.y, cell.z);
                } else {
                    // Handle locally for single player
                    this.handleClick(clickedMesh);
                }
                return true;
            }
        }
        
        return false;
    }
    
    updateDebugCube(camera) {
        let hasHit = false;
        
        if (!this.visualsConfig || !this.visualsConfig.showDebugCube.value) {
            this.debugCube.visible = false;
            // Still perform raycast for crosshair even if debug cube is disabled
        } else {
        
        }
        
        // Create raycaster (for both debug cube and crosshair hit detection)
        const raycaster = new THREE.Raycaster();
        
        // Cast ray from camera through center of screen
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(camera.quaternion);
        raycaster.set(camera.position, direction);
        
        // Check intersection with all solid cubes
        const solidMeshes = this.getAllSolidMeshes();
        const intersects = raycaster.intersectObjects(solidMeshes);
        
        if (intersects.length > 0) {
            hasHit = true;
            this.lastHitTime = Date.now();
            
            const nearestIntersect = intersects[0];
            const intersectedMesh = nearestIntersect.object;
            const intersectedCell = this.cells.find(c => c.mesh === intersectedMesh);
            
            if (intersectedCell) {
                // Show white debug cube around the intersected hidden cube
                this.intersectedDebugCube.position.copy(intersectedCell.mesh.position);
                this.intersectedDebugCube.visible = true;
                this.intersectedDebugCube.material.opacity = this.visualsConfig.debugCubeOpacity.value;
                // Calculate the direction from intersection point to camera
                const intersectionPoint = nearestIntersect.point;
                const rayDirection = direction.clone();
                
                // Find the face normal of the intersected cube face
                const intersectionNormal = nearestIntersect.face.normal.clone();
                intersectionNormal.transformDirection(intersectedMesh.matrixWorld);
                
                // Get the intersected cell's grid coordinates
                const intersectedGridX = intersectedCell.x;
                const intersectedGridY = intersectedCell.y;
                const intersectedGridZ = intersectedCell.z;
                
                // Calculate which face was hit by using the intersection normal
                const faceNormal = nearestIntersect.face.normal.clone();
                faceNormal.transformDirection(intersectedMesh.matrixWorld);
                faceNormal.normalize();
                
                // Determine adjacent cell coordinates by moving one cell in the direction of the face normal (toward camera)
                const adjacentGridX = intersectedGridX + Math.round(faceNormal.x);
                const adjacentGridY = intersectedGridY + Math.round(faceNormal.y);
                const adjacentGridZ = intersectedGridZ + Math.round(faceNormal.z);
                
                // Convert grid coordinates back to local position
                const offset = {
                    x: -(this.dimensions.x - 1) / 2,
                    y: -(this.dimensions.y - 1) / 2,
                    z: -(this.dimensions.z - 1) / 2
                };
                
                const gridPos = new THREE.Vector3(
                    adjacentGridX + offset.x,
                    adjacentGridY + offset.y,
                    adjacentGridZ + offset.z
                );
                
                const cellX = adjacentGridX;
                const cellY = adjacentGridY;
                const cellZ = adjacentGridZ;
                
                // Check if the adjacent cell is valid and is a number cell
                if (this.isValidPosition(cellX, cellY, cellZ)) {
                    const adjacentCell = this.grid[cellX][cellY][cellZ];
                    
                    // Only show debug cube on number cells
                    if (adjacentCell && adjacentCell.type === 'number') {
                        // Color scheme matching the number spheres
                        const colors = [
                            0x0000ff, 0x00ff00, 0xff0000, 0xff00ff,
                            0xffff00, 0x00ffff, 0xff8000, 0x8000ff
                        ];
                        
                        const numberColor = colors[adjacentCell.value - 1] || 0x00ff00;
                        
                        // Update debug cube color and position
                        this.debugCube.material.color.setHex(numberColor);
                        this.debugCube.position.copy(gridPos);
                        this.debugCube.visible = true;
                        
                        // Update opacity from config
                        this.debugCube.material.opacity = this.visualsConfig.debugCubeOpacity.value;
                        
                        // Highlight the number cell itself if it's revealed
                        if (adjacentCell.state === 'revealed' && adjacentCell.mesh.visible === false) {
                            // For revealed number cells, temporarily show a colored highlight
                            // We'll need to store the highlighted cell to restore it later
                            this.highlightedCell = adjacentCell;
                        }
                        
                        return hasHit;
                    }
                }
            }
        }
        
        // Hide debug cubes if no valid target found
        this.debugCube.visible = false;
        this.intersectedDebugCube.visible = false;
        this.highlightedCell = null;
        
        return hasHit;
    }
    
    // Handle network-received mine reveals
    handleNetworkReveal(data) {
        console.log('Network mine reveal:', data);
        
        // Update game status
        this.gameStatus = data.gameStatus;
        
        // Process all newly revealed cells
        if (data.revealedCells) {
            data.revealedCells.forEach(cellData => {
                const cell = this.grid[cellData.x][cellData.y][cellData.z];
                if (cell) {
                    this.revealCellVisually(cell, cellData);
                }
            });
        }
        
        // Process auto-revealed mines from server
        if (data.autoRevealedMines) {
            data.autoRevealedMines.forEach(mineData => {
                const cell = this.grid[mineData.x][mineData.y][mineData.z];
                if (cell) {
                    this.revealCellVisually(cell, mineData);
                }
            });
        }
        
        // Process ball attractions from server
        if (data.ballAttractions) {
            data.ballAttractions.forEach(attraction => {
                const numberCell = this.grid[attraction.numberCell.x][attraction.numberCell.y][attraction.numberCell.z];
                if (numberCell && numberCell.numberSpheres.length > 0) {
                    // Create ball-mine pairs using server data
                    const targetCells = attraction.targetCells.map(pos => this.grid[pos.x][pos.y][pos.z]);
                    const ballMinePairs = this.createBallMinePairs(numberCell.numberSpheres, targetCells);
                    
                    ballMinePairs.forEach(pair => {
                        const sphere = pair.ball;
                        const targetCell = pair.neighbor;
                        const cellPos = numberCell.mesh.position;
                        const targetPos = targetCell.mesh.position;
                        
                        const direction = targetPos.clone().sub(cellPos).normalize();
                        const attractionTarget = cellPos.clone().add(direction.multiplyScalar(0.4));
                        
                        sphere.userData.attracted = true;
                        sphere.userData.targetMine = targetCell;
                        sphere.userData.attractionTarget = attractionTarget;
                    });
                }
            });
        }
        
        // Process dissolved mines from server
        if (data.dissolvedMines) {
            data.dissolvedMines.forEach(minePos => {
                const cell = this.grid[minePos.x][minePos.y][minePos.z];
                if (cell) {
                    cell.mesh.visible = false;
                    cell.state = 'dissolved';
                }
            });
        }
        
        // Process reduced number cells from server
        if (data.reducedNumberCells) {
            data.reducedNumberCells.forEach(reduction => {
                const cell = this.grid[reduction.x][reduction.y][reduction.z];
                if (cell && cell.numberSpheres.length > 0) {
                    // Remove balls to match new value
                    while (cell.numberSpheres.length > reduction.newValue) {
                        const ballToRemove = cell.numberSpheres.pop();
                        this.container.remove(ballToRemove);
                    }
                    cell.value = reduction.newValue;
                }
            });
        }
    }
    
    // Handle network game reset
    handleNetworkReset(data) {
        console.log('Network game reset');
        this.reset();
        this.gameStatus = data.gameStatus;
        
        // Sync with server's new grid state
        if (data.grid) {
            this.syncNetworkState({ grid: data.grid, gameStatus: data.gameStatus });
        }
    }
    
    // Sync state for late joiners
    syncNetworkState(networkState) {
        console.log('Syncing minesweeper state for late joiner');
        
        if (!networkState.grid) return;
        
        // Sync game status
        this.gameStatus = networkState.gameStatus;
        
        // Reveal all cells that should be revealed
        for (let x = 0; x < this.dimensions.x; x++) {
            for (let y = 0; y < this.dimensions.y; y++) {
                for (let z = 0; z < this.dimensions.z; z++) {
                    const serverCell = networkState.grid[x][y][z];
                    const localCell = this.grid[x][y][z];
                    
                    if (serverCell && localCell && serverCell.state === 'revealed' && localCell.state === 'hidden') {
                        this.revealCellVisually(localCell, serverCell);
                    }
                    
                    // Handle dissolved mines from server state
                    if (serverCell && localCell && serverCell.state === 'dissolved' && localCell.state === 'hidden') {
                        localCell.state = 'dissolved';
                        localCell.mesh.visible = false;
                    }
                }
            }
        }
    }
    
    // Reveal cell visually (used by network updates)
    revealCellVisually(cell, cellData) {
        if (cell.state === 'revealed') return;
        
        cell.state = 'revealed';
        cell.type = cellData.type;
        cell.value = cellData.value;
        this.revealedCount++;
        
        // Update visual appearance
        if (cellData.type === 'mine') {
            cell.mesh.material = new THREE.MeshBasicMaterial({ 
                color: 0xff0000
            });
            } else {
            // Hide the cell completely instead of making it transparent
            cell.mesh.visible = false;
            
            if (cellData.type === 'number') {
                this.createNumberSpheres(cell);
            }
        }
    }
    
    clickCell(cell) {
        if (this.gameStatus !== 'playing' || cell.state !== 'hidden') return;
        
        if (this.firstClick) {
            this.firstClick = false;
            if (cell.type === 'mine') {
                this.relocateMine(cell);
                this.calculateNumbers();
            }
        }
        
        if (cell.type === 'mine') {
            this.gameOver();
            return;
        }
        
        this.waveQueue = [cell];
        this.processWave();
    }
    
    relocateMine(mineCell) {
        mineCell.type = 'empty';
        mineCell.value = 0;
        
        const safeCells = this.cells.filter(cell => 
            cell.type === 'empty' && 
            cell.state === 'hidden' &&
            Math.abs(cell.x - mineCell.x) > 1 ||
            Math.abs(cell.y - mineCell.y) > 1 ||
            Math.abs(cell.z - mineCell.z) > 1
        );
        
        if (safeCells.length > 0) {
            const newMineCell = safeCells[Math.floor(Math.random() * safeCells.length)];
            newMineCell.type = 'mine';
        }
    }
    
    processWave() {
        if (this.waveQueue.length === 0) {
            this.checkAutoMineReveal();
            this.checkMineDissolution();
            this.checkWin();
            return;
        }
        
        const currentWave = [...this.waveQueue];
        this.waveQueue = [];
        
        for (const cell of currentWave) {
            this.revealCell(cell);
        }
        
        setTimeout(() => {
            this.processWave();
        }, 250);
    }
    
    revealCell(cell) {
        if (cell.state !== 'hidden') return;
        
        cell.state = 'revealed';
        this.revealedCount++;
        
// Hide the cell instead of making it transparent
        cell.mesh.visible = false;
        
        if (cell.type === 'number') {
            this.createNumberSpheres(cell);
        } else if (cell.type === 'empty') {
            const neighbors = this.getNeighbors(cell.x, cell.y, cell.z);
            for (const neighbor of neighbors) {
                if (neighbor.state === 'hidden' && neighbor.type === 'empty') {
                    if (!this.waveQueue.includes(neighbor)) {
                        this.waveQueue.push(neighbor);
                    }
                }
            }
        }
        
        if (cell.type === 'empty') {
            const neighbors = this.getNeighbors(cell.x, cell.y, cell.z);
            for (const neighbor of neighbors) {
                if (neighbor.state === 'hidden' && neighbor.type === 'number') {
                    if (!this.waveQueue.includes(neighbor)) {
                        this.waveQueue.push(neighbor);
                    }
                }
            }
        }
    }
    
    createNumberSpheres(cell) {
        const colors = [
            0x0000ff, 0x00ff00, 0xff0000, 0xff00ff,
            0xffff00, 0x00ffff, 0xff8000, 0x8000ff
        ];
        
        const sphereRadius = this.visualsConfig ? this.visualsConfig.sphereRadius.value : 0.1;
        const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 8, 6);
        
        for (let i = 0; i < cell.value; i++) {
            const sphereMaterial = new THREE.MeshBasicMaterial({ 
                color: colors[cell.value - 1]
            });
            
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphere.position.copy(cell.mesh.position);
            sphere.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 0.4,
                (Math.random() - 0.5) * 0.4,
                (Math.random() - 0.5) * 0.4
            ));
            
            sphere.userData = {
                basePos: sphere.position.clone(),
                floatOffset: Math.random() * Math.PI * 2,
                cell: cell,
                attracted: false,
                targetMine: null,
                attractionTarget: null
            };
            
            this.container.add(sphere);
            cell.numberSpheres.push(sphere);
        }
    }
    
    checkAutoMineReveal() {
        const mineCells = this.cells.filter(cell => cell.type === 'mine' && cell.state === 'hidden');
        
        for (const mineCell of mineCells) {
            const neighbors = this.getNeighbors(mineCell.x, mineCell.y, mineCell.z);
            const hiddenNeighbors = neighbors.filter(n => n.state === 'hidden');
            
            if (hiddenNeighbors.length === 0) {
                mineCell.state = 'revealed';
                mineCell.mesh.material = new THREE.MeshBasicMaterial({ 
                    color: 0xff0000
                });
                this.revealedCount++;
            }
        }
        
        const numberCells = this.cells.filter(cell => 
            cell.type === 'number' && 
            cell.state === 'revealed' &&
            cell.numberSpheres.length > 0
        );
        
        for (const numberCell of numberCells) {
            const neighbors = this.getNeighbors(numberCell.x, numberCell.y, numberCell.z);
            const hiddenNeighbors = neighbors.filter(n => n.state === 'hidden');
            
            // Trigger ball attraction when hidden neighbors match the number value
            if (hiddenNeighbors.length === numberCell.value) {
                const ballMinePairs = this.createBallMinePairs(numberCell.numberSpheres, hiddenNeighbors);
                
                ballMinePairs.forEach(pair => {
                    const sphere = pair.ball;
                    const targetNeighbor = pair.neighbor;
                    const cellPos = numberCell.mesh.position;
                    const neighborPos = targetNeighbor.mesh.position;
                    
                    const direction = neighborPos.clone().sub(cellPos).normalize();
                    const targetPos = cellPos.clone().add(direction.multiplyScalar(0.4));
                    
                    sphere.userData.attracted = true;
                    sphere.userData.targetMine = targetNeighbor;
                    sphere.userData.attractionTarget = targetPos;
                });
            }
        }
    }
    
    gameOver() {
        this.gameStatus = 'lost';
        
        const mines = this.cells.filter(cell => cell.type === 'mine');
        for (const mine of mines) {
            mine.mesh.material = new THREE.MeshBasicMaterial({ 
                color: 0xff0000
            });
        }
    }
    
    checkMineDissolution() {
        const revealedMines = this.cells.filter(cell => 
            cell.type === 'mine' && cell.state === 'revealed'
        );
        
        for (const mine of revealedMines) {
            const neighbors = this.getNeighbors(mine.x, mine.y, mine.z);
            const hiddenNeighbors = neighbors.filter(n => n.state === 'hidden');
            
            if (hiddenNeighbors.length === 0) {
                this.dissolveMine(mine);
            }
        }
    }
    
    dissolveMine(mine) {
        // Hide mine mesh completely
        mine.mesh.visible = false;
        mine.state = 'dissolved';
        
        // Update neighboring number cells
        const neighbors = this.getNeighbors(mine.x, mine.y, mine.z);
        for (const neighbor of neighbors) {
            if (neighbor.type === 'number' && neighbor.state === 'revealed') {
                this.reduceNumberCell(neighbor);
            }
        }
    }
    
    reduceNumberCell(numberCell) {
        if (numberCell.value > 0) {
            numberCell.value--;
            
            // Remove one ball (last one)
            if (numberCell.numberSpheres.length > 0) {
                const ballToRemove = numberCell.numberSpheres.pop();
                this.container.remove(ballToRemove);
            }
            
            // If value reaches 0, hide all remaining balls
            if (numberCell.value === 0) {
                numberCell.numberSpheres.forEach(ball => {
                    this.container.remove(ball);
                });
                numberCell.numberSpheres = [];
            }
        }
    }
    
    createBallMinePairs(balls, neighbors) {
        const pairs = [];
        const ballsCopy = [...balls];
        const neighborsCopy = [...neighbors];
        
        // Distance-based pairing: assign each ball to nearest neighbor
        for (let i = 0; i < Math.min(balls.length, neighbors.length); i++) {
            let minDistance = Infinity;
            let bestBallIndex = 0;
            let bestNeighborIndex = 0;
            
            for (let b = 0; b < ballsCopy.length; b++) {
                for (let n = 0; n < neighborsCopy.length; n++) {
                    const ball = ballsCopy[b];
                    const neighbor = neighborsCopy[n];
                    const distance = ball.position.distanceTo(neighbor.mesh.position);
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                        bestBallIndex = b;
                        bestNeighborIndex = n;
                    }
                }
            }
            
            pairs.push({
                ball: ballsCopy[bestBallIndex],
                neighbor: neighborsCopy[bestNeighborIndex]
            });
            
            // Remove used ball and neighbor from consideration
            ballsCopy.splice(bestBallIndex, 1);
            neighborsCopy.splice(bestNeighborIndex, 1);
        }
        
        return pairs;
    }
    
    checkWin() {
        const hiddenCells = this.cells.filter(cell => cell.state === 'hidden');
        const hiddenMines = hiddenCells.filter(cell => cell.type === 'mine');
        
        if (hiddenCells.length === hiddenMines.length) {
            this.gameStatus = 'won';
        }
    }
    
    reset() {
        // Clear container
        while(this.container.children.length > 0) {
            this.container.remove(this.container.children[0]);
        }
        
        // Reset state
        this.grid = [];
        this.cells = [];
        this.waveQueue = [];
        this.gameStatus = 'playing';
        this.firstClick = true;
        this.revealedCount = 0;
        
        // Recreate debug cubes
        this.debugCube = null;
        this.intersectedDebugCube = null;
        this.highlightedCell = null;
        this.createDebugCube();
        
        // Recreate game
        this.init();
    }
    
    update(deltaTime, camera = null) {
        // Animate floating spheres
        const time = Date.now() * 0.001;
        for (const cell of this.cells) {
            for (const sphere of cell.numberSpheres) {
                if (sphere.userData.attracted && sphere.userData.attractionTarget) {
                    const target = sphere.userData.attractionTarget;
                    const current = sphere.position;
                    const distance = current.distanceTo(target);
                    
                    if (distance > 0.05) {
                        const attractionSpeed = this.visualsConfig ? this.visualsConfig.attractionSpeed.value : 0.03;
                        const direction = target.clone().sub(current).normalize();
                        sphere.position.add(direction.multiplyScalar(attractionSpeed));
                    }
                } else {
                    const floatAmplitude = this.visualsConfig ? this.visualsConfig.floatAmplitude.value : 0.05;
                    sphere.position.y = sphere.userData.basePos.y + Math.sin(time * 2 + sphere.userData.floatOffset) * floatAmplitude;
                    sphere.position.x = sphere.userData.basePos.x + Math.cos(time * 1.5 + sphere.userData.floatOffset) * (floatAmplitude * 0.4);
                }
            }
        }
        
        // Update debug cube position if camera is provided and return hit status
        let hasHit = false;
        if (camera) {
            hasHit = this.updateDebugCube(camera);
        }
        
        return hasHit;
        
        // Handle live config updates for debug cubes
        if (this.debugCube && this.visualsConfig) {
            this.debugCube.material.opacity = this.visualsConfig.debugCubeOpacity.value;
        }
        if (this.intersectedDebugCube && this.visualsConfig) {
            this.intersectedDebugCube.material.opacity = this.visualsConfig.debugCubeOpacity.value;
        }
    }
}