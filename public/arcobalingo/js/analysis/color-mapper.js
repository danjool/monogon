// Semantic Color Mapper - Generates consistent colors based on meaning(sense)
export class ColorMapper {
    constructor(dictionary = {}) {
        this.dictionary = dictionary;
        
        this.saturation = 65;
        this.lightness = 40;
        
        this.colorCache = new Map();
    }
    
    updateDictionary(dictionary) {
        this.dictionary = dictionary;
        this.colorCache.clear();
    }
    
    getSemanticColor(word, language = 'italian') {
        const cacheKey = `${word.toLowerCase()}_${language}`;
        
        if (this.colorCache.has(cacheKey)) {
            return this.colorCache.get(cacheKey);
        }
        
        const semanticKey = this.getSemanticKey(word, language);
        
        const color = this.generateHSLColor(semanticKey);
        
        this.colorCache.set(cacheKey, color);
        
        return color;
    }
    
    getSemanticKey(word, language) {
        const cleanWord = word.toLowerCase().trim();
        
        if (language === 'italian') {
            const translation = this.dictionary[cleanWord];
            return translation || cleanWord;
        }
        
        return cleanWord;
    }
    
    generateHSLColor(semanticKey) {
        const hue = this.stringToHue(semanticKey);
        return `hsl(${hue}, ${this.saturation}%, ${this.lightness}%)`;
    }
    
    stringToHue(str) {
        let hash = 0;
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return Math.abs(hash) % 360;
    }
    
    getTranslation(word) {
        return this.dictionary[word.toLowerCase()] || null;
    }
    
    getContractionColors(parts, language = 'italian') {
        return parts.map(part => this.getSemanticColor(part, language));
    }
    
    haveSameMeaning(word1, lang1, word2, lang2) {
        const key1 = this.getSemanticKey(word1, lang1);
        const key2 = this.getSemanticKey(word2, lang2);
        return key1 === key2;
    }
    
    getSemanticEquivalents(word, language) {
        const semanticKey = this.getSemanticKey(word, language);
        const equivalents = [];
        
        if (language === 'italian') {
            equivalents.push(semanticKey);
        } else {
            Object.entries(this.dictionary).forEach(([italian, english]) => {
                if (english === semanticKey) {
                    equivalents.push(italian);
                }
            });
        }
        
        return equivalents;
    }
    
    analyzeColorDistribution(words) {
        const hueMap = new Map();
        
        words.forEach(word => {
            const semanticKey = this.getSemanticKey(word, 'italian');
            const hue = this.stringToHue(semanticKey);
            
            if (!hueMap.has(hue)) {
                hueMap.set(hue, []);
            }
            hueMap.get(hue).push({ word, semanticKey });
        });
        
        return {
            totalWords: words.length,
            uniqueHues: hueMap.size,
            collisions: Array.from(hueMap.entries())
                .filter(([hue, words]) => words.length > 1)
                .map(([hue, words]) => ({ hue, words }))
        };
    }
    
    clearCache() {
        this.colorCache.clear();
    }

    getCacheStats() {
        return {
            size: this.colorCache.size,
            entries: Array.from(this.colorCache.entries())
        };
    }
}