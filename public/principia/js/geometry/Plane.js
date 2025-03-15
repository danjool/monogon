/**
 * Plane - Represents a plane viewed from the side (as a line segment)
 */
import { GeometricElement } from './GeometricElement.js';
import { Point } from './Point.js';
import { Line } from './Line.js';

export class Plane extends GeometricElement {
  /**
   * Create a new plane
   * @param {string} id - Unique identifier for the plane
   * @param {Point|Object} start - Start point or {x, y} coordinates
   * @param {Point|Object} end - End point or {x, y} coordinates
   * @param {Object} properties - Additional properties
   */
  constructor(id, start, end, properties = {}) {
    super(id, {
      width: 1,
      ...properties
    });
    
    this._start = null;
    this._end = null;
    this._startCoords = null;
    this._endCoords = null;
    
    // Set points
    this.setPoints(start, end);
  }

  /**
   * Set the points for this plane
   * @param {Point|Object} start - Start point or {x, y} coordinates
   * @param {Point|Object} end - End point or {x, y} coordinates
   * @returns {Plane} - This plane for chaining
   */
  setPoints(start, end) {
    // Remove existing dependencies if any
    if (this._start) {
      this.removeDependency(this._start);
      this._start = null;
    }
    
    if (this._end) {
      this.removeDependency(this._end);
      this._end = null;
    }
    
    // Set new points or coordinates
    if (start instanceof Point) {
      this._start = start;
      this._startCoords = null;
      this.addDependency(start);
    } else if (start && typeof start.x === 'number' && typeof start.y === 'number') {
      this._startCoords = { x: start.x, y: start.y };
    }
    
    if (end instanceof Point) {
      this._end = end;
      this._endCoords = null;
      this.addDependency(end);
    } else if (end && typeof end.x === 'number' && typeof end.y === 'number') {
      this._endCoords = { x: end.x, y: end.y };
    }
    
    this.emit('points-changed', { start, end });
    
    return this;
  }

  /**
   * Get the start point coordinates
   * @returns {Object} - The start point as {x, y}
   */
  getStartCoordinates() {
    if (this._start) {
      return { x: this._start.x, y: this._start.y };
    }
    
    if (this._startCoords) {
      return { ...this._startCoords };
    }
    
    return { x: 0, y: 0 };
  }

  /**
   * Get the end point coordinates
   * @returns {Object} - The end point as {x, y}
   */
  getEndCoordinates() {
    if (this._end) {
      return { x: this._end.x, y: this._end.y };
    }
    
    if (this._endCoords) {
      return { ...this._endCoords };
    }
    
    return { x: 0, y: 0 };
  }

  /**
   * Get the start point
   * @returns {Point|null} - The start point or null if using coordinates
   */
  get start() {
    return this._start;
  }

  /**
   * Get the end point
   * @returns {Point|null} - The end point or null if using coordinates
   */
  get end() {
    return this._end;
  }

  /**
   * Set the start point
   * @param {Point|Object} point - The new start point or coordinates
   */
  set start(point) {
    this.setPoints(point, this._end || this._endCoords);
  }

  /**
   * Set the end point
   * @param {Point|Object} point - The new end point or coordinates
   */
  set end(point) {
    this.setPoints(this._start || this._startCoords, point);
  }

  /**
   * Get the length of the plane segment
   * @returns {number} - The length
   */
  getLength() {
    const start = this.getStartCoordinates();
    const end = this.getEndCoordinates();
    
    return Math.sqrt(
      Math.pow(end.x - start.x, 2) + 
      Math.pow(end.y - start.y, 2)
    );
  }

  /**
   * Get the angle of the plane in radians
   * @returns {number} - The angle in radians
   */
  getAngle() {
    const start = this.getStartCoordinates();
    const end = this.getEndCoordinates();
    
    return Math.atan2(end.y - start.y, end.x - start.x);
  }

  /**
   * Get the angle of the plane in degrees
   * @returns {number} - The angle in degrees
   */
  getAngleDegrees() {
    return this.getAngle() * 180 / Math.PI;
  }

  /**
   * Get the midpoint of the plane segment
   * @returns {Object} - The midpoint as {x, y}
   */
  getMidpoint() {
    const start = this.getStartCoordinates();
    const end = this.getEndCoordinates();
    
    return {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2
    };
  }

  /**
   * Get the normal vector to the plane
   * @returns {Object} - The normal vector as {x, y}
   */
  getNormal() {
    const angle = this.getAngle();
    
    return {
      x: Math.cos(angle + Math.PI / 2),
      y: Math.sin(angle + Math.PI / 2)
    };
  }

