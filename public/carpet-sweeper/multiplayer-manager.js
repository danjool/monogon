import { OtherPlayer } from './other-player.js';

export class MultiplayerManager {
  constructor(scene, carpet, sweeper, configs) {
    this.scene = scene;
    this.carpet = carpet;
    this.sweeper = sweeper;
    this.configs = configs;
    
    this.socket = null;
    this.otherPlayers = new Map();
    this.isConnected = false;
    this.playerName = '';
    this.updateInterval = null;
    
    // Connect to server
    this.connect();
  }
  
  connect() {
  // Handle local network development
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;
  let serverUrl;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    serverUrl = `${protocol}//${hostname}${port ? ':' + port : ''}/carpet-sweeper`;
  } else if (hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.')) {
    // Local network - connect to same host with namespace
    serverUrl = `${protocol}//${hostname}${port ? ':' + port : ''}/carpet-sweeper`;
  } else {
    // Production - use same domain with namespace
    serverUrl = `${protocol}//${hostname}/carpet-sweeper`;
  }

  console.log('Window location:', hostname);
  console.log('Computed server URL:', serverUrl);

  // Import socket.io client
  import('https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.7.4/socket.io.esm.min.js')
    .then(({ io }) => {
      console.log('Socket.IO library loaded, creating connection...');
      this.socket = io(serverUrl);  // serverUrl is now properly scoped
      console.log('Socket.IO instance created:', this.socket);
      this.setupEvents();
    })
    .catch(err => {
      console.log('Multiplayer unavailable (running in single-player mode)');
      console.error('Connection error:', err);
    });
}
  
  setupEvents() {
    console.log('Setting up Socket.IO event listeners...');
    
    this.socket.on('connect', () => {
      console.log('Connected to multiplayer server');
      this.isConnected = true;
      this.joinGame();
      this.startUpdateLoop();
    });
    
    this.socket.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err);
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from multiplayer server');
      this.isConnected = false;
      this.stopUpdateLoop();
      this.clearOtherPlayers();
    });
    
    this.socket.on('game_state', (state) => {
      console.log('Received game state:', state.players.length, 'other players');
      
      // Add existing players
      state.players.forEach(player => this.addOtherPlayer(player));
      
      // Sync minesweeper state for late joiners
      if (this.sweeper && state.minesweeper) {
        this.sweeper.syncNetworkState(state.minesweeper);
      }
    });
    
    this.socket.on('player_joined', (player) => {
      console.log('Player joined:', player.name);
      this.addOtherPlayer(player);
    });
    
    this.socket.on('player_moved', (data) => {
      const otherPlayer = this.otherPlayers.get(data.playerId);
      if (otherPlayer) {
        otherPlayer.updateTransform(data.position, data.orientation);
      }
    });
    
    this.socket.on('player_color_changed', (data) => {
      const otherPlayer = this.otherPlayers.get(data.playerId);
      if (otherPlayer) {
        otherPlayer.updateColor(data.color);
      }
    });
    
    this.socket.on('mine_revealed', (data) => {
      if (this.sweeper) {
        this.sweeper.handleNetworkReveal(data);
      }
    });
    
    this.socket.on('game_reset', (data) => {
      console.log('Minesweeper game reset by server');
      if (this.sweeper) {
        this.sweeper.handleNetworkReset(data);
      }
    });
    
    this.socket.on('player_left', (data) => {
      console.log('Player left:', data.playerId);
      this.removeOtherPlayer(data.playerId);
    });
  }
  
  joinGame() {
    if (!this.socket) return;
    
    this.socket.emit('join_game', {
      color: this.carpet.mesh.material.color.getHex()
    });
  }
  
  startUpdateLoop() {
    // Send carpet updates at ~20fps
    this.updateInterval = setInterval(() => {
      this.sendCarpetUpdate();
    }, 50); // 50ms = 20fps
  }
  
  stopUpdateLoop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
  
  sendCarpetUpdate() {
    if (!this.isConnected) return;
    
    this.socket.emit('carpet_update', {
      position: {
        x: this.carpet.position.x,
        y: this.carpet.position.y,
        z: this.carpet.position.z
      },
      orientation: {
        pitch: this.carpet.pitch,
        roll: this.carpet.roll,
        forward: {
          x: this.carpet.forward.x,
          y: this.carpet.forward.y,
          z: this.carpet.forward.z
        },
        right: {
          x: this.carpet.right.x,
          y: this.carpet.right.y,
          z: this.carpet.right.z
        }
      }
    });
  }
  
  sendCarpetColor(color) {
    if (!this.isConnected) return;
    
    this.socket.emit('carpet_color', {
      color: color
    });
  }
  
  sendMineClick(x, y, z) {
    if (!this.isConnected) return;
    
    this.socket.emit('mine_click', { x, y, z });
  }
  
  addOtherPlayer(playerData) {
  if (this.otherPlayers.has(playerData.id)) {
    console.log('Player already exists:', playerData.id);
    return;
  }
  
  console.log('Creating OtherPlayer for:', playerData.id);
  const otherPlayer = new OtherPlayer(this.scene, playerData);
  console.log('OtherPlayer created:', otherPlayer);
  
  this.otherPlayers.set(playerData.id, otherPlayer);
  console.log('Added to map. Map size:', this.otherPlayers.size);
  
  // Verify it was stored correctly
  const stored = this.otherPlayers.get(playerData.id);
  console.log('Verification - stored player:', stored);
}
  
  removeOtherPlayer(playerId) {
    const otherPlayer = this.otherPlayers.get(playerId);
    if (otherPlayer) {
      otherPlayer.remove();
      this.otherPlayers.delete(playerId);
    }
  }
  
  clearOtherPlayers() {
    this.otherPlayers.forEach(player => player.remove());
    this.otherPlayers.clear();
  }
  
  // Get emission points for particle system
  getOtherPlayerEmissionPoints() {
    const points = [];
    this.otherPlayers.forEach(player => {
      points.push(player.getEmissionPoint());
    });
    return points;
  }
  
  // Get all player carpets for particle emission
  getAllCarpetEmissionPoints() {
    const points = [this.carpet.getEmissionPoint()];
    this.otherPlayers.forEach(player => {
      points.push(player.getEmissionPoint());
    });
    return points;
  }
  
  getPlayerCount() {
    return this.otherPlayers.size + (this.isConnected ? 1 : 0);
  }
  
  isMultiplayerActive() {
    return this.isConnected;
  }
  
  destroy() {
    this.stopUpdateLoop();
    this.clearOtherPlayers();
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}