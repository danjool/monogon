// Scanner (lexer) for clox visualizer

const TokenType = {
  // Single-character tokens
  TOKEN_LEFT_PAREN: 'TOKEN_LEFT_PAREN',
  TOKEN_RIGHT_PAREN: 'TOKEN_RIGHT_PAREN',
  TOKEN_LEFT_BRACE: 'TOKEN_LEFT_BRACE',
  TOKEN_RIGHT_BRACE: 'TOKEN_RIGHT_BRACE',
  TOKEN_COMMA: 'TOKEN_COMMA',
  TOKEN_DOT: 'TOKEN_DOT',
  TOKEN_MINUS: 'TOKEN_MINUS',
  TOKEN_PLUS: 'TOKEN_PLUS',
  TOKEN_SEMICOLON: 'TOKEN_SEMICOLON',
  TOKEN_SLASH: 'TOKEN_SLASH',
  TOKEN_STAR: 'TOKEN_STAR',

  // One or two character tokens
  TOKEN_BANG: 'TOKEN_BANG',
  TOKEN_BANG_EQUAL: 'TOKEN_BANG_EQUAL',
  TOKEN_EQUAL: 'TOKEN_EQUAL',
  TOKEN_EQUAL_EQUAL: 'TOKEN_EQUAL_EQUAL',
  TOKEN_GREATER: 'TOKEN_GREATER',
  TOKEN_GREATER_EQUAL: 'TOKEN_GREATER_EQUAL',
  TOKEN_LESS: 'TOKEN_LESS',
  TOKEN_LESS_EQUAL: 'TOKEN_LESS_EQUAL',

  // Literals
  TOKEN_IDENTIFIER: 'TOKEN_IDENTIFIER',
  TOKEN_STRING: 'TOKEN_STRING',
  TOKEN_NUMBER: 'TOKEN_NUMBER',

  // Keywords
  TOKEN_AND: 'TOKEN_AND',
  TOKEN_CLASS: 'TOKEN_CLASS',
  TOKEN_ELSE: 'TOKEN_ELSE',
  TOKEN_FALSE: 'TOKEN_FALSE',
  TOKEN_FOR: 'TOKEN_FOR',
  TOKEN_FUN: 'TOKEN_FUN',
  TOKEN_IF: 'TOKEN_IF',
  TOKEN_NIL: 'TOKEN_NIL',
  TOKEN_OR: 'TOKEN_OR',
  TOKEN_PRINT: 'TOKEN_PRINT',
  TOKEN_RETURN: 'TOKEN_RETURN',
  TOKEN_SUPER: 'TOKEN_SUPER',
  TOKEN_THIS: 'TOKEN_THIS',
  TOKEN_TRUE: 'TOKEN_TRUE',
  TOKEN_VAR: 'TOKEN_VAR',
  TOKEN_WHILE: 'TOKEN_WHILE',

  TOKEN_ERROR: 'TOKEN_ERROR',
  TOKEN_EOF: 'TOKEN_EOF'
};

const keywords = {
  'and': TokenType.TOKEN_AND,
  'class': TokenType.TOKEN_CLASS,
  'else': TokenType.TOKEN_ELSE,
  'false': TokenType.TOKEN_FALSE,
  'for': TokenType.TOKEN_FOR,
  'fun': TokenType.TOKEN_FUN,
  'if': TokenType.TOKEN_IF,
  'nil': TokenType.TOKEN_NIL,
  'or': TokenType.TOKEN_OR,
  'print': TokenType.TOKEN_PRINT,
  'return': TokenType.TOKEN_RETURN,
  'super': TokenType.TOKEN_SUPER,
  'this': TokenType.TOKEN_THIS,
  'true': TokenType.TOKEN_TRUE,
  'var': TokenType.TOKEN_VAR,
  'while': TokenType.TOKEN_WHILE
};

class Scanner {
  constructor(source) {
    this.source = source;
    this.start = 0;
    this.current = 0;
    this.line = 1;
    this.tokenIndex = 0;  // Track token index for visualization
  }

  isAtEnd() {
    return this.current >= this.source.length;
  }

  advance() {
    return this.source[this.current++];
  }

  peek() {
    if (this.isAtEnd()) return '\0';
    return this.source[this.current];
  }

