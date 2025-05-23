// Text Processing Utility Module
// Provides shared text processing functions for the application

/**
 * Extract clean word and punctuation from a word
 * @param {string} word - The word to process
 * @returns {Object} Object containing cleanWord and punctuation
 */
export function extractWordParts(word) {
  const match = word.match(/^(.+?)([.,;:!?«»]*)$/);
  return {
    cleanWord: match ? match[1] : word,
    punctuation: match ? match[2] : ''
  };
}

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
    
    const italianLine = pair[0];
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
