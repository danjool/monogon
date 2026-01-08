// VM (Virtual Machine) for clox visualizer
// Mirrors vm.c implementation and records execution steps for visualization

class VM {
  constructor() {
    this.stack = [];
    this.globals = new Map(); // name -> value
    this.ip = 0;
    this.chunk = null;
    this.steps = [];
    this.output = []; // Accumulated print output
  }

  reset() {
    this.stack = [];
    this.ip = 0;
    this.steps = [];
    this.output = [];
  }

  push(value) {
    this.stack.push(value);
  }

  pop() {
    return this.stack.pop();
  }

  peek(distance) {
    return this.stack[this.stack.length - 1 - distance];
  }

  recordStep(description, ip = this.ip, activeConstantIndex = null, activeGlobalName = null) {
    this.steps.push({
      description,
      ip: ip,
      stack: [...this.stack],
      globals: new Map(this.globals),
      output: [...this.output],
      chunk: this.chunk.snapshot(),
      activeConstantIndex,
      activeGlobalName
    });
  }

  isFalsey(value) {
    return IS_NIL(value) || (IS_BOOL(value) && !AS_BOOL(value));
  }

  valuesEqual(a, b) {
    return valuesEqual(a, b);
  }

  concatenate() {
    const b = AS_STRING(this.pop());
    const a = AS_STRING(this.pop());
    const result = a + b;
    this.push(OBJ_VAL(OBJ_STRING(result)));
  }

  readByte() {
    return this.chunk.code[this.ip++];
  }

  readShort() {
    const high = this.chunk.code[this.ip++];
    const low = this.chunk.code[this.ip++];
    return (high << 8) | low;
  }

  readConstant() {
    const index = this.readByte();
    return this.chunk.constants[index];
  }

  readConstantIndex() {
    return this.readByte();
  }

  readString() {
    const constant = this.readConstant();
    // Extract the actual string from the value object
    return AS_STRING(constant);
  }

  readStringWithIndex() {
    const index = this.readConstantIndex();
    const constant = this.chunk.constants[index];
    return { name: AS_STRING(constant), index };
  }

