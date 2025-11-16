(function(root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = factory();
  } else {
    // Browser global
    root.Visualizer = factory();
  }
}(typeof self !== 'undefined' ? self : this, function() {

  // Shared color schemes - define as constants first
  const tokenColors = {
    'ER_DIAGRAM': '#e74c3c',      // Red
    'ALPHANUM': '#3498db',         // Blue
    'UNICODE_TEXT': '#2ecc71',     // Green
    'BLOCK_START': '#95a5a6',      // Gray
    'BLOCK_STOP': '#95a5a6',       // Gray
    'NEWLINE': '#34495e',          // Dark gray
    'COLON': '#e67e22',            // Orange
    'ZERO_OR_ONE': '#9b59b6',      // Purple
    'ZERO_OR_MORE': '#9b59b6',     // Purple
    'ONE_OR_MORE': '#9b59b6',      // Purple
    'ONLY_ONE': '#9b59b6',         // Purple
    'NON_IDENTIFYING': '#f39c12',  // Yellow
    'IDENTIFYING': '#f39c12',      // Yellow
    'RELATIONSHIP': '#1abc9c',     // Teal
    'EOF': '#bdc3c7',              // Light gray
    'SPACE': '#2c3e50'             // Very dark gray
  };

  const reductionColors = {
    '3': '#ab8275',    // start - beige
    '5': '#6f544bff',    // document - green
    '7': '#3f2f2aff',    // line - orange
    '9': '#3498db',    // statement - blue
    '11': '#e74c3c',   // entityName - red
    '12': '#7e03aeff',   // relSpec - purple
    '14': '#b012f3ff',   // role - yellow
    '16': '#1abc9c',   // idList - teal
    '18': '#95a5a6',   // attributes - gray
    '53': '#c0392b',   // attribute - dark red
    '63': '#ffffff',   // cardinality - white
    '64': '#2ec563ff'    // relType - dark orange
  };

  class Visualizer {
    constructor(containerId) {
      this.container = document.getElementById(containerId);

      // Reference colors
      this.tokenColors = tokenColors;
      this.reductionColors = reductionColors;
    }

    createCursor() {
      const cursor = document.createElement('span');
      cursor.className = 'cursor';
      cursor.style.cssText = `
        display: inline-block;
        width: 2px;
        height: 1.2em;
        background-color: #ffd700;
        animation: blink 1s infinite;
        margin: -4px -1px;
      `;
      return cursor;
    }

    renderTokensWithCursor(input, revealedTokens, cursorPos, activeReductions = []) {
      // Clear only the token content, not the legend
      const existingTokenContainer = this.container.querySelector('.token-container');
      if (existingTokenContainer) {
        existingTokenContainer.remove();
      }

      const tokenContainer = document.createElement('div');
      tokenContainer.className = 'token-container';
      tokenContainer.style.cssText = `
        line-height: 2.0;
        font-family: 'Consolas', 'Courier New', monospace;
        white-space: nowrap;
        word-wrap: break-word;
        position: relative;
        margin-bottom: 10px;
        min-height: 200px;
      `;

      // Step 1: Render all tokens and build a flat list with position tracking
      const contentNodes = []; // Array of {node, startPos, endPos}
      const sortedTokens = [...revealedTokens].sort((a, b) => a.startPos - b.startPos);
      let lastPos = 0;

      sortedTokens.forEach(evt => {
        // Add any text/cursor before token
        if (evt.startPos > lastPos) {
          const gap = input.substring(lastPos, evt.startPos);
          for (let i = 0; i < gap.length; i++) {
            const char = gap[i];
            const pos = lastPos + i;
            if (pos === cursorPos) {
              contentNodes.push({node: this.createCursor(), startPos: pos, endPos: pos});
            }
            if (char === '\n') {
              contentNodes.push({node: document.createElement('br'), startPos: pos, endPos: pos + 1});
            } else if (char === ' ') {
              // Use non-breaking space to prevent HTML whitespace collapse
              contentNodes.push({node: document.createTextNode('\u00A0'), startPos: pos, endPos: pos + 1});
            } else {
              contentNodes.push({node: document.createTextNode(char), startPos: pos, endPos: pos + 1});
            }
          }
        }

        // Create token span
        const span = document.createElement('span');
        span.className = 'token';
        const color = this.tokenColors[evt.tokenType] || '#ecf0f1';
        const invisibleTokens = ['NEWLINE', 'SPACE', 'EOF'];
        const isInvisible = invisibleTokens.includes(evt.tokenType);

        span.style.cssText = `
          background-color: ${color};
          color: #1e1e1e;
          padding: ${isInvisible ? '2px 4px' : '0px 0px'};
          border-radius: 3px;
          font-weight: 600;
          cursor: help;
        `;

        if (isInvisible) {
          if (evt.tokenType === 'NEWLINE') {
            span.textContent = '↵';
          } else if (evt.tokenType === 'SPACE') {
            // Show one '·' per space character to maintain visual spacing
            span.textContent = '·'.repeat(evt.text.length);
          } else {
            span.textContent = '⊣'; // EOF
          }
        } else {
          span.textContent = evt.text;
        }
        span.title = evt.tokenType;

        // Cursor within token
        for (let i = 0; i < evt.text.length; i++) {
          if (evt.startPos + i === cursorPos) {
            contentNodes.push({node: this.createCursor(), startPos: evt.startPos + i, endPos: evt.startPos + i});
          }
        }

        contentNodes.push({node: span, startPos: evt.startPos, endPos: evt.endPos});

        if (evt.tokenType === 'NEWLINE') {
          contentNodes.push({node: document.createElement('br'), startPos: evt.endPos, endPos: evt.endPos});
        }
        lastPos = evt.endPos;
      });

      // Remaining text
      if (lastPos < input.length) {
        const remaining = input.substring(lastPos);
        for (let i = 0; i < remaining.length; i++) {
          const pos = lastPos + i;
          if (pos === cursorPos) {
            contentNodes.push({node: this.createCursor(), startPos: pos, endPos: pos});
          }
          if (remaining[i] === '\n') {
            contentNodes.push({node: document.createElement('br'), startPos: pos, endPos: pos + 1});
          } else if (remaining[i] === ' ') {
            // Use non-breaking space to prevent HTML whitespace collapse
            contentNodes.push({node: document.createTextNode('\u00A0'), startPos: pos, endPos: pos + 1});
          } else {
            contentNodes.push({node: document.createTextNode(remaining[i]), startPos: pos, endPos: pos + 1});
          }
        }
      }

      if (cursorPos >= input.length) {
        contentNodes.push({node: this.createCursor(), startPos: input.length, endPos: input.length});
      }

      // Step 2: Apply reductions in parse order, wrapping matching nodes
      activeReductions.forEach(reduction => {
        // Find nodes within this reduction's span
        const matchingIndices = [];
        contentNodes.forEach((item, idx) => {
          if (item.startPos >= reduction.startPos && item.endPos <= reduction.endPos) {
            matchingIndices.push(idx);
          }
        });

        if (matchingIndices.length === 0) return;

        // Calculate nesting depth by examining the actual nodes we're about to wrap
        // Find the maximum depth among child wrapper elements
        let maxChildDepth = -1;
        matchingIndices.forEach(idx => {
          const node = contentNodes[idx].node;
          if (node.className === 'reduction-wrapper' && node.dataset.depth) {
            const childDepth = parseInt(node.dataset.depth);
            if (childDepth > maxChildDepth) {
              maxChildDepth = childDepth;
            }
          }
        });
        const nestingDepth = maxChildDepth + 1; // This wrapper is one level deeper than its deepest child

        // Determine if this is a block-level reduction (spans multiple lines)
        const blockLevelSymbols = ['3', '5', '7']; // start, document, line
        const isBlockLevel = blockLevelSymbols.includes(String(reduction.ruleLHS));

        // Check if this reduction contains only whitespace (newlines/spaces)
        const spanText = input.substring(reduction.startPos, reduction.endPos);
        const containsOnlyWhitespace = /^[\s\n]*$/.test(spanText);

        // Create wrapper with size based on nesting depth
        const wrapper = document.createElement(isBlockLevel ? 'div' : 'span');
        wrapper.className = 'reduction-wrapper';
        wrapper.dataset.depth = nestingDepth; // Store depth for future wrappers
        const color = this.reductionColors[reduction.ruleLHS] || '#7f8c8d';
        const borderWidth = 0; // + nestingDepth;
        const padding = nestingDepth+1;

        if (isBlockLevel) {
          if (containsOnlyWhitespace) {
            // Empty lines: stay as block to preserve line breaks
            wrapper.style.cssText = `
              display: block;
              width: fit-content;
              border: ${borderWidth}px solid ${color};
              background-color: ${color};
              padding: 2px 2px;
              border-radius: 0px;
              white-space: nowrap;
            `;
          } else {
            // Content lines: use inline-block to keep content inline
            wrapper.style.cssText = `
              display: inline-block;
              width: fit-content;
              border: ${borderWidth}px solid ${color};
              background-color: ${color};
              padding: 2px 2px;
              border-radius: 0px;
              white-space: nowrap;
            `;
          }
        } else {
          wrapper.style.cssText = `
            border: ${borderWidth}px solid ${color};
            background-color: ${color};
            padding: ${padding*2}px ${padding}px;
            border-radius: 0px;
          `;
        }
        if (typeof grammarRules !== 'undefined' && grammarRules[reduction.ruleNum]) {
          wrapper.title = `REDUCE ${grammarRules[reduction.ruleNum]} (depth: ${nestingDepth})`;
        }

        // Move matching nodes into wrapper
        const wrappedNodes = [];
        matchingIndices.forEach(idx => {
          wrapper.appendChild(contentNodes[idx].node);
          wrappedNodes.push(contentNodes[idx]);
        });

        // Replace first matched node with wrapper, remove others
        contentNodes[matchingIndices[0]] = {
          node: wrapper,
          startPos: reduction.startPos,
          endPos: reduction.endPos
        };
        // Mark removed indices
        for (let i = 1; i < matchingIndices.length; i++) {
          contentNodes[matchingIndices[i]] = null;
        }
        // Clean nulls
        contentNodes.splice(0, contentNodes.length, ...contentNodes.filter(n => n !== null));
      });

      // Step 3: Append all nodes to container
      contentNodes.forEach(item => tokenContainer.appendChild(item.node));

      // Insert token container before the legend (if it exists)
      const legend = this.container.querySelector('.legend-container');
      if (legend) {
        this.container.insertBefore(tokenContainer, legend);
      } else {
        this.container.appendChild(tokenContainer);
      }
    }

    renderLegend() {
      // Only render if legend doesn't already exist
      if (this.container.querySelector('.legend-container')) {
        return;
      }

      const legend = document.createElement('div');
      legend.className = 'legend-container';
      legend.style.cssText = `
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #3e3e42;
      `;
      legend.innerHTML = '<h4 style="color: #4fc1ff; margin: 0 0 6px 0; font-size: 11px;">Token Legend:</h4>';

      const legendContent = document.createElement('div');
      legendContent.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      `;

      // Get unique token types from the color map
      Object.entries(this.tokenColors).forEach(([type, color]) => {
        const item = document.createElement('span');
        item.style.cssText = `
          background-color: ${color};
          color: #1e1e1e;
          padding: 3px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 600;
          white-space: nowrap;
        `;
        item.textContent = type;
        legendContent.appendChild(item);
      });

      legend.appendChild(legendContent);
      this.container.appendChild(legend);
    }
  }

  // Attach color schemes as static properties for external access
  Visualizer.tokenColors = tokenColors;
  Visualizer.reductionColors = reductionColors;

  return Visualizer;
}));
