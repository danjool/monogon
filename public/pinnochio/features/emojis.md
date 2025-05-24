# Feature Spec: Emoji Vocabulary Mode

## Overview
Add toggleable emoji visual aids that render inside word elements to provide instant vocabulary recognition for Italian learners, while keeping cultural notes scholarly and focused.

## Core Concept
- **Prefix Mode**: Single emoji renders before word: `👁️occhio`
- **Bookend Mode**: Double emoji bookends word: `👁️occhi👁️` 
- **Toggleable Mode**: Users can enable/disable emoji rendering
- **Standalone Dictionary**: Simple emoji mapping, renderer detects doubles

## Technical Implementation

### 1. Emoji Dictionary Structure
```javascript
// emoji-dictionary.js
export const emojiDictionary = {
    // Body parts (singular/plural)
    'occhio': '👁️',
    'occhi': '👁️👁️',     // Double emoji = bookend rendering
    'naso': '👃',
    'bocca': '👄',
    'mano': '👋',
    'mani': '👋👋',
    'orecchi': '👂👂',
    
    // Animals
    'gatto': '🐱',
    'cane': '🐕',
    'gallina': '🐔',
    'pulcino': '🐣',
    'grillo': '🦗',
    
    // Food
    'uovo': '🥚',
    'pane': '🍞',
    'pesce': '🐟',
    'ciliegia': '🍒',
    
    // Emotions/Actions
    'piangere': '😢',
    'ridere': '😄',
    'dormire': '💤',
    'correre': '🏃',
    
    // Objects
    'casa': '🏠',
    'finestra': '🪟',
    'fuoco': '🔥',
    'libro': '📚',
    
    // Time/Weather
    'notte': '🌙',
    'giorno': '☀️',
    'sole': '☀️',
    'luna': '🌙',
};
```

### 2. Word Processor Enhancement
```javascript
// In app.js processLine() function
processLine(line, language) {
    if (!line || line === '') return '';
    
    const words = line.split(/\s+/);
    
    return words.map(word => {
        const cleanWord = word.replace(/^[.,;:!?«»"""'\-—()*…]+|[.,;:!?«»"""'\-—()*…]+$/g, '');
        
        if (cleanWord.length === 0) return word;
        
        const color = this.colorMapper.getSemanticColor(cleanWord, language);
        let wordContent = word;
        
        // Add emoji rendering if enabled and emoji exists
        if (this.emojiMode && language === 'italian' && this.emojiDict[cleanWord.toLowerCase()]) {
            const emojiValue = this.emojiDict[cleanWord.toLowerCase()];
            
            // Check if double emoji (same emoji repeated)
            if (emojiValue.length > 1 && emojiValue[0] === emojiValue[1]) {
                // Bookend mode: emoji + word + emoji
                const emoji = emojiValue[0];
                wordContent = `${emoji}${word}${emoji}`;
            } else {
                // Prefix mode: emoji + word
                wordContent = `${emojiValue}${word}`;
            }
        }
        
        return `<span class="word" data-word="${cleanWord}" data-language="${language}" style="background-color: ${color}">${wordContent}</span>`;
    }).join(' ');
}
```

### 3. UI Toggle Control
```html
<!-- Add to header or settings panel -->
<div class="emoji-toggle">
    <label>
        <input type="checkbox" id="emoji-mode-toggle"> 
        <span>🎨 Emoji Mode</span>
    </label>
</div>
```

```javascript
// Event listener for toggle
document.getElementById('emoji-mode-toggle').addEventListener('change', (e) => {
    this.emojiMode = e.target.checked;
    if (this.currentChapter) {
        this.renderCurrentChapter(); // Re-render with/without emojis
    }
});
```

### 4. CSS Styling
```css
/* Emoji mode styling */
.word {
    transition: all 0.3s ease;
}

.emoji-mode .word[data-language="italian"] {
    font-weight: 500;
    border-radius: 6px;
    padding: 2px 4px;
}

/* Hover effects for emoji words */
.emoji-mode .word[data-language="italian"]:hover {
    transform: scale(1.1);
    z-index: 10;
    position: relative;
}

/* Mobile optimization */
@media (max-width: 768px) {
    .emoji-mode .word {
        font-size: 1.1em;
        line-height: 1.4;
    }
}
```

## User Experience

### Visual Examples
- **Regular mode**: `Pinocchio corse alla casa`
- **Emoji mode**: `Pinocchio 🏃corse alla 🏠casa`
- **Plural example**: `I suoi 👁️occhi👁️ erano grandi`

## Implementation Priority

**After all the chapters are translated. Not before.**

## Technical Considerations

### Performance
- **Lightweight**: Emoji dictionary separate from main translation dictionary
- **Conditional**: Only processes emojis when mode enabled
- **Cacheable**: Emoji mappings can be cached aggressively

### Accessibility
- **Screen Readers**: Emojis shouldn't interfere with text-to-speech
- **Cognitive Load**: Toggle allows users to disable if overwhelming
- **Color Independence**: Does this conflict with semantic color mapping?

### Scalability
- **Modular**: Emoji dictionary grows independently
- **Maintainable**: Clear separation from cultural notes
- **Extensible**: Can add themed emoji sets (animals, food, emotions)

---

**Status**: Backlog - Post Translation Phase
**Priority**: Enhancement (after core content complete)
**Effort**: 2-3 development days
**Dependencies**: All 36 chapters translated