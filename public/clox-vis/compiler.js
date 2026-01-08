// Compiler (Pratt parser + bytecode emitter) for clox visualizer

const Precedence = {
  PREC_NONE: 0,
  PREC_ASSIGNMENT: 1,  // =
  PREC_OR: 2,          // or
  PREC_AND: 3,         // and
  PREC_EQUALITY: 4,    // == !=
  PREC_COMPARISON: 5,  // < > <= >=
  PREC_TERM: 6,        // + -
  PREC_FACTOR: 7,      // * /
  PREC_UNARY: 8,       // ! -
  PREC_CALL: 9,        // . ()
  PREC_PRIMARY: 10
};

const PrecedenceNames = {
  0: 'NONE',
  1: 'ASSIGNMENT',
  2: 'OR',
  3: 'AND',
  4: 'EQUALITY',
  5: 'COMPARISON',
  6: 'TERM',
  7: 'FACTOR',
  8: 'UNARY',
  9: 'CALL',
  10: 'PRIMARY'
};

// Color scheme for different operation types
const OperationColors = {
  // Literals
  'literal': '#666',
  'number': '#666',
  'string': '#666',
  'boolean': '#666',
  'nil': '#666',

  // Arithmetic
  'plus': '#4ade80',
  'minus-unary': '#fb923c',
  'minus-binary': '#fbbf24',
  'star': '#c084fc',
  'slash': '#f472b6',

  // Comparison
  'equal': '#3b82f6',
  'not-equal': '#60a5fa',
  'less': '#2563eb',
  'greater': '#1d4ed8',
  'less-equal': '#93c5fd',
  'greater-equal': '#bfdbfe',

  // Logical
  'and': '#14b8a6',
  'or': '#06b6d4',
  'not': '#0891b2',

  // Variables
  'variable': '#8b5cf6',

  // Grouping
  'grouping': '#666',

  // Control flow
  'if': '#ef4444',
  'while': '#dc2626',
  'for': '#b91c1c',

  // Print
  'print': '#f59e0b'
};

class Local {
  constructor(name, depth) {
    this.name = name;  // Token
    this.depth = depth;
  }
}

class Compiler {
  constructor() {
    this.locals = [];
    this.localCount = 0;
    this.scopeDepth = 0;
  }

  snapshot() {
    return {
      locals: this.locals.map(l => ({
        name: l.name.lexeme,
        depth: l.depth
      })),
      localCount: this.localCount,
      scopeDepth: this.scopeDepth
    };
  }
}

class Parser {
  constructor(source) {
    this.scanner = new Scanner(source);
    this.current = null;
    this.previous = null;
    this.hadError = false;
    this.panicMode = false;
    this.chunk = new Chunk();
    this.compiler = new Compiler();
    this.steps = [];  // Visualization steps
    this.jumps = [];  // Track all jumps for visualization
    this.parserCallStack = [];  // Track parsePrecedence recursion
  }

  recordStep(action, description, extra = {}) {
    this.steps.push({
      action,
      description,
      currentToken: this.current ? { ...this.current } : null,
      previousToken: this.previous ? { ...this.previous } : null,
      compiler: this.compiler.snapshot(),
      chunk: this.chunk.snapshot(),
      jumps: this.jumps.map(j => ({ ...j })),  // Snapshot of jumps
      parserCallStack: this.parserCallStack.map(frame => ({ ...frame })),  // Snapshot call stack
      ...extra
    });
  }

  errorAt(token, message) {
    if (this.panicMode) return;
    this.panicMode = true;

    let msg = `[line ${token.line}] Error`;
    if (token.type === TokenType.TOKEN_EOF) {
      msg += ' at end';
    } else if (token.type === TokenType.TOKEN_ERROR) {
      // Nothing
    } else {
      msg += ` at '${token.lexeme}'`;
    }
    msg += `: ${message}`;

    console.error(msg);
    this.hadError = true;
  }

