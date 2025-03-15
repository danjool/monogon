/**
 * DependencyGraph - Tracks dependencies between elements and determines update order
 */
export class DependencyGraph {
  /**
   * Create a new dependency graph
   */
  constructor() {
    // Map of element ID to array of dependent element IDs
    this._dependencies = new Map();
    
    // Map of element ID to array of element IDs it depends on
    this._dependents = new Map();
  }

  /**
   * Add a dependency relationship
   * @param {string} elementId - The element ID
   * @param {string} dependsOnId - The ID of the element it depends on
   */
  addDependency(elementId, dependsOnId) {
    // Skip self-dependencies
    if (elementId === dependsOnId) {
      return;
    }
    
    // Add to dependencies map
    if (!this._dependencies.has(elementId)) {
      this._dependencies.set(elementId, new Set());
    }
    this._dependencies.get(elementId).add(dependsOnId);
    
    // Add to dependents map
    if (!this._dependents.has(dependsOnId)) {
      this._dependents.set(dependsOnId, new Set());
    }
    this._dependents.get(dependsOnId).add(elementId);
  }

  /**
   * Remove a dependency relationship
   * @param {string} elementId - The element ID
   * @param {string} dependsOnId - The ID of the element it depends on
   */
  removeDependency(elementId, dependsOnId) {
    // Remove from dependencies map
    if (this._dependencies.has(elementId)) {
      this._dependencies.get(elementId).delete(dependsOnId);
      
      // Clean up empty sets
      if (this._dependencies.get(elementId).size === 0) {
        this._dependencies.delete(elementId);
      }
    }
    
    // Remove from dependents map
    if (this._dependents.has(dependsOnId)) {
      this._dependents.get(dependsOnId).delete(elementId);
      
      // Clean up empty sets
      if (this._dependents.get(dependsOnId).size === 0) {
        this._dependents.delete(dependsOnId);
      }
    }
  }

  /**
   * Get all elements that depend on the given element
   * @param {string} elementId - The element ID
   * @returns {Array<string>} - Array of element IDs that depend on the given element
   */
  getDependents(elementId) {
    if (!this._dependents.has(elementId)) {
      return [];
    }
    
    return Array.from(this._dependents.get(elementId));
  }

  /**
   * Get all elements that the given element depends on
   * @param {string} elementId - The element ID
   * @returns {Array<string>} - Array of element IDs that the given element depends on
   */
  getDependencies(elementId) {
    if (!this._dependencies.has(elementId)) {
      return [];
    }
    
    return Array.from(this._dependencies.get(elementId));
  }

  /**
   * Get the update order for a given element
   * This returns the element and all its dependents in the order they should be updated
   * @param {string} startElementId - The starting element ID
   * @returns {Array<string>} - Array of element IDs in update order
   */
  getUpdateOrder(startElementId) {
    const visited = new Set();
    const result = [];
    
    // Helper function for depth-first traversal
    const visit = (elementId) => {
      // Skip if already visited
      if (visited.has(elementId)) {
        return;
      }
      
      // Mark as visited
      visited.add(elementId);
      
      // Visit dependencies first
      const dependencies = this.getDependencies(elementId);
      for (const dependencyId of dependencies) {
        visit(dependencyId);
      }
      
      // Add to result
      result.push(elementId);
      
      // Visit dependents
      const dependents = this.getDependents(elementId);
      for (const dependentId of dependents) {
        visit(dependentId);
      }
    };
    
    // Start traversal
    visit(startElementId);
    
    return result;
  }

  /**
   * Check if there is a dependency cycle
   * @returns {boolean} - Whether there is a cycle
   */
  hasCycle() {
    // Set of elements currently being visited
    const visiting = new Set();
    
    // Set of elements that have been fully visited
    const visited = new Set();
    
    // Helper function for depth-first traversal
    const visit = (elementId) => {
      // If already fully visited, no cycle here
      if (visited.has(elementId)) {
        return false;
      }
      
      // If currently visiting, found a cycle
      if (visiting.has(elementId)) {
        return true;
      }
      
      // Mark as currently visiting
      visiting.add(elementId);
      
      // Visit dependents
      const dependents = this.getDependents(elementId);
      for (const dependentId of dependents) {
        if (visit(dependentId)) {
          return true;
        }
      }
      
      // Mark as fully visited
      visiting.delete(elementId);
      visited.add(elementId);
      
      return false;
    };
    
    // Check all elements
    for (const elementId of this._dependencies.keys()) {
      if (visit(elementId)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get all elements in the graph
   * @returns {Array<string>} - Array of all element IDs
   */
  getAllElements() {
    const elements = new Set();
    
    // Add all elements from dependencies
    for (const [elementId, dependencies] of this._dependencies.entries()) {
      elements.add(elementId);
      for (const dependencyId of dependencies) {
        elements.add(dependencyId);
      }
    }
    
    // Add all elements from dependents
    for (const [elementId, dependents] of this._dependents.entries()) {
      elements.add(elementId);
      for (const dependentId of dependents) {
        elements.add(dependentId);
      }
    }
    
    return Array.from(elements);
  }

  /**
   * Clear all dependencies
   */
  clear() {
    this._dependencies.clear();
    this._dependents.clear();
  }

  /**
   * Get the number of elements in the graph
   * @returns {number} - The number of elements
   */
  size() {
    return this.getAllElements().length;
  }

  /**
   * Check if the graph is empty
   * @returns {boolean} - Whether the graph is empty
   */
  isEmpty() {
    return this._dependencies.size === 0 && this._dependents.size === 0;
  }

  /**
   * Convert to a simple object for debugging
   * @returns {Object} - Simple object representation
   */
  toObject() {
    const dependencies = {};
    const dependents = {};
    
    for (const [elementId, deps] of this._dependencies.entries()) {
      dependencies[elementId] = Array.from(deps);
    }
    
    for (const [elementId, deps] of this._dependents.entries()) {
      dependents[elementId] = Array.from(deps);
    }
    
    return {
      dependencies,
      dependents
    };
  }
}
