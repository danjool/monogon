// Text Utilities Module
// Provides comprehensive text processing functions for the Divine Comedy reader

import { ContextAwareContractionHandler } from '../analysis/contraction-handler.js';
import { coreDictionary } from '../data/dict-core.js';

// ----- BASIC TEXT CLEANING UTILITIES -----

/**
 * Clean Italian text by removing/normalizing special characters
 * @param {string} text - The text to clean
 * @returns {string} Cleaned text with guillemets removed
 */
export function cleanItalianText(text) {
  if (!text) return '';
  // Remove guillemets entirely
  return text.replace(/[«»]/g, '');
}

/**
 * Extract clean word and punctuation from a word
 * @param {string} word - The word to process
 * @returns {Object} Object containing cleanWord and punctuation
 */
export function extractWordParts(word) {
  const match = word.match(/^(.+?)([.,;:!?]*)$/);
  return {
    cleanWord: match ? match[1] : word,
    punctuation: match ? match[2] : ''
  };
}

// ----- CONTEXT MANAGEMENT -----

/**
 * Create context object for word processing
 * @param {Array} words - Array of words in the line
 * @param {number} wordIndex - Current word index
 * @param {Array} allLines - All text pairs in the canto
 * @param {number} lineIndex - Current line index
 * @returns {Object} Context object for contraction handling
 */
export function getWordContext(words, wordIndex, allLines = [], lineIndex = 0) {
  return {
    prevWord: words[wordIndex - 1]?.replace(/[.,;:!?«»]/g, ''),
    nextWord: words[wordIndex + 1]?.replace(/[.,;:!?«»]/g, ''),
    lineWords: words,
    wordIndex: wordIndex,
    lineIndex: lineIndex,
    allLines: allLines
  };
}

// ----- WORD EXTRACTION AND PROCESSING -----

/**
 * Extract all unique Italian words from canto data
 * @param {Object} cantoData - The canto data containing textPairs
 * @param {Object} contractionHandler - Instance of ContextAwareContractionHandler
 * @returns {Array} Array of unique words (including expanded contractions)
 */
export function extractUniqueItalianWords(cantoData, contractionHandler) {
  const uniqueWords = new Set();
  
  cantoData.textPairs.forEach((pair, lineIndex) => {
    if (!pair[0] || pair[0] === '') return; // Skip empty lines
    
    // First remove guillemets entirely, then process the line
    const italianLine = cleanItalianText(pair[0]);
    const words = italianLine.split(/\s+/);
    
    words.forEach((word, wordIndex) => {
      const context = getWordContext(words, wordIndex, cantoData.textPairs, lineIndex);
      const { cleanWord } = extractWordParts(word);
      
      uniqueWords.add(cleanWord.toLowerCase());
      
      // Handle contractions
      if (cleanWord.includes("'")) {
        const expansion = contractionHandler.expandWithContext(cleanWord, context);
        if (expansion && expansion.parts) {
          expansion.parts.forEach(part => uniqueWords.add(part.toLowerCase()));
        }
      }
    });
  });
  
  return Array.from(uniqueWords);
}

/**
 * Check if a text pair represents a stanza break
 * @param {Array} pair - Text pair from canto data
 * @returns {boolean} True if pair is a stanza break
 */
export function isStanzaBreak(pair) {
  return Array.isArray(pair) && 
         pair.length >= 3 && 
         pair[0] === "" && 
         pair[1] === "" && 
         pair[2] === "";
}

// ----- WORD ANALYSIS CLASS -----

/**
 * Word Analyzer class for analyzing words in cantos
 */
export class WordAnalyzer {
    constructor() {
        this.contractionHandler = new ContextAwareContractionHandler();
    }
    
    /**
     * Get word translation from dictionary
     * @param {string} word - The word to translate
     * @param {Object} dictionary - Dictionary to use for translation
     * @returns {string|null} Translation or null if not found
     */
    getWordTranslation(word, dictionary) {
        const translation = dictionary[word.toLowerCase()];
        return translation || null; // null indicates "Translation not available"
    }
    
    /**
     * Get translation for contraction part
     * @param {string} part - The contraction part to translate
     * @param {Object} dictionary - Dictionary to use for translation
     * @returns {string} Translation or '?' if not found
     */
    getContractionPartTranslation(part, dictionary) {
        const translation = dictionary[part.toLowerCase()];
        return translation || '?';
    }
    
