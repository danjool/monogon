(function(root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = factory();
  } else {
    // Browser global
    root.RuleExplainer = factory();
  }
}(typeof self !== 'undefined' ? self : this, function() {

  class RuleExplainer {
    constructor(input, events) {
      this.input = input;
      this.events = events;
    }

    // Extract tokens that were reduced into this production
    getReducedTokens(reduction) {
      const tokens = [];
      // Find all TOKEN events that fall within this reduction's span
      for (let i = 0; i < this.events.length; i++) {
        const evt = this.events[i];
        if (evt.type === 'token' &&
            evt.startPos >= reduction.startPos &&
            evt.endPos <= reduction.endPos) {
          tokens.push(evt);
        }
      }
      return tokens;
    }

    // Get the actual text span of the reduction
    getSpanText(reduction) {
      return this.input.substring(reduction.startPos, reduction.endPos).trim();
    }

    // Generate explanation based on rule LHS and context
    explain(reduction) {
      const spanText = this.getSpanText(reduction);
      const tokens = this.getReducedTokens(reduction);
      const ruleLHS = String(reduction.ruleLHS);

      // DEBUG: Log all reductions
      if (reduction.ruleLHS === 18) { // attributes
        console.log('Attributes Reduction:', {
          ruleNum: reduction.ruleNum,
          ruleLHS: reduction.ruleLHS,
          tokensLength: tokens.length,
          tokens: tokens.map(t => ({type: t.tokenType, text: t.text, pos: `${t.startPos}-${t.endPos}`})),
          spanText: spanText,
          startPos: reduction.startPos,
          endPos: reduction.endPos,
          length: reduction.length
        });
      }

      // Map LHS symbols to explanation templates
      // Note: These are LHS symbol numbers from parser.symbols_, not production numbers
      switch(ruleLHS) {
        case '3': // start
          return "Completed parsing ER diagram";

        case '5': // document (can be: ε | document line)
          // Check if this is the empty production (document → ε)
          if (tokens.length === 0 && reduction.ruleNum === 2) {
            return "Initialized an empty document";
          }
          // Otherwise it's document → document line
          const lineTokens = tokens.filter(t => t.tokenType !== 'SPACE');
          if (lineTokens.length === 0 || (lineTokens.length === 1 && lineTokens[0].tokenType === 'NEWLINE')) {
            return "Added a line containing no statements";
          } else if (lineTokens.length === 1 && lineTokens[0].tokenType === 'EOF') {
            return "Reached end of input";
          } else {
            return "Added a line containing a statement to the document";
          }

        case '7': // line → SPACE statement | statement | NEWLINE | EOF
          // Check what kind of line this is
          const lineTokens2 = tokens.filter(t => t.tokenType !== 'SPACE');
          if (lineTokens2.length === 0 || (lineTokens2.length === 1 && lineTokens2[0].tokenType === 'NEWLINE')) {
            return "Newlines get parsed as their own 'line'";
          } else if (lineTokens2.length === 1 && lineTokens2[0].tokenType === 'EOF') {
            return "End marker (no final newline)";
          } else {
            return "Completed line with statement";
          }

        case '9': // statement (various forms: relationships, entities, etc.)
          const entities = tokens.filter(t =>
            ['UNICODE_TEXT', 'ENTITY_NAME'].includes(t.tokenType));

          // Check if this is a relationship (has relSpec indicators)
          const hasRelTokens = tokens.some(t =>
            ['ZERO_OR_ONE', 'ZERO_OR_MORE', 'ONE_OR_MORE', 'ONLY_ONE', 'NON_IDENTIFYING', 'IDENTIFYING'].includes(t.tokenType));

          if (hasRelTokens && entities.length >= 2) {
            return `Relationship: "${entities[0].text}" to "${entities[1].text}"`;
          } else if (tokens.some(t => t.tokenType === 'BLOCK_START')) {
            // Entity with or without attributes
            const entityToken = entities[0];
            if (entityToken) {
              // Count attributes by counting ATTRIBUTE_WORD tokens and dividing by 2 (type + name)
              const attrWords = tokens.filter(t => t.tokenType === 'ATTRIBUTE_WORD');
              const attrCount = Math.floor(attrWords.length / 2);
              if (attrCount > 0) {
                const attrText = attrCount === 1 ? '1 attribute' : `${attrCount} attributes`;
                return `Entity "${entityToken.text}" with ${attrText} declared`;
              } else {
                return `Entity "${entityToken.text}" (empty) declared`;
              }
            }
            return "Defined entity";
          } else if (entities.length > 0) {
            // Simple entity declaration
            return `Entity "${entities[0].text}" declared`;
          }
          return "Statement parsed";

        case '11': // entityName
          return `Entity name: "${spanText}"`;

        case '12': // relSpec (cardinality relType cardinality)
          return "Relationship specification";

        case '14': // role
          if (spanText) {
            return `"${spanText}" token must be a 'role', aka the label on the relation`;
          }
          return "Relationship role";

        case '16': // idList
          if (tokens.length === 1) {
            return `ID: "${spanText}"`;
          } else {
            return `ID list: "${spanText}"`;
          }

        case '18': // attributes
          if (reduction.ruleNum === 60) {
            // attributes → attribute attributes (right-recursive, adding to list)
            return "Added attribute to list";
          } else {
            // attributes → attribute (starting the list)
            return "Started attribute list with one attribute included";
          }

        case '53': // attribute
          const words = tokens.filter(t => t.tokenType === 'ATTRIBUTE_WORD');
          if (words.length >= 2) {
            return `Attribute: ${words[0].text} ${words[1].text}`;
          } else if (spanText) {
            return `Attribute: ${spanText}`;
          }
          return "Defined entity attribute";

        case '54': // attributeType
          return `Type: "${spanText}"`;

        case '55': // attributeName
          return `Name: "${spanText}"`;

        case '56': // attributeKeyTypeList
          return `Key constraint: ${spanText}`;

        case '59': // attributeKeyType
          return `Key: "${spanText}"`;

        case '57': // attributeComment
          return `Comment: "${spanText}"`;

        case '63': // cardinality
          const cardToken = tokens[0];
          if (cardToken) {
            switch(cardToken.tokenType) {
              case 'ZERO_OR_ONE': return "Cardinality: zero or one (optional)";
              case 'ZERO_OR_MORE': return "Cardinality: zero or more";
              case 'ONE_OR_MORE': return "Cardinality: one or more";
              case 'ONLY_ONE': return "Cardinality: exactly one";
              default: return "Cardinality specified";
            }
          }
          return "Cardinality specified";

        case '64': // relType
          const relToken = tokens[0];
          if (relToken) {
            if (relToken.tokenType === 'IDENTIFYING') {
              return "Identifying relationship type";
            } else {
              return "Non-identifying relationship type";
            }
          }
          return "Relationship type specified";

        case '29': // direction
          return `Direction: ${spanText}`;

        case '30': // classDefStatement
          return "Defined CSS class for styling";

        case '31': // classStatement
          return "Applied CSS class to elements";

        case '32': // styleStatement
          return "Applied inline styles";

        case '38': // stylesOpt
          return `Style: ${spanText}`;

        case '45': // style
          return `Style component: ${spanText}`;

        case '46': // styleComponent
          return `Style part: "${spanText}"`;

        case '39': // separator
          return "Statement separator";

        default:
          // Fallback for any unmapped rules
          if (spanText) {
            return `Reduced "${spanText}" (rule ${ruleLHS})`;
          }
          return `Applied grammar rule ${ruleLHS}`;
      }
    }
  }

  return RuleExplainer;
}));