  error(message) {
    this.errorAt(this.previous, message);
  }

  errorAtCurrent(message) {
    this.errorAt(this.current, message);
  }

  advance() {
    this.previous = this.current;

    while (true) {
      this.current = this.scanner.scanToken();
      this.recordStep('scan_token', `Scanned: ${this.current.type}`, {
        token: { ...this.current }
      });

      if (this.current.type !== TokenType.TOKEN_ERROR) break;
      this.errorAtCurrent(this.current.lexeme);
    }
  }

  consume(type, message) {
    if (this.current.type === type) {
      this.advance();
      return;
    }
    this.errorAtCurrent(message);
  }

  check(type) {
    return this.current.type === type;
  }

  match(type) {
    if (!this.check(type)) return false;
    this.advance();
    return true;
  }

  emitByte(byte, isOperand = false) {
    this.chunk.write(byte, this.previous.line);
    if (isOperand) {
      this.recordStep('emit_byte', `Emit operand: ${byte}`);
    } else {
      this.recordStep('emit_byte', `Emit: ${OpCodeNames[byte] || byte}`);
    }
  }

  emitBytes(byte1, byte2) {
    this.emitByte(byte1);
    this.emitByte(byte2);
  }

  emitLoop(loopStart) {
    this.emitByte(OpCode.OP_LOOP);
    const offset = this.chunk.code.length - loopStart + 2;
    if (offset > 0xFFFF) this.error('Loop body too large.');

    this.emitByte((offset >> 8) & 0xff, true);  // operand: high byte
    this.emitByte(offset & 0xff, true);  // operand: low byte

    // Track this backward jump for visualization (already patched)
    this.jumps.push({
      type: 'OP_LOOP',
      fromOffset: this.chunk.code.length - 3,
      operandOffset: this.chunk.code.length - 2,
      toOffset: loopStart,
      isPatched: true
    });
  }

  emitJump(instruction) {
    this.emitByte(instruction);
    this.emitByte(0xff, true);  // operand: placeholder high byte
    this.emitByte(0xff, true);  // operand: placeholder low byte
    const offset = this.chunk.code.length - 2;

    // Track this jump for visualization
    this.jumps.push({
      type: OpCodeNames[instruction],
      fromOffset: this.chunk.code.length - 3,  // offset of the jump instruction itself
      operandOffset: offset,  // offset where the jump target is stored
      toOffset: 0xffff,  // unpatched
      isPatched: false
    });

    return offset;
  }

  emitReturn() {
    this.emitByte(OpCode.OP_RETURN);
  }

  makeConstant(value) {
    const constant = this.chunk.addConstant(value);
    if (constant > 0xFF) {
      this.error('Too many constants in one chunk.');
      return 0;
    }
    this.recordStep('add_constant', `Add constant: ${printValue(value)}`);
    return constant;
  }

  emitConstant(value) {
    const constIdx = this.makeConstant(value);
    this.emitByte(OpCode.OP_CONSTANT);
    this.emitByte(constIdx, true);  // operand: constant pool index
  }

  patchJump(offset) {
    const jump = this.chunk.code.length - offset - 2;
    if (jump > 0xFFFF) {
      this.error('Too much code to jump over.');
    }

    this.chunk.code[offset] = (jump >> 8) & 0xff;
    this.chunk.code[offset + 1] = jump & 0xff;

    // Update jump tracking
    const jumpRecord = this.jumps.find(j => j.operandOffset === offset);
    if (jumpRecord) {
      jumpRecord.toOffset = jumpRecord.fromOffset + 3 + jump;  // absolute target offset
      jumpRecord.isPatched = true;
    }

    this.recordStep('patch_jump', `Patch jump at offset ${offset} to ${jump}`);
  }

