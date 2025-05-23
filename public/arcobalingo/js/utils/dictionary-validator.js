// Dictionary Validator Utility
// Analyzes cantos for dictionary redundancies and missing translations

import { ContextAwareContractionHandler } from '../analysis/contraction-handler.js';
import { extractUniqueItalianWords } from './text-utils.js';

export class DictionaryValidator {
  constructor() {
    this.contractionHandler = new ContextAwareContractionHandler();
  }
  
  /**
   * Validate words in a canto against dictionaries
   * @param {number} cantoNumber - The canto number
   * @param {Object} cantoData - The canto data containing textPairs
   * @param {Object} coreDictionary - The core dictionary
   * @param {Object} supplementDictionary - The canto-specific supplement dictionary
   * @returns {Object} Analysis results with redundancies and untranslated words
   */
  validateCantoWords(cantoNumber, cantoData, coreDictionary, supplementDictionary) {
    const allWords = extractUniqueItalianWords(cantoData, this.contractionHandler);
    
    // Find redundancies between core and supplement
    const redundantWords = this.findRedundantWords(coreDictionary, supplementDictionary);
    
    // Find words without translations
    const untranslatedWords = this.findUntranslatedWords(allWords, 
                                                        coreDictionary, 
                                                        supplementDictionary);
    
    // Log results
    this.logResults(cantoNumber, redundantWords, untranslatedWords);
    
    return {
      redundantWords,
      untranslatedWords
    };
  }
  
  /**
   * Find words that exist in both core and supplement dictionaries
   * @param {Object} coreDictionary - The core dictionary
   * @param {Object} supplementDictionary - The canto-specific supplement dictionary
   * @returns {Array} Array of redundant words with their translations
   */
  findRedundantWords(coreDictionary, supplementDictionary) {
    const redundant = [];
    const conflicts = [];
    
    Object.entries(supplementDictionary).forEach(([word, translation]) => {
      if (coreDictionary[word] !== undefined) {
        if (coreDictionary[word] === translation) {
          redundant.push({
            word,
            translation,
            type: 'redundant'
          });
        } else {
          conflicts.push({
            word,
            coreTranslation: coreDictionary[word],
            supplementTranslation: translation,
            type: 'conflict'
          });
        }
      }
    });
    
    return [...redundant, ...conflicts];
  }
  
  /**
   * Find words that have no translation in either dictionary
   * @param {Array} words - Array of unique words from the canto
   * @param {Object} coreDictionary - The core dictionary
   * @param {Object} supplementDictionary - The canto-specific supplement dictionary
   * @returns {Array} Array of untranslated words
   */
  findUntranslatedWords(words, coreDictionary, supplementDictionary) {
    const untranslated = [];
    
    words.forEach(word => {
      // Skip words that are just numbers
      if (/^\d+$/.test(word)) return;
      
      // Skip single letters (often not meaningful on their own)
      if (word.length === 1) return;
      
      if (coreDictionary[word] === undefined && 
          supplementDictionary[word] === undefined) {
        untranslated.push(word);
      }
    });
    
    return untranslated;
  }
  
  /**
   * Log validation results to console
   * @param {number} cantoNumber - The canto number
   * @param {Array} redundantWords - Array of redundant words
   * @param {Array} untranslatedWords - Array of untranslated words
   */
  logResults(cantoNumber, redundantWords, untranslatedWords) {
    console.group(`Dictionary Validation Results for Canto ${cantoNumber}`);
    
    // Log redundancies
    console.group('Redundant Words (already in core dictionary)');
    const redundantOnly = redundantWords.filter(w => w.type === 'redundant');
    console.log(`Found ${redundantOnly.length} redundant words:`);
    if (redundantOnly.length > 0) {
      console.log(redundantOnly.map(r => r.word).sort().join(', '));
    }
    console.groupEnd();
    
    // Log conflicts
    console.group('Conflicting Translations');
    const conflicts = redundantWords.filter(w => w.type === 'conflict');
    console.log(`Found ${conflicts.length} conflicts:`);
    if (conflicts.length > 0) {
      console.log(conflicts.map(c => `${c.word} (core: ${c.coreTranslation}, supplement: ${c.supplementTranslation})`).sort().join(', '));
    }
    console.groupEnd();
    
    // Log untranslated words
    console.group('Untranslated Words');
    console.log(`Found ${untranslatedWords.length} untranslated words:`);
    if (untranslatedWords.length > 0) {
      console.log(untranslatedWords.sort().join(', '));
    }
    console.groupEnd();
    
    console.groupEnd();
  }
}

export default DictionaryValidator;
