/**
 * InteractionManager - Coordinates all interaction components
 */
import { EventEmitter } from '../core/EventEmitter.js';
import { InputHandler } from './InputHandler.js';
import { DragManager } from './DragManager.js';
import { SelectionManager } from './SelectionManager.js';

export class InteractionManager extends EventEmitter {
  /**
   * Create a new interaction manager
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {Object} registry - Element registry
   * @param {Object} solver - Constraint solver
   * @param {Object} renderer - Renderer
   */
  constructor(canvas, registry, solver, renderer) {
    super();
    
    this.canvas = canvas;
    this.registry = registry;
    this.solver = solver;
    this.renderer = renderer;
    
    // Create interaction components
    this.inputHandler = new InputHandler(canvas, registry, solver);
    this.dragManager = new DragManager(canvas, registry, solver);
    this.selectionManager = new SelectionManager(registry);
    
    // Interaction mode
    this._mode = 'select'; // 'select', 'drag', 'create', 'delete', 'connect'
    
    // Creation type
    this._creationType = null;
    
    // Temporary elements for creation
    this._tempElements = [];
    
    // Bind event handlers
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleElementClicked = this.handleElementClicked.bind(this);
    this.handleCanvasClicked = this.handleCanvasClicked.bind(this);
    this.handleDragStart = this.handleDragStart.bind(this);
    this.handleDragging = this.handleDragging.bind(this);
    this.handleDragEnd = this.handleDragEnd.bind(this);
    this.handleSelectionChanged = this.handleSelectionChanged.bind(this);
    
    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Input handler events
    this.inputHandler.on('mouse-down', this.handleMouseDown);
    this.inputHandler.on('mouse-move', this.handleMouseMove);
    this.inputHandler.on('mouse-up', this.handleMouseUp);
    this.inputHandler.on('element-clicked', this.handleElementClicked);
    this.inputHandler.on('canvas-clicked', this.handleCanvasClicked);
    
    // Drag manager events
    this.dragManager.on('drag-start', this.handleDragStart);
    this.dragManager.on('dragging', this.handleDragging);
    this.dragManager.on('drag-end', this.handleDragEnd);
    
    // Selection manager events
    this.selectionManager.on('selection-changed', this.handleSelectionChanged);
  }

  /**
   * Handle mouse down event
   * @param {Object} data - Event data
   */
  handleMouseDown(data) {
    // Forward to listeners
    this.emit('mouse-down', data);
  }

  /**
   * Handle mouse move event
   * @param {Object} data - Event data
   */
  handleMouseMove(data) {
    // Handle creation mode
    if (this._mode === 'create' && this._tempElements.length > 0) {
      this.updateCreation(data.x, data.y);
    }
    
    // Forward to listeners
    this.emit('mouse-move', data);
  }

  /**
   * Handle mouse up event
   * @param {Object} data - Event data
   */
  handleMouseUp(data) {
    // Forward to listeners
    this.emit('mouse-up', data);
  }

  /**
   * Handle element clicked event
   * @param {Object} element - The clicked element
   */
  handleElementClicked(element) {
    // Handle based on mode
    switch (this._mode) {
      case 'select':
        // Toggle selection
        this.selectionManager.toggleSelection(element);
        break;
        
      case 'drag':
        // Start dragging
        this.dragManager.startDrag(element, this.inputHandler.mouse.x, this.inputHandler.mouse.y);
        break;
        
      case 'delete':
        // Delete element
        this.deleteElement(element);
        break;
        
      case 'connect':
        // Connect elements
        this.connectElements(element);
        break;
        
      case 'create':
        // Finish creation
        this.finishCreation(this.inputHandler.mouse.x, this.inputHandler.mouse.y);
        break;
    }
    
    // Forward to listeners
    this.emit('element-clicked', element);
  }

  /**
   * Handle canvas clicked event
   * @param {Object} data - Event data
   */
  handleCanvasClicked(data) {
    // Handle based on mode
    switch (this._mode) {
      case 'select':
        // Clear selection
        this.selectionManager.clearSelection();
        break;
        
      case 'create':
        // Start or continue creation
        this.handleCreation(data.x, data.y);
        break;
    }
    
    // Forward to listeners
    this.emit('canvas-clicked', data);
  }

