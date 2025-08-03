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
        this.element.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    }
    
    handleTouchStart(e) {
        // Prevent default to avoid mouse events
        e.preventDefault();
        
        const now = Date.now();
        const timeSinceLastTap = now - this.lastTap;
        const touch = e.touches[0];
        
        // Check if touch is on a button
        const isOnButton = this.isTouchOnButton(touch);
        
        if (timeSinceLastTap < this.doubleTapWindow && !isOnButton) {
            // Double tap on empty area - recalibrate orientation
            this.inputManager.calibrateDeviceOrientation();
            this.showCalibrationFeedback();
        } else if (!isOnButton) {
            // Single tap on empty area - store for potential minesweeper interaction
            this.handleTapInteraction(touch);
        }
        // If touch is on button, let the button handle it (no minesweeper interaction)
        
        this.lastTap = now;
    }
    
    isTouchOnButton(touch) {
        // Get the element at the touch point
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        
        // Check if the element or any parent is a mobile button
        let current = element;
        while (current) {
            if (current.classList && current.classList.contains('mobile-btn')) {
                return true;
            }
            current = current.parentElement;
        }
        
        return false;
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
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
            font-family: monospace;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 2000);
    }
}