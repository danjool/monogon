# Pinocchio Chapter Translation Task

Convert raw Italian text from Carlo Collodi's "Le avventure di Pinocchio" into structured chapter data for an interactive dual-language reader.

**Expert Knowledge Required:** 19th century Italian literature, Tuscan dialect, Italian historical context (1880s), children's literature translation, Italian contractions/elisions, contemporary global English.

## Stage 1: Full Text Translation

### Required Output Format

```javascript
export const chapterNN = { // where NN is the chapter number, zero padded to two digits, eg chapter01, chapter17; ensure you use the correct chapter number formatted to two digits
    title: "English chapter title",
    textPairs: [
        ["Italian sentence", "English translation", "Cultural note or empty string"],
        ["", "", ""],  // Empty triplets for paragraph breaks
        ["Next Italian sentence", "English translation", ""],
        // ... continue for all text
    ]
};
```

Note chapters are exported as zero padded, two digit numbers (e.g., `chapter01`, `chapter02`, etc.).

### Enhanced Translation Guidelines

**Sentence Boundaries:** Preserve original sentence structure. Do not combine or split sentences unless absolutely necessary for English readability.

**Example 1:**
Input: "C'era una volta un pezzo di legno. Non era un legno di lusso."
Output:
```javascript
["C'era una volta un pezzo di legno.", "Once upon a time there was a piece of wood.", ""],
["Non era un legno di lusso.", "It was not a luxury wood.", ""]
```

**Example 2:**
Input: "Geppetto prese gli arnesi. Si mise al lavoro subito."
Output:
```javascript
["Geppetto prese gli arnesi.", "Geppetto took his tools.", ""],
["Si mise al lavoro subito.", "He set to work immediately.", ""]
```

**Dialogue Formatting:** Maintain original em-dash dialogue style. Convert to English quote conventions naturally.

**Example 1:**
Input: "— Ho capito; — disse allora ridendo — si vede che quella vocina me la son figurata io."
Output:
```javascript
["— Ho capito; — disse allora ridendo — si vede che quella vocina me la son figurata io.", "'I understand,' he said then, laughing, 'it seems that I imagined that little voice.'", ""]
```

**Example 2:**
Input: "— Smetti di ridere! — gridò Geppetto impermalito."
Output:
```javascript
["— Smetti di ridere! — gridò Geppetto impermalito.", "'Stop laughing!' shouted Geppetto, getting angry.", ""]
```

**Text Structure:** Convert paragraph breaks into empty triplets ["", "", ""]. Maintain sentence-by-sentence correspondence between Italian and English.

**Example 1:**
Input:
```
"Sentence one. Sentence two.

New paragraph starts here."
```
Output:
```javascript
["Sentence one.", "Translation one.", ""],
["Sentence two.", "Translation two.", ""],
["", "", ""],
["New paragraph starts here.", "New paragraph translation.", ""]
```

**Example 2:**
Input:
```
"End of dialogue.

The next morning arrived."
```
Output:
```javascript
["End of dialogue.", "Translation of dialogue.", ""],
["", "", ""],
["The next morning arrived.", "Translation of next morning.", ""]
```

### Complex Punctuation Handling

**Emphasis Markers:** Preserve formatting cues in both languages.

**Example 1:**
Input: "*crì-crì-crì*"
Output:
```javascript
["*crì-crì-crì*", "*cri-cri-cri*", ""]
```

**Example 2:**
Input: "_pensiero importante_"
Output:
```javascript
["_pensiero importante_", "_important thought_", ""]
```

**Complex Punctuation Combinations:** Handle multiple punctuation marks naturally.

**Example 1:**
Input: "— Compassione!… —"
Output:
```javascript
["— Compassione!… —", "'Compassion!' he said with trailing emotion.", ""]
```

**Example 2:**
Input: "Bada, Grillaccio del mal'augurio!…"
Output:
```javascript
["Bada, Grillaccio del mal'augurio!…", "Watch out, you Cricket of ill omen!", ""]
```

**Contractions:** Preserve Italian contractions in source, translate naturally to English.

**Example 1:**
Input: "c'era una volta"
Output: "there was once" (not "there was once")

**Example 2:**
Input: "m'hai fatto male"
Output: "you hurt me" (preserve meaning, natural English)

**Archaic/Regional Terms:** When encountering archaic Italian or Tuscan dialect, translate to period-appropriate English but note in cultural column.

**Example 1:**
Input: "mastr'Antonio"
Output:
```javascript
["mastr'Antonio", "Master Anthony", "Mastr' = archaic contraction of 'maestro', used for respected craftsmen"]
```