  // Precedence parsing
  parsePrecedence(precedence) {
    // Record entering parsePrecedence
    this.parserCallStack.push({
      precedence: precedence,
      precedenceName: PrecedenceNames[precedence],
      pendingOp: null
    });

    this.recordStep('enter_precedence',
      `Entering parsePrecedence(${precedence} = ${PrecedenceNames[precedence]})`);

    this.advance();
    const prefixRule = this.getRule(this.previous.type).prefix;

    if (!prefixRule) {
      this.error('Expect expression.');
      this.parserCallStack.pop();
      return;
    }

    const canAssign = precedence <= Precedence.PREC_ASSIGNMENT;
    prefixRule.call(this, canAssign);

    while (precedence <= this.getRule(this.current.type).precedence) {
      const currentPrec = this.getRule(this.current.type).precedence;

      this.recordStep('precedence_continue',
        `Precedence check: ${precedence} (${PrecedenceNames[precedence]}) ≤ ${currentPrec} (${PrecedenceNames[currentPrec]})? YES → advancing to parse '${this.current.lexeme}'`);

      this.advance();
      const infixRule = this.getRule(this.previous.type).infix;
      infixRule.call(this, canAssign);
    }

    // Loop exit
    const currentPrec = this.getRule(this.current.type).precedence;
    this.recordStep('precedence_exit',
      `Precedence check: ${precedence} (${PrecedenceNames[precedence]}) ≤ ${currentPrec} (${PrecedenceNames[currentPrec]})? NO → exiting parsePrecedence(${precedence})`);

    this.parserCallStack.pop();

    if (canAssign && this.match(TokenType.TOKEN_EQUAL)) {
      this.error('Invalid assignment target.');
    }
  }

  identifierConstant(name) {
    return this.makeConstant(OBJ_VAL(OBJ_STRING(name.lexeme)));
  }

  identifiersEqual(a, b) {
    return a.lexeme === b.lexeme;
  }

  resolveLocal(compiler, name) {
    for (let i = compiler.localCount - 1; i >= 0; i--) {
      const local = compiler.locals[i];
      if (this.identifiersEqual(name, local.name)) {
        if (local.depth === -1) {
          this.error("Can't read local variable in its own initializer.");
        }
        return i;
      }
    }
    return -1;
  }

  addLocal(name) {
    if (this.compiler.localCount >= 256) {
      this.error('Too many local variables in function.');
      return;
    }

    const local = new Local(name, -1);
    this.compiler.locals[this.compiler.localCount++] = local;
    this.recordStep('add_local', `Add local: ${name.lexeme}`);
  }

  declareVariable() {
    if (this.compiler.scopeDepth === 0) return;

    const name = this.previous;

    for (let i = this.compiler.localCount - 1; i >= 0; i--) {
      const local = this.compiler.locals[i];
      if (local.depth !== -1 && local.depth < this.compiler.scopeDepth) {
        break;
      }
      if (this.identifiersEqual(name, local.name)) {
        this.error('Already a variable with this name in this scope.');
      }
    }

    this.addLocal(name);
  }

  parseVariable(errorMessage) {
    this.consume(TokenType.TOKEN_IDENTIFIER, errorMessage);

    this.declareVariable();
    if (this.compiler.scopeDepth > 0) return 0;

    return this.identifierConstant(this.previous);
  }

  markInitialized() {
    this.compiler.locals[this.compiler.localCount - 1].depth =
      this.compiler.scopeDepth;
  }

  defineVariable(global) {
    if (this.compiler.scopeDepth > 0) {
      this.markInitialized();
      return;
    }
    this.emitByte(OpCode.OP_DEFINE_GLOBAL);
    this.emitByte(global, true);  // operand: global variable index
  }

