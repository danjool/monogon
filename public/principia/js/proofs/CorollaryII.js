/**
 * CorollaryII - Implementation of Newton's Principia Corollary II
 * Demonstrates the composition and resolution of forces
 */
import { ProofBase } from './ProofBase.js';
import { PointOnCircle } from '../constraints/PointOnCircle.js';
import { Parallel } from '../constraints/Parallel.js';
import { Perpendicular } from '../constraints/Perpendicular.js';
import { PointOnLine } from '../constraints/PointOnLine.js';
import { FixedDistance } from '../constraints/FixedDistance.js';
import { AngleConstraint } from '../constraints/AngleConstraint.js';
import { Collinear } from '../constraints/Collinear.js';

export class CorollaryII extends ProofBase {
  /**
   * Create a new Corollary II proof
   * @param {Object} registry - The element registry
   * @param {Object} config - The proof configuration
   */
  constructor(registry, config = {}) {
    super(registry, config);
    
    this.id = config.id || 'corollary-ii';
    this.title = config.title || 'Corollary II';
    this.description = config.description || 'Composition and resolution of forces';
  }

  /**
   * Create a constraint from configuration
   * @param {Object} config - The constraint configuration
   * @returns {Promise<Object>} - The created constraint
   */
  async createConstraint(config) {
    const type = config.type;
    const priority = config.priority || 1;
    
    switch (type.toLowerCase()) {
      case 'pointoncircle':
        return new PointOnCircle(
          this.getElementOrCoordinates(config.point),
          this.getElementOrCoordinates(config.center),
          this.getElementOrCoordinates(config.radiusPoint) || config.radius,
          priority
        );
        
      case 'parallel':
        return new Parallel(
          this.getElementOrCoordinates(config.line1),
          this.getElementOrCoordinates(config.end1),
          this.getElementOrCoordinates(config.line2),
          this.getElementOrCoordinates(config.end2),
          priority
        );
        
      case 'perpendicular':
        // Handle both formats: with or without end points
        if (config.end1 && config.end2) {
          return new Perpendicular(
            this.getElementOrCoordinates(config.line1),
            this.getElementOrCoordinates(config.end1),
            this.getElementOrCoordinates(config.line2),
            this.getElementOrCoordinates(config.end2),
            priority
          );
        } else {
          // Use the line objects directly
          const line1 = this.registry.getElementById(config.line1);
          const line2 = this.registry.getElementById(config.line2);
          
          if (!line1 || !line2) {
            throw new Error(`Perpendicular constraint requires valid lines: ${config.line1}, ${config.line2}`);
          }
          
          return new Perpendicular(
            line1,
            null,
            line2,
            null,
            priority
          );
        }
        
      case 'pointonline':
        if (config.end) {
          return new PointOnLine(
            this.getElementOrCoordinates(config.point),
            this.getElementOrCoordinates(config.line),
            this.getElementOrCoordinates(config.end),
            priority
          );
        } else {
          const point = this.getElementOrCoordinates(config.point);
          const line = this.registry.getElementById(config.line);
          
          if (!point || !line) {
            throw new Error(`PointOnLine constraint requires valid point and line: ${config.point}, ${config.line}`);
          }
          
          return new PointOnLine(
            point,
            line,
            null,
            priority
          );
        }
        
      case 'fixeddistance':
        return new FixedDistance(
          this.getElementOrCoordinates(config.point1),
          this.getElementOrCoordinates(config.point2),
          config.distance,
          priority
        );
        
      case 'angleconstraint':
        return new AngleConstraint(
          this.getElementOrCoordinates(config.line1),
          this.getElementOrCoordinates(config.end1),
          this.getElementOrCoordinates(config.line2),
          this.getElementOrCoordinates(config.end2),
          config.angle,
          priority
        );
        
      case 'collinear':
        const points = [];
        if (Array.isArray(config.points)) {
          for (const pointId of config.points) {
            const point = this.getElementOrCoordinates(pointId);
            if (point) {
              points.push(point);
            }
          }
        }
        return new Collinear(points, priority);
        
      default:
        throw new Error(`Unknown constraint type: ${type}`);
    }
  }

  /**
   * Load text content for the proof
   * @returns {Promise<void>}
   */
  async loadText() {
    try {
      // Get the text containers
      const originalTextContainer = document.getElementById('original-text');
      const updatedTextContainer = document.getElementById('updated-text');
      
      if (!originalTextContainer || !updatedTextContainer) {
        console.warn('Text containers not found');
        return;
      }
      
      // Load the text content
      const originalText = await this.loadTextContent('original');
      const updatedText = await this.loadTextContent('updated');
      
      // Set the text content
      if (originalText) {
        originalTextContainer.innerHTML = originalText;
      }
      
      if (updatedText) {
        updatedTextContainer.innerHTML = updatedText;
      }
      
      // Set up bidirectional highlighting
      this.setupHighlighting();
      
      this.emit('text-loaded');
    } catch (error) {
      console.error('Error loading text content:', error);
      this.emit('text-load-error', error);
    }
  }

  /**
   * Load text content from a file
   * @param {string} type - The type of text ('original' or 'updated')
   * @returns {Promise<string>} - The text content
   */
  async loadTextContent(type) {
    try {
      const response = await fetch(`data/corollary-ii-${type}.html`);
      
      if (!response.ok) {
        throw new Error(`Failed to load ${type} text: ${response.statusText}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error(`Error loading ${type} text:`, error);
      
      // Return default text if the file doesn't exist
      return this.getDefaultText(type);
    }
  }

  /**
   * Get default text content
   * @param {string} type - The type of text ('original' or 'updated')
   * @returns {string} - The default text content
   */
  getDefaultText(type) {
    if (type === 'original') {
      return `
        <h3>COROLLARY II.</h3>
        <p class="italics">And hence is explained the composition of any one direct force <span class="AD">AD</span>, out of any two oblique forces <span class="AC">AC</span> and <span class="CD">CD</span>; and, on the contrary, the resolution of any one direct force <span class="AD">AD</span> into two oblique forces <span class="AC">AC</span> and <span class="CD">CD</span> : which composition and resolution are abundantly confirmed from, mechanics.</p>
      `;
    } else {
      return `
        <p>This is how two forces <span class="AC">AC</span> and <span class="CD">CD</span> may be composed into one force <span class="AD">AD</span>, or one force decomposed into two forces.</p>
      `;
    }
  }

  /**
   * Set up bidirectional highlighting
   */
  setupHighlighting() {
    // Find all spans with class attributes
    const spans = document.querySelectorAll('span[class]');
    
    for (const span of spans) {
      const classes = Array.from(span.classList);
      
      for (const className of classes) {
        // Find the corresponding element
        const element = this.registry.getElementById(className);
        
        if (element) {
          // Register the span for highlighting
          this.registry.registerHighlightable(className, span);
          
          // Add mouse events to the span
          span.addEventListener('mouseover', () => {
            element.setHighlighted(true);
          });
          
          span.addEventListener('mouseout', () => {
            element.setHighlighted(false);
          });
        }
      }
    }
  }
}

// Default export
export default CorollaryII;
