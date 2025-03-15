/**
 * PointOnLine - Constraint that keeps a point on a line
 */
import { Constraint } from './Constraint.js';
import { Point } from '../geometry/Point.js';
import { Line } from '../geometry/Line.js';

export class PointOnLine extends Constraint {
  /**
   * Create a new PointOnLine constraint
   * @param {Point} point - The point to constrain
   * @param {Line|Object} lineOrStart - The line or start point of the line
   * @param {Point|Object} [end] - The end point of the line (if start point provided)
   * @param {number} [priority=1] - Priority of the constraint
   */
  constructor(point, lineOrStart, end, priority = 1) {
    super(priority);
    
    this._point = null;
    this._line = null;
    this._start = null;
    this._end = null;
    
    // Set the point
    if (point instanceof Point) {
      this._point = point;
      this.addElement(point);
    } else {
      throw new Error('PointOnLine constraint requires a Point');
    }
    
    // Set the line or line points
    if (lineOrStart instanceof Line) {
      this._line = lineOrStart;
      this._start = lineOrStart.start;
      this._end = lineOrStart.end;
      this.addElement(lineOrStart);
    } else if (lineOrStart instanceof Point && end instanceof Point) {
      this._start = lineOrStart;
      this._end = end;
      this.addElement(lineOrStart);
      this.addElement(end);
    } else {
      throw new Error('PointOnLine constraint requires a Line or two Points');
    }
  }

  /**
   * Apply the constraint to keep the point on the line
   */
  apply() {
    if (!this.enabled || !this.isValid()) {
      return;
    }
    
    const start = this._start;
    const end = this._end;
    
    if (!start || !end) {
      return;
    }
    
    // Calculate the projection of the point onto the line
    const x1 = start.x;
    const y1 = start.y;
    const x2 = end.x;
    const y2 = end.y;
    const x3 = this._point.x;
    const y3 = this._point.y;
    
    // Vector from start to end
    const dx = x2 - x1;
    const dy = y2 - y1;
    
    // Length squared of the line segment
    const lenSq = dx * dx + dy * dy;
    
    // If the line is just a point, move the point to that point
    if (lenSq === 0) {
      this._point.moveTo(x1, y1);
      return;
    }
    
    // Calculate projection of the point onto the line
    const t = ((x3 - x1) * dx + (y3 - y1) * dy) / lenSq;
    
    // Clamp t to [0, 1] to keep the point on the line segment
    const tClamped = Math.max(0, Math.min(1, t));
    
    // Calculate the closest point on the line segment
    const closestX = x1 + tClamped * dx;
    const closestY = y1 + tClamped * dy;
    
    // Move the point to the closest point on the line
    this._point.moveTo(closestX, closestY);
  }

  /**
   * Get the constrained point
   * @returns {Point} - The constrained point
   */
  get point() {
    return this._point;
  }

  /**
   * Get the line
   * @returns {Line|null} - The line or null if using start and end points
   */
  get line() {
    return this._line;
  }

  /**
   * Get the start point of the line
   * @returns {Point} - The start point
   */
  get start() {
    return this._start;
  }

  /**
   * Get the end point of the line
   * @returns {Point} - The end point
   */
  get end() {
    return this._end;
  }

  /**
   * Get the parameter value of the point on the line
   * @returns {number} - The parameter value (0 = start, 1 = end)
   */
  getParameterValue() {
    if (!this._point || !this._start || !this._end) {
      return 0;
    }
    
    const x1 = this._start.x;
    const y1 = this._start.y;
    const x2 = this._end.x;
    const y2 = this._end.y;
    const x3 = this._point.x;
    const y3 = this._point.y;
    
    // Vector from start to end
    const dx = x2 - x1;
    const dy = y2 - y1;
    
    // Length squared of the line segment
    const lenSq = dx * dx + dy * dy;
    
    if (lenSq === 0) {
      return 0;
    }
    
    // Calculate projection of the point onto the line
    const t = ((x3 - x1) * dx + (y3 - y1) * dy) / lenSq;
    
    // Clamp t to [0, 1]
    return Math.max(0, Math.min(1, t));
  }

  /**
   * Set the parameter value of the point on the line
   * @param {number} t - The parameter value (0 = start, 1 = end)
   * @returns {PointOnLine} - This constraint for chaining
   */
  setParameterValue(t) {
    if (!this._point || !this._start || !this._end) {
      return this;
    }
    
    // Clamp t to [0, 1]
    const tClamped = Math.max(0, Math.min(1, t));
    
    // Calculate the point position
    const x = this._start.x + tClamped * (this._end.x - this._start.x);
    const y = this._start.y + tClamped * (this._end.y - this._start.y);
    
    // Move the point
    this._point.moveTo(x, y);
    
    return this;
  }

  /**
   * Check if the constraint is valid
   * @returns {boolean} - Whether the constraint is valid
   */
  isValid() {
    const hasPoint = this._point !== null;
    const hasLine = (this._line !== null) || (this._start !== null && this._end !== null);
    
    return hasPoint && hasLine;
  }

  /**
   * Convert to a simple object for serialization
   * @returns {Object} - Simple object representation
   */
  toObject() {
    return {
      ...super.toObject(),
      point: this._point ? this._point.id : null,
      line: this._line ? this._line.id : null,
      start: this._start ? this._start.id : null,
      end: this._end ? this._end.id : null
    };
  }
}
