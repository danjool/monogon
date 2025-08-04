import { Keyboard } from './keyboard.js';
import { Gamepad } from './gamepad.js';
import { DeviceDetector } from './device-detector.js';
import { MobileTapHandler } from './mobile-tap-handler.js';

export class InputManager {
    constructor() {
        this.keyboard = new Keyboard();
        this.gamepad = new Gamepad();
        
        this.mouseClicked = false;
        this.mouseDelta = { x: 0, y: 0 };
        this.isPointerLocked = false;
        this.setupMouseEvents();
        
        // Device orientation support
        this.deviceOrientation = {
            enabled: false,
            supported: false,
            permissionGranted: false,
            alpha: 0,  // Device rotation (compass)
            beta: 0,   // Front-to-back tilt (-90 to 90)
            gamma: 0,  // Left-to-right tilt (-90 to 90)
            
            // Calibration
            calibrated: false,
            neutralBeta: 0,
            neutralGamma: 0,
            deadzone: 5, // degrees
            sensitivity: 2.0, // multiplier
            
            // Derived values
            pitch: 0,
            turn: 0
        };
        
        this.setupDeviceOrientation();
        
        // Mobile controls
        this.isMobile = DeviceDetector.isMobile();
        this.tapHandler = null;
        this.mobileButtons = {
            boost: false,
            brake: false
        };
        this.touchClick = null;
        
        // Mobile swipe for camera control
        this.mobileSwipe = {
            deltaX: 0,
            deltaY: 0,
            active: false
        };
    }
    
