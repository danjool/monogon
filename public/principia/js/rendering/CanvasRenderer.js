/**
 * CanvasRenderer - Renders geometric elements on a canvas
 */
import { EventEmitter } from '../core/EventEmitter.js';
import { Point } from '../geometry/Point.js';
import { Line } from '../geometry/Line.js';
import { Circle } from '../geometry/Circle.js';
import { Triangle } from '../geometry/Triangle.js';
import { Plane } from '../geometry/Plane.js';

export class CanvasRenderer extends EventEmitter {
  /**
   * Create a new canvas renderer
   * @param {string|HTMLCanvasElement} canvas - Canvas element or ID
   * @param {Object} registry - Element registry
   */
  constructor(canvas, registry) {
    super();
    
    // Get canvas element
    this.canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;
    
    if (!this.canvas || !(this.canvas instanceof HTMLCanvasElement)) {
      throw new Error('Invalid canvas element');
    }
    
    this.ctx = this.canvas.getContext('2d');
    this.registry = registry;
    
    // Rendering options
    this.options = {
      showGrid: true,
      gridSize: 10,
      majorGridSize: 100,
      showPointLabels: true,
      showLineLabels: false,
      showCircleLabels: false,
      showTriangleLabels: false,
      showPlaneLabels: false,
      viewLineAngleAsHue: true,
      backgroundColor: '#222',
      gridColor: 'rgba(128, 256, 256, 0.1)',
      majorGridColor: 'rgba(128, 256, 256, 0.3)',
      verticalGridColor: 'rgba(256, 128, 128, 0.2)',
      majorVerticalGridColor: 'rgba(256, 128, 128, 0.5)'
    };
    
    // Bind event handlers
    this.handleElementAdded = this.handleElementAdded.bind(this);
    this.handleElementRemoved = this.handleElementRemoved.bind(this);
    this.handleElementUpdated = this.handleElementUpdated.bind(this);
    this.handleHighlightChanged = this.handleHighlightChanged.bind(this);
    
    // Set up event listeners
    this.registry.on('element-added', this.handleElementAdded);
    this.registry.on('element-removed', this.handleElementRemoved);
    
    // Flag to indicate if rendering is needed
    this.dirty = true;
    
    // Start animation loop
    this.animationFrameId = null;
    this.startAnimationLoop();
  }

  /**
   * Handle element added event
   * @param {Object} element - The added element
   */
  handleElementAdded(element) {
    element.on('updated', this.handleElementUpdated);
    element.on('highlight-changed', this.handleHighlightChanged);
    this.dirty = true;
  }

  /**
   * Handle element removed event
   * @param {Object} element - The removed element
   */
  handleElementRemoved(element) {
    element.off('updated', this.handleElementUpdated);
    element.off('highlight-changed', this.handleHighlightChanged);
    this.dirty = true;
  }

  /**
   * Handle element updated event
   */
  handleElementUpdated() {
    this.dirty = true;
  }

  /**
   * Handle highlight changed event
   */
  handleHighlightChanged() {
    this.dirty = true;
  }

  /**
   * Start the animation loop
   */
  startAnimationLoop() {
    const loop = () => {
      if (this.dirty) {
        this.render();
        this.dirty = false;
      }
      
      this.animationFrameId = window.requestAnimationFrame(loop);
    };
    
    this.animationFrameId = window.requestAnimationFrame(loop);
  }

  /**
   * Stop the animation loop
   */
  stopAnimationLoop() {
    if (this.animationFrameId) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Render all elements
   */
  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw background
    this.ctx.fillStyle = this.options.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grid
    if (this.options.showGrid) {
      this.drawGrid();
    }
    
    // Get all elements from registry
    const elements = this.registry.getAllElements();
    
    // Sort elements by type for proper rendering order
    const points = elements.filter(e => e instanceof Point);
    const lines = elements.filter(e => e instanceof Line);
    const circles = elements.filter(e => e instanceof Circle);
    const triangles = elements.filter(e => e instanceof Triangle);
    const planes = elements.filter(e => e instanceof Plane);
    
    // Draw elements in order: triangles, circles, planes, lines, points
    triangles.forEach(triangle => this.drawTriangle(triangle));
    circles.forEach(circle => this.drawCircle(circle));
    planes.forEach(plane => this.drawPlane(plane));
    lines.forEach(line => this.drawLine(line));
    points.forEach(point => this.drawPoint(point));
    
    // Emit render event
    this.emit('render');
  }

