/**
 * ConstraintSolver - Manages and resolves geometric constraints
 */
import { EventEmitter } from '../core/EventEmitter.js';
import { DependencyGraph } from './DependencyGraph.js';

export class ConstraintSolver extends EventEmitter {
  /**
   * Create a new constraint solver
   * @param {Object} registry - The element registry
   */
  constructor(registry) {
    super();
    
    this.registry = registry;
    this.dependencyGraph = new DependencyGraph();
    this.constraints = new Map();
    this.maxIterations = 10;
    this.tolerance = 0.001;
    this.initialized = false;
  }

  /**
   * Initialize the solver
   * This builds the dependency graph from the registry elements
   */
  initialize() {
    // Clear existing data
    this.dependencyGraph.clear();
    this.constraints.clear();
    
    // Build dependency graph from registry elements
    const elements = this.registry.getAllElements();
    
    for (const element of elements) {
      // Add element constraints
      for (const constraint of element.constraints) {
        this.addConstraint(constraint);
      }
      
      // Add dependencies
      for (const dependency of element.dependencies) {
        this.dependencyGraph.addDependency(element.id, dependency.id);
      }
    }
    
    this.initialized = true;
    this.emit('initialized');
  }

  /**
   * Add a constraint to the solver
   * @param {Object} constraint - The constraint to add
   * @returns {ConstraintSolver} - This solver for chaining
   */
  addConstraint(constraint) {
    if (!constraint) {
      return this;
    }
    
    const id = constraint.id || `constraint_${this.constraints.size}`;
    
    if (!this.constraints.has(id)) {
      this.constraints.set(id, constraint);
      this.emit('constraint-added', constraint);
    }
    
    return this;
  }

  /**
   * Remove a constraint from the solver
   * @param {Object|string} constraintOrId - The constraint or constraint ID to remove
   * @returns {ConstraintSolver} - This solver for chaining
   */
  removeConstraint(constraintOrId) {
    const id = typeof constraintOrId === 'string' ? constraintOrId : constraintOrId.id;
    
    if (this.constraints.has(id)) {
      const constraint = this.constraints.get(id);
      this.constraints.delete(id);
      this.emit('constraint-removed', constraint);
    }
    
    return this;
  }

  /**
   * Solve constraints for a specific element
   * @param {Object} element - The element to solve for
   * @returns {boolean} - Whether the solve was successful
   */
  solveFor(element) {
    if (!this.initialized) {
      this.initialize();
    }
    
    if (!element) {
      return false;
    }
    
    // Get the update order for this element
    const updateOrder = this.dependencyGraph.getUpdateOrder(element.id);
    
    // Apply constraints in dependency order
    for (const elementId of updateOrder) {
      const element = this.registry.getElementById(elementId);
      
      if (element) {
        // Apply element's own constraints
        this.applyElementConstraints(element);
      }
    }
    
    return true;
  }

  /**
   * Apply all constraints for a specific element
   * @param {Object} element - The element to apply constraints for
   * @returns {boolean} - Whether all constraints were satisfied
   */
  applyElementConstraints(element) {
    if (!element || !element.constraints || element.constraints.length === 0) {
      return true;
    }
    
    // Sort constraints by priority (higher first)
    const sortedConstraints = [...element.constraints].sort(
      (a, b) => (b.priority || 1) - (a.priority || 1)
    );
    
    let satisfied = true;
    
    // Apply each constraint
    for (const constraint of sortedConstraints) {
      if (constraint.enabled && constraint.isValid()) {
        constraint.apply();
        
        // Check if the constraint is satisfied
        // This would require a more sophisticated check in a real implementation
        // For now, we assume the constraint is satisfied after applying it
      } else {
        satisfied = false;
      }
    }
    
    return satisfied;
  }

  /**
   * Solve all constraints in the system
   * @param {number} [maxIterations] - Maximum number of iterations
   * @returns {boolean} - Whether the solve was successful
   */
  solveAll(maxIterations = this.maxIterations) {
    if (!this.initialized) {
      this.initialize();
    }
    
    // Get all elements
    const elements = this.registry.getAllElements();
    
    // Sort elements by dependency (elements with no dependencies first)
    const sortedElements = elements.sort((a, b) => {
      return a.dependencies.length - b.dependencies.length;
    });
    
    let iteration = 0;
    let satisfied = false;
    
    // Iterate until all constraints are satisfied or max iterations reached
    while (!satisfied && iteration < maxIterations) {
      satisfied = true;
      
      // Apply constraints for each element
      for (const element of sortedElements) {
        const elementSatisfied = this.applyElementConstraints(element);
        satisfied = satisfied && elementSatisfied;
      }
      
      iteration++;
    }
    
    this.emit('solve-complete', {
      satisfied,
      iterations: iteration
    });
    
    return satisfied;
  }

  /**
   * Check if the constraint system has cycles
   * @returns {boolean} - Whether the system has cycles
   */
  hasCycles() {
    return this.dependencyGraph.hasCycle();
  }

  /**
   * Get all constraints
   * @returns {Array} - Array of all constraints
   */
  getAllConstraints() {
    return Array.from(this.constraints.values());
  }

  /**
   * Get constraints for a specific element
   * @param {Object|string} elementOrId - The element or element ID
   * @returns {Array} - Array of constraints for the element
   */
  getConstraintsForElement(elementOrId) {
    const id = typeof elementOrId === 'string' ? elementOrId : elementOrId.id;
    const element = this.registry.getElementById(id);
    
    if (!element) {
      return [];
    }
    
    return element.constraints || [];
  }

  /**
   * Clear all constraints
   * @returns {ConstraintSolver} - This solver for chaining
   */
  clearConstraints() {
    this.constraints.clear();
    
    // Clear constraints from elements
    const elements = this.registry.getAllElements();
    
    for (const element of elements) {
      element.constraints = [];
    }
    
    this.emit('constraints-cleared');
    
    return this;
  }

  /**
   * Set the maximum number of iterations
   * @param {number} maxIterations - The maximum number of iterations
   * @returns {ConstraintSolver} - This solver for chaining
   */
  setMaxIterations(maxIterations) {
    this.maxIterations = Math.max(1, maxIterations);
    return this;
  }

  /**
   * Set the tolerance for constraint satisfaction
   * @param {number} tolerance - The tolerance
   * @returns {ConstraintSolver} - This solver for chaining
   */
  setTolerance(tolerance) {
    this.tolerance = Math.max(0, tolerance);
    return this;
  }
}
