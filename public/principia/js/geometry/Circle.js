/**
 * Circle - Represents a circle with a center point and radius
 */
import { GeometricElement } from './GeometricElement.js';
import { Point } from './Point.js';

export class Circle extends GeometricElement {
  /**
   * Create a new circle
   * @param {string} id - Unique identifier for the circle
   * @param {Point} center - Center point
   * @param {Point|number} radiusOrPoint - Radius value or point on the circle
   * @param {Object} properties - Additional properties
   */
  constructor(id, center, radiusOrPoint, properties = {}) {
    super(id, {
      fillOpacity: 0.2,
      strokeWidth: 1,
      ...properties
    });
    
    this._center = null;
    this._radiusPoint = null;
    this._fixedRadius = null;
    
    // Set center and radius
    this.setCenter(center);
    
    if (radiusOrPoint instanceof Point) {
      this.setRadiusPoint(radiusOrPoint);
    } else if (typeof radiusOrPoint === 'number') {
      this._fixedRadius = radiusOrPoint;
    }
  }

  /**
   * Set the center point
   * @param {Point} center - The center point
   * @returns {Circle} - This circle for chaining
   */
  setCenter(center) {
    if (this._center) {
      this.removeDependency(this._center);
    }
    
    this._center = center instanceof Point ? center : null;
    
    if (this._center) {
      this.addDependency(this._center);
    }
    
    this.emit('center-changed', this._center);
    
    return this;
  }

  /**
   * Set the radius point
   * @param {Point} point - Point on the circle that defines the radius
   * @returns {Circle} - This circle for chaining
   */
  setRadiusPoint(point) {
    if (this._radiusPoint) {
      this.removeDependency(this._radiusPoint);
    }
    
    this._radiusPoint = point instanceof Point ? point : null;
    this._fixedRadius = null; // Clear fixed radius when using a radius point
    
    if (this._radiusPoint) {
      this.addDependency(this._radiusPoint);
    }
    
    this.emit('radius-changed', this.getRadius());
    
    return this;
  }

  /**
   * Set a fixed radius value
   * @param {number} radius - The radius value
   * @returns {Circle} - This circle for chaining
   */
  setRadius(radius) {
    if (this._radiusPoint) {
      this.removeDependency(this._radiusPoint);
      this._radiusPoint = null;
    }
    
    this._fixedRadius = radius;
    
    this.emit('radius-changed', radius);
    
    return this;
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
   * @returns {Point} - The radius point
   */
  get radiusPoint() {
    return this._radiusPoint;
  }

  /**
   * Get the radius value
   * @returns {number} - The radius
   */
  getRadius() {
    if (this._fixedRadius !== null) {
      return this._fixedRadius;
    }
    
    if (this._center && this._radiusPoint) {
      return this._center.distanceTo(this._radiusPoint);
    }
    
    return 0;
  }

  /**
   * Check if a point is on the circle
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} [tolerance=5] - Distance tolerance
   * @returns {boolean} - Whether the point is on the circle
   */
  isPointOnCircle(x, y, tolerance = 5) {
    if (!this._center) {
      return false;
    }
    
    const radius = this.getRadius();
    const distance = Math.sqrt(
      Math.pow(x - this._center.x, 2) + 
      Math.pow(y - this._center.y, 2)
    );
    
    return Math.abs(distance - radius) <= tolerance;
  }

  /**
   * Check if a point is inside the circle
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} - Whether the point is inside the circle
   */
  containsPoint(x, y) {
    if (!this._center) {
      return false;
    }
    
    const radius = this.getRadius();
    const distance = Math.sqrt(
      Math.pow(x - this._center.x, 2) + 
      Math.pow(y - this._center.y, 2)
    );
    
    return distance <= radius;
  }

  /**
   * Get a point on the circle at a specific angle
   * @param {number} angle - Angle in radians
   * @returns {Object} - The point as {x, y}
   */
  getPointAtAngle(angle) {
    if (!this._center) {
      return { x: 0, y: 0 };
    }
    
    const radius = this.getRadius();
    
    return {
      x: this._center.x + radius * Math.cos(angle),
      y: this._center.y + radius * Math.sin(angle)
    };
  }

  /**
   * Get the angle of a point relative to the center
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {number} - The angle in radians
   */
  getAngleToPoint(x, y) {
    if (!this._center) {
      return 0;
    }
    
    return Math.atan2(y - this._center.y, x - this._center.x);
  }

  /**
   * Project a point onto the circle
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Object} - The projected point as {x, y}
   */
  projectPoint(x, y) {
    if (!this._center) {
      return { x, y };
    }
    
    const angle = this.getAngleToPoint(x, y);
    return this.getPointAtAngle(angle);
  }

  /**
   * Check if this circle intersects with another circle
   * @param {Circle} circle - The other circle
   * @returns {boolean} - Whether the circles intersect
   */
  intersectsWith(circle) {
    if (!this._center || !circle.center) {
      return false;
    }
    
    const distance = this._center.distanceTo(circle.center);
    const r1 = this.getRadius();
    const r2 = circle.getRadius();
    
    // Circles intersect if the distance between centers is less than the sum of radii
    // but greater than the absolute difference of radii
    return distance < (r1 + r2) && distance > Math.abs(r1 - r2);
  }

  /**
   * Get the intersection points with another circle
   * @param {Circle} circle - The other circle
   * @returns {Array} - Array of intersection points as {x, y}, empty if no intersections
   */
  getIntersectionsWith(circle) {
    if (!this._center || !circle.center || !this.intersectsWith(circle)) {
      return [];
    }
    
    const x0 = this._center.x;
    const y0 = this._center.y;
    const r0 = this.getRadius();
    
    const x1 = circle.center.x;
    const y1 = circle.center.y;
    const r1 = circle.getRadius();
    
    const d = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
    
    // Distance from center0 to the line connecting the intersection points
    const a = (r0 * r0 - r1 * r1 + d * d) / (2 * d);
    
    // Height of the triangle formed by the two centers and either intersection point
    const h = Math.sqrt(r0 * r0 - a * a);
    
    // Point on the line connecting the centers, distance a from center0
    const x2 = x0 + a * (x1 - x0) / d;
    const y2 = y0 + a * (y1 - y0) / d;
    
    // The two intersection points
    const x3 = x2 + h * (y1 - y0) / d;
    const y3 = y2 - h * (x1 - x0) / d;
    
    const x4 = x2 - h * (y1 - y0) / d;
    const y4 = y2 + h * (x1 - x0) / d;
    
    return [
      { x: x3, y: y3 },
      { x: x4, y: y4 }
    ];
  }

  /**
   * Clone this circle
   * @param {string} [newId] - Optional new ID for the cloned circle
   * @param {Point} [newCenter] - Optional new center point
   * @param {Point|number} [newRadiusOrPoint] - Optional new radius or radius point
   * @returns {Circle} - The cloned circle
   */
  clone(newId, newCenter, newRadiusOrPoint) {
    const id = newId || `${this.id}_clone`;
    const center = newCenter || this._center;
    const radiusOrPoint = newRadiusOrPoint || (this._radiusPoint || this._fixedRadius);
    
    return new Circle(id, center, radiusOrPoint, { ...this.properties });
  }

  /**
   * Convert to a simple object for serialization
   * @returns {Object} - Simple object representation
   */
  toObject() {
    return {
      ...super.toObject(),
      center: this._center ? this._center.id : null,
      radiusPoint: this._radiusPoint ? this._radiusPoint.id : null,
      fixedRadius: this._fixedRadius
    };
  }
}
