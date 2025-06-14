// Carpet Sweeper Socket.IO Module
// Extracted from public/carpet-sweeper/server.js for integration with main app

// Security tracking
const ipConnections = new Map(); // IP -> connection count
const socketMessages = new Map(); // socketId -> { count, windowStart }

// Security validation functions
function validateCoordinates(x, y, z) {
  return Number.isInteger(x) && x >= 0 &&
         Number.isInteger(y) && y >= 0 &&
         Number.isInteger(z) && z >= 0;
}

function validatePosition(position) {
  return position && 
         typeof position.x === 'number' && 
         typeof position.y === 'number' && 
         typeof position.z === 'number' &&
         Math.abs(position.x) < 1000000 &&
         Math.abs(position.y) < 1000000 &&
         Math.abs(position.z) < 1000000;
}

function validateOrientation(orientation) {
  return orientation &&
         typeof orientation.pitch === 'number' &&
         typeof orientation.roll === 'number' &&
         orientation.forward && typeof orientation.forward.x === 'number' &&
         orientation.forward && typeof orientation.forward.y === 'number' &&
         orientation.forward && typeof orientation.forward.z === 'number' &&
         orientation.right && typeof orientation.right.x === 'number' &&
         orientation.right && typeof orientation.right.y === 'number' &&
         orientation.right && typeof orientation.right.z === 'number';
}

function checkSocketRateLimit(socketId) {
  const now = Date.now();
  const maxMessages = 30; // messages per second
  const windowMs = 1000; // 1 second
  
  const messageData = socketMessages.get(socketId) || { count: 0, windowStart: now };
  
  // Reset window if time has passed
  if (now - messageData.windowStart > windowMs) {
    messageData.count = 0;
    messageData.windowStart = now;
  }
  
  messageData.count++;
  socketMessages.set(socketId, messageData);
  
  return messageData.count <= maxMessages;
}

// Generate playful hacker names
const hackerNames = [
  'CyberPilot', 'CodeRunner', 'PixelHawk', 'ByteRider', 'NetGlider',
  'DataDrifter', 'LogicLancer', 'CloudSurfer', 'BinaryBird', 'QuantumFlyer',
  'CryptoWing', 'AlgoAce', 'ScriptSoar', 'HashHawk', 'LoopLegend',
  'ArrayAngel', 'FunctionFalcon', 'VariableViper', 'ClassCruiser', 'MethodMaverick'
];

function generatePlayerName() {
  const name = hackerNames[Math.floor(Math.random() * hackerNames.length)];
  const number = Math.floor(Math.random() * 1000);
  return `${name}${number}`;
}

// Game state
const players = new Map();
let minesweeperState = {
  grid: null,
  gameStatus: 'playing',
  resetTimeout: null
};

// Initialize 3D minesweeper grid (simple version)
function initializeMinesweeper() {
  const dimensions = { x: 10, y: 10, z: 10 };
  const grid = [];
  
  // Create grid
  for (let x = 0; x < dimensions.x; x++) {
    grid[x] = [];
    for (let y = 0; y < dimensions.y; y++) {
      grid[x][y] = [];
      for (let z = 0; z < dimensions.z; z++) {
        grid[x][y][z] = {
          type: 'empty',
          value: 0,
          state: 'hidden'
        };
      }
    }
  }
  
  // Place mines (15% density in center 8x8x8)
  const mineCount = Math.floor(8 * 8 * 8 * 0.04);
  const minePositions = [];
  
  while (minePositions.length < mineCount) {
    const x = Math.floor(Math.random() * 6) + 2; // 1-8 (center area)
    const y = Math.floor(Math.random() * 6) + 2;
    const z = Math.floor(Math.random() * 6) + 2;
    const key = `${x},${y},${z}`;
    
    if (!minePositions.includes(key)) {
      minePositions.push(key);
      grid[x][y][z].type = 'mine';
    }
  }
  
  // Calculate numbers
  for (let x = 0; x < dimensions.x; x++) {
    for (let y = 0; y < dimensions.y; y++) {
      for (let z = 0; z < dimensions.z; z++) {
        if (grid[x][y][z].type !== 'mine') {
          let count = 0;
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              for (let dz = -1; dz <= 1; dz++) {
                if (dx === 0 && dy === 0 && dz === 0) continue;
                const nx = x + dx, ny = y + dy, nz = z + dz;
                if (nx >= 0 && nx < dimensions.x && 
                    ny >= 0 && ny < dimensions.y && 
                    nz >= 0 && nz < dimensions.z &&
                    grid[nx][ny][nz].type === 'mine') {
                  count++;
                }
              }
            }
          }
          if (count > 0) {
            grid[x][y][z].type = 'number';
            grid[x][y][z].value = count;
          }
        }
      }
    }
  }
  
  minesweeperState.grid = grid;
  minesweeperState.gameStatus = 'playing';
}

