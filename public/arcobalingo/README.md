# Divine Comedy Interactive Reader

An immersive web application for reading Dante's Divine Comedy with semantic color mapping, intelligent contraction handling, and contextual annotations. Words with identical meanings share the same colors across Italian and English, creating visual connections that enhance language learning and literary comprehension.

## Implementation Overview

This is a complete modular implementation supporting the full Divine Comedy (100 cantos) with a hybrid dictionary approach, progressive loading, and responsive design optimized for both language learning and literary study.

## Core Features

**Semantic Color Mapping**: Every Italian word is mapped to its English semantic equivalent and assigned a consistent color based on meaning. Words like "vita" (life) and "morte" (death) maintain their colors throughout all cantos, creating visual patterns that help readers recognize recurring themes and vocabulary.

**Context-Aware Contraction Processing**: Italian contractions are automatically detected, contextually resolved, and split with each component colored according to its semantic meaning. The system distinguishes between ambiguous contractions like "l'" (la vs lo) based on grammatical context and noun gender detection.

**Progressive Content Loading**: Core dictionary (1500+ words) loads immediately, with canto-specific supplements and adjacent cantos loading in background. LocalStorage caching ensures offline reading capability and instant subsequent access.

**Responsive Cross-Platform Design**: Desktop shows synchronized three-column layout (Italian/English/Notes). Mobile provides swipe navigation between columns with visual indicators. Touch-optimized with keyboard accessibility support.

**Curated Cultural Annotations**: Third column focuses on proper nouns (Virgilio, Anchise, Augustus), cultural references (Lombards, Mantuans), and Italian phrases requiring historical context. No grammatical explanations - pure cultural/historical focus.

## Project Architecture

```
divine-comedy-reader/
├── index.html                           # Single-page application entry
├── css/
│   ├── main.css                        # Core layout and structure
│   ├── colors.css                      # Dark theme and color system  
│   ├── typography.css                  # Font handling and text styling
│   └── responsive.css                  # Mobile/desktop responsive rules
├── js/
│   ├── app.js                          # Main application controller
│   ├── analysis/
│   │   ├── contraction-handler.js      # Context-aware Italian contractions
│   │   ├── color-mapper.js             # Semantic color generation
│   │   ├── tooltip-manager.js          # Word information tooltips
│   │   └── highlight-manager.js        # Cross-language highlighting
│   ├── ui/
│   │   ├── renderer.js                 # Text rendering engine
│   │   ├── mobile-handler.js           # Swipe navigation and mobile UI
│   │   └── desktop-handler.js          # Desktop keyboard navigation
│   ├── data/
│   │   └── loader.js                   # Dictionary and canto loading
│   └── utils/
│       └── metadata.js                 # Canto information and structure
├── data/
│   ├── dict-core.js                    # 1500+ most frequent Italian words
│   ├── dict-supplements/               # Additional vocabulary by canto
│   │   ├── canto01-words.js           # Canto-specific rare words
│   │   └── ...
│   ├── cantos/
│   │   ├── canto01.js                  # Text pairs and cultural annotations
│   │   └── ...
│   └── metadata.js                     # Canto titles and descriptions
```

## Technical Implementation

