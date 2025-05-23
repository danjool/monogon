// Highlight Manager - Handles cross-language / cross-column word highlighting
export class HighlightManager {
    constructor() {
        this.dictionary = {};
        this.currentlyHighlighted = new Set();
        this.isActive = false;
    }
    
    initialize(dictionary) {
        this.dictionary = dictionary;
        this.attachEventListeners();
    }
    
    attachEventListeners() {
        document.addEventListener('mouseover', (e) => {
            const wordElement = this.getWordElement(e.target);
            if (wordElement) {
                this.highlightRelatedWords(wordElement);
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            const wordElement = this.getWordElement(e.target);
            if (wordElement) {
                this.clearAllHighlights();
            }
        });
        
        document.addEventListener('touchstart', (e) => {
            const wordElement = this.getWordElement(e.target);
            if (wordElement) {
                e.preventDefault();
                this.highlightRelatedWords(wordElement);
            } else {
                this.clearAllHighlights();
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
    
    highlightRelatedWords(wordElement) {
        this.clearAllHighlights();
        
        const word = wordElement.dataset.word;
        const language = wordElement.dataset.language;
        const expanded = wordElement.dataset.expanded;
        const parts = wordElement.dataset.parts;
        
        if (!word || !language) return;
        
        this.addHighlight(wordElement);
        
        if (expanded && parts) {
            this.highlightContractionParts(parts);
        } else {
            this.highlightTranslations(word, language);
        }
        
        this.isActive = true;
    }
    
    highlightContractionParts(parts) {
        const expansionParts = parts.split('|');
        
        expansionParts.forEach(part => {
            this.highlightWordInstances(part, 'italian');
            
            const translation = this.dictionary[part.toLowerCase()];
            if (translation) {
                this.highlightWordInstances(translation, 'english');
            }
        });
    }
    
    highlightTranslations(word, language) {
        if (language === 'italian') {
            this.highlightWordInstances(word, 'italian');
            
            const translation = this.dictionary[word.toLowerCase()];
            if (translation) {
                this.highlightWordInstances(translation, 'english');
            }
        } else {
            this.highlightWordInstances(word, 'english');
            
            Object.entries(this.dictionary).forEach(([italian, english]) => {
                if (english === word.toLowerCase()) {
                    this.highlightWordInstances(italian, 'italian');
                }
            });
        }
    }
    
    highlightWordInstances(word, language) {
        const selector = `.word[data-language="${language}"][data-word="${word}"]`;
        const elements = document.querySelectorAll(selector);
        
        elements.forEach(element => {
            this.addHighlight(element);
        });
    }
    
    addHighlight(element) {
        if (element && !element.classList.contains('highlighted')) {
            element.classList.add('highlighted');
            this.currentlyHighlighted.add(element);
        }
    }
    
    clearAllHighlights() {
        this.currentlyHighlighted.forEach(element => {
            if (element && element.classList) {
                element.classList.remove('highlighted');
            }
        });
        
        this.currentlyHighlighted.clear();
        this.isActive = false;
    }
    
    highlightWord(word, language) {
        this.clearAllHighlights();
        
        const mockElement = {
            dataset: { word, language }
        };
        
        this.highlightTranslations(word, language);
        this.isActive = true;
    }
    
    getHighlightedWords() {
        const words = [];
        this.currentlyHighlighted.forEach(element => {
            if (element.dataset) {
                words.push({
                    word: element.dataset.word,
                    language: element.dataset.language,
                    element: element
                });
            }
        });
        return words;
    }
    
    hasActiveHighlights() {
        return this.isActive && this.currentlyHighlighted.size > 0;
    }
    
    updateDictionary(newDictionary) {
        this.dictionary = newDictionary;
    }
    
    forceCleanup() {
        const allHighlighted = document.querySelectorAll('.word.highlighted');
        allHighlighted.forEach(element => {
            element.classList.remove('highlighted');
        });
        
        this.currentlyHighlighted.clear();
        this.isActive = false;
    }
    
    highlightSemanticGroup(semanticKey) {
        this.clearAllHighlights();
        
        Object.entries(this.dictionary).forEach(([italian, english]) => {
            if (english === semanticKey.toLowerCase()) {
                this.highlightWordInstances(italian, 'italian');
            }
        });
        
        this.highlightWordInstances(semanticKey, 'english');
        
        this.isActive = true;
    }
    
    getSemanticEquivalents(word, language) {
        const equivalents = { italian: [], english: [] };
        
        if (language === 'italian') {
            const translation = this.dictionary[word.toLowerCase()];
            if (translation) {
                equivalents.english.push(translation);
                equivalents.italian.push(word);
                
                Object.entries(this.dictionary).forEach(([italian, english]) => {
                    if (english === translation && italian !== word.toLowerCase()) {
                        equivalents.italian.push(italian);
                    }
                });
            }
        } else {
            equivalents.english.push(word);
            
            Object.entries(this.dictionary).forEach(([italian, english]) => {
                if (english === word.toLowerCase()) {
                    equivalents.italian.push(italian);
                }
            });
        }
        
        return equivalents;
    }
}