// Helper functions for advanced minesweeper logic
function getNeighbors(x, y, z) {
  const neighbors = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dy === 0 && dz === 0) continue;
        const nx = x + dx, ny = y + dy, nz = z + dz;
        if (nx >= 0 && nx < 10 && ny >= 0 && ny < 10 && nz >= 0 && nz < 10) {
          neighbors.push({ x: nx, y: ny, z: nz, cell: minesweeperState.grid[nx][ny][nz] });
        }
      }
    }
  }
  return neighbors;
}

function checkAutoMineReveal() {
  const autoRevealedMines = [];
  const ballAttractions = [];
  
  // Check for mines that should be auto-revealed (all neighbors revealed)
  for (let x = 0; x < 10; x++) {
    for (let y = 0; y < 10; y++) {
      for (let z = 0; z < 10; z++) {
        const cell = minesweeperState.grid[x][y][z];
        if (cell.type === 'mine' && cell.state === 'hidden') {
          const neighbors = getNeighbors(x, y, z);
          const hiddenNeighbors = neighbors.filter(n => n.cell.state === 'hidden');
          
          if (hiddenNeighbors.length === 0) {
            cell.state = 'revealed';
            autoRevealedMines.push({ x, y, z, ...cell });
          }
        }
      }
    }
  }
  
  // Check for number cells that should trigger ball attraction
  for (let x = 0; x < 10; x++) {
    for (let y = 0; y < 10; y++) {
      for (let z = 0; z < 10; z++) {
        const cell = minesweeperState.grid[x][y][z];
        if (cell.type === 'number' && cell.state === 'revealed' && cell.value > 0) {
          const neighbors = getNeighbors(x, y, z);
          const hiddenNeighbors = neighbors.filter(n => n.cell.state === 'hidden');
          
          // Trigger ball attraction when hidden neighbors match the number value
          if (hiddenNeighbors.length === cell.value) {
            ballAttractions.push({
              numberCell: { x, y, z },
              targetCells: hiddenNeighbors.map(n => ({ x: n.x, y: n.y, z: n.z }))
            });
          }
        }
      }
    }
  }
  
  return { autoRevealedMines, ballAttractions };
}

function checkMineDissolution() {
  const dissolvedMines = [];
  const reducedNumberCells = [];
  
  // Find mines that should dissolve (all neighbors revealed)
  for (let x = 0; x < 10; x++) {
    for (let y = 0; y < 10; y++) {
      for (let z = 0; z < 10; z++) {
        const cell = minesweeperState.grid[x][y][z];
        if (cell.type === 'mine' && cell.state === 'revealed') {
          const neighbors = getNeighbors(x, y, z);
          const hiddenNeighbors = neighbors.filter(n => n.cell.state === 'hidden');
          
          if (hiddenNeighbors.length === 0) {
            // Dissolve mine
            cell.state = 'dissolved';
            dissolvedMines.push({ x, y, z });
            
            // Reduce neighboring number cells
            const numberNeighbors = neighbors.filter(n => 
              n.cell.type === 'number' && n.cell.state === 'revealed' && n.cell.value > 0
            );
            
            for (const neighbor of numberNeighbors) {
              neighbor.cell.value--;
              reducedNumberCells.push({
                x: neighbor.x,
                y: neighbor.y,
                z: neighbor.z,
                newValue: neighbor.cell.value
              });
            }
          }
        }
      }
    }
  }
  
  return { dissolvedMines, reducedNumberCells };
}

