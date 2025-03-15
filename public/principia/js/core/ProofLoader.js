/**
 * ProofLoader - Responsible for loading proof configurations
 * Dynamically imports proof modules and initializes them
 */
import { EventEmitter } from './EventEmitter.js';

export class ProofLoader extends EventEmitter {
  constructor(registry) {
    super();
    this.registry = registry;
    this.currentProof = null;
    this.proofCache = new Map();
  }

  /**
   * Load a proof by its ID
   * @param {string} proofId - The ID of the proof to load
   * @returns {Promise<Object>} - The loaded proof
   */
  async load(proofId) {
    try {
      // Emit loading event
      this.emit('proof-loading', proofId);
      
      // Clear existing elements
      if (this.currentProof) {
        await this.unloadCurrentProof();
      }
      
      // Check cache first
      if (this.proofCache.has(proofId)) {
        this.currentProof = this.proofCache.get(proofId);
        await this.initializeProof(this.currentProof);
        return this.currentProof;
      }
      
      // Load proof configuration
      const proofConfig = await this.loadProofConfig(proofId);
      
      // Import the proof class
      const proofModule = await this.importProofModule(proofId);
      
      // Create proof instance
      const ProofClass = proofModule.default || proofModule[this.getProofClassName(proofId)];
      
      if (!ProofClass) {
        throw new Error(`Could not find proof class for ${proofId}`);
      }
      
      // Instantiate the proof
      const proof = new ProofClass(this.registry, proofConfig);
      
      // Cache the proof
      this.proofCache.set(proofId, proof);
      this.currentProof = proof;
      
      // Initialize the proof
      await this.initializeProof(proof);
      
      // Emit loaded event
      this.emit('proof-loaded', proof);
      
      return proof;
    } catch (error) {
      this.emit('proof-load-error', { proofId, error });
      throw error;
    }
  }

  /**
   * Unload the current proof
   * @returns {Promise<void>}
   */
  async unloadCurrentProof() {
    if (!this.currentProof) {
      return;
    }
    
    try {
      // Call cleanup method if it exists
      if (typeof this.currentProof.cleanup === 'function') {
        await this.currentProof.cleanup();
      }
      
      // Clear registry
      this.registry.clear();
      
      // Emit unloaded event
      this.emit('proof-unloaded', this.currentProof.id);
      
      this.currentProof = null;
    } catch (error) {
      console.error('Error unloading proof:', error);
      this.emit('proof-unload-error', error);
    }
  }

  /**
   * Initialize a proof
   * @param {Object} proof - The proof to initialize
   * @returns {Promise<void>}
   */
  async initializeProof(proof) {
    // Call setup method
    if (typeof proof.setup === 'function') {
      await proof.setup();
    }
    
    // Load text content
    if (typeof proof.loadText === 'function') {
      await proof.loadText();
    }
  }

  /**
   * Load proof configuration from data file
   * @param {string} proofId - The ID of the proof
   * @returns {Promise<Object>} - The proof configuration
   */
  async loadProofConfig(proofId) {
    try {
      const response = await fetch(`data/${proofId}.json`);
      
      if (!response.ok) {
        throw new Error(`Failed to load proof config: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error loading proof config for ${proofId}:`, error);
      
      // Return a minimal default config if the file doesn't exist
      return {
        id: proofId,
        title: this.formatProofId(proofId),
        elements: {},
        constraints: []
      };
    }
  }

  /**
   * Import the proof module
   * @param {string} proofId - The ID of the proof
   * @returns {Promise<Object>} - The imported module
   */
  async importProofModule(proofId) {
    try {
      // Convert kebab-case to PascalCase for the class name
      const className = this.getProofClassName(proofId);
      
      // Try to import the module
      return await import(`../proofs/${className}.js`);
    } catch (error) {
      console.error(`Error importing proof module for ${proofId}:`, error);
      
      // Try to import a base proof as fallback
      return await import('../proofs/ProofBase.js');
    }
  }

  /**
   * Convert proof ID to class name (kebab-case to PascalCase)
   * @param {string} proofId - The proof ID in kebab-case
   * @returns {string} - The class name in PascalCase
   */
  getProofClassName(proofId) {
    return proofId
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }

  /**
   * Format proof ID for display (kebab-case to Title Case)
   * @param {string} proofId - The proof ID in kebab-case
   * @returns {string} - The formatted title
   */
  formatProofId(proofId) {
    return proofId
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  /**
   * Get a list of available proofs
   * @returns {Promise<Array>} - Array of proof metadata
   */
  async getAvailableProofs() {
    try {
      const response = await fetch('data/proofs.json');
      
      if (!response.ok) {
        throw new Error(`Failed to load proofs list: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error loading available proofs:', error);
      
      // Return a default list with just Corollary II
      return [
        {
          id: 'corollary-ii',
          title: 'Corollary II',
          description: 'Composition and resolution of forces'
        }
      ];
    }
  }
}
