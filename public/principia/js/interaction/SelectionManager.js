/**
 * SelectionManager - Manages element selection
 */
import { EventEmitter } from '../core/EventEmitter.js';

export class SelectionManager extends EventEmitter {
  /**
   * Create a new selection manager
   * @param {Object} registry - Element registry
   */
  constructor(registry) {
    super();
    
    this.registry = registry;
    
    // Currently selected elements
    this._selectedElements = new Set();
    
    // Selection mode
    this._multiSelect = false;
  }

  /**
   * Select an element
   * @param {Object} element - The element to select
   * @param {boolean} [addToSelection=false] - Whether to add to the current selection
   * @returns {SelectionManager} - This manager for chaining
   */
  select(element, addToSelection = false) {
    if (!element) {
      return this;
    }
    
    // If not multi-select and not adding to selection, clear current selection
    if (!this._multiSelect && !addToSelection) {
      this.clearSelection();
    }
    
    // Add to selection
    if (!this._selectedElements.has(element.id)) {
      this._selectedElements.add(element.id);
      
      // Emit selection changed event
      this.emit('selection-changed', {
        type: 'select',
        element
      });
    }
    
    return this;
  }

  /**
   * Deselect an element
   * @param {Object} element - The element to deselect
   * @returns {SelectionManager} - This manager for chaining
   */
  deselect(element) {
    if (!element) {
      return this;
    }
    
    // Remove from selection
    if (this._selectedElements.has(element.id)) {
      this._selectedElements.delete(element.id);
      
      // Emit selection changed event
      this.emit('selection-changed', {
        type: 'deselect',
        element
      });
    }
    
    return this;
  }

  /**
   * Toggle selection of an element
   * @param {Object} element - The element to toggle
   * @returns {SelectionManager} - This manager for chaining
   */
  toggleSelection(element) {
    if (!element) {
      return this;
    }
    
    if (this.isSelected(element)) {
      this.deselect(element);
    } else {
      this.select(element, this._multiSelect);
    }
    
    return this;
  }

  /**
   * Clear the current selection
   * @returns {SelectionManager} - This manager for chaining
   */
  clearSelection() {
    if (this._selectedElements.size === 0) {
      return this;
    }
    
    // Get selected elements
    const selectedElements = this.getSelectedElements();
    
    // Clear selection
    this._selectedElements.clear();
    
    // Emit selection changed event
    this.emit('selection-changed', {
      type: 'clear',
      elements: selectedElements
    });
    
    return this;
  }

  /**
   * Select multiple elements
   * @param {Array} elements - The elements to select
   * @param {boolean} [clearFirst=true] - Whether to clear the current selection first
   * @returns {SelectionManager} - This manager for chaining
   */
  selectMultiple(elements, clearFirst = true) {
    if (!elements || elements.length === 0) {
      return this;
    }
    
    // Clear current selection if needed
    if (clearFirst) {
      this.clearSelection();
    }
    
    // Add elements to selection
    for (const element of elements) {
      if (element && !this._selectedElements.has(element.id)) {
        this._selectedElements.add(element.id);
      }
    }
    
    // Emit selection changed event
    this.emit('selection-changed', {
      type: 'select-multiple',
      elements
    });
    
    return this;
  }

  /**
   * Deselect multiple elements
   * @param {Array} elements - The elements to deselect
   * @returns {SelectionManager} - This manager for chaining
   */
  deselectMultiple(elements) {
    if (!elements || elements.length === 0) {
      return this;
    }
    
    // Remove elements from selection
    const deselected = [];
    
    for (const element of elements) {
      if (element && this._selectedElements.has(element.id)) {
        this._selectedElements.delete(element.id);
        deselected.push(element);
      }
    }
    
    if (deselected.length > 0) {
      // Emit selection changed event
      this.emit('selection-changed', {
        type: 'deselect-multiple',
        elements: deselected
      });
    }
    
    return this;
  }

  /**
   * Select all elements
   * @returns {SelectionManager} - This manager for chaining
   */
  selectAll() {
    // Get all elements
    const elements = this.registry.getAllElements();
    
    // Select all elements
    return this.selectMultiple(elements);
  }

  /**
   * Select elements by type
   * @param {string} type - The element type
   * @param {boolean} [clearFirst=true] - Whether to clear the current selection first
   * @returns {SelectionManager} - This manager for chaining
   */
  selectByType(type, clearFirst = true) {
    // Get elements of the specified type
    const elements = this.registry.getElementsByType(type);
    
    // Select elements
    return this.selectMultiple(elements, clearFirst);
  }

  /**
   * Check if an element is selected
   * @param {Object} element - The element to check
   * @returns {boolean} - Whether the element is selected
   */
  isSelected(element) {
    return element && this._selectedElements.has(element.id);
  }

  /**
   * Get all selected elements
   * @returns {Array} - Array of selected elements
   */
  getSelectedElements() {
    const elements = [];
    
    for (const id of this._selectedElements) {
      const element = this.registry.getElementById(id);
      
      if (element) {
        elements.push(element);
      }
    }
    
    return elements;
  }

  /**
   * Get the number of selected elements
   * @returns {number} - The number of selected elements
   */
  getSelectionCount() {
    return this._selectedElements.size;
  }

  /**
   * Check if any elements are selected
   * @returns {boolean} - Whether any elements are selected
   */
  hasSelection() {
    return this._selectedElements.size > 0;
  }

  /**
   * Get the first selected element
   * @returns {Object|null} - The first selected element or null
   */
  getFirstSelected() {
    if (this._selectedElements.size === 0) {
      return null;
    }
    
    const id = Array.from(this._selectedElements)[0];
    return this.registry.getElementById(id);
  }

  /**
   * Enable multi-select mode
   * @returns {SelectionManager} - This manager for chaining
   */
  enableMultiSelect() {
    this._multiSelect = true;
    return this;
  }

  /**
   * Disable multi-select mode
   * @returns {SelectionManager} - This manager for chaining
   */
  disableMultiSelect() {
    this._multiSelect = false;
    return this;
  }

  /**
   * Toggle multi-select mode
   * @returns {SelectionManager} - This manager for chaining
   */
  toggleMultiSelect() {
    this._multiSelect = !this._multiSelect;
    return this;
  }

  /**
   * Check if multi-select mode is enabled
   * @returns {boolean} - Whether multi-select mode is enabled
   */
  isMultiSelectEnabled() {
    return this._multiSelect;
  }
}