**ES6 Module Architecture**: Clean separation with import/export modules. Hash-based routing for canto navigation (#canto1). Progressive enhancement with core functionality loading immediately.

**Hybrid Dictionary Strategy**: Core dictionary covers 85%+ of words across all cantos. Canto supplements add rare/unique vocabulary. Consistent semantic mapping ensures color coherence across entire work.

**Context-Aware Processing**: Advanced contraction resolution distinguishes "l'anima" (lo + anima, masculine) from "l'acqua" (la + acqua, feminine) using grammatical analysis and noun gender detection.

**Intelligent Caching**: LocalStorage persistence with 24-hour TTL. LRU cache for 5 cantos in memory. Background preloading of adjacent cantos for seamless navigation.

**Performance Optimization**: Deterministic color generation with caching. Debounced events. Virtual scrolling for large texts. Lazy loading of supplementary content.


# Canto Processing Workflow

Use these instructions when adding new cantos to the Divine Comedy reader:

## Task Overview
Process raw Italian text from Dante's Divine Comedy to create complete textPairs arrays and dictionary entries for seamless integration with the existing semantic color mapping system.

## Input Requirements
- Raw Italian text from any Divine Comedy canto
- Reliable English translation (Longfellow, Mandelbaum, or Hollander quality)
- Canto number and basic contextual information

## Output Format

### File Structure
Create two files for each new canto:

**1. Main Canto File**: `data/cantos/cantoXX.js`
```javascript
export const cantoXX = {
    title: "Descriptive Title",
    textPairs: [
        ["Italian line", "English translation", "Cultural note or empty string"],
        ["", "", ""],  // Empty lines for stanza breaks
        // ... all lines of the canto
    ]
};
```

**2. Supplement Dictionary**: `data/dict-supplements/cantoXX-words.js`
```javascript
export const cantoXXSupplement = {
    'parola_rara': 'rare_word',
    'nome_proprio': 'proper_name',
    // Only words NOT in core dictionary
};
```

## Processing Guidelines

### textPairs Structure
- **Line-by-line correspondence**: Each Italian line paired with English translation
- **Stanza breaks**: Empty triplets ["", "", ""] for visual spacing
- **Consistent numbering**: Use terza rima structure (ABA BCB CDC...)

### Dictionary Requirements
- **Comprehensive coverage**: Every unique Italian word must have translation
- **Consistency check**: Same Italian word = same English semantic equivalent across all cantos
- **Core dictionary priority**: Only add words to supplements if not in core dictionary
- **Contraction inclusion**: Handle apostrophe contractions (d', l', ch', m', etc.)

### Annotation Standards

**INCLUDE in notes column:**
- **Proper nouns**: Historical figures, places, mythological characters
  - "Beatrice = Dante's idealized love, represents divine grace"
  - "Firenze = Florence, Dante's birthplace"
- **Cultural/historical references**: Terms requiring medieval context
  - "Guelfi e Ghibellini = political factions in medieval Italy"
  - "Impero = Holy Roman Empire"
- **Italian expressions**: Archaic phrases or idioms
  - "Ben ti sta = serves you right (archaic expression)"
  - "Così va il mondo = such is the way of the world"
- **Symbolic elements**: When religious/allegorical meaning aids comprehension
  - "Aquila = eagle, symbol of the Holy Roman Empire"
  - "Rosa mistica = mystical rose, symbol of Paradise"

**EXCLUDE from notes:**
- Simple vocabulary translations (handled by tooltips)
- Grammatical explanations 
- Literary analysis or thematic interpretation
- Obvious contractions (handled automatically)

### Quality Standards
- **Translation accuracy**: Maintain poetic register while ensuring clarity
- **Cultural precision**: Verify historical/mythological references
- **Semantic consistency**: Check against existing dictionary entries
- **Annotation brevity**: Maximum 20 words per note

## Integration Process

### Step 1: Text Processing
1. Split Italian text into individual lines
2. Create accurate English translations maintaining verse structure
3. Identify stanza breaks and preserve spacing
4. Extract all unique Italian words

### Step 2: Dictionary Management
1. Compare word list against core dictionary
2. Create supplement file with only missing words
3. Ensure semantic consistency (vita always = life)
4. Handle contractions and variant forms

### Step 3: Annotation Curation
1. Research proper nouns and cultural references
2. Write concise, informative notes
3. Focus on elements that aid English speakers' comprehension
4. Avoid redundancy with existing annotations

### Step 4: Quality Verification
1. Test textPairs format in application
2. Verify all words have translations
3. Check color mapping consistency
4. Validate responsive display

## Technical Integration

### Adding to Metadata
Update `data/metadata.js`:
```javascript
XX: {
    title: "Canto Title",
    part: "Inferno/Purgatorio/Paradiso", 
    description: "Brief summary",
    themes: ["theme1", "theme2"],
    characters: ["Character1", "Character2"],
    lineCount: XXX
}
```

### Testing Checklist
- [ ] Canto loads without errors
- [ ] All words display with colors
- [ ] Contractions split properly
- [ ] Tooltips show translations
- [ ] Mobile swipe navigation works
- [ ] Notes column displays correctly
- [ ] No console errors

## Examples

**Good annotation**: "Caronte = Charon, ferryman who transports souls across river Acheron into Hell"

**Poor annotation**: "This is an example of personification showing Dante's literary skill"

**Good dictionary entry**: 'traghettatore': 'ferryman'

**Poor dictionary entry**: 'traghettatore': 'boat operator person'

The goal is seamless integration with existing semantic color mapping while providing essential cultural context for English-speaking readers engaging with medieval Italian literature.

---

This workflow ensures consistent quality and integration with the existing application architecture while maintaining the educational focus on Italian language learning through Dante's masterpiece.