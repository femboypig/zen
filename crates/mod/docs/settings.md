# Settings Module

The Settings module manages application settings with platform-specific storage paths, defaults, and automatic watching for external changes.

## Overview

This module provides a complete settings management system for the Zen Editor with the following features:

- Platform-specific settings file locations
- Default settings values
- Min/max constraints for specific settings (e.g., font size)
- File system watching to detect external changes
- JSON file with comments support
- Event emission on settings changes

## Class: Settings

Extends the Node.js EventEmitter class to provide events when settings change.

### Constructor

```javascript
const settings = new Settings();
```

Initializes the settings module by:
1. Determining the platform-specific settings file path
2. Ensuring the settings directory exists
3. Loading existing settings or creating defaults
4. Setting up a file watcher for external changes

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `MIN_FONT_SIZE` | Number | Minimum allowed font size (6) |
| `MAX_FONT_SIZE` | Number | Maximum allowed font size (32) |
| `settings` | Object | The current settings values |
| `defaults` | Object | Default values for settings |

### Methods

#### `get(key, defaultValue = null)`

Gets a setting value by key.

**Parameters:**
- `key` (String): Setting key
- `defaultValue` (Any, optional): Default value if setting is not found

**Returns:** The setting value or defaultValue

**Example:**
```javascript
const fontSize = settings.get('ui_font_size', 16);
```

#### `set(key, value)`

Sets a setting value.

**Parameters:**
- `key` (String): Setting key
- `value` (Any): Setting value

**Example:**
```javascript
settings.set('ui_font_size', 18);
```

#### `reset(key)`

Resets a specific setting to its default value.

**Parameters:**
- `key` (String): Setting key to reset

**Example:**
```javascript
settings.reset('ui_font_size');
```

#### `resetAll()`

Resets all settings to their default values.

**Example:**
```javascript
settings.resetAll();
```

### Events

The Settings class extends EventEmitter and emits the following events:

#### `change`

Emitted when settings change, either through the API or when the settings file is modified externally.

**Event Data:**
- `newSettings` (Object): The current settings after the change
- `oldSettings` (Object): The settings before the change

**Example:**
```javascript
settings.on('change', (newSettings, oldSettings) => {
  if (newSettings.ui_font_size !== oldSettings.ui_font_size) {
    console.log('Font size changed to', newSettings.ui_font_size);
  }
});
```

## Settings Storage

Settings are stored in JSON format in platform-specific locations:

- Linux: `~/.local/share/zeneditor/settings.json`
- macOS: `~/Library/Application Support/zeneditor/settings.json`
- Windows: `%APPDATA%\zeneditor\settings.json`
- Other: `~/.zeneditor/settings.json`

The settings file supports comments, making it more user-friendly for manual editing.

### Example Settings File

```json
/* Zen Editor Settings
 * This file is automatically created and updated by the application.
 * You can edit it manually, but be careful with JSON formatting.
 * Comments are supported but must be outside of JSON values.
 */

{
  /* UI font size in pixels (Min: 6, Max: 32) */
  "ui_font_size": 16
}
``` 