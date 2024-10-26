// SpriteText.js
import * as THREE from 'three';

export class SpriteText extends THREE.Sprite {
  constructor(text = '', textHeight = 10, color = 'rgba(255, 255, 255, 1)') {
    super(new THREE.SpriteMaterial({
      transparent: true,
      depthTest: true
    }));

    this._text = `${text}`;
    this._textHeight = textHeight;
    this._color = color;
    this._backgroundColor = false; // no background color
    this.renderOrder = 2000; // Set higher than all zone render orders

    this._padding = 10; // Add padding to prevent clipping
    this._borderWidth = 0;
    this._borderRadius = 0;
    this._borderColor = 'white';

    this._strokeWidth = 0;
    this._strokeColor = 'white';

    this._fontFace = 'system-ui';
    this._fontSize = 90; // defines text resolution
    this._fontWeight = 'normal';

    this._canvas = document.createElement('canvas');

    this._genCanvas();
  }

  _genCanvas() {
    const context = this._canvas.getContext('2d');
    context.font = `${this._fontWeight} ${this._fontSize}px ${this._fontFace}`;
    const textWidth = context.measureText(this._text).width;
    const textHeight = this._fontSize;

    // Increase canvas size to accommodate padding
    this._canvas.width = textWidth + this._padding * 2;
    this._canvas.height = textHeight + this._padding * 2;

    // Clear the canvas
    context.clearRect(0, 0, this._canvas.width, this._canvas.height);

    // Set background color if specified
    if (this._backgroundColor) {
      context.fillStyle = this._backgroundColor;
      context.fillRect(0, 0, this._canvas.width, this._canvas.height);
    }

    // Set text properties
    context.font = `${this._fontWeight} ${this._fontSize}px ${this._fontFace}`;
    context.textBaseline = 'top';
    context.fillStyle = this._color;

    // Draw the text with padding
    context.fillText(this._text, this._padding, this._padding);

    // Update the texture
    this.material.map = new THREE.CanvasTexture(this._canvas);
    this.material.transparent = true;
    this.material.needsUpdate = true;
  }

  get text() { return this._text; }
  set text(text) { this._text = text; this._genCanvas(); }
  get textHeight() { return this._textHeight; }
  set textHeight(textHeight) { this._textHeight = textHeight; this._genCanvas(); }
  get color() { return this._color; }
  set color(color) { this._color = color; this._genCanvas(); }
  get backgroundColor() { return this._backgroundColor; }
  set backgroundColor(color) { this._backgroundColor = color; this._genCanvas(); }
  get padding() { return this._padding; }
  set padding(padding) { this._padding = padding; this._genCanvas(); }
  get borderWidth() { return this._borderWidth; }
  set borderWidth(borderWidth) { this._borderWidth = borderWidth; this._genCanvas(); }
  get borderRadius() { return this._borderRadius; }
  set borderRadius(borderRadius) { this._borderRadius = borderRadius; this._genCanvas(); }
  get borderColor() { return this._borderColor; }
  set borderColor(borderColor) { this._borderColor = borderColor; this._genCanvas(); }
  get strokeWidth() { return this._strokeWidth; }
  set strokeWidth(strokeWidth) { this._strokeWidth = strokeWidth; this._genCanvas(); }
  get strokeColor() { return this._strokeColor; }
  set strokeColor(strokeColor) { this._strokeColor = strokeColor; this._genCanvas(); }
  get fontFace() { return this._fontFace; }
  set fontFace(fontFace) { this._fontFace = fontFace; this._genCanvas(); }
  get fontSize() { return this._fontSize; }
  set fontSize(fontSize) { this._fontSize = fontSize; this._genCanvas(); }
  get fontWeight() { return this._fontWeight; }
  set fontWeight(fontWeight) { this._fontWeight = fontWeight; this._genCanvas(); }
}