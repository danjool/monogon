import { Keyboard } from './keyboard.js';
import { Gamepad } from './gamepad.js';

export class InputManager {
    constructor() {
        this.keyboard = new Keyboard();
        this.gamepad = new Gamepad();
        
        this.mouseClicked = false;
        this.setupMouseEvents();
    }
    
    setupMouseEvents() {
        window.addEventListener('click', () => {
            this.mouseClicked = true;
        });
        
        window.addEventListener('resize', () => {
            this.onResize();
        });
    }
    
    update() {
        // Update gamepad state
        this.gamepad.update();
        
        // Clear single-frame events
        // (mouseClicked will be cleared by whoever consumes it)
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
        
        // Keyboard input
        if (keyState.up) input.pitch -= config.pitchSensitivity.value;
        if (keyState.down) input.pitch += config.pitchSensitivity.value;
        if (keyState.left) input.turn += config.turnInputRate.value * deltaTime;
        if (keyState.right) input.turn -= config.turnInputRate.value * deltaTime;
        
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
    
    // Get menu navigation input
    getMenuInput() {
        const keyState = this.keyboard.getState();
        const gamepadState = this.gamepad.getState();
        
        return {
            // Tab switching
            nextTab: keyState.tab || this.gamepad.wasPressed('rightBumper'),
            prevTab: keyState.shiftTab || this.gamepad.wasPressed('leftBumper'),
            
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
            
            // Click actions (mouse, gamepad A button, or bumper buttons)
            click: this.mouseClicked || this.gamepad.wasPressed('a') || 
                   this.gamepad.wasPressed('leftBumper') || this.gamepad.wasPressed('rightBumper')
        };
    }
    
    // Consume click event (call this after handling click)
    consumeClick() {
        this.mouseClicked = false;
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
}