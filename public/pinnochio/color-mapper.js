// Color Mapper - Semantic color generation for Pinocchio
export class ColorMapper {
    constructor() {
        this.dictionary = null;
        this.colorCache = new Map();
        this.reverseDict = new Map(); // English -> Italian mapping
    }
    
    updateDictionary(dictionary) {
        this.dictionary = dictionary;
        this.buildReverseMapping();
        this.colorCache.clear();
    }
    
    buildReverseMapping() {
        this.reverseDict.clear();
        
        Object.entries(this.dictionary).forEach(([italian, english]) => {
            // Handle multiple English translations separated by commas/semicolons
            const englishWords = english.toLowerCase()
                .split(/[,;]/)
                .map(word => word.trim())
                .filter(word => word.length > 0);
            
            englishWords.forEach(englishWord => {
                if (!this.reverseDict.has(englishWord)) {
                    this.reverseDict.set(englishWord, italian);
                }
            });
        });
    }
    
    getSemanticColor(word, language) {
        if (!word || !this.dictionary) return 'transparent';
        
        const normalizedWord = word.toLowerCase();
        let semanticKey = '';
        
        if (language === 'italian') {
            // For Italian words, use the English translation as semantic key
            const englishTranslation = this.dictionary[normalizedWord];
            semanticKey = englishTranslation ? englishTranslation.toLowerCase() : normalizedWord;
        } else if (language === 'english') {
            // For English words, find the Italian equivalent and use its translation
            const italianEquivalent = this.reverseDict.get(normalizedWord);
            if (italianEquivalent) {
                const englishTranslation = this.dictionary[italianEquivalent.toLowerCase()];
                semanticKey = englishTranslation ? englishTranslation.toLowerCase() : normalizedWord;
            } else {
                semanticKey = normalizedWord;
            }
        } else {
            return 'transparent';
        }
        
        // Check cache first
        if (this.colorCache.has(semanticKey)) {
            return this.colorCache.get(semanticKey);
        }
        
        // Generate deterministic color based on semantic meaning
        const color = this.generateDeterministicColor(semanticKey);
        this.colorCache.set(semanticKey, color);
        
        return color;
    }
    
    generateDeterministicColor(semanticKey) {
    let hash = 0;
    
    for (let i = 0; i < semanticKey.length; i++) {
        const char = semanticKey.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    
    // Generate SUBTLE colors for dark theme with white text
    const hue = Math.abs(hash) % 360;
    const saturation = 15 + (Math.abs(hash >> 8) % 15); // 15-30% (much more subtle)
    const lightness = 25 + (Math.abs(hash >> 16) % 15); // 25-40% (darker backgrounds)
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
    
    findSemanticPartner(word, fromLanguage) {
        if (!this.dictionary) return null;
        
        const normalizedWord = word.toLowerCase();
        
        if (fromLanguage === 'italian') {
            // Italian -> English
            const englishTranslation = this.dictionary[normalizedWord];
            if (englishTranslation) {
                return {
                    word: englishTranslation,
                    language: 'english'
                };
            }
        } else if (fromLanguage === 'english') {
            // English -> Italian
            const italianEquivalent = this.reverseDict.get(normalizedWord);
            if (italianEquivalent) {
                return {
                    word: italianEquivalent,
                    language: 'italian'
                };
            }
        }
        
        return null;
    }
    
    getCacheStats() {
        return {
            cacheSize: this.colorCache.size,
            reverseDictSize: this.reverseDict.size,
            hasDictionary: !!this.dictionary
        };
    }
    
    clearCache() {
        this.colorCache.clear();
    }
}