// Process mine click and return result
function processClick(x, y, z) {
  const cell = minesweeperState.grid[x][y][z];
  const revealedCells = [];
  
  if (cell.type === 'mine') {
    // Game over
    cell.state = 'revealed';
    revealedCells.push({ x, y, z, ...cell });
    minesweeperState.gameStatus = 'lost';
    
    // Reveal all mines
    for (let gx = 0; gx < 10; gx++) {
      for (let gy = 0; gy < 10; gy++) {
        for (let gz = 0; gz < 10; gz++) {
          if (minesweeperState.grid[gx][gy][gz].type === 'mine') {
            minesweeperState.grid[gx][gy][gz].state = 'revealed';
            if (gx !== x || gy !== y || gz !== z) {
              revealedCells.push({ x: gx, y: gy, z: gz, ...minesweeperState.grid[gx][gy][gz] });
            }
          }
        }
      }
    }
  } else {
    // Reveal cell and potentially cascade
    const toReveal = [{ x, y, z }];
    
    while (toReveal.length > 0) {
      const pos = toReveal.pop();
      const currentCell = minesweeperState.grid[pos.x][pos.y][pos.z];
      
      if (currentCell.state === 'revealed') continue;
      
      currentCell.state = 'revealed';
      revealedCells.push({ ...pos, ...currentCell });
      
      // If empty cell, reveal neighbors
      if (currentCell.type === 'empty') {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dz = -1; dz <= 1; dz++) {
              if (dx === 0 && dy === 0 && dz === 0) continue;
              const nx = pos.x + dx, ny = pos.y + dy, nz = pos.z + dz;
              if (nx >= 0 && nx < 10 && ny >= 0 && ny < 10 && nz >= 0 && nz < 10) {
                const neighbor = minesweeperState.grid[nx][ny][nz];
                if (neighbor.state === 'hidden' && neighbor.type !== 'mine') {
                  toReveal.push({ x: nx, y: ny, z: nz });
                }
              }
            }
          }
        }
      }
    }
    
    // Check win condition
    let hiddenNonMines = 0;
    for (let gx = 0; gx < 10; gx++) {
      for (let gy = 0; gy < 10; gy++) {
        for (let gz = 0; gz < 10; gz++) {
          const cell = minesweeperState.grid[gx][gy][gz];
          if (cell.state === 'hidden' && cell.type !== 'mine') {
            hiddenNonMines++;
          }
        }
      }
    }
    
    if (hiddenNonMines === 0) {
      minesweeperState.gameStatus = 'won';
    }
  }
  
  // Run advanced game logic after basic reveal
  const autoRevealResults = checkAutoMineReveal();
  const dissolutionResults = checkMineDissolution();
  
  return {
    cellData: cell,
    gameStatus: minesweeperState.gameStatus,
    newlyRevealed: revealedCells,
    autoRevealedMines: autoRevealResults.autoRevealedMines,
    ballAttractions: autoRevealResults.ballAttractions,
    dissolvedMines: dissolutionResults.dissolvedMines,
    reducedNumberCells: dissolutionResults.reducedNumberCells
  };
}

function resetMinesweeper() {
  clearTimeout(minesweeperState.resetTimeout);
  initializeMinesweeper();
  console.log('Carpet-sweeper minesweeper reset');
}