**Example 2:**
Input: "Compare Geppetto"
Output:
```javascript
["Compare Geppetto", "Neighbor Geppetto", "Compare = dialectal for 'neighbor/friend', common in 19th century Tuscany"]
```

### Cultural Notes Guidelines

Include ONLY the following types of cultural context in the third column:

**Proper Nouns with Cultural Significance:**

**Example 1:**
```javascript
["Geppetto", "Geppetto", "Geppetto = traditional Italian woodcarver's name, diminutive of Giuseppe"]
```

**Example 2:**
```javascript
["Pinocchio", "Pinocchio", "Pinocchio = derived from 'pinocchio' meaning pine nut, fitting for wooden puppet"]
```

**Historical Context and Period Objects:**

**Example 1:**
```javascript
["la parrucca", "the wig", "Parrucca = wigs were commonly worn by craftsmen in 19th century Italy"]
```

**Example 2:**
```javascript
["burattino", "puppet", "Burattino = marionette, traveling puppet shows were main entertainment in 1880s Italy"]
```

**Italian Expressions and Social Customs:**

**Example 1:**
```javascript
["Buon pro vi faccia", "Much good may it do you", "Buon pro vi faccia = traditional polite skepticism, formal social blessing"]
```

**Example 2:**
```javascript
["galantuomo", "gentleman", "Galantuomo = man of honor, important social distinction in 19th century"]
```

**Regional Foods and Cultural References:**

**Example 1:**
```javascript
["Polendina", "Polenta", "Polendina = cornmeal mush, used mockingly for yellow wig color"]
```

**Example 2:**
```javascript
["zoccoli", "clogs", "Zoccoli = wooden shoes worn by peasants and craftsmen"]
```

**Occupational and Social Terms:**

**Example 1:**
```javascript
["falegname", "carpenter", "Falegname = woodworker, master craftsmen had respected social status"]
```

**Example 2:**
```javascript
["carabiniere", "policeman", "Carabiniere = Italian military police, established 1814"]
```

**Folklore and Literary Elements:**

**Example 1:**
```javascript
["Grillo-parlante", "Talking Cricket", "Grillo-parlante = wise insect figure from Italian folklore who gives moral guidance"]
```

**Example 2:**
```javascript
["Grillaccio del mal'augurio", "Cricket of ill omen", "Grillaccio del mal'augurio = derogatory term meaning harbinger of bad luck, Italian superstition about creatures that predict misfortune"]
```

**Exclude from notes:** Grammar explanations, obvious translations, literary analysis, basic vocabulary.

**Translation Style:** Maintain 1880s narrative tone without being overly archaic. Preserve Italian contractions and proper nouns in source text with explanations in notes.

### Technical Requirements

**Punctuation:** Preserve all Italian punctuation marks exactly (including « », —, *, etc.)
**Capitalization:** Maintain original capitalization patterns
**Spacing:** Single space after punctuation, preserve paragraph breaks as empty triplets
**Quote Handling:** Convert Italian quote styles (« ») to English equivalents ("") naturally

**Example 1:**
Input: "« Ho capito, » disse."
Output: "'I understand,' he said."

**Example 2:**
Input: "— Bene! — esclamò il burattino."
Output: "'Good!' exclaimed the puppet."

**Emphasis Preservation:** Maintain formatting markers in both languages

**Example 1:**
Input: "*crì-crì-crì*"
Output: "*cri-cri-cri*"

**Example 2:**
Input: "_importante_"
Output: "_important_"

## Stage 2: Dictionary Word Update & Technical Refinement

After translation, the app logs all Italian words missing from the English dictionary for review. The app also reveals new punctuation patterns that need handling.

Ask the user to paste the output of the log back to the conversation. Put a line of emojis here to grab the user's attention:
🦖🦕🦖🦕🦖🦕🦖🦕🦖🦕🦖🦕🦖🦕🦖🦕🦖🦕🦖🦕🦖🦕🦖🦕🦖🦕

### App Regex Pattern Evolution

The app's word processing regex has evolved through discovered edge cases:

**Version 1:** `[.,;:!?«»"""'\-—()]+` (Original)
**Version 2:** `[.,;:!?«»"""'\-—()*]+` (+ Asterisks for italics)
**Version 3:** `[.,;:!?«»"""'\-—()*…]+` (+ Ellipsis character)
**Version 4:** `[.,;:!?«»"""'\-—()*…]+` (+ Complex combinations like !…)

**Future patterns to watch for:**
- Underscores for emphasis: `_word_`
- Multiple punctuation: `?!`, `!!`, `...`
- Nested quotes: `"'word'"`
- Special typography: `--`, `***`

### Dictionary Entry Format

