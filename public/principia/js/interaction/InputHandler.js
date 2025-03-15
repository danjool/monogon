/**
 * InputHandler - Handles user input for the canvas
 */
import { EventEmitter } from '../core/EventEmitter.js';
import { Point } from '../geometry/Point.js';

export class InputHandler extends EventEmitter {
  /**
   * Create a new input handler
   * @param {string|HTMLCanvasElement} canvas - Canvas element or ID
   * @param {Object} registry - Element registry
   * @param {Object} solver - Constraint solver
   */
  constructor(canvas, registry, solver) {
    super();
    
    // Get canvas element
    this.canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;
    
    if (!this.canvas || !(this.canvas instanceof HTMLCanvasElement)) {
      throw new Error('Invalid canvas element');
    }
    
    this.registry = registry;
    this.solver = solver;
    
    // Mouse state
    this.mouse = {
      x: 0,
      y: 0,
      down: false,
      dragging: false
    };
    
    // Currently dragged element
    this.draggedElement = null;
    
    // Currently hovered element
    this.hoveredElement = null;
    
    // Tolerance for hit testing
    this.hitTolerance = 10;
    
    // Bind event handlers
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    
    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
    
    // Touch events
    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    this.canvas.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });
  }

  /**
   * Handle mouse down event
   * @param {MouseEvent} event - The mouse event
   */
  handleMouseDown(event) {
    event.preventDefault();
    
    // Update mouse state
    this.updateMousePosition(event);
    this.mouse.down = true;
    
    // Find element under cursor
    const element = this.findElementAt(this.mouse.x, this.mouse.y);
    
    if (element) {
      // Start dragging if the element is draggable
      if (element instanceof Point && element.properties.draggable) {
        this.startDrag(element);
      }
      
      // Emit element clicked event
      this.emit('element-clicked', element);
    } else {
      // Emit canvas clicked event
      this.emit('canvas-clicked', {
        x: this.mouse.x,
        y: this.mouse.y
      });
    }
  }

  /**
   * Handle mouse move event
   * @param {MouseEvent} event - The mouse event
   */
  handleMouseMove(event) {
    event.preventDefault();
    
    // Update mouse state
    const oldX = this.mouse.x;
    const oldY = this.mouse.y;
    this.updateMousePosition(event);
    
    // Handle dragging
    if (this.mouse.down && this.draggedElement) {
      this.drag(this.mouse.x, this.mouse.y);
    }
    
    // Handle hover
    if (!this.mouse.dragging) {
      this.updateHover();
    }
    
    // Emit mouse move event
    this.emit('mouse-moved', {
      x: this.mouse.x,
      y: this.mouse.y,
      dx: this.mouse.x - oldX,
      dy: this.mouse.y - oldY
    });
  }

  /**
   * Handle mouse up event
   * @param {MouseEvent} event - The mouse event
   */
  handleMouseUp(event) {
    event.preventDefault();
    
    // Update mouse state
    this.updateMousePosition(event);
    this.mouse.down = false;
    
    // End dragging
    if (this.draggedElement) {
      this.endDrag();
    }
    
    // Emit mouse up event
    this.emit('mouse-up', {
      x: this.mouse.x,
      y: this.mouse.y
    });
  }

  /**
   * Handle mouse leave event
   * @param {MouseEvent} event - The mouse event
   */
  handleMouseLeave(event) {
    event.preventDefault();
    
    // Update mouse state
    this.updateMousePosition(event);
    this.mouse.down = false;
    
    // End dragging
    if (this.draggedElement) {
      this.endDrag();
    }
    
    // Clear hover
    if (this.hoveredElement) {
      this.clearHover();
    }
    
    // Emit mouse leave event
    this.emit('mouse-leave', {
      x: this.mouse.x,
      y: this.mouse.y
    });
  }

  /**
   * Handle touch start event
   * @param {TouchEvent} event - The touch event
   */
  handleTouchStart(event) {
    event.preventDefault();
    
    if (event.touches.length === 1) {
      // Convert touch to mouse event
      const touch = event.touches[0];
      const mouseEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY
      };
      
      this.handleMouseDown(mouseEvent);
    }
  }

  /**
   * Handle touch move event
   * @param {TouchEvent} event - The touch event
   */
  handleTouchMove(event) {
    event.preventDefault();
    
    if (event.touches.length === 1) {
      // Convert touch to mouse event
      const touch = event.touches[0];
      const mouseEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY
      };
      
      this.handleMouseMove(mouseEvent);
    }
  }

  /**
   * Handle touch end event
   * @param {TouchEvent} event - The touch event
   */
  handleTouchEnd(event) {
    event.preventDefault();
    
    this.handleMouseUp(event);
  }

  /**
   * Update mouse position
   * @param {MouseEvent} event - The mouse event
   */
  updateMousePosition(event) {
    const rect = this.canvas.getBoundingClientRect();
    
    this.mouse.x = event.clientX - rect.left;
    this.mouse.y = event.clientY - rect.top;
  }

  /**
   * Find element at the given position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Object|null} - The element or null if not found
   */
  findElementAt(x, y) {
    // Get all elements from registry
    const elements = this.registry.getAllElements();
    
    // Check points first (they're easier to hit)
    const points = elements.filter(e => e instanceof Point);
    
    for (const point of points) {
      if (point.containsPoint(x, y)) {
        return point;
      }
    }
    
    // Check other elements
    for (const element of elements) {
      if (element instanceof Point) {
        continue; // Already checked points
      }
      
      if (typeof element.containsPoint === 'function' && element.containsPoint(x, y, this.hitTolerance)) {
        return element;
      }
    }
    
    return null;
  }

  /**
   * Start dragging an element
   * @param {Object} element - The element to drag
   */
  startDrag(element) {
    if (!element || this.draggedElement) {
      return;
    }
    
    this.draggedElement = element;
    this.mouse.dragging = true;
    
    // If the element is a point, start dragging it
    if (element instanceof Point) {
      element.startDrag(this.mouse.x, this.mouse.y);
    }
    
    // Emit drag start event
    this.emit('drag-start', {
      element,
      x: this.mouse.x,
      y: this.mouse.y
    });
  }

  /**
   * Drag the current element
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  drag(x, y) {
    if (!this.draggedElement) {
      return;
    }
    
    // If the element is a point, drag it
    if (this.draggedElement instanceof Point) {
      this.draggedElement.drag(x, y);
      
      // Solve constraints
      if (this.solver) {
        this.solver.solveFor(this.draggedElement);
      }
    }
    
    // Emit dragging event
    this.emit('dragging', {
      element: this.draggedElement,
      x,
      y
    });
  }

  /**
   * End dragging
   */
  endDrag() {
    if (!this.draggedElement) {
      return;
    }
    
    // If the element is a point, end dragging it
    if (this.draggedElement instanceof Point) {
      this.draggedElement.endDrag();
    }
    
    // Emit drag end event
    this.emit('drag-end', {
      element: this.draggedElement,
      x: this.mouse.x,
      y: this.mouse.y
    });
    
    this.draggedElement = null;
    this.mouse.dragging = false;
  }

  /**
   * Update hover state
   */
  updateHover() {
    // Find element under cursor
    const element = this.findElementAt(this.mouse.x, this.mouse.y);
    
    // If hovering over a new element
    if (element !== this.hoveredElement) {
      // Clear previous hover
      if (this.hoveredElement) {
        this.hoveredElement.setHighlighted(false);
        
        // Emit hover end event
        this.emit('hover-end', {
          element: this.hoveredElement,
          x: this.mouse.x,
          y: this.mouse.y
        });
      }
      
      // Set new hover
      this.hoveredElement = element;
      
      if (this.hoveredElement) {
        this.hoveredElement.setHighlighted(true);
        
        // Emit hover start event
        this.emit('hover-start', {
          element: this.hoveredElement,
          x: this.mouse.x,
          y: this.mouse.y
        });
      }
    }
  }

  /**
   * Clear hover state
   */
  clearHover() {
    if (this.hoveredElement) {
      this.hoveredElement.setHighlighted(false);
      
      // Emit hover end event
      this.emit('hover-end', {
        element: this.hoveredElement,
        x: this.mouse.x,
        y: this.mouse.y
      });
      
      this.hoveredElement = null;
    }
  }

  /**
   * Set hit testing tolerance
   * @param {number} tolerance - The tolerance in pixels
   * @returns {InputHandler} - This handler for chaining
   */
  setHitTolerance(tolerance) {
    this.hitTolerance = Math.max(1, tolerance);
    return this;
  }

  /**
   * Get hit testing tolerance
   * @returns {number} - The tolerance in pixels
   */
  getHitTolerance() {
    return this.hitTolerance;
  }

  /**
   * Check if an element is being dragged
   * @returns {boolean} - Whether an element is being dragged
   */
  isDragging() {
    return this.mouse.dragging && this.draggedElement !== null;
  }

  /**
   * Get the currently dragged element
   * @returns {Object|null} - The dragged element or null
   */
  getDraggedElement() {
    return this.draggedElement;
  }

  /**
   * Get the currently hovered element
   * @returns {Object|null} - The hovered element or null
   */
  getHoveredElement() {
    return this.hoveredElement;
  }

  /**
   * Clean up the input handler
   */
  dispose() {
    // Remove event listeners
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
    
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    this.canvas.removeEventListener('touchcancel', this.handleTouchEnd);
    
    // Clear state
    this.clearHover();
    this.endDrag();
  }
}
