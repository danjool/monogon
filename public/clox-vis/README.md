# clox Visualizer

Interactive step-by-step visualizer for the clox compiler and VM from the book Crafting Interpreters.

Visualizes the compilation and execution of clox programs through Chapters 14-24 (up to but not including functions).

## What It Shows

**Two-phase visualization:**
1. **Compilation Phase**: Token stream (all at once, we don't show the scanning in process), Pratt parsing, bytecode emission
2. **Runtime Phase**: Bytecode execution with value stack and globals

Both phases share a horizontal bytecode carousel that shows the generated instructions.

## Features

**Compilation visualization:**
- Token stream with current token highlighted (horizontal carousel)
- Parser call stack showing precedence levels (color-coded by operation)
- Compiler state (scope depth, local variables)
- Parse rules reference table (horizontal layout, color-coded by token type)
- Constants pool as values are added
- Lines metadata for debugging info
- Bytecode emission in real-time

**Runtime visualization:**
- Instruction pointer (IP) tracking with red arrow indicator
- Value stack showing push/pop operations
- Global variables table
- Program output from print statements
- Jump arrows showing control flow (if/while/for)

**UI features:**
- Side-by-side source view (input and current line)
- Keyboard navigation (arrow keys to step)
- Smooth carousel animations
- Color-coded operations by type
- Step counter and descriptions

## Language Support

**Implemented features:**
- Types: nil, bool, number, string
- Literals: numbers, strings, true, false, nil
- Operators: + - * / (arithmetic), == != < > <= >= (comparison), ! and or (logical)
- Variables: global and local (with block scoping)
- Statements: print, expression, var declaration, blocks
- Control flow: if/else, while, for

**Not yet implemented:**
- Functions, closures, classes, objects (future work)

## Implementation

**File structure:**
```
clox-vis/
├── index.html          # UI structure
├── styles.css          # Visual styling (minimal, color-coded)
├── chunk.js            # Bytecode chunk + opcodes (ch14)
├── value.js            # Value types (nil, bool, number, string)
├── scanner.js          # Tokenizer (ch14-16)
├── compiler.js         # Pratt parser + bytecode emission (ch17-24)
├── vm.js               # Stack-based VM (ch15,18-24)
└── visualizer.js       # Step recording + UI rendering
```

**Key data structures:**

Token:
```js
{ type: TokenType, lexeme: string, line: number, literal: value|null }
```

Chunk:
```js
{ code: Array, lines: Array, constants: Array }
```

Compiler:
```js
{ locals: Array, scopeDepth: number }
```

VM:
```js
{ stack: Array, globals: Map, ip: number }
```

## Opcodes

```
Constants & Literals:   OP_CONSTANT, OP_NIL, OP_TRUE, OP_FALSE
Stack:                  OP_POP
Variables:              OP_DEFINE_GLOBAL, OP_GET_GLOBAL, OP_SET_GLOBAL,
                        OP_GET_LOCAL, OP_SET_LOCAL
Arithmetic:             OP_ADD, OP_SUBTRACT, OP_MULTIPLY, OP_DIVIDE, OP_NEGATE
Comparison:             OP_EQUAL, OP_GREATER, OP_LESS
Logical:                OP_NOT
Control Flow:           OP_JUMP, OP_JUMP_IF_FALSE, OP_LOOP
Output:                 OP_PRINT, OP_RETURN
```

## Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Source Code (Input)        │ Source Code (Current Line)      │
│ [textarea]                 │ [highlighted display]           │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ [Compile & Visualize]  [◀ Previous] [Next ▶]               │
│ Step 12/145                      Emitting OP_ADD instruction │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Token Stream (horizontal carousel)                           │
│ VAR  IDENTIFIER:a  =  NUMBER:1  ;  ▶IDENTIFIER:b◀  =  ...  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Parse Rules Reference (horizontal table with color-coded top)│
│       NUM STR T/F nil ID  +   -   *   /  == !=  <  > ... │
│ Prefix num str lit lit var    unary                          │
│ Infix                       bin bin bin bin bin bin bin bin   │
│ Prec                         6   6   7   7  4  4   5  5 ...  │
└──────────────────────────────────────────────────────────────┘

┌───────────────────────────────┬──────────────────────────────┐
│ Parser Call Stack             │ Compiler State               │
│ parsePrecedence(6)            │ Scope Depth: 0               │
│   pending: OP_ADD             │ Locals: []                   │
│ [color-coded left border]     │                              │
└───────────────────────────────┴──────────────────────────────┘

┌───────────────────────────┬──────────────────────────────────┐
│ Constants Pool            │ Lines Metadata                   │
│ [2] "b"                   │ Line 2: var b = 2;               │
│ [1] "a"                   │ byte[5]: line 2                  │
│ [0] 1                     │ byte[4]: line 1                  │
└───────────────────────────┴──────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Bytecode (horizontal carousel with jump arrows)              │
│      ↓ IP                                                    │
│  OP_CONST OP_DEF_GLB ▶OP_GET_GLB◀ OP_ADD OP_PRINT OP_RETURN│
│    [0]      [1]          [1]                 ^               │
│                          └──────jump─────────┘               │
└──────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────────────┬──────────────────────┐
│ Value Stack  │ Globals              │ Program Output       │
│ [1] 2        │ b: 2                 │ 3                    │
│ [0] 1        │ a: 1                 │                      │
└──────────────┴──────────────────────┴──────────────────────┘
```

## Example Programs

Simple arithmetic:
```
var a = 1;
var b = 2;
print a + b;
```

Control flow:
```
if (a < b) {
  print "a is less";
} else {
  print "b is less or equal";
}
```

Loops:
```
var i = 0;
while (i < 5) {
  print i;
  i = i + 1;
}
```

Nested scopes:
```
var a = "global";
{
  var a = "outer";
  {
    var a = "inner";
    print a;
  }
  print a;
}
print a;
```

## How It Works

**Step recording:**
Each phase pre-computes all steps into an array of snapshots. Each step captures:
- Current state of all data structures
- Description of what's happening
- Which elements to highlight in the UI

**Carousel animation:**
The token and bytecode carousels use CSS transforms to smoothly slide elements into view.
The centered item is always highlighted. Jump arrows in the bytecode view show control flow.

**Phase transition:**
When moving from compilation to runtime, the bytecode carousel resets to the start
(first instruction) without animation, then smoothly animates as the IP advances.

## Color Scheme

Operations are color-coded consistently across the UI by family:
- Literals/constants: gray
- Arithmetic (+, -, *, /): purple/pink family
- Comparison (==, !=, <, >): blue family
- Logical (and, or, !): teal family
- Variables: purple
- Control flow (if, while, for): red/orange family
- Print: orange
- Current instruction/token: black border with scale transform

Color coding appears in:
- Token carousel (border-left)
- Parse rules table headers (border-top)
- Parser call stack frames (border-left, based on pending operation)
- Bytecode instructions (border-left)

## Architecture Notes

This is a JavaScript port of clox from the book:
- Uses JS arrays for stack (not fixed-size C arrays)
- Uses JS Map for globals (not hash tables)
- Uses JS strings directly (not interned string table)
- No manual memory management (JS handles GC)
- Focus on correctness and visualization over optimization
- Each step is a full snapshot for easy playback
