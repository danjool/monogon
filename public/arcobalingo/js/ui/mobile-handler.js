// Mobile Handler - Manages swipe navigation and mobile interactions
export class MobileHandler {
    constructor() {
        this.currentColumn = 0;
        this.totalColumns = 3; // Italian, English, Notes
        this.isInitialized = false;
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.swipeThreshold = 50; // Minimum distance for swipe
        this.isDragging = false;
    }
    
    initialize() {
        if (this.isInitialized) return;
        
        this.setupSwipeHandlers();
        this.updateIndicators();
        this.isInitialized = true;
    }
    
    setupSwipeHandlers() {
        const container = document.getElementById('text-container');
        if (!container) return;
        
        // Touch events for mobile
        container.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        container.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, { passive: true });
        
        // Mouse events for desktop testing
        container.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.touchStartX = e.clientX;
            e.preventDefault();
        });
        
        container.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            e.preventDefault();
        });
        
        container.addEventListener('mouseup', (e) => {
            if (!this.isDragging) return;
            this.isDragging = false;
            this.touchEndX = e.clientX;
            this.handleSwipe();
        });
        
        container.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    handleSwipe() {
        const diff = this.touchStartX - this.touchEndX;
        
        if (Math.abs(diff) < this.swipeThreshold) return;
        
        if (diff > 0) {
            this.nextColumn();
        } else {
            this.previousColumn();
        }
    }
    
    nextColumn() {
        if (this.currentColumn < this.totalColumns - 1) {
            this.switchToColumn(this.currentColumn + 1);
        }
    }
    
    previousColumn() {
        if (this.currentColumn > 0) {
            this.switchToColumn(this.currentColumn - 1);
        }
    }
    
    switchToColumn(columnIndex) {
        if (columnIndex < 0 || columnIndex >= this.totalColumns) return;
        
        document.querySelectorAll('.column-content').forEach(col => {
            col.classList.remove('active');
        });
        
        const selectedColumn = document.querySelector(`.column-content[data-column="${columnIndex}"]`);
        if (selectedColumn) {
            selectedColumn.classList.add('active');
            this.currentColumn = columnIndex;
            this.updateIndicators();
            
            this.announceColumnChange(columnIndex);
        }
    }
    
    updateIndicators() {
        document.querySelectorAll('.dot').forEach(dot => {
            dot.classList.remove('active');
        });
        
        const activeDot = document.querySelector(`.dot[data-column="${this.currentColumn}"]`);
        if (activeDot) {
            activeDot.classList.add('active');
        }
        
        const leftArrow = document.querySelector('.indicator.left');
        const rightArrow = document.querySelector('.indicator.right');
        
        if (leftArrow) {
            leftArrow.classList.toggle('active', this.currentColumn > 0);
        }
        
        if (rightArrow) {
            rightArrow.classList.toggle('active', this.currentColumn < this.totalColumns - 1);
        }
    }
    
    announceColumnChange(columnIndex) {
        const columnNames = ['Italian', 'English', 'Notes'];
        const columnName = columnNames[columnIndex] || 'Unknown';
        
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        announcement.style.width = '1px';
        announcement.style.height = '1px';
        announcement.style.overflow = 'hidden';
        announcement.textContent = `Switched to ${columnName} column`;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
    
    goToColumn(columnIndex) {
        this.switchToColumn(columnIndex);
    }
    
    getCurrentColumn() {
        const columnNames = ['italian', 'english', 'notes'];
        return {
            index: this.currentColumn,
            name: columnNames[this.currentColumn]
        };
    }
    
    reset() {
        this.switchToColumn(0);
    }
    
    setSwipeEnabled(enabled) {
        const container = document.getElementById('text-container');
        if (!container) return;
        
        if (enabled) {
            container.style.touchAction = 'pan-y';
        } else {
            container.style.touchAction = 'auto';
        }
    }
    
    handleOrientationChange() {
        setTimeout(() => {
            this.updateIndicators();
        }, 100);
    }
    
    destroy() {
        const container = document.getElementById('text-container');
        if (container) {
            container.replaceWith(container.cloneNode(true));
        }
        
        this.isInitialized = false;
    }
    
    getSwipeStats() {
        return {
            currentColumn: this.currentColumn,
            totalColumns: this.totalColumns,
            isInitialized: this.isInitialized,
            swipeThreshold: this.swipeThreshold
        };
    }
    
    setSwipeThreshold(threshold) {
        this.swipeThreshold = Math.max(10, Math.min(200, threshold));
    }
}
