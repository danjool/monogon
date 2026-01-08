// Visualizer control and UI rendering

class Visualizer {
  constructor() {
    this.steps = [];
    this.currentStep = 0;
    this.source = '';
    this.allTokens = [];
    this.compilationJumps = [];  // Preserve jumps from compilation
  }

  loadSource(source) {
    this.source = source;
    this.currentStep = 0;

    // First, scan all tokens
    const scanner = new Scanner(source);
    this.allTokens = scanner.scanAllTokens();

    // Then compile and record steps
    const compileResult = compile(source);
    this.chunk = compileResult.chunk;

    // Preserve jumps from the last compilation step
    if (compileResult.steps.length > 0) {
      const lastCompileStep = compileResult.steps[compileResult.steps.length - 1];
      this.compilationJumps = lastCompileStep.jumps || [];
    }

    // Then run VM and record execution steps
    const vmResult = runVM(this.chunk);

    // Combine compilation steps and runtime steps
    this.steps = [
      ...compileResult.steps,
      ...(vmResult.steps || [])
    ];

    this.render();
  }

  nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.render();
    }
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.render();
    }
  }

  jumpToStep(index) {
    if (index >= 0 && index < this.steps.length) {
      this.currentStep = index;
      this.render();
    }
  }

  render() {
    if (this.steps.length === 0) return;

    const step = this.steps[this.currentStep];

    // Update step counter
    document.getElementById('step-counter').textContent =
      `Step ${this.currentStep + 1} / ${this.steps.length}`;

    // Update step description
    document.getElementById('step-description').textContent =
      step.description;

    // Render source with current line highlighted
    this.renderSource(step);

    // Render tokens
    this.renderTokens(step);

    // Render parser call stack
    this.renderParserCallStack(step);

    // Render compiler state
    this.renderCompilerState(step);

    // Render parse rules table
    this.renderParseRules();

    // Render constants pool
    this.renderConstants(step);

    // Render lines metadata
    this.renderLines(step);

    // Render bytecode
    this.renderBytecode(step);

    // Render runtime state (stack, globals, and output)
    this.renderStack(step);
    this.renderGlobals(step);
    this.renderOutput(step);
  }

  renderSource(step) {
    const sourceEl = document.getElementById('source-code');
    const lines = this.source.split('\n');
    const currentLine = step.currentToken ? step.currentToken.line : 1;

    let html = '';
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const isActive = lineNum === currentLine;
      html += `<div class="source-line ${isActive ? 'active' : ''}">`;
      html += `<span class="line-number">${lineNum}</span>`;
      html += `<span class="line-text">${escapeHtml(line)}</span>`;
      html += `</div>`;
    });

    sourceEl.innerHTML = html;

    // Auto-scroll to keep current line centered within the container (not the page)
    const activeLine = sourceEl.querySelector('.source-line.active');
    if (activeLine) {
      const containerHeight = sourceEl.offsetHeight;
      const lineTop = activeLine.offsetTop;
      const lineHeight = activeLine.offsetHeight;

      // Calculate scroll position to center the line
      const scrollTop = lineTop - (containerHeight / 2) + (lineHeight / 2);
      sourceEl.scrollTop = scrollTop;
    }
  }

  renderTokens(step) {
    const tokensEl = document.getElementById('tokens');
    const currentToken = step.currentToken;
    const previousToken = step.previousToken;

    let html = '';
    let currentIndex = -1;

    this.allTokens.forEach((token, idx) => {
      const isCurrent = currentToken && token.index === currentToken.index;
      const isPrevious = previousToken && token.index === previousToken.index;

      if (isCurrent) currentIndex = idx;

      const colorClass = this.getTokenColorClass(token.type);
      const stateClass = isCurrent ? 'current' : (isPrevious ? 'previous' : '');
      html += `<div class="token ${colorClass ? 'color-' + colorClass : ''} ${stateClass}" data-index="${idx}">`;
      html += escapeHtml(token.lexeme || token.type);
      html += `</div>`;
    });

    tokensEl.innerHTML = html;

    // Center the current token with animation
    if (currentIndex >= 0) {
      this.centerCarouselItem(tokensEl, currentIndex);
    }
  }

  getTokenColorClass(tokenType) {
    // Map token types to operation color classes
    const typeStr = tokenType.toString();

    // Literals
    if (typeStr.includes('NUMBER')) return 'number';
    if (typeStr.includes('STRING')) return 'string';
    if (typeStr.includes('TRUE') || typeStr.includes('FALSE')) return 'boolean';
    if (typeStr.includes('NIL')) return 'nil';

    // Arithmetic operators
    if (typeStr === 'TOKEN_PLUS') return 'plus';
    if (typeStr === 'TOKEN_MINUS') return 'minus-binary';  // Could be unary or binary
    if (typeStr === 'TOKEN_STAR') return 'star';
    if (typeStr === 'TOKEN_SLASH') return 'slash';

    // Comparison operators
    if (typeStr === 'TOKEN_EQUAL_EQUAL') return 'equal';
    if (typeStr === 'TOKEN_BANG_EQUAL') return 'not-equal';
    if (typeStr === 'TOKEN_LESS') return 'less';
    if (typeStr === 'TOKEN_GREATER') return 'greater';
    if (typeStr === 'TOKEN_LESS_EQUAL') return 'less-equal';
    if (typeStr === 'TOKEN_GREATER_EQUAL') return 'greater-equal';

    // Logical operators
    if (typeStr === 'TOKEN_BANG') return 'not';
    if (typeStr === 'TOKEN_AND') return 'and';
    if (typeStr === 'TOKEN_OR') return 'or';

    // Variables
    if (typeStr === 'TOKEN_IDENTIFIER') return 'variable';

    // Grouping
    if (typeStr === 'TOKEN_LEFT_PAREN' || typeStr === 'TOKEN_RIGHT_PAREN') return 'grouping';

    // Control flow
    if (typeStr === 'TOKEN_IF' || typeStr === 'TOKEN_ELSE') return 'if';
    if (typeStr === 'TOKEN_WHILE') return 'while';
    if (typeStr === 'TOKEN_FOR') return 'for';

    // Print
    if (typeStr === 'TOKEN_PRINT') return 'print';

    return '';
  }

  getOpcodeColorClass(opcodeName) {
    // Map opcodes to operation color classes
    const colorMap = {
      'OP_CONSTANT': 'literal',
      'OP_NIL': 'nil',
      'OP_TRUE': 'boolean',
      'OP_FALSE': 'boolean',
      'OP_ADD': 'plus',
      'OP_SUBTRACT': 'minus-binary',
      'OP_MULTIPLY': 'star',
      'OP_DIVIDE': 'slash',
      'OP_NEGATE': 'minus-unary',
      'OP_NOT': 'not',
      'OP_EQUAL': 'equal',
      'OP_GREATER': 'greater',
      'OP_LESS': 'less',
      'OP_PRINT': 'print',
      'OP_GET_GLOBAL': 'variable',
      'OP_SET_GLOBAL': 'variable',
      'OP_GET_LOCAL': 'variable',
      'OP_SET_LOCAL': 'variable',
      'OP_DEFINE_GLOBAL': 'variable',
      'OP_JUMP': 'if',
      'OP_JUMP_IF_FALSE': 'if',
      'OP_LOOP': 'while'
    };

    return colorMap[opcodeName] || '';
  }

  renderCompilerState(step) {
    const compilerEl = document.getElementById('compiler-state');
    const compiler = step.compiler;

    // Runtime steps don't have compiler state
    if (!compiler) {
      compilerEl.innerHTML = '<div class="no-runtime">(runtime - no compiler state)</div>';
      return;
    }

    let html = '<div class="compiler-info">';

    // Scope depth section
    html += '<div class="compiler-section">';
    html += `<div class="scope-depth">Scope Depth: ${compiler.scopeDepth}</div>`;
    html += '</div>';

    // Locals section
    html += '<div class="compiler-section" style="flex: 1;">';
    html += '<div class="locals-title">Locals:</div>';
    if (compiler.locals.length === 0) {
      html += '<div class="no-locals">(none)</div>';
    } else {
      html += '<table class="locals-table">';
      html += '<tr><th>Name</th><th>Depth</th></tr>';
      compiler.locals.forEach(local => {
        html += '<tr>';
        html += `<td>${escapeHtml(local.name)}</td>`;
        html += `<td>${local.depth === -1 ? '(uninitialized)' : local.depth}</td>`;
        html += '</tr>';
      });
      html += '</table>';
    }
    html += '</div>';

    html += '</div>';

    compilerEl.innerHTML = html;
  }

  renderParserCallStack(step) {
    const callStackEl = document.getElementById('parser-call-stack');
    const parserCallStack = step.parserCallStack;

    // Runtime steps or early compilation steps don't have parser call stack
    if (!parserCallStack || parserCallStack.length === 0) {
      callStackEl.innerHTML = '<div class="no-parser-stack">(no active parsing)</div>';
      return;
    }

    let html = '<div class="parser-call-stack-list">';

    parserCallStack.forEach((frame, index) => {
      // Determine color based on pending operation
      let colorClass = '';
      if (frame.pendingOp) {
        colorClass = this.getColorClassFromOp(frame.pendingOp);
      }

      html += `<div class="call-stack-frame ${colorClass}" style="margin-left: ${index * 15}px;">`;
      html += `parsePrecedence(${frame.precedence})`;
      if (frame.pendingOp) {
        html += ` → pending: ${frame.pendingOp}`;
      }
      html += `</div>`;
    });

    html += '</div>';
    callStackEl.innerHTML = html;
  }

  getColorClassFromOp(opName) {
    // Map operation names to color classes
    const opMap = {
      'OP_ADD': 'color-plus',
      'OP_SUBTRACT': 'color-minus-binary',
      'OP_MULTIPLY': 'color-star',
      'OP_DIVIDE': 'color-slash',
      'OP_NEGATE': 'color-minus-unary',
      'OP_NOT': 'color-not',
      'OP_EQUAL': 'color-equal',
      'OP_GREATER': 'color-greater',
      'OP_LESS': 'color-less',
      'OP_PRINT': 'color-print'
    };

    // Handle compound operations (e.g., "OP_LESS + OP_NOT")
    for (const [op, colorClass] of Object.entries(opMap)) {
      if (opName.includes(op)) {
        return colorClass;
      }
    }

    return '';
  }

  renderParseRules() {
    const rulesEl = document.getElementById('parse-rules');

    // This is a static table showing the parse rules (horizontal layout)
    const rules = [
      { token: 'NUM', prefix: 'number', infix: '', prec: '', color: 'number' },
      { token: 'STR', prefix: 'string', infix: '', prec: '', color: 'string' },
      { token: 'T/F', prefix: 'literal', infix: '', prec: '', color: 'boolean' },
      { token: 'nil', prefix: 'literal', infix: '', prec: '', color: 'nil' },
      { token: 'ID', prefix: 'variable', infix: '', prec: '', color: 'variable' },
      { token: '+', prefix: '', infix: 'binary', prec: '6', color: 'plus' },
      { token: '-', prefix: 'unary', infix: 'binary', prec: '6', color: 'minus-binary' },
      { token: '*', prefix: '', infix: 'binary', prec: '7', color: 'star' },
      { token: '/', prefix: '', infix: 'binary', prec: '7', color: 'slash' },
      { token: '==', prefix: '', infix: 'binary', prec: '4', color: 'equal' },
      { token: '!=', prefix: '', infix: 'binary', prec: '4', color: 'not-equal' },
      { token: '<', prefix: '', infix: 'binary', prec: '5', color: 'less' },
      { token: '>', prefix: '', infix: 'binary', prec: '5', color: 'greater' },
      { token: '<=', prefix: '', infix: 'binary', prec: '5', color: 'less-equal' },
      { token: '>=', prefix: '', infix: 'binary', prec: '5', color: 'greater-equal' },
      { token: '!', prefix: 'unary', infix: '', prec: '', color: 'not' },
      { token: 'and', prefix: '', infix: 'and_', prec: '3', color: 'and' },
      { token: 'or', prefix: '', infix: 'or_', prec: '2', color: 'or' },
      { token: '(', prefix: 'grouping', infix: '', prec: '', color: 'grouping' }
    ];

    // Build horizontal table with tokens as columns
    let html = '<table class="parse-rules-table">';

    // Header row with token names
    html += '<tr><th></th>';
    rules.forEach(rule => {
      html += `<th class="rule-cell color-${rule.color}">${escapeHtml(rule.token)}</th>`;
    });
    html += '</tr>';

    // Prefix row
    html += '<tr><td>Prefix</td>';
    rules.forEach(rule => {
      html += `<td class="${rule.prefix ? 'color-' + rule.color : ''}">${escapeHtml(rule.prefix)}</td>`;
    });
    html += '</tr>';

    // Infix row
    html += '<tr><td>Infix</td>';
    rules.forEach(rule => {
      html += `<td class="${rule.infix ? 'color-' + rule.color : ''}">${escapeHtml(rule.infix)}</td>`;
    });
    html += '</tr>';

    // Precedence row
    html += '<tr><td>Prec</td>';
    rules.forEach(rule => {
      html += `<td>${escapeHtml(rule.prec)}</td>`;
    });
    html += '</tr>';

    html += '</table>';
    rulesEl.innerHTML = html;
  }

  renderConstants(step) {
    const constantsEl = document.getElementById('constants-pool');
    const constants = step.chunk.constants;
    const activeIndex = step.activeConstantIndex;

    let html = '<div class="constants-list">';
    if (constants.length === 0) {
      html += '<div class="no-constants">(none)</div>';
    } else {
      // Render in reverse order so newest constants appear on top
      for (let idx = constants.length - 1; idx >= 0; idx--) {
        const value = constants[idx];
        const isActive = activeIndex !== null && idx === activeIndex;
        html += `<div class="constant-entry ${isActive ? 'active' : ''}" data-index="${idx}">`;
        html += `<span class="constant-index">[${idx}]</span> `;
        html += `<span class="constant-value">${escapeHtml(printValue(value))}</span>`;
        html += `</div>`;
      }
    }
    html += '</div>';

    constantsEl.innerHTML = html;

    // Auto-scroll to center the active constant
    if (activeIndex !== null) {
      requestAnimationFrame(() => {
        const panelContent = constantsEl.parentElement;
        const activeEntry = constantsEl.querySelector(`.constant-entry[data-index="${activeIndex}"]`);
        if (panelContent && activeEntry) {
          const containerHeight = panelContent.offsetHeight;
          const entryTop = activeEntry.offsetTop - constantsEl.offsetTop;
          const entryHeight = activeEntry.offsetHeight;
          const scrollTop = entryTop - (containerHeight / 2) + (entryHeight / 2);
          panelContent.scrollTop = scrollTop;
        }
      });
    }
  }

  renderLines(step) {
    const linesEl = document.getElementById('lines-array');
    const lines = step.chunk.lines;
    const currentLine = step.currentToken ? step.currentToken.line : 1;

    let html = '';

    // Show current source line being parsed (stays at top)
    const sourceLines = this.source.split('\n');
    const currentSourceText = sourceLines[currentLine - 1] || '';
    html += `<div class="current-line-highlight">`;
    html += `Line ${currentLine}: ${escapeHtml(currentSourceText)}`;
    html += `</div>`;

    // Show lines array in reverse order so newest appears on top
    html += '<div class="lines-list">';
    if (lines.length === 0) {
      html += '<div class="no-constants">(no bytecode yet)</div>';
    } else {
      for (let idx = lines.length - 1; idx >= 0; idx--) {
        const lineNum = lines[idx];
        html += `<div class="line-entry">`;
        html += `<span class="line-index">byte[${idx}]:</span> `;
        html += `<span class="line-number">line ${lineNum}</span>`;
        html += `</div>`;
      }
    }
    html += '</div>';

    linesEl.innerHTML = html;
  }

  renderBytecode(step) {
    const bytecodeEl = document.getElementById('bytecode');
    const code = step.chunk.code;

    let html = '';
    let currentInstrIndex = -1;
    let ipInstrIndex = -1;
    const isRuntimeStep = step.ip !== undefined;

    // Detect transition from compilation to runtime
    const prevStep = this.currentStep > 0 ? this.steps[this.currentStep - 1] : null;
    const wasPrevStepCompilation = prevStep && prevStep.ip === undefined;
    const isTransitionToRuntime = isRuntimeStep && wasPrevStepCompilation;

    if (code.length === 0) {
      html += '<div class="no-bytecode">(no bytecode yet)</div>';
    } else {
      // Create a temporary chunk from the snapshot to disassemble from
      const tempChunk = new Chunk();
      tempChunk.code = step.chunk.code;
      tempChunk.lines = step.chunk.lines;
      tempChunk.constants = step.chunk.constants;

      let offset = 0;
      let instrCount = 0;
      let lastInstrIndex = -1;

      while (offset < code.length) {
        const instruction = tempChunk.disassembleInstruction(offset);
        const isAtIP = isRuntimeStep && offset === step.ip;

        if (isAtIP) ipInstrIndex = instrCount;

        // During compilation, track the last instruction we render
        if (!isRuntimeStep) {
          lastInstrIndex = instrCount;
        }

        const colorClass = this.getOpcodeColorClass(instruction.name);
        html += `<div class="instruction ${colorClass ? 'color-' + colorClass : ''}" data-index="${instrCount}" data-offset="${offset}">`;
        html += `<span class="opcode-name">${instruction.name}</span>`;
        if (instruction.operand !== null) {
          html += `<span class="operand">[${instruction.operand}]</span>`;
        }
        html += `</div>`;

        offset += instruction.length;
        instrCount++;
      }

      // Set currentInstrIndex to the last instruction during compilation
      if (!isRuntimeStep && lastInstrIndex >= 0) {
        currentInstrIndex = lastInstrIndex;
      }
    }

    // Clear only instruction elements, preserve SVG
    const instructions = bytecodeEl.querySelectorAll('.instruction, .no-bytecode');
    instructions.forEach(el => el.remove());

    // Insert new instructions before SVG
    bytecodeEl.insertAdjacentHTML('afterbegin', html);

    // When transitioning from compilation to runtime, reset position without animation
    // to avoid starting with the carousel positioned at the end of the bytecode
    if (isTransitionToRuntime) {
      bytecodeEl.style.transition = 'none';
      bytecodeEl.style.transform = '';
      bytecodeEl.offsetHeight; // Force reflow
      // Re-enable transition so subsequent movements are animated
      bytecodeEl.style.transition = '';
    }

    // Force reflow to ensure browser has calculated positions of new elements
    bytecodeEl.offsetHeight;

    // Wait for browser to lay out the new elements before centering
    // This is especially important when transitioning from compilation to runtime
    requestAnimationFrame(() => {
      // Highlight and center the current instruction or IP with animation
      if (isRuntimeStep && ipInstrIndex >= 0) {
        this.centerCarouselItem(bytecodeEl, ipInstrIndex);
        this.renderIPArrow(ipInstrIndex);
      } else if (currentInstrIndex >= 0) {
        // Highlight the current instruction during compilation
        const instructions = bytecodeEl.querySelectorAll('.instruction');
        if (instructions[currentInstrIndex]) {
          instructions[currentInstrIndex].classList.add('current');
        }
        this.centerCarouselItem(bytecodeEl, currentInstrIndex);
      }

      // Render jump arrows - use compilation jumps during runtime
      const jumps = isRuntimeStep ? this.compilationJumps : (step.jumps || []);
      this.renderJumpArrows(jumps);
    });
  }

  renderJumpArrows(jumps) {
    const svgEl = document.getElementById('jump-arrows');
    const bytecodeEl = document.getElementById('bytecode');

    // Clear existing arrow paths (not IP arrows or marker definitions)
    const jumpPaths = svgEl.querySelectorAll(':scope > path:not(.ip-arrow)');
    jumpPaths.forEach(path => path.remove());

    if (!jumps || jumps.length === 0) return;

    // Build offset-to-element map
    const instructions = Array.from(bytecodeEl.querySelectorAll('.instruction'));
    const offsetMap = new Map();
    instructions.forEach(instr => {
      const offset = parseInt(instr.getAttribute('data-offset'));
      offsetMap.set(offset, instr);
    });

    // Collect arrow data with positions
    const arrowData = [];
    jumps.forEach(jump => {
      const fromEl = offsetMap.get(jump.fromOffset);
      if (!fromEl) return;

      const fromX = fromEl.offsetLeft + fromEl.offsetWidth / 2;
      let toX;

      if (jump.isPatched) {
        const toEl = offsetMap.get(jump.toOffset);
        if (toEl) {
          toX = toEl.offsetLeft + toEl.offsetWidth / 2;
        } else {
          toX = fromX + 1500;
        }
      } else {
        toX = fromX + 1500;
      }

      arrowData.push({
        jump,
        fromEl,
        toEl: jump.isPatched ? offsetMap.get(jump.toOffset) : null,
        minX: Math.min(fromX, toX),
        maxX: Math.max(fromX, toX)
      });
    });

    // Assign lanes to avoid overlaps
    const lanes = this.assignLanes(arrowData);

    // Draw each jump with its assigned lane
    arrowData.forEach((data, index) => {
      this.drawJumpArrow(svgEl, bytecodeEl, data.fromEl, data.toEl, data.jump, lanes[index]);
    });
  }

  assignLanes(arrowData) {
    const lanes = [];
    const laneRanges = [];  // Track occupied X ranges for each lane

    arrowData.forEach(arrow => {
      // Find the first available lane where this arrow doesn't overlap
      let assignedLane = -1;  // Start with -1 to indicate "no lane found"

      for (let lane = 0; lane < laneRanges.length; lane++) {
        let hasOverlap = false;

        for (let range of laneRanges[lane]) {
          // Check if arrow overlaps with this range
          if (arrow.minX < range.maxX && arrow.maxX > range.minX) {
            hasOverlap = true;
            break;
          }
        }

        if (!hasOverlap) {
          assignedLane = lane;
          break;
        }
      }

      // If no lane found, create a new one
      if (assignedLane === -1) {
        assignedLane = laneRanges.length;
        laneRanges.push([]);
      }

      // Add this arrow's range to the assigned lane
      laneRanges[assignedLane].push({ minX: arrow.minX, maxX: arrow.maxX });
      lanes.push(assignedLane);
    });

    return lanes;
  }

  drawJumpArrow(svgEl, _containerEl, fromEl, toEl, _jump, lane = 0) {
    // Calculate positions relative to the track element (parent of instructions)
    // This way arrows move with the carousel
    const fromX = fromEl.offsetLeft + fromEl.offsetWidth / 2;
    const fromY = fromEl.offsetTop + fromEl.offsetHeight;

    let toX, toY;

    if (toEl) {
      // Patched jump - arrow to bottom of target instruction
      toX = toEl.offsetLeft + toEl.offsetWidth / 2;
      toY = toEl.offsetTop + toEl.offsetHeight;  // Point to bottom, not top
    } else {
      // Unpatched jump - arrow points far right off screen
      toX = fromX + 1500;
      toY = fromY + 35 + (lane * 15);  // Adjust based on lane
    }

    const baseDrop = 10;
    const laneSpacing = 5;  // 15px between each lane
    const dropY = fromY + baseDrop + (lane * laneSpacing);

    // Create path: down -> horizontal -> up (or horizontal if both at same level)
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const pathData = `M ${fromX} ${fromY} L ${fromX} ${dropY} L ${toX} ${dropY} L ${toX} ${toY}`;

    path.setAttribute('d', pathData);
    path.setAttribute('stroke', 'black');
    path.setAttribute('stroke-width', '1');
    path.setAttribute('fill', 'none');
    path.setAttribute('marker-end', 'url(#arrowhead)');

    svgEl.appendChild(path);
  }

  renderIPArrow(ipInstrIndex) {
    const svgEl = document.getElementById('jump-arrows');
    const bytecodeEl = document.getElementById('bytecode');

    // Clear any existing IP arrow
    const existingIPArrows = svgEl.querySelectorAll('.ip-arrow');
    existingIPArrows.forEach(arrow => arrow.remove());

    // Find the instruction element at the IP
    const instructions = Array.from(bytecodeEl.querySelectorAll('.instruction'));
    const ipInstr = instructions[ipInstrIndex];
    if (!ipInstr) return;

    // Draw arrow pointing down at the IP instruction
    const instrX = ipInstr.offsetLeft + ipInstr.offsetWidth / 2;
    const instrY = ipInstr.offsetTop;

    // Arrow starts above the instruction and points down
    const startY = Math.max(5, instrY - 40);  // Ensure it's visible
    const endY = instrY - 2;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const pathData = `M ${instrX} ${startY} L ${instrX} ${endY}`;

    path.setAttribute('d', pathData);
    path.setAttribute('class', 'ip-arrow');
    path.setAttribute('stroke', '#e74c3c');
    path.setAttribute('stroke-width', '3');
    path.setAttribute('fill', 'none');
    path.setAttribute('marker-end', 'url(#ip-arrowhead)');

    svgEl.appendChild(path);
  }

  renderStack(step) {
    const stackEl = document.getElementById('value-stack');
    const stack = step.stack || [];

    let html = '<div class="stack-list">';
    if (stack.length === 0) {
      html += '<div class="no-runtime">(empty)</div>';
    } else {
      stack.forEach((value, idx) => {
        html += `<div class="stack-entry">`;
        html += `<span class="stack-index">[${idx}]</span>`;
        html += `<span class="stack-value">${escapeHtml(printValue(value))}</span>`;
        html += `</div>`;
      });
    }
    html += '</div>';

    stackEl.innerHTML = html;
  }

  renderGlobals(step) {
    const globalsEl = document.getElementById('globals-table');
    const globals = step.globals || new Map();
    const activeName = step.activeGlobalName;

    let html = '<div class="globals-list">';
    if (globals.size === 0) {
      html += '<div class="no-runtime">(none)</div>';
    } else {
      globals.forEach((value, name) => {
        const isActive = activeName !== null && name === activeName;
        html += `<div class="global-entry ${isActive ? 'active' : ''}" data-name="${escapeHtml(name)}">`;
        html += `<span class="global-name">${escapeHtml(name)}</span>`;
        html += `<span class="global-value">${escapeHtml(printValue(value))}</span>`;
        html += `</div>`;
      });
    }
    html += '</div>';

    globalsEl.innerHTML = html;

    // Auto-scroll to center the active global
    if (activeName !== null) {
      requestAnimationFrame(() => {
        const panelContent = globalsEl.parentElement;
        const activeEntry = globalsEl.querySelector(`.global-entry[data-name="${escapeHtml(activeName)}"]`);
        if (panelContent && activeEntry) {
          const containerHeight = panelContent.offsetHeight;
          const entryTop = activeEntry.offsetTop - globalsEl.offsetTop;
          const entryHeight = activeEntry.offsetHeight;
          const scrollTop = entryTop - (containerHeight / 2) + (entryHeight / 2);
          panelContent.scrollTop = scrollTop;
        }
      });
    }
  }

  renderOutput(step) {
    const outputEl = document.getElementById('program-output');
    const output = step.output || [];

    let html = '<div class="output-list">';
    if (output.length === 0) {
      html += '<div class="no-runtime">(no output yet)</div>';
    } else {
      output.forEach((line) => {
        html += `<div class="output-entry">`;
        html += `<span class="output-line">${escapeHtml(line)}</span>`;
        html += `</div>`;
      });
    }
    html += '</div>';

    outputEl.innerHTML = html;

    // Auto-scroll to bottom to show latest output
    // Use the parent panel-content container for scrolling
    const panelContent = outputEl.parentElement;
    if (panelContent && output.length > 0) {
      panelContent.scrollTop = panelContent.scrollHeight;
    }
  }

  centerCarouselItem(trackEl, itemIndex) {
    const items = Array.from(trackEl.querySelectorAll('.instruction, .token'));
    if (itemIndex < 0 || itemIndex >= items.length) return;

    const item = items[itemIndex];
    const viewport = trackEl.parentElement;
    const viewportWidth = viewport.offsetWidth;
    const itemLeft = item.offsetLeft;
    const itemWidth = item.offsetWidth;

    // Calculate offset to center the item in the viewport
    const itemCenter = itemLeft + (itemWidth / 2);
    const viewportCenter = viewportWidth / 2;
    const scrollOffset = itemCenter - viewportCenter;

    // Apply transform with animation (CSS transition handles the animation)
    // Allow negative scroll to center items near the start
    trackEl.style.transform = `translateX(-${scrollOffset}px)`;
  }
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Collapsible rows functionality
function initCollapsibleRows() {
  const STORAGE_KEY = 'clox-vis-collapsed-rows';

  // Load saved collapsed state from localStorage
  const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

  // Get all collapsible rows
  const collapsibleRows = document.querySelectorAll('[data-collapsible-row]');

  collapsibleRows.forEach(row => {
    const rowId = row.getAttribute('data-collapsible-row');
    const indicator = row.querySelector('.collapse-indicator');

    if (!indicator) return;

    // Restore saved state
    if (savedState[rowId]) {
      row.classList.add('collapsed');
    }

    // Add click handler to the indicator
    indicator.addEventListener('click', (e) => {
      e.stopPropagation();
      row.classList.toggle('collapsed');

      // Save state to localStorage
      const isCollapsed = row.classList.contains('collapsed');
      savedState[rowId] = isCollapsed;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));
    });

    // Make the entire header clickable for convenience (but not the help button)
    const header = indicator.closest('.panel-header');
    if (header) {
      header.style.cursor = 'pointer';
      header.addEventListener('click', (e) => {
        // Don't collapse if clicking the help button
        if (e.target.classList.contains('help-btn')) {
          return;
        }
        indicator.click();
      });
    }
  });
}