    /**
     * Extract all Italian words from a canto
     * @param {Object} cantoData - The canto data containing textPairs
     * @returns {Array} Array of unique words
     */
    extractItalianWords(cantoData) {
        const words = new Set();
        
        cantoData.textPairs.forEach(([italian, english, note]) => {
            if (italian && italian.trim()) {
                // First remove guillemets entirely, then replace other punctuation with spaces
                const cleanText = cleanItalianText(italian).replace(/[.,;:!?"""''—]/g, ' ');
                const wordList = cleanText.split(/\s+/).filter(w => w.length > 0);
                
                wordList.forEach(word => {
                    words.add(word);
                });
            }
        });
        
        return Array.from(words);
    }
    
    /**
     * Analyze words using dictionary
     * @param {Array} words - Array of words to analyze
     * @param {Object} coreDictionary - Core dictionary
     * @param {Object} supplementDictionary - Supplement dictionary
     * @returns {Object} Analysis results
     */
    analyzeWords(words, coreDictionary, supplementDictionary) {
        const results = {
            redundantWords: new Map(), // Words in both dictionaries
            missingWords: [], // Words that would show "Translation not available"
            contractionAnalysis: new Map() // Contraction breakdown
        };
        
        // Combine dictionaries for lookup (supplement overrides core)
        const combinedDictionary = { ...coreDictionary, ...supplementDictionary };
        
        words.forEach(word => {
            // Check for contractions first
            if (this.contractionHandler.isContraction(word)) {
                this.analyzeContraction(word, combinedDictionary, results);
            } else {
                this.analyzeSingleWord(word, coreDictionary, supplementDictionary, combinedDictionary, results);
            }
        });
        
        return results;
    }
    
    /**
     * Analyze a contraction
     * @param {string} word - The contraction to analyze
     * @param {Object} combinedDictionary - Combined dictionary
     * @param {Object} results - Results object to update
     */
    analyzeContraction(word, combinedDictionary, results) {
        const context = { nextWord: null, prevWord: null }; // Basic context for analysis
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
            
            // If any part is missing, consider the whole contraction problematic
            if (partTranslations.includes('?')) {
                results.missingWords.push(`${word} (contraction: ${contractionInfo.expanded})`);
            }
        }
    }
    
    /**
     * Analyze a single word
     * @param {string} word - The word to analyze
     * @param {Object} coreDictionary - Core dictionary
     * @param {Object} supplementDictionary - Supplement dictionary
     * @param {Object} combinedDictionary - Combined dictionary
     * @param {Object} results - Results object to update
     */
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
    
    /**
     * Generate console report
     * @param {number} cantoNumber - The canto number
     * @param {Object} results - Analysis results
     */
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
    
    /**
     * Main analysis function
     * @param {number} cantoNumber - The canto number
     * @param {Object} cantoData - The canto data
     * @param {Object} supplementDictionary - The supplement dictionary
     * @returns {Object} Analysis results
     */
    async analyzeCanto(cantoNumber, cantoData, supplementDictionary) {
        console.log(`Starting analysis for Canto ${cantoNumber}...`);
        
        // Extract Italian words
        const italianWords = this.extractItalianWords(cantoData);
        console.log(`Found ${italianWords.length} unique Italian words`);
        
        // Analyze words
        const results = this.analyzeWords(italianWords, coreDictionary, supplementDictionary);
        
        // Generate report
        this.generateReport(cantoNumber, results);
        
        return results;
    }
}

/**
 * Analyze words in a canto
 * @param {number} cantoNumber - The canto number
 * @returns {Object|null} Analysis results or null if error
 */
export async function analyzeCantoWords(cantoNumber) {
    try {
        const analyzer = new WordAnalyzer();
        
        // Import canto data dynamically
        const cantoModule = await import(`../data/cantos/canto${cantoNumber.toString().padStart(2, '0')}.js`);
        const cantoData = cantoModule[`canto${cantoNumber.toString().padStart(2, '0')}`];
        
        // Import supplement dictionary
        const supplementModule = await import(`../data/dict-supplements/canto${cantoNumber.toString().padStart(2, '0')}-words.js`);
        const supplementDictionary = supplementModule[`canto${cantoNumber.toString().padStart(2, '0')}Supplement`];
        
        return await analyzer.analyzeCanto(cantoNumber, cantoData, supplementDictionary);
        
    } catch (error) {
        console.error(`Error analyzing canto ${cantoNumber}:`, error);
        return null;
    }
}
