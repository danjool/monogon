export class Gamepad {
    constructor() {
        this.active = false;
        this.deadzone = 0.15;
        
        this.state = {
            // Analog sticks
            leftStickX: 0,
            leftStickY: 0,
            rightStickX: 0,
            rightStickY: 0,
            
            // Triggers
            leftTrigger: 0,
            rightTrigger: 0,
            
            // Buttons (current frame)
            a: false,
            b: false,
            x: false,
            y: false,
            leftBumper: false,
            rightBumper: false,
            select: false,
            start: false,
            
            // D-pad
            dpadUp: false,
            dpadDown: false,
            dpadLeft: false,
            dpadRight: false
        };
        
        // Previous frame button states for edge detection
        this.previousState = { ...this.state };
        
        this.setupEvents();
    }
    
    setupEvents() {
        window.addEventListener("gamepadconnected", (e) => {
            console.log("Gamepad connected:", e.gamepad.id);
            this.active = true;
        });
        
        window.addEventListener("gamepaddisconnected", (e) => {
            console.log("Gamepad disconnected:", e.gamepad.id);
            this.active = false;
        });
    }
    
    update() {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        let foundGamepad = false;
        
        // Store previous state for button press detection
        this.previousState = { ...this.state };
        
        for (let i = 0; i < gamepads.length; i++) {
            const gp = gamepads[i];
            if (gp && gp.connected) {
                this.updateFromGamepad(gp);
                foundGamepad = true;
                break;
            }
        }
        
        this.active = foundGamepad;
        
        if (!foundGamepad) {
            // Reset state if no gamepad
            this.resetState();
        }
    }
    
    updateFromGamepad(gp) {
        // Analog sticks with deadzone
        this.state.leftStickX = this.applyDeadzone(gp.axes[0] || 0);
        this.state.leftStickY = this.applyDeadzone(gp.axes[1] || 0);
        this.state.rightStickX = this.applyDeadzone(gp.axes[2] || 0);
        this.state.rightStickY = this.applyDeadzone(gp.axes[3] || 0);
        
        // Triggers
        this.state.leftTrigger = gp.buttons[6] ? gp.buttons[6].value : 0;
        this.state.rightTrigger = gp.buttons[7] ? gp.buttons[7].value : 0;
        
        // Face buttons
        this.state.a = gp.buttons[0] ? gp.buttons[0].pressed : false;
        this.state.b = gp.buttons[1] ? gp.buttons[1].pressed : false;
        this.state.x = gp.buttons[2] ? gp.buttons[2].pressed : false;
        this.state.y = gp.buttons[3] ? gp.buttons[3].pressed : false;
        
        // Shoulder buttons
        this.state.leftBumper = gp.buttons[4] ? gp.buttons[4].pressed : false;
        this.state.rightBumper = gp.buttons[5] ? gp.buttons[5].pressed : false;
        
        // Select/Start (varies by controller)
        this.state.select = gp.buttons[8] ? gp.buttons[8].pressed : false;
        this.state.start = gp.buttons[9] ? gp.buttons[9].pressed : false;
        
        // D-pad
        this.state.dpadUp = gp.buttons[12] ? gp.buttons[12].pressed : false;
        this.state.dpadDown = gp.buttons[13] ? gp.buttons[13].pressed : false;
        this.state.dpadLeft = gp.buttons[14] ? gp.buttons[14].pressed : false;
        this.state.dpadRight = gp.buttons[15] ? gp.buttons[15].pressed : false;
    }
    
    applyDeadzone(value) {
        return Math.abs(value) > this.deadzone ? value : 0;
    }
    
    resetState() {
        Object.keys(this.state).forEach(key => {
            if (typeof this.state[key] === 'number') {
                this.state[key] = 0;
            } else {
                this.state[key] = false;
            }
        });
    }
    
    // Get current state
    getState() {
        return { ...this.state };
    }
    
    // Check if button was just pressed this frame
    wasPressed(button) {
        return this.state[button] && !this.previousState[button];
    }
    
    // Check if button was just released this frame
    wasReleased(button) {
        return !this.state[button] && this.previousState[button];
    }
    
    // Check if button is currently held down
    isPressed(button) {
        return this.state[button];
    }
    
    isActive() {
        return this.active;
    }
}