// Help button toggle functionality
function initHelpButtons() {
  const STORAGE_KEY = 'clox-vis-help-sections';

  // Load saved help section visibility state from localStorage
  const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

  // Get all help buttons
  const helpButtons = document.querySelectorAll('.help-btn');

  helpButtons.forEach(button => {
    const targetId = button.getAttribute('data-help-target');
    const helpSection = document.getElementById(targetId);

    if (!helpSection) return;

    // Restore saved state
    if (savedState[targetId]) {
      helpSection.style.display = 'block';
    }

    // Add click handler to the help button
    button.addEventListener('click', (e) => {
      e.stopPropagation();

      // Toggle visibility
      const isVisible = helpSection.style.display === 'block';
      helpSection.style.display = isVisible ? 'none' : 'block';

      // Save state to localStorage
      savedState[targetId] = !isVisible;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));
    });
  });
}

// Global visualizer instance
let visualizer = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  visualizer = new Visualizer();

  // Wire up controls
  document.getElementById('compile-btn').addEventListener('click', () => {
    const source = document.getElementById('source-input').value;
    visualizer.loadSource(source);
  });

  document.getElementById('prev-btn').addEventListener('click', () => {
    visualizer.prevStep();
  });

  document.getElementById('next-btn').addEventListener('click', () => {
    visualizer.nextStep();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      visualizer.prevStep();
    } else if (e.key === 'ArrowRight') {
      visualizer.nextStep();
    }
  });

  // Collapse/expand functionality
  initCollapsibleRows();

  // Help button toggle functionality
  initHelpButtons();

  // Load sample code
  const sampleCode = `var a = 1;
var b = 2;
print a + b;

if (a < b) {
  print "a is less";
} else {
  print "b is less or equal";
}

var i = 0;
while (i < 5) {
  print i;
  i = i + 1;
}`;

  document.getElementById('source-input').value = sampleCode;
});
