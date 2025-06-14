export class Crosshair {
    constructor() {
        // The crosshair is handled in HTML/CSS in index.html
        this.element = document.getElementById('crosshair');
        this.lastHitTime = 0;
        this.hideTimeout = 4000; // 4 seconds in milliseconds
        this.isVisible = true;
        this.menuHidden = false; // Track if menu is hiding the crosshair
    }
    
    show() {
        this.menuHidden = false;
        if (this.element) this.element.style.display = 'block';
        this.isVisible = true;
    }
    
    hide() {
        this.menuHidden = true;
        if (this.element) this.element.style.display = 'none';
        this.isVisible = false;
    }
    
    updateVisibility(hasHit, currentTime) {
        // Don't show if menu is hiding it
        if (this.menuHidden) return;
        
        if (hasHit) {
            this.lastHitTime = currentTime;
            if (!this.isVisible) {
                if (this.element) this.element.style.display = 'block';
                this.isVisible = true;
            }
        } else {
            // Check if we should hide due to timeout
            const timeSinceLastHit = currentTime - this.lastHitTime;
            if (timeSinceLastHit > this.hideTimeout && this.isVisible) {
                if (this.element) this.element.style.display = 'none';
                this.isVisible = false;
            }
        }
    }
}