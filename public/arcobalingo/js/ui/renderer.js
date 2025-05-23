// Text Rendering Engine - Handles both mobile and desktop text rendering
import { ColorMapper } from '../analysis/color-mapper.js';
import { ContextAwareContractionHandler } from '../analysis/contraction-handler.js';
import { extractWordParts, getWordContext, isStanzaBreak, cleanItalianText } from '../utils/text-utils.js';

export class Renderer {
    constructor() {
        this.colorMapper = new ColorMapper();
        this.contractionHandler = new ContextAwareContractionHandler();
        this.container = null;
    }
    
    initialize() {
        this.container = document.getElementById('text-container');
        if (!this.container) {
            console.error('Text container not found');
        }
    }
    
    renderMobile(cantoData, dictionary) {
        if (!this.container) this.initialize();
        
        this.colorMapper.updateDictionary(dictionary);
        
        const italianColumn = this.renderColumn(cantoData.textPairs, 'italian', dictionary);
        const englishColumn = this.renderColumn(cantoData.textPairs, 'english', dictionary);
        const notesColumn = this.renderColumn(cantoData.textPairs, 'notes', dictionary);
        
        this.container.innerHTML = `
            <div class="column-content active" data-column="0">
                ${italianColumn}
            </div>
            <div class="column-content" data-column="1">
                ${englishColumn}
            </div>
            <div class="column-content" data-column="2">
                ${notesColumn}
            </div>
        `;
    }
    
    renderDesktop(cantoData, dictionary) {
        if (!this.container) this.initialize();
        
        this.colorMapper.updateDictionary(dictionary);
        
        const html = cantoData.textPairs.map((pair, index) => {
            if (isStanzaBreak(pair)) {
                return '<div class="stanza-break"></div>';
            }
            
            const italianLine = this.processLine(pair[0], 'italian', dictionary, cantoData.textPairs, index);
            const englishLine = this.processLine(pair[1], 'english', dictionary, cantoData.textPairs, index);
            const notesLine = this.generateNotes(pair[2]);
            
            return `<div class="line-pair">
                <div class="line" data-language="italian">${italianLine}</div>
                <div class="line" data-language="english">${englishLine}</div>
                <div class="line" data-language="notes">${notesLine}</div>
            </div>`;
        }).join('');
        
        this.container.innerHTML = html;
    }
    
    renderColumn(textPairs, columnType, dictionary) {
        return textPairs.map((pair, index) => {
            if (isStanzaBreak(pair)) {
                return '<div class="stanza-break"></div>';
            }
            
            let content = '';
            
            switch (columnType) {
                case 'italian':
                    content = this.processLine(pair[0], 'italian', dictionary, textPairs, index);
                    break;
                case 'english':
                    content = this.processLine(pair[1], 'english', dictionary, textPairs, index);
                    break;
                case 'notes':
                    content = this.generateNotes(pair[2]);
                    break;
            }
            
            return `<div class="line" data-language="${columnType}">${content}</div>`;
        }).join('');
    }
    
    processLine(line, language, dictionary, allLines = [], lineIndex = 0) {
        if (!line || line === '') return '';
        
        const words = line.split(/\s+/);
        
        return words.map((word, wordIndex) => {
            // Get context for contraction resolution using the utility
            const context = getWordContext(words, wordIndex, allLines, lineIndex);
            
            // Extract punctuation using the utility
            const { cleanWord, punctuation } = extractWordParts(word);
            
            // Handle Italian contractions
            if (language === 'italian' && cleanWord.includes("'")) {
                return this.renderContraction(cleanWord, punctuation, context, dictionary);
            }
            
            // Regular word processing
            return this.renderRegularWord(cleanWord, punctuation, language, dictionary);
        }).join(' ');
    }
    
    renderContraction(word, punctuation, context, dictionary) {
        const expansion = this.contractionHandler.expandWithContext(word, context);
        
        if (expansion) {
            const colors = expansion.parts.map(part => 
                part ? this.colorMapper.getSemanticColor(part, 'italian') : null
            );
            
            // Split the original word at the apostrophe
            const splitWord = word.split("'");
            const firstPart = splitWord[0];
            const secondPart = splitWord[1];
            
            let innerContent = '';
            
            // Check if each part has content before rendering it
            if (expansion.parts[0] && expansion.parts[0].trim() !== '') {
                innerContent += `<span style="background-color: ${colors[0]}">${firstPart}'</span>`;
            } else {
                // Handle case where first part is empty (just show apostrophe)
                innerContent += `<span>${firstPart}'</span>`;
            }
            
            if (expansion.parts[1] && expansion.parts[1].trim() !== '') {
                innerContent += `<span style="background-color: ${colors[1]}">${secondPart}</span>`;
            } else {
                // Don't render second span if there's no content
            }
            
            return `<span class="word contraction" 
                data-word="${word}" 
                data-language="italian"
                data-expanded="${expansion.parts.join(' ')}"
                data-parts="${expansion.parts.join('|')}">
                ${innerContent}
            </span>${punctuation}`;
        }
        
        // Fallback if contraction processing fails
        return this.renderRegularWord(word, punctuation, 'italian', dictionary);
    }
    
    renderRegularWord(word, punctuation, language, dictionary) {
        const color = this.colorMapper.getSemanticColor(word, language);
        
        return `<span class="word" 
            data-word="${word}" 
            data-language="${language}"
            style="background-color: ${color}">
            ${word}
        </span>${punctuation}`;
    }
    
    generateNotes(noteText) {
        if (!noteText || noteText === "") {
            return '';
        }
        
        return `<span style="color: var(--text-secondary); font-size: 14px; line-height: 1.4;">${noteText}</span>`;
    }
    
    updateColors(dictionary) {
        this.colorMapper.updateDictionary(dictionary);
        
        const words = document.querySelectorAll('.word');
        words.forEach(wordElement => {
            const word = wordElement.dataset.word;
            const language = wordElement.dataset.language;
            
            if (word && language) {
                const newColor = this.colorMapper.getSemanticColor(word, language);
                
                if (wordElement.classList.contains('contraction')) {
                    const parts = wordElement.dataset.parts?.split('|') || [];
                    const spans = wordElement.querySelectorAll('span');
                    
                    parts.forEach((part, index) => {
                        if (spans[index]) {
                            const partColor = this.colorMapper.getSemanticColor(part, language);
                            spans[index].style.backgroundColor = partColor;
                        }
                    });
                } else {
                    wordElement.style.backgroundColor = newColor;
                }
            }
        });
    }
    
    clear() {
        if (this.container) {
            this.container.innerHTML = '<div class="loading">Loading...</div>';
        }
    }
    
    showError(message) {
        if (this.container) {
            this.container.innerHTML = `
                <div class="loading" style="color: var(--error-color);">
                    ${message}
                </div>
            `;
        }
    }
    
    getStats() {
        const words = document.querySelectorAll('.word');
        const contractions = document.querySelectorAll('.word.contraction');
        
        return {
            totalWords: words.length,
            contractions: contractions.length,
            regularWords: words.length - contractions.length,
            cacheStats: this.colorMapper.getCacheStats()
        };
    }
}
