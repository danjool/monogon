// Value representation for clox visualizer

const ValueType = {
  VAL_BOOL: 'VAL_BOOL',
  VAL_NIL: 'VAL_NIL',
  VAL_NUMBER: 'VAL_NUMBER',
  VAL_OBJ: 'VAL_OBJ'
};

const ObjType = {
  OBJ_STRING: 'OBJ_STRING'
};

// Helper functions to create values
function BOOL_VAL(value) {
  return { type: ValueType.VAL_BOOL, value };
}

function NIL_VAL() {
  return { type: ValueType.VAL_NIL, value: null };
}

function NUMBER_VAL(value) {
  return { type: ValueType.VAL_NUMBER, value };
}

function OBJ_VAL(obj) {
  return { type: ValueType.VAL_OBJ, value: obj };
}

// Type checking helpers
function IS_BOOL(value) {
  return value.type === ValueType.VAL_BOOL;
}

function IS_NIL(value) {
  return value.type === ValueType.VAL_NIL;
}

function IS_NUMBER(value) {
  return value.type === ValueType.VAL_NUMBER;
}

function IS_OBJ(value) {
  return value.type === ValueType.VAL_OBJ;
}

function IS_STRING(value) {
  return IS_OBJ(value) && value.value.type === ObjType.OBJ_STRING;
}

// Value extraction helpers
function AS_BOOL(value) {
  return value.value;
}

function AS_NUMBER(value) {
  return value.value;
}

function AS_STRING(value) {
  return value.value.chars;
}

// Object types
function OBJ_STRING(chars) {
  return {
    type: ObjType.OBJ_STRING,
    chars
  };
}

// Value equality
function valuesEqual(a, b) {
  if (a.type !== b.type) return false;

  switch (a.type) {
    case ValueType.VAL_BOOL:
      return AS_BOOL(a) === AS_BOOL(b);
    case ValueType.VAL_NIL:
      return true;
    case ValueType.VAL_NUMBER:
      return AS_NUMBER(a) === AS_NUMBER(b);
    case ValueType.VAL_OBJ:
      if (IS_STRING(a) && IS_STRING(b)) {
        return AS_STRING(a) === AS_STRING(b);
      }
      return false;
    default:
      return false;
  }
}

// Print value for display
function printValue(value) {
  switch (value.type) {
    case ValueType.VAL_BOOL:
      return AS_BOOL(value) ? 'true' : 'false';
    case ValueType.VAL_NIL:
      return 'nil';
    case ValueType.VAL_NUMBER:
      return AS_NUMBER(value).toString();
    case ValueType.VAL_OBJ:
      if (IS_STRING(value)) {
        return AS_STRING(value);
      }
      return '[object]';
    default:
      return '???';
  }
}

// Check if value is falsey (nil or false)
function isFalsey(value) {
  return IS_NIL(value) || (IS_BOOL(value) && !AS_BOOL(value));
}
