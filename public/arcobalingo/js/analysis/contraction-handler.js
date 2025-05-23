// Context-Aware Italian Contraction Handler
export class ContextAwareContractionHandler {
    constructor() {
        // Ambiguous contractions with resolution rules
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
                options: ["ne", "non"],
                resolve: (context) => {
                    const nextWord = context.nextWord;
                    
                    // Common patterns for "ne" (partitive)
                    if (nextWord?.match(/^(uscì|venne|andò|esce|va|ho)$/i)) return "ne";
                    
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
                    // Usually "si" (reflexive) in Dante
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
        
        // Gender markers for common nouns in Dante
        this.nounGenders = {
            // Feminine nouns
            "anima": "f", "selva": "f", "vita": "f", "morte": "f", 
            "paura": "f", "riva": "f", "acqua": "f", "valle": "f",
            "aria": "f", "terra": "f", "notte": "f", "luce": "f",
            
            // Masculine nouns
            "cammin": "m", "colle": "m", "lago": "m", "cor": "m",
            "pensier": "m", "mondo": "m", "cielo": "m", "sol": "m",
            "animo": "m", "passo": "m", "monte": "m", "punto": "m",
            "pelago": "m", "piè": "m", "ben": "m"
        };
    }
    
    expandWithContext(word, context) {
        if (!word.includes("'")) return null;
        
        const parts = word.split("'");
        const prefix = parts[0] + "'";
        const suffix = parts[1];
        
        if (this.contractionRules[prefix]) {
            const rule = this.contractionRules[prefix];
            
            if (rule.resolve) {
                const resolvedPrefix = rule.resolve({
                    ...context,
                    suffix,
                    fullWord: word
                });
                
                return {
                    original: word,
                    expanded: resolvedPrefix + " " + suffix,
                    parts: [resolvedPrefix, suffix],
                    splitPoint: prefix.length
                };
            }
        }
        
        // Fallback for unknown contractions
        return {
            original: word,
            expanded: parts.join(" "),
            parts: parts,
            splitPoint: parts[0].length + 1
        };
    }
    
    isFeminineNoun(word) {
        if (this.nounGenders[word?.toLowerCase()] === "f") return true;
        if (word?.match(/(a|ione|tà|tù|ie|ice)$/i)) return true;
        return false;
    }
    
    isMasculineNoun(word) {
        if (this.nounGenders[word?.toLowerCase()] === "m") return true;
        if (word?.match(/(o|ore|iere|imento|ente|io)$/i)) return true;
        return false;
    }
    
    isContraction(word) {
        return word.includes("'");
    }
    
    getContractionInfo(word, context) {
        if (!this.isContraction(word)) {
            return null;
        }
        
        return this.expandWithContext(word, context);
    }
}