/**
 * ProofBase - Base class for all proofs
 * Provides common functionality for loading and managing proofs
 */
import { EventEmitter } from '../core/EventEmitter.js';

export class ProofBase extends EventEmitter {
  /**
   * Create a new proof
   * @param {Object} registry - The element registry
   * @param {Object} config - The proof configuration
   */
  constructor(registry, config = {}) {
    super();
    
    this.registry = registry;
    this.config = config;
    this.id = config.id || 'unknown-proof';
    this.title = config.title || 'Unknown Proof';
    this.description = config.description || '';
    this.elements = {};
    this.constraints = [];
    this.initialized = false;
  }

  /**
   * Set up the proof
   * Creates all elements and constraints
   * @returns {Promise<void>}
   */
  async setup() {
    if (this.initialized) {
      return;
    }
    
    try {
      // Create elements
      await this.createElements();
      
      // Create constraints
      await this.createConstraints();
      
      this.initialized = true;
      this.emit('setup-complete');
    } catch (error) {
      console.error('Error setting up proof:', error);
      this.emit('setup-error', error);
      throw error;
    }
  }

  /**
   * Create elements from configuration
   * @returns {Promise<void>}
   */
  async createElements() {
    const elementConfigs = this.config.elements || {};
    
    // Create elements by type
    for (const type in elementConfigs) {
      const elements = elementConfigs[type];
      
      for (const id in elements) {
        const config = elements[id];
        
        try {
          const element = await this.createElement(type, id, config);
          this.elements[id] = element;
        } catch (error) {
          console.error(`Error creating element ${id} of type ${type}:`, error);
        }
      }
    }
  }

  /**
   * Create a single element
   * @param {string} type - The element type
   * @param {string} id - The element ID
   * @param {Object} config - The element configuration
   * @returns {Promise<Object>} - The created element
   */
  async createElement(type, id, config) {
    switch (type.toLowerCase()) {
      case 'point':
        return this.registry.createPoint(
          id,
          config.x,
          config.y,
          config.properties || {}
        );
        
      case 'line':
        return this.registry.createLine(
          id,
          this.getElementOrCoordinates(config.start),
          this.getElementOrCoordinates(config.end),
          config.properties || {}
        );
        
      case 'circle':
        return this.registry.createCircle(
          id,
          this.getElementOrCoordinates(config.center),
          this.getElementOrCoordinates(config.radiusPoint) || config.radius,
          config.properties || {}
        );
        
      case 'triangle':
        return this.registry.createTriangle(
          id,
          this.getElementOrCoordinates(config.a),
          this.getElementOrCoordinates(config.b),
          this.getElementOrCoordinates(config.c),
          config.properties || {}
        );
        
      case 'plane':
        return this.registry.createPlane(
          id,
          this.getElementOrCoordinates(config.start),
          this.getElementOrCoordinates(config.end),
          config.properties || {}
        );
        
      default:
        throw new Error(`Unknown element type: ${type}`);
    }
  }

  /**
   * Get an element or coordinates
   * @param {string|Object} elementIdOrCoordinates - Element ID or coordinates
   * @returns {Object} - The element or coordinates
   */
  getElementOrCoordinates(elementIdOrCoordinates) {
    if (!elementIdOrCoordinates) {
      return null;
    }
    
    if (typeof elementIdOrCoordinates === 'string') {
      return this.elements[elementIdOrCoordinates] || this.registry.getElementById(elementIdOrCoordinates);
    }
    
    if (typeof elementIdOrCoordinates === 'object' && 'x' in elementIdOrCoordinates && 'y' in elementIdOrCoordinates) {
      return elementIdOrCoordinates;
    }
    
    return null;
  }

  /**
   * Create constraints from configuration
   * @returns {Promise<void>}
   */
  async createConstraints() {
    const constraintConfigs = this.config.constraints || [];
    
    for (const config of constraintConfigs) {
      try {
        const constraint = await this.createConstraint(config);
        this.constraints.push(constraint);
      } catch (error) {
        console.error(`Error creating constraint of type ${config.type}:`, error);
      }
    }
  }

  /**
   * Create a single constraint
   * @param {Object} config - The constraint configuration
   * @returns {Promise<Object>} - The created constraint
   */
  async createConstraint(config) {
    // This method should be implemented by subclasses
    throw new Error('Method not implemented: createConstraint');
  }

  /**
   * Load text content for the proof
   * @returns {Promise<void>}
   */
  async loadText() {
    // This method should be implemented by subclasses
    // It should load and display the text content for the proof
  }

  /**
   * Clean up the proof
   * @returns {Promise<void>}
   */
  async cleanup() {
    // Clean up any resources
    this.elements = {};
    this.constraints = [];
    this.initialized = false;
    
    this.emit('cleanup-complete');
  }
}

// Default export
export default ProofBase;
