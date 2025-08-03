# Mobile Controls Implementation Plan

## Device Detection Strategy

### Platform Detection
```javascript
// device-detector.js
export class DeviceDetector {
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
    }
    
    static hasGamepad() {
        return !!navigator.getGamepads;
    }
    
    static supportsOrientation() {
        return typeof DeviceOrientationEvent !== 'undefined';
    }
    
    static getInputCapabilities() {
        return {
            mobile: this.isMobile(),
            gamepad: this.hasGamepad(),
            orientation: this.supportsOrientation(),
            touch: 'ontouchstart' in window
        };
    }
}
```

## Launch Screen System

### Adaptive Launch UI
```javascript
// launch-screen.js
export class LaunchScreen {
    constructor(inputManager, configs) {
        this.inputManager = inputManager;
        this.configs = configs;
        this.capabilities = DeviceDetector.getInputCapabilities();
    }
    
    async show() {
        const container = this.createLaunchContainer();
        
        if (this.capabilities.mobile) {
            await this.showMobileLaunch(container);
        } else {
            await this.showDesktopLaunch(container);
        }
        
        this.cleanup(container);
    }
    
    createMobileLaunch() {
        return `
            <div class="launch-mobile">
                <h1>Flying Carpet</h1>
                <div class="controls-preview">
                    <div class="gesture-demo">
                        <span>📱 Tilt Device to Fly</span>
                        <span>👆 Tap Mines</span>
                        <span>👆👆 Double-tap to Recalibrate</span>
                    </div>
                </div>
                <div class="orientation-section">
                    <label>
                        <input type="checkbox" id="enable-motion" checked> 
                        Enable Motion Controls
                    </label>
                </div>
                <div class="landscape-section">
                    <label>
                        <input type="checkbox" id="lock-landscape"> 
                        Lock Landscape Mode
                    </label>
                </div>
                <button id="start-flying">Tap to Start Flying</button>
            </div>
        `;
    }
    
    createDesktopLaunch() {
        return `
            <div class="launch-desktop">
                <h1>Flying Carpet Minesweeper</h1>
                <div class="controls-grid">
                    <div class="keyboard-controls">
                        <h3>Keyboard</h3>
                        <ul>
                            <li><kbd>W/S</kbd> Pitch Up/Down</li>
                            <li><kbd>A/D</kbd> Turn Left/Right</li>
                            <li><kbd>Q/E</kbd> Boost/Brake</li>
                            <li><kbd>Space</kbd> Toggle Camera</li>
                            <li><kbd>Tab</kbd> Settings Menu</li>
                        </ul>
                    </div>
                    <div class="gamepad-controls" id="gamepad-section">
                        <h3>Gamepad ${this.capabilities.gamepad ? '✓' : '(Not Detected)'}</h3>
                        <ul>
                            <li><span class="btn">L</span> Turn/Pitch</li>
                            <li><span class="btn">R</span> Look Around</li>
                            <li><span class="btn">RT</span> Boost</li>
                            <li><span class="btn">LT</span> Brake</li>
                            <li><span class="btn">Select</span> Settings</li>
                        </ul>
                    </div>
                </div>
                <button id="start-flying">Start Flying</button>
            </div>
        `;
    }
}
```

## Mobile Input Implementation

### Simple Tap Handler
```javascript
// mobile-tap-handler.js
export class MobileTapHandler {
    constructor(element, inputManager) {
        this.element = element;
        this.inputManager = inputManager;
        this.lastTap = 0;
        this.doubleTapWindow = 500; // ms
        
        this.setupTapEvents();
    }
    
    setupTapEvents() {
        this.element.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        const now = Date.now();
        const timeSinceLastTap = now - this.lastTap;
        
        if (timeSinceLastTap < this.doubleTapWindow) {
            // Double tap - recalibrate orientation
            this.inputManager.calibrateDeviceOrientation();
            this.showCalibrationFeedback();
        } else {
            // Single tap - minesweeper interaction
            this.handleTapInteraction(e.touches[0]);
        }
        
        this.lastTap = now;
    }
    
    handleTapInteraction(touch) {
        // Convert touch to screen coordinates for minesweeper interaction
        const event = {
            clientX: touch.clientX,
            clientY: touch.clientY,
            type: 'touch'
        };
        
        // Trigger click event for minesweeper
        this.inputManager.triggerTouchClick(event);
    }
    
    showCalibrationFeedback() {
        // Brief visual feedback for calibration
        const feedback = document.createElement('div');
        feedback.className = 'calibration-feedback';
        feedback.textContent = 'Motion Controls Calibrated';
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 255, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-size: 18px;
            z-index: 10000;
        `;
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
        }, 2000);
    }
}
```

## Mobile UI Layout

### Bottom Button Bar
```css
/* Mobile-specific styles - NO MENU SYSTEM */
#mobile-controls {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: none; /* Show only on mobile */
    z-index: 1000;
}