  // Parse rule methods
  binary(canAssign) {
    const operatorType = this.previous.type;
    const rule = this.getRule(operatorType);

    // Determine operation type and color
    let opType, opName, color;
    switch (operatorType) {
      case TokenType.TOKEN_BANG_EQUAL:
        opType = 'not-equal'; opName = 'OP_EQUAL + OP_NOT'; break;
      case TokenType.TOKEN_EQUAL_EQUAL:
        opType = 'equal'; opName = 'OP_EQUAL'; break;
      case TokenType.TOKEN_GREATER:
        opType = 'greater'; opName = 'OP_GREATER'; break;
      case TokenType.TOKEN_GREATER_EQUAL:
        opType = 'greater-equal'; opName = 'OP_LESS + OP_NOT'; break;
      case TokenType.TOKEN_LESS:
        opType = 'less'; opName = 'OP_LESS'; break;
      case TokenType.TOKEN_LESS_EQUAL:
        opType = 'less-equal'; opName = 'OP_GREATER + OP_NOT'; break;
      case TokenType.TOKEN_PLUS:
        opType = 'plus'; opName = 'OP_ADD'; break;
      case TokenType.TOKEN_MINUS:
        opType = 'minus-binary'; opName = 'OP_SUBTRACT'; break;
      case TokenType.TOKEN_STAR:
        opType = 'star'; opName = 'OP_MULTIPLY'; break;
      case TokenType.TOKEN_SLASH:
        opType = 'slash'; opName = 'OP_DIVIDE'; break;
    }
    color = OperationColors[opType];

    this.recordStep('call_infix_rule',
      `Calling infix rule: binary(${this.previous.lexeme})`, { color, opType });

    // Update call stack with pending operation
    if (this.parserCallStack.length > 0) {
      this.parserCallStack[this.parserCallStack.length - 1].pendingOp = opName;
    }

    this.parsePrecedence(rule.precedence + 1);

    switch (operatorType) {
      case TokenType.TOKEN_BANG_EQUAL:
        this.emitBytes(OpCode.OP_EQUAL, OpCode.OP_NOT);
        break;
      case TokenType.TOKEN_EQUAL_EQUAL:
        this.emitByte(OpCode.OP_EQUAL);
        break;
      case TokenType.TOKEN_GREATER:
        this.emitByte(OpCode.OP_GREATER);
        break;
      case TokenType.TOKEN_GREATER_EQUAL:
        this.emitBytes(OpCode.OP_LESS, OpCode.OP_NOT);
        break;
      case TokenType.TOKEN_LESS:
        this.emitByte(OpCode.OP_LESS);
        break;
      case TokenType.TOKEN_LESS_EQUAL:
        this.emitBytes(OpCode.OP_GREATER, OpCode.OP_NOT);
        break;
      case TokenType.TOKEN_PLUS:
        this.emitByte(OpCode.OP_ADD);
        break;
      case TokenType.TOKEN_MINUS:
        this.emitByte(OpCode.OP_SUBTRACT);
        break;
      case TokenType.TOKEN_STAR:
        this.emitByte(OpCode.OP_MULTIPLY);
        break;
      case TokenType.TOKEN_SLASH:
        this.emitByte(OpCode.OP_DIVIDE);
        break;
    }
  }

  literal(canAssign) {
    const color = OperationColors['literal'];
    let opType = 'boolean';
    if (this.previous.type === TokenType.TOKEN_NIL) opType = 'nil';

    this.recordStep('call_prefix_rule',
      `Calling prefix rule: literal(${this.previous.lexeme})`, { color, opType });

    switch (this.previous.type) {
      case TokenType.TOKEN_FALSE:
        this.emitByte(OpCode.OP_FALSE);
        break;
      case TokenType.TOKEN_NIL:
        this.emitByte(OpCode.OP_NIL);
        break;
      case TokenType.TOKEN_TRUE:
        this.emitByte(OpCode.OP_TRUE);
        break;
    }
  }

  grouping(canAssign) {
    const color = OperationColors['grouping'];
    this.recordStep('call_prefix_rule',
      `Calling prefix rule: grouping()`, { color, opType: 'grouping' });

    this.expression();
    this.consume(TokenType.TOKEN_RIGHT_PAREN, "Expect ')' after expression.");
  }

