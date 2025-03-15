/**
 * Triangle - Represents a triangle formed by three points
 */
import { GeometricElement } from './GeometricElement.js';
import { Point } from './Point.js';
import { Line } from './Line.js';

export class Triangle extends GeometricElement {
  /**
   * Create a new triangle
   * @param {string} id - Unique identifier for the triangle
   * @param {Point} a - First vertex
   * @param {Point} b - Second vertex
   * @param {Point} c - Third vertex
   * @param {Object} properties - Additional properties
   */
  constructor(id, a, b, c, properties = {}) {
    super(id, {
      fillOpacity: 0.1,
      strokeWidth: 1,
      ...properties
    });
    
    this._vertices = {
      a: null,
      b: null,
      c: null
    };
    
    // Set vertices and establish dependencies
    this.setVertices(a, b, c);
  }

  /**
   * Set the vertices of the triangle
   * @param {Point} a - First vertex
   * @param {Point} b - Second vertex
   * @param {Point} c - Third vertex
   * @returns {Triangle} - This triangle for chaining
   */
  setVertices(a, b, c) {
    // Remove existing dependencies
    if (this._vertices.a) this.removeDependency(this._vertices.a);
    if (this._vertices.b) this.removeDependency(this._vertices.b);
    if (this._vertices.c) this.removeDependency(this._vertices.c);
    
    // Set new vertices
    this._vertices.a = a instanceof Point ? a : null;
    this._vertices.b = b instanceof Point ? b : null;
    this._vertices.c = c instanceof Point ? c : null;
    
    // Add dependencies
    if (this._vertices.a) this.addDependency(this._vertices.a);
    if (this._vertices.b) this.addDependency(this._vertices.b);
    if (this._vertices.c) this.addDependency(this._vertices.c);
    
    this.emit('vertices-changed', this._vertices);
    
    return this;
  }

  /**
   * Get a vertex by name
   * @param {string} name - Vertex name ('a', 'b', or 'c')
   * @returns {Point} - The vertex
   */
  getVertex(name) {
    return this._vertices[name] || null;
  }

  /**
   * Get all vertices
   * @returns {Object} - Object with vertices {a, b, c}
   */
  get vertices() {
    return { ...this._vertices };
  }

  /**
   * Get the first vertex
   * @returns {Point} - The first vertex
   */
  get a() {
    return this._vertices.a;
  }

  /**
   * Get the second vertex
   * @returns {Point} - The second vertex
   */
  get b() {
    return this._vertices.b;
  }

  /**
   * Get the third vertex
   * @returns {Point} - The third vertex
   */
  get c() {
    return this._vertices.c;
  }

  /**
   * Set the first vertex
   * @param {Point} point - The new vertex
   */
  set a(point) {
    this.setVertices(point, this._vertices.b, this._vertices.c);
  }

  /**
   * Set the second vertex
   * @param {Point} point - The new vertex
   */
  set b(point) {
    this.setVertices(this._vertices.a, point, this._vertices.c);
  }

  /**
   * Set the third vertex
   * @param {Point} point - The new vertex
   */
  set c(point) {
    this.setVertices(this._vertices.a, this._vertices.b, point);
  }

  /**
   * Get the sides of the triangle as lines
   * @returns {Object} - Object with sides {ab, bc, ca}
   */
  getSides() {
    const { a, b, c } = this._vertices;
    
    if (!a || !b || !c) {
      return { ab: null, bc: null, ca: null };
    }
    
    return {
      ab: new Line(`${this.id}_ab`, a, b),
      bc: new Line(`${this.id}_bc`, b, c),
      ca: new Line(`${this.id}_ca`, c, a)
    };
  }

  /**
   * Get the perimeter of the triangle
   * @returns {number} - The perimeter
   */
  getPerimeter() {
    const { a, b, c } = this._vertices;
    
    if (!a || !b || !c) {
      return 0;
    }
    
    return a.distanceTo(b) + b.distanceTo(c) + c.distanceTo(a);
  }

