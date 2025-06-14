export class MenuSystem {
    constructor(configs) {
        this.configs = configs;
        this.visible = false;
        
        this.tabs = ['carpet', 'camera', 'particles', 'visuals'];
        this.currentTab = 'carpet';
        this.selectedSlider = 0;
        
        this.createElement();
        this.setupMouseEvents();
    }
    
    createElement() {
        // Create main menu container with responsive sizing
        this.element = document.createElement('div');
        this.element.id = 'options-menu';
        this.element.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.95);
            color: white;
            font-family: monospace;
            font-size: 1vw;
            display: none;
            z-index: 1000;
            overflow: hidden;
        `;
        
        document.body.appendChild(this.element);
        this.createTabHeader();
        this.createTabContent();
    }
    
    createTabHeader() {
        this.tabHeader = document.createElement('div');
        this.tabHeader.style.cssText = `
            display: flex;
            background: rgba(0, 0, 0, 0.5);
            border-bottom: 2px solid #666;
            height: 5vh;
            align-items: center;
            padding: 0 2vw;
        `;
        
        this.tabs.forEach((tab, index) => {
            const tabButton = document.createElement('div');
            tabButton.textContent = tab.charAt(0).toUpperCase() + tab.slice(1);
            tabButton.style.cssText = `
                flex: 1;
                padding: 1vh;
                text-align: center;
                cursor: pointer;
                border-right: 1px solid #444;
                background: ${tab === this.currentTab ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
                font-size: 1.2vw;
                font-weight: bold;
                transition: background 0.2s;
            `;
            
            if (index === this.tabs.length - 1) {
                tabButton.style.borderRight = 'none';
            }
            
            tabButton.addEventListener('click', () => this.switchTab(tab));
            tabButton.setAttribute('data-tab', tab);
            
            this.tabHeader.appendChild(tabButton);
        });
        
        // Add close instruction
        const closeHint = document.createElement('div');
        closeHint.textContent = 'Press B/Esc to close';
        closeHint.style.cssText = `
            padding: 1.5vh 2vw;
            color: #888;
            font-size: 1vw;
            white-space: nowrap;
        `;
        this.tabHeader.appendChild(closeHint);
        
        this.element.appendChild(this.tabHeader);
    }
    
    createTabContent() {
        this.contentArea = document.createElement('div');
        this.contentArea.style.cssText = `
            padding: 1vh 2vw;
            height: calc(95vh - 10vh);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;
        
        this.element.appendChild(this.contentArea);
        this.updateContent();
    }
    
    updateContent() {
        this.contentArea.innerHTML = '';
        
        const config = this.configs[this.currentTab];
        if (!config) return;
        
        // if it has a 'label' property, we assume use it, otherwise not
        const configKeys = Object.keys(config).filter(key => config[key].label);
        
        // Create a responsive grid container for sliders
        const sliderGrid = document.createElement('div');
        sliderGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(25vw, 1fr));
            gap: 1vh;
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding-right: 1vw;
            margin-bottom: 1vh;
        `;
        
        configKeys.forEach((key, index) => {
            const param = config[key];
            const sliderContainer = document.createElement('div');
            sliderContainer.style.cssText = `
                padding: 1vh;
                background: ${index === this.selectedSlider ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
                border-radius: 0.5vh;
                border: 2px solid ${index === this.selectedSlider ? '#666' : 'transparent'};
                transition: all 0.2s;
            `;
            sliderContainer.setAttribute('data-slider-index', index);
            
            // Label
            const label = document.createElement('div');
            label.textContent = `${param.label}: ${param.value.toFixed(3)}`;
            label.style.cssText = `
                margin-bottom: 1vh;
                font-size: 0.8vw;
            `;
            
            // Slider
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = param.min;
            slider.max = param.max;
            slider.step = param.step;
            slider.value = param.value;
            slider.style.cssText = `
                width: 100%;
                height: 0.5vh;
                -webkit-appearance: none;
                cursor: pointer;
            `;
            
            // Add custom slider styles
            const styleId = `slider-styles-${this.currentTab}-${index}`;
            if (!document.getElementById(styleId)) {
                const style = document.createElement('style');
                style.id = styleId;
                style.textContent = `
                    #options-menu input[type="range"]::-webkit-slider-track {
                        width: 100%;
                        height: 0.3vh;
                        background: #333;
                        border-radius: 0.5vh;
                    }
                    #options-menu input[type="range"]::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        appearance: none;
                        width: 1.5vh;
                        height: 1.5vh;
                        background: #888;
                        border-radius: 50%;
                        cursor: pointer;
                    }
                    #options-menu input[type="range"]:hover::-webkit-slider-thumb {
                        background: #aaa;
                    }
                    #options-menu input[type="range"]::-moz-range-track {
                        width: 100%;
                        height: 0.3vh;
                        background: #333;
                        border-radius: 0.5vh;
                    }
                    #options-menu input[type="range"]::-moz-range-thumb {
                        width: 1.5vh;
                        height: 1.5vh;
                        background: #888;
                        border-radius: 50%;
                        border: none;
                        cursor: pointer;
                    }
                    #options-menu input[type="range"]:hover::-moz-range-thumb {
                        background: #aaa;
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Update parameter and label on change
            slider.addEventListener('input', (e) => {
                const newValue = parseFloat(e.target.value);
                param.value = newValue;
                label.textContent = `${param.label}: ${newValue.toFixed(3)}`;
            });
            
            slider.setAttribute('data-param-key', key);
            
            sliderContainer.appendChild(label);
            sliderContainer.appendChild(slider);
            sliderGrid.appendChild(sliderContainer);
        });
        
        this.contentArea.appendChild(sliderGrid);
    }
    
    setupMouseEvents() {
        // Handle mouse wheel for slider adjustment
        this.element.addEventListener('wheel', (e) => {
            if (!this.visible) return;
            
            const slider = this.getCurrentSlider();
            if (slider) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -1 : 1;
                const currentValue = parseFloat(slider.value);
                const step = parseFloat(slider.step);
                const newValue = Math.max(
                    parseFloat(slider.min), 
                    Math.min(parseFloat(slider.max), currentValue + delta * step)
                );
                
                slider.value = newValue;
                slider.dispatchEvent(new Event('input'));
            }
        });
    }
    
    switchTab(tabName) {
        if (this.tabs.includes(tabName)) {
            this.currentTab = tabName;
            this.selectedSlider = 0;
            
            // Update tab header visual
            const tabButtons = this.tabHeader.querySelectorAll('[data-tab]');
            tabButtons.forEach(button => {
                const isActive = button.getAttribute('data-tab') === tabName;
                button.style.background = isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent';
            });
            
            this.updateContent();
        }
    }
    
    getCurrentSlider() {
        return this.contentArea.querySelector(`[data-slider-index="${this.selectedSlider}"] input`);
    }
    
    handleMenuInput(input) {
        if (!this.visible) return;
        
        // Tab switching
        if (input.nextTab) {
            const currentIndex = this.tabs.indexOf(this.currentTab);
            const nextIndex = (currentIndex + 1) % this.tabs.length;
            this.switchTab(this.tabs[nextIndex]);
        }
        
        if (input.prevTab) {
            const currentIndex = this.tabs.indexOf(this.currentTab);
            const prevIndex = (currentIndex - 1 + this.tabs.length) % this.tabs.length;
            this.switchTab(this.tabs[prevIndex]);
        }
        
        // Slider navigation
        const config = this.configs[this.currentTab];
        const configKeys = Object.keys(config);
        const numSliders = configKeys.length;
        
        // Calculate actual grid columns by measuring the DOM
        const sliderGrid = this.contentArea.querySelector('div[style*="grid-template-columns"]');
        let columns = 3; // Default fallback
        
        if (sliderGrid && sliderGrid.children.length > 0) {
            // Get the computed style to see actual column count
            const gridStyle = window.getComputedStyle(sliderGrid);
            const gridCols = gridStyle.gridTemplateColumns.split(' ').length;
            if (gridCols > 0 && gridCols < 10) { // Sanity check
                columns = gridCols;
            } else {
                // Fallback: measure actual layout
                const firstChild = sliderGrid.children[0];
                const secondChild = sliderGrid.children[1];
                if (firstChild && secondChild) {
                    const firstRect = firstChild.getBoundingClientRect();
                    const secondRect = secondChild.getBoundingClientRect();
                    // If second item is on same row as first, we have multiple columns
                    if (Math.abs(firstRect.top - secondRect.top) < 10) {
                        // Count items in first row
                        columns = 1;
                        for (let i = 1; i < sliderGrid.children.length; i++) {
                            const childRect = sliderGrid.children[i].getBoundingClientRect();
                            if (Math.abs(firstRect.top - childRect.top) < 10) {
                                columns++;
                            } else {
                                break;
                            }
                        }
                    }
                }
            }
        }
        const rows = Math.ceil(numSliders / columns);
        
        if (input.down) {
            // Move down one row (add columns to index)
            const newIndex = this.selectedSlider + columns;
            if (newIndex < numSliders) {
                this.selectedSlider = newIndex;
            } else {
                // Wrap to top of same column
                const currentCol = this.selectedSlider % columns;
                this.selectedSlider = currentCol;
            }
            this.updateContent();
        }
        
        if (input.up) {
            // Move up one row (subtract columns from index)
            const newIndex = this.selectedSlider - columns;
            if (newIndex >= 0) {
                this.selectedSlider = newIndex;
            } else {
                // Wrap to bottom of same column
                const currentCol = this.selectedSlider % columns;
                const lastRowStartIndex = Math.floor((numSliders - 1) / columns) * columns;
                const targetIndex = lastRowStartIndex + currentCol;
                this.selectedSlider = Math.min(targetIndex, numSliders - 1);
            }
            this.updateContent();
        }
        
        if (input.right) {
            // Move right within row
            this.selectedSlider = (this.selectedSlider + 1) % numSliders;
            this.updateContent();
        }
        
        if (input.left) {
            // Move left within row
            this.selectedSlider = (this.selectedSlider - 1 + numSliders) % numSliders;
            this.updateContent();
        }
        
        // Value adjustment with gamepad right stick or triggers
        const slider = this.getCurrentSlider();
        if (slider && (Math.abs(input.adjustValue) > 0.05 || Math.abs(input.adjustValueTriggers) > 0.05)) {
            let adjustmentValue = 0;
            
            // Right stick is faster than triggers
            if (Math.abs(input.adjustValue) > 0.05) {
                adjustmentValue = input.adjustValue * 2.0; // Stick is 2x faster
            } else if (Math.abs(input.adjustValueTriggers) > 0.05) {
                adjustmentValue = input.adjustValueTriggers * 1.0; // Triggers baseline speed
            }
            
            const currentValue = parseFloat(slider.value);
            const step = parseFloat(slider.step);
            
            // Direct step-based adjustment (can be positive or negative)
            const sensitivity = 0.8;
            const deltaValue = adjustmentValue * sensitivity * step;
            
            const newValue = Math.max(
                parseFloat(slider.min),
                Math.min(parseFloat(slider.max), currentValue + deltaValue)
            );
            
            slider.value = newValue;
            slider.dispatchEvent(new Event('input'));
        }
    }
    
    show() {
        this.visible = true;
        this.element.style.display = 'block';
    }
    
    hide() {
        this.visible = false;
        this.element.style.display = 'none';
    }
    
    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    isVisible() {
        return this.visible;
    }
}