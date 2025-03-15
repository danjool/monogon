/**
 * GeometricElement - Base class for all geometric elements
 * Provides common functionality for all elements in the system
 */
import { EventEmitter } from '../core/EventEmitter.js';

export class GeometricElement extends EventEmitter {
  /**
   * Create a new geometric element
   * @param {string} id - Unique identifier for the element
   * @param {Object} properties - Additional properties for the element
   */
  constructor(id, properties = {}) {
    super();
    
    if (!id) {
      throw new Error('GeometricElement requires an id');
    }
    
    this.id = id;
    
    // Default properties
    this.properties = {
      highlighted: false,
      hue: 180,
      visible: true,
      ...properties
    };
    
    // Constraints applied to this element
    this.constraints = [];
    
    // Elements this element depends on
    this.dependencies = [];
    
    // Elements that depend on this element
    this.dependents = [];
    
    // Flag to prevent infinite update loops
    this._updating = false;
  }

  /**
   * Add a constraint to this element
   * @param {Object} constraint - The constraint to add
   * @returns {GeometricElement} - This element for chaining
   */
  addConstraint(constraint) {
    if (!this.constraints.includes(constraint)) {
      this.constraints.push(constraint);
      this.emit('constraint-added', constraint);
    }
    return this;
  }

  /**
   * Remove a constraint from this element
   * @param {Object} constraint - The constraint to remove
   * @returns {GeometricElement} - This element for chaining
   */
  removeConstraint(constraint) {
    const index = this.constraints.indexOf(constraint);
    if (index !== -1) {
      this.constraints.splice(index, 1);
      this.emit('constraint-removed', constraint);
    }
    return this;
  }

  /**
   * Add a dependency to this element
   * @param {GeometricElement} element - The element this element depends on
   * @returns {GeometricElement} - This element for chaining
   */
  addDependency(element) {
    if (!element) {
      throw new Error('Cannot add null dependency');
    }
    
    if (!(element instanceof GeometricElement)) {
      throw new Error('Dependencies must be GeometricElements');
    }
    
    if (!this.dependencies.includes(element)) {
      this.dependencies.push(element);
      element.addDependent(this);
      this.emit('dependency-added', element);
    }
    
    return this;
  }

  /**
   * Add a dependent to this element
   * @param {GeometricElement} element - The element that depends on this element
   * @returns {GeometricElement} - This element for chaining
   */
  addDependent(element) {
    if (!element) {
      throw new Error('Cannot add null dependent');
    }
    
    if (!(element instanceof GeometricElement)) {
      throw new Error('Dependents must be GeometricElements');
    }
    
    if (!this.dependents.includes(element)) {
      this.dependents.push(element);
      this.emit('dependent-added', element);
    }
    
    return this;
  }

  /**
   * Remove a dependency from this element
   * @param {GeometricElement} element - The element to remove as a dependency
   * @returns {GeometricElement} - This element for chaining
   */
  removeDependency(element) {
    const index = this.dependencies.indexOf(element);
    if (index !== -1) {
      this.dependencies.splice(index, 1);
      element.removeDependent(this);
      this.emit('dependency-removed', element);
    }
    return this;
  }

  /**
   * Remove a dependent from this element
   * @param {GeometricElement} element - The element to remove as a dependent
   * @returns {GeometricElement} - This element for chaining
   */
  removeDependent(element) {
    const index = this.dependents.indexOf(element);
    if (index !== -1) {
      this.dependents.splice(index, 1);
      this.emit('dependent-removed', element);
    }
    return this;
  }

  /**
   * Update this element and its dependents
   * @returns {GeometricElement} - This element for chaining
   */
  update() {
    // Prevent infinite loops
    if (this._updating) {
      return this;
    }
    
    this._updating = true;
    
    try {
      // Apply constraints in priority order
      const sortedConstraints = [...this.constraints].sort(
        (a, b) => (b.priority || 1) - (a.priority || 1)
      );
      
      for (const constraint of sortedConstraints) {
        constraint.apply();
      }
      
      // Notify that this element has been updated
      this.emit('updated', this);
      
      // Update dependents
      for (const dependent of this.dependents) {
        dependent.update();
      }
    } finally {
      this._updating = false;
    }
    
    return this;
  }

  /**
   * Set the highlighted state of this element
   * @param {boolean} highlighted - Whether the element should be highlighted
   * @returns {GeometricElement} - This element for chaining
   */
  setHighlighted(highlighted) {
    if (this.properties.highlighted !== highlighted) {
      this.properties.highlighted = highlighted;
      this.emit('highlight-changed', this);
    }
    return this;
  }

  /**
   * Set a property value
   * @param {string} name - The property name
   * @param {any} value - The property value
   * @returns {GeometricElement} - This element for chaining
   */
  setProperty(name, value) {
    const oldValue = this.properties[name];
    
    if (oldValue !== value) {
      this.properties[name] = value;
      this.emit('property-changed', { name, oldValue, newValue: value });
      
      // Special handling for visibility changes
      if (name === 'visible') {
        this.emit('visibility-changed', value);
      }
    }
    
    return this;
  }

  /**
   * Get a property value
   * @param {string} name - The property name
   * @param {any} defaultValue - Default value if property doesn't exist
   * @returns {any} - The property value
   */
  getProperty(name, defaultValue) {
    return this.properties.hasOwnProperty(name) 
      ? this.properties[name] 
      : defaultValue;
  }

  /**
   * Check if this element is visible
   * @returns {boolean} - Whether the element is visible
   */
  isVisible() {
    return this.properties.visible;
  }

  /**
   * Check if this element is highlighted
   * @returns {boolean} - Whether the element is highlighted
   */
  isHighlighted() {
    return this.properties.highlighted;
  }

  /**
   * Clone this element
   * @param {string} [newId] - Optional new ID for the cloned element
   * @returns {GeometricElement} - The cloned element
   */
  clone(newId) {
    const id = newId || `${this.id}_clone`;
    const clone = new this.constructor(id, { ...this.properties });
    
    // Clone doesn't copy dependencies or dependents
    // Those need to be set up separately if needed
    
    return clone;
  }

  /**
   * Convert to a simple object for serialization
   * @returns {Object} - Simple object representation
   */
  toObject() {
    return {
      id: this.id,
      type: this.constructor.name,
      properties: { ...this.properties }
    };
  }
}
