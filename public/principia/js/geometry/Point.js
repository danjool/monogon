/**
 * Point - Represents a point in 2D space
 * A fundamental geometric element that can be moved and constrained
 */
import { GeometricElement } from './GeometricElement.js';

export class Point extends GeometricElement {
  /**
   * Create a new point
   * @param {string} id - Unique identifier for the point
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Object} properties - Additional properties
   */
  constructor(id, x = 0, y = 0, properties = {}) {
    super(id, {
      radius: 5,
      draggable: true,
      ...properties
    });
    
    this.x = x;
    this.y = y;
    
    // For drag operations
    this._dragOffsetX = 0;
    this._dragOffsetY = 0;
    this._isDragging = false;
  }

  /**
   * Move the point to a new position
   * @param {number} x - New X coordinate
   * @param {number} y - New Y coordinate
   * @param {boolean} [updateDependents=true] - Whether to update dependent elements
   * @returns {Point} - This point for chaining
   */
  moveTo(x, y, updateDependents = true) {
    const oldX = this.x;
    const oldY = this.y;
    
    if (oldX === x && oldY === y) {
      return this;
    }
    
    this.x = x;
    this.y = y;
    
    this.emit('moved', { oldX, oldY, newX: x, newY: y });
    
    if (updateDependents) {
      this.update();
    }
    
    return this;
  }

  /**
   * Move the point by a relative amount
   * @param {number} dx - X distance to move
   * @param {number} dy - Y distance to move
   * @param {boolean} [updateDependents=true] - Whether to update dependent elements
   * @returns {Point} - This point for chaining
   */
  moveBy(dx, dy, updateDependents = true) {
    return this.moveTo(this.x + dx, this.y + dy, updateDependents);
  }

  /**
   * Calculate the distance to another point
   * @param {Point} point - The other point
   * @returns {number} - The distance between the points
   */
  distanceTo(point) {
    return Math.sqrt(
      Math.pow(this.x - point.x, 2) + 
      Math.pow(this.y - point.y, 2)
    );
  }

  /**
   * Calculate the angle to another point (in radians)
   * @param {Point} point - The other point
   * @returns {number} - The angle in radians
   */
  angleTo(point) {
    return Math.atan2(point.y - this.y, point.x - this.x);
  }

  /**
   * Start dragging this point
   * @param {number} mouseX - Mouse X coordinate
   * @param {number} mouseY - Mouse Y coordinate
   * @returns {boolean} - Whether dragging started successfully
   */
  startDrag(mouseX, mouseY) {
    if (!this.properties.draggable) {
      return false;
    }
    
    this._dragOffsetX = this.x - mouseX;
    this._dragOffsetY = this.y - mouseY;
    this._isDragging = true;
    
    this.emit('drag-start', { x: mouseX, y: mouseY });
    
    return true;
  }

  /**
   * Update position during drag
   * @param {number} mouseX - Mouse X coordinate
   * @param {number} mouseY - Mouse Y coordinate
   * @returns {boolean} - Whether the drag was processed
   */
  drag(mouseX, mouseY) {
    if (!this._isDragging) {
      return false;
    }
    
    this.moveTo(
      mouseX + this._dragOffsetX,
      mouseY + this._dragOffsetY
    );
    
    this.emit('dragging', { x: mouseX, y: mouseY });
    
    return true;
  }

  /**
   * End dragging
   * @returns {boolean} - Whether dragging was ended
   */
  endDrag() {
    if (!this._isDragging) {
      return false;
    }
    
    this._isDragging = false;
    this.emit('drag-end', { x: this.x, y: this.y });
    
    return true;
  }

  /**
   * Check if the point is being dragged
   * @returns {boolean} - Whether the point is being dragged
   */
  isDragging() {
    return this._isDragging;
  }

  /**
   * Check if the point contains the given coordinates
   * @param {number} x - X coordinate to check
   * @param {number} y - Y coordinate to check
   * @returns {boolean} - Whether the point contains the coordinates
   */
  containsPoint(x, y) {
    const radius = this.properties.radius || 5;
    const distance = Math.sqrt(
      Math.pow(this.x - x, 2) + 
      Math.pow(this.y - y, 2)
    );
    
    return distance <= radius;
  }

  /**
   * Clone this point
   * @param {string} [newId] - Optional new ID for the cloned point
   * @returns {Point} - The cloned point
   */
  clone(newId) {
    const id = newId || `${this.id}_clone`;
    return new Point(id, this.x, this.y, { ...this.properties });
  }

  /**
   * Convert to a simple object for serialization
   * @returns {Object} - Simple object representation
   */
  toObject() {
    return {
      ...super.toObject(),
      x: this.x,
      y: this.y
    };
  }
}
