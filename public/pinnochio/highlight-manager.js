// Highlight Manager - Cross-language word highlighting for Pinocchio
export class HighlightManager {
    constructor(colorMapper) {
        this.colorMapper = colorMapper;
        this.isInitialized = false;
        this.currentHighlights = new Set();
    }
    
    initialize() {
        if (this.isInitialized) return;
        
        this.setupEventListeners();
        this.isInitialized = true;
    }
    
    setupEventListeners() {
        document.addEventListener('mouseover', (e) => {
            if (e.target.matches('.word[data-language]')) {
                this.highlightSemanticPartners(e.target);
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            if (e.target.matches('.word[data-language]')) {
                this.clearHighlights();
            }
        });
    }
    
    highlightSemanticPartners(wordElement) {
        const word = wordElement.dataset.word;
        const language = wordElement.dataset.language;
        
        if (!word || !language) return;
        
        // Clear previous highlights
        this.clearHighlights();
        
        // Highlight the hovered word
        wordElement.classList.add('highlight-source');
        this.currentHighlights.add(wordElement);
        
        // Find and highlight semantic partners
        const partner = this.colorMapper.findSemanticPartner(word, language);
        
        if (partner) {
            const partnerElements = this.findWordElements(partner.word, partner.language);
            partnerElements.forEach(element => {
                element.classList.add('highlight-target');
                this.currentHighlights.add(element);
            });
        }
        
        // Also highlight same words in the same language
        const sameLanguageElements = this.findWordElements(word, language);
        sameLanguageElements.forEach(element => {
            if (element !== wordElement) {
                element.classList.add('highlight-same');
                this.currentHighlights.add(element);
            }
        });
    }
    
    findWordElements(word, language) {
        const normalizedWord = word.toLowerCase();
        const selector = `.word[data-language="${language}"]`;
        const elements = document.querySelectorAll(selector);
        
        return Array.from(elements).filter(element => {
            const elementWord = element.dataset.word?.toLowerCase();
            return elementWord === normalizedWord;
        });
    }
    
    clearHighlights() {
        this.currentHighlights.forEach(element => {
            element.classList.remove('highlight-source', 'highlight-target', 'highlight-same');
        });
        this.currentHighlights.clear();
    }
    
    updateColorMapper(colorMapper) {
        this.colorMapper = colorMapper;
    }
    
    destroy() {
        this.clearHighlights();
        this.isInitialized = false;
    }
    
    getStats() {
        return {
            isInitialized: this.isInitialized,
            activeHighlights: this.currentHighlights.size
        };
    }
}