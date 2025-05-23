// Enhanced Context-Aware Italian Contraction Handler for Dante's Divine Comedy
export class ContextAwareContractionHandler {
    constructor() {
        // Standard contractions with resolution rules
        this.contractionRules = {
            "l'": {
                options: ["la", "lo"],
                resolve: (context) => {
                    const nextWord = context.nextWord;
                    if (!nextWord) return "lo";
                    
                    // Check gender indicators
                    if (this.isFeminineNoun(nextWord)) return "la";
                    if (this.isMasculineNoun(nextWord)) return "lo";
                    
                    // Special patterns for 'lo' usage
                    if (nextWord.match(/^(s[cbdfglmnprtvz]|z|ps|gn|x)/i)) return "lo";
                    
                    return "lo";
                }
            },
            
            "n'": {
                options: ["ne", "non", "in"],
                resolve: (context) => {
                    const nextWord = context.nextWord;
                    
                    // Common patterns for "ne" (partitive)
                    if (nextWord?.match(/^(uscì|venne|andò|esce|va|ho|avesse)$/i)) return "ne";
                    
                    // "in" before consonant clusters (Dante usage)
                    if (nextWord?.match(/^[fstvn]/i)) return "in";
                    
                    // In Dante, "n'" as "non" is rarer
                    if (nextWord === "è" && context.prevWord !== "che") {
                        return "non";
                    }
                    
                    return "ne";
                }
            },
            
            "s'": {
                options: ["si", "se"],
                resolve: (context) => {
                    const nextWord = context.nextWord;
                    // Usually "si" (reflexive) in Dante
                    // "se" only in conditional contexts
                    if (nextWord?.match(/^(egli|ella|essi)/i)) return "se";
                    return "si";
                }
            },
            
            "ch'": {
                options: ["che"],
                resolve: () => "che"
            },
            
            "d'": {
                options: ["di"],
                resolve: () => "di"
            },
            
            "m'": {
                options: ["mi"],
                resolve: () => "mi"
            },
            
            "t'": {
                options: ["ti"],
                resolve: () => "ti"
            },
            
            "v'": {
                options: ["vi"],
                resolve: () => "vi"
            },
            
            "c'": {
                options: ["ci"],
                resolve: () => "ci"
            },
            
            // Compound contractions
            "dell'": {
                options: ["della", "dello"],
                resolve: (context) => {
                    const nextWord = context.nextWord;
                    if (!nextWord) return "della";
                    
                    if (this.isFeminineNoun(nextWord)) return "della";
                    if (this.isMasculineNoun(nextWord)) return "dello";
                    
                    return "della";
                }
            },
            
            "nell'": {
                options: ["nella", "nello"],
                resolve: (context) => {
                    const nextWord = context.nextWord;
                    if (!nextWord) return "nella";
                    
                    if (this.isFeminineNoun(nextWord)) return "nella";
                    if (this.isMasculineNoun(nextWord)) return "nello";
                    
                    return "nella";
                }
            }
        };
        
        // Dante-specific elision patterns (word + apostrophe)
        this.elisionPatterns = {
            // Common elided endings
            "gent'": "gente",
            "ond'": "onde", 
            "ov'": "ove",
            "vid'": "vide",
            "quell'": "quello", // Default, context needed for quella
            "quest'": "questo",
            "quand'": "quando",
            "dov'": "dove",
            "com'": "come",
            "tal'": "tale",
            "font'": "fonte",
            "mort'": "morte",
            "part'": "parte",
            "temp'": "tempo",
            "verd'": "verde",
            "grand'": "grande",
            "sant'": "santo",
            "tutt'": "tutto",
            "null'": "nullo",
            "bell'": "bello",
            "dell'": "della", // Will be overridden by contractionRules if gender known
            "nell'": "nella", // Will be overridden by contractionRules if gender known
            "sull'": "sulla",
            "coll'": "colla",
            "all'": "alla"
        };
        
        // Special Dante orthographic variants
        this.danteVariants = {
            "ïo": "io",
            "piü": "più", 
            "giü": "giù",
            "qua'": "quali",
            "se'": "sei",
            "no'": "noi",
            "vo'": "voi",
            "so'": "sono",
            "fo'": "fui",
            "do'": "dove",
            "co'": "con",
            "po'": "poi",
            "mo'": "modo"
        };
        
        // Compound contraction patterns (prefix + full word)
        this.compoundPatterns = [
            // che + word
            { prefix: "ch'", baseWord: "che", pattern: /^ch'(.+)$/ },
            // di + word  
            { prefix: "d'", baseWord: "di", pattern: /^d'(.+)$/ },
            // si + word
            { prefix: "s'", baseWord: "si", pattern: /^s'(.+)$/ },
            // ne + word
            { prefix: "n'", baseWord: "ne", pattern: /^n'(.+)$/ },
            // mi + word
            { prefix: "m'", baseWord: "mi", pattern: /^m'(.+)$/ },
            // ti + word
            { prefix: "t'", baseWord: "ti", pattern: /^t'(.+)$/ },
            // vi + word
            { prefix: "v'", baseWord: "vi", pattern: /^v'(.+)$/ },
            // ci + word
            { prefix: "c'", baseWord: "ci", pattern: /^c'(.+)$/ },
            // lo/la + word
            { prefix: "l'", baseWord: "lo", pattern: /^l'(.+)$/ },
            // in + word (archaic 'n)
            { prefix: "'n", baseWord: "in", pattern: /^'n(.+)$/ },
            // il (archaic 'l)
            { prefix: "'l", baseWord: "il", pattern: /^'l(.+)$/ }
        ];
        
        // Gender markers for common nouns in Dante
        this.nounGenders = {
            // Feminine nouns
            "anima": "f", "anime": "f", "selva": "f", "vita": "f", "morte": "f", 
            "paura": "f", "riva": "f", "acqua": "f", "valle": "f", "aria": "f", 
            "terra": "f", "notte": "f", "luce": "f", "gente": "f", "genti": "f",
            "ombra": "f", "onda": "f", "acqua": "f", "spezie": "f", "altra": "f",
            "etterno": "f", "intelletto": "f", "ira": "f", "una": "f", "umana": "f",
            "aere": "f", // archaic for "aria"
            
            // Masculine nouns
            "cammin": "m", "colle": "m", "lago": "m", "cor": "m",
            "pensier": "m", "mondo": "m", "cielo": "m", "sol": "m",
            "animo": "m", "passo": "m", "monte": "m", "punto": "m",
            "pelago": "m", "piè": "m", "ben": "m", "uom": "m", "omo": "m",
            "altro": "m", "loco": "m", "tempo": "m"
        };
    }
    
    expandWithContext(word, context) {
        // Handle Dante orthographic variants first
        if (this.danteVariants[word.toLowerCase()]) {
            return {
                original: word,
                expanded: this.danteVariants[word.toLowerCase()],
                parts: [this.danteVariants[word.toLowerCase()]],
                splitPoint: 0,
                type: "variant"
            };
        }
        
        // Handle elision patterns (word ending with apostrophe)
        if (word.endsWith("'") && this.elisionPatterns[word.toLowerCase()]) {
            return {
                original: word,
                expanded: this.elisionPatterns[word.toLowerCase()],
                parts: [this.elisionPatterns[word.toLowerCase()]],
                splitPoint: 0,
                type: "elision"
            };
        }
        
        // Handle compound contractions
        for (const pattern of this.compoundPatterns) {
            const match = word.match(pattern.pattern);
            if (match) {
                const remainingWord = match[1];
                let baseWord = pattern.baseWord;
                
                // Special resolution for ambiguous contractions
                if (pattern.prefix === "l'" && context) {
                    const rule = this.contractionRules["l'"];
                    if (rule && rule.resolve) {
                        baseWord = rule.resolve({
                            ...context,
                            nextWord: remainingWord
                        });
                    }
                }
                
                if (pattern.prefix === "n'" && context) {
                    const rule = this.contractionRules["n'"];
                    if (rule && rule.resolve) {
                        baseWord = rule.resolve({
                            ...context,
                            nextWord: remainingWord
                        });
                    }
                }
                
                return {
                    original: word,
                    expanded: baseWord + " " + remainingWord,
                    parts: [baseWord, remainingWord],
                    splitPoint: pattern.prefix.length,
                    type: "compound"
                };
            }
        }
        
        // Handle simple prefix contractions
        if (!word.includes("'")) return null;
        
        const parts = word.split("'");
        if (parts.length !== 2) return null;
        
        const prefix = parts[0] + "'";
        const suffix = parts[1];
        
        if (this.contractionRules[prefix]) {
            const rule = this.contractionRules[prefix];
            
            if (rule.resolve) {
                const resolvedPrefix = rule.resolve({
                    ...context,
                    nextWord: suffix,
                    suffix,
                    fullWord: word
                });
                
                return {
                    original: word,
                    expanded: resolvedPrefix + " " + suffix,
                    parts: [resolvedPrefix, suffix],
                    splitPoint: prefix.length,
                    type: "contraction"
                };
            }
        }
        
        // Fallback for unknown contractions
        return {
            original: word,
            expanded: parts.join(" "),
            parts: parts,
            splitPoint: parts[0].length + 1,
            type: "unknown"
        };
    }
    
    isFeminineNoun(word) {
        if (this.nounGenders[word?.toLowerCase()] === "f") return true;
        if (word?.match(/(a|ione|tà|tù|ie|ice|ezza)$/i)) return true;
        return false;
    }
    
    isMasculineNoun(word) {
        if (this.nounGenders[word?.toLowerCase()] === "m") return true;
        if (word?.match(/(o|ore|iere|imento|ente|io|ino)$/i)) return true;
        return false;
    }
    
    isContraction(word) {
        return word.includes("'") || this.danteVariants[word.toLowerCase()];
    }
    
    getContractionInfo(word, context) {
        if (!this.isContraction(word)) {
            return null;
        }
        
        return this.expandWithContext(word, context);
    }
    
    // Method to get all possible contractions that could be in the text
    getAllKnownContractions() {
        const contractions = new Set();
        
        // Add basic contraction prefixes
        Object.keys(this.contractionRules).forEach(prefix => {
            contractions.add(prefix);
        });
        
        // Add elision patterns
        Object.keys(this.elisionPatterns).forEach(pattern => {
            contractions.add(pattern);
        });
        
        // Add Dante variants
        Object.keys(this.danteVariants).forEach(variant => {
            contractions.add(variant);
        });
        
        return Array.from(contractions);
    }
    
    // Method to handle special Dante contractions not covered by patterns
    handleSpecialCases(word, context) {
        const specialCases = {
            // Handle cases like c'hanno = ci hanno
            "c'hanno": { expanded: "ci hanno", parts: ["ci", "hanno"] },
            // Handle archaic forms
            "a'": { expanded: "ai", parts: ["ai"] },
            "co'": { expanded: "con", parts: ["con"] },
            "po'": { expanded: "poi", parts: ["poi"] },
            "sé": { expanded: "se", parts: ["se"] }, // reflexive pronoun
            "né": { expanded: "ne", parts: ["ne"] }, // conjunction "nor"
            "omai": { expanded: "ormai", parts: ["ormai"] },
            "insieme": { expanded: "insieme", parts: ["insieme"] }
        };
        
        if (specialCases[word.toLowerCase()]) {
            const special = specialCases[word.toLowerCase()];
            return {
                original: word,
                expanded: special.expanded,
                parts: special.parts,
                splitPoint: 0,
                type: "special"
            };
        }
        
        return null;
    }
}