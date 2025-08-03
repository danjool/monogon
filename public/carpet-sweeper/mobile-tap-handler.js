export class MobileTapHandler {
    constructor(element, inputManager) {
        this.element = element;
        this.inputManager = inputManager;
        this.lastTap = 0;
        this.doubleTapWindow = 500; // ms
        
        // Swipe detection
        this.touchStart = null;
        this.touchCurrent = null;
        this.isSwipeActive = false;
        this.swipeDelta = { x: 0, y: 0 };
        this.swipeThreshold = 10; // minimum pixels to consider a swipe
        
        this.setupTapEvents();
    }
    
    setupTapEvents() {
        this.element.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.element.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.element.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    }
    
    handleTouchStart(e) {
        // Prevent default to avoid mouse events
        e.preventDefault();
        
        const now = Date.now();
        const touch = e.touches[0];
        
        // Store touch start position for swipe detection
        this.touchStart = {
            x: touch.clientX,
            y: touch.clientY,
            time: now
        };
        this.touchCurrent = { ...this.touchStart };
        this.isSwipeActive = false;
        this.swipeDelta = { x: 0, y: 0 };
        
        // Check if touch is on a button
        const isOnButton = this.isTouchOnButton(touch);
        
        // Store button status for later processing
        this.touchStartOnButton = isOnButton;
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
    
    handleTouchMove(e) {
        e.preventDefault();
        
        if (!this.touchStart) return;
        
        const touch = e.touches[0];
        this.touchCurrent = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now()
        };
        
        // Calculate movement delta
        const deltaX = this.touchCurrent.x - this.touchStart.x;
        const deltaY = this.touchCurrent.y - this.touchStart.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // If we've moved beyond threshold and not on button, start swiping
        if (distance > this.swipeThreshold && !this.touchStartOnButton) {
            this.isSwipeActive = true;
            
            // Calculate swipe delta for camera control
            this.swipeDelta.x = deltaX;
            this.swipeDelta.y = deltaY;
            
            // Update input manager with swipe data
            this.inputManager.updateMobileSwipe(this.swipeDelta);
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        
        if (!this.touchStart) return;
        
        const now = Date.now();
        const timeSinceLastTap = now - this.lastTap;
        
        // If this was a swipe, don't process as tap
        if (this.isSwipeActive) {
            // Clear swipe state
            this.inputManager.clearMobileSwipe();
        } else if (!this.touchStartOnButton) {
            // Process as potential tap/double-tap
            if (timeSinceLastTap < this.doubleTapWindow) {
                // Double tap - recalibrate orientation
                this.inputManager.calibrateDeviceOrientation();
                this.showCalibrationFeedback();
            } else {
                // Single tap - minesweeper interaction
                this.handleTapInteraction(this.touchStart);
            }
        }
        
        // Reset touch state
        this.touchStart = null;
        this.touchCurrent = null;
        this.isSwipeActive = false;
        this.swipeDelta = { x: 0, y: 0 };
        this.lastTap = now;
    }
    
    handleTapInteraction(touchPos) {
        // Convert touch to screen coordinates for minesweeper interaction
        const event = {
            clientX: touchPos.x,
            clientY: touchPos.y,
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