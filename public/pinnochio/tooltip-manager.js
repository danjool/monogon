// Tooltip Manager for Pinocchio Reader
export class TooltipManager {
    constructor() {
        this.tooltip = null;
        this.dictionary = null;
        this.isInitialized = false;
        this.activeWord = null;
        this.hideTimeout = null;
    }
    
    initialize(dictionary) {
        if (this.isInitialized) return;
        
        this.dictionary = dictionary;
        this.createTooltipElement();
        this.attachEventListeners();
        this.isInitialized = true;
        
        console.log('Tooltip Manager initialized');
    }
    
    createTooltipElement() {
        this.tooltip = document.createElement('div');
        this.tooltip.id = 'tooltip';
        this.tooltip.className = 'tooltip';
        this.tooltip.style.cssText = `
            display: none;
            position: absolute;
            background: rgba(0, 0, 0, 0.95);
            color: #fff;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 14px;
            line-height: 1.4;
            z-index: 1000;
            max-width: 250px;
            border: 1px solid #444;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            pointer-events: none;
            font-family: 'Arial', sans-serif;
        `;
        
        document.body.appendChild(this.tooltip);
    }
    
    attachEventListeners() {
        document.addEventListener('mouseover', (e) => this.handleMouseOver(e));
        document.addEventListener('mouseout', (e) => this.handleMouseOut(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // Hide tooltip when scrolling
        document.addEventListener('scroll', () => this.hideTooltip(), { passive: true });
        
        // Hide tooltip on window resize
        window.addEventListener('resize', () => this.hideTooltip());
    }
    
    handleMouseOver(e) {
        const wordElement = e.target.closest('.word[data-language="italian"]');
        
        if (wordElement && wordElement !== this.activeWord) {
            this.clearHideTimeout();
            this.activeWord = wordElement;
            this.showTooltip(wordElement);
        }
    }
    
    handleMouseOut(e) {
        const wordElement = e.target.closest('.word[data-language="italian"]');
        
        if (wordElement === this.activeWord) {
            this.hideTimeout = setTimeout(() => {
                this.hideTooltip();
            }, 150); // Small delay to prevent flickering
        }
    }
    
    handleMouseMove(e) {
        if (this.tooltip.style.display === 'block') {
            this.positionTooltip(e.clientX, e.clientY);
        }
    }
    
    showTooltip(wordElement) {
        const word = wordElement.dataset.word;
        if (!word || !this.dictionary) return;
        
        const translation = this.getTranslation(word);
        
        if (translation) {
            this.tooltip.innerHTML = this.formatTooltipContent(word, translation);
            this.tooltip.style.display = 'block';
            
            // Position tooltip at mouse location
            const rect = wordElement.getBoundingClientRect();
            this.positionTooltip(rect.left + rect.width / 2, rect.bottom);
        }
    }
    
    getTranslation(word) {
        const cleanWord = word.toLowerCase().replace(/[.,;:!?«»"'"]/g, '');
        
        // Direct dictionary lookup
        let translation = this.dictionary[cleanWord];
        
        if (translation) {
            return translation;
        }
        
        // Handle contractions
        if (cleanWord.includes("'")) {
            translation = this.handleContraction(cleanWord);
            if (translation) return translation;
        }
        
        // Return null if no translation found
        return null;
    }
    
    handleContraction(word) {
        // Simple contraction handling for modern Italian
        const contractionMap = {
            "dell'": "of the",
            "dell": "of the",
            "nell'": "in the", 
            "nell": "in the",
            "sull'": "on the",
            "sull": "on the",
            "all'": "to the",
            "dall'": "from the",
            "coll'": "with the",
            "mastr'": "master"
        };
        
        for (const [contraction, meaning] of Object.entries(contractionMap)) {
            if (word.startsWith(contraction.toLowerCase())) {
                return meaning;
            }
        }
        
        // Split at apostrophe and try to translate parts
        const parts = word.split("'");
        if (parts.length === 2) {
            const firstPart = this.dictionary[parts[0]];
            const secondPart = this.dictionary[parts[1]];
            
            if (firstPart && secondPart) {
                return `${firstPart} ${secondPart}`;
            } else if (firstPart) {
                return firstPart;
            } else if (secondPart) {
                return secondPart;
            }
        }
        
        return null;
    }
    
    formatTooltipContent(word, translation) {
        return `
            <div style="font-weight: bold; color: #e94560; margin-bottom: 4px;">
                ${word}
            </div>
            <div style="color: #fff;">
                ${translation}
            </div>
        `;
    }
    
    positionTooltip(x, y) {
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Default position: below and centered on the word
        let left = x - tooltipRect.width / 2;
        let top = y + 10;
        
        // Adjust horizontal position if tooltip goes off-screen
        if (left < 10) {
            left = 10;
        } else if (left + tooltipRect.width > viewportWidth - 10) {
            left = viewportWidth - tooltipRect.width - 10;
        }
        
        // Adjust vertical position if tooltip goes off-screen
        if (top + tooltipRect.height > viewportHeight - 10) {
            top = y - tooltipRect.height - 10; // Position above the word
        }
        
        this.tooltip.style.left = left + 'px';
        this.tooltip.style.top = top + 'px';
    }
    
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.style.display = 'none';
        }
        this.activeWord = null;
        this.clearHideTimeout();
    }
    
    clearHideTimeout() {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
    }
    
    updateDictionary(newDictionary) {
        this.dictionary = newDictionary;
    }
    
    destroy() {
        if (this.tooltip && this.tooltip.parentNode) {
            this.tooltip.parentNode.removeChild(this.tooltip);
        }
        
        this.clearHideTimeout();
        this.isInitialized = false;
        this.activeWord = null;
        this.dictionary = null;
    }
    
    // Debug method to test tooltip functionality
    testTooltip(word) {
        const translation = this.getTranslation(word);
        console.log(`Testing: "${word}" → "${translation}"`);
        return translation;
    }
}