(function(root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = factory();
  } else {
    // Browser global
    root.Animator = factory();
  }
}(typeof self !== 'undefined' ? self : this, function() {

  class Animator {
    constructor(input, events, dbSnapshots, visualizer, eventsPanel, databasePanel, erDb) {
      this.input = input;
      this.events = events;
      this.dbSnapshots = dbSnapshots;
      this.visualizer = visualizer;
      this.eventsPanel = eventsPanel;
      this.databasePanel = databasePanel;
      this.erDb = erDb;

      this.cursorPos = 0;
      this.currentEventIndex = -1;

      // Build position-to-events mapping
      this.positionMap = this.buildPositionMap();

      // Track which tokens have been revealed
      this.revealedTokens = new Set();

      // Track which events have been shown
      this.shownEvents = [];

      // Track events added in the most recent cursor move
      this.newlyAddedEventIndices = new Set();

      // Create rule explainer for generating human-readable descriptions
      this.explainer = new RuleExplainer(input, events);
    }

    buildPositionMap() {
      const map = {};

      this.events.forEach((event, index) => {
        if (event.type === 'token') {
          // Token completes at its endPos
          const pos = event.endPos;
          if (!map[pos]) map[pos] = [];
          map[pos].push({ type: 'token', event, index });
        } else if (event.type === 'reduce') {
          // REDUCE events happen after the last token they depend on
          // Find the most recent TOKEN event before this REDUCE
          let lastTokenEndPos = 0;
          for (let i = index - 1; i >= 0; i--) {
            if (this.events[i].type === 'token') {
              lastTokenEndPos = this.events[i].endPos;
              break;
            }
          }
          if (!map[lastTokenEndPos]) map[lastTokenEndPos] = [];
          map[lastTokenEndPos].push({ type: 'reduce', event, index });
        }
      });

      return map;
    }

    stepForward() {
      if (this.cursorPos >= this.input.length) {
        return false; // Already at end
      }

      this.cursorPos++;
      this.updateVisualization();
      return true;
    }

    stepBackward() {
      if (this.cursorPos <= 0) {
        return false; // Already at start
      }

      this.cursorPos--;
      this.updateVisualization();
      return true;
    }

    reset() {
      this.cursorPos = 0;
      this.currentEventIndex = -1;
      this.revealedTokens.clear();
      this.shownEvents = [];
      this.erDb.clear();
      this.updateVisualization();
    }

    updateVisualization() {
      // Track which event indices we had before this update
      const previousEventIndices = new Set(this.shownEvents.map(e => e.index));

      // Update cursor position and reveal tokens up to current position
      const tokensToReveal = [];
      const eventsToShow = [];
      const reductionsToShow = [];

      // Find all events that should be triggered at or before current position
      for (let pos = 0; pos <= this.cursorPos; pos++) {
        if (this.positionMap[pos]) {
          this.positionMap[pos].forEach(({ type, event, index }) => {
            if (type === 'token') {
              tokensToReveal.push(event);
            } else if (type === 'reduce' && event.startPos !== null && event.endPos !== null) {
              // Only include reductions that have valid position spans
              reductionsToShow.push(event);
            }
            eventsToShow.push({ type, event, index });
          });
        }
      }

      // Update shownEvents for next comparison
      this.shownEvents = eventsToShow;

      // Determine which events are newly added (not in previous set)
      this.newlyAddedEventIndices.clear();
      eventsToShow.forEach(({ index }) => {
        if (!previousEventIndices.has(index)) {
          this.newlyAddedEventIndices.add(index);
        }
      });

      // Update left panel: tokenized input with cursor and reduction borders
      this.visualizer.renderTokensWithCursor(this.input, tokensToReveal, this.cursorPos, reductionsToShow);

      // Update center panel: events list
      this.renderEvents(eventsToShow);

      // Update right panel: database state
      this.updateDatabaseState(eventsToShow);
    }

    renderEvents(eventsToShow) {
      this.eventsPanel.innerHTML = '<div class="panel-header"><h3 style="margin: 0;">Parse Events</h3></div>';

      // Reverse the order - most recent first
      const reversedEvents = [...eventsToShow].reverse();

      reversedEvents.forEach(({ type, event, index }) => {
        const div = document.createElement('div');
        div.className = 'event';

        if (type === 'token') {
          div.className += ' token';
          div.textContent = `TOKEN ${event.tokenType} = "${event.text}"`;

          // Use matching token color
          const color = Visualizer.tokenColors[event.tokenType] || '#ecf0f1';
          div.style.borderLeftColor = color;
        } else if (type === 'reduce') {
          div.className += ' reduce';
          const ruleText = (typeof grammarRules !== 'undefined' && grammarRules[event.ruleNum])
            ? grammarRules[event.ruleNum]
            : `rule ${event.ruleNum}`;

          // Use matching reduction color
          const color = Visualizer.reductionColors[event.ruleLHS] || '#7f8c8d';
          div.style.borderLeftColor = color;

          // Create main rule text
          const mainText = document.createElement('div');
          mainText.textContent = `REDUCE ${ruleText}`;
          div.appendChild(mainText);

          // Add human-readable explanation (always show, even for epsilon reductions)
          const explanation = this.explainer.explain(event);
          const explainDiv = document.createElement('div');
          explainDiv.style.cssText = 'font-size: 10px; color: #a8a8a8; margin-top: 2px; font-style: italic;';
          explainDiv.textContent = `  ↳ ${explanation}`;
          div.appendChild(explainDiv);
        }

        // Highlight events that were newly added in the most recent cursor move
        if (this.newlyAddedEventIndices.has(index)) {
          div.style.backgroundColor = '#3b3b3bff';
        }

        this.eventsPanel.appendChild(div);
      });
    }

    updateDatabaseState(eventsToShow) {
      // Get the snapshot corresponding to the last event shown
      let snapshot = { entities: [], relationships: [], direction: "TB" };

      if (eventsToShow.length > 0) {
        const lastEventIndex = eventsToShow[eventsToShow.length - 1].index;
        if (this.dbSnapshots[lastEventIndex]) {
          snapshot = this.dbSnapshots[lastEventIndex];
        }
      }

      this.databasePanel.innerHTML = '<div class="panel-header"><h3 style="margin: 0;">ER Database</h3></div>';
      const pre = document.createElement('pre');
      pre.style.cssText = 'margin: 0; color: #d4d4d4;';
      pre.textContent = JSON.stringify(snapshot, null, 2);
      this.databasePanel.appendChild(pre);
    }
  }

  return Animator;
}));
