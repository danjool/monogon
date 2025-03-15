/**
 * PointOnCircle - Constraint that keeps a point on a circle's circumference
 */
import { Constraint } from './Constraint.js';
import { Point } from '../geometry/Point.js';
import { Circle } from '../geometry/Circle.js';

export class PointOnCircle extends Constraint {
  /**
   * Create a new PointOnCircle constraint
   * @param {Point} point - The point to constrain
   * @param {Circle|Point} circleOrCenter - The circle or center point
   * @param {Point|number} radiusPointOrValue - The radius point or radius value
   * @param {number} [priority=1] - Priority of the constraint
   */
  constructor(point, circleOrCenter, radiusPointOrValue, priority = 1) {
    super(priority);
    
    this._point = null;
    this._circle = null;
    this._center = null;
    this._radiusPoint = null;
    this._radiusValue = null;
    
    // Set the point
    if (point instanceof Point) {
      this._point = point;
      this.addElement(point);
    } else {
      throw new Error('PointOnCircle constraint requires a Point');
    }
    
    // Set the circle or center
    if (circleOrCenter instanceof Circle) {
      this._circle = circleOrCenter;
      this._center = circleOrCenter.center;
      this._radiusPoint = circleOrCenter.radiusPoint;
      this.addElement(circleOrCenter);
    } else if (circleOrCenter instanceof Point) {
      this._center = circleOrCenter;
      this.addElement(circleOrCenter);
    } else {
      throw new Error('PointOnCircle constraint requires a Circle or Point as center');
    }
    
    // Set the radius point or value
    if (this._circle) {
      // Already set from the circle
    } else if (radiusPointOrValue instanceof Point) {
      this._radiusPoint = radiusPointOrValue;
      this.addElement(radiusPointOrValue);
    } else if (typeof radiusPointOrValue === 'number') {
      this._radiusValue = radiusPointOrValue;
    } else {
      throw new Error('PointOnCircle constraint requires a radius point or value');
    }
  }

  /**
   * Apply the constraint to keep the point on the circle
   */
  apply() {
    if (!this.enabled || !this._point || !this._center) {
      return;
    }
    
    // Get the radius
    let radius;
    if (this._circle) {
      radius = this._circle.getRadius();
    } else if (this._radiusPoint) {
      radius = this._center.distanceTo(this._radiusPoint);
    } else if (this._radiusValue !== null) {
      radius = this._radiusValue;
    } else {
      return; // Can't determine radius
    }
    
    // Calculate the current distance from center to point
    const currentDistance = this._center.distanceTo(this._point);
    
    // If the point is already on the circle (within a small tolerance), do nothing
    if (Math.abs(currentDistance - radius) < 0.001) {
      return;
    }
    
    // Calculate the angle from center to point
    const angle = this._center.angleTo(this._point);
    
    // Project the point onto the circle
    const newX = this._center.x + radius * Math.cos(angle);
    const newY = this._center.y + radius * Math.sin(angle);
    
    // Move the point to the new position
    this._point.moveTo(newX, newY);
  }

  /**
   * Get the constrained point
   * @returns {Point} - The constrained point
   */
  get point() {
    return this._point;
  }

  /**
   * Get the circle
   * @returns {Circle|null} - The circle or null if using center and radius
   */
  get circle() {
    return this._circle;
  }

  /**
   * Get the center point
   * @returns {Point} - The center point
   */
  get center() {
    return this._center;
  }

  /**
   * Get the radius point
   * @returns {Point|null} - The radius point or null if using a fixed radius
   */
  get radiusPoint() {
    return this._radiusPoint;
  }

  /**
   * Get the radius value
   * @returns {number|null} - The radius value or null if using a radius point
   */
  get radiusValue() {
    return this._radiusValue;
  }

  /**
   * Check if the constraint is valid
   * @returns {boolean} - Whether the constraint is valid
   */
  isValid() {
    const hasPoint = this._point !== null;
    const hasCenter = this._center !== null;
    const hasRadius = this._circle !== null || this._radiusPoint !== null || this._radiusValue !== null;
    
    return hasPoint && hasCenter && hasRadius;
  }

  /**
   * Convert to a simple object for serialization
   * @returns {Object} - Simple object representation
   */
  toObject() {
    return {
      ...super.toObject(),
      point: this._point ? this._point.id : null,
      circle: this._circle ? this._circle.id : null,
      center: this._center ? this._center.id : null,
      radiusPoint: this._radiusPoint ? this._radiusPoint.id : null,
      radiusValue: this._radiusValue
    };
  }
}
