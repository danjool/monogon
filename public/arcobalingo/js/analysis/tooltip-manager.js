import { ContextAwareContractionHandler } from './contraction-handler.js';

export class TooltipManager {
    constructor() {
        this.tooltip = null;
        this.dictionary = {};
        this.contractionHandler = new ContextAwareContractionHandler();
        this.isVisible = false;
        this.currentWord = null;
    }
    
    initialize(dictionary) {
        this.dictionary = dictionary;
        this.tooltip = document.getElementById('tooltip');
        
        if (!this.tooltip) {
            console.error('Tooltip element not found');
            return;
        }
        
        this.attachEventListeners();
    }
    
    attachEventListeners() {
        document.addEventListener('mouseover', (e) => {
            const wordElement = this.getWordElement(e.target);
            if (wordElement) {
                this.showTooltip(wordElement, e);
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            const wordElement = this.getWordElement(e.target);
            if (wordElement) {
                this.hideTooltip();
            }
        });
        
        document.addEventListener('scroll', () => {
            if (this.isVisible) {
                this.hideTooltip();
            }
        });
        
        window.addEventListener('resize', () => {
            if (this.isVisible) {
                this.hideTooltip();
            }
        });
    }
    
    getWordElement(element) {
        if (element.classList?.contains('word')) {
            return element;
        }
        
        if (element.parentElement?.classList?.contains('word')) {
            return element.parentElement;
        }
        
        return null;
    }
    
    showTooltip(wordElement, event) {
        if (!this.tooltip) return;
        
        const word = wordElement.dataset.word;
        const language = wordElement.dataset.language;
        const expanded = wordElement.dataset.expanded;
        const parts = wordElement.dataset.parts;
        
        if (!word || !language) return;
        
        this.currentWord = { word, language, expanded, parts };
        
        const content = this.generateTooltipContent(word, language, expanded, parts);
        
        this.tooltip.innerHTML = content;
        
        this.positionTooltip(wordElement);
        
        this.tooltip.style.display = 'block';
        this.isVisible = true;
    }
    
    hideTooltip() {
        if (!this.tooltip) return;
        
        this.tooltip.style.display = 'none';
        this.isVisible = false;
        this.currentWord = null;
    }
    
    generateTooltipContent(word, language, expanded, parts) {
        let content = `<strong>${word}</strong><br>`;
        
        if (expanded && parts) {
            content += this.generateContractionContent(expanded, parts);
        } else {
            content += this.generateRegularWordContent(word, language);
        }
        
        return content;
    }
    
    generateContractionContent(expanded, parts) {
        let content = `<em>Contraction of:</em> ${expanded}<br>`;
        
        const expansionParts = parts.split('|');
        if (expansionParts.length > 1) {
            content += `<em>Parts:</em><br>`;
            expansionParts.forEach(part => {
                const translation = this.dictionary[part.toLowerCase()];
                content += `• ${part} → ${translation || '?'}<br>`;
            });
        }
        
        return content;
    }
    
    generateRegularWordContent(word, language) {
        if (language === 'italian') {
            const translation = this.dictionary[word.toLowerCase()];
            if (translation) {
                return `<em>English:</em> ${translation}`;
            } else {
                return `<em>Translation not available</em>`;
            }
        } else {
            const italianWords = this.findItalianEquivalents(word);
            
            if (italianWords.length > 0) {
                return `<em>Italian:</em> ${italianWords.join(', ')}`;
            } else {
                return `<em>No Italian equivalent found</em>`;
            }
        }
    }
    
    findItalianEquivalents(englishWord) {
        const equivalents = [];
        const lowerWord = englishWord.toLowerCase();
        
        Object.entries(this.dictionary).forEach(([italian, english]) => {
            if (english === lowerWord) {
                equivalents.push(italian);
            }
        });
        
        return equivalents;
    }
    
    positionTooltip(wordElement) {
        if (!this.tooltip) return;
        
        const rect = wordElement.getBoundingClientRect();
        
        this.tooltip.style.visibility = 'hidden';
        this.tooltip.style.display = 'block';
        
        const tooltipRect = this.tooltip.getBoundingClientRect();
        
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        let top = rect.top - tooltipRect.height - 10;
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        if (left < 10) {
            left = 10;
        } else if (left + tooltipRect.width > viewportWidth - 10) {
            left = viewportWidth - tooltipRect.width - 10;
        }
        
        if (top < 10) {
            top = rect.bottom + 10;
            
            this.tooltip.classList.add('below');
        } else {
            this.tooltip.classList.remove('below');
        }
        
        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.visibility = 'visible';
    }
    
    updateDictionary(newDictionary) {
        this.dictionary = newDictionary;
        
        if (this.isVisible && this.currentWord) {
            const { word, language, expanded, parts } = this.currentWord;
            const content = this.generateTooltipContent(word, language, expanded, parts);
            if (this.tooltip) {
                this.tooltip.innerHTML = content;
            }
        }
    }
    
    showTooltipForWord(word, language, element) {
        const mockWordElement = {
            dataset: { word, language },
            getBoundingClientRect: () => element.getBoundingClientRect()
        };
        
        this.showTooltip(mockWordElement);
    }
    
    isTooltipVisible() {
        return this.isVisible;
    }
    
    getCurrentTooltipInfo() {
        return this.currentWord;
    }
}