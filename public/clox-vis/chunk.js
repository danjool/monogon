// Bytecode chunk representation for clox visualizer

// OpCodes matching the C implementation
const OpCode = {
  OP_CONSTANT: 0,
  OP_NIL: 1,
  OP_TRUE: 2,
  OP_FALSE: 3,
  OP_POP: 4,
  OP_GET_LOCAL: 5,
  OP_SET_LOCAL: 6,
  OP_GET_GLOBAL: 7,
  OP_SET_GLOBAL: 8,
  OP_DEFINE_GLOBAL: 9,
  OP_EQUAL: 10,
  OP_GREATER: 11,
  OP_LESS: 12,
  OP_ADD: 13,
  OP_SUBTRACT: 14,
  OP_MULTIPLY: 15,
  OP_DIVIDE: 16,
  OP_NOT: 17,
  OP_NEGATE: 18,
  OP_PRINT: 19,
  OP_JUMP: 20,
  OP_JUMP_IF_FALSE: 21,
  OP_LOOP: 22,
  OP_RETURN: 23,
};

// Reverse mapping for disassembly
const OpCodeNames = {
  0: 'OP_CONSTANT',
  1: 'OP_NIL',
  2: 'OP_TRUE',
  3: 'OP_FALSE',
  4: 'OP_POP',
  5: 'OP_GET_LOCAL',
  6: 'OP_SET_LOCAL',
  7: 'OP_GET_GLOBAL',
  8: 'OP_SET_GLOBAL',
  9: 'OP_DEFINE_GLOBAL',
  10: 'OP_EQUAL',
  11: 'OP_GREATER',
  12: 'OP_LESS',
  13: 'OP_ADD',
  14: 'OP_SUBTRACT',
  15: 'OP_MULTIPLY',
  16: 'OP_DIVIDE',
  17: 'OP_NOT',
  18: 'OP_NEGATE',
  19: 'OP_PRINT',
  20: 'OP_JUMP',
  21: 'OP_JUMP_IF_FALSE',
  22: 'OP_LOOP',
  23: 'OP_RETURN',
};

class Chunk {
  constructor() {
    this.code = [];      // Array of bytes (opcodes and operands)
    this.lines = [];     // Line numbers for each byte
    this.constants = []; // Constant pool
  }

  write(byte, line) {
    this.code.push(byte);
    this.lines.push(line);
  }

  addConstant(value) {
    this.constants.push(value);
    return this.constants.length - 1;
  }

  // Create a snapshot for visualization
  snapshot() {
    return {
      code: [...this.code],
      lines: [...this.lines],
      constants: this.constants.map(v => ({ ...v }))
    };
  }

  // Disassemble instruction at offset
  disassembleInstruction(offset) {
    const opcode = this.code[offset];
    const name = OpCodeNames[opcode] || 'UNKNOWN';

    switch (opcode) {
      case OpCode.OP_CONSTANT:
      case OpCode.OP_DEFINE_GLOBAL:
      case OpCode.OP_GET_GLOBAL:
      case OpCode.OP_SET_GLOBAL:
      case OpCode.OP_GET_LOCAL:
      case OpCode.OP_SET_LOCAL:
        const operand = this.code[offset + 1];
        return {
          name,
          operand: operand !== undefined ? operand : '?',
          length: 2
        };

      case OpCode.OP_JUMP:
      case OpCode.OP_JUMP_IF_FALSE:
      case OpCode.OP_LOOP:
        const high = this.code[offset + 1];
        const low = this.code[offset + 2];

        // Check if both bytes exist
        if (high === undefined || low === undefined) {
          return {
            name,
            operand: '?',
            length: 3
          };
        }

        const jump = (high << 8) | low;
        // Show ? for unpatched jumps (close to 0xffff) or incomplete
        if (jump >= 65280) {  // 0xff00 or higher indicates unpatched/incomplete
          return {
            name,
            operand: '?',
            length: 3
          };
        }

        return {
          name,
          operand: jump,
          length: 3
        };

      default:
        return {
          name,
          operand: null,
          length: 1
        };
    }
  }
}
