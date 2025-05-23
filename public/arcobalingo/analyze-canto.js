// Standalone script to analyze canto words for redundancy and missing translations
// Run with: node analyze-canto.js [canto-number]
// Example: node analyze-canto.js 1

import { analyzeCantoWords } from './js/utils/text-utils.js';

async function main() {
    const args = process.argv.slice(2);
    const cantoNumber = args[0] ? parseInt(args[0]) : 1;
    
    if (isNaN(cantoNumber) || cantoNumber < 1 || cantoNumber > 100) {
        console.error('Please provide a valid canto number (1-100)');
        console.error('Usage: node analyze-canto.js [canto-number]');
        console.error('Example: node analyze-canto.js 1');
        process.exit(1);
    }
    
    console.log(`🔍 Analyzing Canto ${cantoNumber} for word redundancy and missing translations...`);
    console.log('This analysis uses the exact same logic as the tooltip system.');
    console.log('Words that would show "Translation not available" will be listed as missing.\n');
    
    try {
        const results = await analyzeCantoWords(cantoNumber);
        
        if (!results) {
            console.error(`❌ Failed to analyze Canto ${cantoNumber}. Check if the canto data exists.`);
            process.exit(1);
        }
        
        // Additional summary
        if (results.redundantWords.size === 0 && results.missingWords.length === 0) {
            console.log('✅ No issues found! All words have unique translations and no missing words.');
        } else {
            console.log('💡 Next steps:');
            if (results.redundantWords.size > 0) {
                console.log('- Review redundant words: consider removing duplicates from supplement dictionary');
            }
            if (results.missingWords.length > 0) {
                console.log('- Add missing words to the appropriate dictionary');
            }
        }
        
    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
        process.exit(1);
    }
}

// Run only if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { main as analyzeCantoScript };
