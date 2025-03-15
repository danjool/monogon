/**
 * Constraint - Base class for all geometric constraints
 * Constraints define relationships between geometric elements
 */
export class Constraint {
  /**
   * Create a new constraint
   * @param {number} [priority=1] - Priority of the constraint (higher values are applied first)
   */
  constructor(priority = 1) {
    this.priority = priority;
    this.enabled = true;
    this.elements = [];
  }

  /**
   * Apply the constraint to the elements
   * This method should be overridden by subclasses
   */
  apply() {
    throw new Error('Method not implemented: Constraint.apply()');
  }

  /**
   * Enable the constraint
   * @returns {Constraint} - This constraint for chaining
   */
  enable() {
    this.enabled = true;
    return this;
  }

  /**
   * Disable the constraint
   * @returns {Constraint} - This constraint for chaining
   */
  disable() {
    this.enabled = false;
    return this;
  }

  /**
   * Check if the constraint is enabled
   * @returns {boolean} - Whether the constraint is enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Set the priority of the constraint
   * @param {number} priority - The new priority
   * @returns {Constraint} - This constraint for chaining
   */
  setPriority(priority) {
    this.priority = priority;
    return this;
  }

  /**
   * Get the priority of the constraint
   * @returns {number} - The priority
   */
  getPriority() {
    return this.priority;
  }

  /**
   * Add an element to the constraint
   * @param {Object} element - The element to add
   * @returns {Constraint} - This constraint for chaining
   */
  addElement(element) {
    if (!this.elements.includes(element)) {
      this.elements.push(element);
    }
    return this;
  }

  /**
   * Remove an element from the constraint
   * @param {Object} element - The element to remove
   * @returns {Constraint} - This constraint for chaining
   */
  removeElement(element) {
    const index = this.elements.indexOf(element);
    if (index !== -1) {
      this.elements.splice(index, 1);
    }
    return this;
  }

  /**
   * Get all elements affected by this constraint
   * @returns {Array} - Array of elements
   */
  getElements() {
    return [...this.elements];
  }

  /**
   * Check if the constraint is valid
   * @returns {boolean} - Whether the constraint is valid
   */
  isValid() {
    return this.elements.length > 0 && this.elements.every(element => element !== null);
  }

  /**
   * Get a string representation of the constraint
   * @returns {string} - String representation
   */
  toString() {
    return `${this.constructor.name} (priority: ${this.priority}, enabled: ${this.enabled})`;
  }

  /**
   * Convert to a simple object for serialization
   * @returns {Object} - Simple object representation
   */
  toObject() {
    return {
      type: this.constructor.name,
      priority: this.priority,
      enabled: this.enabled,
      elements: this.elements.map(element => element.id || element)
    };
  }
}
