# Pinocchio Interactive Reader

An interactive dual-language reader for Carlo Collodi's classic 1883 Italian novel "Le avventure di Pinocchio" (The Adventures of Pinocchio).

Goal #1 is to facilitate English to Italian language learning via the easiest to comprehend dual-language display.  Optimized for desktop, but mobile friendly.

## Features

- **Parallel Text Display**: Side-by-side Italian and English translations with an additional column for cultural notes
- **Interactive Word Translation**: Hover over any Italian word to see its English translation
- **Semantic Color Highlighting**: Words are color-coded based on their semantic meanings, making it easier to recognize patterns and word relationships
- **Responsive Design**: Optimized for both desktop and mobile viewing
  - Desktop: Three-column view with Italian, English, and notes displayed simultaneously
  - Mobile: Swipeable interface to navigate between language columns
- **Chapter Navigation**: Easy access to all 36 chapters through a grid interface
- **Cultural Context**: Important historical and cultural references are explained in the notes column

## Technical Implementation

Vanilla JavaScript using ES6 modules and features:

- Dynamic content loading for efficient chapter navigation
- Custom word processing with regex pattern matching for handling complex Italian punctuation
- Semantic color mapping algorithm to assign consistent colors to words
- Tooltip system for displaying translations on mouseover
- Responsive layout with device-specific rendering logic
- Browser feature detection for optimal performance

## Translation Methodology

The translation process follows a structured approach:

1. **Source Preservation**: Original Italian text maintains all punctuation, emphasis markers, and contractions
2. **Sentence Alignment**: Each Italian sentence directly corresponds to its English counterpart
3. **Cultural Context**: Important historical terms, customs, and references are explained in notes
4. **Dialogue Formatting**: Italian em-dash dialogue style is preserved while converting to English quotation conventions
5. **Historical Accuracy**: The English translation maintains a 19th century narrative tone appropriate to the period

## Dictionary System

The application uses a comprehensive Italian-English dictionary with:

- Base word forms (infinitives for verbs, singular for nouns)
- Common contractions with apostrophes preserved
- Conjugated verb forms for frequently used words
- Period-appropriate translations for archaic or regional terms
- Special handling for typographical elements like emphasis markers and complex punctuation

## App Structure

Flat file structure for convenient review and copy-pasting.
The only directories are `chapters` and `features` because directories are for hiding irrelevant content from eyes/models.
No dependencies, may the 🐦's maintain.

```
