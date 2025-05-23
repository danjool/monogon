// Word Analysis Utility - Uses exact same logic as TooltipManager
import { ContextAwareContractionHandler } from '../analysis/contraction-handler.js';
import { coreDictionary } from '../data/dict-core.js';

export class WordAnalyzer {
    constructor() {
        this.contractionHandler = new ContextAwareContractionHandler();
    }
    
    getWordTranslation(word, dictionary) {
        const translation = dictionary[word.toLowerCase()];
        return translation || null; // null indicates "Translation not available"
    }
    
    // Check if a contraction part has translation
    getContractionPartTranslation(part, dictionary) {
        const translation = dictionary[part.toLowerCase()];
        return translation || '?';
    }
    
    extractItalianWords(cantoData) {
        const words = new Set();
        
        cantoData.textPairs.forEach(([italian, english, note]) => {
            if (italian && italian.trim()) {
                // First remove guillemets (old italian quotation marks) entirely, then replace other punctuation with spaces
                const cleanText = italian.replace(/[«»]/g, '').replace(/[.,;:!?"""''—]/g, ' ');
                const wordList = cleanText.split(/\s+/).filter(w => w.length > 0);
                
                wordList.forEach(word => {
                    words.add(word);
                });
            }
        });
        
        return Array.from(words);
    }
    
    analyzeWords(words, coreDictionary, supplementDictionary) {
        const results = {
            redundantWords: new Map(), // Words in both dictionaries
            missingWords: [], // Words that would show "Translation not available"
            contractionAnalysis: new Map() // Contraction breakdown
        };
        
        const combinedDictionary = { ...coreDictionary, ...supplementDictionary };
        
        words.forEach(word => {
            if (this.contractionHandler.isContraction(word)) {
                this.analyzeContraction(word, combinedDictionary, results);
            } else {
                this.analyzeSingleWord(word, coreDictionary, supplementDictionary, combinedDictionary, results);
            }
        });
        
        return results;
    }
    
    analyzeContraction(word, combinedDictionary, results) {
        const context = { nextWord: null, prevWord: null };
        const contractionInfo = this.contractionHandler.expandWithContext(word, context);
        
        if (contractionInfo && contractionInfo.parts) {
            const parts = contractionInfo.parts;
            const partTranslations = parts.map(part => 
                this.getContractionPartTranslation(part, combinedDictionary)
            );
            
            results.contractionAnalysis.set(word, {
                expanded: contractionInfo.expanded,
                parts: parts,
                translations: partTranslations,
                hasUntranslated: partTranslations.includes('?')
            });
            
            if (partTranslations.includes('?')) {
                results.missingWords.push(`${word} (contraction: ${contractionInfo.expanded})`);
            }
        }
    }
    
    analyzeSingleWord(word, coreDictionary, supplementDictionary, combinedDictionary, results) {
        const coreTranslation = this.getWordTranslation(word, coreDictionary);
        const supplementTranslation = this.getWordTranslation(word, supplementDictionary);
        const combinedTranslation = this.getWordTranslation(word, combinedDictionary);
        
        // Check for redundancy (word in both dictionaries)
        if (coreTranslation && supplementTranslation) {
            results.redundantWords.set(word, {
                core: coreTranslation,
                supplement: supplementTranslation,
                match: coreTranslation === supplementTranslation
            });
        }
        
        // Check for missing translation (would show "Translation not available")
        if (!combinedTranslation) {
            results.missingWords.push(word);
        }
    }
    
    // Generate js console report
    generateReport(cantoNumber, results) {
        console.log(`\n=== CANTO ${cantoNumber} WORD ANALYSIS ===`);
        
        console.log(`\n📊 SUMMARY:`);
        console.log(`- Redundant words: ${results.redundantWords.size}`);
        console.log(`- Missing words: ${results.missingWords.length}`);
        console.log(`- Contractions analyzed: ${results.contractionAnalysis.size}`);
        
        if (results.redundantWords.size > 0) {
            console.log(`\n🔄 REDUNDANT WORDS (in both core & supplement):`);
            results.redundantWords.forEach((translations, word) => {
                const match = translations.match ? '✓' : '⚠️';
                console.log(`- ${word}: core="${translations.core}" | supplement="${translations.supplement}" ${match}`);
            });
        }
        
        if (results.missingWords.length > 0) {
            console.log(`\n❌ MISSING WORDS (would show "Translation not available"):`);
            results.missingWords.forEach(word => {
                console.log(`- ${word}`);
            });
        }
        
        if (results.contractionAnalysis.size > 0) {
            console.log(`\n🔗 CONTRACTION ANALYSIS:`);
            results.contractionAnalysis.forEach((info, word) => {
                const status = info.hasUntranslated ? '❌' : '✅';
                console.log(`- ${word} → ${info.expanded} ${status}`);
                info.parts.forEach((part, index) => {
                    const translation = info.translations[index];
                    const partStatus = translation === '?' ? '❌' : '✅';
                    console.log(`  • ${part} → ${translation} ${partStatus}`);
                });
            });
        }
        
        console.log(`\n=== END ANALYSIS ===\n`);
    }
    
    async analyzeCanto(cantoNumber, cantoData, supplementDictionary) {
        console.log(`Starting analysis for Canto ${cantoNumber}...`);
        
        const italianWords = this.extractItalianWords(cantoData);
        console.log(`Found ${italianWords.length} unique Italian words`);
        
        const results = this.analyzeWords(italianWords, coreDictionary, supplementDictionary);
        
        this.generateReport(cantoNumber, results);
        
        return results;
    }
}

export async function analyzeCantoWords(cantoNumber) {
    try {
        const analyzer = new WordAnalyzer();
        
        const cantoModule = await import(`../data/cantos/canto${cantoNumber.toString().padStart(2, '0')}.js`);
        const cantoData = cantoModule[`canto${cantoNumber.toString().padStart(2, '0')}`];
        
        const supplementModule = await import(`../data/dict-supplements/canto${cantoNumber.toString().padStart(2, '0')}-words.js`);
        const supplementDictionary = supplementModule[`canto${cantoNumber.toString().padStart(2, '0')}Words`];
        
        return await analyzer.analyzeCanto(cantoNumber, cantoData, supplementDictionary);
        
    } catch (error) {
        console.error(`Error analyzing canto ${cantoNumber}:`, error);
        return null;
    }
}
