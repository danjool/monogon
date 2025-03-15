/**
 * DragManager - Manages dragging operations
 */
import { EventEmitter } from '../core/EventEmitter.js';
import { Point } from '../geometry/Point.js';

export class DragManager extends EventEmitter {
  /**
   * Create a new drag manager
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {Object} registry - Element registry
   * @param {Object} solver - Constraint solver
   */
  constructor(canvas, registry, solver) {
    super();
    
    this.canvas = canvas;
    this.registry = registry;
    this.solver = solver;
    
    // Currently dragged element
    this.draggedElement = null;
    
    // Drag start position
    this.dragStartX = 0;
    this.dragStartY = 0;
    
    // Current drag position
    this.dragX = 0;
    this.dragY = 0;
    
    // Drag constraints
    this.constraints = {
      snapToGrid: false,
      gridSize: 10,
      restrictToCanvas: false,
      restrictToAxis: null // 'x', 'y', or null
    };
  }

  /**
   * Start dragging an element
   * @param {Object} element - The element to drag
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} - Whether dragging started successfully
   */
  startDrag(element, x, y) {
    if (!element || this.draggedElement) {
      return false;
    }
    
    this.draggedElement = element;
    this.dragStartX = x;
    this.dragStartY = y;
    this.dragX = x;
    this.dragY = y;
    
    // If the element is a point, start dragging it
    if (element instanceof Point) {
      element.startDrag(x, y);
    }
    
    // Emit drag start event
    this.emit('drag-start', {
      element,
      x,
      y
    });
    
    return true;
  }

  /**
   * Drag the current element
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} - Whether the drag was processed
   */
  drag(x, y) {
    if (!this.draggedElement) {
      return false;
    }
    
    // Apply constraints
    const { newX, newY } = this.applyConstraints(x, y);
    
    // Update drag position
    this.dragX = newX;
    this.dragY = newY;
    
    // If the element is a point, drag it
    if (this.draggedElement instanceof Point) {
      // Check if this is a special point with hierarchical behavior
      const elementId = this.draggedElement.id;
      
      // Handle special cases for Corollary II
      if (elementId === 'O') {
        // O is the center of the wheel - when it moves, everything moves with it
        const dx = newX - this.draggedElement.x;
        const dy = newY - this.draggedElement.y;
        
        // Move all points except O
        const allPoints = this.registry.getElementsByType('Point');
        for (const point of allPoints) {
          if (point.id !== 'O') {
            point.moveBy(dx, dy, false);
          }
        }
        
        // Now move O itself
        this.draggedElement.moveTo(newX, newY, false);
        
        // Solve all constraints
        if (this.solver) {
          this.solver.solveAll();
        }
      } else if (elementId === 'M' || elementId === 'N') {
        // M and N are radii points - they affect the circle but not O
        this.draggedElement.drag(newX, newY);
        
        // Solve constraints
        if (this.solver) {
          this.solver.solveFor(this.draggedElement);
        }
      } else {
        // Default behavior for other points
        this.draggedElement.drag(newX, newY);
        
        // Solve constraints
        if (this.solver) {
          this.solver.solveFor(this.draggedElement);
        }
      }
    }
    
    // Emit dragging event
    this.emit('dragging', {
      element: this.draggedElement,
      x: newX,
      y: newY,
      originalX: x,
      originalY: y
    });
    
    return true;
  }

  /**
   * End dragging
   * @returns {boolean} - Whether dragging was ended
   */
  endDrag() {
    if (!this.draggedElement) {
      return false;
    }
    
    // If the element is a point, end dragging it
    if (this.draggedElement instanceof Point) {
      this.draggedElement.endDrag();
    }
    
    // Emit drag end event
    this.emit('drag-end', {
      element: this.draggedElement,
      x: this.dragX,
      y: this.dragY
    });
    
    const element = this.draggedElement;
    this.draggedElement = null;
    
    return true;
  }

  /**
   * Apply drag constraints
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Object} - The constrained coordinates
   */
  applyConstraints(x, y) {
    let newX = x;
    let newY = y;
    
    // Snap to grid
    if (this.constraints.snapToGrid) {
      const gridSize = this.constraints.gridSize;
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
    }
    
    // Restrict to canvas
    if (this.constraints.restrictToCanvas) {
      const { width, height } = this.canvas;
      newX = Math.max(0, Math.min(width, newX));
      newY = Math.max(0, Math.min(height, newY));
    }
    
    // Restrict to axis
    if (this.constraints.restrictToAxis === 'x') {
      newY = this.dragStartY;
    } else if (this.constraints.restrictToAxis === 'y') {
      newX = this.dragStartX;
    }
    
    return { newX, newY };
  }

  /**
   * Check if an element is being dragged
   * @returns {boolean} - Whether an element is being dragged
   */
  isDragging() {
    return this.draggedElement !== null;
  }

  /**
   * Get the currently dragged element
   * @returns {Object|null} - The dragged element or null
   */
  getDraggedElement() {
    return this.draggedElement;
  }

  /**
   * Get the drag start position
   * @returns {Object} - The drag start position
   */
  getDragStartPosition() {
    return {
      x: this.dragStartX,
      y: this.dragStartY
    };
  }

  /**
   * Get the current drag position
   * @returns {Object} - The current drag position
   */
  getDragPosition() {
    return {
      x: this.dragX,
      y: this.dragY
    };
  }

  /**
   * Set a drag constraint
   * @param {string} constraint - The constraint name
   * @param {any} value - The constraint value
   * @returns {DragManager} - This manager for chaining
   */
  setConstraint(constraint, value) {
    if (this.constraints.hasOwnProperty(constraint)) {
      this.constraints[constraint] = value;
    }
    
    return this;
  }

  /**
   * Get a drag constraint
   * @param {string} constraint - The constraint name
   * @returns {any} - The constraint value
   */
  getConstraint(constraint) {
    return this.constraints[constraint];
  }

  /**
   * Enable a drag constraint
   * @param {string} constraint - The constraint name
   * @returns {DragManager} - This manager for chaining
   */
  enableConstraint(constraint) {
    return this.setConstraint(constraint, true);
  }

  /**
   * Disable a drag constraint
   * @param {string} constraint - The constraint name
   * @returns {DragManager} - This manager for chaining
   */
  disableConstraint(constraint) {
    return this.setConstraint(constraint, false);
  }

  /**
   * Set the grid size for snap to grid
   * @param {number} size - The grid size
   * @returns {DragManager} - This manager for chaining
   */
  setGridSize(size) {
    this.constraints.gridSize = Math.max(1, size);
    return this;
  }

  /**
   * Restrict dragging to an axis
   * @param {string|null} axis - The axis ('x', 'y', or null)
   * @returns {DragManager} - This manager for chaining
   */
  restrictToAxis(axis) {
    if (axis === 'x' || axis === 'y' || axis === null) {
      this.constraints.restrictToAxis = axis;
    }
    
    return this;
  }

  /**
   * Calculate the drag distance
   * @returns {number} - The drag distance
   */
  getDragDistance() {
    const dx = this.dragX - this.dragStartX;
    const dy = this.dragY - this.dragStartY;
    
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate the drag angle
   * @returns {number} - The drag angle in radians
   */
  getDragAngle() {
    const dx = this.dragX - this.dragStartX;
    const dy = this.dragY - this.dragStartY;
    
    return Math.atan2(dy, dx);
  }
}
