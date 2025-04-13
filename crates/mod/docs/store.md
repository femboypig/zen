# Store Module

The Store module provides lightweight, on-demand key-value storage for the Zen Editor application.

## Overview

This module offers a simple persistent storage solution with the following features:

- Platform-specific storage locations
- Lazy loading of data (only when needed)
- Simple key-value interface
- Automatic JSON serialization/deserialization
- Minimized memory usage through on-demand loading

## Class: Store

### Constructor

```javascript
const store = require('./store');
```

The module exports a singleton instance, so there's no need to create a new instance.

### Methods

#### `get(key, defaultValue = null)`

Gets a value from the store, loading data from disk only when needed.

**Parameters:**
- `key` (String): The key to get
- `defaultValue` (Any, optional): Default value if key doesn't exist

**Returns:** The stored value or defaultValue if the key doesn't exist

**Example:**
```javascript
const lastOpenPath = store.get('lastOpenPath', '/home/user/documents');
```

#### `set(key, value)`

Sets a value in the store, saving to disk immediately.

**Parameters:**
- `key` (String): The key to set
- `value` (Any): The value to store (must be JSON serializable)

**Returns:** Boolean indicating success or failure

**Example:**
```javascript
store.set('theme', 'dark');
```

#### `remove(key)`

Removes a key from the store.

**Parameters:**
- `key` (String): The key to remove

**Returns:** Boolean indicating success or failure

**Example:**
```javascript
store.remove('temporaryData');
```

#### `has(key)`

Checks if a key exists in the store.

**Parameters:**
- `key` (String): The key to check

**Returns:** Boolean indicating whether the key exists

**Example:**
```javascript
if (store.has('userPreferences')) {
  // Use existing preferences
}
```

## Data Storage

Store data is saved in a JSON file at platform-specific locations (in the same directory as settings.json):

- Linux: `~/.local/share/zeneditor/store.json`
- macOS: `~/Library/Application Support/zeneditor/store.json`
- Windows: `%APPDATA%\zeneditor\store.json`
- Other: `~/.zeneditor/store.json`

## Performance Considerations

The Store module is designed to minimize memory usage by loading data from disk only when needed. This makes it ideal for storing:

- User preferences
- Recently used items
- UI state
- Any non-critical application state

However, for frequently accessed data, consider caching the values after retrieval to avoid disk I/O operations.

## Example Usage

```javascript
const store = require('./store');

// Save user preferences
store.set('windowPosition', { x: 100, y: 200, width: 800, height: 600 });

// Check if we have a theme preference
const hasTheme = store.has('theme');

// Get theme with a default
const theme = store.get('theme', 'light');

// Remove temporary data
store.remove('tempData');
``` 