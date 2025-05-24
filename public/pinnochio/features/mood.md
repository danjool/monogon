# Feature: Italian Mood Visualization Mode

## Core Concept
Highlight Italian verbs by mood to show when/why Italian requires subjunctive, conditional, or imperative where English doesn't.

## Italian vs English Mood Gaps

### Italian Mood Complexity (English Lacks)
- **Congiuntivo** (subjunctive): Required after emotion, doubt, opinion - English often uses indicative
- **Condizionale**: More nuanced than English conditional (politeness, reported speech, hypothetical)
- **Imperativo**: Formal/informal distinctions, negative imperative rules
- **Mood harmony**: Dependent clauses must match main clause mood

### Pinocchio Examples
- **Subjunctive**: `"Se il mio babbo fosse qui"` (if my papa were here)
- **Conditional**: `"vorrei mangiare"` (I would like to eat) 
- **Imperative**: `"Chetati!"` (Be quiet!) vs `"Dimmi"` (Tell me)
- **Indicative**: Most narrative statements

## Visual Treatment
```css
.verb-indicativo {
    border-bottom: 3px solid #228B22;  /* Green - factual statements */
}

.verb-congiuntivo {
    border-bottom: 3px wavy #FF4500;   /* Orange wavy - doubt/emotion */
    text-decoration-style: wavy;
}

.verb-condizionale {
    border-bottom: 3px dashed #4169E1; /* Blue dashed - hypothetical */
}

.verb-imperativo {
    border-bottom: 3px double #DC143C;  /* Red double - commands */
    font-weight: bold;
}

.verb-infinito {
    border-bottom: 1px dotted #808080;  /* Gray dotted - infinitive */
}
```

## Detection Patterns
```javascript
const moodPatterns = {
    congiuntivo: {
        triggers: ['che', 'se', 'perché', 'affinché', 'benché'],
        endings: ['i', 'a', 'iate', 'ano', 'essi', 'esse'],
        common: ['sia', 'fosse', 'abbia', 'avesse', 'faccia', 'dicesse']
    },
    
    condizionale: {
        endings: ['rei', 'esti', 'ebbe', 'emmo', 'este', 'ebbero'],
        common: ['sarebbe', 'vorrei', 'potrebbe', 'dovrebbe']
    },
    
    imperativo: {
        context: /^—.*[!]/,  // Dialogue ending with !
        forms: ['va', 'vieni', 'dimmi', 'senti', 'guarda', 'chetati']
    }
};
```

## Pedagogical Value

### Mood Requirement Visualization
```
"Credo che tu [abbia] ragione"     → Shows required subjunctive
     ^^^^     ^^^^^^
  (trigger)  (subjunctive)

"Se [fossi] più bravo..."          → Shows subjunctive in hypothesis  
    ^^^^^^
 (subjunctive)

"[Dimmi] la verità!"               → Shows imperative command
 ^^^^^^
(imperative)
```

### Learning Moments
- **Subjunctive triggers**: After verbs of emotion, doubt, opinion
- **Conditional nuance**: Politeness vs. hypothetical vs. reported speech  
- **Imperative formality**: Tu vs. Lei command forms
- **Translation gaps**: Where English uses indicative, Italian requires subjunctive

## Character-Specific Patterns

### Pinocchio (Rude Imperatives)
- `"Chetati!"` `"Smetti!"` → Aggressive imperatives
- Shows **inappropriate register** for child addressing adult

### Cricket (Subjunctive Moralizing)  
- `"Guai a quei ragazzi che si ribellino..."` → Subjunctive of warning
- Shows **elevated moral discourse**

### Chick (Conditional Politeness)
- `"Se permetteste..."` `"Vorrei ringraziare..."` → Conditional courtesy
- Shows **peak politeness register**

## Advanced Features

### Mood Harmony Visualization
```css
.mood-chain {
    background: linear-gradient(90deg, 
        rgba(255,69,0,0.1) 0%,    /* Subjunctive orange */  
        rgba(255,69,0,0.05) 100%  /* Fading */
    );
}
```
Shows dependent clause mood matching main clause.

### English Translation Comparison
- Highlight where English translation **flattens** Italian mood distinctions
- Show **untranslatable** mood nuances

## Toggle Control
```html
<input type="checkbox" id="mood-mode"> 🎭 Show Moods
```

## Implementation Notes
- **Context-sensitive**: Mood often depends on surrounding words
- **Confidence levels**: Only highlight clear mood identifications
- **Exception handling**: Irregular verb forms, archaic constructions
- **Trigger recognition**: Identify mood-forcing conjunctions/contexts

---
**Priority**: High - Core Italian learning challenge
**Effort**: 3-4 days (complex mood detection logic)
**Dependencies**: All chapters completed, comprehensive Italian mood database
**Pedagogical Impact**: ★★★★★ (Addresses #1 Italian learner difficulty)