  /**
   * Get the area of the triangle
   * @returns {number} - The area
   */
  getArea() {
    const { a, b, c } = this._vertices;
    
    if (!a || !b || !c) {
      return 0;
    }
    
    // Using the cross product method
    return 0.5 * Math.abs(
      (b.x - a.x) * (c.y - a.y) - 
      (c.x - a.x) * (b.y - a.y)
    );
  }

  /**
   * Get the centroid of the triangle
   * @returns {Object} - The centroid as {x, y}
   */
  getCentroid() {
    const { a, b, c } = this._vertices;
    
    if (!a || !b || !c) {
      return { x: 0, y: 0 };
    }
    
    return {
      x: (a.x + b.x + c.x) / 3,
      y: (a.y + b.y + c.y) / 3
    };
  }

  /**
   * Get the circumcenter of the triangle
   * @returns {Object} - The circumcenter as {x, y}
   */
  getCircumcenter() {
    const { a, b, c } = this._vertices;
    
    if (!a || !b || !c) {
      return { x: 0, y: 0 };
    }
    
    // Calculate the perpendicular bisector of two sides
    const abMidpoint = {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2
    };
    
    const bcMidpoint = {
      x: (b.x + c.x) / 2,
      y: (b.y + c.y) / 2
    };
    
    // Perpendicular slopes
    let abSlope = (b.x - a.x) !== 0 ? -(b.y - a.y) / (b.x - a.x) : Infinity;
    let bcSlope = (c.x - b.x) !== 0 ? -(c.y - b.y) / (c.x - b.x) : Infinity;
    
    // Handle vertical lines
    if (!isFinite(abSlope) && !isFinite(bcSlope)) {
      // Both perpendicular bisectors are horizontal
      return { x: 0, y: 0 }; // Degenerate case
    }
    
    if (!isFinite(abSlope)) {
      // First perpendicular bisector is horizontal
      const bcY = bcMidpoint.y + bcSlope * (abMidpoint.x - bcMidpoint.x);
      return { x: abMidpoint.x, y: bcY };
    }
    
    if (!isFinite(bcSlope)) {
      // Second perpendicular bisector is horizontal
      const abY = abMidpoint.y + abSlope * (bcMidpoint.x - abMidpoint.x);
      return { x: bcMidpoint.x, y: abY };
    }
    
    // Intersection of the two perpendicular bisectors
    const x = (bcMidpoint.y - abMidpoint.y + abSlope * abMidpoint.x - bcSlope * bcMidpoint.x) / (abSlope - bcSlope);
    const y = abMidpoint.y + abSlope * (x - abMidpoint.x);
    
    return { x, y };
  }

  /**
   * Get the incenter of the triangle
   * @returns {Object} - The incenter as {x, y}
   */
  getIncenter() {
    const { a, b, c } = this._vertices;
    
    if (!a || !b || !c) {
      return { x: 0, y: 0 };
    }
    
    const ab = a.distanceTo(b);
    const bc = b.distanceTo(c);
    const ca = c.distanceTo(a);
    const perimeter = ab + bc + ca;
    
    if (perimeter === 0) {
      return { x: 0, y: 0 };
    }
    
    return {
      x: (a.x * bc + b.x * ca + c.x * ab) / perimeter,
      y: (a.y * bc + b.y * ca + c.y * ab) / perimeter
    };
  }