// Main export function that sets up the carpet-sweeper namespace
function setupCarpetSweeperSocket(io) {
  // Initialize game
  initializeMinesweeper();
  
  // Create namespace
  const carpetNsp = io.of('/carpet-sweeper');
  
  // Connection limit
  const MAX_PLAYERS = process.env.MAX_PLAYERS || 4;
  
  carpetNsp.use((socket, next) => {
    const totalPlayers = players.size;
    
    if (totalPlayers >= MAX_PLAYERS) {
      return next(new Error(`Server full (${MAX_PLAYERS} players max)`));
    }
    
    // Track per-IP for rate limiting
    const ip = socket.handshake.address;
    const currentConnections = ipConnections.get(ip) || 0;
    
    if (currentConnections >= 8) {
      return next(new Error('Too many connections from this IP'));
    }
    
    ipConnections.set(ip, currentConnections + 1);
    next();
  });
  
  carpetNsp.on('connection', (socket) => {
    const ip = socket.handshake.address;
    console.log('Carpet-sweeper player connected:', socket.id, `(IP: ${ip})`);
    
    // Handle disconnection cleanup
    socket.on('disconnect', () => {
      const ip = socket.handshake.address;
      const currentConnections = ipConnections.get(ip) || 0;
      if (currentConnections > 0) {
        ipConnections.set(ip, currentConnections - 1);
      }
      
      // Clean up tracking maps
      socketMessages.delete(socket.id);
      
      const player = players.get(socket.id);
      if (player) {
        console.log(`Carpet-sweeper player ${player.name} disconnected (IP: ${ip})`);
        players.delete(socket.id);
        socket.broadcast.emit('player_left', { playerId: socket.id });
      }
    });
    
    // Player joins game
    socket.on('join_game', (playerData) => {
      if (!checkSocketRateLimit(socket.id)) return;
      const player = {
        id: socket.id,
        name: playerData.name || generatePlayerName(),
        position: { x: 0, y: 0, z: 95000 }, // Start at equilibrium altitude
        orientation: { 
          pitch: 0, 
          roll: 0, 
          forward: { x: 0, y: -1, z: 0 }, 
          right: { x: 1, y: 0, z: 0 } 
        },
        carpetColor: playerData.color || 0xcc3366,
        lastUpdate: Date.now()
      };
      
      players.set(socket.id, player);
      
      // Send current game state to new player
      socket.emit('game_state', {
        players: Array.from(players.values()).filter(p => p.id !== socket.id),
        minesweeper: {
          grid: minesweeperState.grid,
          gameStatus: minesweeperState.gameStatus
        }
      });
      
      // Notify others of new player
      socket.broadcast.emit('player_joined', player);
      
      const ip = socket.handshake.address;
      console.log(`Carpet-sweeper player ${player.name} joined the game (IP: ${ip})`);
    });
    
    // Carpet movement updates
    socket.on('carpet_update', (data) => {
      if (!checkSocketRateLimit(socket.id)) return;
      
      // Validate input
      if (!data || !validatePosition(data.position) || !validateOrientation(data.orientation)) {
        return;
      }
      
      const player = players.get(socket.id);
      if (player) {
        player.position = data.position;
        player.orientation = data.orientation;
        player.lastUpdate = Date.now();
        
        // Broadcast to all other players
        socket.broadcast.emit('player_moved', {
          playerId: socket.id,
          position: data.position,
          orientation: data.orientation
        });
      }
    });
    
    // Carpet color changes from options menu
    socket.on('carpet_color', (data) => {
      if (!checkSocketRateLimit(socket.id)) return;
      
      // Validate color input
      if (!data || typeof data.color !== 'number' || data.color < 0 || data.color > 0xffffff) {
        return;
      }
      
      const player = players.get(socket.id);
      if (player) {
        player.carpetColor = data.color;
        socket.broadcast.emit('player_color_changed', {
          playerId: socket.id,
          color: data.color
        });
      }
    });
    
    // Minesweeper interactions (server authoritative)
    socket.on('mine_click', (data) => {
      if (!checkSocketRateLimit(socket.id)) return;
      
      if (minesweeperState.gameStatus !== 'playing') return;
      
      // Validate input
      if (!data || !validateCoordinates(data.x, data.y, data.z)) {
        return;
      }
      
      const { x, y, z } = data;
      
      const cell = minesweeperState.grid[x][y][z];
      
      // Validate click is legal
      if (cell && cell.state === 'hidden') {
        // Process click server-side
        const result = processClick(x, y, z);
        
        // Broadcast result to all players
        carpetNsp.emit('mine_revealed', {
          playerId: socket.id,
          position: { x, y, z },
          cellData: result.cellData,
          gameStatus: result.gameStatus,
          revealedCells: result.newlyRevealed,
          autoRevealedMines: result.autoRevealedMines,
          ballAttractions: result.ballAttractions,
          dissolvedMines: result.dissolvedMines,
          reducedNumberCells: result.reducedNumberCells
        });
        
        // Auto-reset after game over
        if (result.gameStatus !== 'playing') {
          console.log(`Carpet-sweeper game ${result.gameStatus}! Resetting in 10 seconds...`);
          minesweeperState.resetTimeout = setTimeout(() => {
            resetMinesweeper();
            carpetNsp.emit('game_reset', { 
              newGrid: minesweeperState.grid,
              gameStatus: 'playing' 
            });
          }, 10000);
        }
      }
    });
  });
  
  console.log('Carpet-sweeper Socket.IO namespace configured at /carpet-sweeper');
  return carpetNsp;
}

module.exports = { setupCarpetSweeperSocket };