    setupMouseEvents() {
        window.addEventListener('click', (e) => {
            this.mouseClicked = true;
            
            // Request pointer lock on click (for mouse camera control)
            if (!this.isPointerLocked && document.pointerLockElement !== document.body) {
                document.body.requestPointerLock();
            }
        });
        
        // Handle pointer lock changes
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === document.body;
        });
        
        // Handle mouse movement for camera control
        document.addEventListener('mousemove', (e) => {
            if (this.isPointerLocked) {
                this.mouseDelta.x = e.movementX || 0;
                this.mouseDelta.y = e.movementY || 0;
            }
        });
        
        window.addEventListener('resize', () => {
            this.onResize();
        });
    }
    
    setupDeviceOrientation() {
        if (typeof DeviceOrientationEvent !== 'undefined') {
            this.deviceOrientation.supported = true;
            // For iOS 13+, we need to request permission
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                console.log('iOS 13+ detected - permission required for device orientation');
            } else {
                // Android or older iOS - permission granted by default
                this.deviceOrientation.permissionGranted = true;
                this.setupOrientationListener();
            }
        } else {
            console.log('Device orientation not supported');
        }
    }
    
    async requestOrientationPermission() {
        if (!this.deviceOrientation.supported) {
            return { success: false, error: 'Device orientation not supported' };
        }
        
        if (this.deviceOrientation.permissionGranted) {
            return { success: true, message: 'Permission already granted' };
        }
        
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission === 'granted') {
                    this.deviceOrientation.permissionGranted = true;
                    this.setupOrientationListener();
                    return { success: true, message: 'Permission granted' };
                } else {
                    return { success: false, error: `Permission ${permission}` };
                }
            } catch (error) {
                return { success: false, error: error.message };
            }
        }
        
        this.deviceOrientation.permissionGranted = true;
        this.setupOrientationListener();
        return { success: true, message: 'Permission granted' };
    }
    
    setupOrientationListener() {
        if (!this.deviceOrientation.permissionGranted) return;
        window.addEventListener('deviceorientation', (event) => {
            this.deviceOrientation.alpha = event.alpha || 0;
            this.deviceOrientation.beta = event.beta || 0;
            this.deviceOrientation.gamma = event.gamma || 0;
            this.processOrientation();
        });
    }
    
    processOrientation() {
        if (!this.deviceOrientation.enabled || !this.deviceOrientation.calibrated) {
            return;
        }
        
        const { beta, gamma, neutralBeta, neutralGamma, deadzone, sensitivity } = this.deviceOrientation;
        
        // Calculate relative angles from neutral position
        let relativeBeta = beta - neutralBeta;
        let relativeGamma = gamma - neutralGamma;
        
        // Handle angle wrapping (shouldn't be needed for beta/gamma but safety first)
        if (relativeBeta > 180) relativeBeta -= 360;
        if (relativeBeta < -180) relativeBeta += 360;
        if (relativeGamma > 180) relativeGamma -= 360;
        if (relativeGamma < -180) relativeGamma += 360;
        
        // Apply deadzone
        if (Math.abs(relativeBeta) < deadzone) relativeBeta = 0;
        if (Math.abs(relativeGamma) < deadzone) relativeGamma = 0;
        
        // Map to control values
        // Beta (forward/back tilt) -> Pitch (nose up/down)
        // Positive beta (tilt back) -> negative pitch (nose up)
        this.deviceOrientation.pitch = -relativeBeta * sensitivity / 90.0;
        
        // Gamma (left/right tilt) -> Turn
        // Positive gamma (tilt right) -> negative turn (turn right)
        this.deviceOrientation.turn = -relativeGamma * sensitivity / 90.0;
        
        // Clamp values
        this.deviceOrientation.pitch = Math.max(-1, Math.min(1, this.deviceOrientation.pitch));
        this.deviceOrientation.turn = Math.max(-1, Math.min(1, this.deviceOrientation.turn));
    }
    
    enableDeviceOrientation() {
        if (!this.deviceOrientation.supported || !this.deviceOrientation.permissionGranted) {
            return false;
        }
        
        this.deviceOrientation.enabled = true;
        this.calibrateDeviceOrientation();
        return true;
    }
    
    disableDeviceOrientation() {
        this.deviceOrientation.enabled = false;
        this.deviceOrientation.pitch = 0;
        this.deviceOrientation.turn = 0;
    }
    
    calibrateDeviceOrientation() {
        if (!this.deviceOrientation.enabled) return;
        
        // Set current orientation as neutral
        this.deviceOrientation.neutralBeta = this.deviceOrientation.beta;
        this.deviceOrientation.neutralGamma = this.deviceOrientation.gamma;
        this.deviceOrientation.calibrated = true;
    }
    
    update() {
        // Update gamepad state
        this.gamepad.update();
        
        // Clear single-frame events
        // (mouseClicked will be cleared by whoever consumes it)
        // Mouse delta will be cleared after being consumed
    }
    
    // Get unified input for carpet control
    getCarpetInput(deltaTime, config) {
        const keyState = this.keyboard.getState();
        const gamepadState = this.gamepad.getState();
        
        const input = {
            pitch: 0,
            turn: 0,
            boost: 0,
            reverse: 0,
            cameraYaw: 0,
            cameraPitch: 0
        };
        
        // WASD for camera controls
        if (keyState.w) input.pitch -= config.pitchSensitivity.value;
        if (keyState.s) input.pitch += config.pitchSensitivity.value;
        if (keyState.a) input.turn += config.turnInputRate.value * deltaTime;
        if (keyState.d) input.turn -= config.turnInputRate.value * deltaTime;
        
        // Q/E for throttle controls
        if (keyState.q) input.boost = 1.0;
        if (keyState.e) input.reverse = 1.0;
        
        // Mouse camera input
        if (this.isPointerLocked) {
            const mouseSensitivity = 0.002; // Adjust as needed
            input.cameraYaw = -this.mouseDelta.x * mouseSensitivity;
            input.cameraPitch = -this.mouseDelta.y * mouseSensitivity;
        }
        
        // Mobile input handling
        if (this.isMobile) {
            // Mobile button input for boost/brake
            if (this.mobileButtons.boost) input.boost = 1.0;
            if (this.mobileButtons.brake) input.reverse = 1.0;
            
            // Mobile swipe input for camera control (always available)
            if (this.mobileSwipe.active) {
                const swipeSensitivity = 0.02; // Higher sensitivity for frame-to-frame deltas
                input.cameraYaw = -this.mobileSwipe.deltaX * swipeSensitivity;
                input.cameraPitch = -this.mobileSwipe.deltaY * swipeSensitivity;
            }
            
            // Orientation input for flight control (if enabled)
            if (this.deviceOrientation.enabled && this.deviceOrientation.calibrated) {
                input.pitch = -this.deviceOrientation.pitch * config.pitchSensitivity.value;
                input.turn = this.deviceOrientation.turn * config.turnInputRate.value * deltaTime;
            }
        } else if (!this.isMobile && this.deviceOrientation.enabled && this.deviceOrientation.calibrated) {
            // Desktop can combine orientation with keyboard
            input.pitch -= this.deviceOrientation.pitch * config.pitchSensitivity.value;
            input.turn += this.deviceOrientation.turn * config.turnInputRate.value * deltaTime;
        }
        
        // Gamepad input (if active)
        if (this.gamepad.isActive()) {
            // Left stick for pitch/turn
            if (Math.abs(gamepadState.leftStickY) > 0) {
                input.pitch += gamepadState.leftStickY * config.pitchSensitivity.value * 2;
            }
            
            if (Math.abs(gamepadState.leftStickX) > 0) {
                input.turn -= gamepadState.leftStickX * config.turnInputRate.value * deltaTime;
            }
            
            // Right stick for camera (will be handled by camera config)
            if (Math.abs(gamepadState.rightStickX) > 0) {
                input.cameraYaw = -gamepadState.rightStickX;
            }
            
            if (Math.abs(gamepadState.rightStickY) > 0) {
                input.cameraPitch = gamepadState.rightStickY;
            }
            
            // Triggers for boost/reverse
            input.boost = gamepadState.rightTrigger;
            input.reverse = gamepadState.leftTrigger;
        }
        
        return input;
    }
    
    // Get menu navigation input - DESKTOP ONLY
    getMenuInput() {
        // Mobile users get NO menu access
        if (this.isMobile) {
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
            // Tab switching (only gamepad bumpers, keyboard tab is for menu toggle)
            nextTab: this.gamepad.wasPressed('rightBumper'),
            prevTab: this.gamepad.wasPressed('leftBumper'),
            
            // Navigation within tab (separate from value adjustment)
            up: keyState.up || this.gamepad.wasPressed('dpadUp'),
            down: keyState.down || this.gamepad.wasPressed('dpadDown'),
            left: keyState.left || this.gamepad.wasPressed('dpadLeft'),
            right: keyState.right || this.gamepad.wasPressed('dpadRight'),
            
            // Value adjustment (gamepad only - right stick X or triggers)
            adjustValue: this.gamepad.isActive() ? gamepadState.rightStickX : 0,
            adjustValueTriggers: this.gamepad.isActive() ? 
                (gamepadState.rightTrigger - gamepadState.leftTrigger) : 0,
            
            // Selection
            select: keyState.enter || this.gamepad.wasPressed('a'),
            back: keyState.escape || this.gamepad.wasPressed('b'),
            
            // Menu toggle
            toggleMenu: this.gamepad.wasPressed('select')
        };
    }
    
    // Get special action input
    getActionInput() {
        const keyState = this.keyboard.getState();
        const gamepadState = this.gamepad.getState();
        
        return {
            // Camera toggle
            toggleCamera: keyState.space,
            
            // Reset actions
            resetCarpet: keyState.r,
            
            // Menu toggle
            toggleMenu: keyState.tab,
            
            // Click actions (mouse, gamepad A button, bumper buttons, or touch)
            click: this.mouseClicked || this.gamepad.wasPressed('a') || 
                   this.gamepad.wasPressed('leftBumper') || this.gamepad.wasPressed('rightBumper') ||
                   (this.touchClick && (Date.now() - this.touchClick.timestamp < 100))
        };
    }
    
    // Consume click event (call this after handling click)
    consumeClick() {
        this.mouseClicked = false;
        this.touchClick = null;
    }
    
    // Consume mouse delta (call this after handling mouse input)
    consumeMouseDelta() {
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;
        
        // Also clear mobile swipe deltas after input processing
        if (this.isMobile) {
            this.clearMobileSwipe();
        }
    }
    
    // Handle window resize
    onResize() {
        // This can be used by systems that need to know about resize
        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }
    
    // Get gamepad connection info for UI display
    getGamepadInfo() {
        return {
            active: this.gamepad.isActive(),
            // You could add gamepad name/id here if needed
        };
    }
    
    getOrientationInfo() { // for UI display
        return {
            supported: this.deviceOrientation.supported,
            permissionGranted: this.deviceOrientation.permissionGranted,
            enabled: this.deviceOrientation.enabled,
            calibrated: this.deviceOrientation.calibrated,
            
            // Current values for debugging
            alpha: this.deviceOrientation.alpha.toFixed(1),
            beta: this.deviceOrientation.beta.toFixed(1),
            gamma: this.deviceOrientation.gamma.toFixed(1),
            
            // Processed control values
            pitch: this.deviceOrientation.pitch.toFixed(2),
            turn: this.deviceOrientation.turn.toFixed(2),
            
            // Settings
            deadzone: this.deviceOrientation.deadzone,
            sensitivity: this.deviceOrientation.sensitivity
        };
    }
    
    // Update device orientation settings
    updateOrientationSettings(settings) {
        if (settings.deadzone !== undefined) {
            this.deviceOrientation.deadzone = Math.max(0, Math.min(45, settings.deadzone));
        }
        if (settings.sensitivity !== undefined) {
            this.deviceOrientation.sensitivity = Math.max(0.1, Math.min(5.0, settings.sensitivity));
        }
    }
    
    // Setup mobile controls
    setupMobileControls() {
        if (this.isMobile) {
            this.tapHandler = new MobileTapHandler(document.body, this);
            this.setupMobileButtons();
            this.showMobileUI();
        }
    }
    
    setupMobileButtons() {
        const boostBtn = document.getElementById('mobile-boost');
        const brakeBtn = document.getElementById('mobile-brake');
        
        if (boostBtn && brakeBtn) {
            boostBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.mobileButtons.boost = true;
            });
            boostBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.mobileButtons.boost = false;
            });
            brakeBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.mobileButtons.brake = true;
            });
            brakeBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.mobileButtons.brake = false;
            });
        }
    }
    
    showMobileUI() {
        const mobileControls = document.getElementById('mobile-controls');
        if (mobileControls) {
            mobileControls.style.display = this.isMobile ? 'block' : 'none';
        }
    }
    
    triggerTouchClick(touchEvent) {
        // Convert touch to click for minesweeper interaction
        this.touchClick = {
            clientX: touchEvent.clientX,
            clientY: touchEvent.clientY,
            timestamp: Date.now()
        };
    }
    
    // Update mobile swipe state for camera control
    updateMobileSwipe(swipeDelta) {
        this.mobileSwipe.deltaX = swipeDelta.x;
        this.mobileSwipe.deltaY = swipeDelta.y;
        this.mobileSwipe.active = true;
    }
    
    // Clear mobile swipe state
    clearMobileSwipe() {
        this.mobileSwipe.deltaX = 0;
        this.mobileSwipe.deltaY = 0;
        this.mobileSwipe.active = false;
    }
    
    // Initialize mobile UI controls (legacy method for compatibility)
    initializeMobileUI() {
        // Make this instance globally accessible
        window.inputManager = this;
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupMobileUI());
        } else {
            this.setupMobileUI();
        }
    }
    
    setupMobileUI() {
        const enableBtn = document.getElementById('enable-orientation');
        const calibrateBtn = document.getElementById('calibrate-orientation');
        const statusSpan = document.getElementById('orientation-state');
        
        // Check if elements exist (in case mobile UI isn't in the HTML)
        if (!enableBtn || !statusSpan) {
            console.log('Mobile UI elements not found in DOM');
            return;
        }
        
        // Update status display
        const updateStatus = () => {
            const info = this.getOrientationInfo();
            
            if (!info.supported) {
                statusSpan.textContent = 'Not Supported';
                enableBtn.style.display = 'none';
            } else if (!info.permissionGranted) {
                statusSpan.textContent = 'Permission Needed';
                enableBtn.textContent = 'Enable Motion Controls';
                enableBtn.style.display = 'block';
            } else if (!info.enabled) {
                statusSpan.textContent = 'Ready (Disabled)';
                enableBtn.textContent = 'Enable Motion Controls';
                enableBtn.style.display = 'block';
            } else if (!info.calibrated) {
                statusSpan.textContent = 'Enabled (Not Calibrated)';
                if (calibrateBtn) calibrateBtn.style.display = 'block';
            } else {
                statusSpan.textContent = 'Active';
                enableBtn.style.display = 'none';
                if (calibrateBtn) calibrateBtn.style.display = 'block';
            }
        };
        
        // Enable orientation button
        enableBtn.addEventListener('click', async () => {
            enableBtn.textContent = 'Requesting Permission...';
            enableBtn.disabled = true;
            
            try {
                const result = await this.requestOrientationPermission();
                
                if (result.success) {
                    this.enableDeviceOrientation();
                    enableBtn.textContent = 'Motion Controls Enabled!';
                    setTimeout(() => {
                        updateStatus();
                    }, 1000);
                } else {
                    enableBtn.textContent = 'Enable Motion Controls';
                    enableBtn.disabled = false;
                }
            } catch (error) {
                enableBtn.textContent = 'Enable Motion Controls';
                enableBtn.disabled = false;
            }
        });
        
        // Calibrate button
        if (calibrateBtn) {
            calibrateBtn.addEventListener('click', () => {
                this.calibrateDeviceOrientation();
                calibrateBtn.textContent = 'Calibrated!';
                setTimeout(() => {
                    calibrateBtn.textContent = 'Recalibrate';
                }, 1000);
            });
        }
        
        // Update status every 100ms
        this.statusUpdateInterval = setInterval(updateStatus, 100);
        updateStatus();
    }
}