.mobile-button-bar {
    display: flex;
    gap: 20px;
    background: rgba(0, 0, 0, 0.8);
    padding: 15px;
    border-radius: 25px;
    backdrop-filter: blur(10px);
}

.mobile-btn {
    width: 60px;
    height: 60px;
    border: none;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    font-weight: bold;
    font-size: 12px;
    touch-action: manipulation;
    user-select: none;
}

.mobile-btn:active {
    background: rgba(255, 255, 255, 0.4);
    transform: scale(0.95);
}

.mobile-btn.boost {
    background: rgba(0, 255, 0, 0.3);
}

.mobile-btn.brake {
    background: rgba(255, 0, 0, 0.3);
}

/* Hide ALL desktop menu elements on mobile */
@media screen and (max-width: 768px) {
    #menu-system,
    .menu-tabs,
    .menu-content,
    .config-sliders {
        display: none !important;
    }
}

/* Launch screen styles */
.launch-container {
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: linear-gradient(135deg, #1e3c72, #2a5298);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
}

.launch-mobile {
    text-align: center;
    color: white;
    max-width: 90vw;
}

.gesture-demo {
    margin: 30px 0;
    display: flex;
    flex-direction: column;
    gap: 15px;
    font-size: 18px;
}

#start-flying {
    width: 200px;
    height: 60px;
    font-size: 18px;
    font-weight: bold;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 30px;
    margin-top: 30px;
}
```

### Mobile Button Bar HTML
```html
<!-- Added to index.html -->
<div id="mobile-controls">
    <div class="mobile-button-bar">
        <button class="mobile-btn brake" id="mobile-brake">
            BRAKE
        </button>
        <button class="mobile-btn boost" id="mobile-boost">
            BOOST
        </button>
    </div>
</div>

<div id="launch-screen" class="launch-container" style="display: none;">
    <!-- Dynamic content inserted by LaunchScreen -->
</div>
```

## Enhanced Input Manager Integration

### Mobile Input Processing
```javascript
// Add to input-manager.js
setupMobileControls() {
    if (DeviceDetector.isMobile()) {
        this.tapHandler = new MobileTapHandler(document.body, this);
        this.setupMobileButtons();
        this.showMobileUI();
        
        // Initialize mobile button state
        this.mobileButtons = {
            boost: false,
            brake: false
        };
    }
}

setupMobileButtons() {
    const boostBtn = document.getElementById('mobile-boost');
    const brakeBtn = document.getElementById('mobile-brake');
    
    if (boostBtn && brakeBtn) {
        boostBtn.addEventListener('touchstart', () => this.mobileButtons.boost = true);
        boostBtn.addEventListener('touchend', () => this.mobileButtons.boost = false);
        brakeBtn.addEventListener('touchstart', () => this.mobileButtons.brake = true);
        brakeBtn.addEventListener('touchend', () => this.mobileButtons.brake = false);
    }
}

// Enhanced getCarpetInput for mobile - ORIENTATION ONLY
getCarpetInput(deltaTime, config) {
    const input = this.getBaseInput(deltaTime, config);
    
    // Mobile uses ONLY orientation for flight control
    if (DeviceDetector.isMobile() && this.deviceOrientation.enabled) {
        // Orientation input is already processed in deviceOrientation.pitch/turn
        input.pitch += this.deviceOrientation.pitch * config.pitchSensitivity.value;
        input.turn += this.deviceOrientation.turn * config.turnInputRate.value * deltaTime;
        
        // Mobile button input for boost/brake
        if (this.mobileButtons.boost) input.boost = 1.0;
        if (this.mobileButtons.brake) input.reverse = 1.0;
    }
    
    return input;
}

// Get menu navigation input - DESKTOP ONLY
getMenuInput() {
    // Mobile users get NO menu access
    if (DeviceDetector.isMobile()) {
        return { 
            nextTab: false, prevTab: false, up: false, down: false, 
            left: false, right: false, adjustValue: 0, adjustValueTriggers: 0,
            select: false, back: false, toggleMenu: false 
        };
    }
    
    // Desktop menu navigation
    const keyState = this.keyboard.getState();
    const gamepadState = this.gamepad.getState();
    
    return {
        nextTab: this.gamepad.wasPressed('rightBumper'),
        prevTab: this.gamepad.wasPressed('leftBumper'),
        up: keyState.up || this.gamepad.wasPressed('dpadUp'),
        down: keyState.down || this.gamepad.wasPressed('dpadDown'),
        left: keyState.left || this.gamepad.wasPressed('dpadLeft'),
        right: keyState.right || this.gamepad.wasPressed('dpadRight'),
        adjustValue: this.gamepad.isActive() ? gamepadState.rightStickX : 0,
        adjustValueTriggers: this.gamepad.isActive() ? 
            (gamepadState.rightTrigger - gamepadState.leftTrigger) : 0,
        select: keyState.enter || this.gamepad.wasPressed('a'),
        back: keyState.escape || this.gamepad.wasPressed('b'),
        toggleMenu: this.gamepad.wasPressed('select')
    };
}

