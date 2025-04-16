# File Watcher

High-performance module for tracking changes in files and directories, using a Rust backend.

## Features

- Real-time file and directory change monitoring
- Low resource consumption thanks to the native Rust module
- Recursive monitoring support
- Path filtering and ignoring
- Robust event handling (create, modify, delete, access)
- Support for simultaneous monitoring of multiple paths

## Installation

```bash
# No dependency installation required, the module is already integrated into the project
```

## API

### FileWatcherManager

The main class for interacting with the file watcher.

```javascript
const { FileWatcherManager, WatchEventType } = require('../mod/file_watcher');
const watcher = new FileWatcherManager();
```

#### Methods

##### watch(fsPath, onEvent, options)

Starts monitoring changes to a file or directory.

```javascript
/**
 * @param {string} fsPath - Path to the file or directory to watch
 * @param {function} onEvent - Callback function for event processing
 * @param {Object} options - Monitoring options
 * @param {boolean} [options.recursive=true] - Recursively monitor subdirectories
 * @param {string[]} [options.ignorePaths=[]] - Paths to ignore
 * @returns {boolean} - true if monitoring was successfully established
 */
```

##### unwatch(fsPath)

Stops monitoring the specified path.

```javascript
/**
 * @param {string} fsPath - Path to the file or directory to stop watching
 * @returns {boolean} - true if monitoring was successfully stopped
 */
```

##### unwatchAll()

Stops monitoring all tracked paths.

```javascript
/**
 * @returns {boolean} - true if there was at least one active watch
 */
```

##### getWatchedPaths()

Returns a list of all monitored paths.

```javascript
/**
 * @returns {string[]} - Array of watched paths
 */
```

##### isWatching(fsPath)

Checks if the specified path is being monitored.

```javascript
/**
 * @param {string} fsPath - Path to check
 * @returns {boolean} - true if the path is being monitored
 */
```

##### getStats()

Returns monitoring statistics.

```javascript
/**
 * @returns {Object} - Statistics object
 * @returns {string[]} - watchedPaths - List of watched paths
 * @returns {number} - watchCount - Number of watched paths
 */
```

### WatchEventType

Constants for file change event types.

```javascript
const WatchEventType = {
  CREATE: 'create',   // File creation
  MODIFY: 'modify',   // File modification
  REMOVE: 'remove',   // File deletion
  ACCESS: 'access',   // File access
  OTHER: 'other'      // Other event types
};
```

### Events

When a file changes, the callback function is called with an event object:

```javascript
/**
 * @typedef {Object} FileWatcherEvent
 * @property {string} path - Absolute path to the changed file
 * @property {string} eventType - Event type (create, modify, remove, access, other)
 * @property {string} relativePath - Path relative to the watched directory
 */
```

## Usage Examples

### Watching a Directory

```javascript
const { FileWatcherManager } = require('../mod/file_watcher');
const watcher = new FileWatcherManager();

// Start monitoring a directory with recursive traversal
watcher.watch('/path/to/project', (event) => {
  console.log(`File ${event.path} was ${event.eventType}`);
  console.log(`Relative path: ${event.relativePath}`);
});
```

### Watching a Single File

```javascript
const { FileWatcherManager } = require('../mod/file_watcher');
const watcher = new FileWatcherManager();

// Start monitoring a specific file
watcher.watch('/path/to/important_config.json', (event) => {
  console.log(`Configuration changed: ${event.eventType}`);
  // Reload configuration if needed
});
```

### Ignoring Paths

```javascript
const { FileWatcherManager } = require('../mod/file_watcher');
const watcher = new FileWatcherManager();

// Monitoring with ignoring certain paths
watcher.watch('/path/to/project', (event) => {
  console.log(`File changed: ${event.relativePath}`);
}, {
  recursive: true,
  ignorePaths: [
    '/path/to/project/node_modules',
    '/path/to/project/.git',
    '/path/to/project/dist'
  ]
});
```

### Managing Monitoring

```javascript
const { FileWatcherManager } = require('../mod/file_watcher');
const watcher = new FileWatcherManager();

// Start monitoring
watcher.watch('/path/to/project', handleFileChange);

// Check watched paths
const paths = watcher.getWatchedPaths();
console.log('Watched paths:', paths);

// Check if a specific path is being watched
if (watcher.isWatching('/path/to/project')) {
  console.log('Path is being watched');
}

// Stop watching a specific path
watcher.unwatch('/path/to/project');

// Stop watching all paths
watcher.unwatchAll();
```

## Technical Information

The module uses the native Rust library `notify` through Node.js N-API, which provides high performance and low resource consumption. It is optimized for fast tracking of file system changes.

## Notes

- When working with large directories, it is recommended to use the `ignorePaths` option to exclude unnecessary files/directories
- When monitoring very active directories with many changes, be aware of possible event processing delays 