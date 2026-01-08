# clox Visualizer

Interactive step-by-step visualizer for the clox compiler and VM from Crafting Interpreters Chapter 14-30.

## Architecture

**Two-phase stepping system:**
1. **Compile Phase**: Scanner → Parser → Bytecode Emission (with tokens, compiler state, constants pool)
2. **VM Phase**: Bytecode execution (with value stack, globals, locals, call frames, IP tracking)

**Shared bytecode carousel** between phases - horizontal scrolling view of opcodes.

## File Structure

```
clox-vis/
├── index.html          # Main UI structure
├── styles.css          # Visual styling (minimal, color-coded like pratt-vis)
├── scanner.js          # Tokenization (ch14-16)
├── compiler.js         # Pratt parser + bytecode emission (ch17-24)
├── chunk.js            # Bytecode chunk representation (ch14)
├── value.js            # clox value types + Object hierarchy (ch18-19,26-30)
├── vm.js               # Stack-based VM interpreter (ch15,18-30)
├── visualizer.js       # Step recording + UI rendering
└── PROJECT.md          # This file
```

## Implementation Scope

**Full clox from the book:**
- Types: nil, bool, number, string, function, native, closure, class, instance, bound method
- Expressions: literals, unary, binary, grouping, variables, assignment, logical, call, get, set, this, super
- Statements: print, expression, var, block, if, while, for, return
- Functions: declarations, calls, closures, returns
- Classes: declarations, methods, fields, initializers, inheritance, super
- Operators: arithmetic, comparison, logical, string concat
- Control flow: if/else, while, for
- Scoping: global, local, block
- VM features: stack, globals, locals, upvalues, call frames, GC (conceptual - JS handles memory)

## Data Structures

### Token (scanner.js)
```js
{ type: TokenType, lexeme: string, line: number, literal: value|null }
```

### Chunk (chunk.js)
```js
{
  code: Uint8Array,      // bytecode
  lines: Uint32Array,    // line info
  constants: Array       // constant pool
}
```

### Compiler (compiler.js)
```js
{
  locals: Array<{name, depth, isCaptured}>,
  upvalues: Array<{index, isLocal}>,
  scopeDepth: number,
  function: ObjFunction,
  enclosing: Compiler|null
}
```

### CallFrame (vm.js)
```js
{
  closure: ObjClosure,
  ip: number,           // instruction pointer
  slots: number         // stack offset for this frame
}
```

### VM (vm.js)
```js
{
  frames: Array<CallFrame>,
  frameCount: number,
  stack: Array,
  stackTop: number,
  globals: Map<string, value>,
  openUpvalues: Array<ObjUpvalue>
}
```

## Opcodes (Full Set)

```js
// Constants & Literals
OP_CONSTANT, OP_NIL, OP_TRUE, OP_FALSE

// Arithmetic
OP_NEGATE, OP_ADD, OP_SUBTRACT, OP_MULTIPLY, OP_DIVIDE

// Comparison & Logic
OP_NOT, OP_EQUAL, OP_GREATER, OP_LESS

// Variables
OP_DEFINE_GLOBAL, OP_GET_GLOBAL, OP_SET_GLOBAL,
OP_GET_LOCAL, OP_SET_LOCAL,
OP_GET_UPVALUE, OP_SET_UPVALUE

// Control Flow
OP_JUMP, OP_JUMP_IF_FALSE, OP_LOOP

// Functions
OP_CALL, OP_CLOSURE, OP_CLOSE_UPVALUE, OP_RETURN

// Classes & Objects
OP_CLASS, OP_GET_PROPERTY, OP_SET_PROPERTY,
OP_METHOD, OP_INVOKE, OP_INHERIT,
OP_GET_SUPER, OP_SUPER_INVOKE

// Output
OP_PRINT, OP_POP
```

## Step Recording Strategy

Each phase pre-computes all steps into an array:

```js
// Compile phase steps
{
  action: 'scan_token' | 'advance' | 'emit_byte' | 'add_constant' |
          'begin_scope' | 'end_scope' | 'declare_variable' | ...,
  description: string,
  compiler: {...},      // snapshot of compiler state
  chunk: {...},         // snapshot of chunk
  currentToken: Token,
  previousToken: Token
}

// VM phase steps
{
  action: 'fetch' | 'decode' | 'execute' | 'push' | 'pop' |
          'call' | 'return' | 'jump' | ...,
  description: string,
  ip: number,
  instruction: {opcode, operands},
  stack: [...],         // snapshot
  frames: [...],        // snapshot
  globals: Map,         // snapshot
  locals: Array         // current frame locals
}
```

## UI Components

### Compile Phase Display
- **Source view**: Input textarea with current line highlighted
- **Token stream**: Horizontal scrollable with current token emphasized (like pratt-vis)
- **Compiler state**: scope depth, current locals, upvalues
- **Constants pool**: Indexed constant values

### Bytecode Carousel (Shared)
- **Horizontal**: `... OP_CONSTANT[0] ▶OP_ADD◀ OP_PRINT ...`
- **Current instruction highlighted** (different for compile vs VM phase)
- **Operands shown** below opcode
- **Color coding** per instruction family (arithmetic, variables, control flow, etc.)

