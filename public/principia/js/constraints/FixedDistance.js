/**
 * FixedDistance - Constraint that keeps two points at a fixed distance
 */
import { Constraint } from './Constraint.js';
import { Point } from '../geometry/Point.js';

export class FixedDistance extends Constraint {
  /**
   * Create a new FixedDistance constraint
   * @param {Point} point1 - First point
   * @param {Point} point2 - Second point
   * @param {number} [distance] - The fixed distance (if not provided, uses current distance)
   * @param {number} [priority=1] - Priority of the constraint
   */
  constructor(point1, point2, distance, priority = 1) {
    super(priority);
    
    this._point1 = null;
    this._point2 = null;
    this._distance = null;
    this._adjustablePoint = 2; // Which point to adjust (1 or 2)
    
    // Set the points
    if (point1 instanceof Point) {
      this._point1 = point1;
      this.addElement(point1);
    } else {
      throw new Error('FixedDistance constraint requires Points');
    }
    
    if (point2 instanceof Point) {
      this._point2 = point2;
      this.addElement(point2);
    } else {
      throw new Error('FixedDistance constraint requires Points');
    }
    
    // Set the distance
    if (typeof distance === 'number') {
      this._distance = Math.max(0, distance);
    } else {
      // Use current distance between points
      this._distance = this._point1.distanceTo(this._point2);
    }
    
    // Determine which point to adjust
    if (!this._point1.properties.draggable) {
      // Point 1 is not draggable, so adjust point 2
      this._adjustablePoint = 2;
    } else if (!this._point2.properties.draggable) {
      // Point 2 is not draggable, so adjust point 1
      this._adjustablePoint = 1;
    } else {
      // Both points are draggable, so adjust point 2 by default
      this._adjustablePoint = 2;
    }
  }

  /**
   * Apply the constraint to keep the points at the fixed distance
   */
  apply() {
    if (!this.enabled || !this.isValid()) {
      return;
    }
    
    // Calculate the current distance
    const currentDistance = this._point1.distanceTo(this._point2);
    
    // If the distance is already correct (within a small tolerance), do nothing
    if (Math.abs(currentDistance - this._distance) < 0.001) {
      return;
    }
    
    // Adjust one of the points to maintain the fixed distance
    if (this._adjustablePoint === 1) {
      this.adjustPoint1();
    } else {
      this.adjustPoint2();
    }
  }

  /**
   * Adjust point 1 to maintain the fixed distance
   */
  adjustPoint1() {
    if (!this._point1.properties.draggable) {
      return;
    }
    
    // Calculate the angle from point 2 to point 1
    const angle = this._point2.angleTo(this._point1);
    
    // Calculate the new position for point 1
    const newX = this._point2.x + this._distance * Math.cos(angle);
    const newY = this._point2.y + this._distance * Math.sin(angle);
    
    // Move point 1
    this._point1.moveTo(newX, newY);
  }

  /**
   * Adjust point 2 to maintain the fixed distance
   */
  adjustPoint2() {
    if (!this._point2.properties.draggable) {
      return;
    }
    
    // Calculate the angle from point 1 to point 2
    const angle = this._point1.angleTo(this._point2);
    
    // Calculate the new position for point 2
    const newX = this._point1.x + this._distance * Math.cos(angle);
    const newY = this._point1.y + this._distance * Math.sin(angle);
    
    // Move point 2
    this._point2.moveTo(newX, newY);
  }

  /**
   * Get the first point
   * @returns {Point} - The first point
   */
  get point1() {
    return this._point1;
  }

  /**
   * Get the second point
   * @returns {Point} - The second point
   */
  get point2() {
    return this._point2;
  }

  /**
   * Get the fixed distance
   * @returns {number} - The fixed distance
   */
  get distance() {
    return this._distance;
  }

  /**
   * Set the fixed distance
   * @param {number} distance - The new fixed distance
   * @returns {FixedDistance} - This constraint for chaining
   */
  setDistance(distance) {
    this._distance = Math.max(0, distance);
    return this;
  }

  /**
   * Set which point to adjust
   * @param {number} pointNumber - The point to adjust (1 or 2)
   * @returns {FixedDistance} - This constraint for chaining
   */
  setAdjustablePoint(pointNumber) {
    if (pointNumber === 1 || pointNumber === 2) {
      this._adjustablePoint = pointNumber;
    }
    return this;
  }

  /**
   * Get which point is being adjusted
   * @returns {number} - The point being adjusted (1 or 2)
   */
  getAdjustablePoint() {
    return this._adjustablePoint;
  }

  /**
   * Check if the constraint is valid
   * @returns {boolean} - Whether the constraint is valid
   */
  isValid() {
    return this._point1 !== null && this._point2 !== null && this._distance !== null;
  }

  /**
   * Convert to a simple object for serialization
   * @returns {Object} - Simple object representation
   */
  toObject() {
    return {
      ...super.toObject(),
      point1: this._point1 ? this._point1.id : null,
      point2: this._point2 ? this._point2.id : null,
      distance: this._distance,
      adjustablePoint: this._adjustablePoint
    };
  }
}