  number(canAssign) {
    const value = parseFloat(this.previous.lexeme);
    const color = OperationColors['number'];

    this.recordStep('call_prefix_rule',
      `Calling prefix rule: number(${value})`, { color, opType: 'number' });

    this.emitConstant(NUMBER_VAL(value));
  }

  string(canAssign) {
    // Trim quotes
    const value = this.previous.lexeme.substring(1, this.previous.lexeme.length - 1);
    const color = OperationColors['string'];

    this.recordStep('call_prefix_rule',
      `Calling prefix rule: string("${value}")`, { color, opType: 'string' });

    this.emitConstant(OBJ_VAL(OBJ_STRING(value)));
  }

  namedVariable(name, canAssign) {
    let getOp, setOp;
    let arg = this.resolveLocal(this.compiler, name);

    if (arg !== -1) {
      getOp = OpCode.OP_GET_LOCAL;
      setOp = OpCode.OP_SET_LOCAL;
    } else {
      arg = this.identifierConstant(name);
      getOp = OpCode.OP_GET_GLOBAL;
      setOp = OpCode.OP_SET_GLOBAL;
    }

    if (canAssign && this.match(TokenType.TOKEN_EQUAL)) {
      this.expression();
      this.emitByte(setOp);
      this.emitByte(arg, true);  // operand: variable index
    } else {
      this.emitByte(getOp);
      this.emitByte(arg, true);  // operand: variable index
    }
  }

  variable(canAssign) {
    const color = OperationColors['variable'];
    this.recordStep('call_prefix_rule',
      `Calling prefix rule: variable(${this.previous.lexeme})`, { color, opType: 'variable' });

    this.namedVariable(this.previous, canAssign);
  }

  unary(canAssign) {
    const operatorType = this.previous.type;
    let opType, opName, color;

    if (operatorType === TokenType.TOKEN_BANG) {
      opType = 'not';
      opName = 'OP_NOT';
      color = OperationColors['not'];
    } else {
      opType = 'minus-unary';
      opName = 'OP_NEGATE';
      color = OperationColors['minus-unary'];
    }

    this.recordStep('call_prefix_rule',
      `Calling prefix rule: unary(${this.previous.lexeme})`, { color, opType });

    // Update call stack with pending operation
    if (this.parserCallStack.length > 0) {
      this.parserCallStack[this.parserCallStack.length - 1].pendingOp = opName;
    }

    this.parsePrecedence(Precedence.PREC_UNARY);

    switch (operatorType) {
      case TokenType.TOKEN_BANG:
        this.emitByte(OpCode.OP_NOT);
        break;
      case TokenType.TOKEN_MINUS:
        this.emitByte(OpCode.OP_NEGATE);
        break;
    }
  }

  and_(canAssign) {
    const color = OperationColors['and'];
    this.recordStep('call_infix_rule',
      `Calling infix rule: and()`, { color, opType: 'and' });

    const endJump = this.emitJump(OpCode.OP_JUMP_IF_FALSE);
    this.emitByte(OpCode.OP_POP);
    this.parsePrecedence(Precedence.PREC_AND);
    this.patchJump(endJump);
  }

  or_(canAssign) {
    const color = OperationColors['or'];
    this.recordStep('call_infix_rule',
      `Calling infix rule: or()`, { color, opType: 'or' });

    const elseJump = this.emitJump(OpCode.OP_JUMP_IF_FALSE);
    const endJump = this.emitJump(OpCode.OP_JUMP);

    this.patchJump(elseJump);
    this.emitByte(OpCode.OP_POP);

    this.parsePrecedence(Precedence.PREC_OR);
    this.patchJump(endJump);
  }

