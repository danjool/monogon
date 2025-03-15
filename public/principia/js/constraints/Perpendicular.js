/**
 * Perpendicular - Constraint that keeps two lines perpendicular
 */
import { Constraint } from './Constraint.js';
import { Line } from '../geometry/Line.js';
import { Point } from '../geometry/Point.js';

export class Perpendicular extends Constraint {
  /**
   * Create a new Perpendicular constraint
   * @param {Line|Point} line1OrStart1 - First line or start point of first line
   * @param {Point} [end1] - End point of first line (if start point provided)
   * @param {Line|Point} line2OrStart2 - Second line or start point of second line
   * @param {Point} [end2] - End point of second line (if start point provided)
   * @param {number} [priority=1] - Priority of the constraint
   */
  constructor(line1OrStart1, end1, line2OrStart2, end2, priority = 1) {
    super(priority);
    
    this._line1 = null;
    this._line2 = null;
    this._start1 = null;
    this._end1 = null;
    this._start2 = null;
    this._end2 = null;
    this._adjustableLine = 2; // Which line to adjust (1 or 2)
    
    // Parse arguments
    if (line1OrStart1 instanceof Line) {
      // First argument is a Line
      this._line1 = line1OrStart1;
      this._start1 = line1OrStart1.start;
      this._end1 = line1OrStart1.end;
      this.addElement(line1OrStart1);
      
      if (line2OrStart2 instanceof Line) {
        // Third argument is a Line
        this._line2 = line2OrStart2;
        this._start2 = line2OrStart2.start;
        this._end2 = line2OrStart2.end;
        this.addElement(line2OrStart2);
      } else if (line2OrStart2 instanceof Point && end2 instanceof Point) {
        // Third and fourth arguments are Points
        this._start2 = line2OrStart2;
        this._end2 = end2;
        this.addElement(line2OrStart2);
        this.addElement(end2);
      } else {
        throw new Error('Invalid arguments for Perpendicular constraint');
      }
    } else if (line1OrStart1 instanceof Point && end1 instanceof Point) {
      // First and second arguments are Points
      this._start1 = line1OrStart1;
      this._end1 = end1;
      this.addElement(line1OrStart1);
      this.addElement(end1);
      
      if (line2OrStart2 instanceof Line) {
        // Third argument is a Line
        this._line2 = line2OrStart2;
        this._start2 = line2OrStart2.start;
        this._end2 = line2OrStart2.end;
        this.addElement(line2OrStart2);
      } else if (line2OrStart2 instanceof Point && end2 instanceof Point) {
        // Third and fourth arguments are Points
        this._start2 = line2OrStart2;
        this._end2 = end2;
        this.addElement(line2OrStart2);
        this.addElement(end2);
      } else {
        throw new Error('Invalid arguments for Perpendicular constraint');
      }
    } else {
      throw new Error('Invalid arguments for Perpendicular constraint');
    }
    
    // Determine which line to adjust
    if (this._line1 && !this._line1.start.properties.draggable && !this._line1.end.properties.draggable) {
      // Line 1 is not draggable, so adjust line 2
      this._adjustableLine = 2;
    } else if (this._line2 && !this._line2.start.properties.draggable && !this._line2.end.properties.draggable) {
      // Line 2 is not draggable, so adjust line 1
      this._adjustableLine = 1;
    } else {
      // Both lines are draggable, so adjust line 2 by default
      this._adjustableLine = 2;
    }
  }

  /**
   * Apply the constraint to keep the lines perpendicular
   */
  apply() {
    if (!this.enabled || !this.isValid()) {
      return;
    }
    
    // Get the angles of the lines
    const angle1 = this.getAngle1();
    const angle2 = this.getAngle2();
    
    // If the lines are already perpendicular (within a small tolerance), do nothing
    if (this.areAnglesPerpendicular(angle1, angle2)) {
      return;
    }
    
    // Adjust one of the lines to make them perpendicular
    if (this._adjustableLine === 1) {
      this.adjustLine1ToPerpendicular(angle2);
    } else {
      this.adjustLine2ToPerpendicular(angle1);
    }
  }