**Base Forms:** Use infinitives for verbs, singular for nouns
**Contractions:** Get separate entries with apostrophes preserved
**Multiple Meanings:** Use most contextually appropriate for Pinocchio
**Conjugated Forms:** Add common conjugations separately if frequently used

**Example 1 - Base Forms:**
```javascript
'essere': 'to be',      // infinitive
'casa': 'house',        // singular noun
'bello': 'beautiful',   // masculine singular adjective
```

**Example 2 - Contractions and Conjugations:**
```javascript
'era': 'was',           // base past tense
'erano': 'were',        // plural form  
'c'era': 'there was',   // contraction
'dovevo': 'I had to',   // common 1st person past
```

**Example 3 - Complex Punctuation Cases:**
```javascript
'*crì-crì-crì*': '*cri-cri-cri*',     // preserve emphasis markers
'compassione!…': 'compassion!...',     // complex punctuation
'mal'augurio!…': 'ill omen!...',       // contraction + complex punctuation
```

### Dictionary Output Format

```javascript
export const modernDictionary = {
    // A
    'abbia': 'may have',
    'abbaco': 'arithmetic',
    'ancora': 'still/yet',
    ...
    // C
    "c'era": "there was",
    'casa': 'house',
    '*crì-crì-crì*': '*cri-cri-cri*',
    ...
}
```
Because we are iterating over chapters, pasting more dictionary entires, conclude them with a comma, like:
```javascript
...
'volare': 'to fly',

// Z
    'zampettavano': 'strutted',
    'zoppo': 'lame', // <-- this is the last entry for chapter 18
    ... // doesn't end here, because there are more chapters to process
// Chapter 19 Dictionary Additions - User is pasting here

    'galateo': 'etiquette manual',
    'gorilla': 'gorilla',
    ...
    'sott\'acqua': 'underwater',
    ...
};
```

Note we lower case the keys, and back slashes are used to escape apostrophes in contractions.

### Quality Control Checklist

Before submitting translation, verify:

- [ ] All Italian sentences end with proper punctuation
- [ ] English maintains 19th century narrative tone (not modern, not overly archaic)
- [ ] Cultural notes are concise (typically under 15 words)
- [ ] No sentences combined or split unnecessarily
- [ ] Dialogue attribution preserved and properly formatted
- [ ] Empty triplets ["", "", ""] mark all paragraph breaks
- [ ] Italian contractions preserved in source text
- [ ] Proper nouns kept in Italian with cultural explanations
- [ ] Technical punctuation (em-dashes, Italian quotes, asterisks) handled correctly
- [ ] All cultural notes focus on historical/social context, not grammar
- [ ] Emphasis markers (*word*, _word_) preserved in both languages
- [ ] Complex punctuation (!…, ?!, etc.) handled appropriately

### Common Pitfalls to Avoid

**Don't combine sentences:**
❌ Wrong: ["Sentence one. Sentence two.", "Combined English translation.", ""]
✅ Correct: ["Sentence one.", "Translation one.", ""], ["Sentence two.", "Translation two.", ""]

**Don't modernize language:**
❌ Wrong: "Geppetto was super excited"
✅ Correct: "Geppetto was delighted"

**Don't over-explain in cultural notes:**
❌ Wrong: "Burattino = puppet, which is a jointed figure moved by strings, representing the theme of control vs freedom"
✅ Correct: "Burattino = marionette, traveling puppet shows were common 19th century entertainment"

**Don't alter Italian source text:**
❌ Wrong: ["Mastr Antonio", "Master Anthony", ""] (removing apostrophe)
✅ Correct: ["Mastr'Antonio", "Master Anthony", "Mastr' = archaic contraction"]

**Don't strip emphasis markers:**
❌ Wrong: ["crì-crì-crì", "cri-cri-cri", ""] (removing asterisks)
✅ Correct: ["*crì-crì-crì*", "*cri-cri-cri*", ""] (preserving emphasis)

### Evolving Edge Cases

As we process more chapters, new patterns emerge:

**Chapters 1-3:** Basic punctuation (.,;:!?«»"""'\-—())
**Chapter 4:** Added asterisks (*) and complex punctuation (!…)
**Future chapters:** Expect underscores, multiple exclamations, nested quotes

**Process:** When new punctuation patterns cause untranslated words, update the app's regex pattern in `app.js` function `processLine`:

```javascript
// Current pattern:
const cleanWord = word.replace(/^[.,;:!?«»"""'\-—()*…]+|[.,;:!?«»"""'\-—()*…]+$/g, '');

// Add new patterns as discovered
```

The translation process continuously evolves as we encounter Collodi's rich 19th century Italian typography and emphasis patterns.