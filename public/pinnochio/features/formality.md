# Feature: Italian Formality Visualization Mode

## Core Concept
Highlight entire dialogue rows with background colors to show Italian social register patterns.

## Implementation
- **Target**: Line-pairs containing direct speech (em-dash dialogue)
- **Method**: Background color adjustment for the entire row
- **Detection**: Post-processing analysis after all chapters translated

## Visual Treatment
```css
.line-pair.formal-speech {
    background: linear-gradient(90deg, rgba(74,144,226,0.15) 0%, transparent 100%);
}

.line-pair.rude-speech {
    background: linear-gradient(90deg, rgba(208,2,27,0.15) 0%, transparent 100%);
}
```

## Detection Logic (Post-Processing)
```javascript
const formalityMarkers = {
    formal: ['signor', 'mille grazie', 'stia bene', 'arrivedella'],
    rude: ['grillaccio', 'chetati', 'zitto', 'del mal\'augurio']
};

// Analyze completed textPairs for dialogue lines
function markFormalityLevels(chapter) {
    chapter.textPairs.forEach(pair => {
        if (pair[0].includes('—')) {  // Contains dialogue
            const level = analyzeFormalityLevel(pair[0]);
            if (level !== 'neutral') {
                pair.push(level);  // Add formality marker
            }
        }
    });
}
```

## Examples
- **Formal**: Chick's elaborate courtesy → soft blue background
- **Rude**: Pinocchio's "Grillaccio!" insults → subtle red background  
- **Neutral**: Most dialogue → no background change

## Toggle Control
```html
<input type="checkbox" id="formality-mode"> 🎭 Show Formality
```

## Benefits
- Shows Collodi's social register teaching visually
- Highlights character personality through speech patterns
- Demonstrates 19th century Italian etiquette

---
**Priority**: Low - Post-translation enhancement
**Effort**: 1 day implementation + formality analysis
**Dependencies**: All 36 chapters completed