  /**
   * Handle drag start event
   * @param {Object} data - Event data
   */
  handleDragStart(data) {
    // Forward to listeners
    this.emit('drag-start', data);
  }

  /**
   * Handle dragging event
   * @param {Object} data - Event data
   */
  handleDragging(data) {
    // Forward to listeners
    this.emit('dragging', data);
  }

  /**
   * Handle drag end event
   * @param {Object} data - Event data
   */
  handleDragEnd(data) {
    // Forward to listeners
    this.emit('drag-end', data);
  }

  /**
   * Handle selection changed event
   * @param {Object} data - Event data
   */
  handleSelectionChanged(data) {
    // Forward to listeners
    this.emit('selection-changed', data);
  }

  /**
   * Set the interaction mode
   * @param {string} mode - The mode ('select', 'drag', 'create', 'delete', 'connect')
   * @param {string} [creationType] - The creation type (for 'create' mode)
   * @returns {InteractionManager} - This manager for chaining
   */
  setMode(mode, creationType = null) {
    // Clean up previous mode
    this.cleanupMode();
    
    // Set new mode
    this._mode = mode;
    
    // Set creation type if in create mode
    if (mode === 'create') {
      this._creationType = creationType;
    } else {
      this._creationType = null;
    }
    
    // Emit mode changed event
    this.emit('mode-changed', {
      mode,
      creationType
    });
    
    return this;
  }

  /**
   * Clean up the current mode
   */
  cleanupMode() {
    // Clean up based on mode
    switch (this._mode) {
      case 'create':
        // Clean up temporary elements
        this.cancelCreation();
        break;
    }
  }

  /**
   * Get the current interaction mode
   * @returns {string} - The current mode
   */
  getMode() {
    return this._mode;
  }

  /**
   * Get the current creation type
   * @returns {string|null} - The current creation type
   */
  getCreationType() {
    return this._creationType;
  }

  /**
   * Handle element creation
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  handleCreation(x, y) {
    if (!this._creationType) {
      return;
    }
    
    // Handle based on creation type and state
    switch (this._creationType) {
      case 'point':
        // Create a point
        this.createPoint(x, y);
        break;
        
      case 'line':
        // Create a line
        if (this._tempElements.length === 0) {
          // Start line creation
          this.startLineCreation(x, y);
        } else {
          // Finish line creation
          this.finishLineCreation(x, y);
        }
        break;
        
      case 'circle':
        // Create a circle
        if (this._tempElements.length === 0) {
          // Start circle creation
          this.startCircleCreation(x, y);
        } else {
          // Finish circle creation
          this.finishCircleCreation(x, y);
        }
        break;
        
      case 'triangle':
        // Create a triangle
        if (this._tempElements.length === 0) {
          // Start triangle creation
          this.startTriangleCreation(x, y);
        } else if (this._tempElements.length === 1) {
          // Continue triangle creation
          this.continueTriangleCreation(x, y);
        } else {
          // Finish triangle creation
          this.finishTriangleCreation(x, y);
        }
        break;
    }
  }

  /**
   * Update element creation
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  updateCreation(x, y) {
    if (!this._creationType || this._tempElements.length === 0) {
      return;
    }
    
    // Handle based on creation type and state
    switch (this._creationType) {
      case 'line':
        // Update line creation
        this.updateLineCreation(x, y);
        break;
        
      case 'circle':
        // Update circle creation
        this.updateCircleCreation(x, y);
        break;
        
      case 'triangle':
        // Update triangle creation
        this.updateTriangleCreation(x, y);
        break;
    }
  }

  /**
   * Finish element creation
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  finishCreation(x, y) {
    if (!this._creationType) {
      return;
    }
    
    // Handle based on creation type
    switch (this._creationType) {
      case 'line':
        // Finish line creation
        this.finishLineCreation(x, y);
        break;
        
      case 'circle':
        // Finish circle creation
        this.finishCircleCreation(x, y);
        break;
        
      case 'triangle':
        // Continue or finish triangle creation
        if (this._tempElements.length === 1) {
          this.continueTriangleCreation(x, y);
        } else if (this._tempElements.length === 2) {
          this.finishTriangleCreation(x, y);
        }
        break;
    }
  }

  /**
   * Cancel element creation
   */
  cancelCreation() {
    // Remove temporary elements
    for (const element of this._tempElements) {
      this.registry.removeElement(element);
    }
    
    // Clear temporary elements
    this._tempElements = [];
    
    // Emit creation canceled event
    this.emit('creation-canceled');
  }

