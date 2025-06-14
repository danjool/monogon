export class Keyboard {
    constructor() {
        this.keys = {
            // Movement
            left: false,
            right: false,
            up: false,
            down: false,
            
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