  // Parse rules table
  getRule(type) {
    const rules = {
      [TokenType.TOKEN_LEFT_PAREN]: { prefix: this.grouping, infix: null, precedence: Precedence.PREC_NONE },
      [TokenType.TOKEN_RIGHT_PAREN]: { prefix: null, infix: null, precedence: Precedence.PREC_NONE },
      [TokenType.TOKEN_LEFT_BRACE]: { prefix: null, infix: null, precedence: Precedence.PREC_NONE },
      [TokenType.TOKEN_RIGHT_BRACE]: { prefix: null, infix: null, precedence: Precedence.PREC_NONE },
      [TokenType.TOKEN_COMMA]: { prefix: null, infix: null, precedence: Precedence.PREC_NONE },
      [TokenType.TOKEN_DOT]: { prefix: null, infix: null, precedence: Precedence.PREC_NONE },
      [TokenType.TOKEN_MINUS]: { prefix: this.unary, infix: this.binary, precedence: Precedence.PREC_TERM },
      [TokenType.TOKEN_PLUS]: { prefix: null, infix: this.binary, precedence: Precedence.PREC_TERM },
      [TokenType.TOKEN_SEMICOLON]: { prefix: null, infix: null, precedence: Precedence.PREC_NONE },
      [TokenType.TOKEN_SLASH]: { prefix: null, infix: this.binary, precedence: Precedence.PREC_FACTOR },
      [TokenType.TOKEN_STAR]: { prefix: null, infix: this.binary, precedence: Precedence.PREC_FACTOR },
      [TokenType.TOKEN_BANG]: { prefix: this.unary, infix: null, precedence: Precedence.PREC_NONE },
      [TokenType.TOKEN_BANG_EQUAL]: { prefix: null, infix: this.binary, precedence: Precedence.PREC_EQUALITY },
      [TokenType.TOKEN_EQUAL]: { prefix: null, infix: null, precedence: Precedence.PREC_NONE },
      [TokenType.TOKEN_EQUAL_EQUAL]: { prefix: null, infix: this.binary, precedence: Precedence.PREC_EQUALITY },
      [TokenType.TOKEN_GREATER]: { prefix: null, infix: this.binary, precedence: Precedence.PREC_COMPARISON },
      [TokenType.TOKEN_GREATER_EQUAL]: { prefix: null, infix: this.binary, precedence: Precedence.PREC_COMPARISON },
      [TokenType.TOKEN_LESS]: { prefix: null, infix: this.binary, precedence: Precedence.PREC_COMPARISON },
      [TokenType.TOKEN_LESS_EQUAL]: { prefix: null, infix: this.binary, precedence: Precedence.PREC_COMPARISON },
      [TokenType.TOKEN_IDENTIFIER]: { prefix: this.variable, infix: null, precedence: Precedence.PREC_NONE },
      [TokenType.TOKEN_STRING]: { prefix: this.string, infix: null, precedence: Precedence.PREC_NONE },
      [TokenType.TOKEN_NUMBER]: { prefix: this.number, infix: null, precedence: Precedence.PREC_NONE },
      [TokenType.TOKEN_AND]: { prefix: null, infix: this.and_, precedence: Precedence.PREC_AND },
      [TokenType.TOKEN_CLASS]: { prefix: null, infix: null, precedence: Precedence.PREC_NONE },
      [TokenType.TOKEN_ELSE]: { prefix: null, infix: null, precedence: Precedence.PREC_NONE },
      [TokenType.TOKEN_FALSE]: { prefix: this.literal, infix: null, precedence: Precedence.PREC_NONE },
      [TokenType.TOKEN_FOR]: { prefix: null, infix: null, precedence: Precedence.PREC_NONE },
      [TokenType.TOKEN_FUN]: { prefix: null, infix: null, precedence: Precedence.PREC_NONE },
      [TokenType.TOKEN_IF]: { prefix: null, infix: null, precedence: Precedence.PREC_NONE },
      [TokenType.TOKEN_NIL]: { prefix: this.literal, infix: null, precedence: Precedence.PREC_NONE },
      [TokenType.TOKEN_OR]: { prefix: null, infix: this.or_, precedence: Precedence.PREC_OR },
      [TokenType.TOKEN_PRINT]: { prefix: null, infix: null, precedence: Precedence.PREC_NONE },
      [TokenType.TOKEN_RETURN]: { prefix: null, infix: null, precedence: Precedence.PREC_NONE },
      [TokenType.TOKEN_SUPER]: { prefix: null, infix: null, precedence: Precedence.PREC_NONE },
      [TokenType.TOKEN_THIS]: { prefix: null, infix: null, precedence: Precedence.PREC_NONE },
      [TokenType.TOKEN_TRUE]: { prefix: this.literal, infix: null, precedence: Precedence.PREC_NONE },
      [TokenType.TOKEN_VAR]: { prefix: null, infix: null, precedence: Precedence.PREC_NONE },
      [TokenType.TOKEN_WHILE]: { prefix: null, infix: null, precedence: Precedence.PREC_NONE },
      [TokenType.TOKEN_ERROR]: { prefix: null, infix: null, precedence: Precedence.PREC_NONE },
      [TokenType.TOKEN_EOF]: { prefix: null, infix: null, precedence: Precedence.PREC_NONE },
    };

    return rules[type] || { prefix: null, infix: null, precedence: Precedence.PREC_NONE };
  }

