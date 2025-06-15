export class Keyboard {
    constructor() {
        this.keys = {
            // Movement (arrow keys for menu navigation)
            left: false,
            right: false,
            up: false,
            down: false,
            
            // WASD for camera controls
            w: false,
            a: false,
            s: false,
            d: false,
            
            // Throttle controls
            q: false,
            e: false,
            
            // Special actions
            space: false,
            
            // Menu navigation
            tab: false,
            shiftTab: false,
            enter: false,
            escape: false,
            
            // Letters
            r: false
        };
        
        this.bindEvents();
    }
    
    bindEvents() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }
    
    handleKeyDown(e) {
        switch(e.key) {
            case 'ArrowLeft':
                this.keys.left = true;
                e.preventDefault();
                break;
            case 'ArrowRight':
                this.keys.right = true;
                e.preventDefault();
                break;
            case 'ArrowUp':
                this.keys.up = true;
                e.preventDefault();
                break;
            case 'ArrowDown':
                this.keys.down = true;
                e.preventDefault();
                break;
            case ' ':
                this.keys.space = true;
                e.preventDefault();
                break;
            case 'Tab':
                if (e.shiftKey) {
                    this.keys.shiftTab = true;
                } else {
                    this.keys.tab = true;
                }
                e.preventDefault();
                break;
            case 'Enter':
                this.keys.enter = true;
                e.preventDefault();
                break;
            case 'Escape':
                this.keys.escape = true;
                e.preventDefault();
                break;
            case 'r':
            case 'R':
                this.keys.r = true;
                break;
            case 'w':
            case 'W':
                this.keys.w = true;
                e.preventDefault();
                break;
            case 'a':
            case 'A':
                this.keys.a = true;
                e.preventDefault();
                break;
            case 's':
            case 'S':
                this.keys.s = true;
                e.preventDefault();
                break;
            case 'd':
            case 'D':
                this.keys.d = true;
                e.preventDefault();
                break;
            case 'q':
            case 'Q':
                this.keys.q = true;
                e.preventDefault();
                break;
            case 'e':
            case 'E':
                this.keys.e = true;
                e.preventDefault();
                break;
        }
    }
    
    handleKeyUp(e) {
        switch(e.key) {
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'ArrowRight':
                this.keys.right = false;
                break;
            case 'ArrowUp':
                this.keys.up = false;
                break;
            case 'ArrowDown':
                this.keys.down = false;
                break;
            case ' ':
                this.keys.space = false;
                break;
            case 'Tab':
                this.keys.tab = false;
                this.keys.shiftTab = false;
                break;
            case 'Enter':
                this.keys.enter = false;
                break;
            case 'Escape':
                this.keys.escape = false;
                break;
            case 'r':
            case 'R':
                this.keys.r = false;
                break;
            case 'w':
            case 'W':
                this.keys.w = false;
                break;
            case 'a':
            case 'A':
                this.keys.a = false;
                break;
            case 's':
            case 'S':
                this.keys.s = false;
                break;
            case 'd':
            case 'D':
                this.keys.d = false;
                break;
            case 'q':
            case 'Q':
                this.keys.q = false;
                break;
            case 'e':
            case 'E':
                this.keys.e = false;
                break;
        }
    }
    
    // Get current key states
    getState() {
        return { ...this.keys };
    }
    
    // Check if a key was just pressed (for single-frame events)
    wasPressed(key) {
        return this.keys[key];
    }
}