/**
 * Renderer - Main rendering controller
 */
import { EventEmitter } from '../core/EventEmitter.js';
import { CanvasRenderer } from './CanvasRenderer.js';
import { HighlightManager } from './HighlightManager.js';

export class Renderer extends EventEmitter {
  /**
   * Create a new renderer
   * @param {string|HTMLCanvasElement} canvas - Canvas element or ID
   * @param {Object} registry - Element registry
   */
  constructor(canvas, registry) {
    super();
    
    this.registry = registry;
    this.canvasRenderer = new CanvasRenderer(canvas, registry);
    this.highlightManager = new HighlightManager(registry);
    
    // Bind event handlers
    this.handleElementAdded = this.handleElementAdded.bind(this);
    this.handleElementRemoved = this.handleElementRemoved.bind(this);
    this.handleCanvasRender = this.handleCanvasRender.bind(this);
    this.handleHighlightsUpdated = this.handleHighlightsUpdated.bind(this);
    
    // Set up event listeners
    this.registry.on('element-added', this.handleElementAdded);
    this.registry.on('element-removed', this.handleElementRemoved);
    this.canvasRenderer.on('render', this.handleCanvasRender);
    this.highlightManager.on('highlights-updated', this.handleHighlightsUpdated);
    
    // Set up window resize handler
    this.handleWindowResize = this.handleWindowResize.bind(this);
    window.addEventListener('resize', this.handleWindowResize);
    
    // Initial resize
    this.canvasRenderer.resize();
  }

  /**
   * Handle element added event
   * @param {Object} element - The added element
   */
  handleElementAdded(element) {
    // Forward to child components if needed
    this.emit('element-added', element);
  }

  /**
   * Handle element removed event
   * @param {Object} element - The removed element
   */
  handleElementRemoved(element) {
    // Forward to child components if needed
    this.emit('element-removed', element);
  }

  /**
   * Handle canvas render event
   */
  handleCanvasRender() {
    // Forward to listeners
    this.emit('render');
  }

  /**
   * Handle highlights updated event
   * @param {Object} data - Highlight update data
   */
  handleHighlightsUpdated(data) {
    // Forward to listeners
    this.emit('highlights-updated', data);
  }

  /**
   * Handle window resize event
   */
  handleWindowResize() {
    this.canvasRenderer.resize();
  }

  /**
   * Render the scene
   */
  render() {
    this.canvasRenderer.render();
  }

  /**
   * Set up bidirectional highlighting
   * @param {string} selector - CSS selector for text spans
   * @returns {Renderer} - This renderer for chaining
   */
  setupBidirectionalHighlighting(selector) {
    this.highlightManager.setupBidirectionalHighlighting(selector);
    return this;
  }

  /**
   * Set a rendering option
   * @param {string} option - The option name
   * @param {any} value - The option value
   * @returns {Renderer} - This renderer for chaining
   */
  setOption(option, value) {
    this.canvasRenderer.setOption(option, value);
    return this;
  }

  /**
   * Get a rendering option
   * @param {string} option - The option name
   * @returns {any} - The option value
   */
  getOption(option) {
    return this.canvasRenderer.getOption(option);
  }

  /**
   * Highlight an element
   * @param {string} elementId - The element ID
   * @param {boolean} [highlight=true] - Whether to highlight or unhighlight
   * @returns {Renderer} - This renderer for chaining
   */
  highlightElement(elementId, highlight = true) {
    this.highlightManager.highlightElement(elementId, highlight);
    return this;
  }

  /**
   * Unhighlight an element
   * @param {string} elementId - The element ID
   * @returns {Renderer} - This renderer for chaining
   */
  unhighlightElement(elementId) {
    this.highlightManager.unhighlightElement(elementId);
    return this;
  }

  /**
   * Highlight multiple elements
   * @param {Array<string>} elementIds - Array of element IDs
   * @param {boolean} [highlight=true] - Whether to highlight or unhighlight
   * @returns {Renderer} - This renderer for chaining
   */
  highlightElements(elementIds, highlight = true) {
    this.highlightManager.highlightElements(elementIds, highlight);
    return this;
  }

  /**
   * Unhighlight multiple elements
   * @param {Array<string>} elementIds - Array of element IDs
   * @returns {Renderer} - This renderer for chaining
   */
  unhighlightElements(elementIds) {
    this.highlightManager.unhighlightElements(elementIds);
    return this;
  }

  /**
   * Unhighlight all elements
   * @returns {Renderer} - This renderer for chaining
   */
  unhighlightAll() {
    this.highlightManager.unhighlightAll();
    return this;
  }

  /**
   * Register a DOM element to be highlighted when a geometric element is highlighted
   * @param {string} elementId - The ID of the geometric element
   * @param {HTMLElement} domElement - The DOM element to highlight
   * @returns {Renderer} - This renderer for chaining
   */
  registerHighlightable(elementId, domElement) {
    this.highlightManager.registerHighlightable(elementId, domElement);
    return this;
  }

  /**
   * Unregister a DOM element
   * @param {string} elementId - The ID of the geometric element
   * @param {HTMLElement} domElement - The DOM element to unregister
   * @returns {Renderer} - This renderer for chaining
   */
  unregisterHighlightable(elementId, domElement) {
    this.highlightManager.unregisterHighlightable(elementId, domElement);
    return this;
  }

  /**
   * Get the canvas element
   * @returns {HTMLCanvasElement} - The canvas element
   */
  getCanvas() {
    return this.canvasRenderer.canvas;
  }

  /**
   * Get the canvas context
   * @returns {CanvasRenderingContext2D} - The canvas context
   */
  getContext() {
    return this.canvasRenderer.ctx;
  }

  /**
   * Clean up the renderer
   */
  dispose() {
    // Remove event listeners
    this.registry.off('element-added', this.handleElementAdded);
    this.registry.off('element-removed', this.handleElementRemoved);
    this.canvasRenderer.off('render', this.handleCanvasRender);
    this.highlightManager.off('highlights-updated', this.handleHighlightsUpdated);
    
    // Remove window resize handler
    window.removeEventListener('resize', this.handleWindowResize);
    
    // Dispose child components
    this.canvasRenderer.dispose();
    this.highlightManager.dispose();
  }
}