  peekNext() {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source[this.current + 1];
  }

  match(expected) {
    if (this.isAtEnd()) return false;
    if (this.source[this.current] !== expected) return false;
    this.current++;
    return true;
  }

  makeToken(type) {
    return {
      type,
      lexeme: this.source.substring(this.start, this.current),
      line: this.line,
      index: this.tokenIndex++  // Add and increment token index
    };
  }

  errorToken(message) {
    return {
      type: TokenType.TOKEN_ERROR,
      lexeme: message,
      line: this.line,
      index: this.tokenIndex++  // Add and increment token index
    };
  }

  skipWhitespace() {
    while (true) {
      const c = this.peek();
      switch (c) {
        case ' ':
        case '\r':
        case '\t':
          this.advance();
          break;
        case '\n':
          this.line++;
          this.advance();
          break;
        case '/':
          if (this.peekNext() === '/') {
            // Comment goes until end of line
            while (this.peek() !== '\n' && !this.isAtEnd()) {
              this.advance();
            }
          } else {
            return;
          }
          break;
        default:
          return;
      }
    }
  }

  isAlpha(c) {
    return (c >= 'a' && c <= 'z') ||
           (c >= 'A' && c <= 'Z') ||
           c === '_';
  }

  isDigit(c) {
    return c >= '0' && c <= '9';
  }

  identifier() {
    while (this.isAlpha(this.peek()) || this.isDigit(this.peek())) {
      this.advance();
    }

    const text = this.source.substring(this.start, this.current);
    const type = keywords[text] || TokenType.TOKEN_IDENTIFIER;
    return this.makeToken(type);
  }

  number() {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    // Look for fractional part
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance(); // Consume the '.'
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    return this.makeToken(TokenType.TOKEN_NUMBER);
  }

  string() {
    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === '\n') this.line++;
      this.advance();
    }

    if (this.isAtEnd()) {
      return this.errorToken('Unterminated string.');
    }

    // The closing quote
    this.advance();
    return this.makeToken(TokenType.TOKEN_STRING);
  }

  scanToken() {
    this.skipWhitespace();
    this.start = this.current;

    if (this.isAtEnd()) {
      return this.makeToken(TokenType.TOKEN_EOF);
    }

    const c = this.advance();

    if (this.isAlpha(c)) return this.identifier();
    if (this.isDigit(c)) return this.number();

    switch (c) {
      case '(': return this.makeToken(TokenType.TOKEN_LEFT_PAREN);
      case ')': return this.makeToken(TokenType.TOKEN_RIGHT_PAREN);
      case '{': return this.makeToken(TokenType.TOKEN_LEFT_BRACE);
      case '}': return this.makeToken(TokenType.TOKEN_RIGHT_BRACE);
      case ';': return this.makeToken(TokenType.TOKEN_SEMICOLON);
      case ',': return this.makeToken(TokenType.TOKEN_COMMA);
      case '.': return this.makeToken(TokenType.TOKEN_DOT);
      case '-': return this.makeToken(TokenType.TOKEN_MINUS);
      case '+': return this.makeToken(TokenType.TOKEN_PLUS);
      case '/': return this.makeToken(TokenType.TOKEN_SLASH);
      case '*': return this.makeToken(TokenType.TOKEN_STAR);
      case '!':
        return this.makeToken(
          this.match('=') ? TokenType.TOKEN_BANG_EQUAL : TokenType.TOKEN_BANG
        );
      case '=':
        return this.makeToken(
          this.match('=') ? TokenType.TOKEN_EQUAL_EQUAL : TokenType.TOKEN_EQUAL
        );
      case '<':
        return this.makeToken(
          this.match('=') ? TokenType.TOKEN_LESS_EQUAL : TokenType.TOKEN_LESS
        );
      case '>':
        return this.makeToken(
          this.match('=') ? TokenType.TOKEN_GREATER_EQUAL : TokenType.TOKEN_GREATER
        );
      case '"': return this.string();
    }

    return this.errorToken('Unexpected character.');
  }

  // Scan all tokens at once
  scanAllTokens() {
    const tokens = [];
    while (true) {
      const token = this.scanToken();
      tokens.push(token);
      if (token.type === TokenType.TOKEN_EOF) break;
    }
    return tokens;
  }
}
