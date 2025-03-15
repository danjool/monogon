/**
 * HighlightManager - Manages highlighting between text and canvas elements
 */
import { EventEmitter } from '../core/EventEmitter.js';

export class HighlightManager extends EventEmitter {
  /**
   * Create a new highlight manager
   * @param {Object} registry - Element registry
   */
  constructor(registry) {
    super();
    
    this.registry = registry;
    
    // Map of element ID to array of DOM elements
    this._highlightables = new Map();
    
    // Currently highlighted elements
    this._highlightedElements = new Set();
    
    // Bind event handlers
    this.handleElementAdded = this.handleElementAdded.bind(this);
    this.handleElementRemoved = this.handleElementRemoved.bind(this);
    this.handleHighlightChanged = this.handleHighlightChanged.bind(this);
    
    // Set up event listeners
    this.registry.on('element-added', this.handleElementAdded);
    this.registry.on('element-removed', this.handleElementRemoved);
  }

  /**
   * Handle element added event
   * @param {Object} element - The added element
   */
  handleElementAdded(element) {
    element.on('highlight-changed', this.handleHighlightChanged);
  }

  /**
   * Handle element removed event
   * @param {Object} element - The removed element
   */
  handleElementRemoved(element) {
    element.off('highlight-changed', this.handleHighlightChanged);
    
    // Remove from highlighted elements
    this._highlightedElements.delete(element.id);
    
    // Remove from highlightables
    this._highlightables.delete(element.id);
  }

  /**
   * Handle highlight changed event
   * @param {Object} element - The element whose highlight state changed
   */
  handleHighlightChanged(element) {
    this.updateHighlights(element);
  }

  /**
   * Register a DOM element to be highlighted when a geometric element is highlighted
   * @param {string} elementId - The ID of the geometric element
   * @param {HTMLElement} domElement - The DOM element to highlight
   * @returns {HighlightManager} - This manager for chaining
   */
  registerHighlightable(elementId, domElement) {
    if (!this._highlightables.has(elementId)) {
      this._highlightables.set(elementId, []);
    }
    
    this._highlightables.get(elementId).push(domElement);
    
    // If the element is already highlighted, highlight the DOM element
    const element = this.registry.getElementById(elementId);
    
    if (element && element.isHighlighted()) {
      this.highlightDomElement(domElement, true);
    }
    
    return this;
  }

  /**
   * Unregister a DOM element
   * @param {string} elementId - The ID of the geometric element
   * @param {HTMLElement} domElement - The DOM element to unregister
   * @returns {HighlightManager} - This manager for chaining
   */
  unregisterHighlightable(elementId, domElement) {
    if (!this._highlightables.has(elementId)) {
      return this;
    }
    
    const domElements = this._highlightables.get(elementId);
    const index = domElements.indexOf(domElement);
    
    if (index !== -1) {
      domElements.splice(index, 1);
      
      // Clean up empty arrays
      if (domElements.length === 0) {
        this._highlightables.delete(elementId);
      }
      
      // Remove highlight from DOM element
      this.highlightDomElement(domElement, false);
    }
    
    return this;
  }

  /**
   * Get all highlightable DOM elements for a geometric element
   * @param {string} elementId - The ID of the geometric element
   * @returns {Array} - Array of DOM elements
   */
  getHighlightables(elementId) {
    return this._highlightables.get(elementId) || [];
  }

  /**
   * Update highlights for a geometric element
   * @param {Object} element - The geometric element
   * @returns {HighlightManager} - This manager for chaining
   */
  updateHighlights(element) {
    if (!element || !element.id) {
      return this;
    }
    
    const isHighlighted = element.isHighlighted();
    const domElements = this.getHighlightables(element.id);
    
    // Update DOM elements
    for (const domElement of domElements) {
      this.highlightDomElement(domElement, isHighlighted);
    }
    
    // Update highlighted elements set
    if (isHighlighted) {
      this._highlightedElements.add(element.id);
    } else {
      this._highlightedElements.delete(element.id);
    }
    
    // Emit event
    this.emit('highlights-updated', {
      elementId: element.id,
      isHighlighted,
      domElements
    });
    
    return this;
  }

