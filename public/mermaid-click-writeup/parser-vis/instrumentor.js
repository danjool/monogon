(function(root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = factory();
  } else {
    // Browser global
    root.Instrumentor = factory();
  }
}(typeof self !== 'undefined' ? self : this, function() {

  class Instrumentor {
    constructor(parser) {
      this.parser = parser;
      this.events = [];
      this.dbSnapshots = [];
      this.instrumented = false;
    }

    captureDbSnapshot(yy) {
      // Capture current database state
      if (yy && typeof yy.getData === 'function') {
        const data = yy.getData();
        // Deep clone to avoid reference issues
        return JSON.parse(JSON.stringify(data));
      }
      return null;
    }

    parse(input) {
      const self = this;
      this.events = []; // Reset
      this.dbSnapshots = []; // Reset snapshots

      // Wrap the parse function to intercept lexer creation
      if (!this.instrumented) {
        const originalParse = this.parser.parse.bind(this.parser);

        this.parser.parse = function(input) {
          // Call original parse, which will create the lexer
          const parseFunc = originalParse;

          // Wrap lexer.next to capture tokens
          const originalLexerNext = this.lexer.next;
          this.lexer.next = function() {
            const startPos = this.matched.length;
            const token = originalLexerNext.call(this);

            // Only capture if we got a token (not false for whitespace or undefined)
            // Also skip EOF=1 since it gets converted to symbol later
            if (token !== false && token !== undefined) {
              const endPos = this.matched.length;
              const tokenName = self.parser.terminals_[token] || token;

              // Skip numeric EOF (1) as it will be recorded as symbolic EOF later
              if (!(token === 1 && tokenName === 1)) {
                // Capture token event
                self.events.push({
                  type: 'token',
                  tokenType: tokenName,
                  text: this.yytext,
                  startPos: startPos,
                  endPos: endPos,
                  line: this.yylineno + 1
                });

                // Capture database snapshot after token
                self.dbSnapshots.push(self.captureDbSnapshot(parserObj.yy));
              }
            }

            return token;
          };

          // Wrap parser.performAction to capture reductions
          const originalPerformAction = this.performAction;
          const parserObj = this; // Save reference to parser object

          this.performAction = function(yytext, yyleng, yylineno, yy, yystate, $$, _$) {
            // Get rule being reduced from parser object (not 'this' which is yyval)
            const production = parserObj.productions_[yystate];
            const len = production[1]; // Number of RHS symbols

            // IMPORTANT: Capture location information BEFORE calling semantic action
            // The location stack (_$) can be mutated by the semantic action
            // Deep clone the locations to preserve them
            const locations = _$ ? JSON.parse(JSON.stringify(_$)) : _$;

            // Call the original perform action (this modifies the database and may mutate locations)
            const result = originalPerformAction.call(this, yytext, yyleng, yylineno, yy, yystate, $$, _$);

            // Get the location range for this reduction
            // For left-recursive productions like "document → document line",
            // we only want the location of the NEW symbols (skipping the accumulated LHS)
            let startPos = null;
            let endPos = null;
            let firstLine = null;
            let lastLine = null;
            let relevantSymbols = [];

            if (len > 0 && locations && locations.length >= len) {
              // Get locations for all symbols in this reduction
              const locs = locations.slice(-len);

              // Deterministically detect left-recursive productions:
              // Known left-recursive productions where first RHS symbol = LHS symbol:
              // - Production 3: document → document line (LHS=5) [LEFT-RECURSIVE]
              // - Production 60: attributes → attribute attributes (LHS=18) [RIGHT-RECURSIVE - REMOVE!]
              // - Production 44: stylesOpt → stylesOpt COMMA style (LHS=38) [LEFT-RECURSIVE]
              // - Production 46: style → style styleComponent (LHS=45) [LEFT-RECURSIVE]
              // - Production 39,40: idList → idList COMMA ... (LHS=16) [LEFT-RECURSIVE]
              // - Production 68: attributeKeyTypeList → attributeKeyTypeList ',' ... (LHS=56) [LEFT-RECURSIVE]

              const leftRecursiveProductions = new Set([3, 39, 40, 44, 46, 68]);

              if (leftRecursiveProductions.has(yystate)) {
                // For left-recursive productions, skip the first symbol (accumulated result)
                // and only show locations of the newly added symbols
                relevantSymbols = locs.slice(1);
              } else {
                // For non-left-recursive productions, use all symbols
                relevantSymbols = locs;
              }

              // DEBUG: Log attributes productions
              // if (production[0] === 18) {
              //   console.log('INSTRUMENTOR attributes:', {
              //     ruleNum: yystate,
              //     len: len,
              //     isLeftRecursive: leftRecursiveProductions.has(yystate),
              //     locationStackSize: locations.length,
              //     lastFewLocations: locations.slice(-5).map(l => l.range),
              //     allLocs: locs.map(l => l.range),
              //     relevantSymbols: relevantSymbols.map(l => l.range),
              //     inputSnippet: input.substring(0, 60).replace(/\n/g, '\\n')
              //   });
              // }

              // Now get the span of relevant symbols
              if (relevantSymbols.length > 0) {
                const validLocs = relevantSymbols.filter(loc =>
                  loc && loc.range && loc.range[0] !== undefined && loc.range[1] !== undefined
                );

                if (validLocs.length > 0) {
                  startPos = Math.min(...validLocs.map(loc => loc.range[0]));
                  endPos = Math.max(...validLocs.map(loc => loc.range[1]));
                  firstLine = validLocs[0].first_line;
                  lastLine = validLocs[validLocs.length - 1].last_line;
                }
              }
            }

            // Now capture the event and snapshot AFTER the semantic action
            self.events.push({
              type: 'reduce',
              ruleNum: yystate, // Production rule number
              ruleLHS: production[0], // LHS symbol
              length: len, // Number of RHS symbols
              semantic: [...$$].slice(-len), // Captured semantic values
              startPos: startPos, // Start position in input
              endPos: endPos, // End position in input
              firstLine: firstLine, // First line number
              lastLine: lastLine // Last line number
            });

            // Capture database snapshot after reduce
            self.dbSnapshots.push(self.captureDbSnapshot(yy));

            return result;
          };

          return parseFunc.call(this, input);
        };

        this.instrumented = true;
      }

      const result = this.parser.parse(input);
      return { result, events: this.events, dbSnapshots: this.dbSnapshots };
    }
  }

  return Instrumentor;
}));
