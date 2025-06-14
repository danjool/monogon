# Flying Carpet Minesweeper - Multiplayer Inside-Out World

A unique 3D flying experience where players pilot magic carpets through an inside-out spherical world, collaborating to solve a floating 3D minesweeper puzzle.

## Features

### Core Gameplay
- **Inside-Out World**: Fly on the inner surface of a massive sphere where "up" is toward the center
```javascript
const up = positionVector.normalize().negate(); // Up points toward sphere center
```
- **Physics-Based Flight**: Altitude affects speed, pitch controls climb/dive, momentum-based movement
- **3D Minesweeper**: Collaborative puzzle solving in a 10x10x10 grid floating in space
- **GPU Particle Trails**: Dynamic flow field particles stream from all carpets

### Multiplayer (LAN/Online)
- **Real-time Synchronization**: See other players flying in the same world
- **Collaborative Minesweeper**: All players work together to solve the same puzzle
- **Server Authoritative**: Prevents cheating, ensures consistent game state
- **Auto-reconnect**: Seamlessly handles connection drops
- **Player Names**: Auto-generated hacker-style names (CyberPilot420, etc.)

### Controls
**Keyboard:**
- Arrow Keys: Turn/Pitch
- Space: Toggle camera view
- R: Reset carpet position
- M: Reset minesweeper game
- Tab/Shift+Tab: Navigate menu tabs
- Enter: Select menu option

**Gamepad (Xbox/PlayStation):**
- Left Stick: Turn/Pitch
- Right Stick: Look around
- Left Trigger: Reverse thrust
- Right Trigger: Boost
- A/X: Click minesweeper cells
- B/Circle: Back/close menu
- Select/Share: Open options menu
- LB/RB: Switch menu tabs
- D-pad: Navigate menu options

### Customization Menu
- **Carpet Tab**: Speed, pitch sensitivity, turn rates, physics parameters
- **Camera Tab**: Follow distance, look sensitivity, camera behavior
- **Effects Tab**: Particle count, colors, flow dynamics, trail intensity
- **World Tab**: World size, equilibrium altitude, environment settings

## Technical Stack
- **Frontend**: Three.js, ES6 modules, WebGL shaders
- **Multiplayer**: Socket.IO
- **Server**: Node.js + Express
- **Physics**: Custom inside-out gravity simulation
- **Particles**: GPU-based flow field simulation

## Project Structure
```
├── index.html              # Entry point
├── main.js                # Game coordinator  
├── carpet.js              # Carpet physics
├── carpet-camera.js       # Camera controller
├── carpet-flow-field.js   # GPU particle system
├── world-sphere.js        # World generation
├── sweeper.js             # 3D minesweeper
├── menu-system.js         # Options UI
├── input-manager.js       # Input coordination
├── keyboard.js            # Keyboard input
├── gamepad.js             # Gamepad input
├── multiplayer-manager.js # Network client
├── other-player.js        # Remote player rendering
├── trajectory-predictor.js # Flight path prediction
├── turn-debug-manager.js  # Debug visualization
├── crosshair.js           # UI crosshair
├── info-panel.js          # Status display
├── carpet-config.js       # Flight physics config
├── camera-config.js       # Camera behavior config
├── particles-config.js    # Particle effects config
├── visuals-config.js      # Debug visuals config
├── server.js              # Multiplayer server
└── package.json           # Server dependencies
```

## Setup

### Single Player (No server needed)
1. Open `index.html` in a modern browser
2. Start flying immediately!

### Multiplayer (LAN)
1. Install Node.js
2. Run `npm install` in the project directory
3. Start server: `node server.js`
4. Open `http://localhost:3001` on multiple devices
5. Server auto-detects LAN IP for easy sharing

### Multiplayer (Online)
1. Deploy server to any Node.js host (Heroku, Railway, etc.)
2. Update `multiplayer-manager.js` with your server URL
3. Share game URL with friends

## Current Known Issues
- Performance optimization needed for lower-end devices
- Minesweeper cells flicker when revealed (dissolve effect issues)
- Trajectory prediction could be more accurate at extreme speeds

## Gameplay Tips
- Higher altitude = faster base speed
- Use pitch control to trade speed for altitude
- Empty minesweeper cells cascade-reveal neighbors
- Number spheres indicate adjacent mine count
- Work together to eliminate all non-mine cells

## Development
- Pure ES6 modules, no build step required
- Hot reload supported with any dev server
- Extensive configuration system for real-time tweaking
- Clean separation of concerns across modules