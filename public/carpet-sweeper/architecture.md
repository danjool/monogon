# Flying Carpet Minesweeper - Refactored Architecture

## File Structure (Flat)

```
index.html              - Entry point, minimal HTML
main.js                 - Slim coordinator, animation loop
world-sphere.js         - World creation, skyscrapers, boundaries
input-manager.js        - Unified input coordination
keyboard.js             - Clean keyboard input handling
gamepad.js              - Clean gamepad input handling  
menu-system.js          - Tabbed options menu with sliders
info-panel.js           - Game status/info display
carpet-config.js        - All carpet physics parameters
camera-config.js        - Camera behavior parameters
particles-config.js     - Particle system parameters
visuals-config.js       - Debug visualization parameters
carpet.js               - Carpet physics (updated to use config)
carpet-camera.js        - Camera controller (updated to use config)
carpet-flow-field.js    - GPU particles (updated to use config)
sweeper.js              - 3D Minesweeper game (minimal changes)
crosshair.js            - Crosshair display (unchanged)
```

## Configuration System

### Centralized Config Structure
Each config file exports an object with this structure:
```javascript
{
  parameterName: {
    value: 1000,        // Current value
    min: 0,             // Slider minimum
    max: 2000,          // Slider maximum  
    step: 10,           // Slider step size
    label: "Speed",     // Display name
    category: "basic"   // Optional grouping
  }
}
```

### Config Files Breakdown

**carpet-config.js** - All carpet physics
- Movement: speed limits, acceleration, momentum
- Pitch: sensitivity, damping, stall recovery, auto-stabilization
- Turn: input rates, momentum, roll visualization
- Boost: rates, altitude effects

**camera-config.js** - Camera behavior
- Distance: follow distance, screen offset
- Sensitivity: pitch/yaw input rates
- Positioning: look-at offsets, up vector handling

**particles-config.js** - Particle effects
- Simulation: particle count, bounds, emission rates
- Visual: particle size, colors, lifespan
- Physics: turbulence, flow speed, vortex effects

**visuals-config.js** - Debug visualization
- Minesweeper: cell sizes, debug cubes, sphere animations
- Trajectory: prediction path, marker visibility
- Performance: debug overlays, performance metrics

## Menu System Architecture

### Tab Structure
```
┌─Carpet─┬─Camera─┬─Particles─┬─Visuals─┐
│        │        │           │         │
│ Speed  │Distance│ Count     │ Scale   │
│ ████   │ ████   │ ████      │ ████    │
│        │        │           │         │
│ Pitch  │Sensitiv│ Colors    │ Debug   │
│ ████   │ ████   │ ████      │ ████    │
└────────┴────────┴───────────┴─────────┘
```

### Navigation Controls
- **Keyboard**: Tab/Shift+Tab (tabs), Arrow keys (navigation), Enter (select)
- **Mouse**: Click tabs, drag sliders, hover for tooltips
- **Gamepad**: LB/RB (tabs), D-pad (navigation), A (select), B (back)

### Menu State Management
```javascript
class MenuSystem {
  currentTab: 'carpet' | 'camera' | 'particles' | 'visuals'
  selectedSlider: number
  visible: boolean
  configs: { carpet, camera, particles, visuals }
}
```

## Input System Flow

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ keyboard.js │───▶│              │───▶│   main.js   │
├─────────────┤    │ input-       │    ├─────────────┤
│ gamepad.js  │───▶│ manager.js   │───▶│ menu-system │
├─────────────┤    │              │    ├─────────────┤
│ mouse       │───▶│              │───▶│ carpet      │
└─────────────┘    └──────────────┘    └─────────────┘
```

### Input Manager Responsibilities
- Collect input from all sources
- Normalize input (deadzones, sensitivity)
- Route input based on menu state
- Handle input conflicts (menu vs game)

## File Responsibilities

### main.js (Slim Coordinator)
```javascript
- Scene setup (minimal)
- Animation loop
- Coordinate updates between systems
- Collision detection
- Render calls
```

### world-sphere.js (World Management)
```javascript
- Sphere geometry creation
- Skyscraper generation and placement
- World boundaries and collision zones
- Lighting setup
- Background/environment effects
```

### menu-system.js (UI Management)
```javascript
- Tab switching logic
- Slider rendering and interaction
- Real-time parameter updates
- Menu show/hide transitions
- Configuration persistence
```

### info-panel.js (Status Display)
```javascript
- Carpet state display
- Performance metrics
- Control hints
- Game status (no minesweeper spoilers)
```

## Critical Systems (DO NOT BREAK)

### Carpet Camera Math
**Location**: `carpet-camera.js` 
**Critical Code**:
```javascript
// Spherical offset in carpet's local space
localOffset = new THREE.Vector3(
  Math.sin(yaw) * Math.cos(pitch) * distance,
  Math.sin(pitch) * distance,
  Math.cos(yaw) * Math.cos(pitch) * distance - screenOffset
);