  /**
   * Draw the grid
   */
  drawGrid() {
    const { width, height } = this.canvas;
    const { gridSize, majorGridSize } = this.options;
    
    this.ctx.lineWidth = 0.5;
    
    // Draw vertical grid lines
    for (let x = 0; x < width; x += gridSize) {
      this.ctx.strokeStyle = x % majorGridSize === 0 ? this.options.majorGridColor : this.options.gridColor;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }
    
    // Draw horizontal grid lines
    for (let y = 0; y < height; y += gridSize) {
      this.ctx.strokeStyle = y % majorGridSize === 0 ? this.options.majorVerticalGridColor : this.options.verticalGridColor;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }
  }

  /**
   * Draw a point
   * @param {Point} point - The point to draw
   */
  drawPoint(point) {
    if (!point.isVisible()) {
      return;
    }
    
    const { x, y } = point;
    const radius = point.getProperty('radius', 5);
    const hue = point.getProperty('hue', 180);
    const isHighlighted = point.isHighlighted();
    
    // Draw point
    this.ctx.fillStyle = `hsla(${hue}, 100%, 50%, 1.0)`;
    this.ctx.beginPath();
    this.ctx.arc(x, y, isHighlighted ? radius * 2 : radius, 0, 2 * Math.PI);
    this.ctx.fill();
    
    // Draw label
    if (this.options.showPointLabels && point.id) {
      this.ctx.font = '16px serif';
      this.ctx.fillStyle = `hsla(${(hue + 180) % 360}, 100%, 50%, 1.0)`;
      this.ctx.fillText(point.id, x - radius / 2, y + radius / 2);
    }
  }

  /**
   * Draw a line
   * @param {Line} line - The line to draw
   */
  drawLine(line) {
    if (!line.isVisible() || !line.start || !line.end) {
      return;
    }
    
    const { start, end } = line;
    let hue = line.getProperty('hue', 180);
    const width = line.getProperty('width', 1);
    const isHighlighted = line.isHighlighted();
    
    // Optionally set hue based on line angle
    if (this.options.viewLineAngleAsHue) {
      const angle = line.getAngle();
      hue = ((angle * 180 / Math.PI) + 360) % 360;
    }
    
    // Draw line
    this.ctx.strokeStyle = `hsla(${hue}, 100%, 50%, 1.0)`;
    this.ctx.lineWidth = isHighlighted ? width * 3 : width;
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.stroke();
    
    // Draw label
    if (this.options.showLineLabels && line.id) {
      const midpoint = line.getMidpoint();
      this.ctx.font = '14px serif';
      this.ctx.fillStyle = `hsla(${(hue + 180) % 360}, 100%, 50%, 1.0)`;
      this.ctx.fillText(line.id, midpoint.x, midpoint.y - 5);
    }
  }

  /**
   * Draw a circle
   * @param {Circle} circle - The circle to draw
   */
  drawCircle(circle) {
    if (!circle.isVisible() || !circle.center) {
      return;
    }
    
    const { center } = circle;
    const radius = circle.getRadius();
    const hue = circle.getProperty('hue', 180);
    const fillOpacity = circle.getProperty('fillOpacity', 0.2);
    const strokeWidth = circle.getProperty('strokeWidth', 1);
    const isHighlighted = circle.isHighlighted();
    
    // Draw circle
    this.ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${isHighlighted ? fillOpacity * 2 : fillOpacity})`;
    this.ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${isHighlighted ? 0.8 : 0.4})`;
    this.ctx.lineWidth = isHighlighted ? strokeWidth * 2 : strokeWidth;
    
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.stroke();
    