  /**
   * Create a point
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  createPoint(x, y) {
    // Create a point
    const id = `point_${Date.now()}`;
    const point = this.registry.createPoint(id, x, y);
    
    // Emit element created event
    this.emit('element-created', {
      type: 'point',
      element: point
    });
  }

  /**
   * Start line creation
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  startLineCreation(x, y) {
    // Create start point
    const startId = `point_${Date.now()}_start`;
    const start = this.registry.createPoint(startId, x, y);
    
    // Create temporary end point
    const endId = `point_${Date.now()}_end`;
    const end = this.registry.createPoint(endId, x, y);
    
    // Create temporary line
    const lineId = `line_${Date.now()}`;
    const line = this.registry.createLine(lineId, start, end);
    
    // Add to temporary elements
    this._tempElements.push(start);
    this._tempElements.push(end);
    this._tempElements.push(line);
  }

  /**
   * Update line creation
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  updateLineCreation(x, y) {
    if (this._tempElements.length < 3) {
      return;
    }
    
    // Update end point
    const end = this._tempElements[1];
    end.moveTo(x, y);
  }

  /**
   * Finish line creation
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  finishLineCreation(x, y) {
    if (this._tempElements.length < 3) {
      return;
    }
    
    // Get elements
    const start = this._tempElements[0];
    const end = this._tempElements[1];
    const line = this._tempElements[2];
    
    // Update end point
    end.moveTo(x, y);
    
    // Clear temporary elements
    this._tempElements = [];
    
    // Emit element created event
    this.emit('element-created', {
      type: 'line',
      element: line,
      start,
      end
    });
  }

  /**
   * Start circle creation
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  startCircleCreation(x, y) {
    // Create center point
    const centerId = `point_${Date.now()}_center`;
    const center = this.registry.createPoint(centerId, x, y);
    
    // Create temporary radius point
    const radiusId = `point_${Date.now()}_radius`;
    const radiusPoint = this.registry.createPoint(radiusId, x, y);
    
    // Create temporary circle
    const circleId = `circle_${Date.now()}`;
    const circle = this.registry.createCircle(circleId, center, radiusPoint);
    
    // Add to temporary elements
    this._tempElements.push(center);
    this._tempElements.push(radiusPoint);
    this._tempElements.push(circle);
  }

  /**
   * Update circle creation
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  updateCircleCreation(x, y) {
    if (this._tempElements.length < 3) {
      return;
    }
    
    // Update radius point
    const radiusPoint = this._tempElements[1];
    radiusPoint.moveTo(x, y);
  }

  /**
   * Finish circle creation
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  finishCircleCreation(x, y) {
    if (this._tempElements.length < 3) {
      return;
    }
    
    // Get elements
    const center = this._tempElements[0];
    const radiusPoint = this._tempElements[1];
    const circle = this._tempElements[2];
    
    // Update radius point
    radiusPoint.moveTo(x, y);
    
    // Clear temporary elements
    this._tempElements = [];
    
    // Emit element created event
    this.emit('element-created', {
      type: 'circle',
      element: circle,
      center,
      radiusPoint
    });
  }

  /**
   * Start triangle creation
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  startTriangleCreation(x, y) {
    // Create first vertex
    const aId = `point_${Date.now()}_a`;
    const a = this.registry.createPoint(aId, x, y);
    
    // Add to temporary elements
    this._tempElements.push(a);
  }

  /**
   * Continue triangle creation
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  continueTriangleCreation(x, y) {
    if (this._tempElements.length < 1) {
      return;
    }
    
    // Get first vertex
    const a = this._tempElements[0];
    
    // Create second vertex
    const bId = `point_${Date.now()}_b`;
    const b = this.registry.createPoint(bId, x, y);
    
    // Add to temporary elements
    this._tempElements.push(b);
    
    // Create temporary lines
    const abId = `line_${Date.now()}_ab`;
    const ab = this.registry.createLine(abId, a, b);
    
    // Add to temporary elements
    this._tempElements.push(ab);
  }

  /**
   * Update triangle creation
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  updateTriangleCreation(x, y) {
    if (this._tempElements.length < 3) {
      return;
    }
    
    // Get vertices
    const a = this._tempElements[0];
    const b = this._tempElements[1];
    
    // Create temporary third vertex if needed
    if (this._tempElements.length === 3) {
      const cId = `point_${Date.now()}_c`;
      const c = this.registry.createPoint(cId, x, y);
      
      // Create temporary lines
      const bcId = `line_${Date.now()}_bc`;
      const bc = this.registry.createLine(bcId, b, c);
      
      const caId = `line_${Date.now()}_ca`;
      const ca = this.registry.createLine(caId, c, a);
      
      // Create temporary triangle
      const triangleId = `triangle_${Date.now()}`;
      const triangle = this.registry.createTriangle(triangleId, a, b, c);
      
      // Add to temporary elements
      this._tempElements.push(c);
      this._tempElements.push(bc);
      this._tempElements.push(ca);
      this._tempElements.push(triangle);
    } else {
      // Update third vertex
      const c = this._tempElements[3];
      c.moveTo(x, y);
    }
  }

  /**
   * Finish triangle creation
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  finishTriangleCreation(x, y) {
    if (this._tempElements.length < 3) {
      return;
    }
    
    // Get vertices
    const a = this._tempElements[0];
    const b = this._tempElements[1];
    
    // Create or update third vertex
    let c;
    let triangle;
    
    if (this._tempElements.length === 3) {
      // Create third vertex
      const cId = `point_${Date.now()}_c`;
      c = this.registry.createPoint(cId, x, y);
      
      // Create triangle
      const triangleId = `triangle_${Date.now()}`;
      triangle = this.registry.createTriangle(triangleId, a, b, c);
    } else {
      // Update third vertex
      c = this._tempElements[3];
      c.moveTo(x, y);
      
      // Get triangle
      triangle = this._tempElements[6];
    }
    
    // Clear temporary elements
    this._tempElements = [];
    
    // Emit element created event
    this.emit('element-created', {
      type: 'triangle',
      element: triangle,
      a,
      b,
      c
    });
  }

  /**
   * Delete an element
   * @param {Object} element - The element to delete
   */
  deleteElement(element) {
    if (!element) {
      return;
    }
    
    // Emit element deleted event
    this.emit('element-deleted', {
      element
    });
    
    // Remove from registry
    this.registry.removeElement(element);
  }

