const path = require('path');
const { FileWatcher } = require('../watcher');

/**
 * Event types for file changes
 * @enum {string}
 */
const WatchEventType = {
  CREATE: 'create',
  MODIFY: 'modify',
  REMOVE: 'remove',
  ACCESS: 'access',
  OTHER: 'other'
};

/**
 * @typedef {Object} WatchOptions
 * @property {boolean} [recursive=true] - Whether to watch directories recursively
 * @property {string[]} [ignorePaths=[]] - Paths to ignore
 */

/**
 * @typedef {Object} FileWatcherEvent
 * @property {string} path - Absolute path of the file that changed
 * @property {string} eventType - Type of event (create, modify, remove, access, other)
 * @property {string} relativePath - Path relative to the watched directory
 */

/**
 * High-performance file watcher using a Rust native module
 */
class FileWatcherManager {
  /**
   * Create a new FileWatcherManager
   */
  constructor() {
    this._watcher = new FileWatcher();
    this._eventHandlers = new Map();
    this._watchPathMap = new Map();
  }

  /**
   * Watch a directory or file for changes
   * @param {string} fsPath - Path to watch (file or directory)
   * @param {function(FileWatcherEvent): void} onEvent - Callback for file events 
   * @param {WatchOptions} [options] - Watch options
   * @returns {boolean} - True if the watch was set up successfully
   */
  watch(fsPath, onEvent, options = {}) {
    const absPath = path.resolve(fsPath);
    
    if (this._watchPathMap.has(absPath)) {
      return true; // Already watching this path
    }
    
    // Set defaults for options
    const watchOptions = {
      recursive: options.recursive !== false,
      ignorePaths: options.ignorePaths || []
    };
    
    // Convert ignore paths to absolute paths
    if (watchOptions.ignorePaths.length > 0) {
      watchOptions.ignorePaths = watchOptions.ignorePaths.map(p => 
        path.isAbsolute(p) ? p : path.resolve(p)
      );
    }
    
    try {
      // Create a handler to process events from Rust
      const eventHandler = (event) => {
        // Create an enhanced event object
        const enhancedEvent = {
          path: event.path,
          eventType: event.eventType,
          relativePath: path.relative(absPath, event.path)
        };
        
        // Call the user's event handler
        onEvent(enhancedEvent);
      };
      
      // Store the event handler so we can track watched paths
      this._eventHandlers.set(absPath, eventHandler);
      
      // Start watching with the Rust module
      this._watcher.watchPath(absPath, eventHandler, watchOptions);
      
      // Map the directory to the watch setup
      this._watchPathMap.set(absPath, {
        path: absPath,
        options: watchOptions
      });
      
      return true;
    } catch (error) {
      console.error(`Error watching path ${absPath}:`, error);
      return false;
    }
  }
  
  /**
   * Stop watching a path
   * @param {string} fsPath - Path to stop watching (file or directory)
   * @returns {boolean} - True if the path was being watched and is now unwatched
   */
  unwatch(fsPath) {
    const absPath = path.resolve(fsPath);
    
    if (!this._watchPathMap.has(absPath)) {
      return false;
    }
    
    const result = this._watcher.unwatchPath(absPath);
    
    if (result) {
      this._eventHandlers.delete(absPath);
      this._watchPathMap.delete(absPath);
    }
    
    return result;
  }
  
  /**
   * Get a list of all paths being watched
   * @returns {string[]} - Array of watched paths
   */
  getWatchedPaths() {
    return Array.from(this._watchPathMap.keys());
  }
  
  /**
   * Check if a path is being watched
   * @param {string} fsPath - Path to check (file or directory)
   * @returns {boolean} - True if the path is being watched
   */
  isWatching(fsPath) {
    const absPath = path.resolve(fsPath);
    return this._watchPathMap.has(absPath);
  }
  
  /**
   * Stop watching all paths
   * @returns {boolean} - True if at least one path was unwatched
   */
  unwatchAll() {
    const result = this._watcher.unwatchAll();
    
    if (result) {
      this._eventHandlers.clear();
      this._watchPathMap.clear();
    }
    
    return result;
  }
  
  /**
   * Get stats about the current watcher
   * @returns {Object} - Stats object
   */
  getStats() {
    return {
      watchedPaths: this.getWatchedPaths(),
      watchCount: this._watchPathMap.size
    };
  }
}

module.exports = {
  FileWatcherManager,
  WatchEventType
}; 