  expression() {
    this.parsePrecedence(Precedence.PREC_ASSIGNMENT);
  }

  block() {
    while (!this.check(TokenType.TOKEN_RIGHT_BRACE) && !this.check(TokenType.TOKEN_EOF)) {
      this.declaration();
    }
    this.consume(TokenType.TOKEN_RIGHT_BRACE, "Expect '}' after block.");
  }

  varDeclaration() {
    const global = this.parseVariable('Expect variable name.');

    if (this.match(TokenType.TOKEN_EQUAL)) {
      this.expression();
    } else {
      this.emitByte(OpCode.OP_NIL);
    }

    this.consume(TokenType.TOKEN_SEMICOLON, "Expect ';' after variable declaration.");
    this.defineVariable(global);
  }

  expressionStatement() {
    this.expression();
    this.consume(TokenType.TOKEN_SEMICOLON, "Expect ';' after expression.");
    this.emitByte(OpCode.OP_POP);
  }

  ifStatement() {
    this.consume(TokenType.TOKEN_LEFT_PAREN, "Expect '(' after 'if'.");
    this.expression();
    this.consume(TokenType.TOKEN_RIGHT_PAREN, "Expect ')' after condition.");

    const thenJump = this.emitJump(OpCode.OP_JUMP_IF_FALSE);
    this.emitByte(OpCode.OP_POP);
    this.statement();

    const elseJump = this.emitJump(OpCode.OP_JUMP);
    this.patchJump(thenJump);
    this.emitByte(OpCode.OP_POP);

    if (this.match(TokenType.TOKEN_ELSE)) {
      this.statement();
    }
    this.patchJump(elseJump);
  }

  printStatement() {
    this.expression();
    this.consume(TokenType.TOKEN_SEMICOLON, "Expect ';' after value.");
    this.emitByte(OpCode.OP_PRINT);
  }

  whileStatement() {
    const loopStart = this.chunk.code.length;

    this.consume(TokenType.TOKEN_LEFT_PAREN, "Expect '(' after 'while'.");
    this.expression();
    this.consume(TokenType.TOKEN_RIGHT_PAREN, "Expect ')' after condition.");

    const exitJump = this.emitJump(OpCode.OP_JUMP_IF_FALSE);
    this.emitByte(OpCode.OP_POP);
    this.statement();
    this.emitLoop(loopStart);

    this.patchJump(exitJump);
    this.emitByte(OpCode.OP_POP);
  }