  /**
   * Connect elements
   * @param {Object} element - The element to connect
   */
  connectElements(element) {
    if (!element) {
      return;
    }
    
    // Get selected elements
    const selectedElements = this.selectionManager.getSelectedElements();
    
    if (selectedElements.length === 0) {
      // Select this element
      this.selectionManager.select(element);
    } else {
      // Connect selected elements to this element
      for (const selectedElement of selectedElements) {
        this.connectElementPair(selectedElement, element);
      }
      
      // Clear selection
      this.selectionManager.clearSelection();
    }
  }

  /**
   * Connect a pair of elements
   * @param {Object} element1 - The first element
   * @param {Object} element2 - The second element
   */
  connectElementPair(element1, element2) {
    // Emit elements connected event
    this.emit('elements-connected', {
      element1,
      element2
    });
    
    // TODO: Implement specific connection logic based on element types
  }

  /**
   * Clean up the interaction manager
   */
  dispose() {
    // Clean up current mode
    this.cleanupMode();
    
    // Remove event listeners
    this.inputHandler.off('mouse-down', this.handleMouseDown);
    this.inputHandler.off('mouse-move', this.handleMouseMove);
    this.inputHandler.off('mouse-up', this.handleMouseUp);
    this.inputHandler.off('element-clicked', this.handleElementClicked);
    this.inputHandler.off('canvas-clicked', this.handleCanvasClicked);
    
    this.dragManager.off('drag-start', this.handleDragStart);
    this.dragManager.off('dragging', this.handleDragging);
    this.dragManager.off('drag-end', this.handleDragEnd);
    
    this.selectionManager.off('selection-changed', this.handleSelectionChanged);
    
    // Dispose components
    this.inputHandler.dispose();
  }
}