  /**
   * Get the angle of the first line
   * @returns {number} - The angle in radians
   */
  getAngle1() {
    if (this._line1) {
      return this._line1.getAngle();
    } else if (this._start1 && this._end1) {
      return this._start1.angleTo(this._end1);
    }
    return 0;
  }

  /**
   * Get the angle of the second line
   * @returns {number} - The angle in radians
   */
  getAngle2() {
    if (this._line2) {
      return this._line2.getAngle();
    } else if (this._start2 && this._end2) {
      return this._start2.angleTo(this._end2);
    }
    return 0;
  }

  /**
   * Check if two angles represent perpendicular lines
   * @param {number} angle1 - First angle in radians
   * @param {number} angle2 - Second angle in radians
   * @param {number} [tolerance=0.001] - Angle tolerance in radians
   * @returns {boolean} - Whether the angles represent perpendicular lines
   */
  areAnglesPerpendicular(angle1, angle2, tolerance = 0.001) {
    // Normalize the angle difference to [-PI, PI]
    let diff = Math.abs((angle1 - angle2) % Math.PI);
    if (diff > Math.PI / 2) diff = Math.PI - diff;
    
    return Math.abs(diff - Math.PI / 2) < tolerance;
  }

  /**
   * Adjust the first line to be perpendicular to the second line
   * @param {number} targetAngle - The target angle in radians
   */
  adjustLine1ToPerpendicular(targetAngle) {
    if (!this._start1 || !this._end1 || !this._start1.properties.draggable) {
      return;
    }
    
    // Calculate the perpendicular angle (add 90 degrees)
    const perpendicularAngle = (targetAngle + Math.PI / 2) % (2 * Math.PI);
    
    // Keep the start point fixed and rotate the end point
    const length = this._start1.distanceTo(this._end1);
    const newX = this._start1.x + length * Math.cos(perpendicularAngle);
    const newY = this._start1.y + length * Math.sin(perpendicularAngle);
    
    this._end1.moveTo(newX, newY);
  }

  /**
   * Adjust the second line to be perpendicular to the first line
   * @param {number} targetAngle - The target angle in radians
   */
  adjustLine2ToPerpendicular(targetAngle) {
    if (!this._start2 || !this._end2 || !this._start2.properties.draggable) {
      return;
    }
    
    // Calculate the perpendicular angle (add 90 degrees)
    const perpendicularAngle = (targetAngle + Math.PI / 2) % (2 * Math.PI);
    
    // Keep the start point fixed and rotate the end point
    const length = this._start2.distanceTo(this._end2);
    const newX = this._start2.x + length * Math.cos(perpendicularAngle);
    const newY = this._start2.y + length * Math.sin(perpendicularAngle);
    
    this._end2.moveTo(newX, newY);
  }

  /**
   * Set which line to adjust
   * @param {number} lineNumber - The line to adjust (1 or 2)
   * @returns {Perpendicular} - This constraint for chaining
   */
  setAdjustableLine(lineNumber) {
    if (lineNumber === 1 || lineNumber === 2) {
      this._adjustableLine = lineNumber;
    }
    return this;
  }

  /**
   * Get which line is being adjusted
   * @returns {number} - The line being adjusted (1 or 2)
   */
  getAdjustableLine() {
    return this._adjustableLine;
  }

  /**
   * Check if the constraint is valid
   * @returns {boolean} - Whether the constraint is valid
   */
  isValid() {
    const hasLine1 = (this._line1 !== null) || (this._start1 !== null && this._end1 !== null);
    const hasLine2 = (this._line2 !== null) || (this._start2 !== null && this._end2 !== null);
    
    return hasLine1 && hasLine2;
  }

  /**
   * Convert to a simple object for serialization
   * @returns {Object} - Simple object representation
   */
  toObject() {
    return {
      ...super.toObject(),
      line1: this._line1 ? this._line1.id : null,
      start1: this._start1 ? this._start1.id : null,
      end1: this._end1 ? this._end1.id : null,
      line2: this._line2 ? this._line2.id : null,
      start2: this._start2 ? this._start2.id : null,
      end2: this._end2 ? this._end2.id : null,
      adjustableLine: this._adjustableLine
    };
  }
}