    // Draw label
    if (this.options.showCircleLabels && circle.id) {
      this.ctx.font = '14px serif';
      this.ctx.fillStyle = `hsla(${(hue + 180) % 360}, 100%, 50%, 1.0)`;
      this.ctx.fillText(circle.id, center.x - radius / 2, center.y - radius / 2);
    }
  }

  /**
   * Draw a triangle
   * @param {Triangle} triangle - The triangle to draw
   */
  drawTriangle(triangle) {
    if (!triangle.isVisible() || !triangle.a || !triangle.b || !triangle.c) {
      return;
    }
    
    const { a, b, c } = triangle;
    const hue = triangle.getProperty('hue', 180);
    const fillOpacity = triangle.getProperty('fillOpacity', 0.1);
    const strokeWidth = triangle.getProperty('strokeWidth', 1);
    const isHighlighted = triangle.isHighlighted();
    
    // Draw triangle
    this.ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${isHighlighted ? fillOpacity * 2 : fillOpacity})`;
    this.ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${isHighlighted ? 0.8 : 0.4})`;
    this.ctx.lineWidth = isHighlighted ? strokeWidth * 2 : strokeWidth;
    
    this.ctx.beginPath();
    this.ctx.moveTo(a.x, a.y);
    this.ctx.lineTo(b.x, b.y);
    this.ctx.lineTo(c.x, c.y);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    // Draw label
    if (this.options.showTriangleLabels && triangle.id) {
      const centroid = triangle.getCentroid();
      this.ctx.font = '14px serif';
      this.ctx.fillStyle = `hsla(${(hue + 180) % 360}, 100%, 50%, 1.0)`;
      this.ctx.fillText(triangle.id, centroid.x, centroid.y);
    }
  }

  /**
   * Draw a plane
   * @param {Plane} plane - The plane to draw
   */
  drawPlane(plane) {
    if (!plane.isVisible()) {
      return;
    }
    
    const start = plane.getStartCoordinates();
    const end = plane.getEndCoordinates();
    const hue = plane.getProperty('hue', 180);
    const width = plane.getProperty('width', 1);
    const isHighlighted = plane.isHighlighted();
    
    // Draw plane (as a line)
    this.ctx.strokeStyle = `hsla(${hue}, 100%, 50%, 1.0)`;
    this.ctx.lineWidth = isHighlighted ? width * 3 : width;
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.stroke();
    
    // Draw label
    if (this.options.showPlaneLabels && plane.id) {
      const midpoint = plane.getMidpoint();
      this.ctx.font = '14px serif';
      this.ctx.fillStyle = `hsla(${(hue + 180) % 360}, 100%, 50%, 1.0)`;
      this.ctx.fillText(plane.id, midpoint.x, midpoint.y - 5);
    }
  }

  /**
   * Resize the canvas to match its container
   * @param {boolean} [maintainAspectRatio=false] - Whether to maintain the aspect ratio
   */
  resize(maintainAspectRatio = false) {
    const container = this.canvas.parentElement;
    
    if (!container) {
      return;
    }
    
    const { width, height } = container.getBoundingClientRect();
    
    if (maintainAspectRatio) {
      const aspectRatio = this.canvas.width / this.canvas.height;
      
      if (width / height > aspectRatio) {
        this.canvas.height = height;
        this.canvas.width = height * aspectRatio;
      } else {
        this.canvas.width = width;
        this.canvas.height = width / aspectRatio;
      }
    } else {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    
    this.canvas.style.width = `${this.canvas.width}px`;
    this.canvas.style.height = `${this.canvas.height}px`;
    
    this.dirty = true;
  }

  /**
   * Set a rendering option
   * @param {string} option - The option name
   * @param {any} value - The option value
   * @returns {CanvasRenderer} - This renderer for chaining
   */
  setOption(option, value) {
    if (this.options.hasOwnProperty(option)) {
      this.options[option] = value;
      this.dirty = true;
    }
    
    return this;
  }

  /**
   * Get a rendering option
   * @param {string} option - The option name
   * @returns {any} - The option value
   */
  getOption(option) {
    return this.options[option];
  }

  /**
   * Clean up the renderer
   */
  dispose() {
    // Stop animation loop
    this.stopAnimationLoop();
    
    // Remove event listeners
    this.registry.off('element-added', this.handleElementAdded);
    this.registry.off('element-removed', this.handleElementRemoved);
    
    // Remove element event listeners
    const elements = this.registry.getAllElements();
    
    for (const element of elements) {
      element.off('updated', this.handleElementUpdated);
      element.off('highlight-changed', this.handleHighlightChanged);
    }
  }
}