  /**
   * Get the orthocenter of the triangle
   * @returns {Object} - The orthocenter as {x, y}
   */
  getOrthocenter() {
    const { a, b, c } = this._vertices;
    
    if (!a || !b || !c) {
      return { x: 0, y: 0 };
    }
    
    // Calculate the slopes of the sides
    const abSlope = (b.y - a.y) / (b.x - a.x);
    const bcSlope = (c.y - b.y) / (c.x - b.x);
    const caSlope = (a.y - c.y) / (a.x - c.x);
    
    // Calculate the slopes of the altitudes
    const aAltitudeSlope = isFinite(bcSlope) ? -1 / bcSlope : 0;
    const bAltitudeSlope = isFinite(caSlope) ? -1 / caSlope : 0;
    
    // Calculate the y-intercepts of the altitudes
    const aAltitudeIntercept = a.y - aAltitudeSlope * a.x;
    const bAltitudeIntercept = b.y - bAltitudeSlope * b.x;
    
    // Calculate the intersection of two altitudes
    let x, y;
    
    if (!isFinite(aAltitudeSlope)) {
      x = a.x;
      y = bAltitudeSlope * x + bAltitudeIntercept;
    } else if (!isFinite(bAltitudeSlope)) {
      x = b.x;
      y = aAltitudeSlope * x + aAltitudeIntercept;
    } else {
      x = (bAltitudeIntercept - aAltitudeIntercept) / (aAltitudeSlope - bAltitudeSlope);
      y = aAltitudeSlope * x + aAltitudeIntercept;
    }
    
    return { x, y };
  }

  /**
   * Check if the triangle contains a point
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} - Whether the triangle contains the point
   */
  containsPoint(x, y) {
    const { a, b, c } = this._vertices;
    
    if (!a || !b || !c) {
      return false;
    }
    
    // Barycentric coordinate method
    const denominator = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
    
    if (denominator === 0) {
      return false; // Degenerate triangle
    }
    
    const alpha = ((b.y - c.y) * (x - c.x) + (c.x - b.x) * (y - c.y)) / denominator;
    const beta = ((c.y - a.y) * (x - c.x) + (a.x - c.x) * (y - c.y)) / denominator;
    const gamma = 1 - alpha - beta;
    
    return alpha >= 0 && beta >= 0 && gamma >= 0;
  }

  /**
   * Check if the triangle is similar to another triangle
   * @param {Triangle} triangle - The other triangle
   * @param {number} [tolerance=0.001] - Tolerance for comparison
   * @returns {boolean} - Whether the triangles are similar
   */
  isSimilarTo(triangle, tolerance = 0.001) {
    const { a: a1, b: b1, c: c1 } = this._vertices;
    const { a: a2, b: b2, c: c2 } = triangle.vertices;
    
    if (!a1 || !b1 || !c1 || !a2 || !b2 || !c2) {
      return false;
    }
    
    // Calculate side lengths
    const sides1 = [
      a1.distanceTo(b1),
      b1.distanceTo(c1),
      c1.distanceTo(a1)
    ].sort((a, b) => a - b);
    
    const sides2 = [
      a2.distanceTo(b2),
      b2.distanceTo(c2),
      c2.distanceTo(a2)
    ].sort((a, b) => a - b);
    
    // Check if the ratios of corresponding sides are equal
    const ratio = sides1[0] / sides2[0];
    
    return (
      Math.abs(sides1[1] / sides2[1] - ratio) < tolerance &&
      Math.abs(sides1[2] / sides2[2] - ratio) < tolerance
    );
  }

  /**
   * Clone this triangle
   * @param {string} [newId] - Optional new ID for the cloned triangle
   * @param {Point} [newA] - Optional new first vertex
   * @param {Point} [newB] - Optional new second vertex
   * @param {Point} [newC] - Optional new third vertex
   * @returns {Triangle} - The cloned triangle
   */
  clone(newId, newA, newB, newC) {
    const id = newId || `${this.id}_clone`;
    return new Triangle(
      id,
      newA || this._vertices.a,
      newB || this._vertices.b,
      newC || this._vertices.c,
      { ...this.properties }
    );
  }

  /**
   * Convert to a simple object for serialization
   * @returns {Object} - Simple object representation
   */
  toObject() {
    return {
      ...super.toObject(),
      vertices: {
        a: this._vertices.a ? this._vertices.a.id : null,
        b: this._vertices.b ? this._vertices.b.id : null,
        c: this._vertices.c ? this._vertices.c.id : null
      }
    };
  }
}
