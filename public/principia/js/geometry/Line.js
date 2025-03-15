/**
 * Line - Represents a line segment between two points
 */
import { GeometricElement } from './GeometricElement.js';
import { Point } from './Point.js';

export class Line extends GeometricElement {
  /**
   * Create a new line
   * @param {string} id - Unique identifier for the line
   * @param {Point|string} start - Start point or point ID
   * @param {Point|string} end - End point or point ID
   * @param {Object} properties - Additional properties
   */
  constructor(id, start, end, properties = {}) {
    super(id, {
      width: 1,
      ...properties
    });
    
    this._start = null;
    this._end = null;
    
    // Set points and establish dependencies
    this.setPoints(start, end);
  }

  /**
   * Set the points for this line
   * @param {Point|string} start - Start point or point ID
   * @param {Point|string} end - End point or point ID
   * @returns {Line} - This line for chaining
   */
  setPoints(start, end) {
    // Remove existing dependencies if any
    if (this._start) {
      this.removeDependency(this._start);
    }
    
    if (this._end) {
      this.removeDependency(this._end);
    }
    
    // Set new points
    this._start = start instanceof Point ? start : null;
    this._end = end instanceof Point ? end : null;
    
    // Add dependencies
    if (this._start) {
      this.addDependency(this._start);
    }
    
    if (this._end) {
      this.addDependency(this._end);
    }
    
    this.emit('points-changed', { start: this._start, end: this._end });
    
    return this;
  }

  /**
   * Get the start point
   * @returns {Point} - The start point
   */
  get start() {
    return this._start;
  }

  /**
   * Get the end point
   * @returns {Point} - The end point
   */
  get end() {
    return this._end;
  }

  /**
   * Set the start point
   * @param {Point} point - The new start point
   */
  set start(point) {
    this.setPoints(point, this._end);
  }

  /**
   * Set the end point
   * @param {Point} point - The new end point
   */
  set end(point) {
    this.setPoints(this._start, point);
  }

  /**
   * Get the length of the line
   * @returns {number} - The length
   */
  getLength() {
    if (!this._start || !this._end) {
      return 0;
    }
    
    return this._start.distanceTo(this._end);
  }

  /**
   * Get the angle of the line in radians
   * @returns {number} - The angle in radians
   */
  getAngle() {
    if (!this._start || !this._end) {
      return 0;
    }
    
    return this._start.angleTo(this._end);
  }

  /**
   * Get the angle of the line in degrees
   * @returns {number} - The angle in degrees
   */
  getAngleDegrees() {
    return this.getAngle() * 180 / Math.PI;
  }

  /**
   * Get the midpoint of the line
   * @returns {Object} - The midpoint as {x, y}
   */
  getMidpoint() {
    if (!this._start || !this._end) {
      return { x: 0, y: 0 };
    }
    
    return {
      x: (this._start.x + this._end.x) / 2,
      y: (this._start.y + this._end.y) / 2
    };
  }

  /**
   * Check if the line contains a point
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} [tolerance=5] - Distance tolerance
   * @returns {boolean} - Whether the line contains the point
   */
  containsPoint(x, y, tolerance = 5) {
    if (!this._start || !this._end) {
      return false;
    }
    
    // Calculate the distance from the point to the line segment
    const x1 = this._start.x;
    const y1 = this._start.y;
    const x2 = this._end.x;
    const y2 = this._end.y;
    
    // Vector from start to end
    const dx = x2 - x1;
    const dy = y2 - y1;
    
    // Length squared of the line segment
    const lenSq = dx * dx + dy * dy;
    
    // If the line is just a point, check distance to that point
    if (lenSq === 0) {
      const distance = Math.sqrt((x - x1) * (x - x1) + (y - y1) * (y - y1));
      return distance <= tolerance;
    }
    
    // Calculate projection of the point onto the line
    const t = ((x - x1) * dx + (y - y1) * dy) / lenSq;
    
    // If t is outside [0,1], the closest point is one of the endpoints
    if (t < 0) {
      const distance = Math.sqrt((x - x1) * (x - x1) + (y - y1) * (y - y1));
      return distance <= tolerance;
    }
    
    if (t > 1) {
      const distance = Math.sqrt((x - x2) * (x - x2) + (y - y2) * (y - y2));
      return distance <= tolerance;
    }
    
    // Closest point on the line segment
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;
    
    // Distance from the point to the closest point on the line
    const distance = Math.sqrt((x - closestX) * (x - closestX) + (y - closestY) * (y - closestY));
    
    return distance <= tolerance;
  }

  /**
   * Get a point on the line at a specific parameter value
   * @param {number} t - Parameter value (0 = start, 1 = end)
   * @returns {Object} - The point as {x, y}
   */
  getPointAt(t) {
    if (!this._start || !this._end) {
      return { x: 0, y: 0 };
    }
    
    return {
      x: this._start.x + t * (this._end.x - this._start.x),
      y: this._start.y + t * (this._end.y - this._start.y)
    };
  }

  /**
   * Check if this line is parallel to another line
   * @param {Line} line - The other line
   * @param {number} [tolerance=0.001] - Angle tolerance in radians
   * @returns {boolean} - Whether the lines are parallel
   */
  isParallelTo(line, tolerance = 0.001) {
    const angle1 = this.getAngle();
    const angle2 = line.getAngle();
    
    // Normalize the angle difference to [-PI, PI]
    let diff = (angle1 - angle2) % (2 * Math.PI);
    if (diff > Math.PI) diff -= 2 * Math.PI;
    if (diff < -Math.PI) diff += 2 * Math.PI;
    
    return Math.abs(diff) < tolerance || Math.abs(Math.abs(diff) - Math.PI) < tolerance;
  }

  /**
   * Check if this line is perpendicular to another line
   * @param {Line} line - The other line
   * @param {number} [tolerance=0.001] - Angle tolerance in radians
   * @returns {boolean} - Whether the lines are perpendicular
   */
  isPerpendicularTo(line, tolerance = 0.001) {
    const angle1 = this.getAngle();
    const angle2 = line.getAngle();
    
    // Normalize the angle difference to [-PI, PI]
    let diff = (angle1 - angle2) % (2 * Math.PI);
    if (diff > Math.PI) diff -= 2 * Math.PI;
    if (diff < -Math.PI) diff += 2 * Math.PI;
    
    return Math.abs(Math.abs(diff) - Math.PI / 2) < tolerance;
  }

  /**
   * Clone this line
   * @param {string} [newId] - Optional new ID for the cloned line
   * @param {Point} [newStart] - Optional new start point
   * @param {Point} [newEnd] - Optional new end point
   * @returns {Line} - The cloned line
   */
  clone(newId, newStart, newEnd) {
    const id = newId || `${this.id}_clone`;
    return new Line(id, newStart || this._start, newEnd || this._end, { ...this.properties });
  }

  /**
   * Convert to a simple object for serialization
   * @returns {Object} - Simple object representation
   */
  toObject() {
    return {
      ...super.toObject(),
      start: this._start ? this._start.id : null,
      end: this._end ? this._end.id : null
    };
  }
}