  /**
   * Check if the plane contains a point
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} [tolerance=5] - Distance tolerance
   * @returns {boolean} - Whether the plane contains the point
   */
  containsPoint(x, y, tolerance = 5) {
    const start = this.getStartCoordinates();
    const end = this.getEndCoordinates();
    
    // Calculate the distance from the point to the line segment
    const x1 = start.x;
    const y1 = start.y;
    const x2 = end.x;
    const y2 = end.y;
    
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
   * Get a point on the plane at a specific parameter value
   * @param {number} t - Parameter value (0 = start, 1 = end)
   * @returns {Object} - The point as {x, y}
   */
  getPointAt(t) {
    const start = this.getStartCoordinates();
    const end = this.getEndCoordinates();
    
    return {
      x: start.x + t * (end.x - start.x),
      y: start.y + t * (end.y - start.y)
    };
  }

  /**
   * Check if this plane is parallel to another plane or line
   * @param {Plane|Line} other - The other plane or line
   * @param {number} [tolerance=0.001] - Angle tolerance in radians
   * @returns {boolean} - Whether the planes are parallel
   */
  isParallelTo(other, tolerance = 0.001) {
    let otherAngle;
    
    if (other instanceof Plane || other instanceof Line) {
      otherAngle = other.getAngle();
    } else {
      return false;
    }
    
    const angle1 = this.getAngle();
    const angle2 = otherAngle;
    
    // Normalize the angle difference to [-PI, PI]
    let diff = (angle1 - angle2) % (2 * Math.PI);
    if (diff > Math.PI) diff -= 2 * Math.PI;
    if (diff < -Math.PI) diff += 2 * Math.PI;
    
    return Math.abs(diff) < tolerance || Math.abs(Math.abs(diff) - Math.PI) < tolerance;
  }

  /**
   * Check if this plane is perpendicular to another plane or line
   * @param {Plane|Line} other - The other plane or line
   * @param {number} [tolerance=0.001] - Angle tolerance in radians
   * @returns {boolean} - Whether the planes are perpendicular
   */
  isPerpendicularTo(other, tolerance = 0.001) {
    let otherAngle;
    
    if (other instanceof Plane || other instanceof Line) {
      otherAngle = other.getAngle();
    } else {
      return false;
    }
    
    const angle1 = this.getAngle();
    const angle2 = otherAngle;
    
    // Normalize the angle difference to [-PI, PI]
    let diff = (angle1 - angle2) % (2 * Math.PI);
    if (diff > Math.PI) diff -= 2 * Math.PI;
    if (diff < -Math.PI) diff += 2 * Math.PI;
    
    return Math.abs(Math.abs(diff) - Math.PI / 2) < tolerance;
  }

  /**
   * Get the intersection point with another plane or line
   * @param {Plane|Line} other - The other plane or line
   * @returns {Object|null} - The intersection point as {x, y} or null if no intersection
   */
  getIntersectionWith(other) {
    let otherStart, otherEnd;
    
    if (other instanceof Plane) {
      otherStart = other.getStartCoordinates();
      otherEnd = other.getEndCoordinates();
    } else if (other instanceof Line) {
      if (!other.start || !other.end) {
        return null;
      }
      otherStart = { x: other.start.x, y: other.start.y };
      otherEnd = { x: other.end.x, y: other.end.y };
    } else {
      return null;
    }
    
    const start = this.getStartCoordinates();
    const end = this.getEndCoordinates();
    
    // Line 1 represented as a1x + b1y = c1
    const a1 = end.y - start.y;
    const b1 = start.x - end.x;
    const c1 = a1 * start.x + b1 * start.y;
    
    // Line 2 represented as a2x + b2y = c2
    const a2 = otherEnd.y - otherStart.y;
    const b2 = otherStart.x - otherEnd.x;
    const c2 = a2 * otherStart.x + b2 * otherStart.y;
    
    const determinant = a1 * b2 - a2 * b1;
    
    if (determinant === 0) {
      return null; // Lines are parallel
    }
    
    const x = (b2 * c1 - b1 * c2) / determinant;
    const y = (a1 * c2 - a2 * c1) / determinant;
    
    // Check if the intersection point is on both line segments
    const onLine1 = this.containsPoint(x, y, 0.001);
    const onLine2 = other.containsPoint(x, y, 0.001);
    
    if (onLine1 && onLine2) {
      return { x, y };
    }
    
    return null;
  }

  /**
   * Clone this plane
   * @param {string} [newId] - Optional new ID for the cloned plane
   * @returns {Plane} - The cloned plane
   */
  clone(newId) {
    const id = newId || `${this.id}_clone`;
    return new Plane(
      id,
      this._start || this._startCoords,
      this._end || this._endCoords,
      { ...this.properties }
    );
  }

  /**
   * Convert to a simple object for serialization
   * @returns {Object} - Simple object representation
   */
  toObject() {
    const start = this.getStartCoordinates();
    const end = this.getEndCoordinates();
    
    return {
      ...super.toObject(),
      start: this._start ? this._start.id : start,
      end: this._end ? this._end.id : end
    };
  }
}
