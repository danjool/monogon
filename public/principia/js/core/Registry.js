/**
 * Registry - Manages all geometric elements and their relationships
 * Provides a central place to register, retrieve, and manage elements
 */
import { EventEmitter } from './EventEmitter.js';
import { Point } from '../geometry/Point.js';
import { Line } from '../geometry/Line.js';
import { Circle } from '../geometry/Circle.js';
import { Triangle } from '../geometry/Triangle.js';
import { Plane } from '../geometry/Plane.js';

export class Registry extends EventEmitter {
  constructor() {
    super();
    
    // Main storage for all elements
    this._elements = new Map();
    
    // Index by type for faster lookups
    this._elementsByType = new Map();
    
    // Storage for highlightable DOM elements
    this._highlightables = new Map();
  }

  /**
   * Add an element to the registry
   * @param {Object} element - The element to add
   * @returns {Object} - The added element
   */
  addElement(element) {
    if (!element || !element.id) {
      throw new Error('Element must have an id property');
    }
    
    if (this._elements.has(element.id)) {
      throw new Error(`Element with id ${element.id} already exists`);
    }
    
    // Store the element
    this._elements.set(element.id, element);
    
    // Add to type index
    const type = element.constructor.name;
    if (!this._elementsByType.has(type)) {
      this._elementsByType.set(type, new Set());
    }
    this._elementsByType.get(type).add(element);
    
    // Emit event
    this.emit('element-added', element);
    
    return element;
  }

  /**
   * Remove an element from the registry
   * @param {string} id - The element id
   * @returns {boolean} - Whether the element was removed
   */
  removeElement(id) {
    const element = this._elements.get(id);
    
    if (!element) {
      return false;
    }
    
    // Remove from main storage
    this._elements.delete(id);
    
    // Remove from type index
    const type = element.constructor.name;
    if (this._elementsByType.has(type)) {
      this._elementsByType.get(type).delete(element);
      
      // Clean up empty sets
      if (this._elementsByType.get(type).size === 0) {
        this._elementsByType.delete(type);
      }
    }
    
    // Emit event
    this.emit('element-removed', element);
    
    return true;
  }

  /**
   * Get an element by id
   * @param {string} id - The element id
   * @returns {Object|undefined} - The element or undefined if not found
   */
  getElementById(id) {
    return this._elements.get(id);
  }

  /**
   * Get all elements of a specific type
   * @param {string} type - The element type (class name)
   * @returns {Array} - Array of elements
   */
  getElementsByType(type) {
    if (!this._elementsByType.has(type)) {
      return [];
    }
    
    return Array.from(this._elementsByType.get(type));
  }

  /**
   * Get all elements
   * @returns {Array} - Array of all elements
   */
  getAllElements() {
    return Array.from(this._elements.values());
  }

  /**
   * Register a DOM element that should be highlighted when an element is highlighted
   * @param {string} elementId - The id of the geometric element
   * @param {HTMLElement} domElement - The DOM element to highlight
   */
  registerHighlightable(elementId, domElement) {
    if (!this._highlightables.has(elementId)) {
      this._highlightables.set(elementId, []);
    }
    
    this._highlightables.get(elementId).push(domElement);
  }

  /**
   * Get all highlightable DOM elements for a geometric element
   * @param {string} elementId - The id of the geometric element
   * @returns {Array} - Array of DOM elements
   */
  getHighlightables(elementId) {
    return this._highlightables.get(elementId) || [];
  }

  /**
   * Create a point
   * @param {string} id - The point ID
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Object} [properties] - Additional properties
   * @returns {Point} - The created point
   */
  createPoint(id, x, y, properties = {}) {
    const point = new Point(id, x, y, properties);
    return this.addElement(point);
  }

  /**
   * Create a line
   * @param {string} id - The line ID
   * @param {Point|Object} start - Start point or {x, y} coordinates
   * @param {Point|Object} end - End point or {x, y} coordinates
   * @param {Object} [properties] - Additional properties
   * @returns {Line} - The created line
   */
  createLine(id, start, end, properties = {}) {
    const line = new Line(id, start, end, properties);
    return this.addElement(line);
  }

  /**
   * Create a circle
   * @param {string} id - The circle ID
   * @param {Point|Object} center - Center point or {x, y} coordinates
   * @param {Point|Object|number} radiusOrPoint - Radius value or point on the circle
   * @param {Object} [properties] - Additional properties
   * @returns {Circle} - The created circle
   */
  createCircle(id, center, radiusOrPoint, properties = {}) {
    const circle = new Circle(id, center, radiusOrPoint, properties);
    return this.addElement(circle);
  }

  /**
   * Create a triangle
   * @param {string} id - The triangle ID
   * @param {Point|Object} a - First vertex or {x, y} coordinates
   * @param {Point|Object} b - Second vertex or {x, y} coordinates
   * @param {Point|Object} c - Third vertex or {x, y} coordinates
   * @param {Object} [properties] - Additional properties
   * @returns {Triangle} - The created triangle
   */
  createTriangle(id, a, b, c, properties = {}) {
    const triangle = new Triangle(id, a, b, c, properties);
    return this.addElement(triangle);
  }

  /**
   * Create a plane
   * @param {string} id - The plane ID
   * @param {Point|Object} start - Start point or {x, y} coordinates
   * @param {Point|Object} end - End point or {x, y} coordinates
   * @param {Object} [properties] - Additional properties
   * @returns {Plane} - The created plane
   */
  createPlane(id, start, end, properties = {}) {
    const plane = new Plane(id, start, end, properties);
    return this.addElement(plane);
  }

  /**
   * Clear all elements from the registry
   */
  clear() {
    // Store elements for event
    const elements = this.getAllElements();
    
    // Clear all collections
    this._elements.clear();
    this._elementsByType.clear();
    this._highlightables.clear();
    
    // Emit events for each removed element
    for (const element of elements) {
      this.emit('element-removed', element);
    }
    
    // Emit a general clear event
    this.emit('registry-cleared');
  }
}