### VM Phase Display
- **Value stack**: Vertical stack visualization (top = right)
- **Instruction decode**: Current opcode explanation ("OP_ADD: pop 2, add, push result")
- **Globals table**: Key-value pairs
- **Locals table**: Current frame's local variables
- **Call frames stack**: Function call hierarchy
- **Output panel**: print statement results

## Color Scheme (Minimal)

Based on pratt-visualizer style:
- Constants/literals: gray
- Arithmetic: purple/pink family
- Variables: green family
- Control flow: orange family
- Functions/calls: blue family
- Classes/objects: teal family
- Current instruction: black border
- Not-yet-emitted (compile): dimmed/translucent

## Implementation Order

1. **chunk.js** - Bytecode data structure
2. **value.js** - Value types and Object hierarchy
3. **scanner.js** - Full tokenizer
4. **compiler.js** - Pratt parser + emission (biggest file)
5. **vm.js** - Stack VM interpreter
6. **visualizer.js** - Step recording + UI control
7. **styles.css** - Layout and colors
8. **index.html** - UI structure + script loading

## Key Algorithms

### Pratt Parsing (compiler.js)
- `parsePrecedence(precedence)` - core recursive descent
- Prefix rules: literal, grouping, unary, variable, this, super
- Infix rules: binary, logical, call, dot, assignment
- Parse rules table mapping TokenType → {prefix, infix, precedence}

### Compiler (compiler.js)
- Local variable resolution (walk backwards in locals array)
- Upvalue capture (recursive search up enclosing compilers)
- Scope management (beginScope/endScope with depth tracking)
- Jump patching (emit placeholder, patch offset later)

### VM Execution (vm.js)
- Fetch-decode-execute loop
- Stack operations (push/pop/peek)
- Frame management (call/return)
- Upvalue closing (when locals go out of scope)
- Method binding (this binding for class instances)
- Super method resolution (walk inheritance chain)

## Testing Strategy

Start with simple programs, progressively add complexity:

1. **Literals**: `42;` `"hello";` `true;` `nil;`
2. **Arithmetic**: `1 + 2 * 3;` `-5 / 2;`
3. **Variables**: `var x = 10; print x;`
4. **Blocks**: `{ var a = 1; { var b = 2; print a + b; } }`
5. **Control flow**: `if (x > 5) print "big"; else print "small";`
6. **Loops**: `for (var i = 0; i < 10; i = i + 1) print i;`
7. **Functions**: `fun fib(n) { if (n < 2) return n; return fib(n-1) + fib(n-2); }`
8. **Closures**: `fun outer() { var x = 1; fun inner() { print x; } return inner; }`
9. **Classes**: `class Dog { bark() { print "woof"; } } var d = Dog(); d.bark();`
10. **Inheritance**: `class Animal {} class Dog < Animal { bark() { print "woof"; } }`

## Notes

- JS port means no manual memory management - simplifies GC
- Use JS arrays for stack (not fixed-size C array)
- Use JS Map for globals (not hash table)
- Use JS strings directly (not interned string objects)
- Focus on correctness over optimization
- Visualization instrumentation happens during normal execution (record steps)
- Each step is a full snapshot for easy playback


1. Port clox scanner/compiler/VM to JavaScript
2. Bytecode should be horizontal and shared between compile phase (top) and VM phase (bottom) - the meat in the clox sandwich, ops look like keyboard keys kinda (tall and slim)
3. Bytecode carousel - slides left/right as a sequence, not showing entire program at once
@4. VM should show everything: value stack, instruction decode details, globals/locals tables, and call frames - using the space freed up by having bytecode in the middle

So the revised layout concept:

┌────────────────────────────────────────────────────┐
│  [Source input]               [Compile] [Reset]    │
└────────────────────────────────────────────────────┘

COMPILE PHASE [←][→] Step 12/45
┌─────────────────┬──────────────────┬───────────────┐
│ Tokens:         │ Compiler State:  │ Constants:    │
│ VAR ID:x = NUM  │ scope_depth: 0   │ [0] 10.0      │
│     ▲▲▲▲        │ locals: []       │ [1] "x"       │
└─────────────────┴──────────────────┴───────────────┘

BYTECODE (shared)
┌────────────────────────────────────────────────────┐
│  ... OP_CONST OP_DEF_GLB ▶OP_GET_GLB◀ OP_ADD ...  │
│         [0]      [1]          [1]         ...      │
└────────────────────────────────────────────────────┘

VM PHASE [←][→] Step 3/8
┌────────┬─────────────┬──────────┬─────────────────┐
│ Stack: │ Decode:     │ Globals: │ Call Frames:    │
│ ┏━━━┓  │ OP_GET_GLB  │ x: 10    │ <script> [ip:4] │
│ ┃ 10┃  │ Load var 'x'│          │                 │
│ ┗━━━┛  │ Push to stk │ Output:  │                 │
│        │             │ (empty)  │                 │
└────────┴─────────────┴──────────┴─────────────────┘