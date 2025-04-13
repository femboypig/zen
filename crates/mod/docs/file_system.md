# File System Module

The File System module provides utilities for working with the file system in the Zen Editor application.

## Overview

This module wraps a Rust-based file system implementation for improved performance and provides:

- Project directory opening and navigation
- File tree generation and caching
- File and directory content reading
- File system change watching
- Integration with the Rust-based file system module

## API Reference

### Project Operations

#### `openProject(projectPath)`

Opens a project directory and returns its file tree.

**Parameters:**
- `projectPath` (String): Path to the project directory

**Returns:** Object
  - `path` (String): Project path
  - `fileTree` (Object): Hierarchical representation of the project directory

**Example:**
```javascript
const fs = require('./file_system');
const project = fs.openProject('/path/to/project');
console.log('Project opened at:', project.path);
```

#### `watchProject(projectPath, callback)`

Watches a project directory for file system changes.

**Parameters:**
- `projectPath` (String): Path to the project directory
- `callback` (Function): Callback function receiving file system events

**Example:**
```javascript
fs.watchProject('/path/to/project', (event) => {
  console.log('File changed:', event.path);
  console.log('Change type:', event.kind); // 'create', 'modify', 'delete', etc.
});
```

#### `stopWatching(projectPath)`

Stops watching a project for file system changes.

**Parameters:**
- `projectPath` (String): Path to the project to stop watching

**Returns:** Boolean - True if stopped successfully, false if not watching

**Example:**
```javascript
fs.stopWatching('/path/to/project');
```

### File and Directory Operations

#### `getDirectoryContents(dirPath)`

Gets the contents of a directory.

**Parameters:**
- `dirPath` (String): Path to the directory

**Returns:** Array of file entries

**Example:**
```javascript
const files = fs.getDirectoryContents('/path/to/directory');
files.forEach(file => {
  console.log(`${file.name} - ${file.type}`);
});
```

#### `expandDirectory(dirPath)`

Expands a directory to get its contents, similar to `getDirectoryContents` but with a focus on UI tree expansion.

**Parameters:**
- `dirPath` (String): Path to the directory to expand

**Returns:** Array of file entries in the directory

**Example:**
```javascript
const files = fs.expandDirectory('/path/to/directory');
```

#### `readFileContents(filePath)`

Reads the contents of a file.

**Parameters:**
- `filePath` (String): Path to the file

**Returns:** String - File contents

**Example:**
```javascript
const content = fs.readFileContents('/path/to/file.js');
console.log(content);
```

### Cache Management

#### `getCachedFileTree()`

Gets the cached file tree if available.

**Returns:** Object|null - Cached file tree or null if not available

**Example:**
```javascript
const cachedTree = fs.getCachedFileTree();
if (cachedTree) {
  // Use cached tree
} else {
  // Need to regenerate tree
}
```

#### `getCachedProjectPath()`

Gets the cached project path if available.

**Returns:** String|null - Cached project path or null if not available

**Example:**
```javascript
const cachedPath = fs.getCachedProjectPath();
```

#### `clearCache()`

Clears the file tree and project path cache.

**Example:**
```javascript
fs.clearCache();
```

### Change Event Handling

#### `setFileChangeCallback(callback)`

Sets a callback for file system changes.

**Parameters:**
- `callback` (Function): Function to call when files change

**Example:**
```javascript
fs.setFileChangeCallback((event) => {
  console.log(`File ${event.path} changed with event ${event.kind}`);
});
```

## Integration with Rust

This module uses a Rust-based file system implementation for better performance:

```javascript
const fsModule = require('../fs');
```

The Rust module provides optimized implementations for:
- Directory traversal and file tree generation
- File reading and writing
- File system watching

## Example Usage

```javascript
const fs = require('./file_system');

// Open a project and get its file tree
const project = fs.openProject('/path/to/project');

// Set up file watching
fs.watchProject(project.path, (event) => {
  if (event.kind === 'create') {
    console.log(`New file created: ${event.path}`);
  } else if (event.kind === 'delete') {
    console.log(`File deleted: ${event.path}`);
  } else if (event.kind === 'modify') {
    console.log(`File modified: ${event.path}`);
  }
  
  // Clear cache to ensure fresh data
  fs.clearCache();
});

// Read file contents
const content = fs.readFileContents('/path/to/project/src/main.js');

// Get directory contents
const srcFiles = fs.getDirectoryContents('/path/to/project/src');

// When done with the project
fs.stopWatching(project.path);
``` 