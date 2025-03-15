/**
 * Collinear - Constraint that ensures points lie on the same line
 */
import { Constraint } from './Constraint.js';
import { Point } from '../geometry/Point.js';

export class Collinear extends Constraint {
  /**
   * Create a new Collinear constraint
   * @param {Array<Point>} points - The points to constrain
   * @param {number} [priority=1] - Priority of the constraint
   */
  constructor(points, priority = 1) {
    super(priority);
    
    this._points = [];
    
    // Add points
    if (Array.isArray(points)) {
      for (const point of points) {
        if (point instanceof Point) {
          this._points.push(point);
          this.addElement(point);
        }
      }
    }
    
    // Need at least 3 points for collinearity
    if (this._points.length < 3) {
      console.warn('Collinear constraint requires at least 3 points');
    }
  }

  /**
   * Apply the constraint to keep the points collinear
   */
  apply() {
    if (!this.enabled || this._points.length < 3) {
      return;
    }
    
    // We'll use the first two points to define the line
    const p1 = this._points[0];
    const p2 = this._points[1];
    
    // Calculate the line parameters (ax + by + c = 0)
    const a = p2.y - p1.y;
    const b = p1.x - p2.x;
    const c = p2.x * p1.y - p1.x * p2.y;
    
    // Normalize the line equation
    const norm = Math.sqrt(a * a + b * b);
    const aNorm = a / norm;
    const bNorm = b / norm;
    const cNorm = c / norm;
    
    // Project all other points onto the line
    for (let i = 2; i < this._points.length; i++) {
      const point = this._points[i];
      
      // Calculate the distance from the point to the line
      const distance = Math.abs(aNorm * point.x + bNorm * point.y + cNorm);
      
      // If the point is already on the line (within a small tolerance), do nothing
      if (distance < 0.001) {
        continue;
      }
      
      // Project the point onto the line
      const x = point.x - aNorm * distance;
      const y = point.y - bNorm * distance;
      
      // Move the point to the new position
      point.moveTo(x, y);
    }
  }

  /**
   * Get the constrained points
   * @returns {Array<Point>} - The constrained points
   */
  get points() {
    return [...this._points];
  }

  /**
   * Check if the constraint is valid
   * @returns {boolean} - Whether the constraint is valid
   */
  isValid() {
    return this._points.length >= 3;
  }

  /**
   * Convert to a simple object for serialization
   * @returns {Object} - Simple object representation
   */
  toObject() {
    return {
      ...super.toObject(),
      points: this._points.map(point => point.id)
    };
  }
}