  forStatement() {
    this.beginScope();
    this.consume(TokenType.TOKEN_LEFT_PAREN, "Expect '(' after 'for'.");

    // Initializer
    if (this.match(TokenType.TOKEN_SEMICOLON)) {
      // No initializer
    } else if (this.match(TokenType.TOKEN_VAR)) {
      this.varDeclaration();
    } else {
      this.expressionStatement();
    }

    let loopStart = this.chunk.code.length;
    let exitJump = -1;

    // Condition
    if (!this.match(TokenType.TOKEN_SEMICOLON)) {
      this.expression();
      this.consume(TokenType.TOKEN_SEMICOLON, "Expect ';' after loop condition.");

      exitJump = this.emitJump(OpCode.OP_JUMP_IF_FALSE);
      this.emitByte(OpCode.OP_POP);
    }

    // Increment
    if (!this.match(TokenType.TOKEN_RIGHT_PAREN)) {
      const bodyJump = this.emitJump(OpCode.OP_JUMP);
      const incrementStart = this.chunk.code.length;

      this.expression();
      this.emitByte(OpCode.OP_POP);
      this.consume(TokenType.TOKEN_RIGHT_PAREN, "Expect ')' after for clauses.");

      this.emitLoop(loopStart);
      loopStart = incrementStart;
      this.patchJump(bodyJump);
    }

    this.statement();
    this.emitLoop(loopStart);

    if (exitJump !== -1) {
      this.patchJump(exitJump);
      this.emitByte(OpCode.OP_POP);
    }

    this.endScope();
  }

  beginScope() {
    this.compiler.scopeDepth++;
    this.recordStep('begin_scope', `Begin scope depth ${this.compiler.scopeDepth}`);
  }

  endScope() {
    this.compiler.scopeDepth--;

    while (this.compiler.localCount > 0 &&
           this.compiler.locals[this.compiler.localCount - 1].depth > this.compiler.scopeDepth) {
      this.emitByte(OpCode.OP_POP);
      this.compiler.localCount--;
    }

    this.recordStep('end_scope', `End scope, now at depth ${this.compiler.scopeDepth}`);
  }

  statement() {
    if (this.match(TokenType.TOKEN_PRINT)) {
      this.printStatement();
    } else if (this.match(TokenType.TOKEN_FOR)) {
      this.forStatement();
    } else if (this.match(TokenType.TOKEN_IF)) {
      this.ifStatement();
    } else if (this.match(TokenType.TOKEN_WHILE)) {
      this.whileStatement();
    } else if (this.match(TokenType.TOKEN_LEFT_BRACE)) {
      this.beginScope();
      this.block();
      this.endScope();
    } else {
      this.expressionStatement();
    }
  }

  synchronize() {
    this.panicMode = false;

    while (this.current.type !== TokenType.TOKEN_EOF) {
      if (this.previous.type === TokenType.TOKEN_SEMICOLON) return;

      switch (this.current.type) {
        case TokenType.TOKEN_CLASS:
        case TokenType.TOKEN_FUN:
        case TokenType.TOKEN_VAR:
        case TokenType.TOKEN_FOR:
        case TokenType.TOKEN_IF:
        case TokenType.TOKEN_WHILE:
        case TokenType.TOKEN_PRINT:
        case TokenType.TOKEN_RETURN:
          return;
      }

      this.advance();
    }
  }

  declaration() {
    if (this.match(TokenType.TOKEN_VAR)) {
      this.varDeclaration();
    } else {
      this.statement();
    }

    if (this.panicMode) this.synchronize();
  }

  compile() {
    this.advance();

    while (!this.match(TokenType.TOKEN_EOF)) {
      this.declaration();
    }

    this.endCompiler();
    return !this.hadError;
  }

  endCompiler() {
    this.emitReturn();
    this.recordStep('end_compile', 'Compilation complete');
  }
}

function compile(source) {
  const parser = new Parser(source);
  const success = parser.compile();

  return {
    success,
    chunk: parser.chunk,
    steps: parser.steps
  };
}