  /**
   * Highlight or unhighlight a DOM element
   * @param {HTMLElement} domElement - The DOM element
   * @param {boolean} highlight - Whether to highlight or unhighlight
   */
  highlightDomElement(domElement, highlight) {
    if (!domElement) {
      return;
    }
    
    if (highlight) {
      domElement.classList.add('highlight');
      domElement.style.textShadow = '0px 0px 5px red';
    } else {
      domElement.classList.remove('highlight');
      domElement.style.textShadow = '';
    }
  }

  /**
   * Highlight a geometric element by ID
   * @param {string} elementId - The ID of the geometric element
   * @param {boolean} [highlight=true] - Whether to highlight or unhighlight
   * @returns {HighlightManager} - This manager for chaining
   */
  highlightElement(elementId, highlight = true) {
    const element = this.registry.getElementById(elementId);
    
    if (element) {
      element.setHighlighted(highlight);
    }
    
    return this;
  }

  /**
   * Unhighlight a geometric element by ID
   * @param {string} elementId - The ID of the geometric element
   * @returns {HighlightManager} - This manager for chaining
   */
  unhighlightElement(elementId) {
    return this.highlightElement(elementId, false);
  }

  /**
   * Highlight multiple geometric elements by ID
   * @param {Array<string>} elementIds - Array of element IDs
   * @param {boolean} [highlight=true] - Whether to highlight or unhighlight
   * @returns {HighlightManager} - This manager for chaining
   */
  highlightElements(elementIds, highlight = true) {
    for (const elementId of elementIds) {
      this.highlightElement(elementId, highlight);
    }
    
    return this;
  }

  /**
   * Unhighlight multiple geometric elements by ID
   * @param {Array<string>} elementIds - Array of element IDs
   * @returns {HighlightManager} - This manager for chaining
   */
  unhighlightElements(elementIds) {
    return this.highlightElements(elementIds, false);
  }

  /**
   * Unhighlight all elements
   * @returns {HighlightManager} - This manager for chaining
   */
  unhighlightAll() {
    const highlightedIds = Array.from(this._highlightedElements);
    
    for (const elementId of highlightedIds) {
      this.unhighlightElement(elementId);
    }
    
    return this;
  }

  /**
   * Get all currently highlighted element IDs
   * @returns {Array<string>} - Array of element IDs
   */
  getHighlightedElements() {
    return Array.from(this._highlightedElements);
  }

  /**
   * Check if an element is highlighted
   * @param {string} elementId - The ID of the geometric element
   * @returns {boolean} - Whether the element is highlighted
   */
  isElementHighlighted(elementId) {
    return this._highlightedElements.has(elementId);
  }

  /**
   * Set up bidirectional highlighting between text spans and geometric elements
   * @param {string} selector - CSS selector for text spans
   * @returns {HighlightManager} - This manager for chaining
   */
  setupBidirectionalHighlighting(selector = 'span[class]') {
    const spans = document.querySelectorAll(selector);
    
    for (const span of spans) {
      const classes = Array.from(span.classList);
      
      for (const className of classes) {
        const element = this.registry.getElementById(className);
        
        if (element) {
          // Register the span for highlighting
          this.registerHighlightable(className, span);
          
          // Add mouse events to the span
          span.addEventListener('mouseover', () => {
            this.highlightElement(className, true);
          });
          
          span.addEventListener('mouseout', () => {
            this.highlightElement(className, false);
          });
        }
      }
    }
    
    return this;
  }

  /**
   * Clean up the highlight manager
   */
  dispose() {
    // Remove event listeners
    this.registry.off('element-added', this.handleElementAdded);
    this.registry.off('element-removed', this.handleElementRemoved);
    
    // Remove element event listeners
    const elements = this.registry.getAllElements();
    
    for (const element of elements) {
      element.off('highlight-changed', this.handleHighlightChanged);
    }
    
    // Clear all highlights
    this.unhighlightAll();
    
    // Clear collections
    this._highlightables.clear();
    this._highlightedElements.clear();
  }
}
