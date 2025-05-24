# Feature: Italian Tense Visualization Mode

## Core Concept
Highlight Italian verbs by tense to show narrative structure and Italian-specific tense distinctions missing in English.

## Italian vs English Tense Gaps

### Italian Has (English Lacks)
- **Passato remoto** vs **Passato prossimo** (two different past tenses)
- **Imperfetto** (habitual/ongoing past ≠ English past continuous)  
- **Congiuntivo** (subjunctive used much more frequently)
- **Presente storico** (historic present for drama)

### Pinocchio-Specific Patterns
- **Passato remoto**: Literary past tense (`disse`, `andò`, `fece`)
- **Imperfetto**: Ongoing states (`era`, `aveva`, `correva`)
- **Present**: Dialogue and immediate action (`dice`, `va`)

## Visual Treatment (Idea)
```css
.verb-passato-remoto {
    border-bottom: 2px solid #8B4513;  /* Brown - completed literary past */
}

.verb-imperfetto {
    border-bottom: 2px dotted #4169E1;  /* Blue dotted - ongoing past */
}

.verb-presente {
    border-bottom: 2px solid #32CD32;  /* Green - immediate present */
}

.verb-congiuntivo {
    border-bottom: 2px dashed #9932CC;  /* Purple dashed - subjunctive */
}
```

## Pedagogical Value

### Narrative Structure Visualization
- **Action sequence**: `prese` → `andò` → `disse` (passato remoto chain)
- **Scene setting**: `era` → `aveva` → `sembrava` (imperfetto background)
- **Dialogue dynamics**: Present tense in speech vs. past in narration

### Italian-Specific Learning
- **Literary register**: Shows 19th century passato remoto usage
- **Aspect distinction**: Completed vs. ongoing past actions
- **English translation limitations**: Where one English past tense represents multiple Italian tenses

## Example Visualization
```
Il povero Pinocchio [corse] subito al focolare, dove [c'era] una pentola che [bolliva]
                    ^^^^^^                              ^^^^^                  ^^^^^^^
                   (remoto)                         (imperfetto)           (imperfetto)
```

Shows: completed action → ongoing state → ongoing action

## Toggle Control
```html
<input type="checkbox" id="tense-mode"> ⏰ Show Tenses
```

## Implementation Notes
- **Verb-only**: Only highlight actual verbs, skip infinitives/participles  
- **Italian column**: Only applies to source text
- **Requires another pass at translation**: Include tense analysis in dictionary
- **Confidence levels**: Only call out high-confidence tense identifications (during translation)

## Advanced Features (Future)
- **Timeline view**: Linear representation of action sequence
- **Aspect indicators**: Perfective vs. imperfective highlighting, "Aspect" is a key concept in Italian grammar that distinguishes completed actions from ongoing or habitual ones, where in English, we often use the same past tense for both, eg "I walked" can mean both a completed action and a habitual action.
- **Mood visualization**: Indicative vs. subjunctive vs. conditional, which means more in Italian because of the congiuntivo, a subjunctive mood used more frequently than in English
- **Translation comparison**: Show where English loses tense distinctions

---
**Priority**: Medium - Valuable for intermediate+ Italian learners
**Effort**: 2-3 days (verb detection + tense analysis)  
**Dependencies**: All chapters completed, Italian verb database