// Transform to world space via carpet's matrix
localOffset.applyMatrix4(this.carpet.mesh.matrixWorld);
```

### Flow Field Vertex Shader
**Location**: `carpet-flow-field.js`
**Critical Code**:
```glsl
// Sample position from texture (not vertex position!)
vec4 texData = texture2D(positionTexture, uv);
vec3 pos = texData.xyz;

// Distance-based particle scaling
float size = max(particleSize * 2.0, 
                particleSize * (10000.0 / max(10.0, -mvPosition.z)));
```

### Inside-Out "Up" Vector
**Location**: `carpet.js`, `carpet-camera.js`
**Critical Concept**: Up = toward world center = -normalize(position)
```javascript
this.normal.copy(this.position).normalize().negate();
```

## Migration Plan

### Phase 1: Extract Configurations
1. Create config files with current hardcoded values
2. Update carpet.js, carpet-camera.js, carpet-flow-field.js to use configs
3. Test - everything should work exactly the same

### Phase 2: Extract Input System
1. Create keyboard.js, gamepad.js, input-manager.js
2. Move input logic from main.js
3. Test - controls should work exactly the same

### Phase 3: Extract World Management
1. Move world creation from main.js to world-sphere.js
2. Test - world should render exactly the same

### Phase 4: Create Menu System
1. Build menu-system.js with tab interface
2. Wire up configuration sliders
3. Add gamepad back button toggle

### Phase 5: Extract Info Panel
1. Move info display logic to info-panel.js
2. Remove minesweeper references from default display

### Phase 6: Cleanup
1. Remove debug elements (emission point markers, debug lines)
2. Clean up main.js to minimal coordinator
3. Final testing

## Configuration Categories

### Carpet Tab
- **Movement**: equilibriumSpeed, minSpeed, maxSpeed, gravity
- **Pitch Control**: pitchSensitivity, maxPitch, pitchMomentumDamping
- **Turn Control**: turnInputRate, rollFactor, maxRoll
- **Advanced**: stallRecoveryForce, speedInfluence, boostRate

### Camera Tab  
- **Positioning**: cameraDistance, screenOffset
- **Sensitivity**: cameraYawSensitivity, cameraPitchSensitivity
- **Behavior**: followSmoothing, lookAheadDistance

### Particles Tab
- **Simulation**: simulationSize, particleSize, emissionRate
- **Visual**: colorIntensity, particleLifespan
- **Physics**: turbulence, flowSpeed, vortexScale
- **Flow Field**: waveAmplitude, noiseScale, mixingRate

### Visuals Tab
- **Minesweeper**: minesweeperScale, cellSize, sphereRadius
- **Debug**: showDebugCube, debugCubeOpacity
- **Animation**: attractionSpeed, floatAmplitude
- **Trajectory**: showTrajectory, predictionSteps

## Success Criteria

1. **Functionality Preserved**: All current features work exactly the same
2. **Performance Maintained**: No FPS drops from refactoring
3. **Critical Math Intact**: Camera and particle systems unchanged
4. **Menu System Working**: All parameters tweakable in real-time
5. **Code Cleanliness**: main.js under 200 lines, clear separation of concerns
6. **User Experience**: Intuitive menu navigation with keyboard/mouse/gamepad