triggerTouchClick(touchEvent) {
    // Convert touch to click for minesweeper interaction
    this.touchClick = {
        clientX: touchEvent.clientX,
        clientY: touchEvent.clientY,
        timestamp: Date.now()
    };
}
```

## Orientation UX Improvements

### Auto-Calibration System
```javascript
// Enhanced device orientation in input-manager.js
processOrientation() {
    if (!this.deviceOrientation.enabled) return;
    
    const { beta, gamma } = this.deviceOrientation;
    
    // Auto-calibrate on first significant movement
    if (!this.deviceOrientation.calibrated && 
        (Math.abs(beta) > 10 || Math.abs(gamma) > 10)) {
        this.calibrateDeviceOrientation();
        this.showAutoCalibrationMessage();
    }
    
    // Rest of existing orientation processing...
}

showAutoCalibrationMessage() {
    const message = document.createElement('div');
    message.className = 'auto-calibration-message';
    message.textContent = 'Motion controls auto-calibrated!';
    document.body.appendChild(message);
    
    setTimeout(() => message.remove(), 3000);
}
```

## Screen Orientation Management

### Landscape Lock Implementation
```javascript
// Add to launch-screen.js
async handleOrientationPreference(lockLandscape) {
    if (lockLandscape && screen.orientation && screen.orientation.lock) {
        try {
            await screen.orientation.lock('landscape');
        } catch (error) {
            console.log('Orientation lock not supported:', error);
        }
    }
}

// CSS for orientation guidance
@media screen and (orientation: portrait) and (max-width: 768px) {
    .orientation-hint {
        position: fixed;
        top: 0; left: 0;
        width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 18px;
        text-align: center;
        z-index: 9999;
    }
    
    .rotate-icon {
        font-size: 48px;
        margin-bottom: 20px;
    }
}
```

## Integration Points

### Main.js Changes
```javascript
// Add to main.js constructor
async initializeApp() {
    // Show launch screen first
    this.launchScreen = new LaunchScreen(this.inputManager, this.configs);
    const launchSettings = await this.launchScreen.show();
    
    // Apply launch settings
    if (launchSettings.motionControls) {
        await this.inputManager.requestOrientationPermission();
        this.inputManager.enableDeviceOrientation();
    }
    
    if (launchSettings.lockLandscape) {
        await this.launchScreen.handleOrientationPreference(true);
    }
    
    // Initialize controls based on platform
    if (DeviceDetector.isMobile()) {
        this.inputManager.setupMobileControls();
        // NO menu system initialization for mobile
    } else {
        // Initialize full menu system for desktop only
        this.menuSystem = new MenuSystem(this.configs);
    }
    
    // Continue with existing initialization...
}

processInput(deltaTime) {
    // ... existing input processing ...
    
    // Handle menu input ONLY on desktop
    if (!DeviceDetector.isMobile() && this.menuSystem) {
        const menuInput = this.inputManager.getMenuInput();
        if (menuInput.toggleMenu) {
            this.menuSystem.toggle();
        }
        
        if (this.menuSystem.isVisible()) {
            this.menuSystem.handleMenuInput(menuInput);
            this.crosshair.hide();
            return { pitch: 0, turn: 0, boost: 0, reverse: 0, cameraYaw: 0, cameraPitch: 0 };
        }
    }
    
    // Show crosshair and process game input
    this.crosshair.show();
    // ... rest of input processing ...
}
```

### Menu System Mobile Exclusion
```javascript
// Add to menu-system.js
constructor(configs) {
    this.configs = configs;
    this.isMobile = DeviceDetector.isMobile();
    
    // Mobile gets NO menu system at all
    if (this.isMobile) {
        this.disabled = true;
        return;
    }
    
    // Initialize full menu system for desktop only
    this.initializeDesktopMenu();
}

toggle() {
    // Block menu access on mobile completely
    if (this.isMobile || this.disabled) return;
    
    // Rest of existing toggle logic for desktop...
}

isVisible() {
    // Menu never visible on mobile
    if (this.isMobile || this.disabled) return false;
    
    return this.visible;
}
```

This comprehensive plan creates a device-adaptive control system that provides appropriate interfaces for each platform while maintaining a single codebase. 

The touch controls replace camera controls on mobile, orientation is opt-in with better UX, and desktop users get full configuration access.