  run(chunk) {
    this.chunk = chunk;
    this.ip = 0;
    this.reset();

    // Record initial state
    this.recordStep('Start execution');

    // Main execution loop
    while (this.ip < this.chunk.code.length) {
      const instructionOffset = this.ip;  // Save IP before reading instruction
      const instruction = this.readByte();

      switch (instruction) {
        case OpCode.OP_CONSTANT: {
          const index = this.readConstantIndex();
          const constant = this.chunk.constants[index];
          this.push(constant);
          this.recordStep(`Load constant ${printValue(constant)}`, instructionOffset, index, null);
          break;
        }

        case OpCode.OP_NIL:
          this.push(NIL_VAL());
          this.recordStep('Push nil', instructionOffset);
          break;

        case OpCode.OP_TRUE:
          this.push(BOOL_VAL(true));
          this.recordStep('Push true', instructionOffset);
          break;

        case OpCode.OP_FALSE:
          this.push(BOOL_VAL(false));
          this.recordStep('Push false', instructionOffset);
          break;

        case OpCode.OP_POP:
          this.pop();
          this.recordStep('Pop value', instructionOffset);
          break;

        case OpCode.OP_GET_LOCAL: {
          const slot = this.readByte();
          this.push(this.stack[slot]);
          this.recordStep(`Get local at slot ${slot}`, instructionOffset);
          break;
        }

        case OpCode.OP_SET_LOCAL: {
          const slot = this.readByte();
          this.stack[slot] = this.peek(0);
          this.recordStep(`Set local at slot ${slot}`, instructionOffset);
          break;
        }

        case OpCode.OP_GET_GLOBAL: {
          const { name, index } = this.readStringWithIndex();
          if (!this.globals.has(name)) {
            this.recordStep(`Error: Undefined variable '${name}'`, instructionOffset);
            return { success: false, error: `Undefined variable '${name}'`, steps: this.steps };
          }
          this.push(this.globals.get(name));
          this.recordStep(`Get global '${name}'`, instructionOffset, index, name);
          break;
        }

        case OpCode.OP_DEFINE_GLOBAL: {
          const { name, index } = this.readStringWithIndex();
          this.globals.set(name, this.peek(0));
          this.pop();
          this.recordStep(`Define global '${name}'`, instructionOffset, index, name);
          break;
        }

        case OpCode.OP_SET_GLOBAL: {
          const { name, index } = this.readStringWithIndex();
          if (!this.globals.has(name)) {
            this.recordStep(`Error: Undefined variable '${name}'`, instructionOffset);
            return { success: false, error: `Undefined variable '${name}'`, steps: this.steps };
          }
          this.globals.set(name, this.peek(0));
          this.recordStep(`Set global '${name}'`, instructionOffset, index, name);
          break;
        }

        case OpCode.OP_EQUAL: {
          const b = this.pop();
          const a = this.pop();
          this.push(BOOL_VAL(this.valuesEqual(a, b)));
          this.recordStep('Compare equal', instructionOffset);
          break;
        }

        case OpCode.OP_GREATER: {
          if (!IS_NUMBER(this.peek(0)) || !IS_NUMBER(this.peek(1))) {
            this.recordStep('Error: Operands must be numbers', instructionOffset);
            return { success: false, error: 'Operands must be numbers', steps: this.steps };
          }
          const b = AS_NUMBER(this.pop());
          const a = AS_NUMBER(this.pop());
          this.push(BOOL_VAL(a > b));
          this.recordStep('Compare greater', instructionOffset);
          break;
        }

        case OpCode.OP_LESS: {
          if (!IS_NUMBER(this.peek(0)) || !IS_NUMBER(this.peek(1))) {
            this.recordStep('Error: Operands must be numbers', instructionOffset);
            return { success: false, error: 'Operands must be numbers', steps: this.steps };
          }
          const b = AS_NUMBER(this.pop());
          const a = AS_NUMBER(this.pop());
          this.push(BOOL_VAL(a < b));
          this.recordStep('Compare less', instructionOffset);
          break;
        }

        case OpCode.OP_ADD: {
          if (IS_STRING(this.peek(0)) && IS_STRING(this.peek(1))) {
            this.concatenate();
            this.recordStep('Concatenate strings', instructionOffset);
          } else if (IS_NUMBER(this.peek(0)) && IS_NUMBER(this.peek(1))) {
            const b = AS_NUMBER(this.pop());
            const a = AS_NUMBER(this.pop());
            this.push(NUMBER_VAL(a + b));
            this.recordStep('Add numbers', instructionOffset);
          } else {
            this.recordStep('Error: Operands must be two numbers or two strings', instructionOffset);
            return { success: false, error: 'Operands must be two numbers or two strings', steps: this.steps };
          }
          break;
        }

        case OpCode.OP_SUBTRACT: {
          if (!IS_NUMBER(this.peek(0)) || !IS_NUMBER(this.peek(1))) {
            this.recordStep('Error: Operands must be numbers', instructionOffset);
            return { success: false, error: 'Operands must be numbers', steps: this.steps };
          }
          const b = AS_NUMBER(this.pop());
          const a = AS_NUMBER(this.pop());
          this.push(NUMBER_VAL(a - b));
          this.recordStep('Subtract', instructionOffset);
          break;
        }

        case OpCode.OP_MULTIPLY: {
          if (!IS_NUMBER(this.peek(0)) || !IS_NUMBER(this.peek(1))) {
            this.recordStep('Error: Operands must be numbers', instructionOffset);
            return { success: false, error: 'Operands must be numbers', steps: this.steps };
          }
          const b = AS_NUMBER(this.pop());
          const a = AS_NUMBER(this.pop());
          this.push(NUMBER_VAL(a * b));
          this.recordStep('Multiply', instructionOffset);
          break;
        }

        case OpCode.OP_DIVIDE: {
          if (!IS_NUMBER(this.peek(0)) || !IS_NUMBER(this.peek(1))) {
            this.recordStep('Error: Operands must be numbers', instructionOffset);
            return { success: false, error: 'Operands must be numbers', steps: this.steps };
          }
          const b = AS_NUMBER(this.pop());
          const a = AS_NUMBER(this.pop());
          this.push(NUMBER_VAL(a / b));
          this.recordStep('Divide', instructionOffset);
          break;
        }

        case OpCode.OP_NOT:
          this.push(BOOL_VAL(this.isFalsey(this.pop())));
          this.recordStep('Logical NOT', instructionOffset);
          break;

        case OpCode.OP_NEGATE: {
          if (!IS_NUMBER(this.peek(0))) {
            this.recordStep('Error: Operand must be a number', instructionOffset);
            return { success: false, error: 'Operand must be a number', steps: this.steps };
          }
          const value = AS_NUMBER(this.pop());
          this.push(NUMBER_VAL(-value));
          this.recordStep('Negate', instructionOffset);
          break;
        }

        case OpCode.OP_PRINT: {
          const value = this.pop();
          const printedValue = printValue(value);
          this.output.push(printedValue);
          this.recordStep(`Print: ${printedValue}`, instructionOffset);
          break;
        }

        case OpCode.OP_JUMP: {
          const offset = this.readShort();
          this.ip += offset;
          this.recordStep(`Jump forward by ${offset}`, instructionOffset);
          break;
        }

        case OpCode.OP_JUMP_IF_FALSE: {
          const offset = this.readShort();
          if (this.isFalsey(this.peek(0))) {
            this.ip += offset;
            this.recordStep(`Jump forward by ${offset} (condition false)`, instructionOffset);
          } else {
            this.recordStep(`Continue (condition true)`, instructionOffset);
          }
          break;
        }

        case OpCode.OP_LOOP: {
          const offset = this.readShort();
          this.ip -= offset;
          this.recordStep(`Loop back by ${offset}`, instructionOffset);
          break;
        }

        case OpCode.OP_RETURN:
          this.recordStep('Return (end execution)', instructionOffset);
          return { success: true, steps: this.steps };

        default:
          this.recordStep(`Error: Unknown opcode ${instruction}`, instructionOffset);
          return { success: false, error: `Unknown opcode ${instruction}`, steps: this.steps };
      }
    }

    return { success: true, steps: this.steps };
  }
}

// Run the VM and return execution steps
function runVM(chunk) {
  const vm = new VM();
  return vm.run(chunk);
}
