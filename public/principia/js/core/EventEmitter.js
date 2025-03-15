/**
 * EventEmitter - A simple event system for managing event subscriptions
 * This allows components to communicate without direct dependencies
 */
export class EventEmitter {
  constructor() {
    this._events = {};
  }

  /**
   * Subscribe to an event
   * @param {string} event - The event name
   * @param {Function} listener - The callback function
   * @returns {Function} - Unsubscribe function
   */
  on(event, listener) {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    
    this._events[event].push(listener);
    
    // Return a function to remove this specific listener
    return () => this.off(event, listener);
  }

  /**
   * Subscribe to an event for a single execution
   * @param {string} event - The event name
   * @param {Function} listener - The callback function
   * @returns {Function} - Unsubscribe function
   */
  once(event, listener) {
    const remove = this.on(event, (...args) => {
      remove();
      listener(...args);
    });
    
    return remove;
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - The event name
   * @param {Function} listener - The callback function to remove
   */
  off(event, listener) {
    if (!this._events[event]) {
      return;
    }
    
    const index = this._events[event].indexOf(listener);
    if (index !== -1) {
      this._events[event].splice(index, 1);
    }
    
    // Clean up empty event arrays
    if (this._events[event].length === 0) {
      delete this._events[event];
    }
  }

  /**
   * Emit an event with data
   * @param {string} event - The event name
   * @param {...any} args - Arguments to pass to listeners
   */
  emit(event, ...args) {
    if (!this._events[event]) {
      return;
    }
    
    // Create a copy of the listeners array to avoid issues if listeners are added/removed during emission
    const listeners = [...this._events[event]];
    
    for (const listener of listeners) {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    }
  }

  /**
   * Remove all event listeners
   * @param {string} [event] - Optional event name to clear only specific event
   */
  removeAllListeners(event) {
    if (event) {
      delete this._events[event];
    } else {
      this._events = {};
    }
  }
}
